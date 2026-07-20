import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

public class KickBotLocalAuth {

    private static final String CLIENT_ID = "01KY03CFGDSGNBTE6YRH37DSR0"; 
    private static final String CLIENT_SECRET = "49209fa42fc9945c67b6415c23fad89ef292403fead8b71f92d7112bb517b5e5";
    private static final String REDIRECT_URI = "http://localhost:3002/callback";
    
    private static String codeVerifier;
    private static String codeChallenge;
    private static final String STATE = "random_state_12345";

    public static void main(String[] args) throws Exception {
        generatePkce();

        HttpServer server = HttpServer.create(new InetSocketAddress(3002), 0);
        server.createContext("/callback", new CallbackHandler());
        server.setExecutor(null); 
        server.start();
        System.out.println("[+] السيرفر المحلي يعمل الآن على المنفذ 3002 بانتظار عملية التفويض...");

        String authUrl = "https://id.kick.com/oauth/authorize?" +
                "response_type=code" +
                "&client_id=" + CLIENT_ID +
                "&redirect_uri=" + URLEncoder.encode(REDIRECT_URI, StandardCharsets.UTF_8) +
                "&scope=" + URLEncoder.encode("chat:write user:read events:subscribe channel:read", StandardCharsets.UTF_8) +
                "&code_challenge=" + codeChallenge +
                "&code_challenge_method=S256" +
                "&state=" + STATE;

        System.out.println("\n========================================================");
        System.out.println("الرجاء نسخ هذا الرابط وفتحه في المتصفح لتفويض البوت:");
        System.out.println(authUrl);
        System.out.println("========================================================\n");
    }

    private static void generatePkce() throws Exception {
        SecureRandom sr = new SecureRandom();
        byte[] code = new byte[32];
        sr.nextBytes(code);
        codeVerifier = Base64.getUrlEncoder().withoutPadding().encodeToString(code);

        byte[] bytes = codeVerifier.getBytes(StandardCharsets.US_ASCII);
        MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
        byte[] digest = messageDigest.digest(bytes);
        codeChallenge = Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
    }

    static class CallbackHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            URI requestURI = exchange.getRequestURI();
            String query = requestURI.getQuery();
            Map<String, String> params = queryToMap(query);

            String responseText;
            if (params.containsKey("code")) {
                String authCode = params.get("code");
                responseText = "<h1>Done! Authorization successful.</h1><p>You can close this window and check the console.</p>";
                
                sendResponse(exchange, responseText, 200);

                try {
                    exchangeCodeForToken(authCode);
                } catch (Exception e) {
                    System.err.println("[-] فشل استبدال الكود بـ Token: " + e.getMessage());
                }
            } else {
                responseText = "<h1>Error</h1><p>No authorization code found in redirect.</p>";
                sendResponse(exchange, responseText, 400);
            }
        }

        private void sendResponse(HttpExchange exchange, String text, int statusCode) throws IOException {
            byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(statusCode, bytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(bytes);
            os.close();
        }

        private void exchangeCodeForToken(String authCode) throws Exception {
            System.out.println("[+] جاري إرسال طلب استبدال الكود بـ Token إلى Kick...");
            
            HttpClient client = HttpClient.newHttpClient();
            
            String requestBody = "grant_type=authorization_code" +
                    "&client_id=" + CLIENT_ID +
                    "&client_secret=" + CLIENT_SECRET +
                    "&code=" + authCode +
                    "&redirect_uri=" + URLEncoder.encode(REDIRECT_URI, StandardCharsets.UTF_8) +
                    "&code_verifier=" + codeVerifier;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://id.kick.com/oauth/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            System.out.println("\n[+] الرد المستلم من Kick (يحتوي على الـ Tokens الخاصة بالبوت):");
            System.out.println(response.body());
            System.out.println("\n[!] احفظ الـ access_token الموضح في الأعلى؛ هذا هو مفتاحك لإرسال الرسائل!");
            
            // To ensure the user sees this quickly, we exit.
            System.exit(0);
        }

        private Map<String, String> queryToMap(String query) {
            Map<String, String> result = new HashMap<>();
            if (query == null) return result;
            for (String param : query.split("&")) {
                String[] entry = param.split("=");
                if (entry.length > 1) {
                    result.put(entry[0], entry[1]);
                } else {
                    result.put(entry[0], "");
                }
            }
            return result;
        }
    }
}
