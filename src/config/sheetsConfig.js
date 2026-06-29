/**
 * Configuration variables loaded from Vite environment variables.
 * Store actual secrets in a local .env file.
 */
export const CONFIG = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  appsScriptUrl: import.meta.env.VITE_APPS_SCRIPT_URL || '',
};

if (!CONFIG.googleClientId) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not configured. Google Sign-In will not function properly.');
}

if (!CONFIG.appsScriptUrl) {
  console.warn('VITE_APPS_SCRIPT_URL is not configured. Database actions will fail.');
}
