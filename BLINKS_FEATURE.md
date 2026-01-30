# Blinks Feature - Shareable Loan Cards

## Overview
The Blinks feature allows lenders to share their loan offers as beautiful, standalone "trading cards" similar to Solana Blinks. Each offer gets a unique shareable URL that anyone can visit to check eligibility and claim the loan.

## How It Works

### For Lenders
1. Create a loan offer in the "Lend" tab
2. Go to "Browse Offers" tab
3. Click **"🔗 Share Blink"** on any offer
4. Share the copied link on social media, Discord, Telegram, etc.

### For Borrowers
1. Receive a Blink link (e.g., `https://yourapp.com/blink/0`)
2. Click the link to see the loan card
3. Connect wallet
4. Enter financial data (Income, Assets, Debt)
5. Click **"Check Eligibility"** - ZK proof generated client-side
6. If eligible, click **"Claim Loan"** to receive ETH instantly

## Technical Details

### URL Structure
```
/blink/[id]
```
- `[id]` = Offer ID from the smart contract

### Blink Page Features
- **Self-Contained**: All ZK proof logic included
- **Beautiful UI**: Gradient card design with large typography
- **Privacy-Preserving**: Proof generation happens in browser
- **Wallet Integration**: RainbowKit ConnectButton
- **Real-Time Verification**: Client-side proof verification before submission

### Files Created
1. **`packages/nextjs/app/blink/[id]/page.tsx`**
   - Dynamic route for individual offer pages
   - Fetches offer data from contract
   - Generates and verifies ZK proofs
   - Submits `acceptOffer` transaction

2. **Updated: `packages/nextjs/components/LendingMarketplace.tsx`**
   - Added toast import
   - Added "Share Blink" button to offer cards
   - Copies Blink URL to clipboard

## Example Blink URL
```
http://localhost:3001/blink/0
```

## Design Philosophy
- **Distraction-Free**: No navigation, just the loan card
- **Social-First**: Designed to be shared on social platforms
- **Mobile-Friendly**: Responsive design works on all devices
- **Trust-Building**: Shows all loan details upfront

## Security
- Same ZK proof verification as main app
- Threshold binding prevents proof replay
- Client-side verification before blockchain submission
- No private data exposed in URL

## Future Enhancements
- [ ] Open Graph meta tags for rich social previews
- [ ] QR code generation for physical sharing
- [ ] Blink analytics (views, claims)
- [ ] Custom Blink styling per lender
- [ ] Expiration dates for Blinks

---

**Status**: ✅ Fully Functional
**Added**: 2026-01-30
