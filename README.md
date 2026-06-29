# Digitap Learning Portal

A high-fidelity, serverless video training portal designed for Digitap employees, new joinees, and AA ecosystem fintech partners. Hostable entirely on **GitHub Pages** with zero hosting fees, using **Google Sheets** as a proxy database backend and **Google OAuth 2.0** for secure, whitelisted user verification.

---

## 🚀 Core Features

- **Google Auth Integration**: Secure authentication with whitelisted e-mail domains. Protects dashboards, sections, and admin consoles.
- **YouTube Player Scrubber Locks**: Custom iframe seek locking prevents users from skipped forward jumps. Supports natural backward seeks.
- **Automatic Resume Playback**: Detects previous watched positions and prompts users: *"Yes, Resume"* or *"Start Over"*.
- **MCQ Assessment Engine**: Shuffles randomized questions from the module's bank, requires custom passing scores, shows incorrect answer explanations, and triggers celebration confetti.
- **Offline Caching & Reconnection Queue**: Stores section definitions locally. If the browser goes offline, progress is queued in `localStorage` and flushed to Sheets automatically upon reconnection.
- **Content Management Dashboard**: Interactive admin panels allowing creations, deletions, and ordering edits for Sections, Modules, and Questions.
- **Analytics Board**: Overview metrics (enrollment count, pass rates), HSL-styled CSS drop-off graphs per lesson, cohort table filters, and CSV report export.

---

## 🛠️ Step-by-Step Installation

### 1. Setup the Google Sheets Proxy Database
1. Create a new Google Spreadsheet.
2. Setup the following 7 sheet tabs with headers in the first row:
   - **`users`**: `googleId`, `email`, `name`, `picture`, `batch`, `enrolledAt`, `lastActive`
   - **`progress`**: `id`, `googleId`, `moduleId`, `watchPercent`, `lastPosition`, `completed`, `completedAt`
   - **`quizAttempts`**: `attemptId`, `googleId`, `moduleId`, `attemptNumber`, `score`, `passed`, `answers`, `timestamp`
   - **`enrollments`**: `googleId`, `batchId`, `enrolledAt`
   - **`content_sections`**: `id`, `title`, `description`, `order`, `published`
   - **`content_modules`**: `id`, `sectionId`, `title`, `description`, `youtubeUrl`, `passThreshold`, `questionsPerAttempt`, `order`, `published`
   - **`content_questions`**: `id`, `moduleId`, `stem`, `optionA`, `optionB`, `optionC`, `optionD`, `correctOption`, `explanation`, `triggerType`, `triggerTimestamp`

### 2. Deploy Google Apps Script Web App
1. Inside the spreadsheet, click **Extensions** > **Apps Script**.
2. Replace all script content with [Code.gs](file:///scripts/appsscript/Code.gs).
3. Click **Deploy** > **New Deployment**.
4. Select type **Web App**:
   - *Execute as*: **Me** (your Gmail account)
   - *Who has access*: **Anyone** (required to receive CORS POST pings)
5. Deploy and copy the generated **Web App URL** (e.g. `https://script.google.com/macros/s/.../exec`).

### 3. Environment Variables Config
1. Create a `.env` file in the root directory (refer to [.env.example](file:///.env.example)):
   ```env
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
   ```
2. Whitelist your administrator email domains or specific addresses inside [adminEmails.js](file:///src/config/adminEmails.js):
   ```javascript
   export const ADMIN_EMAILS = [
     'admin@digitap.ai',
     'hr@digitap.ai'
   ];
   ```

### 4. Build and Deployment
The repository features an automated GitHub Actions pipeline in [.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml).
1. Add your repository secrets in GitHub (`Settings` > `Secrets and variables` > `Actions`):
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_APPS_SCRIPT_URL`
2. Push your changes to the `main` branch.
3. GitHub Actions will build, test, and host the portal automatically on **GitHub Pages** under `https://<your-username>.github.io/<repo-name>/`.

---

## 🧪 Testing and Verification

To verify changes locally (optional, requires Node.js):
1. Install dependencies:
   ```bash
   npm install
   ```
2. Launch dev hot-reload server:
   ```bash
   npm run dev
   ```
3. Run unit tests with Vitest:
   ```bash
   npm run test:unit
   ```
