import { CONFIG } from '../config/sheetsConfig';

/**
 * Base utility to make POST requests to the Google Apps Script Web App.
 * Uses text/plain Content-Type to avoid CORS preflight (OPTIONS) triggers,
 * which Google Apps Script does not natively support for direct cross-origin calls.
 * 
 * @param {string} action - The action mapped in Code.gs
 * @param {Object} data - Payload data
 * @returns {Promise<any>} Response data returned from Apps Script
 */
async function callAppsScript(action, data = {}) {
  const url = CONFIG.appsScriptUrl;
  if (!url) {
    throw new Error('VITE_APPS_SCRIPT_URL is not configured.');
  }

  const payload = { action, data };

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Avoid CORS preflight OPTIONS check
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || `Apps Script error executing action ${action}`);
    }

    return result.data;
  } catch (error) {
    console.error(`sheetsService failed on action [${action}]:`, error);
    throw error;
  }
}

/**
 * Retrieves a user record by Google ID.
 */
export async function getUser(googleId) {
  return callAppsScript('getUser', { googleId });
}

/**
 * Updates or registers a user.
 */
export async function upsertUser(user) {
  return callAppsScript('upsertUser', user);
}

/**
 * Retrieves progress rows for a user.
 */
export async function getProgress(googleId) {
  return callAppsScript('getProgress', { googleId });
}

/**
 * Updates watch position/completion status for a module.
 */
export async function upsertProgress(progress) {
  return callAppsScript('upsertProgress', progress);
}

/**
 * Logs a quiz attempt.
 */
export async function logQuizAttempt(attempt) {
  return callAppsScript('logQuizAttempt', attempt);
}

/**
 * Retrieves batch enrollments for a user.
 */
export async function getEnrollments(googleId) {
  return callAppsScript('getEnrollments', { googleId });
}

/**
 * Fetches all section definitions.
 */
export async function getSections() {
  return callAppsScript('getSections');
}

/**
 * Fetches all module definitions.
 */
export async function getModules() {
  return callAppsScript('getModules');
}

/**
 * Fetches all question banks.
 */
export async function getQuestions() {
  return callAppsScript('getQuestions');
}

/**
 * Admin: Adds or updates a section definition.
 */
export async function upsertSection(section) {
  return callAppsScript('upsertSection', section);
}

/**
 * Admin: Deletes a section (cascades to modules & questions).
 */
export async function deleteSection(id) {
  return callAppsScript('deleteSection', { id });
}

/**
 * Admin: Adds or updates a module definition.
 */
export async function upsertModule(moduleObj) {
  return callAppsScript('upsertModule', moduleObj);
}

/**
 * Admin: Deletes a module (cascades to questions).
 */
export async function deleteModule(id) {
  return callAppsScript('deleteModule', { id });
}

/**
 * Admin: Adds or updates a question bank definition.
 */
export async function upsertQuestion(question) {
  return callAppsScript('upsertQuestion', question);
}

/**
 * Admin: Deletes a specific question.
 */
export async function deleteQuestion(id) {
  return callAppsScript('deleteQuestion', { id });
}

/**
 * Admin: Registers batch enrollment mappings.
 */
export async function upsertBatchEnrollments(batchId, googleIds) {
  return callAppsScript('upsertBatchEnrollments', { batchId, googleIds });
}

/**
 * Admin: Fetches list of all registered portal users.
 */
export async function getAllUsers() {
  return callAppsScript('getAllUsers');
}

/**
 * Admin: Fetches cross-cohort watch states.
 */
export async function getAllProgress() {
  return callAppsScript('getAllProgress');
}

/**
 * Admin: Fetches history logs for all quiz attempts.
 */
export async function getAllQuizAttempts() {
  return callAppsScript('getAllQuizAttempts');
}
