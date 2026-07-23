require('dotenv').config({ override: true });

// Polyfill WebSocket for Supabase and pusher-js in Node.js
const WebSocket = require('ws');
global.WebSocket = WebSocket;

const { createClient } = require('@supabase/supabase-js');

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[BotServer] Supabase initialized');
}

const express = require('express');
const cors = require('cors');
const path = require("path");
const https = require('https');

// Use the Node.js specific build of pusher-js
const pusherModule = require('pusher-js/dist/node/pusher');
const Pusher = pusherModule.Pusher || pusherModule.default || pusherModule;

const app = express();
const PORT = process.env.PORT || process.env.BOT_PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Kick Bot Configuration
const KICK_BOT_ACCESS_TOKEN = process.env.KICK_BOT_ACCESS_TOKEN || "MTU4YJK4N2UTMDE1YI0ZYZY2LTHHYJYTNDQ2YJJMMWMZNJZH";
const KICK_BOT_REFRESH_TOKEN = process.env.KICK_BOT_REFRESH_TOKEN || "MDY0MJQ4MZCTZJE3OS01OTQWLWFMZTATZMU5YJNHMGE4NZC1";

// Bot state
let botState = {
  connected: false,
  chatroomId: process.env.KICK_BOT_CHATROOM_ID || null,
  channel: process.env.KICK_BOT_CHANNEL || null,
  userAccessToken: process.env.KICK_BOT_ACCESS_TOKEN || null,
  userRefreshToken: process.env.KICK_BOT_REFRESH_TOKEN || null,
  userExpiresAt: 0, // Force refresh if using old token from .env
  messages: [],
  autoReplies: [
    { 
      triggers: [
        'السلام عليكم ورحمة الله وبركاته', 'وعليكم السلام', 'السلام عليكم', 'السلامو', 'مرحبتين', 'مراحب', 'مرحبا', 
        'أهلاً وسهلاً', 'أهلاً', 'أهلين', 'هلا والله', 'هلا وغلا', 'يا هلا', 'يا مرحبا', 'حيّاك الله', 'حياك الله',
        'الله يحييك', 'حياكم الله', 'حياك', 'حي الله من جانا', 'حي ذا الوجه', 'منور', 'نورتنا', 'نورت', 
        'شرفت ونورت', 'شرفت', 'تفضل', 'صباح الخير', 'صباح النور', 'صباح الورد', 'مساء الخير', 'مساء النور', 
        'مساك الله بالخير', 'كيف الحال', 'كيفك', 'شخبارك', 'شلونك', 'علومك', 'وش الأخبار', 'وش علومك', 
        'وش لونك', 'وش حالك', 'عساك بخير', 'عساك طيب', 'الله يسعدك', 'الله يحفظك', 'الله يعافيك', 
        'الله يعطيك العافية', 'الله يبارك فيك', 'الله يقويك', 'الله يرفع قدرك', 'الله يديم عزك', 'الله يسلمك', 
        'تسلم لي', 'تسلم', 'كل الهلا', 'كل الغلا', 'ألف مرحبا', 'مليون هلا', 'يا بعد راسي', 'يا بعد قلبي', 
        'يا الغالي', 'يا طويل العمر', 'يا وجه الخير', 'أبشر بعزك', 'أبشر', 'تمام التمام', 'تمام', 'زينين', 
        'زين', 'أكيد', 'وش السالفة', 'وش فيه', 'وش عندك', 'وش صار', 'وين رايح', 'وينك', 'تعال', 'اقعد', 
        'يالله', 'يلا', 'خلنا', 'زود', 'لا هنت', 'بيض الله وجهك', 'كفو والله', 'كفو', 'ونعم فيك', 'ونعم', 
        'حي الله الطيبين', 'حي الله الجميع', 'حيا الله الضيوف', 'يا هلا بالضيف', 'يا زين الطلة', 'يا بعد عيني', 
        'يا بعد عمري', 'الله يبقيك', 'الله يكرمك', 'الله يحفظكم', 'الله يوفقك', 'الله يرزقك', 'الله يسهل أمرك', 
        'الله معك', 'في أمان الله', 'مع السلامة', 'نشوفك على خير', 'هلا', 'سلام'
      ], 
      reply: 'يا هلا وغلا، نورت البث يا غالي' 
    }
  ],
  badWords: ['سب', 'شتم', 'كلمة_سيئة'], // كلمات يتم حذفها تلقائياً
  pendingDeletes: [] // رسائل يرسلها البوت ويحذفها فوراً كإشعار للمشرفين
};

// Store for recent messages (last 50)
const recentMessages = [];
const MAX_MESSAGES = 50;

// Pusher instance
let pusher = null;
let channel = null;

// Local https fetch helper
const httpsGet = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode, data }));
    }).on('error', reject);
  });
};

// Initialize Pusher
const initPusher = () => {
  return new Promise((resolve, reject) => {
    try {
      const PusherFactory = Pusher;
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

// Get chatroom ID with better error handling
const getChatroomId = async (channelSlug) => {
  const slug = channelSlug.toLowerCase().trim();
  
  // Try direct Kick API first
  const directUrl = `https://kick.com/api/v2/channels/${slug}`;
  
  try {
    const response = await fetch(directUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data?.chatroom?.id) {
        console.log(`[BotServer] Found chatroom ID directly: ${data.chatroom.id}`);
        return data.chatroom.id;
      }
    }
  } catch (e) {
    console.warn(`[BotServer] Direct API failed: ${e.message}`);
  }

  // Try proxies as fallback
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(directUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      console.log(`[BotServer] Trying proxy: ${proxyUrl}`);
      const response = await fetch(proxyUrl, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) continue;

      const rawData = await response.json();
      const data = proxyUrl.includes('allorigins') ? JSON.parse(rawData.contents) : rawData;

      if (data?.chatroom?.id) {
        console.log(`[BotServer] Found chatroom ID via proxy: ${data.chatroom.id}`);
        return data.chatroom.id;
      }
    } catch (e) {
      console.warn(`[BotServer] Proxy failed: ${proxyUrl} - ${e.message}`);
    }
  }

  return null;
};

// Connect to Kick chatroom
const connectToChatroom = async (channelSlug, manualChatroomId = null) => {
  try {
    let chatroomId = manualChatroomId;

    if (!chatroomId) {
      chatroomId = await getChatroomId(channelSlug);
    }

    if (!chatroomId) {
      console.error(`[BotServer] Could not find chatroom ID for ${channelSlug}`);
      return { success: false, error: 'لم يتم العثور على رقم الغرفة. تأكد من اسم القناة أو أدخل الرقم يدوياً.' };
    }

    // Disconnect existing channel
    if (channel) {
      channel.unbind_all();
      channel.unsubscribe();
    }

    botState.chatroomId = chatroomId;
    botState.channel = channelSlug;
    
    // Save to .env for persistence across restarts
    try {
      const fs = require('fs');
      let envPath = require('path').join(__dirname, '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/^KICK_BOT_CHANNEL=.*$/m, 'KICK_BOT_CHANNEL=' + channelSlug);
      envContent = envContent.replace(/^KICK_BOT_CHATROOM_ID=.*$/m, 'KICK_BOT_CHATROOM_ID=' + chatroomId);
      fs.writeFileSync(envPath, envContent);
    } catch (fsErr) {}
    
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

      // Check for pending deletions (bot sending hidden messages for mods)
      const deleteIndex = botState.pendingDeletes.indexOf(message.content);
      if (deleteIndex !== -1 && data.id) {
        botState.pendingDeletes.splice(deleteIndex, 1);
        deleteMessage(data.id);
        return; // Message deleted, stop processing
      }

      console.log(`[BotServer] ${message.username}: ${message.content}`);

      // Auto-Moderation (Delete bad words)
      const hasBadWord = botState.badWords.some(word => message.content.includes(word));
      if (hasBadWord && data.id) {
        console.log(`[BotServer] Deleting message from ${message.username} for bad word.`);
        deleteMessage(data.id);
        sendMessage(`عذراً @${message.username}، يرجى الالتزام بقوانين الشات! 🚫`);
        return; // Don't check auto-replies for deleted messages
      }

      // Ignore auto-replies for the bot itself to prevent infinite loops
      if (message.username.toLowerCase() === 'iabsbot') return;

      // Check for streak commands
      if (message.content.trim() === '!s' || message.content.trim() === '!streak') {
        handleStreakCommand(message.username, message.content.trim());
        return;
      }

      // Check for auto-aliases
      checkAutoReply(message);
    });

    return { success: true, chatroomId };
  } catch (error) {
    console.error('[BotServer] Error connecting to chatroom:', error);
    return { success: false, error: error.message };
  }
};

const fs = require('fs');
const streaksFile = path.join(__dirname, 'streaks.json');

const loadStreaks = () => {
  if (fs.existsSync(streaksFile)) {
    try {
      return JSON.parse(fs.readFileSync(streaksFile, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
};

const saveStreaks = (data) => {
  fs.writeFileSync(streaksFile, JSON.stringify(data, null, 2));
};

// Handle Streak Commands
const handleStreakCommand = async (username, command) => {
  if (!supabase) {
    console.warn('[BotServer] Supabase not connected. Streak system disabled.');
    return;
  }

  try {
    const { data: record, error: fetchError } = await supabase
      .from('kick_streaks')
      .select('*')
      .eq('username', username)
      .single();


    if (command === '!streak') {
      if (record) {
        sendMessage(`يا @${username} تمتلك ستريك ${record.current_streak} أيام متتالية، وأعلى ستريك لك هو ${record.longest_streak} أيام! 🌟`);
      } else {
        sendMessage(`يا @${username} ليس لديك أي ستريك حالياً، ابدأ الآن بكتابة !s 🚀`);
      }
      return;
    }

    if (command === '!s') {
      if (!streamState.isLive) {
        // Force an immediate check before rejecting
        await checkStreamStatus();
        if (!streamState.isLive) {
          sendMessage(`يا @${username} ممنوع الستريك بدون بث! 🚫`);
          return;
        }
      }
      
      const isOwner = botState.channel && username.toLowerCase() === botState.channel.toLowerCase();
      
      if (!isOwner) {
        if (!streamState.streakedUsers) streamState.streakedUsers = [];
        if (streamState.streakedUsers.includes(username)) {
          sendMessage(`يا @${username} لقد قمت بتسجيل الستريك في هذا البث مسبقاً! 😉`);
          return;
        }
      }

      const now = new Date();
      // Saudi is UTC+3 (10800000 ms)
      const saudiTime = new Date(now.getTime() + 10800000);
      const todayStr = saudiTime.toISOString().split('T')[0];
      const yesterdayTime = new Date(saudiTime.getTime() - 86400000);
      const yesterdayStr = yesterdayTime.toISOString().split('T')[0];

      if (!record) {
        // Create new record
        const { error: insertError } = await supabase
          .from('kick_streaks')
          .insert({ 
            username: username, 
            current_streak: 1, 
            longest_streak: 1, 
            last_streak_date: saudiTime.toISOString() 
          });
        if (!insertError) {
          streamState.streakedUsers.push(username);
          sendMessage(`أهلاً بك يا @${username} تم تسجيل الستريك لليوم الأول بنجاح!`);
        } else {
          console.error('[BotServer] Supabase insert error:', insertError.message);
          sendMessage(`عذراً @${username}، حدث خطأ أثناء حفظ الستريك. السبب: ${insertError.message} ❌`);
        }
      } else {
        const lastDateObj = new Date(record.last_streak_date);
        const lastDateStr = lastDateObj.toISOString().split('T')[0];

        if (lastDateStr === todayStr && !isOwner) {
          sendMessage(`يا @${username} لقد قمت بتسجيل الستريك لهذا اليوم مسبقاً! 😉`);
        } else if (lastDateStr === yesterdayStr || isOwner) {
          const newStreak = record.current_streak + 1;
          const newLongest = Math.max(newStreak, record.longest_streak);
          
          const { error: updateError } = await supabase
            .from('kick_streaks')
            .update({ 
              current_streak: newStreak, 
              longest_streak: newLongest, 
              last_streak_date: saudiTime.toISOString() 
            })
            .eq('username', username);
            
          if (!updateError) {
            if (!isOwner) streamState.streakedUsers.push(username);
            sendMessage(`كفو يا @${username}! تم تسجيل الستريك بنجاح، لديك الآن ${newStreak} أيام متتالية`);
          } else {
            console.error('[BotServer] Supabase update error:', updateError.message);
            sendMessage(`عذراً @${username}، حدث خطأ أثناء التحديث. السبب: ${updateError.message} ❌`);
          }
        } else {
          // Streak broken
          const { error: resetError } = await supabase
            .from('kick_streaks')
            .update({ 
              current_streak: 1, 
              last_streak_date: saudiTime.toISOString() 
            })
            .eq('username', username);
            
          if (!resetError) {
            streamState.streakedUsers.push(username);
            sendMessage(`يا @${username} للأسف انقطع الستريك السابق 😢 تم بدء ستريك جديد! (اليوم 1)`);
          } else {
            console.error('[BotServer] Supabase reset error:', resetError.message);
            sendMessage(`عذراً @${username}، حدث خطأ أثناء إعادة الضبط. السبب: ${resetError.message} ❌`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[BotServer] Streak system error:', err.message);
  }
};

const checkAutoReply = (message) => {
  // Prevent infinite loops by ignoring the bot's own messages
  if (!message.username || message.username === 'Unknown' || message.username.toLowerCase() === 'iabsbot') return;
  
  // Extra safety: Never reply if the message is exactly one of our own replies
  if (botState.autoReplies.some(rule => rule.reply === message.content)) return;

  const content = message.content.toLowerCase();
  
  for (const rule of botState.autoReplies) {
    const shouldReply = rule.triggers.some(trigger => content.includes(trigger));
    
    if (shouldReply) {
      setTimeout(() => {
        sendMessage(rule.reply);
      }, 200); // Fast reply in 200ms
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
    const accessToken = await getValidAccessToken();
    
    const response = await fetch(`https://api.kick.com/public/v1/chat`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        chatroom_id: parseInt(botState.chatroomId),
        content: content,
        type: "bot"
      })
    });

    if (!response.ok) {
      console.error('[BotServer] Failed to send message:', response.status);
      const text = await response.text();
      console.error('[BotServer] Response:', text);
      return false;
    }

    console.log(`[BotServer] Sent: ${content}`);
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

// Get bot config
app.get('/api/bot/config', (req, res) => {
  res.json({
    channel: process.env.KICK_BOT_CHANNEL || '',
    chatroomId: process.env.KICK_BOT_CHATROOM_ID || ''
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
  const { channel, chatroomId } = req.body;
  
  if (!channel && !chatroomId) {
    return res.status(400).json({ error: 'Channel name or chatroom ID is required' });
  }

  const result = await connectToChatroom(channel, chatroomId);
  
  if (result.success) {
    res.json({ success: true, chatroomId: result.chatroomId });
  } else {
    res.status(500).json({ error: result.error });
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

// Get Kick user status
app.get('/api/bot/kick-status', async (req, res) => {
  if (!botState.userAccessToken) {
    return res.json({ connected: false });
  }
  
  try {
    const response = await fetch('https://kick.com/api/v2/user', {
      headers: {
        'Authorization': `Bearer ${botState.userAccessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return res.json({ connected: false });
    }
    
    const userData = await response.json();
    res.json({
      connected: true,
      username: userData.username || userData.name,
      email: userData.email,
      id: userData.id
    });
  } catch (error) {
    res.json({ connected: false });
  }
});

// ============================================
// KICK OAUTH - Step 1: Redirect to Kick login
// ============================================
app.get('/auth/kick', (req, res) => {
  const clientId = process.env.KICK_BOT_CLIENT_ID;
  const redirectUrl = process.env.KICK_BOT_REDIRECT_URL;
  
  if (req.query.redirect) {
    botState.customRedirectUrl = req.query.redirect;
  } else {
    botState.customRedirectUrl = null;
  }
  
  if (!clientId || !redirectUrl) {
    return res.status(400).send('Missing Client ID or Redirect URL');
  }

  const state = Math.random().toString(36).substring(2, 15);
  
  const crypto = require('crypto');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  
  // Store verifier for callback
  botState.codeVerifier = codeVerifier;
  
  const kickAuthUrl = `https://kick.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=user:read+channel:read+channel:write+chat:write+chat:read+events:subscribe+moderation:ban+moderation:chat_message:manage+channel:rewards:read+channel:rewards:write&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  
  console.log(`[BotServer] Redirecting to Kick OAuth: ${kickAuthUrl}`);
  res.redirect(kickAuthUrl);
});

// ============================================
// KICK OAUTH - Step 2: Callback from Kick
// ============================================
app.get('/callback', async (req, res) => {
  const { code, error, error_description } = req.query;
  
  const errorReturnUrl = botState.customRedirectUrl || '/';
  if (error) {
    console.error(`[BotServer] OAuth error: ${error} - ${error_description}`);
    return res.send(`
      <html>
        <head><title>خطأ في تسجيل الدخول</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 50px; background: #0b0f19; color: #e5e7eb;">
          <h1 style="color: #ef4444;">❌ خطأ في تسجيل الدخول</h1>
          <p>${error_description || error}</p>
          <a href="${errorReturnUrl}" style="color: #60a5fa;">العودة للوحة التحكم</a>
        </body>
      </html>
    `);
  }
  
  if (!code) {
    return res.status(400).send(`
      <html>
        <head><title>خطأ</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 50px; background: #0b0f19; color: #e5e7eb;">
          <h1 style="color: #ef4444;">❌ لم يتم إرسال رمز التفويض</h1>
          <a href="${errorReturnUrl}" style="color: #60a5fa;">العودة للوحة التحكم</a>
        </body>
      </html>
    `);
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: process.env.KICK_BOT_CLIENT_ID,
        client_secret: process.env.KICK_BOT_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.KICK_BOT_REDIRECT_URL,
        code_verifier: botState.codeVerifier || ''
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`[BotServer] Token exchange failed: ${tokenResponse.status} - ${errorText}`);
      throw new Error('فشل في الحصول على رمز الوصول');
    }
    
    const tokenData = await tokenResponse.json();
    console.log('[BotServer] ✅ Successfully authenticated with Kick!');
    console.log(`[BotServer] Access Token: ${tokenData.access_token?.substring(0, 20)}...`);
    console.log(`[BotServer] Refresh Token: ${tokenData.refresh_token?.substring(0, 20)}...`);
    
    // Store tokens
    botState.userAccessToken = tokenData.access_token;
    botState.userRefreshToken = tokenData.refresh_token;
    botState.userExpiresAt = Date.now() + (tokenData.expires_in * 1000);
    
    // Save to .env file
    try {
      const fs = require('fs');
      let envPath = require('path').join(__dirname, '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/^KICK_BOT_ACCESS_TOKEN=.*$/m, 'KICK_BOT_ACCESS_TOKEN=' + tokenData.access_token);
      envContent = envContent.replace(/^KICK_BOT_REFRESH_TOKEN=.*$/m, 'KICK_BOT_REFRESH_TOKEN=' + tokenData.refresh_token);
      fs.writeFileSync(envPath, envContent);
      console.log('[BotServer] .env updated with new OAuth tokens!');
    } catch (fsErr) {
      console.error('[BotServer] Could not update .env file', fsErr);
    }
    
    // Update sendMessage to use this token
    updateBotToken(tokenData.access_token, tokenData.refresh_token);
    
    const returnUrl = botState.customRedirectUrl ? `${botState.customRedirectUrl}${botState.customRedirectUrl.includes('?') ? '&' : '?'}autoConnect=1` : '/?autoConnect=1';
    
    res.send(`
      <html>
        <head>
          <title>تم تسجيل الدخول بنجاح</title>
          <meta http-equiv="refresh" content="2;url=${returnUrl}" />
        </head>
        <body style="font-family: system-ui; text-align: center; padding: 50px; background: #0b0f19; color: #e5e7eb;">
          <h1 style="color: #4ade80;">✅ تم تسجيل الدخول بنجاح!</h1>
          <p>البوت متصل بحسابك على Kick</p>
          <p style="color: #6b7280; font-size: 14px;">جاري التحويل للوحة التحكم...</p>
          <a href="${returnUrl}" style="color: #60a5fa;">العودة الآن</a>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('[BotServer] OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <head><title>خطأ</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 50px; background: #0b0f19; color: #e5e7eb;">
          <h1 style="color: #ef4444;">❌ خطأ في العملية</h1>
          <p>${error.message}</p>
          <a href="${errorReturnUrl}" style="color: #60a5fa;">العودة للوحة التحكم</a>
        </body>
      </html>
    `);
  }
});

// ============================================
// Update bot token function
// ============================================
const updateBotToken = (accessToken, refreshToken) => {
  botState.userAccessToken = accessToken;
  botState.userRefreshToken = refreshToken;
  botState.userExpiresAt = Date.now() + (3600 * 1000); // 1 hour
  console.log('[BotServer] Token updated successfully');
};

// ============================================
// Refresh access token
// ============================================
const refreshAccessToken = async () => {
  if (!botState.userRefreshToken) return false;
  
  try {
    const response = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: process.env.KICK_BOT_CLIENT_ID,
        client_secret: process.env.KICK_BOT_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: botState.userRefreshToken
      })
    });
    
    if (!response.ok) return false;
    
    const tokenData = await response.json();
    
    // Save refreshed tokens to .env
    try {
      const fs = require('fs');
      let envPath = require('path').join(__dirname, '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/^KICK_BOT_ACCESS_TOKEN=.*$/m, 'KICK_BOT_ACCESS_TOKEN=' + tokenData.access_token);
      envContent = envContent.replace(/^KICK_BOT_REFRESH_TOKEN=.*$/m, 'KICK_BOT_REFRESH_TOKEN=' + tokenData.refresh_token);
      fs.writeFileSync(envPath, envContent);
      console.log('[BotServer] .env updated with refreshed tokens!');
    } catch (fsErr) {
      console.error('[BotServer] Could not update .env file after refresh', fsErr);
    }
    
    updateBotToken(tokenData.access_token, tokenData.refresh_token);
    return true;
  } catch (error) {
    console.error('[BotServer] Failed to refresh token:', error);
    return false;
  }
};

// Delete a message in Kick chat
const deleteMessage = async (messageId) => {
  if (!botState.chatroomId) return false;

  try {
    const accessToken = await getValidAccessToken();
    const response = await fetch(`https://api.kick.com/public/v1/chat/${messageId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      console.error(`[BotServer] Failed to delete message ${messageId}:`, response.status);
      return false;
    }
    
    console.log(`[BotServer] Successfully deleted message ${messageId}`);
    return true;
  } catch (error) {
    console.error('[BotServer] Delete message API error:', error.message);
    return false;
  }
};

// ============================================
// Get valid access token
// ============================================
const getValidAccessToken = async () => {
  // If no user token, use default bot token
  if (!botState.userAccessToken) {
    return process.env.KICK_BOT_ACCESS_TOKEN;
  }
  
  // If token expired, refresh it
  if (Date.now() >= botState.userExpiresAt) {
    console.log('[BotServer] Token expired, refreshing...');
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.log('[BotServer] Refresh failed, using default token');
      return process.env.KICK_BOT_ACCESS_TOKEN;
    }
  }
  
  return botState.userAccessToken;
};

// ============================================
// Stream Monitor & Attendance System
// ============================================
const streamState = {
  isLive: false,
  startTime: null,
  hoursAttended: 0
};

const triggerAttendance = async (hourNumber) => {
  console.log(`[BotServer] Triggering attendance for hour ${hourNumber}`);
  
  // 1. Spam attendance message 5 times
  for (let i = 0; i < 5; i++) {
    sendMessage(`🔔✨ تحضير الساعة ${hourNumber} بدأ! يلا عطونا تفاعل بالدردشة يا وحوش 🔥💬`);
    await new Promise(r => setTimeout(r, 1000));
  }

  // 2. Wait 2 minutes (120,000 ms)
  setTimeout(async () => {
    console.log(`[BotServer] 2 minutes passed. Distributing points and locking chat.`);
    const points = hourNumber * 1000;
    
    // 3. Send points command
    sendMessage(`!points add all ${points}`);
    
    // 4. Send instructions for moderators and queue them for deletion
    setTimeout(() => {
      const modMsg1 = "يا مودات قفلو الشات واعملو سب اونلي 🔴";
      const modMsg2 = "الرجاء تفعيل الوضع البطيء أيضاً ⏱️";
      botState.pendingDeletes.push(modMsg1, modMsg2);
      
      sendMessage(modMsg1);
      sendMessage(modMsg2);
      sendMessage(`تم توزيع ${points} نقطة للجميع! 🎁`);
      
      // 5. After 3 minutes, remind mods to open chat
      setTimeout(() => {
        const modMsg3 = "يا مودات افتحوا الشات وألغوا السب اونلي 🟢";
        botState.pendingDeletes.push(modMsg3);
        
        sendMessage(modMsg3);
        sendMessage(`🚀 تم الانتهاء من فترة التحضير للجميع!`);
      }, 180000); // 3 minutes (180,000 ms)

    }, 1000);

  }, 120000); // 2 minutes wait
};

let isCheckingStatus = false;
const checkStreamStatus = async () => {
  if (!botState.channel || !botState.chatroomId) return streamState.isLive;
  if (isCheckingStatus) return streamState.isLive;
  
  isCheckingStatus = true;
  try {
    const directUrl = `https://kick.com/api/v2/channels/${botState.channel}?t=${Date.now()}`;
    const response = await fetch(directUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const rawData = await response.json();
    const isLiveNow = !!rawData.livestream;
    
    if (isLiveNow) {
      // Kick returns date as "YYYY-MM-DD HH:mm:ss" in UTC. 
      // We must append 'Z' so Node.js doesn't parse it as local time!
      const rawDateStr = rawData.livestream.created_at;
      const isoDateStr = rawDateStr.replace(' ', 'T') + 'Z';
      const newStartTime = new Date(isoDateStr).getTime();
      
      // If we weren't live before, OR if the stream created_at timestamp changed (rapid restart)
      if (!streamState.isLive || streamState.startTime !== newStartTime) {
        streamState.isLive = true;
        streamState.startTime = newStartTime;
        streamState.hoursAttended = 0;
        streamState.streakedUsers = []; // Reset streaked users for new stream session
        console.log(`[BotServer] Stream started (or restarted) at ${rawDateStr}`);
        sendMessage("!!! حياكم الله في البث");
      }
    } else if (!isLiveNow && streamState.isLive) {
      streamState.isLive = false;
      streamState.startTime = null;
      streamState.hoursAttended = 0;
      console.log(`[BotServer] Stream ended.`);
    }

    if (streamState.isLive && streamState.startTime) {
      const now = Date.now();
      const elapsedMs = now - streamState.startTime;
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
      const elapsedHours = Math.floor(elapsedMinutes / 60);
      
      // If a full hour has passed and we haven't attended it yet
      if (elapsedHours > streamState.hoursAttended && elapsedHours > 0) {
        streamState.hoursAttended = elapsedHours;
        triggerAttendance(streamState.hoursAttended);
      }
    }
  } catch (err) {
    console.error('[BotServer] Error checking stream status:', err.message);
  } finally {
    isCheckingStatus = false;
  }
  
  return streamState.isLive;
};

// Initialize bot
const initBot = async () => {
  await initPusher();
  
  if (botState.channel) {
    console.log(`[BotServer] Auto-connecting to channel ${botState.channel}...`);
    await connectToChatroom(botState.channel, botState.chatroomId);
  }
  
  // Start stream monitor (check every 20 seconds for faster detection)
  setInterval(checkStreamStatus, 20000); 
  
  console.log('[BotServer] Ready!');
};

// Start server
app.listen(PORT, async () => {
  console.log(`[BotServer] Starting on port ${PORT}`);
  
  await initBot();
  
  console.log(`[BotServer] API: http://localhost:${PORT}/api/bot/`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
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
