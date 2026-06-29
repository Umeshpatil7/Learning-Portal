import { useState, useCallback } from 'react';

/**
 * Custom React hook to wrap sheetsService API calls with loading and error states.
 * @returns {Object} State and trigger wrapper
 */
export function useSheetsAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Executes an asynchronous sheetsService fetch call.
   * @param {Function} apiFunc - The sheetsService function to execute.
   * @param {...any} args - Arguments to pass to the function.
   * @returns {Promise<any>} The result of the API call.
   */
  const execute = useCallback(async (apiFunc, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFunc(...args);
      return data;
    } catch (err) {
      const msg = err.message || 'An error occurred during database access';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    execute
  };
}

export default useSheetsAPI;
