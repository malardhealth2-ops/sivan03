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
