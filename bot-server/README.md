# Kick Bot Server

سيرفر بوت كيك مستقل يعمل بشكل منفصل عن الموقع.

## التشغيل

### الطريقة 1: استخدام ملف الباتش
```
start-bot.bat
```

### الطريقة 2: تشغيل يدوي
```bash
cd bot-server
npm install
node server.js
```

### الطريقة 3: سيرفر جافا للسرعة والاحتياط
```
cd java-server
build.bat
run.bat
```

السيرفر الجافا يعمل على المنفذ 3002 ويمكن استخدامه كخادم احتياطي أو رئيسي أدق من Node.js.

لتشغيل كلاهما معاً (للاحتياط):
```javascript
localStorage.setItem('iabs_bot_server_urls', JSON.stringify([
  'http://localhost:3001',
  'http://localhost:3002'
]));
```

## API endpoints

- `GET /api/bot/status` - حالة البوت
- `GET /api/bot/messages` - آخر الرسائل
- `POST /api/bot/send` - إرسال رسالة
- `POST /api/bot/connect` - الاتصال بقناة
- `GET /api/bot/autoreply` - قواعد الرد التلقائي
- `POST /api/bot/autoreply` - إضافة قاعدة رد تلقائي

## المتغيرات البيئية

أنشئ ملف `.env` في مجلد `bot-server`:

```env
KICK_BOT_ACCESS_TOKEN=your_token_here
KICK_BOT_REFRESH_TOKEN=your_refresh_token_here
KICK_CHANNEL=iabs
BOT_PORT=3001
```

## الأوامر التلقائية

البوت يرد تلقائياً على:
- مرحبا / أهلا / هلا → أهلين 👋 نورت البث!
- السلام → وعليكم السلام 👋
- شلونك / كيفك → الحمد لله 🫡
