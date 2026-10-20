# 🧮 Math Buddy

[![Build Status](https://img.shields.io/badge/Render-Deployed-brightgreen?style=flat-square)](https://math-buddy-2xsw.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/Node.js-%3E%3D_20.0.0-green.svg?style=flat-square)](https://nodejs.org)
[![Framework: TanStack Start](https://img.shields.io/badge/Framework-TanStack_Start-FF4154?style=flat-square&logo=react)](https://tanstack.com/router/v1/docs/start/overview)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Styling: Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

**Hosted Application:** [Launch Math Buddy on the Web 🚀](https://math-buddy-2xsw.onrender.com)

![Math Buddy Application Demo](./screenshots/demo.gif)

---

## 🚀 Project Description

Math doesn’t have to feel like staring at a wall of hieroglyphics. Meet **Math Buddy**—the ultimate interactive playground designed to turn math anxiety into mastery. Whether you're struggling with algebra, looking to visualize calculus equations, or planning your study schedule for upcoming exams, Math Buddy acts as your personal, AI-powered study companion.

Built on a modern serverless architecture, Math Buddy combines advanced AI features with interactive dashboards and gamified elements to make learning math structured, engaging, and rewarding.

### Key Features
* 🤖 **AI Snap-Solve & Step-by-Step Explanations**: Snap a photo or type a problem to get instant, detailed, step-by-step solutions powered by Google Gemini (with optional Mathpix OCR support for extracting LaTeX formulas from images).
* 🎙️ **Interactive Voice Tutor**: Learn through conversation. Talk directly to a voice-enabled AI tutor that explains math concepts, guides you through derivations, and answers questions in real-time.
* 📅 **Smart Exam Planner & Study Calendars**: Stay ahead of deadlines. Log your upcoming exams to automatically generate customized study plans, track topic-by-topic progress, and monitor learning tasks.
* 🏆 **Gamification, Streaks & Rewards**: Stay motivated with daily streaks, experience points (XP), leaderboards, and custom achievements. Earn points by solving problems, then spend them in the virtual **Store** to unlock custom avatars and themes.
* 📊 **Analytics Dashboard**: Monitor your learning patterns, distraction rates, study session durations, and topic accuracy using beautiful, interactive charts powered by Recharts.
* 🖥️ **Windows Standalone Launcher**: Includes a C# desktop wrapper (`Math Buddy.exe`) that launches the app in a borderless window, giving you a native app feel on Windows.

### Tech Stack Overview

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **TanStack Start (React 19 + Vite)** | Next-generation React framework enabling type-safe routing, query caching, and seamless Server Functions (`createServerFn`). |
| **Styling** | **Tailwind CSS v4 + Radix UI** | Blazingly fast utility-first styling combined with fully accessible UI primitives (dialogs, select dropdowns, accordions). |
| **AI / OCR** | **Google Gemini + Mathpix** | Direct integration with `gemini-flash-lite-latest` for logical step-by-step solving and voice interaction; Mathpix API for hand-written formula parsing. |
| **Backend / DB** | **Supabase** | Client-side database API wrappers, OAuth auth engine, and secure Row-Level Security (RLS) PostgreSQL database. |
| **Math Rendering** | **KaTeX** | Lightning-fast rendering of complex mathematical notations and LaTeX formulas directly on the page. |
| **Export Engines** | **html2canvas + jsPDF** | Client-side generators to export progress reports, task lists, or custom math worksheets to PDFs. |

---

## 📋 Prerequisites

Before setting up Math Buddy, make sure you have the following installed:

1. **Node.js (v20.0.0 or higher)**: The project uses React 19 server-side features and modern Vite dev servers. The production build runs on Node v20 (defined in `render.yaml`).
2. **npm (v10.0.0 or higher)** or **Bun (v1.1.0 or higher)**: Used for package resolution and launching script pipelines. A `package-lock.json` and a `bun.lock` are both available, allowing you to choose your preferred manager.
3. **Google Gemini API Key**: Required to feed questions to the AI solver and voice tutor. You can obtain one for free or pay-as-you-go on [Google AI Studio](https://aistudio.google.com/).

---

## 🚀 Installation

Setting up Math Buddy locally takes less than two minutes.

### Standard Setup (using npm)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Praveen250708/Math-Buddy.git
   cd Math-Buddy
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure your environment variables:**
   Copy the example environment file and replace the placeholder keys with your credentials:
   ```bash
   copy .env.example .env
   ```

> [!NOTE]
> **What success looks like:** Upon running `npm install`, you should see a `node_modules` folder created in the root directory, and your terminal should output something like `added 800+ packages in 12s`.

### Alternate Setup (using Bun)
If you prefer using Bun for a faster setup:
```bash
bun install
copy .env.example .env
```

---

## 🔧 Supabase Configuration

Supabase serves as the backend database, authentication guard, and user data store for the application.

### Why Supabase?
Rather than managing a complex custom API layer, Math Buddy utilizes Supabase's direct PostgreSQL integrations. By configuring **Row-Level Security (RLS)**, the application communicates securely with the database directly from the browser. It handles:
* **OAuth Auth Flows**: Authenticates users securely with Google Sign-In or email.
* **Relational Storage**: Stores student profiles, earned XP points, daily challenge streaks, exam schedules, bookmarked solutions, and study session logs.

### Required Environment Variables

You must supply these in your local `.env` file for the app to function properly:

| Variable | Description | Where to Find It in Supabase Dashboard |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | The unique API endpoint URL for your Supabase project instance. Used by both the client and Nitro server to locate the DB. | **Settings** (Gear icon) -> **API** -> Project API Keys -> **Project URL** |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The public API key (often referred to as the `anon` key). Safe to expose in browser bundles; respects RLS policies. | **Settings** (Gear icon) -> **API** -> Project API Keys -> **`anon` public key** |
| `SUPABASE_SERVICE_ROLE_KEY` | The secret service role key. Bypasses RLS to run admin server functions (like overriding XP multipliers or managing roles). **NEVER expose this key in client-side code.** | **Settings** (Gear icon) -> **API** -> Project API Keys -> **`service_role` secret key** |
| `GOOGLE_CLIENT_ID` | OAuth Google Client ID. Enables users to sign in directly with their Google Accounts. | Configured under Google Cloud Console Credentials, and linked inside **Auth** -> **Providers** -> **Google** |
| `GOOGLE_CLIENT_SECRET` | OAuth Google Client Secret. Used in tandem with the Client ID to authenticate OAuth tokens. | Configured under Google Cloud Console Credentials, and linked inside **Auth** -> **Providers** -> **Google** |

*Note: All client-side environment variables must be prefixed with `VITE_` to be bundled by Vite.*

---

## 🖥️ Running the Dev Server

To run the application locally in development mode:

Using npm:
```bash
npm run dev
```

Using Bun:
```bash
bun dev
```

### Dev Server Port & Access
* The local server starts on **port 8000** (configured in [vite.config.ts](file:///d:/Math%20Project/vite.config.ts)).
* The server will print the local host URI: `http://localhost:8000`.
* **What you should see:** A clean console banner showing Vite and TanStack compilation. Open `http://localhost:8000` in your web browser, and you will be greeted by the Math Buddy landing page or authentication login prompt.

---

## 📦 Building for Production

To generate an optimized production bundle of the application:

```bash
npm run build
```

### Build Artifacts
* The build output is compiled into the **`.output/`** directory.
* **`.output/public/`** contains the fully optimized, minified static frontend assets (HTML, CSS, JS bundles).
* **`.output/server/`** contains the pre-compiled server functions (Nitro bundle) used to handle server-side rendering and Server Functions.

### Preview and Deploy
1. **Preview locally**: Run `npm run preview` to spin up a local server hosting the production bundle on port 8000.
2. **Deploying on Render**: The repository includes a [render.yaml](file:///d:/Math%20Project/render.yaml) file. When connected to Render, the platform automatically reads this configuration to deploy a Node.js web service with:
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`

---

## ⚙️ Windows Launcher & Standalone Scripts

If you are running Math Buddy on a Windows system, the project provides several helper tools to streamline installation, launching, and offline usage.

### ⚙️ `install.bat`
**What it does step-by-step:**
1. Checks if Node.js/npm is installed on your machine (`where npm`). If not found, it stops and prompts you to download Node.js.
2. Installs the project dependencies locally by running `npm install`.
3. Runs a PowerShell script that creates a desktop shortcut called **Math Buddy** (`Math Buddy.lnk`) pointing to the local `run.bat` file in your workspace directory.

**When to use it:** Reach for this on your first setup. It configures the dependencies and creates a desktop shortcut so you don't have to open a terminal or type setup commands.

### ⚙️ `run.bat`
**What it does step-by-step:**
1. Launches your default web browser and navigates directly to `http://localhost:8000`.
2. Starts the development server using `npm run dev`.

**When to use it:** Double-click this script (or use the Desktop shortcut created by `install.bat`) whenever you want to work on the app locally. It automatically opens the browser window and fires up the server in a single click.

### ⚙️ Desktop App Launcher (`Math Buddy.exe`)
For a true desktop experience, the project includes `Math Buddy.exe` (compiled from [AppLauncher.cs](file:///d:/Math%20Project/AppLauncher.cs)).

**What it does:**
1. Attempts to open **Microsoft Edge** in borderless Application Mode (`--app=https://math-buddy-2xsw.onrender.com`).
2. If Edge is unavailable, it attempts to launch **Google Chrome** in Application Mode (`--app=https://math-buddy-2xsw.onrender.com`).
3. If both Edge and Chrome are unavailable, it falls back to opening the deployed app in your default browser.

**When to use it:** Drag this executable to your desktop. Running it opens the hosted Math Buddy app in a standalone, dedicated window without browser tabs or address bars—providing a clean, distraction-free native app experience.

---

## 📸 Screenshots & Demos

Check out some of the main flows inside the Math Buddy app:

### 1. Central Study Dashboard & Streaks
Manage your profile, view your active XP levels, see your daily streaks, and quickly access tools.
![Dashboard & Streak Tracking](./screenshots/dashboard_streak.png)

### 2. AI Snap-Solve Interface
Take or upload a picture of any math problem. The AI extracts the formulas, processes the math, and guides you through each step.
![AI Snap & Solve](./screenshots/snap_solve.png)

### 3. Interactive Voice Tutor
Engage in a spoken conversation with the AI tutor. Perfect for getting complex equations explained verbally.
![Interactive Voice Tutor](./screenshots/voice_tutor.png)

### 4. Exam Calendar & Planner
Create customized study schedules for exams, complete with topic trackers and interactive daily task lists.
![Exam Study Planner](./screenshots/exam_planner.png)

---

## 🤝 Contributing

We welcome contributions of all shapes and sizes! If you'd like to help improve Math Buddy:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/cool-new-idea`
3. Commit your changes: `git commit -m 'Add some cool features'`
4. Push to the branch: `git push origin feature/cool-new-idea`
5. Open a Pull Request detailing your changes.

*Please review the `.prettierrc` configuration before submitting code formatting changes.*

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details (or check out the MIT License text online).

---

🚀 **Happy Learning!** If you find Math Buddy helpful, please consider leaving a star on GitHub, reporting issues, or suggesting new math topics you'd like us to cover!
