
import Pusher from 'pusher-js';
import { ChatMessage } from '../types';

type MessageCallback = (message: ChatMessage) => void;
type StatusCallback = (isConnected: boolean, error?: boolean, details?: string) => void;

const getRoleFromIdentity = (identity: any): 'owner' | 'moderator' | 'vip' | 'user' => {
  if (!identity || !identity.badges) return 'user';
  const badges = identity.badges;
  if (badges.some((b: any) => b.type === 'broadcaster')) return 'owner';
  if (badges.some((b: any) => b.type === 'moderator')) return 'moderator';
  if (badges.some((b: any) => b.type === 'vip')) return 'vip';
  return 'user';
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

  // Bot Server URLs (multiple for redundancy - if one fails, next is tried)
  private botServerUrls: string[] = [];

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
  private maxReconnectAttempts = 10;
  private reconnectBaseDelay = 1000;
  private reconnectTimer: any = null;

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
      `https://kick.com/api/v1/channels/${slug}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(`https://kick.com/api/v2/channels/${slug}`)}`,
      `https://corsproxy.io/?${encodeURIComponent(`https://kick.com/api/v2/channels/${slug}`)}`,
      `https://proxy.cors.sh/https://kick.com/api/v2/channels/${slug}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://kick.com/api/v2/channels/${slug}`)}`
    ];

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) continue;

        const rawData = await response.json();
        const data = proxyUrl.includes('allorigins') ? JSON.parse(rawData.contents) : rawData;

        let foundId = null;
        if (data?.chatroom?.id) foundId = data.chatroom.id;
        else if (data?.id) foundId = data.id;

        if (foundId) {
          console.log(`[ChatService] ✅ Found ID: ${foundId} via ${proxyUrl.substring(0, 40)}`);
          localStorage.setItem(`kick_chatroom_id_${slug}`, foundId.toString());
          return foundId;
        }
      } catch (e) {
        console.warn(`[ChatService] Proxy failed: ${proxyUrl}`);
      }
    }

    return null;
  }

  async connect(channelSlug: string = 'iabs'): Promise<void> {
    const slug = channelSlug.toLowerCase().trim();
    
    if (this.isConnecting) {
      console.log('[ChatService] Connection already in progress, skipping...');
      return;
    }

    if (this.isConnected && this.currentChannelSlug === slug && this.pusher) {
      console.log('[ChatService] Already connected to', slug);
      return;
    }

    this.isConnecting = true;
    this.currentChannelSlug = slug;
    this.shouldAutoReconnect = true;
    this.reconnectAttempts = 0;
    const myConnectionId = ++this.connectionId;

    this.notifyStatus(false, false, `جاري البحث عن قناة ${slug}...`);

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
        enabledTransports: ['ws', 'wss']
      });

      this.channel = this.pusher.subscribe(`chatrooms.${chatroomId}.v2`);

      this.channel.bind('App\\Events\\ChatMessageEvent', (data: any) => {
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
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyStatus(true, false, `متصل (ID: ${chatroomId})`);
      });

      this.pusher.connection.bind('error', (err: any) => {
        if (myConnectionId !== this.connectionId) return;
        console.error("[ChatService] Pusher Error:", err);
        this.isConnected = false;
        this.notifyStatus(false, true, "خطأ في الاتصال بسيرفر الشات");
      });

      this.pusher.connection.bind('disconnected', () => {
        if (myConnectionId !== this.connectionId) return;
        console.log("[ChatService] Pusher Disconnected");
        this.isConnected = false;
        this.isConnecting = false;
        this.notifyStatus(false, true, "انقطع الاتصال - جاري إعادة المحاولة...");
        
        if (this.shouldAutoReconnect) {
          this.scheduleReconnect(slug);
        }
      });

      this.pusher.connection.bind('state_change', (states: any) => {
        if (states.current === 'connecting' && myConnectionId !== this.connectionId) return;
        console.log("[ChatService] Connection State:", states.current);
      });

    } catch (error: any) {
      if (myConnectionId !== this.connectionId) return;
      console.error("[ChatService] Fatal Error:", error);
      this.isConnected = false;
      this.isConnecting = false;
      this.notifyStatus(false, true, error.message);
      
      if (this.shouldAutoReconnect) {
        this.scheduleReconnect(slug);
      }
    }
  }

  private scheduleReconnect(slug: string) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[ChatService] Max reconnect attempts reached');
      this.notifyStatus(false, true, 'فشل الاتصال بعد عدة محاولات');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`[ChatService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.notifyStatus(false, false, `إعادة المحاولة خلال ${Math.ceil(delay / 1000)} ثواني...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(slug);
    }, delay);
  }

  private cleanupPusher() {
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

    for (const serverUrl of this.botServerUrls) {
      try {
        const response = await fetch(`${serverUrl}/api/bot/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content })
        });

        if (response.ok) {
          console.log('[ChatService] Message sent via bot server:', serverUrl);
          return true;
        } else {
          console.warn(`[ChatService] Bot server ${serverUrl} returned ${response.status}`);
        }
      } catch (e) {
        console.warn(`[ChatService] Bot server ${serverUrl} failed:`, e);
      }
    }

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

      if (!response.ok) {
        console.error('[ChatService] Failed to send message. Status:', response.status);
        const text = await response.text();
        console.error('[ChatService] Response:', text);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[ChatService] Exception while sending message:', e);
      return false;
    }
  }

  setBotServerUrl(url: string | string[] | null) {
    if (Array.isArray(url)) {
      this.botServerUrls = url.filter(Boolean);
    } else if (typeof url === 'string' && url) {
      this.botServerUrls = [url];
    } else {
      this.botServerUrls = [];
    }
    console.log(`[ChatService] Bot server URLs set to: ${JSON.stringify(this.botServerUrls) || 'none (using direct API)'}`);
  }

  getBotServerUrls() {
    return [...this.botServerUrls];
  }

  addBotServerUrl(url: string) {
    if (url && !this.botServerUrls.includes(url)) {
      this.botServerUrls.push(url);
      console.log(`[ChatService] Added bot server URL: ${url}`);
    }
  }

  removeBotServerUrl(url: string) {
    this.botServerUrls = this.botServerUrls.filter(u => u !== url);
    console.log(`[ChatService] Removed bot server URL: ${url}`);
  }

  async fetchKickAvatar(username: string): Promise<string> {
    const slug = username.toLowerCase().trim().replace('@', '');
    if (this.avatarCache[slug]) return this.avatarCache[slug];
    if (this.pendingAvatarFetches[slug]) return this.pendingAvatarFetches[slug];

    const fetchPromise = (async () => {
      try {
        const proxies = [
          `https://api.allorigins.win/get?url=${encodeURIComponent(`https://kick.com/api/v1/channels/${slug}`)}&disableCache=true`,
          `https://corsproxy.io/?${encodeURIComponent(`https://kick.com/api/v1/channels/${slug}`)}`,
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://kick.com/api/v1/channels/${slug}`)}`,
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://kick.com/api/v2/channels/${slug}`)}`,
          `https://proxy.cors.sh/https://kick.com/api/v2/channels/${slug}`
        ];

        for (const proxyUrl of proxies) {
          try {
            const response = await fetch(proxyUrl, {
              cache: 'no-store',
              headers: { 'Accept': 'application/json, text/plain' }
            });
            if (!response.ok) continue;

            let avatar = '';
            const rawData = await response.json();
            let data: any;

            if (proxyUrl.includes('allorigins')) {
              if (!rawData.contents) continue;
              data = JSON.parse(rawData.contents);
            } else {
              data = rawData;
            }

            avatar = data.user?.profile_pic ||
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
      this.connect(this.currentChannelSlug);
    }
  }

  disconnect() {
    this.shouldAutoReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanupPusher();
    this.isConnected = false;
    this.isConnecting = false;
    this.currentChatroomId = null;
    this.currentChannelSlug = null;
  }
}

export const chatService = new ChatService();
