# 🚀 AI-Driven Skill-to-Career Pathway Predictor
## Complete Setup & Installation Guide

> This guide is written for someone who has never seen this project before.
> Follow every step in order and you will have the app running on your computer.

---

## 📋 Table of Contents
1. [What This Project Does](#what-this-project-does)
2. [Project Structure](#project-structure)
3. [Prerequisites (Install These First)](#prerequisites)
4. [Step-by-Step Installation](#step-by-step-installation)
5. [Environment Variables Setup](#environment-variables-setup)
6. [Running the Project](#running-the-project)
7. [Pages & Features](#pages--features)
8. [API Endpoints](#api-endpoints)
9. [Troubleshooting](#troubleshooting)

---

## 🧠 What This Project Does

**PATHAI Career Intelligence** is a full-stack MERN web application that helps students (especially in Sri Lanka) discover tech career paths based on their skills. It uses AI (Google Gemini) to:

- Analyze your skills through an interactive assessment
- Predict the best-matching tech careers for you
- Generate personalized learning roadmaps
- Simulate real-world job interview scenarios
- Chat with an AI career advisor (PathGuide AI)
- Analyze your GitHub profile to assess your coding skills

---

## 🗂 Project Structure

```
AI-Driven Skill-to-Career Pathway Predictor/
│
├── client/                  ← React frontend (Vite)
│   ├── src/
│   │   ├── pages/           ← App pages (Home, Assessment, Dashboard, etc.)
│   │   ├── components/      ← Reusable UI components
│   │   ├── context/         ← Auth context (login state)
│   │   └── App.jsx          ← Main app with routes
│   ├── package.json
│   └── vite.config.js       ← Vite config (proxies /api → backend)
│
├── server/                  ← Node.js + Express backend
│   ├── routes/              ← API route handlers
│   │   ├── auth.js          ← Register / Login
│   │   ├── users.js         ← User profile
│   │   ├── assessment.js    ← Skill assessment
│   │   ├── careers.js       ← Career paths
│   │   ├── simulation.js    ← Career simulation
│   │   ├── simchat.js       ← Simulation AI chat
│   │   ├── github.js        ← GitHub profile analysis
│   │   └── nexus.js         ← PathGuide AI chat
│   ├── models/              ← MongoDB data models
│   │   ├── User.js
│   │   ├── Assessment.js
│   │   ├── CareerPath.js
│   │   ├── Career.js
│   │   └── Skill.js
│   ├── middleware/
│   │   └── auth.js          ← JWT authentication middleware
│   ├── services/
│   │   ├── geminiService.js ← Google Gemini AI integration
│   │   └── githubService.js ← GitHub API integration
│   ├── scripts/
│   │   └── seedCareers.js   ← Database seeding script
│   ├── data/
│   │   └── sriLankaCareerMarketData.js ← Career data
│   └── index.js             ← Server entry point
│
├── .env                     ← Environment variables (YOU MUST SET THIS UP)
├── package.json             ← Root scripts (run both client + server)
└── SETUP_GUIDE.md           ← This file
```

---

## ⚙️ Prerequisites

Install all of these **before** doing anything else.

### 1. Node.js (v18 or higher)
- Download: https://nodejs.org/en/download
- Choose the **LTS** version
- After installing, verify:
  ```
  node --version
  npm --version
  ```

### 2. MongoDB Community Edition
- Download: https://www.mongodb.com/try/download/community
- Choose: **Windows** → **MSI** installer
- During installation:
  - ✅ Check **"Install MongoDB as a Windows Service"**
  - ✅ Check **"Install MongoDB Compass"** (optional GUI tool)
- After installing, verify:
  ```
  mongod --version
  ```

### 3. Git (to share/clone the project)
- Download: https://git-scm.com/download/win
- After installing, verify:
  ```
  git --version
  ```

---

## 🔧 Step-by-Step Installation

### Step 1 — Get the project files
If you received the folder directly (USB/zip), extract it anywhere, for example:
```
D:\AI-Driven Skill-to-Career Pathway Predictor\
```

If you are cloning from GitHub:
```bash
git clone <repository-url>
cd "AI-Driven Skill-to-Career Pathway Predictor"
```

---

### Step 2 — Open PowerShell in the project folder
- Open the project folder in File Explorer
- Hold **Shift** + right-click inside the folder
- Select **"Open PowerShell window here"**

---

### Step 3 — Install server (backend) dependencies
```powershell
npm install express mongoose cors helmet morgan dotenv jsonwebtoken bcryptjs nodemon concurrently express-validator multer
```

---

### Step 4 — Install client (frontend) dependencies
```powershell
npm install --prefix client
```

---

### Step 5 — Set up your Environment Variables
See the next section below ↓

---

### Step 6 — Start MongoDB
MongoDB should start automatically as a Windows Service after installation.
If it doesn't, run this in PowerShell **as Administrator**:
```powershell
net start MongoDB
```

Or start it manually:
```powershell
& "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"
```

---

### Step 7 — Seed the database (load career data)
```powershell
npm run seed
```
You should see output like:
```
Connected to MongoDB
Seeded 12 Sri Lanka-focused career paths:
- Machine Learning Engineer (85/100 Sri Lanka demand)
- Data Analyst (78/100 Sri Lanka demand)
...
Seeding complete
```

---

### Step 8 — Start the application
```powershell
npm run dev
```
Wait until you see both of these messages:
```
🚀 Server running on http://localhost:5000
✅ MongoDB connected successfully
  VITE v8.x  ready in ...ms  ➜  Local: http://localhost:5173/
```

Now open your browser and go to:
## 👉 http://localhost:5173

---

## 🔑 Environment Variables Setup

The `.env` file is in the **root folder** of the project. Open it with any text editor (Notepad, VS Code, etc.) and fill in the values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/career_pathway_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
CLIENT_URL=http://localhost:5173
GITHUB_TOKEN=
GEMINI_API_KEY=
```

### How to get each key:

#### ✅ MONGO_URI
Leave as-is if MongoDB is running locally:
```
MONGO_URI=mongodb://localhost:27017/career_pathway_db
```

#### ✅ JWT_SECRET
Make up any long random string (used to sign login tokens):
```
JWT_SECRET=mySecretKey12345_changeThis
```

#### ✅ GEMINI_API_KEY (Required for AI chat to work)
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy and paste it:
```
GEMINI_API_KEY=AIzaSy...your_key_here
```

#### ✅ GITHUB_TOKEN (Optional — for GitHub profile analysis feature)
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Give it a name, select **"public_repo"** scope
4. Copy and paste it:
```
GITHUB_TOKEN=ghp_...your_token_here
```
> Without this, the GitHub analysis feature will be limited but the rest of the app works fine.

---

## ▶️ Running the Project

### Start everything (both frontend + backend):
```powershell
npm run dev
```

### Start only the backend server:
```powershell
npm run server
```

### Start only the frontend:
```powershell
npm run client
```

### Reseed the database (reload career data):
```powershell
npm run seed
```

---

## 🖥️ Pages & Features

| URL | Page | What it does |
|-----|------|-------------|
| `http://localhost:5173/` | **Home** | Landing page |
| `http://localhost:5173/assessment` | **Assessment** | Take the skill assessment quiz |
| `http://localhost:5173/dashboard` | **Dashboard** | View your profile and progress |
| `http://localhost:5173/results` | **Results** | See your predicted career matches |
| `http://localhost:5173/simulation` | **Career Simulation** | Browse career simulations |
| `http://localhost:5173/simulate` | **Simulation Chat** | AI-powered mock interview chat |
| `http://localhost:5173/nexus` | **PathGuide AI** | Chat with the AI career advisor |

### How to use the app:
1. **Register** an account (click Sign Up on the Home page)
2. **Log in** with your credentials
3. Go to **Assessment** and complete the skill questionnaire
4. Connect your **GitHub profile** (optional but recommended)
5. View your **Results** to see predicted careers
6. Chat with **PathGuide AI** for personalized guidance
7. Try a **Career Simulation** to practice real-world scenarios

---

## 🔌 API Endpoints

The backend runs at `http://localhost:5000`. All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/users/me` | Get current user profile |
| `GET` | `/api/careers` | List all career paths |
| `GET` | `/api/skills` | List all skills |
| `POST` | `/api/assessment` | Submit skill assessment |
| `GET` | `/api/assessment` | Get user's assessments |
| `POST` | `/api/github/analyze/:username` | Analyze GitHub profile |
| `POST` | `/api/nexus/chat` | Chat with PathGuide AI (logged in) |
| `POST` | `/api/nexus/chat/guest` | Chat with PathGuide AI (guest) |
| `POST` | `/api/simchat/start` | Start a career simulation |
| `GET` | `/api/health` | Check server status |

---

## 🛠 Troubleshooting

### ❌ `Cannot find module 'X'`
Some npm package is missing. Run:
```powershell
npm install express mongoose cors helmet morgan dotenv jsonwebtoken bcryptjs nodemon concurrently express-validator multer
```

### ❌ `concurrently is not recognized`
Run the install command above, then try `npm run dev` again.

### ❌ MongoDB connection fails
- Make sure MongoDB is installed and running
- Try starting it as Administrator: `net start MongoDB`
- Check if port 27017 is blocked by a firewall

### ❌ PathGuide AI gives generic/wrong responses
- Your `GEMINI_API_KEY` in `.env` is missing or invalid
- Get a free key from: https://aistudio.google.com/app/apikey
- Restart the server after updating `.env`

### ❌ Port already in use
- Backend port 5000: Change `PORT=5001` in `.env`
- Frontend port 5173: Vite will auto-select the next available port

### ❌ `net start MongoDB` gives "Access is denied"
Run PowerShell **as Administrator**:
- Search "PowerShell" in Start menu
- Right-click → **Run as administrator**
- Then run `net start MongoDB`

### ❌ Seed fails with "Cannot find module 'mongoose'"
You need to install backend dependencies first:
```powershell
npm install express mongoose cors helmet morgan dotenv jsonwebtoken bcryptjs nodemon concurrently express-validator multer
```
Then run `npm run seed` again.

---

## 📞 Quick Reference Card

```
PREREQUISITES:  Node.js 18+  |  MongoDB 6+  |  Git
INSTALL:        npm install express mongoose cors helmet morgan dotenv jsonwebtoken bcryptjs nodemon concurrently express-validator multer
                npm install --prefix client
CONFIGURE:      Edit .env → add GEMINI_API_KEY (get from aistudio.google.com)
SEED DB:        npm run seed
START:          npm run dev
FRONTEND:       http://localhost:5173
BACKEND:        http://localhost:5000
HEALTH CHECK:   http://localhost:5000/api/health
```

---

*Built with MongoDB, Express, React, Node.js (MERN Stack) + Google Gemini AI*
