# Wealth Manager Arena - START HACK 2026 🚀

**Team:** Gerspi's Selection  
**Team Members:** Nils Schüpbach, Miloh Zwahlen, Dion Sylejmani  
**Case Partner:** PostFinance  

---

## 📖 The Vision: Investment Education Gamified
Around 50% of adults do not invest in securities due to a lack of knowledge, fear of making mistakes, and a belief that investing requires deep pockets. **Wealth Manager Arena: The Investing Game (Bull vs Bear Edition)** breaks down these barriers. 

We built a gamified, time-accelerated investment simulation that allows beginners—specifically young adults—to safely experience long-term investing, understand market volatility, and learn core principles like diversification and risk profiling without risking real money.

---

## 🎮 Key Features

1. **Self-Learning Sandbox (Single Player Time Travel)**
   - Build a custom portfolio by allocating a starting budget across 18 real-world assets spanning 6 categories (Equity Indices, Single Stocks, Bonds, Commodities, Currencies, Crypto).
   - Fast-forward through up to 30 years of simulated market behaviors (based on real historical data statistics).
   - Experience "Market Events" (e.g., Tech Crashes, Inflation Booms) wrapped in educational lessons.
   - Earn coins by answering daily quizzes covering financial literacy topics.

2. **Battle Arena (Multiplayer Mode)**
   - Compete against friends in real-time.
   - Both players build a portfolio for the exact same synchronized 10-year market simulation.
   - See who built the more resilient portfolio through crashes and rallies.

3. **Gamification & Rewards**
   - Streak tracking for daily quizzes.
   - Avatar shop where you can spend earned coins on custom player icons.
   - Risk profiling dynamically calculates how "risky" or "safe" your portfolio is before you start.

---

## 🛠️ Tech Stack & Architecture

We built a modern, decoupled architecture splitting a lightweight Python backend and a cross-platform mobile frontend.

- **Backend (API):** 
  - `FastAPI`: High-performance asynchronous API for auth, user data, quizzes, and simulation endpoints.
  - `MySQL` + `SQLModel`: Lightweight relational database to store user profiles, coins, streaks, and unlocked avatars.
  - `python-socketio`: Real-time WebSocket server to power the Multiplayer Battle Arena lobbies and live market ticking.
  - *Data model:* Real annualized returns and volatility based on CSV historical data (2006-2026) are mathematically simulated using Monte Carlo variations.

- **Frontend (UI):**
  - `React Native` (Expo): Cross-platform mobile app.
  - `Socket.IO Client`: Real-time connection to the battle lobbies.
  - `react-native-svg-charts` / `d3-shape`: Beautiful, interactive performance charts visualizing portfolio growth over simulated decades.

---

## 📂 Folder Structure

```text
starthack2026-gerspis-selection/
├── apps/
│   ├── api/                    # 🐍 Backend (FastAPI + Socket.IO)
│   │   ├── app/
│   │   │   ├── data/           # Case data & historical CSVs
│   │   │   ├── routers/        # API endpoints (auth, user, quiz, simulation)
│   │   │   ├── simulation.py   # Monte Carlo math & market event logic
│   │   │   ├── sockets.py      # Real-time Multiplayer logic
│   │   │   └── models.py       # SQLModel database schemas
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── ui/                     # 📱 Frontend (React Native / Expo)
│       └── mobile/
│           ├── assets/         # Images, fonts, icons
│           ├── src/
│           │   ├── api.js      # REST API client
│           │   ├── socket.js   # WebSocket client for Battle Mode
│           │   ├── theme.js    # Centralized design system
│           │   └── screens/    # UI Views (Home, Simulation, Setup, Quiz, Battle)
│           └── package.json
```

---

## 🚀 How to Run Locally

Requirements:
- Docker
- Python
- Node / NPM / NPX

### 1. Setup Environment Variables

**Create .env files**

```bash
cd <PROJECT_ROOT_DIRECTORY>

# On Linux/Mac
cp .env.example .env.dev # recommended
cp .env.example .env.stg # optional
cp .env.example .env.prod # optional

# On Windows
copy .env.example .env.dev # recommended
copy .env.example .env.stg # optional
copy .env.example .env.prod # optional
```

**Configure .env files**

> **Note:** Please follow the instructions in the .env file to set up your environment variables.

```bash
# On Linux/Mac
nano .env.dev # recommended
nano .env.stg # optional
nano .env.prd # optional

# On Windows
# Use your preferred text editor to edit the .env files
```

### 2. Run the Backend (API)
The backend uses Python 3.12 and a MySQL database.

**Setup Virtual Environment**

```bash
cd apps/api

python -m venv .venv

# On Linux/Mac
source .venv/bin/activate

# On Windows (Powershell)
.venv\Scripts\activate

pip install -r requirements.txt
```

**Run API and Database**

```bash
cd <PROJECT_ROOT_DIRECTORY>

# Development Environment (recommended)
docker compose -f docker-compose.yaml --env-file .env.dev -p wealth-manager-arena-dev up --build -d

# Staging Environment (optional)
docker compose -f docker-compose.yaml --env-file .env.stg -p wealth-manager-arena-stg up --build -d

# Production Environment (optional)
docker compose -f docker-compose.yaml --env-file .env.prod -p wealth-manager-arena-prd up --build -d
```

> **Note:** The API will be available on your defined port in the used .env file.

### 2. Run the Frontend (Mobile App)
The frontend uses Expo. You can run it in a web browser, iOS simulator, Android emulator, or on your physical device using Expo Go.

```bash
cd apps/ui/mobile
npm install

npx expo start

# Follow the instructions in the terminal to open the app in a browser, iOS simulator, Android emulator, or on your physical device using Expo Go.
```

> **Configuration Note:** By default, the mobile app connects to our deployed dev server (`https://dev.api.gerspis-selection.com`). To test locally against your local backend, edit `apps/ui/mobile/src/api.js` and `socket.js` to point to `http://<YOUR_IP_ADDRESS>:<PORT_DEFINED_IN_ENVIRONMENT_FILE>`.
---

## 🏆 Achievement Highlights for the Jury
- **Beginner Friendly:** We stripped away overwhelming financial jargon and replaced it with clean UX, emojis, and clear explanations of risk.
- **Micro-Learning:** "Market Events" pause the simulation to explain *why* the market just crashed (e.g., dot-com bubble, inflation) and what the user should learn from it.
- **Mathematical Realism:** We don't just use random numbers. We parsed 20 years of real historical CSV data to extract the exact average annualized returns and volatility for all 18 assets to drive our stochastic simulation engine.
- **Fully Playable MVP:** From auth, to the shop, to quizzes, to 30-year solo simulations, to real-time multiplayer lobbies—it all works end-to-end.

---
*Built with ❤️ at START HACK 2026*