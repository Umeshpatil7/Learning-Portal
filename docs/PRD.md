# Product Requirements Document (PRD)
Version: 1.0 | Status: Proposed | Author: Senior Full-Stack Engineer & Product Architect

## 1. Product Overview
The **Digitap Learning Portal** is a static, serverless, web-based training platform designed to onboard internal employees, train new joinees, and educate external stakeholders in the Account Aggregator (AA) fintech ecosystem. Digitap acts as a Technology Service Provider (TSP) in this ecosystem, necessitating deep domain education. 

To achieve zero hosting and infrastructure costs, the system is designed to run entirely in the browser, hosted on GitHub Pages, utilizing Google OAuth 2.0 for security, and leveraging Google Sheets (via a Google Apps Script Web App) as the write/read database.

## 2. Goals & Success Metrics
- **Zero Running Costs**: No paid database or server hosting.
- **Engagement & Compliance**: Ensure users actually watch the training videos (via watch gates and scrubber locks) and retain knowledge (via interactive MCQ assessments).
- **Ease of Content Management**: Enable non-technical admins to add new video courses, sections, and MCQs instantly without writing code or initiating GitHub deployments.
- **Actionable Analytics**: Provide administrators with granular insight into cohort performance, drop-off points, and assessment scores.

## 3. User Roles
- **Learner (Default)**: Users authenticated via Google who can view sections, watch unlocked videos, take quizzes, and track their progress.
- **Admin**: Users defined in a hardcoded list of admin emails (`adminEmails.js`) who can access the administration dashboard, manage content configurations, view analytics, assign users to batches, and override module locks.

---

## 4. Core Features — Detailed

### 4.1 Section Management
- Grouping of training content into logical divisions (e.g., "AA Ecosystem Training", "Digitap Product Integration").
- Admins can create, delete, reorder, and rename sections.

### 4.2 Module / Video Management
- A module consists of exactly one video and one associated MCQ quiz.
- Admins can add, edit, or delete modules within sections, setting titles, YouTube links, descriptions, pass thresholds, and random question quantities.

### 4.3 Video Player Experience
- Embedded YouTube videos using the YouTube IFrame API.
- Locked scrubber prevents seeking forward past the furthest point watched.
- Save progress position so users can resume where they left off.

### 4.4 Assessment Engine (MCQ System)
- Support for mid-video questions that interrupt playback at designated timestamps, and/or end-of-video quizzes.
- Questions are randomly selected from a larger pool (question bank) associated with the module.
- Explanations are provided for incorrect answers to support learning.

### 4.5 Progress Tracking
- Tracks watch percentage and quiz completion.
- Modules are locked in a strict sequential hierarchy (Prerequisite Locking) unless manually overridden by an admin.

### 4.6 Admin Analytics Dashboard
- Summary statistics for sections and cohorts.
- Detailed progress and quiz scores down to the individual user and module.
- CSV export for all reports.

### 4.7 User Enrollment & Auth
- Passwordless sign-in using Google OAuth 2.0.
- Automatic creation of learner profiles in the database upon first login.
- Administration panel to assign learners to specific batches.

---

## 5. Feature Specifications

### 5.1 Video Player Experience
*   **Input**:
    *   YouTube URL (e.g., `https://www.youtube.com/watch?v=...` or `https://youtu.be/...`).
    *   Last saved watch position from the database (`Progress` record: `lastPosition`).
    *   Furthest watched point (stored locally/statefully as `maxWatchedTime`).
*   **Behavior**:
    *   **IFrame Integration**: Renders the video container using the YouTube IFrame Player API. Plays strictly inline on the site (no redirection/linking to YouTube).
    *   **Scrubber Lock**: Periodically polls the video player's current time (every 250ms). If `player.getCurrentTime()` is greater than `maxWatchedTime + 2` seconds, it triggers `player.seekTo(maxWatchedTime, true)` to snap the user back.
    *   **Furthest Point Update**: As the video plays naturally, `maxWatchedTime` is updated to equal `player.getCurrentTime()` if the current time is greater.
    *   **Progress Sync (30s Ping)**: A hook triggers every 30 seconds to send an API POST request to the Google Apps Script Web App with the current `watchPercent` (calculated as `maxWatchedTime / videoDuration * 100`) and the current position timestamp `lastPosition`.
    *   **Resume Playback**: When loading a module, the system checks if the user has a saved `lastPosition`. If so, the player initializes and calls `player.seekTo(lastPosition, false)` and prompts the user "Resume from where you left off?".
*   **Output**:
    *   Controlled video playback in the custom player shell.
    *   Locked forward-seeking.
    *   Database updates of watch percentage and timestamps.
*   **Edge Cases**:
    *   *User opens video, goes to another tab*: Video keeps playing, watch percentage increases. (Acceptable, standard limitation of iframe-based tracking, though we can pause playback on window blur if desired).
    *   *Network disconnection*: The 30s ping fails. The client retries twice and, if offline, caches the progress in `localStorage` to sync once reconnect occurs.
    *   *Video duration changes*: If admin changes the YouTube video, the progress duration calculations auto-adjust because they are computed dynamically based on the YouTube player's reported duration (`player.getDuration()`).

### 5.2 Assessment Engine (MCQ System)
*   **Input**:
    *   Module Question Bank (list of questions in Sheets config).
    *   `questionsPerAttempt` setting (default 5).
    *   `passThreshold` setting (default 70%).
    *   Trigger type: `mid` (at timestamp $T$) or `end` (at video end).
*   **Behavior**:
    *   **Question Selection**: When the quiz triggers, the engine filters the module's questions. It shuffles the list and selects exactly $N$ questions (where $N = \min(\text{bankSize}, \text{questionsPerAttempt})$).
    *   **Mid-Video Interruption**: When the YouTube player hits a timestamp $T \pm 0.5$ seconds associated with a `mid` type question:
        1. Pause the video.
        2. Render the MCQ question overlay.
        3. Scrubber and controls are disabled.
        4. User selects an answer.
        5. System shows the explanation and whether correct.
        6. On clicking "Continue", the overlay closes and the video resumes.
    *   **End-of-Video Trigger**: When the player state becomes `ENDED` (or reaches 99% duration), the system automatically pops up the final MCQ modal.
    *   **Direct Assessment Attempt**: Learners can attempt the final assessment directly at any time. A prominent "Attempt Quiz Directly" button is always visible on the module view, allowing users to take the quiz immediately without having to watch the video first.
    *   **Watch Gate Tracking**: While the watch percentage is still tracked (and synced to Google Sheets for analytics and compliance), it does not act as a hard blocker for attempting the quiz. Passing the quiz is the sole criteria to unlock the next module.
    *   **Scoring & Feedback**:
        *   Upon submitting the end-of-video quiz, calculate the percentage: $\text{score} = (\text{correctAnswers} / N) \times 100$.
        *   If $\text{score} \ge \text{passThreshold}$: Mark module as passed. Log attempt. Trigger success animation.
        *   If $\text{score} < \text{passThreshold}$: Log attempt. Present wrong answers, select option indicators, and explanations. Enable "Retry Quiz" button.
*   **Output**:
    *   Visual MCQ interactive screens.
    *   Apps Script API call: `logQuizAttempt(googleId, moduleId, attemptNumber, score, passed, answersJSON)`.
*   **Edge Cases**:
    *   *User closes tab mid-quiz*: The attempt is *not* submitted to Google Sheets (no penalty). The next time they open the page, they must take the quiz again.
    *   *Admin changes question bank mid-attempt*: Randomization is done at the moment the quiz modal opens. If config changes mid-attempt, the user finishes their current randomized set safely.

### 5.3 Prerequisite Locking
*   **Input**:
    *   List of all modules in a section sorted by order.
    *   User's progress state (list of modules completed).
    *   Admin overrides list.
*   **Behavior**:
    *   A module $M_{i}$ is unlocked if:
        1. It is the first module in the section ($i = 0$), OR
        2. The preceding module $M_{i-1}$ has a progress record marked as `completed = true` (which requires both the watch gate $\ge 80\%$ and the quiz passed $\ge$ threshold), OR
        3. The admin has explicitly overridden the lock for this user in the database.
    *   Locked modules are rendered in the dashboard with a grayscale overlay, a lock icon, and a message: "Complete previous module first". Clicking them does nothing.
*   **Output**:
    *   Conditional rendering of section module grids.
*   **Edge Cases**:
    *   *User somehow visits ModulePage URL of locked module directly*: Route guard intercepts the load, checks the `ProgressContext`, and redirects the user back to the `HomePage` with an alert.

### 5.4 Admin Content Management
*   **Input**:
    *   Form data for sections, modules, and questions.
*   **Behavior**:
    *   **Read Config**: App pulls content definition directly from Google Sheets (`sections`, `modules`, `questions` tabs) and caches it in global state.
    *   **Modify Config**: Admins use UI forms (e.g. "Add Section", "Edit Module", "Manage Questions") to add/update records. These modifications fire immediate POST requests to the Apps Script Web App, which writes them directly to the corresponding Sheet tabs.
    *   **Preview Mode**: Admins can click a "Preview" button on any module, opening a simulated learner view that bypasses the prerequisite lock and watch gates for testing purposes.
    *   **Publish Toggle**: Setting `published = false` immediately filters the module or section out of the learners' list view.
*   **Output**:
    *   Updates to Google Sheet config tabs.
*   **Edge Cases**:
    *   *Invalid YouTube URL*: Admin form validates the YouTube URL using regex before sending, extracting the video ID. Rejects invalid inputs.
    *   *Decimal/Empty Timestamps*: Mid-video questions validate that the timestamp input is a number greater than 0 and less than the video duration.

### 5.5 Admin Analytics Dashboard
*   **Input**:
    *   Aggregated data from `users`, `progress`, `quizAttempts`, and `enrollments` sheets.
*   **Behavior**:
    *   **Cohort Filtering**: Admin can filter all stats by Batch/Cohort (e.g., "July 2026 Joinees").
    *   **Per-User View**: Table displaying Learner name, email, batch, current overall progress %, total quizzes passed, and date of last activity. Clicking a user opens a detailed drawer showing their progress per module (watch % and highest quiz score).
    *   **Per-Module View**: Visual chart or table showing total enrollments, average watch %, average quiz scores, pass rate, and average dropout point (aggregated `lastPosition` values grouped in intervals).
    *   **CSV Export**: Synthesizes the active table filters into a standard CSV download block on the client side.
*   **Output**:
    *   Interactive charts (using simple SVG charts or lightweight CSS) and structured tables.
    *   Downloadable CSV file.
*   **Edge Cases**:
    *   *No user progress recorded*: Renders friendly empty-state illustrations rather than crashing.

---

## 6. Out of Scope
- No completion certificate generation (no PDFs/emails).
- No standalone native mobile apps (iOS/Android) — must be accessed via mobile web browsers.
- No payment gateway or subscription processing (wholly internal/external free access).
- No video hosting directly on Google Drive or our servers (YouTube only).

---

## 7. Non-Functional Requirements
- **Serverless Static Architecture**: Hosted entirely on GitHub Pages. No Node.js server processes, no containerization, no hosting costs.
- **Security & Domain Lock**: Google OAuth implicit client-side flow. Authenticated API calls to Apps Script must check the requester's identity. Admins are checked against a hardcoded list of verified email addresses.
- **Database Limits**: Google Sheets is the database. Apps Script acts as the API endpoint. We must optimize reads/writes to respect Google API daily quotas.
- **Performance**: Initial loading of dashboard list should be under 3 seconds on a standard 3G/4G connection. Content definitions are loaded and cached locally.
- **Responsive Web Design**: Mobile-first fluid layout to support learners using smartphones and tablets.

---

## 8. Data Model (Google Sheets Schema)

The database will consist of a single Google Spreadsheet with the following sheets (tabs):

### 8.1 Users Sheet (`users`)
Stores registration records for all users.
| Column | Type | Description |
| :--- | :--- | :--- |
| `googleId` | String (PK) | Google unique user identifier |
| `email` | String | User's Google account email address |
| `name` | String | Full name from Google Profile |
| `role` | String | `learner` or `admin` |
| `enrolledAt` | ISO String | Timestamp of first registration |
| `lastActive` | ISO String | Timestamp of last user API call |

### 8.2 Enrollments Sheet (`enrollments`)
Maps users to specific batches/cohorts.
| Column | Type | Description |
| :--- | :--- | :--- |
| `googleId` | String (PK, FK) | Google unique user identifier |
| `batchId` | String | Cohort code (e.g., `batch-2026-july`) |
| `enrolledAt` | ISO String | Timestamp of enrollment |

### 8.3 Progress Sheet (`progress`)
Tracks watch status and completion of modules.
| Column | Type | Description |
| :--- | :--- | :--- |
| `googleId` | String (PK, FK) | Google unique user identifier |
| `moduleId` | String (PK, FK) | Module identifier |
| `watchPercent` | Number | Max percentage of video watched (0 - 100) |
| `lastPosition` | Number | Last playback position in seconds |
| `completed` | Boolean | True if watch gate $\ge 80\%$ AND quiz passed |
| `completedAt`| ISO String | Timestamp when module was completed |

### 8.4 Quiz Attempts Sheet (`quizAttempts`)
Logs every assessment attempt.
| Column | Type | Description |
| :--- | :--- | :--- |
| `attemptId` | String (PK) | Unique attempt UUID |
| `googleId` | String (FK) | Google unique user identifier |
| `moduleId` | String (FK) | Module identifier |
| `attemptNumber` | Number | Incrementing attempt counter |
| `score` | Number | Percentage score achieved (0 - 100) |
| `passed` | Boolean | True if score $\ge$ pass threshold |
| `answers` | String (JSON) | Array of answers submitted |
| `timestamp` | ISO String | Timestamp of attempt completion |

### 8.5 Content Sections Sheet (`content_sections`)
Configures sections.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique section identifier |
| `title` | String | Section title |
| `description` | String | Section description |
| `order` | Number | Display order index |
| `published` | Boolean | Display status |

### 8.6 Content Modules Sheet (`content_modules`)
Configures modules.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique module identifier |
| `sectionId` | String (FK) | Section identifier |
| `title` | String | Module title |
| `youtubeUrl` | String | Video source URL |
| `description` | String | Module description |
| `order` | Number | Display order index |
| `published` | Boolean | Display status |
| `passThreshold`| Number | Passing threshold (e.g. 70) |
| `questionsPerAttempt` | Number | Number of questions to serve (e.g. 5) |

### 8.7 Content Questions Sheet (`content_questions`)
Stores the question banks.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique question identifier |
| `moduleId` | String (FK) | Module identifier |
| `stem` | String | The question text |
| `optionA` | String | Answer choice A |
| `optionB` | String | Answer choice B |
| `optionC` | String | Answer choice C |
| `optionD` | String | Answer choice D |
| `correctOption`| String | Correct option (`A`, `B`, `C`, or `D`) |
| `explanation` | String | Explanation shown to users |
| `triggerType` | String | `mid` (mid-video) or `end` (end of video) |
| `triggerTimestamp` | Number | Timestamp in seconds (only for `triggerType = mid`) |

---

## 9. Open Questions & Assumptions
- **Assumptions**: We assume that Google Sheet write operations take ~1-2 seconds via Apps Script, which is acceptable for background progress syncing and quiz submissions.
- **Rate Limiting**: Google Sheets API has daily quota limits (typically 20,000 executions per day for free accounts, or 500,000 for Google Workspace accounts). Given the portal is internal/stakeholder-focused, traffic will be small enough to stay well below these limits.
- **Public Apps Script Endpoint**: The Apps Script URL is public but requests must carry a payload containing Google Auth verification tokens to confirm authenticity.
