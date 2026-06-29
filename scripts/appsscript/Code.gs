/**
 * DIGITAP LEARNING PORTAL — Google Apps Script Backend (Code.gs)
 * Deployed as a Web App (POST endpoint) acting as a database proxy.
 */

// Define all sheet tab names
const SHEETS = {
  USERS: 'users',
  ENROLLMENTS: 'enrollments',
  PROGRESS: 'progress',
  QUIZ_ATTEMPTS: 'quizAttempts',
  SECTIONS: 'content_sections',
  MODULES: 'content_modules',
  QUESTIONS: 'content_questions'
};

/**
 * Handles incoming HTTP POST requests.
 * @param {Object} e - Event parameter containing postData.
 * @returns {TextOutput} JSON response output.
 */
function doPost(e) {
  const result = { success: false, data: null, error: null };
  const lock = LockService.getScriptLock();
  
  try {
    // Acquire lock (wait up to 30 seconds) to prevent concurrency collisions
    lock.waitLock(30000);
    
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Missing payload content');
    }
    
    const payload = JSON.parse(e.postData.contents);
    const { action, data } = payload;
    
    if (!action) {
      throw new Error('Action parameter is required');
    }
    
    const responseData = executeAction(action, data);
    result.success = true;
    result.data = responseData;
    
  } catch (err) {
    result.success = false;
    result.error = err.toString();
    Logger.log('Error executing action: ' + err.toString());
  } finally {
    // Release the script lock
    lock.releaseLock();
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Route actions to their respective handler functions.
 */
function executeAction(action, data) {
  switch (action) {
    case 'getUser':
      return getUser(data.googleId);
    case 'upsertUser':
      return upsertUser(data);
    case 'getProgress':
      return getProgress(data.googleId);
    case 'upsertProgress':
      return upsertProgress(data);
    case 'logQuizAttempt':
      return logQuizAttempt(data);
    case 'getEnrollments':
      return getEnrollments(data.googleId);
    case 'getSections':
      return getRows(SHEETS.SECTIONS);
    case 'getModules':
      return getRows(SHEETS.MODULES);
    case 'getQuestions':
      return getRows(SHEETS.QUESTIONS);
    case 'getAllUsers':
      return getRows(SHEETS.USERS);
    case 'getAllProgress':
      return getRows(SHEETS.PROGRESS);
    case 'getAllQuizAttempts':
      return getRows(SHEETS.QUIZ_ATTEMPTS);
      
    // Admin content edits
    case 'upsertSection':
      return upsertRow(SHEETS.SECTIONS, 'id', data);
    case 'deleteSection':
      return deleteSectionCascading(data.id);
    case 'upsertModule':
      return upsertRow(SHEETS.MODULES, 'id', data);
    case 'deleteModule':
      return deleteModuleCascading(data.id);
    case 'upsertQuestion':
      return upsertRow(SHEETS.QUESTIONS, 'id', data);
    case 'deleteQuestion':
      return deleteRow(SHEETS.QUESTIONS, 'id', data.id);
    case 'upsertBatchEnrollments':
      return upsertBatchEnrollments(data.batchId, data.googleIds);
      
    default:
      throw new Error('Unknown action: ' + action);
  }
}

// ==========================================
// CORE SHEETS UTILITY FUNCTIONS
// ==========================================

/**
 * Reads all rows from a spreadsheet tab and parses them into JSON objects.
 */
function getRows(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  return values.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Inserts or updates a row matching a key field in a specific sheet.
 */
function upsertRow(sheetName, keyField, obj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  // Create sheet if it does not exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = Object.keys(obj);
    sheet.appendRow(headers);
  }
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  // Find key index
  const keyColIndex = headers.indexOf(keyField) + 1;
  if (keyColIndex === 0) {
    throw new Error('Key field not found in headers for sheet: ' + sheetName);
  }
  
  let rowIndex = -1;
  if (lastRow >= 2) {
    const keyValues = sheet.getRange(2, keyColIndex, lastRow - 1, 1).getValues();
    for (let i = 0; i < keyValues.length; i++) {
      if (String(keyValues[i][0]) === String(obj[keyField])) {
        rowIndex = i + 2; // Add 2 for headers and 0-index offset
        break;
      }
    }
  }
  
  // Build row values matching header layout
  const rowValues = headers.map(header => {
    return obj[header] !== undefined ? obj[header] : '';
  });
  
  if (rowIndex !== -1) {
    // Update existing row
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    // Append new row
    sheet.appendRow(rowValues);
  }
  
  return obj;
}

/**
 * Deletes a row matching a key identifier.
 */
function deleteRow(sheetName, keyField, keyValue) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return false;
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return false;
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const keyColIndex = headers.indexOf(keyField) + 1;
  if (keyColIndex === 0) return false;
  
  const keyValues = sheet.getRange(2, keyColIndex, lastRow - 1, 1).getValues();
  for (let i = 0; i < keyValues.length; i++) {
    if (String(keyValues[i][0]) === String(keyValue)) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  return false;
}

// ==========================================
// BUSINESS ACTIONS HANDLERS
// ==========================================

function getUser(googleId) {
  const users = getRows(SHEETS.USERS);
  const match = users.find(u => String(u.googleId) === String(googleId));
  return match || null;
}

function upsertUser(userObj) {
  userObj.lastActive = new Date().toISOString();
  if (!userObj.enrolledAt) {
    userObj.enrolledAt = new Date().toISOString();
  }
  return upsertRow(SHEETS.USERS, 'googleId', userObj);
}

function getProgress(googleId) {
  const progressList = getRows(SHEETS.PROGRESS);
  return progressList.filter(p => String(p.googleId) === String(googleId));
}

function upsertProgress(progressObj) {
  // Key uniquely identifies progress as googleId_moduleId
  progressObj.id = progressObj.googleId + '_' + progressObj.moduleId;
  if (progressObj.completed && !progressObj.completedAt) {
    progressObj.completedAt = new Date().toISOString();
  }
  
  // Track last active in users sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  if (usersSheet) {
    const users = getRows(SHEETS.USERS);
    const userIndex = users.findIndex(u => String(u.googleId) === String(progressObj.googleId));
    if (userIndex !== -1) {
      // Column 6 is lastActive (1-indexed row userIndex + 2)
      usersSheet.getRange(userIndex + 2, 6).setValue(new Date().toISOString());
    }
  }

  return upsertRow(SHEETS.PROGRESS, 'id', progressObj);
}

function logQuizAttempt(attemptObj) {
  attemptObj.attemptId = Utilities.getUuid();
  attemptObj.timestamp = new Date().toISOString();
  return upsertRow(SHEETS.QUIZ_ATTEMPTS, 'attemptId', attemptObj);
}

function getEnrollments(googleId) {
  const enrollments = getRows(SHEETS.ENROLLMENTS);
  return enrollments.filter(e => String(e.googleId) === String(googleId));
}

function upsertBatchEnrollments(batchId, googleIds) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ENROLLMENTS);
  if (!sheet) return [];
  
  // Remove existing enrollments for this batch to avoid duplicates
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const googleIdIndex = headers.indexOf('googleId') + 1;
    const batchIdIndex = headers.indexOf('batchId') + 1;
    
    // Read reverse order to delete safely
    for (let r = lastRow; r >= 2; r--) {
      const bVal = sheet.getRange(r, batchIdIndex).getValue();
      const gVal = sheet.getRange(r, googleIdIndex).getValue();
      if (String(bVal) === String(batchId) && googleIds.includes(String(gVal))) {
        sheet.deleteRow(r);
      }
    }
  }
  
  // Write new enrollments
  googleIds.forEach(googleId => {
    upsertRow(SHEETS.ENROLLMENTS, 'googleId', {
      googleId: googleId,
      batchId: batchId,
      enrolledAt: new Date().toISOString()
    });
  });
  
  return { batchId, googleIdsCount: googleIds.length };
}

function deleteSectionCascading(sectionId) {
  // 1. Delete section
  deleteRow(SHEETS.SECTIONS, 'id', sectionId);
  
  // 2. Cascade delete modules and questions
  const modules = getRows(SHEETS.MODULES);
  modules.forEach(mod => {
    if (String(mod.sectionId) === String(sectionId)) {
      deleteModuleCascading(mod.id);
    }
  });
  return true;
}

function deleteModuleCascading(moduleId) {
  // 1. Delete module
  deleteRow(SHEETS.MODULES, 'id', moduleId);
  
  // 2. Delete associated questions
  const questions = getRows(SHEETS.QUESTIONS);
  questions.forEach(q => {
    if (String(q.moduleId) === String(moduleId)) {
      deleteRow(SHEETS.QUESTIONS, 'id', q.id);
    }
  });
  return true;
}
