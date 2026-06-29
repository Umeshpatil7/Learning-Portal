import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for client-side hash routing.
 * Parses hashes of forms:
 * - #/
 * - #/section/:sectionId
 * - #/module/:moduleId
 * - #/admin
 * - #/analytics
 * 
 * @returns {Object} { route, params, navigate }
 */
export function useHashRoute() {
  const [routeInfo, setRouteInfo] = useState({ route: 'home', params: {} });

  const parseHash = useCallback(() => {
    const hash = window.location.hash || '#/';
    
    if (hash === '#/' || hash === '') {
      return { route: 'home', params: {} };
    }
    if (hash === '#/admin') {
      return { route: 'admin', params: {} };
    }
    if (hash === '#/analytics') {
      return { route: 'analytics', params: {} };
    }

    // Match #/section/:id
    const sectionMatch = hash.match(/^#\/section\/([^/]+)$/);
    if (sectionMatch) {
      return { route: 'section', params: { sectionId: sectionMatch[1] } };
    }

    // Match #/module/:id
    const moduleMatch = hash.match(/^#\/module\/([^/]+)$/);
    if (moduleMatch) {
      return { route: 'module', params: { moduleId: moduleMatch[1] } };
    }

    // Fallback to home
    return { route: 'home', params: {} };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setRouteInfo(parseHash());
    };

    // Parse initial route
    setRouteInfo(parseHash());

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [parseHash]);

  /**
   * Navigates to a specific path hash.
   * @param {string} hash - Target hash path, e.g. '#/admin' or '#/section/sec_1'
   */
  const navigate = useCallback((hash) => {
    window.location.hash = hash;
  }, []);

  return {
    route: routeInfo.route,
    params: routeInfo.params,
    navigate
  };
}

export default useHashRoute;
