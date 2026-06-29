# User Flows
Version: 1.0 | Status: Proposed | Author: Senior Full-Stack Engineer & Product Architect

This document details the step-by-step navigation, inputs, and system actions for both learners and administrators using the Digitap Learning Portal.

---

## Flow 1: New Learner — First Visit

1.  **Entry**: The user navigates to the portal URL hosted on GitHub Pages.
2.  **Auth Guard Intercepts**: The portal detects that no Google Auth token exists in `localStorage`/state. The application blocks navigation and renders the `/login` screen.
3.  **Google Login Request**: The user clicks the **"Sign in with Google"** button.
4.  **Google OAuth Overlay**: The browser opens the standard Google OAuth 2.0 account selector screen. The user selects their Digitap work account (e.g., `user@digitap.ai`) or a permitted external email address.
5.  **Token Processing**: Google redirects back to the portal with an implicit flow access token in the URL hash.
6.  **Profile Extraction**: The frontend extracts the token, queries Google's user info endpoint, and retrieves the user's name, email, and Google ID.
7.  **Registration Check**:
    *   The frontend sends a request to the Apps Script endpoint: `getUser(googleId)`.
    *   If the user does *not* exist in the `users` sheet, the system automatically registers them via `upsertUser(...)` with the role `learner`, setting `enrolledAt` to the current timestamp.
8.  **Redirect**: The user is redirected to the home screen (`HomePage.jsx`), showing all published learning sections.
9.  **First-Time Dashboard Rendering**:
    *   The home screen lists all sections and displays a global progress tracker showing "0% Completed".
    *   All modules within the sections are loaded in a locked state, except for the first module (Module 1 of Section 1), which is unlocked.

---

## Flow 2: Learner — Watching a Video

1.  **Select Section**: The learner clicks on a Section Card from the homepage. They are navigated to `/sections/:sectionId` (`SectionPage.jsx`).
2.  **Browse Modules**: The page displays a vertical list of modules.
    *   Module 1 shows "Unlocked" with a play icon.
    *   Modules 2+ show a lock icon and a status message: "Complete previous module first".
3.  **Open Unlocked Module**: The user clicks Module 1. They are navigated to `/modules/:moduleId` (`ModulePage.jsx`).
4.  **Load Video**:
    *   The YouTube IFrame Player API initializes the video player in the wrapper component.
    *   The video starts at 0 seconds.
    *   The progress tracking state initializes. The scrubber lock is active.
5.  **Playback & Scrubber Lock**:
    *   The user tries to drag the playback slider forward to skip the video content.
    *   The player intercepts the event: since the target time exceeds `maxWatchedTime + 2` seconds, the player automatically triggers `seekTo(maxWatchedTime)` and displays a temporary notification toast: "Fast-forwarding is disabled on first view."
    *   The user *is* permitted to drag the scrubber backward to re-watch previously viewed content.
6.  **Progress Tracking (30s Sync)**:
    *   Every 30 seconds, an asynchronous task triggers in the background. It calls `progress` endpoint on Apps Script, sending `watchPercent = (maxWatchedTime / videoDuration) * 100` and `lastPosition = getCurrentTime()`.
    *   The page updates the current watch progress bar dynamically.
7.  **Mid-Video MCQ Interruption**:
    *   At a specific timestamp $T$ (e.g., 4 minutes 30 seconds), the video reaches the admin-defined question time.
    *   The player automatically pauses.
    *   A modal overlay pops up over the player containing a single MCQ question (Stem, 4 choices). The video remains paused in the background.
    *   The user selects an option and clicks **"Submit Answer"**.
    *   The system displays immediate visual feedback (Green for correct, Red for incorrect) and shows the explanation text.
    *   The user clicks **"Continue Video"**. The modal fades out and the video resumes playing.
8.  **Reaching the End**:
    *   The video finishes playing. The player fires the `onStateChange` event with status `ENDED` (or reaches 99% duration).
    *   The client automatically displays the final MCQ assessment modal.
9.  **Direct Attempt Option**:
    *   At any time during video playback, the user can click the "Attempt Quiz Directly" button located near the player.
    *   Clicking this button pauses the video player and instantly slides in the final MCQ assessment modal.
10. **Assessment Submission**:
    *   The user takes the random MCQ quiz (e.g., 5 randomized questions).
    *   The user answers all questions and clicks **"Submit Quiz"**.
    *   The client calculates the score (e.g., 80%).
    *   A write request is sent to `quizAttempts` and the `progress` sheets.
11. **Pass vs. Fail Handling**:
    *   **If Score $\ge$ Threshold**:
        *   A celebration animation (confetti) is triggered.
        *   The module state updates to `completed = true`.
        *   The screen displays: "Congratulations! You passed the assessment."
        *   The user clicks "Go to Dashboard". The system unlocks Module 2, and the lock icon disappears.
    *   **If Score < Threshold**:
        *   The screen shows: "Score: 40% (Passing Score: 70%). Assessment Failed."
        *   The quiz displays a summary list showing which answers were incorrect along with the explanations.
        *   A **"Retry Assessment"** button is made available. The user can retry immediately (which draws a new randomized set of questions from the bank).

---

## Flow 3: Learner — Returning to In-Progress Module

1.  **Dashboard Load**: The user logs in and opens a module they previously exited mid-way.
2.  **State Lookup**:
    *   The system fetches the user's progress records from Google Sheets.
    *   The module progress is loaded: e.g., `watchPercent = 52%`, `lastPosition = 312` (seconds).
3.  **Player Initialization**:
    *   The YouTube player loads.
    *   A visual overlay prompts: **"Would you like to resume watching from 05:12?"** with buttons "Yes" and "Start Over".
4.  **User Choice**:
    *   If **"Yes"** is clicked: The video jumps to 312 seconds. The client-side variable `maxWatchedTime` is set to 312, and video playback starts.
    *   If **"Start Over"** is clicked: The video begins at 0 seconds. `maxWatchedTime` remains 312 (preventing the lock from blocking clicks up to 312 seconds).
5.  **Playback Rules**:
    *   The user can seek anywhere between 0 and 312 seconds.
    *   Seeking past 312 seconds remains blocked.

---

## Flow 4: Admin — Adding a New Section

1.  **Navigation**: The admin logs in. Since their email is in `adminEmails.js`, they see the "Admin Dashboard" button in the navigation bar. They click it and navigate to `/admin` (`AdminPage.jsx`).
2.  **Section Management Panel**: The admin clicks the **"Sections"** tab, displaying a list of current sections.
3.  **Add Action**: The admin clicks **"Create New Section"**.
4.  **Form Input**: A modal form asks for:
    *   Section Title (e.g., "AA Fintech Architecture")
    *   Section Description (e.g., "Understand data schemas, security standards, and consent flows")
    *   Display Order (number, auto-filled to `lastOrder + 1`)
5.  **Submit**: The admin clicks **"Save Section"**.
6.  **Database Write**:
    *   The frontend sends a POST request to Apps Script: `createSection(title, description, order)`.
    *   The Apps Script appends a new row to the `content_sections` sheet with a generated ID (e.g. `sec_abc123`).
7.  **Success**: The admin is returned to the dashboard. The new section appears in the list.

---

## Flow 5: Admin — Adding a Video Module with Questions

1.  **Select Section**: On the Admin Dashboard, the admin clicks on the section they want to edit.
2.  **Module Listing**: The admin clicks **"Add Module"**.
3.  **Module Form Entry**: The admin inputs:
    *   Module Title (e.g., "FIP vs FIU APIs")
    *   YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
    *   Module Description (e.g., "A deep dive into REST endpoints for FIPs and FIUs.")
    *   Pass Threshold (e.g., `75`%)
    *   Questions Per Attempt (e.g., `5`)
4.  **Adding Assessment Questions (Question Bank)**:
    *   Within the same module form, there is a section called "Question Bank".
    *   The admin clicks **"Add Question"**.
    *   **Inputs**:
        *   Question Stem (e.g., "Which entity initiates the consent request?")
        *   Option A, Option B, Option C, Option D
        *   Correct Option (dropdown: A, B, C, or D)
        *   Explanation (text showing why the choice is correct)
        *   Trigger type: Dropdown (Select "End of Video" or "Mid-Video")
        *   Trigger timestamp (in seconds, only shown if "Mid-Video" is selected, e.g., `215` seconds)
    *   The admin repeats this to add multiple questions (e.g. 8 questions for a randomized pool).
5.  **Save Module**: The admin clicks **"Publish Module"**.
6.  **Multi-Write Processing**:
    *   The frontend saves the module row via `createModule(...)`.
    *   The frontend saves all questions via a batch `createQuestions(...)` call to the Apps Script.
    *   The system appends the rows to `content_modules` and `content_questions` sheets.
7.  **Verification**: The admin returns to the dashboard list, and previews the new module in learner mode to ensure it displays correctly.

---

## Flow 6: Admin — Viewing Analytics for a User

1.  **Navigate to Analytics**: From the Admin Panel, the user clicks the **"Analytics"** tab (`AnalyticsPage.jsx`).
2.  **Summary Cards**: Shows total active learners, average completion rates, and average assessment pass rates.
3.  **Learners Table**: Displays list of all registered learners.
    *   The admin scrolls or uses the search input to look up a user by name or email.
4.  **Select User**: The admin clicks on a user row.
5.  **Detailed Drawer Slide-out**:
    *   A side drawer opens, showing the learner's complete progress log.
    *   **Data details**:
        *   List of sections and their progress.
        *   Individual modules with watch percentage (e.g., "Video Watched: 100%").
        *   Quiz attempts count, highest score, and completion status.
6.  **CSV Export**: The admin clicks **"Export User Report"** to download the user's specific performance record as a CSV file.

---

## Flow 7: Admin — Creating a Batch/Cohort

1.  **Navigate to Cohorts**: From the Admin Panel, the admin clicks **"Batches/Cohorts"**.
2.  **Create Batch**: The admin clicks **"Create New Batch"**.
3.  **Form Input**: Inputs the Batch Code (e.g., `batch-2026-july`) and description.
4.  **User Assignment**:
    *   The page renders a checklist of all registered users without a batch.
    *   The admin checks the names of new joinees who belong to the July 2026 cohort.
5.  **Submit**: Clicking **"Save Batch"** sends a batch update call to the Google Sheets Apps Script.
6.  **Database Action**: Rows are added/updated in the `enrollments` sheet linking those user IDs to `batchId = 'batch-2026-july'`.

---

## Flow 8: Edge Cases

### 8.1 User loses internet connection mid-video
- **Detection**: The 30s background progress sync fails due to network error (`fetch` throws a NetworkError).
- **Behavior**:
    1. The frontend intercepts the failure and saves the current progress packet (`moduleId`, `watchPercent`, `lastPosition`) to `localStorage` under `pending_progress_sync`.
    2. A subtle offline warning banner is displayed: "You are offline. Progress is being saved locally."
    3. The application continues tracking locally.
    4. Every 15 seconds, the application checks if the browser is online (`navigator.onLine`).
    5. Once connection is restored, the client silently syncs the pending progress data to Google Sheets and hides the warning banner.

### 8.2 User closes tab mid-quiz
- **Behavior**:
    - The quiz is evaluated solely client-side and is only written to Google Sheets upon clicking the final "Submit Quiz" button.
    - If the user closes the browser or tab while answering questions, no `quizAttempts` row is created.
    - When the user returns to the module, they will find the video marked as watched (assuming the watch pings completed successfully), but they will have to start the quiz from the beginning. No penalty is applied.

### 8.3 Admin deletes a module a user is currently working on
- **Behavior**:
    - If the admin deletes a module while a user is active, the next 30-second progress sync request will return a `404 Module Not Found` error.
    - The client-side application detects the error code, displays a dialog box ("This module has been removed by the administrator. Returning to Dashboard"), and redirects the user back to the homepage.

### 8.4 Google Sheets API rate limit hit
- **Behavior**:
    - If Google Sheets API or Apps Script hits rate limits (returning HTTP 429 or 503 errors), the client-side API layer catches the error.
    - Instead of showing a blank screen, it uses cached content config from `localStorage` (which is updated once per session on startup) to keep the portal interface readable.
    - A banner warning is displayed: "Database is currently busy. Progress syncing might experience delays." The app queues write requests in `localStorage` and attempts to retry them using exponential backoff.
