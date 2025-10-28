# 🚀 Quick Start Guide - Authentication Setup

**Complete these steps to enable authentication in your Vismyras app**

---

## ⚡ 5-Minute Setup

### Step 1: Create Supabase Account (2 minutes)

1. **Go to**: https://supabase.com/
2. **Sign up** with GitHub or Google
3. **Create project**: Name it `vismyras`
4. **Wait**: 2-3 minutes for database setup

### Step 2: Get Your API Keys (1 minute)

1. **In Supabase dashboard**: Settings → API
2. **Copy**:
   - Project URL: `https://xxxxx.supabase.co`
   - anon public key: `eyJhbG...`

### Step 3: Add Keys to Project (30 seconds)

Open `.env.local` and update:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Set Up Database (1 minute)

1. **In Supabase**: SQL Editor → New query
2. **Copy & paste** this SQL:

```sql
-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL CHECK (auth_provider IN ('email', 'google')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user billing table
CREATE TABLE IF NOT EXISTS public.user_billing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  billing_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for user_billing
CREATE POLICY "Users can read own billing" ON public.user_billing FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own billing" ON public.user_billing FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own billing" ON public.user_billing FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_billing_user_id ON public.user_billing(user_id);
```

3. **Click**: Run (bottom right)

### Step 5: Start Your App (30 seconds)

```powershell
npm run dev
```

---

## ✅ Test Authentication

### Test Email Signup

1. **Open**: http://localhost:5173
2. **Click**: "Sign In" (top right)
3. **Click**: "Sign up" tab
4. **Enter**:
   - Name: Your Name
   - Email: test@example.com
   - Password: test1234
5. **Click**: "Create Account"

✅ **Success!** You should see a welcome message!

### Test Login

1. **Logout** (user menu → logout)
2. **Click**: "Sign In"
3. **Enter**: Same credentials
4. **Click**: "Sign In"

✅ **Success!** You're logged in!

### Verify in Supabase

1. **Go to**: Supabase Dashboard → Authentication → Users
2. **You should see**: Your test user! 🎉

---

## 🔐 Optional: Setup Google OAuth (10 minutes)

### Step 1: Enable in Supabase

1. **Supabase Dashboard**: Authentication → Providers
2. **Find**: Google
3. **Toggle**: Enable
4. **Copy**: Redirect URL (save for later)

### Step 2: Create Google OAuth App

1. **Go to**: https://console.cloud.google.com/
2. **Create project**: `Vismyras`
3. **APIs & Services** → **Credentials**
4. **Create Credentials** → **OAuth client ID**
5. **Configure consent screen**:
   - App name: `Vismyras`
   - User support: Your email
   - Save
6. **Create OAuth Client**:
   - Type: Web application
   - Name: `Vismyras Auth`
   - Authorized redirect URIs: (paste Supabase redirect URL)
   - Create

### Step 3: Add to Supabase

1. **Copy**: Client ID & Secret from Google
2. **Back to Supabase**: Authentication → Providers → Google
3. **Paste**: Client ID & Secret
4. **Save**

### Step 4: Test Google OAuth

1. **In your app**: Click "Sign In"
2. **Click**: "Sign in with Google"
3. **Select**: Your Google account

✅ **Success!** Logged in with Google!

---

## 📚 What Works Now

### Authentication ✅
- Email/password signup
- Login with credentials
- Google OAuth (if configured)
- Automatic session persistence
- User profiles with avatars

### Data Sync ✅
- Billing data backed up to cloud
- Usage tracked per user
- Subscriptions saved permanently
- Cross-device synchronization

### Security ✅
- JWT-based authentication
- Row Level Security (RLS)
- Encrypted passwords
- Secure sessions

### UI ✅
- Beautiful auth modal
- User menu with avatar
- Sign in/out buttons
- Loading states

---

## 🔧 Troubleshooting

### "Supabase client not initialized"

**Fix**: Check `.env.local` has correct values, restart dev server

### Google OAuth fails

**Fix**: Verify redirect URI matches exactly in both Google Console and Supabase

### Can't see user in database

**Fix**: Check SQL ran successfully, verify RLS policies exist

### Session not persisting

**Fix**: Clear browser localStorage, login again

---

## 📖 Full Documentation

For complete setup instructions including:
- Production deployment
- Email verification
- Password reset
- Security best practices
- Database schema details

**See**: `SUPABASE_SETUP_GUIDE.md`

---

## 🎉 You're Ready!

Your app now has:
- ✅ Professional authentication
- ✅ User accounts
- ✅ Cloud data backup
- ✅ Google OAuth (optional)
- ✅ Secure sessions

**Start building amazing features!** 🚀

---

**Need Help?**
- **Setup Guide**: `SUPABASE_SETUP_GUIDE.md`
- **Implementation Details**: `AUTH_IMPLEMENTATION_SUMMARY.md`
- **Supabase Docs**: https://supabase.com/docs
