# iABSS Java Bot Server

High-performance, redundant bot API server written in Java (Java 8+). Designed to complement or replace the Node.js bot-server with faster HTTP handling and better concurrency.

## Features

- **Multi-threaded HTTP server** using `com.sun.net.httpserver.HttpServer` (built into JDK)
- **Stream status monitoring** (checks kick.com API every 20 seconds)
- **Message sending** via Kick API with OAuth token auto-refresh
- **Auto-reply system** (greeting rules)
- **Streak & attendance** backend support
- **CORS enabled** for frontend integration
- **OAuth callback** handling
- **Health check** endpoint

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bot/health` | Health check |
| GET | `/api/bot/status` | Bot status |
| GET | `/api/bot/config` | Current config |
| GET | `/api/bot/messages?limit=20` | Recent messages |
| POST | `/api/bot/send` | Send message `{ "content": "..." }` |
| POST | `/api/bot/connect` | Connect to channel `{ "channel": "...", "chatroomId": "..." }` |
| POST | `/api/bot/autoreply` | Add auto-reply rule |
| GET | `/api/bot/kick-status` | Kick OAuth status |
| GET | `/auth/kick` | Redirect to Kick OAuth |
| GET | `/callback` | OAuth callback |

## Quick Start

### Prerequisites
- Java 8 or higher
- Windows

### Build & Run

```bat
build.bat
run.bat
```

Or manually:

```bash
javac -d lib src/com/iabss/bot/KickBotServer.java
java -cp lib com.iabss.bot.KickBotServer
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BOT_PORT` | `3002` | Server port |
| `KICK_BOT_CHANNEL` | `""` | Default channel slug |
| `KICK_BOT_CHATROOM_ID` | `""` | Default chatroom ID |
| `KICK_BOT_ACCESS_TOKEN` | `""` | Kick access token |
| `KICK_BOT_REFRESH_TOKEN` | `""` | Kick refresh token |
| `KICK_BOT_CLIENT_ID` | `""` | OAuth client ID |
| `KICK_BOT_CLIENT_SECRET` | `""` | OAuth client secret |
| `KICK_BOT_REDIRECT_URL` | `http://localhost:3002/callback` | OAuth redirect URL |

## Running Both Servers (Redundancy)

For maximum reliability, run both servers simultaneously:

1. **Node.js bot-server** on port 3001
2. **Java bot-server** on port 3002

Configure the frontend to use both:

```javascript
// In App.tsx or localStorage
localStorage.setItem('iabs_bot_server_urls', JSON.stringify([
  'http://localhost:3001',
  'http://localhost:3002'
]));
```

The frontend will automatically try each server in order until one succeeds.

## Performance

Java server handles 20 concurrent HTTP worker threads out of the box. The scheduler runs stream checks on a dedicated thread. Memory usage is minimal compared to Node.js for pure HTTP workloads.
