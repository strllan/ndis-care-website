# Analytics Setup Checklist (No Coding Required)

Your website code is already prepared for:
- Google Analytics 4 (GA4)
- Microsoft Clarity
- Cloudflare Web Analytics
- Conversion events for referral and careers actions

## 1) Create IDs/Tokens in Dashboards

### Google Analytics 4
1. Go to https://analytics.google.com/
2. Create (or open) your GA4 property.
3. Open **Admin -> Data streams -> Web stream**.
4. Copy the **Measurement ID** (looks like `G-XXXXXXXXXX`).

### Microsoft Clarity
1. Go to https://clarity.microsoft.com/
2. Create a project for `ndiscarer.com`.
3. Copy the **Project ID** from setup/integration screen.

### Cloudflare Web Analytics
1. Go to Cloudflare dashboard -> your site.
2. Open **Web Analytics** and create tracking.
3. Copy the **token**.

## 2) Send Me These 3 Values

Send me:
- GA4 Measurement ID
- Clarity Project ID
- Cloudflare token

I will insert them into one file:
- `/Users/liam/Desktop/ARC downloads/ndis-care-website/analytics-config.js`

## 3) Verify Google Search Console (Owner Access)

1. Go to https://search.google.com/search-console
2. Add property: `https://ndiscarer.com/` (or Domain property).
3. Verify ownership (DNS TXT is recommended).
4. Submit sitemap: `https://ndiscarer.com/sitemap.xml`

## 4) Mark Key Events in GA4

After traffic starts coming in:
1. Go to **Admin -> Events / Key events** in GA4.
2. Mark these as key events:
   - `referral_submit`
   - `careers_submit`
   - `referral_cta_click`
   - `phone_click`
   - `email_click`

## 5) Confirm Tracking Works

Open your website and trigger actions:
- Submit referral form
- Submit careers form
- Click phone/email/referral buttons

Then confirm in:
- GA4 Realtime report
- Clarity dashboard recordings/events
- Cloudflare Web Analytics views

## Notes

- If your business targets regions with consent/privacy requirements, add a cookie consent banner and only load analytics after consent.
- Cache headers are already configured for analytics files.
