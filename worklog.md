# Sivan VIP Taxi - Worklog

---
Task ID: 11
Agent: main
Task: Jalali calendar, color fixes, admin panel

Work Log:
- Installed jalaali-js and @types/jalaali-js
- Created src/lib/jalaali.ts with full Jalali utility functions
- Created JalaliDatePicker component with calendar popup (month grid, week days in Persian)
- Updated HeroSection to use JalaliDatePicker instead of native date input
- Updated BookingModal to use JalaliDatePicker
- Added live Tehran clock + Jalali date display in Navbar
- Fixed placeholder text colors (#555 → #888) for better contrast on dark bg
- Created AdminPanel component with full admin dashboard
- Admin login: username "admin", password "sivan2024"
- 5 admin tabs: Dashboard, Trips, Passengers, Drivers, Settings
- Added admin access floating button (Shield icon) in bottom-left of page
- Added AdminPanel to page.tsx
- Updated store with admin state management
- All lint checks pass

Stage Summary:
- Jalali/Shamsi calendar fully integrated
- Tehran timezone live clock in Navbar
- Admin panel with login, dashboard, trip/user/driver management, settings
- Admin credentials: admin / sivan2024
- All font colors reviewed - no dark text on dark backgrounds

---
Task ID: 12
Agent: main
Task: City selection from uploaded data files + OpenStreetMap distance calculation

Work Log:
- Parsed "لیست استان‌ها.txt" (1242 lines, tab-separated) into src/data/provinces.json - 31 provinces, 1242 cities
- Parsed "مناطق تهران.txt" (88 lines, 22 districts with neighborhood lists) into src/data/tehran-districts.json - 22 districts, 422 neighborhoods
- Created CitySelector component (src/components/sivan/CitySelector.tsx) with:
  - Province → City drill-down selection
  - For Tehran: Province → District → Neighborhood drill-down
  - Searchable at every level (provinces, cities, districts, neighborhoods)
  - Back navigation between levels
  - Clear selection button
  - Animated dropdown with Framer Motion
- Created /api/distance API route (src/app/api/distance/route.ts) using:
  - Nominatim (OpenStreetMap geocoding) for city coordinate lookup
  - OSRM (Open Source Routing Machine) for driving distance calculation
  - In-memory caching for both geocoding and distance results (24h TTL)
- Updated BookingModal step 0 to use CitySelector for origin and destination
- Updated BookingModal to auto-fetch distance when both cities selected (with 500ms debounce)
- Shows distance (km) and estimated duration in step 0
- Updated BookingModal step 4 (summary) to show real price from /api/pricing with real distance
- Updated store.ts with CitySelection interface, originCity/destCity fields, distanceKm/durationMin fields
- Updated booking API route to accept new field names from modal
- All lint checks pass
- Browser verified: province dropdown, Tehran districts, neighborhood selection, distance calculation (453.4 km, 5h 6min for اختیاریه→اصفهان)

Stage Summary:
- CitySelector with 31 provinces + 1242 cities + 22 Tehran districts + 422 neighborhoods
- Real distance calculation via OpenStreetMap (Nominatim + OSRM)
- Distance-based pricing in booking flow
- Verified end-to-end: select origin → select destination → see distance → proceed with booking

---
Task ID: 13
Agent: main
Task: Fix distance API, update HeroSection with CitySelector, add email notifications

Work Log:
- Fixed distance API (fetch failed): added proper timeout (8s Nominatim, 10s OSRM), rate limiting (1.2s between Nominatim calls), Haversine fallback when OSRM fails, pre-loaded coordinates for 31 province capitals in src/data/city-coords.json
- Updated HeroSection: replaced text inputs with CitySelector for origin/destination
- HeroSection now shows distance (km), duration, and price in real-time after city selection
- "ثبت درخواست رزرو" button opens booking modal starting from step 1 (time selection), skipping step 0 since route is already selected in hero
- Added admin email notification settings to admin panel (Settings tab):
  - Notify email address, SMTP host/port/user/password fields
  - Gmail app password guide in Persian
  - Settings saved via PUT /api/settings and stored in SiteSettings DB model
- Updated Prisma schema: added notifyEmail, smtpHost, smtpPort, smtpUser, smtpPass fields to SiteSettings
- Updated /api/settings to support GET (load) and PUT (save) operations
- Installed nodemailer and @types/nodemailer
- Updated /api/booking to send email notification after successful booking:
  - Reads SMTP settings from SiteSettings
  - Sends HTML email with full booking details (code, passenger, route, distance, car type, price, etc.)
  - Email is sent non-blocking (doesn't delay booking response)
- Browser verified: HeroSection shows CitySelector, distance calculation works (437.5km, 4h 50min), price displayed (1,812,500 تومان), modal opens at step 1

Stage Summary:
- Distance API now reliable with timeout, rate limiting, and Haversine fallback
- HeroSection has full CitySelector integration with distance/price display
- Admin can configure email notification via SMTP (Gmail compatible)
- Booking submissions automatically send email notification to admin
---
Task ID: 1
Agent: Main Agent
Task: Fix booking modal UX - remove broken summary step, add back button, close modal after submission with toast

Work Log:
- Read and analyzed BookingModal.tsx (790 lines), store.ts, HeroSection.tsx
- Removed step 4 (خلاصه/summary) from the booking wizard - was broken and non-functional
- Consolidated to 4 steps: مسیر → زمان → خودرو → اطلاعات و پرداخت
- Moved payment method and coupon from removed step 4 to step 3
- Step 3 now shows: trip summary, name/phone/notes inputs, payment method selection, submit button
- Added "مرحله قبل" (back) button visible on all steps except step 0
- After successful submission: modal closes immediately, Sonner toast shows for 3 seconds with booking code and price
- Error handling: if API fails, toast.error shows error message without closing modal
- Fixed Prisma schema: made Trip.passengerId optional, originLat/originLng/destLat/destLng optional
- Fixed booking API: set passengerId to null, pass null for lat/lng fields
- Updated store: setBookingStep clamps to max step 3, resetBooking clears city selections
- Ran ESLint: no errors

Stage Summary:
- BookingModal.tsx: 4-step wizard (was 5), toast notification on success, back button on every step
- store.ts: step range -1 to 3, proper reset
- schema.prisma: Trip.passengerId nullable, lat/lng nullable
- booking/route.ts: null passengerId, null lat/lng, error logging
- Booking API confirmed working: POST /api/booking returns 200 with bookingCode
- Database verified: bookings saved with correct data (distanceKm, totalFare, etc.)

---
Task ID: 2
Agent: Main Agent
Task: Fix date display to show Jalali calendar format

Work Log:
- Identified issue: BookingModal step 3 summary was showing raw ISO date (2025-03-23) instead of Jalali
- Added import for formatJalaaliDate and toPersianDigits from @/lib/jalaali
- Changed date display: booking.formData.date → formatJalaaliDate(booking.formData.date)
- Changed time display: booking.formData.time → toPersianDigits(booking.formData.time) with dir="ltr"
- Verified via Agent Browser: summary now shows "۳ مرداد ۱۴۰۵" and "۱۰:۳۰" with Persian digits
- JalaliDatePicker calendar correctly shows today as "۳ مرداد" matching Tehran timezone

Stage Summary:
- BookingModal.tsx: date and time in step 3 summary now display in Jalali format with Persian digits
- Calendar "today" button correctly identifies current Jalali date
- All date-related displays verified: navbar (۳ مرداد ۱۴۰۵), datepicker (۳ مرداد), summary (۳ مرداد ۱۴۰۵)

---
Task ID: 3
Agent: Main Agent
Task: Integrate uploaded logo and fix Jalali calendar

Work Log:
- Copied uploaded logo (fbc8960f-3283-4914-a17a-577b78e6c071.png) to /public/logo.png
- Updated Navbar.tsx: replaced Crown icon with actual logo image in navbar and mobile menu
- Updated Footer.tsx: replaced Crown icon with logo image in brand section
- Updated HeroSection.tsx: replaced CrownIcon SVG with logo image in badge
- Updated BookingModal.tsx: added logo image in dialog header
- Updated layout.tsx: changed favicon from /logo.svg to /logo.png
- Fixed JalaliDatePicker.tsx: initialized calendar to today's Jalali date instead of hardcoded 1404/1/1
- Fixed jalaali.ts: rewrote getTehranTime() and getTodayJalaali() to use Intl.DateTimeFormat with timezone: 'Asia/Tehran' (timezone-independent)
- Fixed Navbar.tsx: updated clock to use getTehranTimeString() for proper Tehran time display
- Verified: jalaali-js and Intl.DateTimeFormat(u-ca-persian) produce identical results (Solar Hijri calendar)
- Browser verified: navbar shows logo + "۱۲:۳۸" + "۳ مرداد ۱۴۰۵", datepicker shows "مرداد ۱۴۰۵", footer shows logo

Stage Summary:
- Uploaded logo integrated into: Navbar, Footer, HeroSection badge, BookingModal header, Mobile menu, Favicon
- Jalali calendar fixed: uses Intl.DateTimeFormat with Asia/Tehran timezone (timezone-independent, matches Iran's official Solar Hijri calendar)
- Calendar now opens on correct month (مرداد ۱۴۰۵) instead of hardcoded فروردین ۱۴۰۴
- All lint checks pass

---
Task ID: 4
Agent: Main Agent
Task: Change login to username/password + add admin CMS (content editor + blog management)

Work Log:
- Created `/src/app/api/auth/login/route.ts` - POST endpoint for username/password login (checks DB + hardcoded admin/sivan2024)
- Rewrote `/src/components/sivan/AuthModal.tsx` - replaced phone+OTP with username+password form (with show/hide toggle, error handling)
- Updated Navbar: "ورود / ثبت‌نام" → "ورود"
- Created `/src/app/api/admin/content/route.ts` - GET/PUT for SiteContent sections (hero, services, whyUs, fleet, cta, footer, about)
- Created `/src/app/api/admin/blog/route.ts` - GET/POST/PUT for blog posts management
- Created `/src/app/api/admin/blog/[id]/route.ts` - DELETE for blog posts
- Created `/src/app/api/admin/upload/route.ts` - Image upload (accepts jpg/png/webp/gif, max 5MB, saves to /public/uploads/blog/)
- Rewrote `/src/components/sivan/AdminPanel.tsx` with 7 tabs:
  1. داشبورد (Dashboard) - stats overview
  2. سفرها (Trips) - loads real data from DB via /api/booking
  3. مسافران (Passengers) - placeholder
  4. رانندگان (Drivers) - placeholder
  5. مدیریت محتوا (Content) - section-based editor with title/subtitle/body per page section (hero, services, whyUs, fleet, cta, footer, about)
  6. بلاگ (Blog) - full CRUD: list/create/edit/delete posts, image upload, tags, status (draft/published/archived)
  7. تنظیمات (Settings) - site settings, email notification, SMTP config
- Updated store.ts: added content and blog tabs to AdminState
- Updated Prisma schema: SiteContent model already existed
- All lint checks pass

Stage Summary:
- Login system changed from phone+OTP to username/password
- Admin panel now has Content Editor tab for editing all page texts (hero, services, whyUs, etc.)
- Admin panel now has Blog Management tab for creating/editing/publishing blog posts with image upload
- API routes: /api/auth/login, /api/admin/content, /api/admin/blog, /api/admin/blog/[id], /api/admin/upload

---
Task ID: 5
Agent: Main Agent
Task: Fix admin login not entering panel + add pricing management (per-km per vehicle category)

Work Log:
- Fixed AuthModal.tsx: after successful /api/auth/login, if returned user.role === 'admin', now calls adminLogin() + setAdminOpen(true) + closeAuth() to open the admin panel instead of showing the passenger "welcome" screen
- Updated store.ts adminLogin: credentials now verified by API beforehand; store just records the logged-in admin session
- Updated AdminPanel.tsx AdminLoginScreen: now calls /api/auth/login API (instead of hardcoded check) and validates role === 'admin' before entering panel
- Added PricingConfig model to prisma/schema.prisma (baseFare, minFare, perKm rates for economy/vip/luxury/van/electric, roundTripDiscount)
- Ran `bun run db:push` to sync schema + regenerate Prisma client
- Created src/lib/pricing.ts: shared getPricingConfig(), calculateFare(), rateForTripType(), TRIP_TYPE_LABELS helpers
- Created /api/admin/pricing route (GET returns config, PUT upserts config)
- Rewrote /api/pricing route to read rates from DB via getPricingConfig() + calculateFare() (was hardcoded)
- Updated /api/booking route to use calculateFare() from DB-backed config (removed hardcoded RATES/BASE_FARE constants)
- Added 'pricing' to AdminState activeTab type in store.ts
- Added PricingTab component to AdminPanel.tsx: base fares section (baseFare, minFare, roundTripDiscount), per-vehicle-category rate cards (economy/vip/luxury/van/electric with icons + live 100km example), and a live price preview calculator
- Added 'قیمت‌گذاری' (Pricing) tab to admin sidebar with Calculator icon
- Updated HeroSection.tsx: fetches /api/admin/pricing on mount and uses admin-configured rates for the quick-estimate preview (falls back to defaults)
- Restarted dev server with `setsid --fork` to pick up new Prisma client (stale client was causing 500 on PUT)

Stage Summary:
- Admin login now correctly opens the admin panel (was showing passenger welcome screen)
- New "قیمت‌گذاری" tab in admin panel lets admin set: base fare, minimum fare, round-trip discount %, and per-kilometer rate for each of 5 vehicle categories (economy, VIP, luxury, van, electric)
- All rates persist in DB (PricingConfig table) and are used by both /api/pricing (estimate) and /api/booking (final fare)
- HeroSection quick-estimate now reflects admin-configured rates
- Verified end-to-end via agent-browser: login → admin panel → pricing tab → edit VIP rate 3000→4000 → save → toast "قیمت‌گذاری با موفقیت ذخیره شد" → API confirms vipPerKm:4000 persisted
- Verified pricing math: luxury 200km = 50000 base + 200×5000 = 1,050,000 تومان (correct)

---
Task ID: 6
Agent: Main Agent
Task: Rename vehicle categories (electric→super luxury, VIP luxury→luxury), fix pricing preview dropdown, add section-specific content fields

Work Log:
- Task 1: Renamed "برقی" → "سوپر لوکس" (super luxury) category label across all booking flow UI:
  - src/lib/pricing.ts TRIP_TYPE_LABELS.electric: 'برقی' → 'سوپر لوکس'
  - src/components/sivan/AdminPanel.tsx vehicleCategories: electric label 'برقی' → 'سوپر لوکس', desc updated, icon ⚡ → 💎
  - src/components/sivan/HeroSection.tsx carTypes: electric label 'برقی' → 'سوپر لوکس'
  - src/components/sivan/BookingModal.tsx carOptions: electric label 'برقی' → 'سوپر لوکس', desc updated
- Task 3: Renamed "VIP لوکس" → "لوکس" (luxury) category label:
  - src/lib/pricing.ts TRIP_TYPE_LABELS.vip: 'VIP لوکس' → 'لوکس'
  - src/components/sivan/AdminPanel.tsx vehicleCategories: vip label 'VIP لوکس' → 'لوکس'
  - src/components/sivan/HeroSection.tsx carTypes: vip label 'VIP - لوکس' → 'لوکس'
  - src/components/sivan/BookingModal.tsx carOptions: vip label 'VIP لوکس' → 'لوکس'
  - Internal keys (vip, electric) unchanged to avoid DB migration
- Task 2: Fixed pricing preview dropdown not opening:
  - Root cause: SelectContent had z-50 but admin panel overlay is z-[100], so the Radix Portal dropdown rendered BEHIND the admin overlay
  - Fix: Changed SelectContent z-index from z-50 to z-[200] in src/components/ui/select.tsx
- Task 4: Redesigned ContentTab with section-specific field schemas:
  - Defined SECTION_DEFS array with 7 sections, each having its own distinct fields:
    - hero: badge text, title, subtitle, background image URL
    - services: title, subtitle, services list (pipe-delimited)
    - whyUs: title, subtitle, features list (pipe-delimited)
    - fleet: title, subtitle, description
    - cta: title, subtitle, button text, phone number
    - footer: brand name, description, copyright text, address
    - about: title, subtitle, body text
  - Added parseSectionData() and serializeSectionData() helpers to store extra fields as JSON in the body column (no schema change needed)
  - Each section now shows a description header and its own labeled input fields

Stage Summary:
- Vehicle category labels updated: "برقی"→"سوپر لوکس", "VIP لوکس"→"لوکس" (consistent across pricing, hero, booking modal)
- Pricing preview dropdown now opens correctly (z-index fix from z-50 to z-[200])
- Content management tab now has 7 sections each with distinct, relevant fields instead of generic title/subtitle/body
- Verified via agent-browser: pricing tab shows correct labels, dropdown opens with all 5 categories, selecting "سوپر لوکس" updates price correctly (400,000 for 100km), content tab shows section-specific fields (CTA: title/subtitle/button/phone, Footer: brand/description/copyright/address)

---
Task ID: 14
Agent: Main Agent
Task: Switch admin email notification from SMTP (password-based) to Google OAuth2 (XOAUTH2)

Work Log:
- Investigated existing SMTP implementation across /api/settings, /api/booking, AdminPanel SettingsTab (was using smtpHost/smtpPort/smtpUser/smtpPass)
- Updated prisma/schema.prisma SiteSettings model: removed smtpHost, smtpPort, smtpUser, smtpPass; added oauthUserEmail, oauthClientId, oauthClientSecret, oauthRefreshToken, oauthAccessToken, oauthTokenExpiry (DateTime?) fields
- Ran `bun run db:push --accept-data-loss` to apply schema changes (existing SMTP values dropped)
- Created src/lib/email.ts — new OAuth2 email helper using nodemailer `auth.type: 'OAuth2'`:
  - getTransporter() caches transporter, recreated when key OAuth2 fields change
  - loadOAuth2Config() loads from DB, returns null if required fields missing
  - sendMail({to, subject, html, fromName}) — never throws, returns {ok, error}
  - verifyOAuth2() — calls transporter.verify() to test credentials
- Rewrote /api/settings route.ts:
  - GET: masks oauthClientSecret/oauthRefreshToken/oauthAccessToken as `__SET__` sentinel when set (defense-in-depth, no secret echo to browser)
  - PUT: resolveSecret() helper preserves existing secret values when sentinel `__SET__` or empty string sent; clears cached access token + expiry when credentials change
- Updated /api/booking route.ts: replaced inline SMTP transporter with sendMail() call from new email helper
- Created /api/admin/email-test/route.ts: POST endpoint that verifies OAuth2 credentials and sends a small HTML test email to the configured notifyEmail address; returns {ok, sentTo} or {ok:false, error} with Persian error messages
- Rewrote AdminPanel.tsx SettingsTab:
  - Removed smtpHost/Port/User/Pass form fields
  - Added OAuth2 fields: notifyEmail, oauthUserEmail, oauthClientId, oauthClientSecret, oauthRefreshToken (with eye toggle show/hide)
  - Secret fields show masked placeholder "•••••••• (ذخیره شده — برای تغییر، تایپ کنید)" when value is `__SET__`
  - onFocus clears `__SET__` to allow typing new value
  - Added collapsible <details> setup guide with 11-step Persian instructions for getting OAuth2 credentials from Google Cloud Console (project, Gmail API, consent screen, OAuth client ID, redirect URI to OAuth Playground, refresh token exchange)
  - Added "ارسال ایمیل آزمایشی" button that calls /api/admin/email-test and shows inline success/error result
  - Added loading spinners on Save and Test buttons
- Restarted dev server with setsid --fork (stale Prisma client was still querying old smtp* columns and returning 500)
- ESLint: passes clean
- Browser-verified end-to-end:
  - Settings tab shows "تنظیمات اعلان ایمیلی (OAuth2)" header
  - All 5 OAuth2 fields render with proper LTR direction, placeholders, and eye toggle on secrets
  - Setup instructions expand/collapse correctly
  - Saving userEmail+clientId+notifyEmail persists to DB; GET returns them unmasked (non-secret)
  - Saving clientSecret+refreshToken via API stores in DB, returns as `__SET__` sentinel, subsequent GETs also return `__SET__` (no secret leakage to browser)
  - Clicking "ارسال ایمیل آزمایشی" with no OAuth2 configured → POST /api/admin/email-test returns 400 with Persian error "ابتدا اطلاعات OAuth2 را در تنظیمات وارد کنید." which displays inline below the button
  - Clicking test with test/invalid credentials → Gmail returns "invalid_client: The OAuth client was not found." displayed inline in Persian error wrapper

Stage Summary:
- Email notification system fully migrated from SMTP password auth to Google OAuth2 XOAUTH2
- Secrets (client secret, refresh token, access token) are stored in DB but never echoed back to browser (masked as `__SET__` sentinel)
- Nodemailer's built-in XOAUTH2 flow handles access-token refresh automatically via refresh token — no manual token management needed
- Admin UI includes Persian setup guide for Google Cloud Console OAuth2 credentials + OAuth Playground refresh-token flow
- "ارسال ایمیل آزمایشی" button provides immediate end-to-end verification of credentials
- Files changed: prisma/schema.prisma, src/lib/email.ts (new), src/app/api/settings/route.ts, src/app/api/admin/email-test/route.ts (new), src/app/api/booking/route.ts, src/components/sivan/AdminPanel.tsx (SettingsTab + new SecretInput component)

---
Task ID: 15
Agent: Main Agent
Task: Replace Gmail OAuth2 with internal self-hosted mail system (deliver to Gmail via direct MX)

Work Log:
- Tested outbound connectivity: port 25 (MX delivery) BLOCKED in sandbox, port 587 BLOCKED, DNS MX resolution WORKS — designed system for both sandbox (relay fallback) and real VPS (direct MX)
- Updated prisma/schema.prisma: removed OAuth2 fields (oauthUserEmail, oauthClientId, oauthClientSecret, oauthRefreshToken, oauthAccessToken, oauthTokenExpiry); added internal mail fields (mailSenderName, mailSenderEmail, mailReplyTo, relayHost, relayPort, relayUser, relayPass) to SiteSettings
- Added new EmailMessage model: fromName, fromEmail, replyTo, toEmail, toName, subject, textBody, htmlBody, status (queued|sending|sent|failed), mxHost, attemptCount, lastError, source (manual|booking|system), refId, sentAt, createdAt + indexes on status/toEmail/createdAt
- Ran bun run db:push to apply schema
- Created mini-services/mail-service/ (new Bun project, port 3004):
  - Uses nodemailer with two delivery modes:
    1) DIRECT MX: resolveMxRecords() looks up recipient MX via dns.resolveMx(), connects directly to MX server on port 25 (unauthenticated SMTP — receiving server decides based on SPF/DKIM/DMARC)
    2) SMTP RELAY: when relayHost + relayUser configured in settings, authenticates against admin's own relay (any port: 587/465/2525)
  - enqueueAndSend(): records message in EmailMessage table as 'sending', attempts delivery, updates to 'sent' or 'failed' with full error message + mxHost contacted + attempt count
  - retryEmail(id): re-attempts failed delivery, increments attemptCount
  - Hard 30-second timeout wrapper prevents stuck 'sending' state
  - Tries only first 2 MX records (sorted by priority) to keep response time reasonable (~10s instead of 75s)
  - Endpoints: POST /send, POST /retry/:id, GET /health
  - Started with `setsid --fork bun run dev` for auto-reload on file changes
- Removed old OAuth2 files: src/lib/email.ts, src/app/api/admin/email-test/route.ts
- Created API routes:
  - GET /api/admin/emails (list with pagination, status filter, search, stats)
  - POST /api/admin/emails (forward to mail-service on port 3004)
  - GET /api/admin/emails/[id] (full email record with html body)
  - POST /api/admin/emails/[id]?action=retry (retry failed delivery)
  - DELETE /api/admin/emails/[id] (delete from archive)
- Updated /api/settings: handles new mail fields (mailSenderName/Email/ReplyTo, relayHost/Port/User/Pass); masks relayPass as '__SET__' in GET responses (defense-in-depth)
- Updated /api/booking: sendBookingNotification() now uses fire-and-forget fetch to mail-service (was blocking SMTP/OAuth2 call before); booking response not delayed by email delivery; source='booking', refId=bookingCode
- Added 'emails' to AdminState activeTab type in store.ts
- Built EmailsTab component in AdminPanel.tsx:
  - Stats cards: کل، ارسال شده، ناموفق، در حال ارسال، در صف (clickable filters)
  - Email list with subject, recipient, time, MX host, attempt count, error preview
  - Status badges: ارسال شد / ناموفق / در حال ارسال / در صف
  - Compose modal: full HTML email composer with recipient/name/subject/HTML body fields
  - View modal: shows full email preview (rendered HTML), from/to/time/MX host/error
  - Retry button on failed emails, delete button on all
- Updated SettingsTab:
  - Replaced "تنظیمات اعلان ایمیلی (OAuth2)" with "سیستم ایمیل داخلی"
  - New fields: نام فرستنده، ایمیل فرستنده، آدرس Reply-To، ایمیل مقصد اعلان‌ها
  - Collapsible "تنظیمات Relay SMTP (اختیاری)" section with relayHost/Port/User/Password fields
  - Gmail delivery guide: SPF (v=spf1 mx a -all), DKIM, DMARC (v=DMARC1; p=quarantine;), rDNS instructions
- Restarted dev server (setsid --fork) to pick up new Prisma client
- Browser-verified end-to-end:
  - Login as admin → sidebar shows new "ایمیل‌ها" tab
  - Emails tab shows stats cards (کل ۹، ارسال شده ۰، ناموفق ۹) and email list
  - Each email shows subject, recipient, time (Jalali), source badge, error preview
  - Compose modal: form accepts recipient/name/subject/HTML, submits via POST /api/admin/emails
  - View modal shows rendered HTML preview + delivery details + error message
  - Settings tab shows "سیستم ایمیل داخلی" with sender identity fields + collapsible relay config + Gmail delivery guide
  - Booking submission returns instantly (no email delay) and email is recorded asynchronously in EmailMessage table with source='booking'
- Verified email delivery attempts:
  - To gmail.com: fails with "Connection timeout" (port 25 blocked in sandbox — expected; will work on real VPS)
  - To savantaxi.com (no MX records): fails immediately with "queryMx ENOTFOUND" (correct behavior)
  - Total send time: ~10s for valid MX (was 75s before optimization)

Stage Summary:
- Built complete internal mail system replacing Gmail OAuth2 — uses site's own domain (noreply@sivantaxi.com) as sender identity
- Two delivery modes: direct MX (default, works on VPS with port 25 open) + configurable SMTP relay (fallback for sandboxed/cloud environments)
- All emails archived in EmailMessage table with full status tracking (queued → sending → sent|failed), error messages, attempt counts, MX host contacted
- Admin UI: compose new emails, view archived emails with rendered HTML preview, retry failed deliveries, filter by status, delete
- Booking notifications fire asynchronously (don't delay booking response), recorded with source='booking' + refId=bookingCode
- Settings: simple sender identity config + optional relay + Gmail delivery DNS guide (SPF/DKIM/DMARC/rDNS)
- Files changed: prisma/schema.prisma, mini-services/mail-service/{package.json,index.ts} (new), src/app/api/settings/route.ts, src/app/api/admin/emails/route.ts (new), src/app/api/admin/emails/[id]/route.ts (new), src/app/api/booking/route.ts, src/lib/store.ts, src/components/sivan/AdminPanel.tsx (new EmailsTab + redesigned SettingsTab)
- Removed: src/lib/email.ts (OAuth2 helper), src/app/api/admin/email-test/route.ts

---
Task ID: 16
Agent: Main Agent
Task: Fix city selector dropdown clipping + hydration error, add PWA installability + push notifications

Work Log:
- Issue 1 (dropdown clipping): Root cause = HeroSection had `overflow-hidden` on the whole section, clipping absolutely-positioned dropdowns; the bottom gradient fade also sat on top (later in DOM, same z) covering bottom list items → provinces appeared dimmed/unselectable.
  - Fix: Moved `overflow-hidden` from the section to the background-image container only; added `pointer-events-none` to decorative overlays; gave content `relative z-10`; gave bottom fade `z-0 pointer-events-none`.
  - Raised CitySelector dropdown z-index z-50 → z-[100]; raised JalaliDatePicker z-50 → z-[100].
- Issue 4/5 (button-in-button hydration error): CitySelector had a clear (X) `<button>` nested inside the trigger `<button>` → invalid HTML + hydration error.
  - Fix: Restructured trigger to use a `relative` wrapper; main button is full-width with left padding; the clear X button is now an absolutely-positioned SIBLING (not child) of the trigger button.
- Issue 2 (PWA installability):
  - Generated PWA icons from logo.png via sharp (scripts/gen-icons.js): icon-192.png, icon-512.png, icon-maskable-192.png, icon-maskable-512.png, apple-touch-icon.png, favicon-32.png (dark #0a0a0a background, gold brand).
  - Created /public/manifest.json: name, short_name, start_url=/, display=standalone, theme_color=#0a0a0a, lang=fa, dir=rtl, icons (any + maskable), shortcuts.
  - Created /public/sw.js service worker: precache core assets, network-first navigations with offline fallback, cache-first static assets, push event handler (showNotification with RTL/fa, vibrate, actions), notificationclick handler (focus existing tab or open new).
  - Updated layout.tsx: added manifest, appleWebApp config, full icons set, themeColor viewport.
  - Created PWARegister component: registers /sw.js, listens for beforeinstallprompt, shows install banner with "نصب" button, detects standalone mode via lazy useState initializer.
- Issue 3 (push notifications to admin devices):
  - Installed web-push + @types/web-push; generated VAPID key pair, stored in .env (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT).
  - Added PushSubscription model to prisma/schema.prisma (endpoint unique, p256dhKey, authKey, label, userAgent). Ran db:push.
  - Created src/lib/push.ts: ensureConfigured(), getVapidPublicKey(), sendPushToAll() (auto-removes 404/410 expired subs), saveSubscription(), removeSubscription(), listSubscriptions().
  - Created API routes: GET /api/push/vapid-public, POST /api/push/subscribe, POST /api/push/unsubscribe, POST /api/push/test, GET /api/push/subscriptions.
  - Updated /api/booking route: after creating trip, calls sendPushToAll() (non-blocking) with booking details → admin devices get push notification on new booking.
  - Added 'notifications' tab to admin panel (TabId + store type + sidebar + render switch).
  - Built NotificationsTab component: permission status badge, enable/disable button (requests Notification.permission + PushManager.subscribe + saves to backend), test button (POST /api/push/test), "how it works" guide, registered-devices list with refresh.
  - Added global email-polling effect in AdminDashboard: polls /api/admin/emails every 25s; on new email → toast (foreground) + playNotifSound() (Web Audio two-tone chime) + SW showNotification (background). Complements web-push for when tab is open.
  - Added playNotifSound() helper using Web Audio API (no audio file needed).
  - Added getDeviceLabel() (detects iOS/Android/Windows/Mac/Linux from userAgent) + urlBase64ToUint8Array() helpers.
- Fixed lint: lazy useState initializer in PWARegister (avoids setState-in-effect); eslint-disable for scripts/gen-icons.js require().
- Restarted dev server (setsid --fork) to load VAPID env vars + regenerated Prisma client.
- ESLint: passes clean.
- Browser-verified end-to-end:
  - Homepage loads with NO hydration errors (console clean of "button cannot be descendant" / "mismatch")
  - City selector dropdown: scrolled to bottom — last province "یزد" has color rgb(250,250,250), opacity 1, fully visible (was dimmed before); clicking it transitions to city selection ✓
  - JalaliDatePicker calendar opens and shows "امروز (۴ مرداد)" ✓
  - PWA: SW registered (scope=/), manifest linked, apple-touch-icon linked, theme-color=#0a0a0a ✓
  - Admin login (admin/sivan2024) → new "اعلان‌ها" tab visible and renders "سیستم نوتیفیکیشن", status card, enable/test buttons, devices list, how-it-works guide ✓
  - Enable button correctly requests permission; denied (headless auto-deny) → shows Persian error "دسترسی نوتیفیکیشن رد شد..." ✓
  - Backend: GET /api/push/vapid-public returns configured publicKey; POST /api/push/test returns "هیچ دستگاهی ثبت نشده" (correct, no subs yet); GET /api/push/subscriptions returns [] ✓
  - Booking POST /api/booking 200 (SV-1JCNZ8); dev log shows PushSubscription query after booking → sendPushToAll() fired correctly ✓

Stage Summary:
- Fixed all 5 user-reported issues:
  1. Dropdown provinces no longer dimmed/clipped (overflow + z-index fix in HeroSection)
  2. Calendar no longer clipped (same fix)
  3. Site is now installable as PWA on mobile (Android/iOS) + Windows (manifest + SW + icons + install banner)
  4. Push notification system: admin gets browser/phone notifications on new booking or email (VAPID web-push + live polling fallback + sound)
  5. Button-in-button hydration error eliminated (restructured CitySelector trigger)
- Files changed: src/components/sivan/CitySelector.tsx, src/components/sivan/HeroSection.tsx, src/components/sivan/JalaliDatePicker.tsx, src/components/sivan/PWARegister.tsx (new), src/components/sivan/AdminPanel.tsx (NotificationsTab + polling effect + helpers), src/app/layout.tsx, src/lib/store.ts, src/lib/push.ts (new), src/app/api/push/{vapid-public,subscribe,unsubscribe,test,subscriptions}/route.ts (new), src/app/api/booking/route.ts, prisma/schema.prisma, .env, scripts/gen-icons.js (new), public/manifest.json (new), public/sw.js (new), public/icon-{192,512,maskable-192,maskable-512}.png + apple-touch-icon.png + favicon-32.png (generated)

---
Task ID: 2a
Agent: full-stack-developer
Task: Rewrite PopularRoutes.tsx to fetch live popular-route prices from backend (/api/routes/popular) instead of using hardcoded data

Work Log:
- Read worklog.md and confirmed existing dark+gold theme conventions used throughout project
- Confirmed /api/routes/popular returns: { id, origin, destination, distanceKm, duration, tripType, tripTypeLabel, price, priceLabel, image, isPopular, sortOrder }
- Confirmed useAppStore exposes updateBookingForm + setBookingStep (unchanged from current usage)
- Confirmed toPersianDigits is exported from @/lib/jalaali
- Rewrote src/components/sivan/PopularRoutes.tsx as 'use client' with:
  - useEffect on mount -> fetch('/api/routes/popular', { cache: 'no-store' })
  - useState for routes[], loading, error
  - Graceful cancellation via `cancelled` flag in useEffect cleanup
  - Loading state: 6 skeleton cards (RouteCardSkeleton) with pulse animation mimicking the real card layout
  - Error/empty fallback: centered Persian message ("در حال بارگذاری مسیرها..." / "مسیری یافت نشد")
  - Each card now renders backend fields:
      * Origin -> Destination with MapPin + ArrowLeft (unchanged visual)
      * Gold Badge with tripTypeLabel (e.g. "ویژه", "لوکس", "اقتصادی") replacing the old static "محبوب" badge
      * Duration (Clock icon) + distance as "{toPersianDigits(distanceKm)} کیلومتر" (Route icon)
      * Price: "شروع از" label + priceLabel (gold bold) + "تومان"
      * "رزرو این مسیر" Button (ArrowLeft) calling handleRouteClick(origin, destination)
  - handleRouteClick unchanged: updateBookingForm({ origin, destination }) -> setBookingStep(1) -> scroll to #hero
  - Preserved framer-motion containerVariants/itemVariants stagger, section header Badge "محبوب‌ترین مسیرها" + title "مسیرهای پرطرفدار" + subtitle
  - Preserved section id="routes", py-20 sm:py-24 bg-[#0a0a0a], decorative gold divider at top
  - Preserved grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6
  - Theme tokens kept identical: bg-[#1a1a1a], border-[#333], hover:border-[#D4AF37]/30, text-[#D4AF37] accents, text-[#fafafa] headings, text-[#a1a1aa] body
- Ran `bun run lint` -> clean, no errors/warnings

Stage Summary:
- PopularRoutes is now fully data-driven; homepage prices always reflect the admin's current PricingConfig per-km rates (computed live by the backend)
- No other files touched; API was already implemented and was not modified
- Lint passes cleanly

---
Task ID: 2d
Agent: full-stack-developer
Task: Improve TestimonialsSection with 12 testimonials, DB merge, autoplay slider, arrows, and dots

Work Log:
- Read existing TestimonialsSection.tsx, ui/carousel.tsx, /api/testimonials/route.ts and Prisma Testimonial schema to understand shape (DB items: name, rating, comment, tripRoute?, avatarUrl?, no role).
- Expanded static testimonials array from 6 to 12 entries. Added 6 new realistic Persian testimonials (کارآفرین, معلم, طراح گرافیک, پرستار, وکیل, مدیر بازاریابی) with trips تهران→اهواز/کرمان/قم/اردبیل/قزوین/ساری and ratings 4-5, matching the existing style.
- Added typed DbTestimonial + Normalized Testimonial types; `normalizeDbItem` maps DB rows to the card shape (trip falls back to "سفر با سیوان", role to "مسافر سیوان").
- On mount, fetches /api/testimonials, normalizes, and merges (DB first, then static). Empty/error falls back to static-only via try/catch with cancelled flag.
- Wired up embla API via `setApi={handleSetApi}` callback (CarouselApi typed). Initial count/current set inside the callback to satisfy react-hooks/set-state-in-effect rule.
- Added select/reInit listeners in a dedicated effect to keep `current`/`count` in sync (no setState in effect body — only inside event-handler callbacks).
- Autoplay: 5s `setInterval` calling `api.scrollNext()` (works because `loop: true`). Pause-on-hover via `onMouseEnter/onMouseLeave` updating `paused` state synced to a `pauseRef` through a separate effect (avoids ref-write-during-render lint error).
- Added `CarouselPrevious`/`CarouselNext` with custom gold styling: `variant="ghost" className="text-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:opacity-30"`. Carousel wrapper padded with `px-2 sm:px-8` so the absolutely-positioned arrows (-left-12/-right-12) don't overlap cards.
- Carousel options `{ align: 'start', loop: true }`; items use `pl-4 sm:basis-1/2 lg:basis-1/3`. Each card keeps Quote icon, quoted comment, RatingStars, author name+role, and trip badge.
- Added a dots indicator below the carousel: gold stretched dot for the active slide, gray dots that turn gold on hover, clickable to scroll via `api.scrollTo(i)`. Hidden until `count > 0`.
- Header kept as-is: "نظرات مسافران" with gold gradient on "مسافران" + subtitle "ببینید مسافران ما درباره سفر با سیوان چه می‌گویند".
- Stats grid (4 cards) kept untouched.
- Fixed two ESLint errors: (1) ref written during render → moved ref update into a useEffect; (2) synchronous setState in effect body → moved initialization into the `setApi` callback and event listeners.
- Removed now-unused imports (Button, ChevronLeft, ChevronRight) and added `useCallback` + `cn`.
- `bun run lint` passes with zero errors. Dev server log shows GET /api/testimonials 200 with the merged list rendering.

Stage Summary:
- TestimonialsSection is now a smooth, auto-playing, looping carousel with 12 static reviews (expandable via DB).
- Fetches approved DB testimonials at mount and merges them first, falling back gracefully to the static list on error.
- Autoplay advances every 5s and pauses on hover; gold-styled arrow buttons + clickable dots indicator provide manual navigation.
- No other files touched; lint clean; dev server compiles without errors.

---
Task ID: 2b
Agent: full-stack-developer
Task: Rewrite ServicesSection to show exactly 5 service types matching site trip types

Work Log:
- Replaced 3-service array with 5 services: اقتصادی (economy), ویژه (vip), لوکس (luxury), سوپر لوکس (electric), خانوادگی (van)
- Added `TripType` union type covering all 5 trip types
- Updated grid layout to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` with `gap-4 sm:gap-6`
- Removed unused imports (Users, Shield), kept ArrowLeft + Sparkles
- Updated handleServiceClick to accept the full TripType union
- All descriptions, features, badges, and images match the specification exactly
- `bun run lint` passes with zero errors.

Stage Summary:
- ServicesSection now displays all 5 service types with responsive grid (1→2→3→5 columns)
- Each card triggers booking flow with correct tripType via handleServiceClick
- Lint clean, no other files modified.

---
Task ID: 2c
Agent: full-stack-developer
Task: Rewrite FleetSection with 5 luxury vehicles, generate 3 new car images

Work Log:
- Generated 3 new car images via z-ai CLI (1344x768):
  - `/public/images/bmw-car.png` — BMW 5 Series sedan, black, studio lighting
  - `/public/images/audi-car.png` — Audi A6 sedan, black, studio lighting
  - `/public/images/landcruiser-car.png` — Toyota Land Cruiser SUV, black, studio lighting
- Reused existing `/images/vip-car.png` and `/images/luxury-car.png`
- Rewrote `src/components/sivan/FleetSection.tsx`:
  - Replaced 4-vehicle fleet with 5 luxury vehicles
  - New fleet: Sonata (vip), Mercedes E-Class (luxury), BMW 5 Series (luxury), Audi A6 (electric), Land Cruiser (van)
  - Removed plain van and plain electric car options
  - TabsList: added overflow-x-auto max-w-full flex-nowrap for mobile scroll
  - Each tab shows last word of vehicle name
  - handleSelectVehicle maps id to tripType and scrolls to #hero
  - Updated subtitle text
  - Removed unused imports
- `bun run lint` passes with zero errors

Stage Summary:
- FleetSection now shows 5 luxury vehicles with mobile-scrollable tabs
- 3 new AI-generated car images (BMW, Audi, Land Cruiser)
- All tripType mappings match booking store values
- Lint clean, no other files modified.

---
Task ID: 2f
Agent: full-stack-developer
Task: Replace native time picker with custom time-slot grid picker in booking step 1

Work Log:
- Added showCustomTime useState to BookingModal component
- Replaced native Input type=time with custom time-slot grid picker
- Grid has 4 period sections with clickable chips showing Persian digits
- Selected chip uses gold bg/text, unselected uses dark bg with hover effects
- Added current selection display in gold or placeholder text
- Added custom time toggle button to reveal native time input as fallback
- Wrapped grid in max-h-64 overflow-y-auto container with thin scrollbar
- All time values stored as HH:MM latin digits internally
- Lint passes clean, dev server compiles without errors

Stage Summary:
- Native time input replaced with mobile-friendly Persian digit time-slot grid
- 18 preset slots across 4 time periods with custom time fallback
- Step validation still works correctly, dark+gold theme maintained

---
Task ID: 2e
Agent: full-stack-developer
Task: Make blog section fetch real posts from backend and open posts in a modal

Work Log:
- Created `src/components/sivan/BlogPostModal.tsx` — full modal with Dialog/DialogContent from shadcn
- Modal handles 3 states: loading spinner, error display, and content rendering
- Supports both API-fetched posts (by slug) and static fallback posts
- Content rendered via dangerouslySetInnerHTML with justified Persian text styling
- Includes featured image (h-56 sm:h-72), category Badge, meta row (author, Jalali date, read time, view count)
- Rewrote `src/components/sivan/BlogPreview.tsx` with:
  - Fetches `/api/blog?status=published&limit=6` on mount
  - Shows 3 animate-pulse skeleton cards while loading
  - Falls back to 3 static posts on fetch error or empty response
  - Each card + "ادامه مطلب" button opens BlogPostModal
  - API posts pass slug to modal for full post fetch; static posts pass fallbackPost data
  - Jalali date formatting via formatJalaaliDate for API posts, static string for fallback
  - Read time estimated from content length for API posts
- No other files modified, lint passes clean

Stage Summary:
- Blog section now dynamically fetches published posts from backend API
- Graceful fallback to static posts ensures section is never empty
- Full post modal with loading/error states, justified Persian HTML content
- Gold/dark theme maintained throughout, framer-motion stagger preserved

---
Task ID: 3
Agent: general-purpose
Task: Create blog-generator mini-service that auto-generates and publishes AI blog articles every 6 hours

Work Log:
- Read worklog.md and studied mail-service mini-service pattern
- Invoked image-generation and LLM skills to learn z-ai-web-dev-sdk usage
- Explored ZAI SDK structure: zai.chat.completions.create() for LLM, zai.images.generate() for image generation (returns base64 string)
- Created mini-services/blog-generator/package.json with dependencies
- Ran bun install to install deps
- Created mini-services/blog-generator/index.ts (port 3005) with:
  - PrismaClient connected to file:/home/z/my-project/db/custom.db
  - 12 Persian VIP taxi travel topics in rotating list
  - generateArticle() function with LLM text generation, parsing, image generation, DB save
  - 6-hour interval scheduling via setInterval
  - Startup logic: generates immediately if <3 published posts or latest >6h old
  - HTTP server with GET /health and POST /generate endpoints
  - Robust error handling with try/catch and LLM retry
- Started service in background with setsid
- Verified service running and health endpoint responding
- Confirmed blog post generated with title, slug, content, excerpt, tags, and cover image

Stage Summary:
- Blog generator service running on port 3005
- Auto-generates Persian blog articles every 6 hours
- LLM generates title, excerpt, HTML content, and tags
- AI-generated cover images saved to public/images/blog/
- Posts saved to BlogPost table with status: published
- Health endpoint: GET http://localhost:3005/health
- Manual trigger: POST http://localhost:3005/generate


---
Task ID: 1 + 3 (Main Agent)
Task: Foundation (TRIP_TYPE_LABELS rename, PopularRoute schema, popular-routes API) + AI blog-generator mini-service (subagent for Task 3 timed out, completed by main agent)

Work Log:
- Task 1 (foundation): Updated src/lib/pricing.ts TRIP_TYPE_LABELS: economy→اقتصادی, vip→ویژه, luxury→لوکس, electric→سوپر لوکس, van→خانوادگی. Added DEFAULT_PREVIEW_TRIP_TYPE='vip'.
- Updated BookingModal.tsx carOptions labels to match (vip→ویژه, luxury→لوکس, van→خانوادگی, electric→سوپر لوکس).
- Added fields to PopularRoute model: distanceKm Float, tripType String, duration String (with defaults). Ran db:push.
- Seeded 6 default popular routes (تهران→مشهد/اصفهان/تبریز/شیراز/رشت/کرمانشاه) with distanceKm + tripType via scripts/seed-routes.mjs.
- Rewrote /api/routes/popular GET: now computes live price for each route via getPricingConfig() + calculateFare(config, tripType, distanceKm). Returns priceLabel (Persian digits) + tripTypeLabel + distanceKm. Prices always reflect admin's PricingConfig per-km rates.
- Created /api/admin/popular-routes CRUD (GET/POST) and /api/admin/popular-routes/[id] (PUT/DELETE) for admin route management.
- Task 3 (blog-generator): subagent timed out; main agent built mini-services/blog-generator.
  - package.json: empty deps (resolves @prisma/client + z-ai-web-dev-sdk from parent project node_modules, same pattern as mail-service).
  - index.ts (port 3005): PrismaClient (DB at file:/home/z/my-project/db/custom.db), ZAI SDK.
  - 15 rotating Persian blog topics about VIP taxi travel.
  - generateArticle(): LLM chat.completions.create with system prompt (professional Persian travel writer for تاکسی ویژه سیوان) + user prompt requiring title/excerpt/HTML body (h2/h3/p, 600-900 words, justified-friendly paragraphs)/tags. Parses output, makes Persian-safe unique slug, generates 1344x768 cover image via zai.images.generations.create (base64 → public/images/blog/{slug}.png), saves BlogPost (status=published, publishedAt=now).
  - Retry-once on LLM failure. Robust try/catch, never crashes process.
  - Schedules generateArticle every 6h (setInterval). On startup: if <3 published posts → generate one after 5s; else if last post >6h old → generate one; else wait for next 6h cycle.
  - Bun.serve HTTP on 3005: GET /health, POST /generate (fire-and-forget trigger).
  - Started with setsid --fork bun run dev; verified /health returns {"ok":true,...}.
  - First article generated successfully: "سفر امن و آسوده: مقایسه ایمنی خودروی شخصی و تاکسی VIP" with cover image at /images/blog/....png. Confirmed in DB (status=published, featuredImageUrl set).
- Lint: passes clean (0 errors).

Stage Summary:
- Homepage popular-route prices now computed live from admin's PricingConfig per-km rates (no more hardcoded prices).
- Trip type labels standardized: اقتصادی، ویژه، لوکس، سوپر لوکس، خانوادگی.
- AI blog auto-generator running on port 3005: generates + publishes a new Persian article with AI cover image every 6 hours. Justified text applied by BlogPostModal CSS (text-justify). First post already published.
- Files changed: src/lib/pricing.ts, prisma/schema.prisma, src/components/sivan/BookingModal.tsx (carOptions), src/app/api/routes/popular/route.ts, src/app/api/admin/popular-routes/route.ts (new), src/app/api/admin/popular-routes/[id]/route.ts (new), scripts/seed-routes.mjs (new), mini-services/blog-generator/{package.json,index.ts} (new).

---
Task ID: 13
Agent: main
Task: Fix two critical runtime errors blocking homepage render (FleetSection hydration mismatch + jalaali year -100721 crash)

Work Log:
- Investigated FleetSection hydration error: server rendered "مرسدس بنز" but client expected "E". Confirmed current FleetSection.tsx code is correct (shortName: 'مرسدس بنز'). Root cause = stale Turbopack dev cache (browser running old compiled client bundle).
- Investigated jalaali "Invalid Jalaali year -100721" crash in BlogPreview. Inspected DB directly: both BlogPost records have valid publishedAt dates (2026-07-26, 2026-07-27). Tested toJalaali(2026,7,27) in isolation = works fine (returns jy:1405). Confirmed API returns valid ISO strings. Root cause = stale compiled code in .next cache.
- Hardened src/lib/jalaali.ts toJalaaliDate(): added instanceof Date check, Number.isFinite guard, and Gregorian year range validation (622–3821). Any out-of-range/corrupted date now falls back to getTodayJalaali() instead of throwing RangeError. This makes the date conversion bulletproof against any future bad DB values.
- Killed dev server (pkill -f "next dev"), deleted .next cache directory, restarted dev server fresh (setsid --fork node node_modules/.bin/next dev -p 3000).
- Verified via Agent Browser: page loads cleanly (GET / 200), no runtime errors, no hydration mismatches, no console errors. FleetSection tabs render correctly (سوناتا/مرسدس بنز/بیامو/آئودی/لندکروزر). BlogPreview section renders 2 posts with valid Jalali dates, no crash.

Stage Summary:
- Both blocking errors resolved. Homepage fully interactive again.
- jalaali.ts now defensively validates date inputs — will never crash the React tree on bad dates.
- Root cause of both errors was stale Turbopack dev cache; fixed by clearing .next and restarting dev server.
- Dev server running cleanly on port 3000.

---
Task ID: 14
Agent: main
Task: Fix blank live preview in cloud sandbox (cross-origin /_next/* asset blocking)

Work Log:
- User reported "live preview shows nothing" despite dev server returning GET / 200.
- Investigated dev.log: found the root cause warning — Next.js 16 cross-origin dev origin warning: "Cross origin request detected from preview-chat-*.space-z.ai to /_next/* resource". In Next.js 16, /_next/* dev assets (HMR client, chunks, React refresh) are blocked by default for origins not whitelisted, so the iframe preview got HTML but no JS → blank screen.
- Updated next.config.ts: added allowedDevOrigins = ["*.space-z.ai", "*.space-z.dev", "localhost", "127.0.0.1"] so the cloud-sandbox preview gateway can load /_next/* dev assets.
- Killed dev server, cleared .next cache, restarted fresh.
- Verified via Agent Browser: page loads, HMR connected ("[HMR] connected", "[Fast Refresh] done"), no errors in browser errors/console, full DOM renders (Navbar with Tehran clock 08:48, Jalali date 5 مرداد 1405, hero heading, popular routes, services, fleet tabs, blog posts, FAQ, footer). Cross-origin warning no longer appears in dev.log.

Stage Summary:
- Live preview blank-screen issue fixed by whitelisting the *.space-z.ai preview origin in next.config.ts allowedDevOrigins.
- Dev server running cleanly on port 3000, page fully interactive, no hydration/jalaali errors, no cross-origin blocking.

---
Task ID: 15
Agent: main
Task: Fix "Application error: a client-side exception has occurred" in live preview (stale service worker serving broken Turbopack chunks)

Work Log:
- Root cause: The PWA service worker (public/sw.js) was caching /_next/* dev chunks and navigation HTML. Next.js Turbopack changes chunk hashes on every recompile, so the SW served stale chunks whose URLs no longer exist on the server → React failed to bootstrap → generic "client-side exception" error page (blank preview).
- The previous session only skipped /_next/webpack-hmr in the SW fetch handler — that was insufficient because /_next/static/chunks/*.js were still being cache-first'd.
- Fixed public/sw.js fetch handler: added explicit DEV detection (hostname localhost/127.0.0.1 OR port 3000) and bypassed the SW entirely for all /_next/* and /__nextjs* paths in dev. Always skips HMR websocket. SW now only caches in production.
- Fixed src/components/sivan/PWARegister.tsx: SW registration is now PRODUCTION ONLY (process.env.NODE_ENV !== 'production' → return early). In dev, it proactively unregisters any existing SWs and clears all caches (so a stale SW from a previous session self-heals on next load), then reloads if any SW was found.
- Added src/app/global-error.tsx: a global error boundary that catches any uncaught client-side exception, shows a friendly Persian message (instead of the scary generic one), and automatically attempts SW cleanup + reload so the broken preview self-heals even if React crashes during bootstrap. Also exposes the underlying error.message in a <pre> for debugging.
- Restarted dev server fresh (killed, cleared .next, restarted). Verified via Agent Browser: GET / 200, page fully renders (Navbar, Tehran clock ۰۸:۵۱, Jalali date ۵ مرداد ۱۴۰۵, hero, all sections), HMR connected, 0 service workers registered in dev, no errors in browser console/errors. Lint passes clean.

Stage Summary:
- Client-side exception fixed at its root: SW no longer runs in dev, so Turbopack chunk hashes can change freely without stale-cache crashes.
- Added two layers of self-healing: (1) PWARegister dev cleanup unregisters stale SWs + clears caches on load, (2) global-error.tsx catches any residual crash and auto-cleans+reloads.
- Dev server running cleanly on port 3000. Preview should now render reliably in the gateway iframe.

---
Task ID: 16
Agent: main
Task: AI auto-blog generation every 6 hours (DeepSeek/ChatGPT via z-ai-web-dev-sdk) with image, SEO content, and justified Persian text

Work Log:
- Discovered an existing blog-generator mini-service at mini-services/blog-generator/index.ts (built in a previous session). It was functional but had a weak prompt, limited topics (15), no SEO structure, and image generation failed when prompts contained Persian text (content filter).
- Rewrote mini-services/blog-generator/index.ts (v2):
  - Expanded to 24 SEO-oriented topics, each with a focus keyword (e.g. "ایمنی سفر بین شهری", "سفر تهران به شیراز").
  - New SEO-focused LLM system prompt: instructs the model to act as a travel content + SEO specialist for "تاکسی ویژه سیوان", weave the focus keyword naturally into title/first paragraph/body/tags, produce a 150-160 char meta description, use h2/h3 heading hierarchy, include <ul>/<li> lists and a <blockquote>, and write 700-1000 words of justified-friendly long paragraphs.
  - parseArticle() now also extracts a metaDescription field.
  - generateCoverImage() rewritten: prompt is now pure English (no Persian) with 5 rotating cinematic luxury-car scenes to avoid the image API's content filter. Falls back to /images/luxury-car.png if generation fails.
  - Added runtime status tracking (isGenerating, lastGeneratedAt, lastError) exposed via GET /status and GET /health endpoints, with CORS headers so the Next.js proxy can call cross-origin.
- Created Next.js proxy routes so the admin panel works in both local dev and the gateway preview:
  - src/app/api/blog-generator/status/route.ts — GET proxies to http://localhost:3005/status
  - src/app/api/blog-generator/generate/route.ts — POST proxies to http://localhost:3005/generate
- Added AIBlogGenerator component to src/components/sivan/AdminPanel.tsx (inserted at the top of the BlogTab). It shows:
  - A gold-accented card with Sparkles icon, "تولید خودکار مقاله با هوش مصنوعی" heading, "هر ۶ ساعت" badge, and an explanation paragraph.
  - A "تولید فوری مقاله" (Generate Now) button that POSTs to /api/blog-generator/generate.
  - A live status grid (polled every 5s): وضعیت (running/ready), آخرین تولید (relative time), کل مقالات (count), زمان‌بندی (every 6h).
  - Auto-refreshes the post list when a generation completes (transitions running true→false).
- Imported Sparkles and Wand2 icons from lucide-react.
- Restarted the blog-generator service with `bun --hot` (auto-reloads on file changes). Confirmed health: {"ok":true,"running":false,"totalPosts":3}.
- End-to-end tested via Agent Browser:
  1. Logged into admin panel (admin/sivan2024), navigated to Blog tab.
  2. The AIBlogGenerator panel rendered correctly with status "آماده" and 3 total posts.
  3. Clicked "تولید فوری مقاله" — status changed to "در حال تولید", toast appeared.
  4. Polled /api/blog-generator/status: generation completed in ~45 seconds, totalPosts went 3→4→5 (ran twice).
  5. Verified the new post "راهنمای جامع ایمنی سفر بین شهری: تجربه‌ای امن با تاکسی VIP":
     - Has AI-generated cover image (161KB PNG at /images/blog/...png)
     - Content has <h2>, <h3>, <ul>, <blockquote>, 7 <p> tags (3491 chars)
     - 5 SEO tags including the focus keyword
     - Text alignment confirmed "justify" via computed style
  6. Opened the post from the homepage blog section → modal rendered the full article with image, justified paragraphs, gold h3 headings, and proper hierarchy.
- Lint passes clean. Dev server (port 3000) and blog-generator (port 3005) both running healthy.

Stage Summary:
- AI blog auto-generation is fully functional and integrated:
  - Every 6 hours the blog-generator service automatically creates a new SEO-optimized Persian article with an AI cover image and justified HTML text.
  - Admin can trigger immediate generation from the Blog tab with live status polling.
  - Articles are SEO-structured (focus keyword, meta description, h2/h3 hierarchy, lists, blockquotes, tags).
  - Cover images are generated from safe English prompts (5 rotating luxury-car scenes) with a fallback.
  - Works in both local dev (via Next.js proxy routes) and the cloud-sandbox preview (via gateway XTransformPort).
- BlogPostModal already had text-justify styling (text-justify + [&_p]:text-justify), so no CSS changes were needed.
- The 24-topic rotation ensures content variety and SEO relevance to the site's VIP taxi travel niche.

---
Task ID: 17
Agent: main
Task: Diversify AI blog topics — not only travel safety, also tourism, luxury cars vs economy cars, scenic destinations, etc.

Work Log:
- User clarified the AI blog should NOT be only about travel safety. It should also cover گردشگری (tourism), خودروهای لوکس و مزایا نسبت به اقتصادی (luxury cars & their advantages over economy cars), مناطق زیبای گردشگری (scenic tourist areas), and similar diverse topics.
- Inspected existing DB: all 5 previously generated posts were safety-focused (راهنمای ایمنی سفر...) — confirmed the problem.
- Rewrote mini-services/blog-generator/index.ts (v3):
  - Added a TopicCategory union: 'tourism' | 'luxury-cars' | 'luxury-vs-economy' | 'travel-guide' | 'travel-tips' | 'safety' | 'sivan-brand'.
  - Expanded TOPICS from 24 → 45 topics across the 7 categories:
    * tourism (12): جاذبه‌های مشهد/شیراز/اصفهان/نوشهر/کیش/قشم/ماسوله/تبریز/یزد/کرمان + best travel season + salt lake
    * luxury-cars (12): امکانات/صندلی چرمی/عایق صدا/تهویه/تعلیق/ایمنی فعال/طراحی داخلی + Mercedes E/BMW 5/Audi A6/Land Cruiser/Sonata
    * luxury-vs-economy (7): لوکس یا اقتصادی/هزینه پنهان اقتصادی/ارزش لوکس در جاده/مقایسه راحتی/خستگی راننده/ایمنی لوکس-اقتصادی/فضای داخلی و چمدان
    * travel-guide (6): تهران→مشهد/اصفهان/شیراز/رشت/تبریز/کیش
    * travel-tips (5): بسته‌بندی/خستگی/استراحت در جاده/سفر با کودکان/زمان سفر
    * safety (2): فقط ایمنی سفر شب + چک‌لیست ایمنی خودرو (intentionally minimal)
    * sivan-brand (3): چرا سیوان/تفاوت با آژانس/هزینه تاکسی VIP
  - Added weighted CATEGORY_ORDER rotation (13 entries) so the blog has a balanced mix and safety is only ~1 in 13 posts. pickTopic() now picks the next category in the rotation, then the next unused topic within that category — prevents topic-clumping.
  - Added category-aware COVER_SCENES: each category has its own pool of purely-English image prompts (tourism gets Persian landscapes/architecture, luxury-cars gets interiors/detail shots, luxury-vs-economy gets side-by-side comparisons, travel-guide gets scenic highways, travel-tips gets lifestyle/suitcase shots, safety gets rest-stop/dashboard shots, sivan-brand gets fleet/chauffeur shots). This gives visual variety matching the article's theme.
  - Updated generateCoverImage() signature to accept the full Topic and pick scenes from COVER_SCENES[topic.category].
  - Updated LLM system prompt to explicitly mention the diverse topic scope (گردشگری، خودروهای لوکس، مقایسه با اقتصادی، راهنمای سفر، نکات عملی، گاهی ایمنی) so the model writes content in the right tone for each category.
- Verified end-to-end via Agent Browser:
  - Triggered 2 immediate generations.
  - Post #6: "جاذبه‌های گردشگری مشهد: راهنمای جامع دیدنی‌های حضرت رضا (ع)" — tourism category, with AI cover image (Persian mosque/landscape scene), 2915 chars of HTML content, SEO tags including focus keyword, natural mention of Sivan.
  - Post #7: "امکانات خودرو لوکس: تجربه‌ای متفاوت از سفر" — luxury-cars category, with AI cover image (luxury interior scene), 9 paragraphs, 5 h2, 4 h3, justified text confirmed (firstP textAlign=justify), h3 in gold #D4AF37.
  - Homepage blog section displays both new diverse posts with cover images rendered.
  - Modal opens correctly, cover image loads, justified Persian text, proper heading hierarchy, gold h3 headings.
- Lint passes clean. Blog-generator service (port 3005) running healthy with bun --hot auto-reload.
- Dev server (port 3000) running cleanly, no errors.

Stage Summary:
- AI blog topics now diverse across 7 categories (tourism, luxury-cars, luxury-vs-economy, travel-guide, travel-tips, safety, sivan-brand) with 45 total topics.
- Weighted rotation ensures tourism/luxury-cars dominate (~5/13 each), safety is minimal (~1/13).
- Cover images are category-aware: tourism articles get scenic Persian landscapes, luxury-car articles get interior/detail shots, etc.
- LLM system prompt updated to embrace the diverse scope and write in the right tone per category.
- Verified 2 new posts generated correctly (tourism + luxury-cars) with proper SEO structure, AI cover images, and justified text in the modal.
- Files changed: mini-services/blog-generator/index.ts (TOPICS expansion, CATEGORY_ORDER rotation, COVER_SCENES per-category, generateCoverImage signature, system prompt).

---
Task ID: 18
Agent: full-stack-developer
Task: SEO infrastructure — make blog articles indexable by Google (SSR blog pages, sitemap, robots, JSON-LD, Open Graph)

Work Log:
- Read worklog.md and reviewed prior work (Tasks 1–17). Studied existing infrastructure: BlogPost Prisma model, db.ts singleton, jalaali.ts helpers, layout.tsx, Navbar/Footer components, /api/blog routes, BlogPreview modal component.
- Inspected DB: 7 published BlogPosts (Persian slugs, some with ZWNJ). SiteSettings.siteUrl = "https://sivantaxi.com".
- Created src/lib/site-url.ts:
  * `getSiteUrl()` async helper reading siteUrl from SiteSettings DB row (id='main'), with module-level cache + in-flight promise dedup. Falls back to DEFAULT_SITE_URL ('https://sivantaxi.com') on any error.
  * `absoluteUrl(path)` builds absolute URL from a relative path using getSiteUrl() as base.
- Created src/app/blog/page.tsx (SSR Server Component):
  * Exports `metadata` (title "بلاگ سیوان | مقالات سفر و گردشگری", description, keywords, canonical /blog, OG, robots index,follow).
  * Fetches 24 latest published posts via db.blogPost.findMany with category + author includes.
  * Hero header with "بازگشت به خانه" link, gold-accent badge "مجله سفر سیوان", h1 "بلاگ سیوان".
  * Responsive grid: 1 col mobile / 2 cols sm / 3 cols lg. Each card is a real `<a href="/blog/{slug}">` (via Next.js Link, prefetch=false) so Googlebot can crawl.
  * Card shows: cover image with `alt=title`, h2 title (line-clamp-2), excerpt (line-clamp-3), Jalali date in `<time dateTime=ISO>`, read-time estimate, category badge.
  * Empty state when no posts. Back-to-home CTA at bottom.
  * Dark theme: bg-[#0a0a0a], cards bg-[#1a1a1a] border-[#333] hover:border-[#D4AF37]/30.
- Created src/app/blog/[slug]/page.tsx (SSR Server Component):
  * `generateStaticParams()` returns all published post slugs (for build-time pre-rendering).
  * `generateMetadata({ params })` returns full Metadata per post: title, description (excerpt or stripped content first 155 chars), keywords (parsed tags + base keywords), canonical `/blog/{slug}`, openGraph (article type, absolute URL, image 1200x630 with alt, publishedTime, authors, siteName, fa_IR locale), twitter (summary_large_image card with image), robots index,follow.
  * Page component:
    - Awaits `params` (Next.js 16 async params).
    - `getPost(slug)` does a read-only findUnique (no viewCount increment). Critical fix: normalises the slug via `decodeURIComponent` when it still contains `%` — Next.js 16 / Turbopack passes non-ASCII dynamic-route params percent-encoded in dev, which would otherwise fail the DB lookup and 404 every Persian-slug page.
    - `notFound()` if post missing or not published.
    - Reads `user-agent` from `headers()` (Next.js 16 async). If matches bot pattern (googlebot|bingbot|slurp|duckduckbot|facebot|facebookexternalhit|twitterbot|linkedinbot|semrushbot|ahrefsbot|crawler|spider|bot), SKIPS the viewCount increment so crawlers don't inflate counts. Real visitors still increment views.
    - Renders `<article>` with: breadcrumb `<nav>` (Home > Blog > Title), category badge, h1 title, excerpt sub-headline, meta row (author avatar circle, Jalali published date in `<time>`, read time, view count with Eye icon).
    - Cover image (responsive, alt=title) if featuredImageUrl present.
    - Content via `dangerouslySetInnerHTML` in a prose-styled div with text-justify + Tailwind arbitrary variants: `text-justify [&_p]:text-justify [&_p]:my-3 [&_p]:leading-8 [&_h2]:text-[#fafafa] [&_h2]:mt-8 [&_h3]:text-[#D4AF37] [&_ul]:list-disc [&_ol]:list-decimal [&_blockquote]:border-r-4 [&_blockquote]:border-[#D4AF37]/60 [&_a]:text-[#D4AF37] [&_img]:rounded-lg [&_strong]:text-[#fafafa]`.
    - Tags section (parsed from JSON) as gold badges.
    - CTA box: "برای رزرو سفر لوکس با سیوان تماس بگیرید" with two phone `<a href="tel:...">` links (gold solid + gold outline).
    - "مقالات مرتبط" section: fetches 3 other recent published posts (excluding current) and shows small linked cards with cover image, title, Jalali date.
    - Two JSON-LD `<script type="application/ld+json">` blocks: Article schema (headline, description, image absolute URL, datePublished, dateModified, author=Organization, publisher=Organization with logo ImageObject, mainEntityOfPage, keywords, articleSection) + BreadcrumbList schema (3 items: Home / Blog / Title).
  - Wrapped in site Navbar + Footer.
- Created src/app/sitemap.ts (MetadataRoute.Sitemap):
  * Fetches siteUrl via getSiteUrl() (async).
  * Returns entries: home (priority 1.0, daily), /blog (0.9, hourly), /#services /#fleet /#routes /#contact (0.5–0.6), and one entry per published post using updatedAt as lastModified (0.8, weekly).
  * DB-failure resilient — still returns the static entries if the query errors.
- Created src/app/robots.ts (MetadataRoute.Robots):
  * Allows all user-agents on /, disallows /api/ and /admin/.
  * Explicit Googlebot + Bingbot rules.
  * `host: siteUrl`, `sitemap: ${siteUrl}/sitemap.xml`.
- Removed public/robots.txt (via `rm -f`) — Next.js serves the dynamic one from app/robots.ts, but a static public/robots.txt would take precedence.
- Bug found and fixed during verification:
  * Initial curl tests on /blog/{persian-slug} returned 404 despite the slug existing in DB. Debug logging showed Next.js 16 was passing the percent-encoded form (e.g. "%D8%B3%D9%81%D8%B1-...") to the page component's params.slug, not the decoded UTF-8 string. The DB lookup then failed because the stored slug is the decoded form.
  * Fixed by normalising the slug inside getPost(): `if (slug.includes('%')) slug = decodeURIComponent(slug)` before the findUnique. Same path is used by generateMetadata so OG/canonical URLs are correct.
  * Verified both with simple ASCII-free slugs and slugs containing ZWNJ (U+200C, %E2%80%8C) — all return 200.
- Verification (curl):
  * `GET /blog` → 200, 183 KB, contains `<title>بلاگ سیوان | مقالات سفر و گردشگری</title>`, h1 "بلاگ سیوان", and 7 real `<a href="/blog/{slug}">` links to all published posts.
  * `GET /sitemap.xml` → 200, valid XML, contains home + /blog + 4 anchor entries + 7 post URLs with correct priorities and lastModified dates.
  * `GET /robots.txt` → 200, dynamic output with Allow:/, Disallow:/api/ and /admin/, Host and Sitemap pointers.
  * `GET /blog/سفر-امن-و-آسوده-مقایسه-ایمنی-خودروی-شخصی-و-تاکسی-VIP-1llkr1` → 200, 154 KB, contains `<title>سفر امن و آسوده: مقایسه ایمنی خودروی شخصی و تاکسی VIP</title>`, `<h1>` with the post title, 2 JSON-LD scripts (Article + BreadcrumbList), full OG article meta (og:type=article, og:image absolute URL 1200x630, og:locale=fa_IR), twitter:card=summary_large_image, canonical link, tel: links, "مقالات مرتبط" section with 3 related post links, content rendered via dangerouslySetInnerHTML (NOT a loading spinner — pure SSR).
  * `GET /blog/this-slug-does-not-exist-xyz123` → 404 (notFound() triggered properly).
  * `GET /blog/{slug}` with `User-Agent: Googlebot/2.1` → 200, viewCount NOT incremented (verified by querying DB before/after).
- Lint: `bun run lint` passes with 0 errors and 0 warnings (auto-fixed 3 unused eslint-disable directives via --fix).
- Dev server log: no compile errors. All routes return expected status codes.

Stage Summary:
- Blog articles are now fully indexable by Google and other search engines via dedicated SSR pages at /blog (listing) and /blog/{slug} (article). No more modal-only access.
- Complete SEO infrastructure delivered: SSR HTML with article content (no JS required to read), per-post Metadata (title, description, keywords, canonical, OG article, Twitter card), JSON-LD Article + BreadcrumbList structured data for rich results, dynamic sitemap.xml covering all published posts, dynamic robots.txt pointing to sitemap.
- Internal link graph created: blog listing → posts → related posts → back to blog (3+ hops of internal linking Google loves).
- Bot-aware view counting: Googlebot/Bingbot/etc. fetches don't inflate viewCount.
- Files created: src/lib/site-url.ts, src/app/blog/page.tsx, src/app/blog/[slug]/page.tsx, src/app/sitemap.ts, src/app/robots.ts.
- File removed: public/robots.txt (replaced by dynamic app/robots.ts).
- Sample post tested: slug "سفر-امن-و-آسوده-مقایسه-ایمنی-خودروی-شخصی-و-تاکسی-VIP-1llkr1" — title "سفر امن و آسوده: مقایسه ایمنی خودروی شخصی و تاکسی VIP".

---
Task ID: 19
Agent: main
Task: Make AI blog articles indexable by Google and other search engines (SSR pages, sitemap, robots, JSON-LD, crawlable links)

Work Log:
- Audited existing SEO infrastructure: blog posts only opened in a modal (Google can't index modals), no sitemap.xml, static robots.txt without sitemap pointer, no per-post meta tags, no JSON-LD structured data.
- Delegated heavy SEO infrastructure build to full-stack-developer subagent (Task 18), which created:
  - `src/lib/site-url.ts` — getSiteUrl()/absoluteUrl() helpers reading SiteSettings.siteUrl from DB (fallback https://sivantaxi.com)
  - `src/app/blog/page.tsx` — SSR blog listing (Server Component): fetches 24 published posts, renders responsive grid of real <a href> cards, exports metadata
  - `src/app/blog/[slug]/page.tsx` — SSR individual post page:
    * generateStaticParams() for all published slugs
    * generateMetadata() per post: title, description, keywords, canonical, OG article (image 1200x630, fa_IR locale), Twitter summary_large_image, robots index/follow
    * Reads user-agent via headers() and SKIPS viewCount increment for bots (Googlebot/Bingbot/etc.) — real visitors still count
    * Renders <article> with breadcrumb nav, h1, meta row, cover image, justified prose content, tags, related-posts section, CTA box
    * Injects 2 JSON-LD <script> blocks: Article schema (headline/description/image/datePublished/dateModified/author/publisher/mainEntityOfPage/keywords) + BreadcrumbList schema
  - `src/app/sitemap.ts` — dynamic MetadataRoute.Sitemap: home + /blog + section anchors + 1 entry per published post (priority 0.8, weekly, updatedAt)
  - `src/app/robots.ts` — dynamic MetadataRoute.Robots: allow all, disallow /api/ and /admin/, explicit Googlebot/Bingbot rules, points to sitemap
  - Removed `public/robots.txt` (static file would override dynamic app/robots.ts)
  - Fixed Turbopack percent-encoding issue: dynamic route params.slug arrives percent-encoded for non-ASCII slugs, so added decodeURIComponent() normalization in getPost()
- Updated `src/components/sivan/BlogPreview.tsx` (main agent):
  - Added `import Link from 'next/link'`
  - Rewrote card rendering: API posts (with slug) now render inside a real `<Link href="/blog/{slug}">` (crawlable <a> tag) instead of a div that only opens a modal. Static fallback posts (no slug) still use the modal.
  - Replaced the inner Button with a styled span (since the whole card is now a link)
  - Added `loading="lazy"` to card images for performance
  - Added `aria-label` and `title` on the Link for accessibility
  - Added "مشاهده همه مقالات" link button at the bottom of the blog section → links to /blog (another crawl path for Google)
  - Removed unused Button import
- Verified end-to-end via curl (server-rendered HTML that Googlebot sees):
  * GET /blog/{slug} → 200, HTML contains: <title>, <meta description>, <link canonical>, <meta og:title>, <meta og:type=article>, <meta twitter:card=summary_large_image>, 2 JSON-LD scripts (Article + BreadcrumbList schemas), <h1> with post title, <article> element with full content
  * GET /sitemap.xml → 200, valid XML with home + /blog + all posts + section anchors
  * GET /robots.txt → 200, dynamic, points to sitemap, disallows /api/ and /admin/
  * GET /blog/nonexistent → 404 (proper notFound())
- Verified end-to-end via Agent Browser:
  * Homepage blog section: 6 crawlable <a href="/blog/..."> links (3 post cards + view-all + 2 more)
  * Clicked "مشاهده همه مقالات" → navigated to /blog, page title "بلاگ سیوان | مقالات سفر و گردشگری", h1 "بلاگ سیوان", 7 card links, 7 images all with alt
  * Clicked a post card → navigated to /blog/{slug}, page title = post title
  * Verified all SEO elements on post page: h1, article, cover img with alt, 9 paragraphs (textAlign=justify), 8 h2, 7 h3 (color=rgb(212,175,55)=gold), 2 breadcrumb links, 3 related-post internal links, 2 JSON-LD blocks, meta description, canonical, og:type=article, og:image, twitter:card=summary_large_image
- Lint passes clean (0 errors). Dev server running cleanly on port 3000.

Stage Summary:
- Blog articles are now fully indexable by Google and other search engines:
  1. Each post has a dedicated SSR page at /blog/{slug} (Google reads server-rendered HTML, not a modal)
  2. generateMetadata() provides unique title/description/keywords/canonical/OG/Twitter per post
  3. JSON-LD Article + BreadcrumbList schemas enable Google rich results
  4. Homepage blog cards are real <a href> links (crawlable) + "view all" link to /blog
  5. /blog listing page provides a full post index (another crawl hub)
  6. Related-posts section on each post creates internal link graph
  7. Dynamic /sitemap.xml lists all posts with priorities and lastmod
  8. Dynamic /robots.txt points Googlebot to the sitemap
  9. Bots don't inflate viewCount (user-agent detection)
- Files changed: src/lib/site-url.ts (new), src/app/blog/page.tsx (new), src/app/blog/[slug]/page.tsx (new), src/app/sitemap.ts (new), src/app/robots.ts (new), public/robots.txt (deleted), src/components/sivan/BlogPreview.tsx (updated to use Link).

---
Task ID: 20
Agent: main
Task: Add custom-topic article generation box in admin Blog panel (AI generates article on admin's chosen topic, WITHOUT affecting the 6-hour auto-rotation schedule)

Work Log:
- User requested: in the admin Blog panel, next to the existing "تولید فوری مقاله" button, add a box where the admin can type a topic and the AI generates an article based on that topic. The generated article must NOT affect the automatic 6-hour schedule.
- Analyzed the blog-generator service architecture:
  * 6-hour timer is a fixed `setInterval` — already independent of on-demand generations (never reset).
  * BUT `pickTopic()` advances `cycleIndex` + `categoryTopicIndex` — if custom generations called pickTopic(), they'd consume/advance the auto-rotation, so the next scheduled generation would skip a topic.
  * Solution: custom generations must NOT call pickTopic() at all.
- Refactored `mini-services/blog-generator/index.ts`:
  - Added `deriveKeyword(topic)`: extracts a meaningful SEO keyword from a free-form Persian topic by stripping common stopwords, keeping up to 5 significant words.
  - Added `classifyTopic(topic)`: heuristically classifies the custom topic into one of the 7 cover-image categories (tourism/luxury-cars/luxury-vs-economy/travel-guide/travel-tips/safety/sivan-brand) by keyword matching (handles both ی and ي, ک and ك Persian forms), so the generated cover image matches the article's theme. Falls back to 'travel-guide'.
  - Changed `generateArticle()` signature to `generateArticle(customTopic?: string)`:
    * When customTopic is provided (trimmed, non-empty): builds a Topic object from it (title=customTopic, keyword=deriveKeyword, category=classifyTopic) and does NOT call pickTopic(). cycleIndex/categoryTopicIndex stay unchanged.
    * When no customTopic: calls pickTopic() as before (advances rotation).
    * Returns `custom: boolean` flag in the result so callers can distinguish.
  - Added new endpoint `POST /generate-custom`: reads `{ topic: string }` JSON body, validates (3-200 chars), logs "admin requested custom topic", calls `generateArticle(topic)` fire-and-forget. Returns `{ started: true, custom: true, topic }`. Has the same `isGenerating` guard so it can't conflict with an in-progress generation. Persian error messages.
- Created proxy API route `src/app/api/blog-generator/generate-custom/route.ts`:
  - POST handler, reads JSON body, validates topic (3-200 chars, Persian error messages), forwards to `http://localhost:3005/generate-custom`.
  - Same gateway-friendly pattern as the existing /generate proxy.
- Updated `src/components/sivan/AdminPanel.tsx` `AIBlogGenerator` component:
  - Added `import { Textarea } from '@/components/ui/textarea'` and `PenLine` icon.
  - Added state: `customTopic` (string), `customTriggering` (boolean).
  - Added `handleCustomGenerate()`: validates the topic, POSTs to `/api/blog-generator/generate-custom` with `{ topic }`, shows success toast with the topic name, clears the input, triggers status refresh. Handles errors and the "already generating" case.
  - Added UI section (below the status grid, separated by a border-top divider):
    * Header row: PenLine icon + "تولید مقاله با موضوع دلخواه" label + a gold badge "بدون تأثیر روی زمان‌بندی ۶ ساعته" (clearly communicates the independence guarantee).
    * Explanation paragraph: tells admin to enter a travel/tourism/luxury-car topic, AI writes an SEO article with image, and confirms the schedule is unaffected.
    * Textarea (2 rows, maxLength 200, placeholder "مثال: جاذبه‌های گردشگری جزیره هرمز و دره ستارگان", disabled while generating). Supports Ctrl+Enter / Cmd+Enter to submit.
    * "تولید با این موضوع" button (gold, disabled when topic < 3 chars or a generation is in progress).
    * Character counter "{n} / ۲۰۰" in Persian digits + "Ctrl+Enter برای ارسال سریع" hint.
- Verified end-to-end:
  1. Service: tested /generate-custom validation (rejects short topics), fire-and-forget start.
  2. Generated custom post "سفر به رویای زمینی: جاذبه‌های گردشگری جزیره هرمز و دره ستارگان" from the curl test topic — confirmed in DB with cover image + SEO tags.
  3. Agent Browser: logged into admin panel, navigated to Blog tab, confirmed the "تولید مقاله با موضوع دلخواه" box + textarea + button are all visible.
  4. Filled the textarea with "مزایای سفر با خودرو لوکس در جاده‌های کوهستانی ایران" → button enabled → clicked → toast "تولید مقاله با موضوع «...» شروع شد" appeared → status changed to "در حال تولید".
  5. Generation completed (~100s): new post "تجربه‌ای بی‌نظیر: مزایای سفر با خودرو لوکس در جاده‌های کوهستانی ایران" published with cover image + SEO tags derived from the custom topic. Total posts: 6→7.
  6. **Rotation independence proven**: after the 2 custom generations, triggered an AUTO /generate — it picked "جاذبه‌های گردشگری مشهد" (the correct next topic in rotation), NOT a skipped/duplicated one. The service log shows the 2 CUSTOM entries did not call pickTopic(), so cycleIndex was only advanced by auto-generations.
- Lint passes clean (0 errors). Dev server (3000) + blog-generator (3005) both running healthy.

Stage Summary:
- Admin can now type any custom topic in the Blog panel and get an AI-generated SEO article on that exact topic (with cover image + derived SEO keyword + category-matched cover scene).
- Custom generations are 100% independent of the 6-hour auto-rotation: they don't call pickTopic(), don't advance cycleIndex/categoryTopicIndex, and don't reset the setInterval timer. The next scheduled generation picks the correct next topic as if no custom generation happened.
- Files changed: mini-services/blog-generator/index.ts (deriveKeyword, classifyTopic, generateArticle(customTopic?), POST /generate-custom endpoint), src/app/api/blog-generator/generate-custom/route.ts (new proxy), src/components/sivan/AdminPanel.tsx (Textarea import, PenLine icon, customTopic state, handleCustomGenerate, custom-topic UI section).

---
Task ID: blog-topic-specific-images
Agent: main
Task: Make AI-generated blog cover images specifically related to each article's actual topic (not just its broad category). User request: "باید عکس مقاله مرتبط با موضوع مقاله باشه"

Work Log:
- Reviewed existing blog-generator (mini-services/blog-generator/index.ts): cover images were picked from a FIXED category-based scene pool (COVER_SCENES), so a Hormuz-Island article would get a generic "Iranian tourism" scene, not a Hormuz-specific one.
- Added new function `generateImagePrompt(title, topic)` that asks the LLM to produce ONE specific, English-language image prompt that visually depicts the article's ACTUAL subject (exact place, exact car model, exact concept). Includes:
  - Category-specific style hint (automotive vs travel vs premium photography)
  - Instruction to translate Persian place/car names to English equivalents (e.g. "Hormuz Island", "Mercedes-Benz E-Class")
  - Hard rules: no text/watermark, no faces, photorealistic, 20-80 words
  - Cleanup of model output (strip quotes, markdown fences, "Prompt:" prefixes)
  - Length validation (15-600 chars) and guaranteed no-text suffix
- Modified `generateCoverImage()` to try the LLM-generated topic-specific prompt FIRST, falling back to the category-based COVER_SCENES pool only if the LLM call fails or returns invalid output.
- Added console logging of the chosen prompt for observability.
- Applied to ALL articles (custom AND auto-scheduled), so every cover is now topically relevant.
- Restarted via `bun --hot` (auto-reloaded). Service healthy on port 3005.

Verification:
- Triggered custom generation with topic "جاذبه‌های گردشگری جزیره هرمز و خاک سرخ آن".
- Log confirmed topic-specific prompt: "A rugged 4x4 vehicle drives across the vibrant red soil of Hormuz Island, with the turquoise Persian Gulf and dramatic r…"
- Article published: "سفر به رویایی سرخ؛ جاذبه‌های گردشگری جزیره هرمز خاک" with image /images/blog/...-2xhyxi.png (203KB).
- VLM (glm-5v-turbo) analysis of the new image: "tan/beige Jeep Wrangler driving on a reddish-brown sandy beach... Yes, this appears to be related to Hormuz Island's red soil and the Persian Gulf... No visible text or watermark." ✓
- BEFORE/AFTER comparison: older Qazvin "دولتخانه قزوین" article (pre-change) got a VLM verdict of "generic scenic road/highway, does not depict the Chehel Sotoun palace" — confirming the old approach was generic.
- Agent Browser: blog listing page (/blog) renders 10 posts including the new Hormuz article at top; individual article page loads (200) with cover image 1344×768 and correct alt text; related-posts images also render.

Stage Summary:
- Blog cover images are now generated from a topic-specific LLM prompt (not a fixed category scene pool), so each cover visually matches its article's actual subject.
- Applies to both custom-topic and auto-scheduled (6h) generations.
- Robust fallback to category-based scene pool if LLM prompt generation fails.
- Verified end-to-end via logs, VLM image analysis, and Agent Browser.

---
Task ID: register-and-logo
Agent: main
Task: (1) Add passenger registration option so users can sign up. (2) Replace site logo with user-uploaded sivanlogo.JPG.

Work Log:
LOGO:
- User uploaded /home/z/my-project/upload/sivanlogo.JPG (822x768 JPEG, "SIVAN VIP TAXI" circular logo with taxi silhouette, gold/red/charcoal palette).
- Installed sharp, converted uploaded JPG to a proper 512x512 PNG with white contain-background at /home/z/my-project/public/logo.png (backed up old logo to logo.old.bak).
- VLM-verified the converted PNG: shows "SIVAN" gold, "VIP" red, "TAXI" charcoal, taxi silhouette, circular border, "24/7".
- logo.png now served with correct content-type image/png (HTTP 200, 143KB). All existing references (Navbar, Footer, BookingModal, HeroSection, AdminPanel, blog JSON-LD) automatically pick up the new logo since they all use src="/logo.png".

REGISTRATION:
- Updated src/lib/store.ts AuthState: mode now 'login' | 'register'; added fullName + phone fields; added setAuthFullName + setAuthPhone actions; closeAuth/openAuth reset the new fields.
- Updated src/app/api/auth/register/route.ts: added required `password` field (min 4) to zod schema; now stores user.password so the user can log back in via /api/auth/login (which checks user.password === password).
- Rewrote src/components/sivan/AuthModal.tsx into a dual-mode modal:
  * Login mode: username + password (unchanged behavior, admin still opens admin panel).
  * Register mode: fullName + phone (Iranian mobile regex 09XXXXXXXXX) + password (min 4).
  * Toggle links at the bottom switch between modes without closing the modal.
  * Client-side validation with inline error messages.
  * On successful registration: auto-logs-in the passenger (sets auth.user + isVerified), shows success screen + toast, no second login needed.
  * Show/hide password eye toggle preserved.
- Updated src/components/sivan/Navbar.tsx: added a "ثبت‌نام" ghost/outline button next to the existing "ورود" gold button, in both the desktop header and the mobile sheet.

Verification:
- Lint: clean (no errors).
- Dev log: POST /api/auth/register 200, POST /api/auth/login 200, no runtime errors.
- Agent Browser:
  * Homepage header shows new SIVAN VIP TAXI logo (VLM-confirmed) + both "ثبت‌نام" and "ورود" buttons.
  * Register modal: 3 fields render, submit disabled until valid; filling valid data + submit -> success screen + toast "ثبت‌نام موفق بود! خوش آمدید، تست کاربر سیوان عزیز".
  * DB check: user created with phone, fullName, password (matches), role=passenger, linked Passenger profile with referral code REF-XXXXXX.
  * Login modal: logging in with the just-registered phone+password -> success screen + toast "خوش آمدید، تست کاربر سیوان عزیز".
  * Toggle link "ثبت‌نام کنید" / "وارد شوید" switches modes correctly.
- Cleaned up the test user from DB after verification.

Stage Summary:
- New SIVAN VIP TAXI logo (from user upload) is live across the entire site (navbar, footer, modal, admin, blog JSON-LD).
- Passengers can now register (fullName + phone + password) via a dedicated "ثبت‌نام" button; registration auto-logs them in and creates a Passenger profile with referral code. Registered users can log back in with phone+password.
- Admin login (admin/sivan2024) is unaffected.
