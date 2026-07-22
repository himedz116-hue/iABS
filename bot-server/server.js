require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

// Use the Node.js specific build of pusher-js
const pusherModule = require('pusher-js/dist/node/pusher');
const Pusher = pusherModule.Pusher || pusherModule.default || pusherModule;

// Polyfill WebSocket for pusher-js in Node.js
global.WebSocket = WebSocket;

const app = express();
const PORT = process.env.BOT_PORT || 3001;

app.use(cors());
app.use(express.json());

// Kick Bot Configuration
const KICK_BOT_ACCESS_TOKEN = process.env.KICK_BOT_ACCESS_TOKEN || "MTU4YJK4N2UTMDE1YI0ZYZY2LTHHYJYTNDQ2YJJMMWMZNJZH";
const KICK_BOT_REFRESH_TOKEN = process.env.KICK_BOT_REFRESH_TOKEN || "MDY0MJQ4MZCTZJE3OS01OTQWLWFMZTATZMU5YJNHMGE4NZC1";
const DEFAULT_CHANNEL = process.env.KICK_CHANNEL || 'iabs';

// Bot state
let botState = {
  connected: false,
  chatroomId: null,
  channel: DEFAULT_CHANNEL,
  messages: [],
  autoReplies: [
    { triggers: ['مرحبا', 'مرحباً', 'هلا', 'أهلا'], reply: 'أهلين 👋 نورت البث!' },
    { triggers: ['السلام', 'سلام'], reply: 'وعليكم السلام 👋' },
    { triggers: ['شلونك', 'شخبارك', 'كيفك'], reply: 'الحمد لله 🫡' },
    { triggers: ['احبك', 'بحبك', 'احبج'], reply: '💖' }
  ]
};

// Store for recent messages (last 50)
const recentMessages = [];
const MAX_MESSAGES = 50;

// Pusher instance
let pusher = null;
let channel = null;

// Initialize Pusher
const initPusher = () => {
  return new Promise((resolve, reject) => {
    try {
      const PusherFactory = Pusher.default || Pusher;
      console.log('Pusher type:', typeof Pusher);
      console.log('PusherFactory type:', typeof PusherFactory);
      console.log('Pusher === PusherFactory:', Pusher === PusherFactory);
      pusher = new PusherFactory('32cbd69e4b950bf97679', {
        cluster: 'us2',
        forceTLS: true,
        enabledTransports: ['ws', 'wss']
      });

      pusher.connection.bind('connected', () => {
        console.log('[BotServer] Pusher connected');
        botState.connected = true;
        resolve(true);
      });

      pusher.connection.bind('error', (err) => {
        console.error('[BotServer] Pusher error:', err);
        botState.connected = false;
      });

      pusher.connection.bind('disconnected', () => {
        console.log('[BotServer] Pusher disconnected');
        botState.connected = false;
      });

    } catch (error) {
      reject(error);
    }
  });
};

// Connect to Kick chatroom
const connectToChatroom = async (channelSlug) => {
  try {
    const proxies = [
      `https://kick.com/api/v2/channels/${channelSlug}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(`https://kick.com/api/v2/channels/${channelSlug}`)}`,
      `https://corsproxy.io/?${encodeURIComponent(`https://kick.com/api/v2/channels/${channelSlug}`)}`
    ];

    let chatroomId = null;

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl);
        if (!response.ok) continue;

        const rawData = await response.json();
        const data = proxyUrl.includes('allorigins') ? JSON.parse(rawData.contents) : rawData;

        if (data?.chatroom?.id) {
          chatroomId = data.chatroom.id;
          break;
        }
      } catch (e) {
        console.warn(`[BotServer] Proxy failed: ${proxyUrl}`);
      }
    }

    if (!chatroomId) {
      console.error(`[BotServer] Could not find chatroom ID for ${channelSlug}`);
      return false;
    }

    botState.chatroomId = chatroomId;
    botState.channel = channelSlug;
    console.log(`[BotServer] Connected to chatroom: ${chatroomId}`);

    // Subscribe to chatroom
    channel = pusher.subscribe(`chatrooms.${chatroomId}.v2`);

    channel.bind('App\\Events\\ChatMessageEvent', (data) => {
      const message = {
        id: data.id || Math.random().toString(36).substr(2, 9),
        username: data.sender?.username || 'Unknown',
        content: data.content || '',
        timestamp: Date.now()
      };

      // Store message
      recentMessages.push(message);
      if (recentMessages.length > MAX_MESSAGES) {
        recentMessages.shift();
      }

      // Check for auto-replies
      checkAutoReply(message);
    });

    return true;
  } catch (error) {
    console.error('[BotServer] Error connecting to chatroom:', error);
    return false;
  }
};

// Check and send auto-replies
const checkAutoReply = (message) => {
  const content = message.content.toLowerCase();
  
  for (const rule of botState.autoReplies) {
    const shouldReply = rule.triggers.some(trigger => content.includes(trigger));
    
    if (shouldReply) {
      setTimeout(() => {
        sendMessage(rule.reply);
      }, 1000 + Math.random() * 2000);
      break;
    }
  }
};

// Send message to Kick chat
const sendMessage = async (content) => {
  if (!botState.chatroomId) {
    console.warn('[BotServer] Cannot send message: not connected');
    return false;
  }

  try {
    const response = await fetch(`https://kick.com/api/public/v1/chatrooms/${botState.chatroomId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KICK_BOT_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        content,
        type: "message"
      })
    });

    if (!response.ok) {
      console.error('[BotServer] Failed to send message:', response.status);
      return false;
    }

    console.log(`[BotServer] Sent message: ${content}`);
    return true;
  } catch (error) {
    console.error('[BotServer] Error sending message:', error);
    return false;
  }
};

// API Routes

// Get bot status
app.get('/api/bot/status', (req, res) => {
  res.json({
    connected: botState.connected,
    chatroomId: botState.chatroomId,
    channel: botState.channel,
    messageCount: recentMessages.length
  });
});

// Get recent messages
app.get('/api/bot/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json(recentMessages.slice(-limit));
});

// Send message via bot
app.post('/api/bot/send', async (req, res) => {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required' });
  }

  const success = await sendMessage(content);
  
  if (success) {
    res.json({ success: true, message: 'Message sent' });
  } else {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Connect to a channel
app.post('/api/bot/connect', async (req, res) => {
  const { channel } = req.body;
  
  if (!channel) {
    return res.status(400).json({ error: 'Channel is required' });
  }

  const success = await connectToChatroom(channel);
  
  if (success) {
    res.json({ success: true, chatroomId: botState.chatroomId });
  } else {
    res.status(500).json({ error: 'Failed to connect to channel' });
  }
});

// Add auto-reply rule
app.post('/api/bot/autoreply', (req, res) => {
  const { triggers, reply } = req.body;
  
  if (!triggers || !reply || !Array.isArray(triggers)) {
    return res.status(400).json({ error: 'Triggers array and reply are required' });
  }

  botState.autoReplies.push({ triggers, reply });
  res.json({ success: true, autoReplies: botState.autoReplies });
});

// Get auto-reply rules
app.get('/api/bot/autoreply', (req, res) => {
  res.json(botState.autoReplies);
});

// Health check
app.get('/api/bot/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Initialize bot
const initBot = async () => {
  await initPusher();
  await connectToChatroom(DEFAULT_CHANNEL);
};

// Start server
app.listen(PORT, async () => {
  console.log(`[BotServer] Starting on port ${PORT}`);
  console.log(`[BotServer] Connecting to channel: ${DEFAULT_CHANNEL}`);
  
  await initBot();
  
  console.log(`[BotServer] Ready!`);
  console.log(`[BotServer] API: http://localhost:${PORT}/api/bot/`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[BotServer] Shutting down...');
  if (channel) {
    channel.unbind_all();
    channel.unsubscribe();
  }
  if (pusher) {
    pusher.disconnect();
  }
  process.exit(0);
});
