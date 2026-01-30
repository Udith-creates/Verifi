# dial.to Integration Guide

## Overview
Your VeriFi Blinks are now compatible with dial.to (Solana's Blink aggregator) and other Actions-compatible platforms!

## What Was Added

### 1. Actions API Endpoint
**File**: `app/api/actions/[id]/route.ts`
- Returns Actions API metadata for each offer
- Includes icon, title, description, and action parameters
- CORS-enabled for cross-origin requests

### 2. Actions Discovery
**File**: `app/actions.json/route.ts`
- Tells dial.to where to find your Blinks
- Maps `/blink/*` URLs to `/api/actions/*` endpoints

### 3. Rich Metadata
**File**: `app/blink/[id]/layout.tsx`
- Open Graph tags for social sharing
- Twitter Card metadata
- Actions API meta tags in HTML `<head>`

### 4. CORS Headers
All API routes now include proper CORS headers for cross-origin access.

## How to Test with dial.to

### Step 1: Deploy Your App
You need a public URL for dial.to to access your Blinks. Options:

**Option A: Use ngrok (Fastest for testing)**
```bash
# In a new terminal
ngrok http 3001
```
You'll get a URL like: `https://abc123.ngrok.io`

**Option B: Deploy to Vercel**
```bash
vercel --prod
```

### Step 2: Test on dial.to

1. Go to **https://dial.to**
2. Paste your Blink URL:
   ```
   https://your-domain.com/blink/0
   ```
3. Click "Preview"
4. You should see your loan card rendered!

### Step 3: Share Your Blink

Copy the dial.to URL:
```
https://dial.to/?action=solana-action:https://your-domain.com/blink/0
```

Share this link on:
- Twitter/X
- Discord
- Telegram
- Any social platform

## Actions API Spec

Your Blinks follow the Solana Actions API v2.0 spec:

```json
{
  "icon": "https://your-domain.com/verifi-icon.png",
  "title": "VeriFi Loan Offer #0",
  "description": "Privacy-preserving P2P lending with Zero-Knowledge Proofs",
  "label": "Check Eligibility",
  "links": {
    "actions": [
      {
        "label": "Check Eligibility & Claim",
        "href": "https://your-domain.com/api/actions/0",
        "parameters": [
          { "name": "income", "label": "Annual Income", "required": true },
          { "name": "assets", "label": "Total Assets", "required": true },
          { "name": "debt", "label": "Total Debt", "required": true }
        ]
      }
    ]
  }
}
```

## Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

For local testing with ngrok:
```bash
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
```

## Testing Locally with ngrok

```bash
# Terminal 1: Run your app
yarn start

# Terminal 2: Expose to internet
ngrok http 3001

# Terminal 3: Test the Actions API
curl https://abc123.ngrok.io/api/actions/0
```

## Icon Requirements

Create these images in `packages/nextjs/public/`:

1. **verifi-icon.png** (512x512px)
   - Square icon for Actions API
   - Transparent background recommended

2. **og-image.png** (1200x630px)
   - Open Graph preview image
   - Shows when sharing on social media

## Verification Checklist

- [ ] Actions API responds: `GET /api/actions/0`
- [ ] Actions.json responds: `GET /actions.json`
- [ ] CORS headers present on all endpoints
- [ ] Icons accessible at `/verifi-icon.png` and `/og-image.png`
- [ ] Environment variable `NEXT_PUBLIC_BASE_URL` set
- [ ] App deployed to public URL (or using ngrok)
- [ ] Blink renders correctly on dial.to

## Troubleshooting

### dial.to shows "Invalid Action"
- Check that `/api/actions/[id]` returns valid JSON
- Verify CORS headers are present
- Ensure icon URLs are absolute (not relative)

### Blink doesn't load
- Confirm your app is publicly accessible
- Check browser console for CORS errors
- Verify the offer ID exists in your contract

### Icons don't show
- Make sure images are in `/public` folder
- Use absolute URLs in metadata
- Check image dimensions (512x512 for icon, 1200x630 for OG)

## Next Steps

1. **Create Icons**: Design your VeriFi branding
2. **Deploy**: Get a public URL (Vercel/ngrok)
3. **Test on dial.to**: Verify everything works
4. **Share**: Post your Blinks on social media!

---

**Status**: ✅ dial.to Ready
**Spec**: Actions API v2.0
**Added**: 2026-01-30
