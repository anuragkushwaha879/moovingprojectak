# Mooving CRM — Firebase Hosting par Deploy karne ke Steps

## Asal Problem kya thi
Aap file ko seedha apne computer se double-click karke khol rahe the
(`file:///C:/Users/.../Projects.html`). Browser security rules
`<script type="module">` — jisme `import`/`export` hote hain — ko
`file://` se load karne hi nahi dete (CORS error). Ye sirf ek real
web server (http:// ya https://) se hi kaam karta hai. Firebase
Hosting automatically https:// deta hai, isliye deploy karte hi ye
problem khatam ho jayegi.

## Zaroori cheezein (ek baar install karna hai)
1. **Node.js** install hona chahiye (agar nahi hai): https://nodejs.org
   (LTS version le lein)
2. Terminal / Command Prompt kholiye aur ye chalayein (ek baar hi
   karna hai, poore system ke liye):
   ```
   npm install -g firebase-tools
   ```

## Deploy karne ke steps

1. Is poore `firebase-deploy` folder ko apne computer par kisi bhi
   jagah rakh lein (jaise Desktop par).

2. Terminal / Command Prompt kholiye aur isi folder ke andar jaayein:
   ```
   cd path/to/firebase-deploy
   ```
   (jahan aapne folder rakha hai wahan ka actual path daalein)

3. Firebase me login karein (browser khulega, apne Google account se
   login karein jisse Firebase project bana hai):
   ```
   firebase login
   ```

4. Ab deploy karein — dono Hosting aur Firestore rules ek saath:
   ```
   firebase deploy
   ```

5. Deploy poora hone ke baad terminal me ek link dikhega jaise:
   ```
   Hosting URL: https://anurag-kushwaha-projects.web.app
   ```
   Yahi aapki live site hai — is link ko browser me kholiye (seedha
   file double-click nahi karna, hamesha ye link use karna).

## Aage se koi bhi file update karni ho to
Jab bhi koi HTML/JS file me change karna ho:
1. `public/` folder ke andar wahi file replace kar dein
2. Dobara `firebase deploy` chala dein — bas itna hi, purani site
   automatically overwrite ho jayegi.

Sirf Firestore rules change karni ho to (jaldi):
```
firebase deploy --only firestore:rules
```

Sirf website files change karni ho to (jaldi):
```
firebase deploy --only hosting
```

## Agar `firebase deploy` mein koi error aaye
- "No project active" ya project mismatch → check karein ki
  `.firebaserc` file mein `anurag-kushwaha-projects` hi likha hai
  (ye aapke Firebase config mein diye gaye project ID se match
  karna chahiye — Firebase Console mein project settings mein
  confirm kar sakte hain).
- Login expire ho gaya ho → `firebase login --reauth` chalayein.

## Deploy ke baad bhi kuch na chale to
Browser mein F12 dabaiye, Console tab dekhiye, aur wahan jo bhi
red error dikhe uska screenshot bhej dein.
