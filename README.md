# ✦ Life OS

A personal, minimal dashboard and Life Operating System that uses your own private **Google Sheets** as a database. Track daily habits, workout routines, thoughts, reading progress, and media entertainment—with built-in analytics, correlation charts, and an all-in-one daily check-in form.

---

## 🌟 Key Features

* **Zero-Cost, Private Cloud Database:** Your data lives exclusively in a spreadsheet titled `Life OS Database` created directly in your personal Google Drive.
* **Daily Form (Quick Input):** Unified daily capture form to log habits, journal entries, workouts, and reading/media in under 2 minutes.
* **Analytics & Trends:** Interactive charts and consistency tracking:
  * **Fitness:** Volume timeline, workout type distribution, session length, and calories.
  * **Habits & Wellness:** Dual-axis correlation (Sleep vs. Screen time), hydration tracker with a 2.0L baseline line, and meditation consistency.
  * **Reading & Media:** Live progress bars for active books, wishlist, and entertainment genre breakdown.
  * **Mental Clarity:** 5-point emotional baseline curve and sentiment frequency.
* **Individual Workspaces:** Dedicated tabs for Journaling, Workout splits, Media watchlist, Book library, and Daily Habits.

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
* **Node.js** (v18 or newer) or **Bun** installed on your computer.
* A Google Account (to authenticate and store your personal database spreadsheet).

### 2. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 3. Install Dependencies
Using npm:
```bash
npm install
```
Or using Bun:
```bash
bun install
```

### 4. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔐 Google Account & Spreadsheet Authorization

When you launch the app:
1. Click **"Sign in with Google"**.
2. Grant permission for the app to create and manage spreadsheets in your Google Drive (specifically the `Life OS Database` file).
3. The app will automatically create and format the required tabs (`Diary`, `Workouts`, `Media`, `Books`, `Habits`) if they don't already exist.
4. You can click **"View Raw Spreadsheet"** in the sidebar at any time to inspect your raw data directly inside Google Sheets.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript, Vite
* **Styling:** Tailwind CSS (Custom organic Sage & Sand editorial theme)
* **Visualizations:** Recharts
* **Icons & Animation:** Lucide Icons, Motion (Framer Motion)
* **Backend & Auth:** Express server proxy, Google OAuth 2.0, Google Sheets API, Firebase Authentication

---

## 📦 Production Build

To build the project for production deployment:
```bash
npm run build
npm start
```
