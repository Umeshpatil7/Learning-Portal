/**
 * Hardcoded whitelist of admin Google email addresses.
 * Users logging in with these emails will be granted the 'admin' role,
 * allowing access to the administrative and analytics dashboards.
 */
export const ADMIN_EMAILS = [
  'admin@digitap.ai',
  'umeshrandhir.patil@digitap.ai', // User email
  'hr@digitap.ai',
  'ecosystem@digitap.ai',
  'testadmin@digitap.ai' // Used for automated testing
];

/**
 * Checks if a given email is in the admin whitelist.
 * @param {string} email - The email to verify.
 * @returns {boolean} True if the email belongs to an administrator.
 */
export function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}
