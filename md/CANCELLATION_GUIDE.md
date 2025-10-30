# Subscription Cancellation - Deployment Guide

## Overview
Complete subscription cancellation system with:
- ✅ User-friendly cancellation UI
- ✅ No refunds policy (access until period end)
- ✅ Razorpay API integration
- ✅ Webhook automation
- ✅ Reactivation support

---

## 🚀 Deploy Edge Function

### 1. Deploy the Cancellation Function
```powershell
npx supabase functions deploy cancel-razorpay-subscription --no-verify-jwt
```

### 2. Set Environment Variables
The function uses the same LIVE keys as other payment functions:
```powershell
npx supabase secrets set VITE_RAZORPAY_LIVE_KEY_ID=rzp_live_RYrMe7EXEQ4UMt
npx supabase secrets set RAZORPAY_LIVE_KEY_SECRET=z4QE76BS32ttCLO2cTOyH764
```

### 3. Verify Deployment
Test the function:
```powershell
curl -i --location --request POST 'https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/cancel-razorpay-subscription' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "subscriptionId": "sub_xxxxx",
    "userId": "user-uuid",
    "cancelAtCycleEnd": true
  }'
```

---

## 📋 How It Works

### User Journey
1. **Premium user clicks "⚙️ Manage Subscription"** in UsageDisplay
2. **SubscriptionManagementModal opens** showing:
   - Current plan details
   - Next billing date
   - Premium benefits
   - "Cancel Subscription" button

3. **User clicks "Cancel Subscription"**:
   - Confirmation screen appears
   - Shows what happens:
     - ✓ Keep Premium until end date
     - ✓ No immediate charges
     - ✗ Auto-renewal stopped
     - ✗ Return to Free plan after expiry
     - ✗ **NO REFUNDS** issued

4. **User confirms cancellation**:
   - Edge function calls Razorpay API
   - Razorpay marks subscription as cancelled
   - User keeps Premium access until billing period ends
   - Webhook updates database status

5. **User can reactivate anytime** before expiry date

---

## 🔧 Backend Flow

### Edge Function: `cancel-razorpay-subscription`
**Purpose**: Cancel Razorpay subscription via API

**Process**:
1. Verify user authentication (Supabase JWT)
2. Verify user owns the subscription
3. Call Razorpay API: `POST /v1/subscriptions/{id}/cancel`
4. Pass `cancel_at_cycle_end: 1` (no refund, cancel at period end)
5. Update `user_billing` table:
   - `subscription_status: 'CANCELLED'`
   - `auto_renew: false`
6. Log event in `webhook_events` table for audit

### Webhook: `razorpay-webhook`
**Already handles** `subscription.cancelled` event:
```typescript
case 'subscription.cancelled':
  // Mark as cancelled but keep access until period end
  await supabase
    .from('user_billing')
    .update({
      subscription_status: 'CANCELLED',
      subscription_auto_renew: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  console.log(`⚠️ Subscription cancelled - access remains until ${endDate}`);
  break;

case 'subscription.completed':
case 'subscription.expired':
  // Revoke access immediately when period ends
  await revokePremiumAccess(userId, 'Subscription expired');
  break;
```

---

## 🎨 UI Components

### 1. `SubscriptionManagementModal.tsx` (NEW)
Full-featured subscription management:
- Shows current plan details
- Displays subscription status (Active/Cancelled)
- Shows next billing date or expiry date
- Lists Premium benefits
- Cancel button with confirmation
- Reactivate button (for cancelled subs)
- No refund warning

### 2. `PaywallModal.tsx` (UPDATED)
- Shows "✓ Using Premium" button (disabled) for Premium users
- Prevents duplicate subscriptions
- Updated footer text

### 3. `UsageDisplay.tsx` (UPDATED)
- Added "⚙️ Manage Subscription" button for Premium users
- Shows below usage stats
- Only visible to Premium tier

---

## 💾 Database Schema

No changes needed! Uses existing `user_billing` table:
- `subscription_status`: 'ACTIVE' → 'CANCELLED' → 'EXPIRED'
- `subscription_auto_renew`: true → false (on cancellation)
- `subscription_end_date`: Unchanged (keeps access until this date)

---

## 🔒 Security

### Authentication
- Edge function requires valid Supabase JWT
- Verifies user owns the subscription being cancelled
- Returns 401 if unauthorized

### Authorization Checks
```typescript
// Verify user is cancelling their own subscription
if (user.id !== userId) {
  throw new Error('Unauthorized: Cannot cancel another user\'s subscription')
}
```

---

## 📊 Cancellation Policy

### No Refunds
- **User keeps Premium access until end of billing period**
- No prorated refunds issued
- Clearly communicated in UI confirmation screen

### Access Timeline
1. **Day 1-28**: Premium active, auto-renew enabled
2. **Day 15**: User cancels subscription
3. **Day 15-30**: Premium still active, auto-renew disabled
4. **Day 30**: Subscription expires
5. **Day 31**: Downgraded to Free tier (3 try-ons/month)

### Reactivation
- User can reactivate anytime before expiry
- Reactivation re-enables auto-renew
- No new charges until next billing date

---

## 🧪 Testing

### Manual Testing Steps
1. Subscribe to Premium (₹199/month)
2. Verify Premium access granted
3. Click "⚙️ Manage Subscription"
4. Click "Cancel Subscription"
5. Confirm cancellation in modal
6. Verify:
   - Toast: "Subscription cancelled..."
   - Status changes to "Cancelled"
   - Access remains until end date
   - "Reactivate Subscription" button appears
7. Test reactivation
8. Wait for billing period to end
9. Verify downgrade to Free tier

### Test Webhook Events
```bash
# Simulate subscription.cancelled event
curl -X POST https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/razorpay-webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: <signature>" \
  -d '{
    "event": "subscription.cancelled",
    "payload": {
      "subscription": {
        "entity": {
          "id": "sub_xxxxx",
          "status": "cancelled",
          "current_end": 1735689599,
          "notes": {
            "user_id": "user-uuid"
          }
        }
      }
    }
  }'
```

---

## 📝 Files Changed

### New Files
1. `components/SubscriptionManagementModal.tsx` - Full subscription management UI
2. `supabase/functions/cancel-razorpay-subscription/index.ts` - Cancellation Edge Function

### Modified Files
1. `components/PaywallModal.tsx` - Disable subscribe button for Premium users
2. `components/UsageDisplay.tsx` - Add "Manage Subscription" button
3. `services/razorpayService.ts` - Add `cancelSubscription()` method
4. `services/billingService.ts` - Already has cancellation logic
5. `App.tsx` - Add cancellation handlers and modal integration

---

## 🔗 Razorpay Documentation
- [Cancel Subscription API](https://razorpay.com/docs/api/subscriptions/#cancel-a-subscription)
- [Subscription Webhooks](https://razorpay.com/docs/webhooks/payloads/subscriptions/)

---

## ✅ Deployment Checklist
- [ ] Deploy `cancel-razorpay-subscription` Edge Function
- [ ] Verify LIVE keys are set in Supabase
- [ ] Test cancellation flow in production
- [ ] Verify webhook handles `subscription.cancelled`
- [ ] Test reactivation flow
- [ ] Verify no refunds issued
- [ ] Test automatic downgrade after expiry
- [ ] Update Razorpay webhook events (already done)

---

## 🎯 User Experience

### Before Cancellation
- Premium user with 50 try-ons/month
- Auto-renew enabled
- Charged ₹199 on billing date

### After Cancellation
- Premium access continues until end date
- No new charges
- Clear expiry date shown in UI
- Can reactivate anytime

### After Expiry
- Downgraded to Free tier
- 3 try-ons/month
- Can re-subscribe anytime

---

## 🚨 Important Notes
1. **NO REFUNDS** - This is the policy, clearly stated in UI
2. **Access Retained** - User keeps Premium until billing period ends
3. **Webhook Automation** - Downgrade happens automatically via webhook
4. **Reactivation** - Simple one-click process
5. **Database Sync** - All changes logged for audit trail

---

## Support
For questions or issues:
- Check webhook logs: Supabase Dashboard → Functions → razorpay-webhook
- Check payment events: Razorpay Dashboard → Events
- Check database: `user_billing` and `webhook_events` tables
