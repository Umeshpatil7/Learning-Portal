# Digitap Learning Portal — Project Context

## What this project does
The Digitap Learning Portal is an internal and external video-based training platform designed to onboard Digitap employees, train new joinees, and educate external stakeholders in India's Account Aggregator (AA) fintech ecosystem. It provides structured learning modules, video lessons (hosted on YouTube and embedded with scrubber control), interactive mid-video and end-of-video assessments (MCQs), and batch-level enrollment. It is a completely serverless, zero-maintenance system hosted on GitHub Pages, utilizing Google Sheets + Google Apps Script as its persistent database, and Google OAuth 2.0 for user authentication.

## Tech stack
- **Frontend Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS
- **Authentication**: Google OAuth 2.0 (implicit client-side flow)
- **Database/Backend**: Google Sheets (queried and updated via Google Apps Script deployed as a Web App)
- **Video Embedding**: YouTube IFrame Player API
- **Testing**: Vitest (Unit & Integration), Playwright (E2E)
- **CI/CD**: GitHub Actions (auto-builds and deploys `dist/` to `gh-pages` branch)

## Folder structure
```
/
├── docs/
│   ├── PROJECT_CONTEXT.md      ← AI context file (read this first, always)
│   ├── PRD.md                  ← Product requirements
│   ├── USER_FLOWS.md           ← All user journeys
│   ├── ARCHITECTURE.md         ← Tech decisions
│   ├── TESTING.md              ← Test plan
│   └── CHANGELOG.md            ← What changed in each session
│
├── src/
│   ├── components/
│   │   ├── auth/               ← GoogleLogin, AuthGuard, AdminGuard
│   │   ├── player/             ← VideoPlayer, ScrubberLock, WatchTracker
│   │   ├── quiz/               ← QuizModal, QuestionCard, ResultScreen
│   │   ├── sections/           ← SectionList, SectionCard, ModuleList, ModuleCard
│   │   ├── admin/              ← AdminDashboard, SectionEditor, ModuleEditor, QuestionEditor, Analytics
│   │   └── shared/             ← Button, Modal, ProgressBar, Badge, LockIcon
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── ProgressContext.jsx
│   │
│   ├── hooks/
│   │   ├── useYouTubePlayer.js ← IFrame API wrapper
│   │   ├── useWatchTracker.js  ← 30s ping logic
│   │   ├── useQuizEngine.js    ← Question randomisation + scoring
│   │   └── useSheetsAPI.js     ← All Google Sheets read/write calls
│   │
│   ├── services/
│   │   ├── sheetsService.js    ← All Apps Script API calls
│   │   ├── authService.js      ← Google OAuth logic
│   │   └── contentService.js   ← Fetch sections/modules/questions from Sheets
│   │
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── SectionPage.jsx
│   │   ├── ModulePage.jsx      ← Video + quiz combined
│   │   ├── AdminPage.jsx
│   │   └── AnalyticsPage.jsx
│   │
│   ├── __tests__/              ← Vitest unit tests (mirror /src structure)
│   └── config/
│       ├── adminEmails.js      ← Hardcoded admin Google emails
│       └── sheetsConfig.js     ← Apps Script URL, Sheet IDs
│
├── e2e/                        ← Playwright E2E tests
│   ├── learner.spec.js
│   ├── admin.spec.js
│   └── edge-cases.spec.js
│
├── scripts/
│   └── appsscript/
│       └── Code.gs             ← Google Apps Script backend code
│
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Actions: build + deploy to Pages
│
├── vite.config.js
├── package.json
└── README.md
```

## Key architectural decisions & why
1. **GitHub Pages for Hosting**: Selected to achieve zero hosting costs and minimal deployment overhead. All logic runs in the client browser.
2. **Google Sheets + Apps Script Backend**: Chosen because it provides a free database storage layer that requires no server infrastructure, is easily human-readable by Digitap admins, and can be edited or verified through a standard web UI.
3. **Google OAuth 2.0 Client-side Authentication**: Eliminates the need for a user database containing hashed passwords or credentials. Secures access using Digitap's existing Google workspace domain.
4. **YouTube IFrame API with Scrubber Lock**: Leverages YouTube's free, high-performance video streaming while preventing users from fast-forwarding past unwatched video segments.
5. **Content Configurations Stored in Sheets**: Decided to place the content schema (sections, modules, questions) in Google Sheets rather than git-committed JSON files to allow admin changes without triggering redeployments.

## Known constraints
- Deployed ONLY on GitHub Pages (no Node.js server, no database server)
- All persistent data via Google Sheets + Apps Script (acts as the backend)
- Auth via Google OAuth only — no passwords
- Videos hosted on YouTube, embedded via IFrame API (played on our domain)
- No completion certificates needed
- Must work on desktop and mobile browsers

## Current project status
- **Phase 0–4 documentation**: Complete.
- **Codebase scaffold (Step 1)**: Complete.
- **Google Auth (Step 2)**: Complete.
- **Google Sheets Apps Script Backend (Step 3)**: Complete.
- **Content Display (Step 4)**: Complete.
- **Video Player (Step 5)**: Complete.
- **Assessment Engine (Step 6)**: Complete.
- **Admin Content Management (Step 7)**: Complete.
- **Admin Analytics Dashboard (Step 8)**: Complete.
- **Polish & Edge Cases (Step 9)**: Complete.
- **Final Documentation (Step 10)**: Complete (README.md setup manuals, configuration instructions, deployment checklists, and testing commands).

## Glossary
- **AA**: Account Aggregator (RBI-regulated data sharing framework in India)
- **FIP**: Financial Information Provider
- **FIU**: Financial Information User  
- **TSP**: Technology Service Provider (Digitap's role)
- **Module**: One video + its associated MCQ quiz
- **Section**: A group of related modules (e.g. "AA Ecosystem Training")
- **Watch gate**: Quiz unlocks only after ≥80% of video is watched
- **Question bank**: Pool of questions per module; subset shown randomly per attempt
