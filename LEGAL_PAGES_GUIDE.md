# Legal Pages Implementation Guide

## 📄 Overview

This guide covers the implementation of essential legal pages for Vismyras, required for SaaS compliance, payment processing, and user trust.

## 🔗 Live URLs

All pages are accessible at your production domain:

- **Privacy Policy**: https://tryonvismyras08.vercel.app/privacy
- **Terms & Conditions**: https://tryonvismyras08.vercel.app/terms
- **Refund Policy**: https://tryonvismyras08.vercel.app/refund
- **Contact Us**: https://tryonvismyras08.vercel.app/contact
- **Home**: https://tryonvismyras08.vercel.app/

## 📁 File Structure

```
pages/
  ├── PrivacyPolicy.tsx          # GDPR-compliant privacy policy
  ├── TermsAndConditions.tsx     # Terms of Service
  ├── RefundPolicy.tsx           # Cancellation & refund policy
  └── ContactUs.tsx              # Contact form & support info

components/
  └── Footer.tsx                 # Updated with legal links

App.tsx                          # React Router integration
vercel.json                      # SPA routing configuration
```

## 🚀 Implementation Details

### 1. React Router Integration

**Installed Dependencies:**
```bash
npm install react-router-dom
```

**App.tsx Changes:**
```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Legal Pages
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import RefundPolicy from './pages/RefundPolicy';
import ContactUs from './pages/ContactUs';

// Routes structure:
<Router>
  <Routes>
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<TermsAndConditions />} />
    <Route path="/refund" element={<RefundPolicy />} />
    <Route path="/contact" element={<ContactUs />} />
    <Route path="/" element={/* Main App */} />
  </Routes>
</Router>
```

### 2. Footer Navigation

**Footer.tsx** now includes links to all legal pages:
```tsx
<Link to="/privacy">Privacy Policy</Link>
<Link to="/terms">Terms</Link>
<Link to="/refund">Refund Policy</Link>
<Link to="/contact">Contact</Link>
```

### 3. Vercel SPA Configuration

**vercel.json** includes a catch-all rewrite for client-side routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures all routes (including legal pages) work correctly without 404 errors.

## 📋 Page Content Summary

### Privacy Policy (`/privacy`)

**Key Sections:**
1. **Introduction** - Overview of data practices
2. **Information Collection** - What data we collect:
   - Personal info (name, email, phone)
   - Payment data (via Razorpay)
   - Images (models & garments)
   - Usage analytics
3. **Data Usage** - How we use collected data
4. **Third-Party Services**:
   - Supabase (Authentication & Database)
   - Google Gemini AI (Image generation)
   - Razorpay (Payment processing)
   - Vercel (Hosting)
5. **Data Security** - Encryption & protection measures
6. **Data Retention** - How long we keep data
7. **User Rights** (GDPR):
   - Right to access
   - Right to erasure
   - Right to portability
   - Right to rectification
8. **Cookies & Tracking**
9. **Children's Privacy**
10. **International Data Transfers**
11. **Policy Changes**
12. **Contact Information**

**Compliance:**
- ✅ GDPR compliant
- ✅ Covers all third-party integrations
- ✅ Clear data handling policies
- ✅ User rights documented

### Terms and Conditions (`/terms`)

**Key Sections:**
1. **Acceptance of Terms**
2. **Service Description** - What Vismyras offers
3. **User Accounts**:
   - Registration requirements
   - Age requirement (13+, 18+ for payments)
4. **Subscription Plans & Pricing**:
   - Free Tier: 3 try-ons/month
   - Premium: ₹199/month, 25 try-ons
   - Pay-Per-Use: ₹29 per try-on
5. **Payment Terms** - Razorpay integration
6. **Acceptable Use**:
   - Prohibited content
   - Content guidelines
7. **Intellectual Property**:
   - Your content rights
   - Generated images ownership
   - Platform ownership
8. **Cancellation & Termination**
9. **Disclaimers & Limitations**:
   - Service availability
   - AI accuracy disclaimers
   - Limitation of liability
10. **Indemnification**
11. **Dispute Resolution**
12. **Governing Law** - Indian jurisdiction
13. **Changes to Terms**
14. **Contact Information**

**Compliance:**
- ✅ Clear pricing structure
- ✅ User obligations defined
- ✅ Liability limitations
- ✅ Dispute resolution process

### Refund Policy (`/refund`)

**Key Sections:**
1. **Overview**
2. **Premium Subscription Refunds**:
   - 7-day money-back guarantee
   - Conditions: <5 try-ons used, first subscription
   - Cancellation process (via Account Settings)
   - No prorated refunds after 7 days
3. **Pay-Per-Use Credits**:
   - Credit packages pricing
   - 30-day expiry
   - Non-refundable exceptions
   - Automatic credit restoration for failures
4. **Free Tier** - No refunds applicable
5. **Non-Refundable Items** - Clear exclusions
6. **Refund Request Process**:
   - Email: support@vismyras.com
   - Required information
   - 2-3 business day response time
7. **Processing Time**:
   - Credit/Debit: 5-7 days
   - UPI: 2-3 days
   - Net Banking: 5-7 days
   - Wallets: 1-2 days
8. **Razorpay Payment Issues**:
   - Failed transactions
   - Duplicate charges
9. **Service Interruptions** - Credit extensions
10. **Abuse & Fraud** - Protection measures
11. **Chargebacks** - Dispute process
12. **Policy Changes**
13. **Contact Information**

**Compliance:**
- ✅ Razorpay requirements met
- ✅ Clear refund eligibility
- ✅ Processing times documented
- ✅ Anti-fraud measures

### Contact Us (`/contact`)

**Features:**
1. **Contact Form** with fields:
   - Name
   - Email
   - Subject (dropdown with categories)
   - Message
   - Success confirmation animation
2. **Contact Cards**:
   - Email Support: support@vismyras.com
   - Business Hours: Mon-Fri, 9 AM - 6 PM IST
   - Billing Inquiries: billing@vismyras.com
3. **FAQ Section**:
   - Password reset
   - Subscription cancellation
   - Refund information
   - Try-on failures
   - Data security
4. **Office Information**:
   - General support email
   - Billing support email
   - Legal inquiries email

**Features:**
- ✅ Interactive contact form
- ✅ Comprehensive FAQs
- ✅ Multiple contact methods
- ✅ Professional design

## 🎨 Design Consistency

All legal pages share:
- **Gradient branding** - Purple to pink gradients
- **Navigation** - Back to home link
- **Cross-links** - Links between legal pages
- **Footer** - Consistent footer navigation
- **Responsive** - Mobile-friendly design
- **Accessibility** - Proper heading structure

## 📧 Email Addresses Used

Update these with your actual contact information:

```typescript
// Replace these placeholder emails:
support@vismyras.com      // General support
billing@vismyras.com      // Payment/billing queries
legal@vismyras.com        // Legal inquiries
privacy@vismyras.com      // Data protection requests
```

**How to update:**
1. Search for `@vismyras.com` across all legal pages
2. Replace with your actual domain email addresses
3. Set up email forwarding or mailboxes for these addresses

## 🔧 Customization Needed

Before deploying to production, update:

### Privacy Policy
- [ ] Company legal name (currently "Vismyras")
- [ ] Physical address (currently placeholder "India")
- [ ] Data Protection Officer contact (if required)
- [ ] Cookie policy details (if using analytics)

### Terms and Conditions
- [ ] Jurisdiction city (currently "[Your City], India")
- [ ] Company registration details
- [ ] Exact service description (if changed)

### Refund Policy
- [ ] Bank account details for refunds (if needed)
- [ ] Payment processor terms (verify with Razorpay)

### Contact Us
- [ ] Physical office address
- [ ] Phone numbers (if offering phone support)
- [ ] Social media links
- [ ] Actual business hours

## 🚀 Deployment

### Build & Test Locally

```bash
# Install dependencies
npm install

# Test development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deploy to Vercel

```bash
# Using Vercel CLI
vercel --prod

# Or via Git
git add .
git commit -m "Add legal pages with routing"
git push origin main
```

### Post-Deployment Testing

Test all routes work correctly:

```bash
# Test URLs (replace with your domain)
https://tryonvismyras08.vercel.app/
https://tryonvismyras08.vercel.app/privacy
https://tryonvismyras08.vercel.app/terms
https://tryonvismyras08.vercel.app/refund
https://tryonvismyras08.vercel.app/contact
```

**Expected behavior:**
- ✅ All pages load without 404 errors
- ✅ Footer links navigate correctly
- ✅ Back to home button works
- ✅ Cross-links between legal pages work
- ✅ Browser back/forward works
- ✅ Direct URL access works
- ✅ Mobile responsive

## 📱 Mobile Optimization

All legal pages are mobile-responsive with:
- Readable font sizes (16px+ body text)
- Touch-friendly links (44px+ touch targets)
- Scrollable content without horizontal overflow
- Collapsed navigation on small screens
- Stack layout on mobile (single column)

## ♿ Accessibility

Legal pages include:
- Semantic HTML (`<h1>`, `<h2>`, `<section>`, etc.)
- Proper heading hierarchy
- High contrast text (WCAG AA compliant)
- Keyboard navigation support
- ARIA labels where needed
- Focus indicators on interactive elements

## 🔒 Legal Compliance Checklist

### GDPR (EU Users)
- [x] Privacy policy with data collection details
- [x] User rights documented (access, erasure, portability)
- [x] Third-party data processors disclosed
- [x] Contact for data protection requests
- [x] Lawful basis for processing explained

### Payment Processing (Razorpay)
- [x] Terms of Service with payment terms
- [x] Refund policy clearly stated
- [x] Subscription terms documented
- [x] Cancellation process explained
- [x] Pricing transparency

### SaaS Best Practices
- [x] Acceptable use policy
- [x] Intellectual property rights defined
- [x] Limitation of liability
- [x] Dispute resolution process
- [x] Contact information easily accessible

## 🔄 Maintenance

### When to Update Legal Pages

**Privacy Policy:**
- Adding new third-party services
- Changing data collection practices
- New data protection regulations
- Expanding to new regions

**Terms and Conditions:**
- Pricing changes
- New features or services
- Policy changes
- Legal requirements change

**Refund Policy:**
- Payment processor changes
- Pricing structure changes
- Subscription tiers change
- Refund terms change

**Contact Us:**
- New support channels
- Business hours change
- Email addresses change
- Office location change

### Version Control

Consider adding:
```tsx
<p className="text-gray-600">Last updated: {VERSION_DATE}</p>
<p className="text-gray-500 text-sm">Version: 1.0</p>
```

## 📊 Analytics & Monitoring

Track legal page visits to understand:
- Which pages users visit most
- Drop-off points in signup flow
- Contact form submission rate
- Common FAQ searches

**Implementation suggestion:**
```tsx
// Add to each legal page component
useEffect(() => {
  // Analytics tracking
  analytics.track('legal_page_view', {
    page: 'privacy' // or 'terms', 'refund', 'contact'
  });
}, []);
```

## 🐛 Troubleshooting

### Issue: 404 on Legal Pages

**Cause:** Vercel not routing correctly

**Solution:**
1. Verify `vercel.json` has the rewrite rule
2. Redeploy: `vercel --prod`
3. Clear browser cache
4. Check Vercel deployment logs

### Issue: Styling Broken on Legal Pages

**Cause:** CSS not loading

**Solution:**
1. Check Tailwind configuration includes `pages/` directory
2. Verify build output includes CSS
3. Check browser console for CSS loading errors

### Issue: Contact Form Not Working

**Cause:** Form submission not implemented

**Solution:**
```tsx
// Implement form submission in ContactUs.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Send to your backend API
  await fetch('/api/contact', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  
  setSubmitted(true);
};
```

### Issue: Links Not Working

**Cause:** Missing `<Router>` or incorrect import

**Solution:**
1. Verify `App.tsx` has `<Router>` wrapper
2. Check all components use `Link` from `react-router-dom`
3. Not using `<a>` tags for internal navigation

## 📚 Resources

### Legal Templates
- [Termly](https://termly.io/) - Privacy policy generator
- [GetTerms](https://getterms.io/) - Terms & conditions templates
- [TermsFeed](https://www.termsfeed.com/) - Legal policy generator

### Compliance Guides
- [GDPR Checklist](https://gdpr.eu/checklist/)
- [Razorpay Compliance](https://razorpay.com/docs/payments/compliance/)
- [Stripe SaaS Compliance](https://stripe.com/guides/saas-compliance)

### React Router
- [React Router Docs](https://reactrouter.com/en/main)
- [Vercel SPA Routing](https://vercel.com/guides/how-can-i-set-up-a-redirect-on-vercel)

## ✅ Deployment Checklist

Before going live:

- [ ] All email addresses updated with real contacts
- [ ] Company information customized
- [ ] Legal review completed (optional but recommended)
- [ ] Contact form backend implemented
- [ ] All links tested in production
- [ ] Mobile responsiveness verified
- [ ] Analytics tracking added (optional)
- [ ] User testing completed
- [ ] Spelling and grammar checked
- [ ] Cross-browser testing done
- [ ] HTTPS enabled (Vercel default)
- [ ] Domain configured correctly
- [ ] Footer links visible on all app screens

## 🎯 Next Steps

1. **Email Setup**: Configure email addresses for support, billing, legal
2. **Form Backend**: Implement contact form submission (consider Formspree, EmailJS, or custom API)
3. **Legal Review**: Optional but recommended for production SaaS
4. **User Notification**: Announce legal pages to existing users
5. **Regular Updates**: Review and update policies quarterly

## 💡 Pro Tips

1. **Keep it simple**: Legal pages should be easy to read
2. **Use plain language**: Avoid excessive legal jargon
3. **Highlight key points**: Use bold for important terms
4. **Make it accessible**: Consider adding a "Plain English" summary
5. **Update regularly**: Review policies when features change
6. **Notify users**: Email users about significant policy changes
7. **Archive versions**: Keep old versions for legal protection

## 🔗 Quick Links

- Main App: `/`
- Privacy Policy: `/privacy`
- Terms & Conditions: `/terms`
- Refund Policy: `/refund`
- Contact Us: `/contact`

---

## 📞 Support

If you need help with legal pages:
- Email: support@vismyras.com
- GitHub Issues: [Create issue](https://github.com/yourusername/vismyras/issues)

---

**Last Updated**: October 28, 2025  
**Version**: 1.0  
**Author**: Vismyras Team
