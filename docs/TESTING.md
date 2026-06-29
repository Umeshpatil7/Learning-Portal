# Testing Plan
Version: 1.0 | Status: Proposed | Author: Senior Full-Stack Engineer & Product Architect

This document details the quality assurance strategy for the Digitap Learning Portal, detailing unit, integration, end-to-end, and manual testing procedures.

---

## 1. Quality Philosophy
Our motto is: **Every core feature must have a corresponding test; no feature is "done" until its tests pass.**
Since the app relies on a serverless, static configuration powered by external client APIs (Google Sheets/Apps Script), testing must mock API calls cleanly in unit/integration environments while validating real flows in E2E.

---

## 2. Test Categories & Scopes

### 2.1 Unit Tests (`src/__tests__/*`)
Executed via **Vitest**. All mock behaviors are written to operate entirely in memory without hitting the live Apps Script Web App.

*   **Quiz Engine (`useQuizEngine.test.js`)**:
    *   Test randomization: Verify that drawing $N$ questions from a bank of $M$ questions returns a random subset, and that order is shuffled.
    *   Test scoring: Assert score percentages for $0/5$, $3/5$, and $5/5$ correct selections.
    *   Test passing conditions: Assert pass boolean based on threshold configured (e.g. 70%).
*   **Quiz Access (`WatchTracker.test.js`)**:
    *   Verify that the "Attempt Quiz Directly" button is visible and active at all times during playback.
    *   Verify that reaching the end of the video automatically triggers the quiz overlay.
*   **Prerequisite Locking (`ModuleList.test.js`)**:
    *   Verify that module index $i$ throws an error or locks navigation if module $i-1$ is not completed.
    *   Verify that the lock is ignored if the module index is 0 or if the user record contains an admin override token.
*   **Scrubber Lock (`useYouTubePlayer.test.js`)**:
    *   Verify that if current video time jumps ahead by $> 2$ seconds compared to `maxWatchedTime`, `seekTo` is called with arguments `(maxWatchedTime, true)`.
    *   Verify that backward seeks are permitted.
*   **Auth Checks (`auth.test.js`)**:
    *   Verify that `isAdmin("learner@digitap.ai")` returns `false`.
    *   Verify that `isAdmin("admin@digitap.ai")` (included in `adminEmails.js`) returns `true`.

### 2.2 Integration Tests
Focused on hook-to-hook interactions and state mutations.

*   **Quiz Flow Integration (`quizFlow.test.js`)**:
    *   Steps: Initialize `ProgressContext` $\to$ Start quiz session $\to$ Answer all MCQs $\to$ Submit $\to$ Assert `ProgressContext` completes module $\to$ Assert next module unlocks.
*   **Watch Tracker Hook (`useWatchTracker.test.js`)**:
    *   Initialize player playback.
    *   Fast-forward simulation time by 30 seconds.
    *   Verify that the mock Sheets API service (`sheetsService.js`) was called with correct data (`googleId`, `moduleId`, `watchPercent`, `lastPosition`).
*   **Resume Feature (`resumePlayback.test.js`)**:
    *   Verify that if the user progress record has `lastPosition = 120` seconds, the player component initializes at 120 seconds rather than 0.

### 2.3 E2E Tests (`e2e/*`)
Executed via **Playwright** against a local Vite development server. External Google API calls are mocked using custom intercept rules on Playwright's browser context.

*   **Learner Happy Path (`learner.spec.js`)**:
    *   Logs in via mock Google OAuth.
    *   Navigates to Section 1 $\to$ Module 1.
    *   Simulates video playback up to a mid-video question.
    *   Answers mid-video question (asserts explanation is displayed).
    *   Clicks "Attempt Quiz Directly" to open the assessment modal.
    *   Takes the quiz $\to$ passes.
    *   Returns to Dashboard $\to$ confirms Module 2 is now unlocked.
*   **Admin Happy Path (`admin.spec.js`)**:
    *   Logs in using admin email credential.
    *   Navigates to Admin Dashboard.
    *   Creates new Section $\to$ Adds a new Module $\to$ Adds 5 questions.
    *   Sets threshold to 60% $\to$ Publishes.
    *   Simulates returning to Learner home and verifies the new module is visible.
*   **Locked Module Navigation Guard (`edge-cases.spec.js`)**:
    *   Directly loads the URL of a locked module.
    *   Asserts redirect to home occurs and an alert modal is present.
*   **Tab Close Mid-Quiz (`edge-cases.spec.js`)**:
    *   Starts quiz modal.
    *   Triggers window navigation away.
    *   Re-opens module page.
    *   Verifies no quiz attempt row was generated and the quiz can be restarted.

---

## 3. Manual Test Checklist (Pre-Deployment)

Admins must perform these manual checks on standard browsers (Chrome, Safari, Firefox) and mobile Safari/Chrome prior to merging code to the `main` branch.

| Test Item | Verification Step | Expected Result |
| :--- | :--- | :--- |
| **OAuth Login** | Click "Sign in with Google" on Login Screen. | Successfully authenticates, routes to homepage. |
| **Scrubber Lock** | Play video, attempt to click and drag the player progress bar forward. | Video immediately snaps back to furthest watched point. |
| **Mid-Video Q** | Let video play naturally until a timestamp associated with a question. | Playback pauses, question card overlays video, can't seek out. |
| **Quiz Access** | Click "Attempt Quiz Directly" during video, or let video play to end. | Quiz modal overlays screen immediately, pauses video. |
| **Random Pool** | Open same module quiz twice. | Different subsets and orders of questions are displayed. |
| **Fail & Retry** | Submit quiz below passing threshold. | Summary displays incorrect choices + explanations; "Retry" resets quiz. |
| **Pass & Unlock** | Pass quiz at/above threshold. | Visual success alert, next module lock status is removed. |
| **Admin Create** | Go to admin pane, create new module, save. | Module updates database and is instantly retrievable on reload. |
| **Admin Analytics** | Open analytics page. | Tables and cards show exact user scores and average watch percentages. |

---

## 4. Test Data Specifications
For testing environments, use a dedicated Google Sheets sheet containing the following baseline datasets:
- **Test User**: `testlearner@digitap.ai` (assigned to batch `Test Batch 2026`)
- **Test Admin**: `testadmin@digitap.ai`
- **Test Content**:
    - Section: "Test Fundamentals"
    - Module 1: YouTube video (e.g., duration 120s), 5 questions in bank, pass threshold 60%.
    - Module 2: YouTube video (e.g., duration 180s), 5 questions in bank.
