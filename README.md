# JobTrack AI 🤖

An AI-powered job tracking platform that fetches real jobs, matches them with your resume using LangChain, and includes a conversational AI assistant built with LangGraph.

## 🔗 Live Links
- **Frontend:** https://ai-job-tracker-3c94.vercel.app
- **Backend:** https://ai-job-tracker-95.onrender.com

## 🧪 Test Credentials
- Email: test@gmail.com
- Password: test@123

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│                   Vercel Deployment                      │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Login    │  │ Job Feed │  │ Resume   │  │  Apps  │ │
│  │ Page     │  │ + Filter │  │ Upload   │  │  Track │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                      ↕ API Calls                        │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Fastify)             │
│                   Render Deployment                      │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ /jobs       │  │ /match       │  │ /ai/chat      │  │
│  │ Adzuna API  │  │ LangChain    │  │ LangGraph     │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              /resume/upload                      │   │
│  │              PDF/TXT Parser                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         ↕                    ↕                ↕
┌──────────────┐   ┌──────────────────┐  ┌──────────────┐
│  Adzuna API  │   │  Gemini AI API   │  │  LangGraph   │
│  (Job Data)  │   │  (LangChain)     │  │  Orchestrat  │
└──────────────┘   └──────────────────┘  └──────────────┘
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, React Router |
| Backend | Node.js, Fastify |
| AI Matching | LangChain + Gemini AI |
| AI Assistant | LangGraph + Gemini AI |
| Job Data | Adzuna API |
| Deployment | Vercel (Frontend), Render (Backend) |

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- Git

### 1. Clone the repo
```bash
git clone https://github.com/Arjun8595/ai-job-tracker-.git
cd ai-job-tracker
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your API keys in .env
node server.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## 🔑 Environment Variables

```env
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

---

## 🤖 LangChain Usage

LangChain is used for AI-powered job matching:

- **Model:** Gemini 2.5 Flash via `@langchain/google-genai`
- **Flow:** Resume text + Job description → Gemini prompt → JSON score
- **Output:** Match score (0-100%), matching skills, relevant experience

```javascript
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
});
```

---

## 🧠 LangGraph Usage

LangGraph orchestrates the AI Assistant with 2 nodes:

```
User Message
     ↓
Node 1: detectIntent
     ↓ (intent: filter_update / job_search / product_help / general)
Node 2: routeAction
     ↓
Response + Filter Updates
```

- **Intent Detection:** Classifies user message
- **Action Routing:** Updates UI filters or answers questions
- **Filter Control:** AI directly updates frontend filters in real-time

---

## 🎯 AI Matching Logic

1. User uploads resume (PDF/TXT)
2. Resume text extracted and stored in localStorage
3. On job load, top 3 jobs sent to `/match` endpoint
4. Gemini AI compares resume vs job description
5. Returns score 0-100% with matching skills
6. Jobs sorted by match score (highest first)
7. Color coded: 🟢 >70% | 🟡 40-70% | ⚪ <40%

---

## 💡 Popup Flow Design

**Why this design:**
- User clicks Apply → External link opens in new tab
- After 2 seconds → Popup appears on return
- 3 options: Yes Applied / Just Browsing / Applied Earlier
- Saves cognitive load — user doesn't need to manually track

**Edge Cases:**
- User closes tab immediately → Popup still shows after 2s
- Duplicate applications → New entry added with timestamp
- Network offline → Data saved in localStorage

---

## 🤖 AI Assistant UI Choice

**Chose: Floating Chat Bubble (Bottom-right)**

**Why:**
- Non-intrusive — doesn't block job feed
- Familiar pattern — users know floating bubbles
- Quick access — always visible without navigation
- Mobile friendly — doesn't take screen space

---

## 📈 Scalability

**100+ Jobs:**
- Frontend filters run client-side — O(n) performance
- AI matches only top 3 jobs to save API quota
- Remaining jobs get estimated scores

**10,000 Users:**
- Backend is stateless — easy to horizontal scale
- localStorage for user data — no database needed
- Render auto-scales on demand

---

## ⚠️ Tradeoffs & Limitations

| Limitation | Reason | Fix with more time |
|-----------|--------|-------------------|
| No real database | Kept simple per assignment | Add MongoDB |
| Only 3 AI matches | Free API quota limit | Batch processing |
| Single user | Hardcoded credentials | Auth system |
| No real-time updates | No WebSocket | Add Socket.io |

---

## ✨ Features

- ✅ Login with test credentials
- ✅ Real jobs from Adzuna API (50+ jobs)
- ✅ AI Job Matching with LangChain
- ✅ Match score badges (Green/Yellow/Gray)
- ✅ Best Matches section
- ✅ Resume Upload (PDF/TXT)
- ✅ 7 Filters (Role, Skills, Date, Type, Mode, Location, Score)
- ✅ AI Assistant with LangGraph
- ✅ AI controls UI filters in real-time
- ✅ Smart Apply popup
- ✅ Application tracking dashboard
- ✅ Timeline per application
- ✅ Responsive design
- ✅ Live deployment
