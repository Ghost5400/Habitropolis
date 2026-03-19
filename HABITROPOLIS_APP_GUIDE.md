# 🏙️ HABITROPOLIS — Complete App Guide & Feature Reference

> **IMPORTANT:** Share this file with AI assistants to give them full context about the app.
> This document describes every feature, how it works, and what the expected behavior is.

---

## 📌 What is Habitropolis?

Habitropolis is a **gamified habit tracker** web app built with **React + Vite + Supabase**.
Users create habits, track them daily/weekly/monthly, maintain streaks, earn coins, and build
a virtual city that grows as they keep their habits. It's designed for a classroom/school setting.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| Deployment | Vercel |
| Icons | Lucide React |
| Styling | Vanilla CSS with CSS Variables (dark theme, glassmorphism) |
| Sound | Web Audio API (procedural, no external audio files) |
| Fonts | Google Fonts — Outfit + Inter |

---

## 🗂️ Supabase Tables

| Table | Purpose |
|---|---|
| `profiles` | User profile: display_name, avatar_url, coins, premium flag |
| `habits` | User habits: name, type, frequency, difficulty, color, target_value |
| `habit_logs` | Daily log entries: habit_id, date, completed (bool), value (int) |
| `streaks` | Per-habit streak tracking: current_streak, best_streak, last_completed_at |
| `city_buildings` | One building per habit: floors, golden_stars, decorations (JSON array) |
| `decorations` | Master catalog of available decorations |
| `user_decorations` | Owned decorations: decoration_id, building_id (null = in inventory) |
| `shields` | Streak shields: habit_id, remaining_days, activated_at |
| `transactions` | Coin transaction history: type (earn/purchase), amount, description |
| `achievements` | Master list of achievements: name, description, reward_coins |
| `user_achievements` | Unlocked achievements per user |

---

## 🔐 Authentication

- **Email + Password** signup/login via Supabase Auth
- **Google OAuth** login (OAuth redirect)
- **Show/Hide Password** toggle (eye icon) on both Login and Signup pages
- On signup, a profile row is auto-created with 50 starter coins
- **Rate Limit:** Supabase free tier only allows 2 emails/hour. Solution: Use a **custom SMTP provider** (Resend — free 100/day) configured in Supabase Dashboard → Auth → SMTP Settings

### Expected Behavior:
- Signup → email confirmation link sent → user clicks link → then can login
- Login → redirected to /dashboard
- If already logged in, /login and /signup redirect to /dashboard
- Google OAuth redirects to /dashboard after consent

---

## 📑 Pages & Features

### 1. Dashboard (`/dashboard`)
- **Motivational quote banner** at the top (random quote on each load)
- **Stats row:** Total habits, today's progress (X/Y completed), best streak, total coins
- **Daily Habits grid:** Shows HabitCards for today's habits with live status
- Shows habit cards with completion status

### 2. Habits Page (`/habits`)
- **Filter tabs:** All / Daily / Weekly / Monthly
- **"+ New Habit" button** → navigates to /habits/new
- **HabitCard** for each habit showing:
  - Type badge (Goal 🎯, Timer ⏱️, Counter 💧, Break It 🚫)
  - Difficulty color (Easy=green, Medium=yellow, Hard=red)
  - Streak fire counter 🔥
  - **Delete button (🗑️)** in top-right corner — deletes habit + building + logs
  - **Completion action** depends on type (see below)

### 3. New Habit Page (`/habits/new`)
- Form to create a habit with: name, type, frequency, difficulty, color, target value
- **4 habit types:**
  - `goal` → Simple checkbox (Mark Complete / Done)
  - `timer` → Countdown timer (target = minutes), auto-completes when timer reaches 0
  - `counter` → Increment counter (e.g., glasses of water), completes when reaching target
  - `bad_habit_stopper` → "I Resisted Today" button

### 4. Habit Detail Page (`/habits/:id`)
- Full stats: current streak, best streak, completions count, building progress
- **90-day heatmap** showing completion history
- **Edit** and **Delete** buttons
- Tags showing type, frequency, difficulty

### 5. City Page (`/city`) — THE GAME
- **Game-like scene** with:
  - Gradient twilight/night sky
  - Twinkling procedural stars
  - Glowing moon
  - Green grass ground line
  - Dashed road with lane markings
- Each habit = one **building** that sits on the ground
- Buildings grow floors as habits are completed (streaks)
- When max floors reached → building resets to 1 floor + earns a ⭐ Golden Star + 50 bonus coins
- **Max floors per frequency:**
  - Daily = 7 floors
  - Weekly = 4 floors
  - Monthly = 1 floor
- **Decoration placement:**
  - Click "✨ Decorate (N)" button (only shows if you have unplaced decorations)
  - Select a decoration from your inventory
  - Tap on a building to place it
  - Decorations appear as emoji around the building
- Clicking a building opens a **detail modal** with floors, stars, frequency, decorations

### 6. Shop Page (`/shop`)
- **4 tabs:**
  - **Decorations** → Buy decorations for coins (saved to user_decorations with building_id=null)
  - **Buy Coins** → Real money packages (₹0.99 - ₹14.99), Stripe integration placeholder
  - **Shields** → Buy streak shields (1-7 days) for a selected habit
  - **My Items** → Inventory view of all owned decorations (placed vs unplaced status)
- **Decoration catalog:** Flag, Garden, Flowers, Tree, Fairy Lights, Lantern, Fountain, Bench, Mailbox, Satellite Dish, Solar Panel, Clock Tower, Statue, Swimming Pool
- Prices range from 10-100 coins

### 7. Achievements Page (`/achievements`)
- Grid of all achievements with locked/unlocked status
- Unlocking an achievement auto-awards reward coins

### 8. Stats Page (`/stats`)
- Detailed statistics and analytics about habit completion

### 9. Settings Page (`/settings`)
- User profile settings

---

## 🎮 Game Mechanics

### Coins
- **Earned by:** completing habits (Easy=5, Medium=10, Hard=20 coins)
- **Earned by:** completing a building cycle (all floors built → 50 bonus coins)
- **Earned by:** unlocking achievements (varies per achievement)
- **Spent on:** decorations, streak shields
- **Starter coins:** 50 on signup
- All transactions logged in `transactions` table

### Streaks
- Completing a habit today after completing yesterday → streak +1
- Missing a day → streak resets to 1 (unless shield active)
- Shield absorbs one missed day, decrements remaining_days
- Best streak tracked separately

### Buildings
- Each habit has exactly one building in the city
- Complete a habit → building gains 1 floor
- When all floors filled (based on frequency) → reset to 1 floor + gain 1 Golden Star ⭐ + 50 coins
- Decorations stored as JSON array of decoration IDs in city_buildings

### Shields
- Purchased from shop for coins
- Protect a specific habit's streak
- Duration: 1-7 days
- When streak would break, shield absorbs the miss instead

---

## 🐛 Bug Fixes Applied

### 1. Show/Hide Password (Login + Signup)
- Eye icon toggle button inside password input wrapper
- Uses `password-wrapper` CSS with absolute positioned toggle button
- Uses lucide `Eye` and `EyeOff` icons

### 2. Decoration Placement in City
- Shop uses `buyDecoration()` from GameContext which inserts into `user_decorations` with `building_id=null`
- City page has "Decorate" mode: select unplaced decoration → tap building → calls `placeDecoration()`
- `useCity.placeDecoration()` updates both `city_buildings.decorations` JSON array AND `user_decorations.building_id`

### 3. Delete Habits
- Trash icon on each HabitCard (passed via `onDelete` prop)
- Calls `deleteHabit()` from `useHabits` which deletes from `habits` table
- Supabase cascade should also clean up related habit_logs, streaks, city_buildings

### 4. City Game Redesign
- Night sky gradient background
- Procedural twinkling stars (20 random positioned divs with CSS animation)
- Glowing moon in top-right
- Buildings on grass with a dashed road
- Detail modal with close button

### 5. Sound Effects & Music
- `SoundManager.js` — singleton class using Web Audio API
- **Ambient music:** Dreamy pad from 4 sine oscillators (C4, E4, G4, C5) with LFO modulation
- **Sound effects:** click, success (ascending chime), coin earn (sparkle), purchase, error (buzz), nav tap
- **Controls in navbar:** Music toggle (🎵) and Mute toggle (🔊/🔇)
- Preferences saved to localStorage (`habitropolis_sound_prefs`)
- Zero external audio files needed

### 6. Coin Glitch Prevention
- `useHabits.completeHabit()`: goal/bad_habit_stopper types can only be completed ONCE per day
- If already completed today → returns `{ alreadyDone: true }` and does nothing
- HabitCard disables the complete button with `disabled={completed}`
- HabitsPage checks `result.alreadyDone` before awarding coins

### 7. Timer Persistence Across Navigation
- Timer saves to localStorage with key `habitropolis_timer_{habitId}`
- When running: saves `{ isRunning: true, endTime: Date.now() + remainingMs }`
- When paused: saves `{ isRunning: false, remaining: seconds }`
- On mount: reads localStorage and calculates remaining time from `endTime`
- If timer finished while away: auto-completes on next mount
- Reset clears localStorage entry

---

## 📁 File Structure

```
src/
├── App.jsx                    # Routes + providers
├── App.css
├── main.jsx                   # React entry point
├── index.css                  # Global styles, design tokens, utilities
├── lib/
│   ├── supabase.js            # Supabase client init
│   └── SoundManager.js        # Web Audio API sound system
├── contexts/
│   ├── AuthContext.jsx         # Auth state, signUp/signIn/signOut/Google
│   └── GameContext.jsx         # Coins, buildings, decorations, achievements
├── hooks/
│   ├── useHabits.js            # CRUD habits, logs, completeHabit
│   ├── useCity.js              # growBuilding, placeDecoration, getBuildingForHabit
│   ├── useCoins.js             # getCoinReward, getShieldCost
│   └── useStreaks.js           # Streak tracking, shield logic
├── components/
│   ├── Layout.jsx/css          # Page layout wrapper with navbar
│   ├── Navbar.jsx/css          # Sidebar nav + sound controls
│   ├── HabitCard.jsx/css       # Habit display with completion actions + delete
│   ├── Building.jsx/css        # Visual building component for city
│   ├── Timer.jsx/css           # Countdown timer with localStorage persistence
│   ├── Counter.jsx/css         # Increment counter for water/etc habits
│   ├── QuoteBanner.jsx/css     # Motivational quote
│   ├── ShieldBadge.jsx/css     # Shield status display
│   ├── NewHabitButton.jsx/css  # FAB for creating habits
│   ├── ProtectedRoute.jsx      # Auth guard
│   └── TestConnection.jsx      # Supabase connection test
├── pages/
│   ├── LoginPage.jsx/css       # Login with show/hide password
│   ├── SignupPage.jsx          # Signup with show/hide password (uses LoginPage.css)
│   ├── DashboardPage.jsx/css   # Main dashboard
│   ├── HabitsPage.jsx/css      # Habits list with filter + delete
│   ├── NewHabitPage.jsx/css    # Create habit form
│   ├── HabitDetailPage.jsx/css # Single habit detail + heatmap
│   ├── CityPage.jsx/css        # Game city scene
│   ├── ShopPage.jsx/css        # Shop + inventory
│   ├── AchievementsPage.jsx/css
│   ├── StatsPage.jsx/css
│   └── SettingsPage.jsx/css
```

---

## 🔑 Environment Variables

```env
VITE_SUPABASE_URL=https://cqdtnprluylduqrwvlef.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 🚀 Running the App

```bash
npm install         # Install dependencies
npm run dev         # Start Vite dev server (localhost:5173)
npm run build       # Production build to dist/
```

---

## 📋 Future TODO

- [ ] Custom SMTP setup (Resend) to fix email rate limit for 50+ signups
- [ ] Stripe/Razorpay payment integration for coin purchases
- [ ] Push notifications (web push or service worker)
- [ ] Habit reminders at set times
- [ ] Social features (friend cities, leaderboards)
- [ ] Dark/light theme toggle in settings
- [ ] Profile avatar upload
- [ ] Export habit data as CSV
- [ ] PWA support for mobile install
