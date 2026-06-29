import { CONFIG } from '../config/sheetsConfig';

/**
 * Generates the redirection URL for Google OAuth 2.0 Implicit Flow.
 * @returns {string} Google OAuth Authorization URL
 */
export function getGoogleAuthUrl() {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  
  // Dynamic redirect URI resolves to current page domain
  const redirectUri = `${window.location.origin}${window.location.pathname}`;
  
  const options = {
    client_id: CONFIG.googleClientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' '),
    state: 'digitap_oauth_state',
    prompt: 'consent'
  };

  const queryString = new URLSearchParams(options).toString();
  return `${rootUrl}?${queryString}`;
}

/**
 * Extracts the access token from the URL hash fragment.
 * @returns {string|null} The access token if found, else null.
 */
export function parseTokenFromHash() {
  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  
  // Clear the hash from the browser history for security and clean URL
  if (accessToken) {
    window.history.replaceState(null, null, ' ');
  }

  return accessToken;
}

/**
 * Fetches the user profile details from Google using the access token.
 * @param {string} accessToken - Google OAuth access token.
 * @returns {Promise<Object>} The user profile object containing googleId, email, name, picture.
 */
export async function fetchGoogleUserProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to retrieve user profile from Google OAuth');
  }

  const data = await response.json();
  
  return {
    googleId: data.sub,
    email: data.email,
    name: data.name,
    picture: data.picture
  };
}
