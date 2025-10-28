<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 👗 Vismyras - AI Virtual Try-On Platform

**Professional SaaS Platform with Authentication, Payments & Cloud Sync**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/designvibes3366/Vismyras)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-Apache--2.0-green.svg)](LICENSE)

**Try your clothes virtually with AI • Sign up • Get 3 free try-ons**

[Live Demo](https://vismyras.vercel.app) • [Documentation](./VERCEL_DEPLOY_GUIDE.md) • [Report Bug](https://github.com/designvibes3366/Vismyras/issues)

</div>

---

## ✨ Features

### 🤖 AI-Powered Virtual Try-On
- Photo-realistic garment try-on using Google Gemini AI
- Multiple pose variations (6 different poses)
- AI style editing via chat
- Instant generation (5-10 seconds)

### 🔐 User Authentication
- Email/password signup & login
- Google OAuth integration
- Secure JWT sessions
- Cloud profile storage

### 💳 Payment System
- Monthly subscriptions (₹199/month for 25 try-ons)
- Pay-per-use credits (₹29 per try-on)
- Razorpay integration
- Automatic usage tracking

### ☁️ Cloud Data Sync
- Cross-device synchronization
- Supabase backend
- Never lose your data
- Real-time updates

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- API keys (Gemini, Supabase, Razorpay)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/designvibes3366/Vismyras.git
   cd Vismyras
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` file:
   ```bash
   # Google Gemini AI
   GEMINI_API_KEY=your_gemini_api_key
   
   # Razorpay (Use test keys for development)
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=your_secret
   
   # Supabase
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

5. **Build for production**
   ```bash
   npm run build
   ```

---

## 📚 Documentation

### Setup Guides
- **[Quick Start Auth](./QUICK_START_AUTH.md)** - 5-minute Supabase setup
- **[Supabase Setup](./SUPABASE_SETUP_GUIDE.md)** - Complete authentication guide
- **[Razorpay Setup](./RAZORPAY_SETUP_GUIDE.md)** - Payment integration
- **[Vercel Deploy](./VERCEL_DEPLOY_GUIDE.md)** - Deploy to production

### Implementation Details
- **[Auth Implementation](./AUTH_IMPLEMENTATION_SUMMARY.md)** - Authentication system
- **[Payment Implementation](./PAYMENT_IMPLEMENTATION_SUMMARY.md)** - Billing system
- **[Complete Architecture](./COMPLETE_ARCHITECTURE.md)** - Full system overview

---

## 🏗️ Tech Stack

**Frontend**
- React 19.1 + TypeScript 5.8
- Vite 6.2 (Build tool)
- Framer Motion 11.2 (Animations)
- Tailwind CSS (Styling)

**Backend & Services**
- Supabase (Auth + Database)
- Google Gemini AI (Virtual try-on)
- Razorpay (Payments)
- IndexedDB (Image storage)

**Deployment**
- Vercel (Hosting + CI/CD)
- Global CDN
- Automatic SSL

---

## 🎯 Subscription Plans

| Plan | Price | Try-Ons/Month | Features |
|------|-------|---------------|----------|
| **Free** | ₹0 | 3 | Basic features, all clothing categories |
| **Premium** | ₹199 | 25 | Priority generation, unlimited poses, AI editing |

**Pay-Per-Use Options:**
- 1 try-on: ₹29
- 5 try-ons: ₹129 (Save 11%)
- 10 try-ons: ₹249 (Save 14%)

---

## 🚀 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/designvibes3366/Vismyras)

### Manual Deploy

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add environment variables in Vercel dashboard**
   - Settings → Environment Variables
   - Add all keys from `.env.local`

4. **Redeploy**
   ```bash
   vercel --prod
   ```

**See [VERCEL_DEPLOY_GUIDE.md](./VERCEL_DEPLOY_GUIDE.md) for detailed instructions**

---

## 📁 Project Structure

```
Vismyras/
├── components/          # React components
│   ├── AuthModal.tsx   # Authentication modal
│   ├── PaywallModal.tsx # Payment/subscription
│   ├── Canvas.tsx      # Main display
│   └── ...
├── services/           # Business logic
│   ├── supabaseService.ts  # Authentication
│   ├── billingService.ts   # Usage tracking
│   ├── razorpayService.ts  # Payments
│   └── geminiService.ts    # AI try-on
├── types/              # TypeScript types
├── public/             # Static assets
├── vercel.json         # Vercel config (routing)
└── vite.config.ts      # Build config
```

---

## 🔐 Security

- ✅ JWT-based authentication
- ✅ Row Level Security (RLS) on database
- ✅ Encrypted password storage (bcrypt)
- ✅ HTTPS enforced
- ✅ Environment variable protection
- ✅ Rate limiting on API calls

---

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Test Credentials (Development)

**Razorpay Test Cards:**
- Success: `4111 1111 1111 1111`
- Declined: `4000 0000 0000 0002`

---

## 📊 Performance

- ⚡ First load: ~1-2 seconds
- 📦 Bundle size: ~260 KB (gzipped)
- 🎯 Lighthouse score: 90+
- 🌍 Global CDN delivery
- 📱 Mobile responsive

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - AI virtual try-on
- [Supabase](https://supabase.com/) - Authentication & database
- [Razorpay](https://razorpay.com/) - Payment processing
- [Vercel](https://vercel.com/) - Hosting & deployment

---

## 📧 Support

- 📖 [Documentation](./VERCEL_DEPLOY_GUIDE.md)
- 🐛 [Report Issues](https://github.com/designvibes3366/Vismyras/issues)
- 💬 [Discussions](https://github.com/designvibes3366/Vismyras/discussions)

---

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

<div align="center">

**Built with ❤️ for fashion enthusiasts**

[Website](https://vismyras.vercel.app) • [GitHub](https://github.com/designvibes3366/Vismyras)

</div>
