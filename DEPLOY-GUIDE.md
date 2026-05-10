# 🚀 AIRIS Deployment Guide - Vercel (FREE)

## **⏱️ Total Time: 10 minutes**

---

## **📋 WHAT YOU NEED:**

1. ✅ Computer with internet
2. ✅ Email address (for accounts)
3. ✅ Browser (Chrome/Firefox/Edge)
4. ✅ The `deploy` folder I just created

---

## **🎯 STEP 1: Sign Up to Vercel** (2 min)

### **Action:**
1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** OR **"Continue with Email"**
4. Verify your email

✅ Account created!

---

## **🎯 STEP 2: Sign Up to GitHub** (2 min)

### **Action:**
1. Go to **https://github.com**
2. Click **"Sign Up"**
3. Use same email as Vercel
4. Verify email

✅ GitHub account ready!

---

## **🎯 STEP 3: Upload Code to GitHub** (3 min)

### **Easy Way - Web Upload:**

1. Login to GitHub
2. Click **"+"** icon top right → **"New repository"**
3. Repository name: `airis-app`
4. Set as **Public**
5. Click **"Create repository"**

6. On the empty repo page, click **"uploading an existing file"** link

7. **Drag and drop** ALL files from the `deploy` folder:
   - `package.json`
   - `vite.config.js`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `index.html`
   - `src/` folder (with App.jsx, main.jsx, index.css)

8. Scroll down → Click **"Commit changes"**

✅ Code uploaded!

---

## **🎯 STEP 4: Deploy to Vercel** (3 min)

1. Go to **https://vercel.com/dashboard**
2. Click **"Add New..."** → **"Project"**
3. Click **"Import"** next to your `airis-app` repo
4. Vercel auto-detects it's a Vite project
5. Click **"Deploy"**

⏳ Wait 1-2 minutes...

✅ **DONE!**

---

## **🎉 YOUR APP IS LIVE!**

You'll get a URL like:
```
https://airis-app.vercel.app
```

Or:
```
https://airis-app-yourname.vercel.app
```

**Open in any browser - all buttons will work!** ✅

---

## **🔄 FUTURE UPDATES:**

When you want to update the app:

1. Edit files on GitHub (or upload new ones)
2. Vercel **auto-deploys** in 1 minute
3. Your URL stays the same

---

## **📱 USE ON PHONE:**

1. Open Vercel URL on phone
2. Tap browser menu → **"Add to Home Screen"**
3. App icon appears like real app!

---

## **🆓 ALL FREE:**

- ✅ Vercel: 100GB bandwidth/month FREE
- ✅ GitHub: Unlimited public repos FREE
- ✅ Custom domain: Optional ($10/year)

For a small business, FREE tier is more than enough!

---

## **❓ TROUBLESHOOTING:**

### **Build Failed:**
- Check `package.json` is uploaded
- Check all files in correct folders

### **Page Blank:**
- Check browser console (F12)
- Look for errors

### **Buttons still not working:**
- Try Incognito mode first
- Check if running on Vercel URL (not localhost)

---

## **🎯 OPTIONAL: Add Custom Domain**

After deployment:
1. Buy domain (e.g., `airis.my`) from Namecheap/Cloudflare
2. In Vercel → Settings → Domains
3. Add domain
4. Follow DNS instructions
5. SSL auto-configured!

---

## **✅ CHECKLIST:**

- [ ] Created Vercel account
- [ ] Created GitHub account
- [ ] Uploaded files to GitHub
- [ ] Deployed to Vercel
- [ ] Got live URL
- [ ] Tested on browser (no extension issues!)
- [ ] All buttons work ✅

---

## **🎁 BONUS: Multi-User with Firebase**

For team to share data in real-time, see `firebase-setup.md` (next file).

Without Firebase: Each device has its own data (localStorage)
With Firebase: All team sees same data live

---

**🎉 Congratulations! Your AIRIS app is deployed!**

Share your URL with team members - they can use it from anywhere! 🚀
