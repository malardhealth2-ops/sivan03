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
