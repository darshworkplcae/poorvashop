# 🛒 OM SHOP — Setup Guide
## Scale → Cloud → Website: Full Setup in 4 Steps

---

## ⚙️ STEP 1: Supabase (Free Cloud Database)

1. Go to **https://supabase.com** → Sign Up (free)
2. Click **"New Project"** → Name it `om-shop` → Set a password → Create
3. Wait ~2 minutes for setup
4. Go to **SQL Editor** → **"New Query"** → Paste entire `supabase-setup.sql` file → Click **Run**
5. Go to **Settings → API** → Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## 🌐 STEP 2: Deploy Website to Cloudflare Pages

1. Push this project to GitHub:
   ```
   git init
   git add .
   git commit -m "OM SHOP initial"
   git push (create GitHub repo first at github.com)
   ```
2. Go to **https://pages.cloudflare.com** → Sign Up → New Project
3. Connect your GitHub repo → Select `om-shop`
4. Build settings:
   - **Framework**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
5. **Environment Variables** (click "Add variable"):
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
6. Click **Deploy** → Wait 1-2 min → Your site is live at `om-shop.pages.dev`!

---

## 🔌 STEP 3: Set Up Scale Bridge on Shop PC

**First time only (one-time setup):**
1. Open `C:\OM SHOP\bridge\` folder
2. Double-click **`INSTALL.bat`** → wait for packages to install
3. Open **`config.json`** in Notepad → change:
   ```json
   "supabaseUrl": "https://YOUR-PROJECT.supabase.co",
   "supabaseKey": "YOUR-ANON-KEY-HERE"
   ```
4. Plug in scale USB cable → open **Device Manager** → find the COM port (e.g. COM3)
5. In `config.json` → change `"comPort": "COM3"` to your port number
6. Double-click **`ENABLE-AUTO-START.bat`** → bridge now starts automatically on PC boot

**Every day (nothing to do!):**
- Turn on PC → bridge starts silently in background
- Plug scale USB (already plugged in) → bridge detects it automatically
- Use scale as normal → bills save to cloud automatically

---

## 📱 STEP 4: Open the Website

- **Any phone or PC** → open browser → go to `om-shop.pages.dev`
- **See all transactions** in real-time
- Dashboard updates automatically when Om presses PRINT on scale

---

## 🔄 How It All Works (Simple Explanation)

```
Om's Shop:
  Scale (Sharp RKS-35)
  ├── Port 1 → Printer  ← UNCHANGED (dealer's setup)
  └── Port 2 → USB cable → PC

PC (auto-starts when turned on):
  bridge.js (silent, no window)
  └── reads scale data → saves to Supabase cloud

Cloud (Supabase - free):
  Database stores all bills

Any phone/PC anywhere:
  Opens om-shop.pages.dev → sees all bills live
```

---

## ❓ Answer for Dealer

> "We connect Port 2 of the scale (currently unused) to PC via USB cable you provide.
>  Port 1 stays connected to printer — your setup is completely untouched.
>  When Om presses PRINT, scale sends data to both ports simultaneously.
>  Port 1 prints the receipt as normal. Port 2 sends to our software which records it.
>  No interference with your software whatsoever."

---

## 🗑️ Delete Transactions

- Go to **Bill History** → click 🗑️ button on any bill
- Bill is **hidden from totals** (day/week/month earnings won't count it)
- Bill still visible in **"हटाए गए" (Deleted)** tab
- Can **restore** at any time with "↩️ वापस" button
- Record is NEVER actually deleted from database

---

## 📞 Support
Sharp Electronics Pune: 8888114433 / 9422008507
Website: www.sharpweighingscale.com
