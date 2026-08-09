
import Pusher from 'pusher-js';
import { ChatMessage } from '../types';

type MessageCallback = (message: ChatMessage) => void;
type StatusCallback = (isConnected: boolean, error?: boolean, details?: string) => void;

const getRoleFromIdentity = (identity: any): ChatMessage['role'] => {
  if (!identity || !identity.badges) return 'user';
  const badges = identity.badges;
  if (badges.some((b: any) => b.type === 'broadcaster')) return 'owner';
  if (badges.some((b: any) => b.type === 'moderator')) return 'moderator';
  if (badges.some((b: any) => b.type === 'founder')) return 'founder';
  if (badges.some((b: any) => b.type === 'vip')) return 'vip';
  if (badges.some((b: any) => b.type === 'sub_gifter')) return 'gifter';
  if (badges.some((b: any) => b.type === 'subscriber')) return 'subscriber';
  return 'user';
};

const mapBadges = (identity: any): ChatMessage['badges'] => {
  if (!identity || !Array.isArray(identity.badges)) return [];
  return identity.badges
    .map((b: any) => ({ type: b.type, text: b.text }))
    .filter((b: any) => typeof b.type === 'string' && b.type.length > 0);
};

class ChatService {
  private isConnected: boolean = false;
  private listeners: MessageCallback[] = [];
  private deleteListeners: ((id: string) => void)[] = [];
  private statusListeners: StatusCallback[] = [];
  private pusher: any = null;
  private channel: any = null;
  private avatarCache: Record<string, string> = {};
  private pendingAvatarFetches: Record<string, Promise<string>> = {};
  private currentChatroomId: number | null = null;
  private currentChannelSlug: string | null = null;

  // Kick Bot Tokens
  private KICK_BOT_ACCESS_TOKEN = "MTU4YJK4N2UTMDE1YI0ZYZY2LTHHYJYTNDQ2YJJMMWMZNJZH";
  private KICK_BOT_REFRESH_TOKEN = "MDY0MJQ4MZCTZJE3OS01OTQWLWFMZTATZMU5YJNHMGE4NZC1";

  private KNOWN_CHATROOM_IDS: Record<string, number> = {
    'xeid': 47582,
  };

  // Auto-reconnect state
  private connectionId = 0;
  private isConnecting = false;
  private shouldAutoReconnect = true;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 9999;
  private reconnectBaseDelay = 1500;
  private reconnectTimer: any = null;
  private healthCheckTimer: any = null;
  private connectionTimeoutTimer: any = null;
  private lastMessageTime: number = 0;

  async getChatroomId(channelSlug: string): Promise<number | null> {
    const slug = channelSlug.toLowerCase().trim();

    if (this.KNOWN_CHATROOM_IDS[slug]) {
      return this.KNOWN_CHATROOM_IDS[slug];
    }

    const cachedId = localStorage.getItem(`kick_chatroom_id_${slug}`);
    if (cachedId) {
      console.log(`[ChatService] Using cached ID for ${slug}: ${cachedId}`);
      return parseInt(cachedId);
    }

    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://kick.com/api/v2/channels/${slug}`)}`,
      `https://corsproxy.io/?${encodeURIComponent(`https://kick.com/api/v2/channels/${slug}`)}`,
      `https://proxy.cors.sh/https://kick.com/api/v2/channels/${slug}`,
      `https://api.codetabs.com/v1/proxy/quest=${encodeURIComponent(`https://kick.com/api/v2/channels/${slug}`)}`,
      `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(`https://kick.com/api/v2/channels/${slug}`)}`
    ];

    const results = await Promise.allSettled(
      proxies.map(url => this.fetchWithTimeout(url, 5000))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled' && result.value.ok) {
        try {
          const rawData = await result.value.json();
          const data = this.parseProxyResponse(proxies[i], rawData);
          let foundId = null;
          if (data?.chatroom?.id) foundId = data.chatroom.id;
          else if (data?.id) foundId = data.id;

          if (foundId) {
            console.log(`[ChatService] ✅ Found ID: ${foundId} via ${proxies[i].substring(0, 50)}`);
            localStorage.setItem(`kick_chatroom_id_${slug}`, foundId.toString());
            return foundId;
          }
        } catch (e) {
          console.warn(`[ChatService] Parse error for ${proxies[i]}`);
        }
      }
    }

    return null;
  }

  private async fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      return response;
    } catch (e) {
      return new Response(null, { status: 0, statusText: 'timeout_or_error' });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseProxyResponse(proxyUrl: string, rawData: any): any {
    if (proxyUrl.includes('allorigins')) {
      try { return JSON.parse(rawData.contents || '{}'); } catch (e) { return rawData; }
    }
    if (proxyUrl.includes('thingproxy')) {
      return rawData;
    }
    return rawData;
  }

  async connect(channelSlug: string = 'iabs'): Promise<void> {
    const slug = channelSlug.toLowerCase().trim();
    
    // If stuck in connecting state for too long, force reset
    if (this.isConnecting) {
      console.log('[ChatService] Connection already in progress, force resetting...');
      this.isConnecting = false;
    }

    if (this.isConnected && this.currentChannelSlug === slug && this.pusher) {
      const state = this.pusher.connection?.state;
      if (state === 'connected') {
        console.log('[ChatService] Already connected to', slug);
        return;
      }
      // Pusher says not connected but we think we are - force reconnect
      console.log('[ChatService] Pusher state mismatch:', state, '- force reconnecting...');
      this.isConnected = false;
    }

    this.isConnecting = true;
    this.currentChannelSlug = slug;
    this.shouldAutoReconnect = true;
    const myConnectionId = ++this.connectionId;

    // Safety timeout: if connection doesn't complete in 15 seconds, reset isConnecting
    if (this.connectionTimeoutTimer) clearTimeout(this.connectionTimeoutTimer);
    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.isConnecting && myConnectionId === this.connectionId) {
        console.warn('[ChatService] Connection timeout - resetting state');
        this.isConnecting = false;
        if (this.shouldAutoReconnect) {
          this.scheduleReconnect(slug);
        }
      }
    }, 15000);

    this.notifyStatus(false, false, `جاري الاتصال بـ ${slug}...`);

    try {
      let chatroomId = await this.getChatroomId(slug);
      if (myConnectionId !== this.connectionId) return;

      if (!chatroomId) {
        throw new Error(`لم يتم العثور على القناة: ${slug}`);
      }

      this.currentChatroomId = chatroomId;
      console.log(`[ChatService] Connecting to Chatroom: ${chatroomId}`);

      this.cleanupPusher();

      const PusherClient = (Pusher as any).default || Pusher;
      this.pusher = new PusherClient('32cbd69e4b950bf97679', {
        cluster: 'us2',
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        statsTimeout: 0,
        pongTimeout: 30000,
        wsTimeout: 30000,
        maxRetries: 9999,
        loopBackTimer: 2000,
        disabledTransports: ['xhr_polling', 'xhr_streaming']
      });

      this.channel = this.pusher.subscribe(`chatrooms.${chatroomId}.v2`);

      this.channel.bind('App\\Events\\ChatMessageEvent', (data: any) => {
        this.lastMessageTime = Date.now();
        const message: ChatMessage = {
          id: data.id || Math.random().toString(36).substr(2, 9),
          user: {
            id: data.sender?.id || '0',
            username: data.sender?.username || 'Unknown',
            color: data.sender?.identity?.color || '#31d6d6',
            avatar: data.sender?.profile_pic || '',
          },
          content: data.content || '',
          role: getRoleFromIdentity(data.sender?.identity),
          badges: mapBadges(data.sender?.identity),
          timestamp: Date.now()
        };

        this.listeners.forEach(cb => {
          try {
            cb(message);
          } catch (e) {
            console.error("[ChatService] Listener error:", e);
          }
        });
      });

      this.channel.bind('App\\Events\\MessageDeletedEvent', (data: any) => {
        const messageId = data.message?.id;
        if (messageId) {
          this.deleteListeners.forEach(cb => cb(messageId));
        }
      });

      this.pusher.connection.bind('connected', () => {
        if (myConnectionId !== this.connectionId) return;
        console.log("[ChatService] WebSocket Connected!");
        if (this.connectionTimeoutTimer) { clearTimeout(this.connectionTimeoutTimer); this.connectionTimeoutTimer = null; }
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyStatus(true, false, `متصل (ID: ${chatroomId})`);
        this.startHealthCheck(slug);
      });

      this.pusher.connection.bind('error', (err: any) => {
        if (myConnectionId !== this.connectionId) return;
        console.error("[ChatService] Pusher Error:", err);
        if (this.connectionTimeoutTimer) { clearTimeout(this.connectionTimeoutTimer); this.connectionTimeoutTimer = null; }
        this.isConnected = false;
        this.isConnecting = false;
        this.notifyStatus(false, false, "جاري إعادة الاتصال...");
        
        if (this.shouldAutoReconnect) {
          this.scheduleReconnect(slug);
        }
      });

      this.pusher.connection.bind('disconnected', () => {
        if (myConnectionId !== this.connectionId) return;
        console.log("[ChatService] Pusher Disconnected");
        this.isConnected = false;
        this.isConnecting = false;
        this.notifyStatus(false, true, "انقطع الاتصال - جاري إعادة الاتصال...");
        
        if (this.shouldAutoReconnect) {
          this.scheduleReconnect(slug);
        }
      });

      this.pusher.connection.bind('state_change', (states: any) => {
        if (myConnectionId !== this.connectionId) return;
        console.log("[ChatService] Connection State:", states.current);
        
        if (states.current === 'disconnected' || states.current === 'failed') {
          this.isConnected = false;
          this.notifyStatus(false, false, "جاري إعادة الاتصال...");
          if (this.shouldAutoReconnect) {
            this.scheduleReconnect(slug);
          }
        }
      });

    } catch (error: any) {
      if (myConnectionId !== this.connectionId) return;
      console.error("[ChatService] Connection Error:", error);
      if (this.connectionTimeoutTimer) { clearTimeout(this.connectionTimeoutTimer); this.connectionTimeoutTimer = null; }
      this.isConnected = false;
      this.isConnecting = false;
      this.notifyStatus(false, false, "جاري إعادة الاتصال...");
      
      if (this.shouldAutoReconnect) {
        this.scheduleReconnect(slug);
      }
    }
  }

  private scheduleReconnect(slug: string) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectBaseDelay * Math.pow(1.5, Math.min(this.reconnectAttempts - 1, 6)), 15000);
    
    console.log(`[ChatService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.notifyStatus(false, false, `إعادة الاتصال... (${Math.ceil(delay / 1000)}ث)`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(slug);
    }, delay);
  }

  private startHealthCheck(slug: string) {
    this.stopHealthCheck();
    this.lastMessageTime = Date.now();
    this.healthCheckTimer = setInterval(() => {
      if (!this.pusher || !this.isConnected) return;
      
      const state = this.pusher.connection?.state;
      if (state !== 'connected') {
        console.warn(`[ChatService] Health check: state is ${state}, reconnecting...`);
        this.isConnected = false;
        this.notifyStatus(false, false, "جاري إعادة الاتصال...");
        this.cleanupPusher();
        this.connect(slug);
      }
    }, 10000);
  }

  private stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  private cleanupPusher() {
    this.stopHealthCheck();
    if (this.channel) {
      try { this.channel.unbind_all(); } catch (e) {}
      try { this.channel.unsubscribe(); } catch (e) {}
      this.channel = null;
    }
    if (this.pusher) {
      try { this.pusher.unbind_all(); } catch (e) {}
      try { this.pusher.disconnect(); } catch (e) {}
      this.pusher = null;
    }
  }

  onMessage(callback: MessageCallback) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(cb => cb !== callback); };
  }

  onDeleteMessage(callback: (id: string) => void) {
    this.deleteListeners.push(callback);
    return () => { this.deleteListeners = this.deleteListeners.filter(cb => cb !== callback); };
  }

  clearListeners() {
    this.listeners = [];
    this.deleteListeners = [];
  }

  onStatusChange(callback: StatusCallback) {
    this.statusListeners.push(callback);
    // Immediately notify the new listener of current state
    if (this.isConnected) {
      callback(true, false, `متصل (ID: ${this.currentChatroomId})`);
    } else if (this.isConnecting) {
      callback(false, false, 'جاري الاتصال...');
    }
    return () => { this.statusListeners = this.statusListeners.filter(cb => cb !== callback); };
  }

  private notifyStatus(connected: boolean, error: boolean, details: string) {
    this.statusListeners.forEach(cb => cb(connected, error, details));
  }

  async sendMessage(content: string) {
    if (!this.currentChatroomId) {
      console.warn('[ChatService] Cannot send message: not connected to any channel.');
      return false;
    }

    // Try Vite dev proxy first (local development)
    try {
      const response = await fetch(`/kick-api/public/v1/chatrooms/${this.currentChatroomId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.KICK_BOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ content, type: "message" })
      });

      if (response.ok) {
        return true;
      }
    } catch (e) {
      // dev proxy not available
    }

    const proxyFallbacks = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.kick.com/public/v1/chatrooms/${this.currentChatroomId}/messages`)}`,
      `https://corsproxy.io/?${encodeURIComponent(`https://api.kick.com/public/v1/chatrooms/${this.currentChatroomId}/messages`)}`,
      `https://proxy.cors.sh/https://api.kick.com/public/v1/chatrooms/${this.currentChatroomId}/messages`
    ];

    for (const proxyUrl of proxyFallbacks) {
      try {
        const response = await fetch(proxyUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.KICK_BOT_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ content, type: "message" })
        });

        if (response.ok) {
          console.log('[ChatService] Message sent via fallback proxy');
          return true;
        }
      } catch (e) {
        console.warn(`[ChatService] Fallback proxy ${proxyUrl} failed:`, e);
      }
    }

    console.error('[ChatService] Failed to send message via all methods');
    return false;
  }

  async fetchKickAvatar(username: string): Promise<string> {
    const slug = username.toLowerCase().trim().replace('@', '');
    if (this.avatarCache[slug]) return this.avatarCache[slug];
    if (this.pendingAvatarFetches[slug]) return this.pendingAvatarFetches[slug];

    const fetchPromise = (async () => {
      try {
        const proxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://kick.com/api/v1/channels/${slug}`)}&disableCache=true`,
          `https://corsproxy.io/?${encodeURIComponent(`https://kick.com/api/v1/channels/${slug}`)}`,
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://kick.com/api/v1/channels/${slug}`)}`,
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://kick.com/api/v2/channels/${slug}`)}`,
          `https://proxy.cors.sh/https://kick.com/api/v2/channels/${slug}`
        ];

        const results = await Promise.allSettled(
          proxies.map(url => this.fetchWithTimeout(url, 5000))
        );

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.status === 'fulfilled' && result.value.ok) {
            try {
              const rawData = await result.value.json();
              const data = this.parseProxyResponse(proxies[i], rawData);

              const avatar = data.user?.profile_pic ||
                data.user?.profilepic ||
                data.profile_pic ||
                data.user?.avatar?.url ||
                data.user?.avatar ||
                data.avatar_url ||
                (data.chatroom?.sender?.profile_pic) ||
                (data.livestream?.thumbnail?.url) || '';

              if (avatar && avatar.length > 10) {
                let finalAvatar = avatar;
                if (finalAvatar.startsWith('//')) finalAvatar = 'https:' + finalAvatar;
                if (finalAvatar.startsWith('/')) finalAvatar = 'https://kick.com' + finalAvatar;
                finalAvatar = finalAvatar.replace('https://kick.com/', 'https://files.kick.com/');

                this.avatarCache[slug] = finalAvatar;
                return finalAvatar;
              }
            } catch (e) {
              // continue
            }
          }
        }
      } catch (e) {
        console.error(`[ChatService] Error for ${username}`, e);
      } finally {
        delete this.pendingAvatarFetches[slug];
      }
      return '';
    })();

    this.pendingAvatarFetches[slug] = fetchPromise;
    return fetchPromise;
  }

  reconnect() {
    if (this.currentChannelSlug) {
      this.shouldAutoReconnect = true;
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.cleanupPusher();
      this.connect(this.currentChannelSlug);
    }
  }

  disconnect() {
    this.shouldAutoReconnect = false;
    this.stopHealthCheck();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
    this.cleanupPusher();
    this.isConnected = false;
    this.isConnecting = false;
    this.currentChatroomId = null;
    this.currentChannelSlug = null;
  }
}

export const chatService = new ChatService();
