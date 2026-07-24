package com.iabss.bot;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class KickBotServer {

    private static final int PORT = Integer.parseInt(System.getenv().getOrDefault("BOT_PORT", "3002"));
    private static final String KICK_BOT_CHANNEL = System.getenv().getOrDefault("KICK_BOT_CHANNEL", "");
    private static final String KICK_BOT_CHATROOM_ID = System.getenv().getOrDefault("KICK_BOT_CHATROOM_ID", "");
    private static final String KICK_BOT_ACCESS_TOKEN = System.getenv().getOrDefault("KICK_BOT_ACCESS_TOKEN", "");
    private static final String KICK_BOT_REFRESH_TOKEN = System.getenv().getOrDefault("KICK_BOT_REFRESH_TOKEN", "");
    private static final String KICK_BOT_CLIENT_ID = System.getenv().getOrDefault("KICK_BOT_CLIENT_ID", "");
    private static final String KICK_BOT_CLIENT_SECRET = System.getenv().getOrDefault("KICK_BOT_CLIENT_SECRET", "");
    private static final String KICK_BOT_REDIRECT_URL = System.getenv().getOrDefault("KICK_BOT_REDIRECT_URL", "http://localhost:3002/callback");

    private static volatile String userAccessToken = KICK_BOT_ACCESS_TOKEN;
    private static volatile String userRefreshToken = KICK_BOT_REFRESH_TOKEN;
    private static volatile long userExpiresAt = System.currentTimeMillis() + 3600_000;
    private static volatile boolean connected = false;
    private static volatile String currentChannel = KICK_BOT_CHANNEL;
    private static volatile String currentChatroomId = KICK_BOT_CHATROOM_ID;

    private static final List<String> recentMessages = new CopyOnWriteArrayList<>();
    private static final int MAX_MESSAGES = 50;

    private static final List<Map<String, Object>> autoReplies = new CopyOnWriteArrayList<>();
    private static final List<String> badWords = new CopyOnWriteArrayList<>(Arrays.asList("سب", "شتم", "كلمة_سيئة"));
    private static final List<String> pendingDeletes = new CopyOnWriteArrayList<>();

    private static final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4, r -> {
        Thread t = new Thread(r, "kick-bot-worker");
        t.setDaemon(true);
        return t;
    });

    private static final AtomicInteger requestId = new AtomicInteger(0);
    private static final ExecutorService httpExecutor = Executors.newFixedThreadPool(20, r -> {
        Thread t = new Thread(r, "http-worker-" + requestId.incrementAndGet());
        t.setDaemon(true);
        return t;
    });

    static {
        Map<String, Object> greeting = new HashMap<>();
        greeting.put("triggers", Arrays.asList(
            "السلام عليكم ورحمة الله وبركاته", "وعليكم السلام", "السلام عليكم", "مرحبتين", "مراحب", "مرحبا",
            "أهلاً وسهلاً", "أهلاً", "أهلين", "هلا والله", "هلا وغلا", "يا هلا", "يا مرحبا", "حيّاك الله",
            "حياك الله", "الله يحييك", "حياكم الله", "حياك", "حي الله من جانا", "منور", "نورتنا", "نورت",
            "شرفت ونورت", "شرفت", "تفضل", "صباح الخير", "صباح النور", "صباح الورد", "مساء الخير", "مساء النور",
            "مساك الله بالخير", "كيف الحال", "كيفك", "شخبارك", "شلونك", "علومك", "وش الأخبار", "وش علومك",
            "هلا", "سلام"
        ));
        greeting.put("reply", "يا هلا وغلا، نورت البث يا غالي");
        autoReplies.add(greeting);
    }

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.setExecutor(httpExecutor);

        server.createContext("/api/bot/status", new StatusHandler());
        server.createContext("/api/bot/config", new ConfigHandler());
        server.createContext("/api/bot/messages", new MessagesHandler());
        server.createContext("/api/bot/send", new SendHandler());
        server.createContext("/api/bot/connect", new ConnectHandler());
        server.createContext("/api/bot/autoreply", new AutoReplyHandler());
        server.createContext("/api/bot/kick-status", new KickStatusHandler());
        server.createContext("/api/bot/health", new HealthHandler());
        server.createContext("/auth/kick", new AuthRedirectHandler());
        server.createContext("/callback", new AuthCallbackHandler());

        server.start();
        System.out.println("[JavaBotServer] Starting on port " + PORT);

        if (currentChannel != null && !currentChannel.isEmpty()) {
            System.out.println("[JavaBotServer] Auto-connecting to channel: " + currentChannel);
            connectToChatroom(currentChannel, currentChatroomId).get();
        }

        scheduler.scheduleAtFixedRate(() -> {
            try {
                checkStreamStatus();
            } catch (Exception e) {
                System.err.println("[JavaBotServer] Stream check error: " + e.getMessage());
            }
        }, 0, 20, TimeUnit.SECONDS);

        System.out.println("[JavaBotServer] Ready!");
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\n[JavaBotServer] Shutting down...");
            server.stop(0);
            scheduler.shutdown();
            httpExecutor.shutdown();
        }));
    }

    private static String getValidAccessToken() throws Exception {
        if (userAccessToken == null || userAccessToken.isEmpty()) {
            return KICK_BOT_ACCESS_TOKEN;
        }
        if (System.currentTimeMillis() >= userExpiresAt) {
            System.out.println("[JavaBotServer] Token expired, refreshing...");
            if (refreshAccessToken()) {
                return userAccessToken;
            }
            return KICK_BOT_ACCESS_TOKEN;
        }
        return userAccessToken;
    }

    private static boolean refreshAccessToken() {
        if (userRefreshToken == null || userRefreshToken.isEmpty()) return false;
        try {
            String body = "grant_type=refresh_token" +
                    "&client_id=" + URLEncoder.encode(KICK_BOT_CLIENT_ID, "UTF-8") +
                    "&client_secret=" + URLEncoder.encode(KICK_BOT_CLIENT_SECRET, "UTF-8") +
                    "&refresh_token=" + URLEncoder.encode(userRefreshToken, "UTF-8");

            HttpURLConnection conn = (HttpURLConnection) new URL("https://id.kick.com/oauth/token").openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            conn.getOutputStream().write(body.getBytes(StandardCharsets.UTF_8));

            if (conn.getResponseCode() == 200) {
                String response = readStream(conn.getInputStream());
                String accessToken = extractJsonValue(response, "access_token");
                String refreshToken = extractJsonValue(response, "refresh_token");
                if (accessToken != null) {
                    userAccessToken = accessToken;
                    if (refreshToken != null) userRefreshToken = refreshToken;
                    userExpiresAt = System.currentTimeMillis() + 3600_000;
                    System.out.println("[JavaBotServer] Token refreshed successfully");
                    return true;
                }
            }
        } catch (Exception e) {
            System.err.println("[JavaBotServer] Refresh failed: " + e.getMessage());
        }
        return false;
    }

    private static Future<Boolean> connectToChatroom(String channelSlug, String manualChatroomId) {
        return httpExecutor.submit(() -> {
            try {
                String chatroomId = manualChatroomId;
                if (chatroomId == null || chatroomId.isEmpty()) {
                    chatroomId = lookupChatroomId(channelSlug);
                }
                if (chatroomId == null) {
                    System.err.println("[JavaBotServer] Could not find chatroom ID for " + channelSlug);
                    return false;
                }
                currentChannel = channelSlug;
                currentChatroomId = chatroomId;
                connected = true;
                System.out.println("[JavaBotServer] Connected to chatroom: " + chatroomId);
                return true;
            } catch (Exception e) {
                System.err.println("[JavaBotServer] Connect error: " + e.getMessage());
                return false;
            }
        });
    }

    private static String lookupChatroomId(String channelSlug) throws Exception {
        String url = "https://kick.com/api/v2/channels/" + URLEncoder.encode(channelSlug, "UTF-8");
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("User-Agent", "Mozilla/5.0");

        if (conn.getResponseCode() == 200) {
            String response = readStream(conn.getInputStream());
            String chatroomId = extractJsonValue(response, "chatroom.id");
            if (chatroomId != null) return chatroomId;
        }
        return null;
    }

    static boolean sendMessage(String content) {
        if (currentChatroomId == null || currentChatroomId.isEmpty()) return false;
        scheduler.execute(() -> {
            try {
                String token = getValidAccessToken();
                String body = "{\"chatroom_id\":" + currentChatroomId +
                        ",\"content\":\"" + escapeJson(content) +
                        "\",\"type\":\"bot\"}";

                HttpURLConnection conn = (HttpURLConnection) new URL("https://api.kick.com/public/v1/chat").openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Accept", "application/json");
                conn.setDoOutput(true);
                conn.getOutputStream().write(body.getBytes(StandardCharsets.UTF_8));

                if (conn.getResponseCode() == 200 || conn.getResponseCode() == 201) {
                    System.out.println("[JavaBotServer] Sent: " + content);
                    storeMessage("iabsbot", content);
                } else {
                    System.err.println("[JavaBotServer] Failed to send: " + conn.getResponseCode());
                }
            } catch (Exception e) {
                System.err.println("[JavaBotServer] Send error: " + e.getMessage());
            }
        });
        return true;
    }

    private static void storeMessage(String username, String content) {
        recentMessages.add(username + ": " + content);
        while (recentMessages.size() > MAX_MESSAGES) {
            recentMessages.remove(0);
        }
    }

    private static void checkStreamStatus() throws Exception {
        if (currentChannel == null || currentChannel.isEmpty()) return;

        String url = "https://kick.com/api/v2/channels/" + URLEncoder.encode(currentChannel, "UTF-8");
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("User-Agent", "Mozilla/5.0");

        if (conn.getResponseCode() == 200) {
            String response = readStream(conn.getInputStream());
            boolean isLive = response.contains("\"livestream\"") && response.contains("\"created_at\"");
            if (isLive && !connected) {
                connected = true;
                sendMessage("!!! حياكم الله في البث");
            } else if (!isLive && connected) {
                connected = false;
            }
        }
    }

    private static String readStream(InputStream is) throws IOException {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            return sb.toString();
        }
    }

    private static String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\"";
        int idx = json.indexOf(searchKey);
        if (idx == -1) return null;
        int colonIdx = json.indexOf(':', idx + searchKey.length());
        if (colonIdx == -1) return null;
        int start = colonIdx + 1;
        while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '\t')) start++;
        if (start >= json.length()) return null;
        char c = json.charAt(start);
        if (c == '"') {
            int end = json.indexOf('"', start + 1);
            if (end == -1) return null;
            return json.substring(start + 1, end);
        } else if (c == 't' || c == 'f') {
            int end = json.indexOf(',', start);
            if (end == -1) end = json.indexOf('}', start);
            if (end == -1) return null;
            return json.substring(start, end).trim();
        } else if (c == 'n') {
            return null;
        } else {
            int end = json.indexOf(',', start);
            if (end == -1) end = json.indexOf('}', start);
            if (end == -1) return null;
            return json.substring(start, end).trim();
        }
    }

    private static String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private static void sendCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void sendJsonResponse(HttpExchange exchange, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        sendCorsHeaders(exchange);
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static void sendTextResponse(HttpExchange exchange, int status, String text) throws IOException {
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
        sendCorsHeaders(exchange);
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    static class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                sendCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            String json = "{\"connected\":" + connected +
                    ",\"chatroomId\":\"" + currentChatroomId + "\"" +
                    ",\"channel\":\"" + currentChannel + "\"" +
                    ",\"messageCount\":" + recentMessages.size() + "}";
            sendJsonResponse(exchange, 200, json);
        }
    }

    static class ConfigHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                sendCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            String json = "{\"channel\":\"" + currentChannel + "\"" +
                    ",\"chatroomId\":\"" + currentChatroomId + "\"}";
            sendJsonResponse(exchange, 200, json);
        }
    }

    static class MessagesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                sendCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            String query = exchange.getRequestURI().getQuery();
            int limit = 20;
            if (query != null) {
                for (String param : query.split("&")) {
                    String[] kv = param.split("=");
                    if (kv.length == 2 && kv[0].equals("limit")) {
                        limit = Integer.parseInt(kv[1]);
                    }
                }
            }
            List<String> slice = recentMessages.subList(Math.max(0, recentMessages.size() - limit), recentMessages.size());
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < slice.size(); i++) {
                if (i > 0) json.append(",");
                json.append("\"").append(escapeJson(slice.get(i))).append("\"");
            }
            json.append("]");
            sendJsonResponse(exchange, 200, json.toString());
        }
    }

    static class SendHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                sendCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendTextResponse(exchange, 405, "Method Not Allowed");
                return;
            }
            String body = readStream(exchange.getRequestBody());
            String content = extractJsonValue(body, "content");
            if (content == null || content.isEmpty()) {
                sendTextResponse(exchange, 400, "Content is required");
                return;
            }
            boolean success = sendMessage(content);
            sendJsonResponse(exchange, success ? 200 : 500, "{\"success\":" + success + "}");
        }
    }

    static class ConnectHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                sendCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendTextResponse(exchange, 405, "Method Not Allowed");
                return;
            }
            String body = readStream(exchange.getRequestBody());
            String channel = extractJsonValue(body, "channel");
            String chatroomId = extractJsonValue(body, "chatroomId");
            if ((channel == null || channel.isEmpty()) && (chatroomId == null || chatroomId.isEmpty())) {
                sendTextResponse(exchange, 400, "Channel name or chatroom ID is required");
                return;
            }
            Boolean result = connectToChatroom(channel != null ? channel : "", chatroomId != null ? chatroomId : "").get();
            if (result) {
                sendJsonResponse(exchange, 200, "{\"success\":true,\"chatroomId\":\"" + currentChatroomId + "\"}");
            } else {
                sendJsonResponse(exchange, 500, "{\"error\":\"لم يتم العثور على رقم الغرفة\"}");
            }
        }
    }

    static class AutoReplyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                sendCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendTextResponse(exchange, 405, "Method Not Allowed");
                return;
            }
            String body = readStream(exchange.getRequestBody());
            String triggers = extractJsonValue(body, "triggers");
            String reply = extractJsonValue(body, "reply");
            if (triggers == null || reply == null) {
                sendTextResponse(exchange, 400, "Triggers and reply are required");
                return;
            }
            Map<String, Object> rule = new HashMap<>();
            rule.put("triggers", Arrays.asList(triggers.split(",")));
            rule.put("reply", reply);
            autoReplies.add(rule);
            StringBuilder json = new StringBuilder("{\"success\":true,\"autoReplies\":[");
            for (int i = 0; i < autoReplies.size(); i++) {
                if (i > 0) json.append(",");
                Map<String, Object> r = autoReplies.get(i);
                json.append("{\"triggers\":[");
                List<?> trigList = (List<?>) r.get("triggers");
                for (int j = 0; j < trigList.size(); j++) {
                    if (j > 0) json.append(",");
                    json.append("\"").append(escapeJson((String) trigList.get(j))).append("\"");
                }
                json.append("],\"reply\":\"").append(escapeJson((String) r.get("reply"))).append("\"}");
            }
            json.append("]}");
            sendJsonResponse(exchange, 200, json.toString());
        }
    }

    static class KickStatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                sendCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            if (userAccessToken == null || userAccessToken.isEmpty()) {
                sendJsonResponse(exchange, 200, "{\"connected\":false}");
                return;
            }
            try {
                HttpURLConnection conn = (HttpURLConnection) new URL("https://kick.com/api/v2/user").openConnection();
                conn.setRequestProperty("Authorization", "Bearer " + userAccessToken);
                conn.setRequestProperty("Accept", "application/json");
                if (conn.getResponseCode() == 200) {
                    String response = readStream(conn.getInputStream());
                    String username = extractJsonValue(response, "username");
                    if (username == null) username = extractJsonValue(response, "name");
                    String email = extractJsonValue(response, "email");
                    String id = extractJsonValue(response, "id");
                    String json = "{\"connected\":true,\"username\":\"" + username +
                            "\",\"email\":\"" + email +
                            "\",\"id\":\"" + id + "\"}";
                    sendJsonResponse(exchange, 200, json);
                } else {
                    sendJsonResponse(exchange, 200, "{\"connected\":false}");
                }
            } catch (Exception e) {
                sendJsonResponse(exchange, 200, "{\"connected\":false}");
            }
        }
    }

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            sendCorsHeaders(exchange);
            String json = "{\"status\":\"ok\",\"timestamp\":" + System.currentTimeMillis() + "}";
            sendJsonResponse(exchange, 200, json);
        }
    }

    static class AuthRedirectHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String clientId = KICK_BOT_CLIENT_ID;
            String redirectUrl = KICK_BOT_REDIRECT_URL;
            if (clientId == null || clientId.isEmpty() || redirectUrl == null || redirectUrl.isEmpty()) {
                sendTextResponse(exchange, 400, "Missing Client ID or Redirect URL");
                return;
            }
            String state = UUID.randomUUID().toString().substring(2, 15);
            String authUrl = "https://kick.com/oauth/authorize?client_id=" + URLEncoder.encode(clientId, "UTF-8") +
                    "&redirect_uri=" + URLEncoder.encode(redirectUrl, "UTF-8") +
                    "&response_type=code" +
                    "&scope=user:read+channel:read+channel:write+chat:write+chat:read+events:subscribe+moderation:ban+moderation:chat_message:manage" +
                    "&state=" + state;
            exchange.getResponseHeaders().add("Location", authUrl);
            sendCorsHeaders(exchange);
            exchange.sendResponseHeaders(302, -1);
            exchange.close();
        }
    }

    static class AuthCallbackHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            Map<String, String> params = new HashMap<>();
            if (query != null) {
                for (String param : query.split("&")) {
                    String[] kv = param.split("=", 2);
                    params.put(kv[0], kv.length > 1 ? URLDecoder.decode(kv[1], "UTF-8") : "");
                }
            }
            if (params.containsKey("error")) {
                String html = "<html><body style='font-family:sans-serif;text-align:center;padding:50px;background:#0b0f19;color:#e5e7eb;'>" +
                        "<h1 style='color:#ef4444;'>❌ خطأ في تسجيل الدخول</h1>" +
                        "<p>" + escapeHtml(params.get("error_description")) + "</p>" +
                        "</body></html>";
                sendHtmlResponse(exchange, 400, html);
                return;
            }
            String code = params.get("code");
            if (code == null || code.isEmpty()) {
                        String html = "<html><body style='font-family:sans-serif;text-align:center;padding:50px;background:#0b0f19;color:#e5e7eb;'>" +
                                "<h1 style='color:#ef4444;'>❌ لم يتم إرسال رمز التفويض</h1>" +
                                "</body></html>";
                sendHtmlResponse(exchange, 400, html);
                return;
            }
            scheduler.execute(() -> {
                try {
                    String requestBody = "grant_type=authorization_code" +
                            "&client_id=" + URLEncoder.encode(KICK_BOT_CLIENT_ID, "UTF-8") +
                            "&client_secret=" + URLEncoder.encode(KICK_BOT_CLIENT_SECRET, "UTF-8") +
                            "&code=" + URLEncoder.encode(code, "UTF-8") +
                            "&redirect_uri=" + URLEncoder.encode(KICK_BOT_REDIRECT_URL, "UTF-8");
                    HttpURLConnection conn = (HttpURLConnection) new URL("https://id.kick.com/oauth/token").openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                    conn.setDoOutput(true);
                    conn.getOutputStream().write(requestBody.getBytes(StandardCharsets.UTF_8));

                    if (conn.getResponseCode() == 200) {
                        String response = readStream(conn.getInputStream());
                        userAccessToken = extractJsonValue(response, "access_token");
                        userRefreshToken = extractJsonValue(response, "refresh_token");
                        if (userAccessToken != null) {
                            userExpiresAt = System.currentTimeMillis() + 3600_000;
                        }
                        System.out.println("[JavaBotServer] OAuth success");
                        String html = "<html><body style='font-family:sans-serif;text-align:center;padding:50px;background:#0b0f19;color:#e5e7eb;'>" +
                                "<h1 style='color:#4ade80;'>✅ تم تسجيل الدخول بنجاح!</h1>" +
                                "<p>البوت متصل بحسابك على Kick</p>" +
                                "</body></html>";
                        sendHtmlResponse(exchange, 200, html);
                    } else {
                        String html = "<html><body style='font-family:sans-serif;text-align:center;padding:50px;background:#0b0f19;color:#e5e7eb;'>" +
                                "<h1 style='color:#ef4444;'>❌ خطأ في العملية</h1>" +
                                "</body></html>";
                        sendHtmlResponse(exchange, 500, html);
                    }
                } catch (Exception e) {
                    String html = "<html><body style='font-family:sans-serif;text-align:center;padding:50px;background:#0b0f19;color:#e5e7eb;'>" +
                            "<h1 style='color:#ef4444;'>❌ خطأ في العملية</h1>" +
                            "<p>" + escapeHtml(e.getMessage()) + "</p>" +
                            "</body></html>";
                    sendHtmlResponse(exchange, 500, html);
                }
            });
            sendCorsHeaders(exchange);
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        }
    }

    private static void sendHtmlResponse(HttpExchange exchange, int status, String html) throws IOException {
        byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
        sendCorsHeaders(exchange);
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&").replace("<", "<").replace(">", ">").replace("\"", """);
    }
}
