# ⚡ Quick Deploy Cheatsheet

## 🚀 Deploy to Vercel (2 Minutes)

### Option 1: CLI Deploy
```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add GEMINI_API_KEY
vercel env add RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### Option 2: GitHub Deploy (Recommended)
1. Push to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables
5. Click "Deploy"

---

## 📋 Environment Variables Checklist

```bash
✅ GEMINI_API_KEY          # From ai.google.dev
✅ RAZORPAY_KEY_ID         # From dashboard.razorpay.com
✅ RAZORPAY_KEY_SECRET     # From dashboard.razorpay.com
✅ VITE_SUPABASE_URL       # From supabase.com/dashboard
✅ VITE_SUPABASE_ANON_KEY  # From supabase.com/dashboard
```

---

## 🔧 After Deployment Checklist

### 1. Update Supabase URLs
```
Supabase Dashboard → Authentication → URL Configuration

Site URL: https://your-app.vercel.app
Redirect URLs: https://your-app.vercel.app/**
```

### 2. Update Google OAuth (if using)
```
Google Cloud Console → APIs & Services → Credentials

Authorized JavaScript origins:
  https://your-app.vercel.app

Authorized redirect URIs:
  https://xxxxx.supabase.co/auth/v1/callback
```

### 3. Switch Razorpay to Live Mode
```
Dashboard → Mode Toggle → Live
Update keys in Vercel environment variables
```

---

## ✅ What's Configured

Your app is now Vercel-ready with:

- ✅ **vercel.json** - Routing configuration (no 404s)
- ✅ **.vercelignore** - Exclude unnecessary files
- ✅ **vite.config.ts** - Optimized builds with code splitting
- ✅ **Asset caching** - 1-year cache for static files
- ✅ **SPA fallback** - All routes redirect to index.html

---

## 🎯 Key Features

### No 404 Errors
```json
// vercel.json
"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
```

### Code Splitting
```
✅ react-vendor.js    (12 KB)
✅ framer-motion.js   (116 KB)
✅ supabase.js        (168 KB)
✅ index.js           (650 KB)
```

### Asset Caching
```
Cache-Control: public, max-age=31536000, immutable
```

---

## 🧪 Test Your Deployment

```bash
# Visit these URLs and verify:
https://your-app.vercel.app           # Homepage ✅
https://your-app.vercel.app/any-route # No 404 ✅
```

### Test Checklist
- [ ] Homepage loads
- [ ] Sign in works
- [ ] Virtual try-on works
- [ ] Payments work
- [ ] Refresh doesn't cause 404
- [ ] Mobile responsive
- [ ] No console errors

---

## 📊 Build Output

```
dist/
├── index.html                    (2 KB)
├── assets/
│   ├── index.css                 (0.8 KB)
│   ├── react-vendor.js           (12 KB)
│   ├── framer-motion.js          (116 KB)
│   ├── supabase.js               (168 KB)
│   └── index.js                  (650 KB)
```

**Total gzipped**: ~260 KB

---

## 🔄 Continuous Deployment

### Auto-Deploy on Push
```
git push origin main
    ↓
Vercel detects change
    ↓
Builds automatically
    ↓
Deploys to production
    ↓
✅ Live in 1-2 minutes
```

### Preview Deployments
Every branch/PR gets a preview URL:
```
https://vismyras-git-feature-name.vercel.app
```

---

## 🐛 Common Issues & Fixes

### 404 on page refresh
**Fix**: Ensure `vercel.json` has rewrite rules
```powershell
# Verify file exists
cat vercel.json
```

### Environment variables not working
**Fix**: Add in Vercel dashboard and redeploy
```
Settings → Environment Variables → Add
Then: Deployments → Redeploy
```

### Build fails
**Fix**: Test build locally first
```powershell
npm run build
# Fix any errors, then redeploy
```

---

## 📞 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Razorpay Dashboard**: https://dashboard.razorpay.com
- **Google Console**: https://console.cloud.google.com

---

## 🎉 You're Done!

Your app is:
- ✅ Vercel-ready
- ✅ No 404 errors
- ✅ Optimized builds
- ✅ Auto-deployed
- ✅ Global CDN
- ✅ Secure HTTPS

**Deploy now with: `vercel`** 🚀
