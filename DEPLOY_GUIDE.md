# Voteraction: डोमेन और गूगल लॉगिन सेटअप गाइड

आपका प्रीमियम लैंडिंग पेज और डैशबोर्ड तैयार है। अब इसे `voteraction.creatiav.com` पर लाइव करने और गूगल लॉगिन जोड़ने के लिए नीचे दिए गए स्टेप्स फॉलो करें:

## 1. डोमेन और सब-डोमेन सेटअप (voteraction.creatiav.com)

अपने डोमेन (creatiav.com) के DNS मैनेजमेंट पैनल (जैसे Cloudflare, GoDaddy, या Namecheap) में जाएँ और ये सेटिंग्स करें:

- **Type:** `A` Record
- **Name (Host):** `voteraction`
- **Value (Points to):** आपकी सर्वर की Public IP (उदा. `123.123.123.123`)
- **TTL:** `Auto` या `3600`

---

## 2. सर्वर पर Nginx सेटअप (Reverse Proxy)

अगर आप Ubuntu/Debian सर्वर इस्तेमाल कर रहे हैं, तो Nginx कॉन्फ़िगरेशन ऐसे रखें:

```nginx
server {
    listen 80;
    server_name voteraction.creatiav.com;

    location / {
        proxy_pass http://localhost:3000; # आपका Next.js एप्प यहाँ चल रहा है
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**SSL (HTTPS) के लिए:** `certbot` इस्तेमाल करें:
`sudo certbot --nginx -d voteraction.creatiav.com`

---

## 3. गूगल लॉगिन (Google Auth) सेटअप

गूगल लॉगिन जोड़ने के लिए हम `auth.js` (NextAuth) का उपयोग करेंगे। 

### स्टेप A: Google Cloud Console सेटिंग
1. [Google Cloud Console](https://console.cloud.google.com/) पर जाएँ।
2. एक नया प्रोजेक्ट बनाएं: **"Voteraction"**।
3. **APIs & Services > Credentials** पर जाएँ।
4. **Create Credentials > OAuth Client ID** चुनें।
5. **Authorized JavaScript origins:** `https://voteraction.creatiav.com`
6. **Authorized redirect URIs:** `https://voteraction.creatiav.com/api/auth/callback/google`
7. यहाँ से आपको `Client ID` और `Client Secret` मिलेगा।

### स्टेप B: .env फाइल में अपडेट
अपनी `.env` फाइल में ये जोड़ें:
```env
GOOGLE_CLIENT_ID="आपका_क्लाइंट_आईडी"
GOOGLE_CLIENT_SECRET="आपका_क्लाइंट_सीक्रेट"
NEXTAUTH_SECRET="कोई_भी_रैंडम_पासवर्ड_कोड"
NEXTAUTH_URL="https://voteraction.creatiav.com"
```

### स्टेप C: कोड में लागू करना
पूरी तरह से सुरक्षित लॉगिन के लिए हमें `npm install next-auth` करना होगा और `src/app/api/auth/[...nextauth]/route.ts` फाइल सेटअप करनी होगी।

---

## अगला कदम:
क्या आप चाहते हैं कि मैं **गूगल लॉगिन का पूरा कोड $(\text{Auth.js})$** अभी इस प्रोजेक्ट में लिख दूँ? 
इससे आपकी एप्प में असली 'Sign in with Google' बटन काम करने लगेगा।
