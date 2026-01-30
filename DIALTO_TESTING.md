# Quick Test Guide for dial.to Integration

## ✅ What's Ready

All dial.to integration files are now in place:

1. ✅ Actions API endpoint: `/api/actions/[id]`
2. ✅ Actions discovery: `/actions.json`
3. ✅ Rich metadata on Blink pages
4. ✅ CORS headers for cross-origin access
5. ✅ Placeholder icons generated

## 🧪 Local Testing (Without dial.to)

### Test 1: Actions API
```bash
# Test the Actions API endpoint
curl http://localhost:3001/api/actions/0
```

**Expected Response:**
```json
{
  "icon": "http://localhost:3001/verifi-icon.svg",
  "title": "VeriFi Loan Offer #0",
  "description": "Privacy-preserving P2P lending...",
  "label": "Check Eligibility",
  "links": {
    "actions": [...]
  }
}
```

### Test 2: Actions Discovery
```bash
curl http://localhost:3001/actions.json
```

**Expected Response:**
```json
{
  "rules": [
    {
      "pathPattern": "/blink/*",
      "apiPath": "/api/actions/*"
    }
  ]
}
```

### Test 3: Icon Access
Open in browser:
- http://localhost:3001/verifi-icon.svg
- http://localhost:3001/og-image.svg

You should see the purple/blue gradient icons.

## 🌐 Testing with dial.to

### Option 1: Use ngrok (Recommended)

```bash
# Terminal 1: Your app (already running)
yarn start

# Terminal 2: Expose to internet
ngrok http 3001
```

You'll get a URL like: `https://abc123.ngrok-free.app`

### Option 2: Deploy to Vercel

```bash
# One-time setup
npm i -g vercel

# Deploy
vercel --prod
```

### Test on dial.to

1. **Copy your ngrok/Vercel URL**
2. **Go to**: https://dial.to
3. **Paste**: `https://your-url.com/blink/0`
4. **Click "Preview"**

You should see your loan card rendered in the dial.to interface!

### Share Your Blink

The shareable URL format:
```
https://dial.to/?action=solana-action:https://your-url.com/blink/0
```

## 📱 Test the Full Flow

1. **Create an offer** in your app (Lend tab)
2. **Click "Share Blink"** to copy the URL
3. **Open the Blink URL** in a new tab
4. **Verify**:
   - ✅ Card displays correctly
   - ✅ Wallet connection works
   - ✅ ZK proof generation works
   - ✅ Loan claiming works

## 🔍 Debugging

### Check CORS Headers
```bash
curl -I http://localhost:3001/api/actions/0
```

Look for:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

### Check Metadata
View page source of `http://localhost:3001/blink/0` and look for:
```html
<meta property="og:title" content="VeriFi Loan Offer #0" />
<meta name="actions:version" content="2.0" />
<meta name="actions:icon" content="..." />
```

### Common Issues

**dial.to shows "Invalid Action"**
- Verify Actions API returns valid JSON
- Check CORS headers are present
- Ensure all URLs are absolute (not relative)

**Icons don't load**
- Verify files exist in `/public` folder
- Check browser console for 404 errors
- Ensure ngrok/Vercel URL is correct

**Blink page is blank**
- Check offer ID exists in contract
- Verify chain is running
- Check browser console for errors

## 🎯 Next Steps

1. **Test locally** with the curl commands above
2. **Set up ngrok** for public access
3. **Test on dial.to** to see your Blink rendered
4. **Share** your Blink URL on social media!

---

**Ready to test!** Start with the local tests, then move to dial.to when ready.
