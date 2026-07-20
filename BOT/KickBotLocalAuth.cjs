const http = require('http');
const crypto = require('crypto');
const url = require('url');

const CLIENT_ID = "01KY03CFGDSGNBTE6YRH37DSR0";
const CLIENT_SECRET = "49209fa42fc9945c67b6415c23fad89ef292403fead8b71f92d7112bb517b5e5";
const REDIRECT_URI = "http://localhost:3002/callback";

// استخدام verifier ثابت لتجنب ضياعه إذا توقف السيرفر
const codeVerifier = "iABS_BOT_super_secret_code_verifier_1234567890_iABS";
const sha256 = crypto.createHash('sha256').update(codeVerifier).digest();
const codeChallenge = sha256.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const STATE = "random_state_12345";

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname === '/callback') {
        const authCode = parsedUrl.query.code;
        if (authCode) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1 style="color:green; text-align:center; font-family:sans-serif; margin-top:50px;">تم الربط بنجاح! عد إلى المحادثة لترى الـ Tokens.</h1>');
            
            try {
                await exchangeCodeForToken(authCode);
            } catch (err) {
                console.error("[-] فشل استبدال الكود بـ Token:", err.message);
            }
        } else {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Error</h1><p>No authorization code found in redirect.</p>');
        }
    }
});

server.listen(3002, () => {
    console.log("[+] السيرفر المحلي يعمل الآن على المنفذ 3002 بانتظار عملية التفويض...");

    const authUrl = `https://id.kick.com/oauth/authorize?` +
        `response_type=code` +
        `&client_id=${CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent("chat:write user:read events:subscribe channel:read")}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256` +
        `&state=${STATE}`;

    console.log("\n========================================================");
    console.log("الرجاء نسخ هذا الرابط وفتحه في المتصفح لتفويض البوت:");
    console.log(authUrl);
    console.log("========================================================\n");
});

async function exchangeCodeForToken(authCode) {
    console.log("[+] جاري إرسال طلب استبدال الكود بـ Token إلى Kick...");
    
    const requestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: authCode,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier
    }).toString();

    const fetchRes = await fetch("https://id.kick.com/oauth/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: requestBody
    });

    const responseText = await fetchRes.text();
    console.log("\n[+] الرد المستلم من Kick (يحتوي على الـ Tokens الخاصة بالبوت):");
    console.log(responseText);
    
    process.exit(0);
}
