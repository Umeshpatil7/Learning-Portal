# Changelog

All notable changes to the Digitap Learning Portal project will be documented in this file.

## [1.0.0] - 2026-06-29

### Added
- [PROJECT_CONTEXT.md](file:///c:/Users/umeshrandhir.patil/Desktop/Learner%20Portal/docs/PROJECT_CONTEXT.md): Set up the single source of truth including tech stack, folder structure, constraints, glossary, and current status.
- [PRD.md](file:///c:/Users/umeshrandhir.patil/Desktop/Learner%20Portal/docs/PRD.md): Outlined the detailed product overview, core requirements, user roles, feature specifications (inputs, behaviors, outputs, edge cases), and database sheet schemas.
- [USER_FLOWS.md](file:///c:/Users/umeshrandhir.patil/Desktop/Learner%20Portal/docs/USER_FLOWS.md): Created step-by-step user journeys for learners (watching, resume play, mid/end quizzes, locking) and admins (section edits, module additions, analytics, batch setup).
- [ARCHITECTURE.md](file:///c:/Users/umeshrandhir.patil/Desktop/Learner%20Portal/docs/ARCHITECTURE.md): Documented structural design decisions (GitHub Pages, Vite, Apps Script backend, OAuth 2.0 flow, and the YouTube scrubber lock algorithms).
- [TESTING.md](file:///c:/Users/umeshrandhir.patil/Desktop/Learner%20Portal/docs/TESTING.md): Detailed the testing framework integration plan (Vitest, Playwright), automated test specifications, and manual pre-deployment checklist.

- Scaffolded the React+Vite app, including configuring Tailwind CSS, setting up the Playwright and Vitest configurations, creating sample unit and E2E tests, mapping the folder directories using .gitkeep, and writing the GitHub Actions deploy workflow.
- Configured Google Auth (Google Login component, AuthProvider + AuthContext with implicit OAuth token handler, whitelist verification config, security route guards, and unit tests).
- Set up the Google Sheets Apps Script Backend (Google Apps Script Code.gs containing action routing, spreadsheet locked rows manipulation, client service sheetsService.js fetch wrappers, useSheetsAPI hook, and unit tests).
- Implemented Content Display (HomePage rendering paths grid, SectionPage rendering module sequence lists, locking states, hash-route URL switching, and unit tests).
- Implemented Video Player (useYouTubePlayer hook with scrubber lock, useWatchTracker with 30s background sync, VideoPlayer component with resume overlay, ModulePage wrapper, and unit tests).

- Implemented Assessment Engine (useQuizEngine hook, QuestionCard rendering, ResultScreen stats with confetti triggers, QuizModal mid-video and end-of-video quiz managers, and unit tests).

- Implemented Admin Content Management (SectionEditor list and order swapper, ModuleEditor with YouTube URL check, QuestionEditor with trigger configurations, and AdminPage protected layout unified under AdminGuard).

- Implemented Admin Analytics Dashboard (cohort filters, drop-off tracking, user breakdowns, and CSV exporters).
- Implemented Polish & Edge Cases (localStorage fallbacks, offline sync queues, online listeners, status badges, and unit tests).
- Implemented Final Documentation (created root README.md installation manual, spreadsheet schema indices, and completed changelogs).

### Next Steps
- None. Project Phase 0-2 and Steps 1-10 are 100% complete!
