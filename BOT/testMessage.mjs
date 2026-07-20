import https from 'https';

const ACCESS_TOKEN = "MTU4YJK4N2UTMDE1YI0ZYZY2LTHHYJYTNDQ2YJJMMWMZNJZH";
const CHANNEL_SLUG = "iabs_bot";

async function fetchChannelId() {
    console.log(`[+] جاري جلب رقم الشات (Chatroom ID) للقناة: ${CHANNEL_SLUG} عبر Proxy...`);
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://kick.com/api/v1/channels/${CHANNEL_SLUG}`)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) {
        throw new Error(`فشل جلب بيانات القناة. الحالة: ${res.status}`);
    }
    const data = await res.json();
    return data.chatroom.id;
}

async function sendMessage(chatroomId) {
    console.log(`[+] جاري إرسال رسالة إلى الشات رقم ${chatroomId}...`);
    const res = await fetch(`https://api.kick.com/public/v1/chatrooms/${chatroomId}/messages`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            content: "مرحباً! أنا البوت iABSBOT وتم تفعيلي بنجاح من الخادم المحلي! 🚀🤖",
            type: "message"
        })
    });

    if (res.ok) {
        const json = await res.json();
        console.log("[+] تم إرسال الرسالة بنجاح!");
        console.log(json);
    } else {
        const text = await res.text();
        console.error("[-] فشل إرسال الرسالة. الحالة:", res.status);
        console.error("الرد:", text);
    }
}

async function main() {
    try {
        const chatroomId = await fetchChannelId();
        await sendMessage(chatroomId);
    } catch (e) {
        console.error("خطأ عام:", e.message);
    }
}

main();
