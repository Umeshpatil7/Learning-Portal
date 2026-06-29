import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as sheetsService from '../services/sheetsService';

const ProgressContext = createContext(null);

export function useProgress() {
  return useContext(ProgressContext);
}

/**
 * ProgressProvider component managing content structures, lock states,
 * offline progress caching, and background synchronizations.
 */
export function ProgressProvider({ children }) {
  const { user } = useAuth();

  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync state machine: 'idle' | 'offline' | 'syncing' | 'success' | 'error'
  const [syncStatus, setSyncStatus] = useState('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [offlineMode, setOfflineMode] = useState(false);

  // Compute pending count on mount
  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem('pending_progress_syncs') || '[]');
    setPendingCount(queue.length);

    // Initial online status check
    if (!navigator.onLine) {
      setSyncStatus('offline');
      setOfflineMode(true);
    }
  }, []);

  // Fetch sections, modules, and user progress
  const loadContentAndProgress = useCallback(async () => {
    if (!user?.googleId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Attempt network load
      const [fetchedSections, fetchedModules, fetchedProgress] = await Promise.all([
        sheetsService.getSections(),
        sheetsService.getModules(),
        sheetsService.getProgress(user.googleId)
      ]);

      const sortedSections = (fetchedSections || []).sort((a, b) => Number(a.order) - Number(b.order));
      const sortedModules = (fetchedModules || []).sort((a, b) => Number(a.order) - Number(b.order));

      const progressMap = {};
      (fetchedProgress || []).forEach(p => {
        progressMap[p.moduleId] = {
          ...p,
          watchPercent: Number(p.watchPercent || 0),
          lastPosition: Number(p.lastPosition || 0),
          completed: String(p.completed) === 'true'
        };
      });

      setSections(sortedSections);
      setModules(sortedModules);
      setUserProgress(progressMap);
      setOfflineMode(false);

      // Cache definitions locally for offline fallbacks
      localStorage.setItem('cached_sections', JSON.stringify(sortedSections));
      localStorage.setItem('cached_modules', JSON.stringify(sortedModules));
      localStorage.setItem(`cached_progress_${user.googleId}`, JSON.stringify(progressMap));

    } catch (err) {
      console.warn('Network load failed, falling back to localStorage caches:', err);
      setOfflineMode(true);

      // 2. Load fallback cached values
      const cachedSec = JSON.parse(localStorage.getItem('cached_sections') || '[]');
      const cachedMod = JSON.parse(localStorage.getItem('cached_modules') || '[]');
      const cachedProg = JSON.parse(localStorage.getItem(`cached_progress_${user.googleId}`) || '{}');

      if (cachedSec.length > 0 || cachedMod.length > 0) {
        setSections(cachedSec);
        setModules(cachedMod);
        setUserProgress(cachedProg);
        setError('Ecosystem offline: Viewing cached content.');
      } else {
        setError('Ecosystem offline: No cached content available.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.googleId]);

  // Load progress when user changes
  useEffect(() => {
    if (user?.googleId) {
      loadContentAndProgress();
    } else {
      setSections([]);
      setModules([]);
      setUserProgress({});
    }
  }, [user, loadContentAndProgress]);

  // ==========================================
  // OFFLINE QUEUE MANAGER FUNCTIONS
  // ==========================================

  /**
   * Triggers a sync of all cached offline progress logs.
   */
  const flushOfflineQueue = useCallback(async () => {
    if (!navigator.onLine || !user?.googleId) return;

    const queue = JSON.parse(localStorage.getItem('pending_progress_syncs') || '[]');
    if (queue.length === 0) return;

    setSyncStatus('syncing');

    try {
      // Sync each pending record
      for (const record of queue) {
        await sheetsService.upsertProgress(record);
      }

      // Success cleanup
      localStorage.removeItem('pending_progress_syncs');
      setPendingCount(0);
      setSyncStatus('success');

      // Refresh to load updated progression
      loadContentAndProgress();

      // Reset to idle status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to flush offline queue:', err);
      setSyncStatus('error');
    }
  }, [user?.googleId, loadContentAndProgress]);

  // Listen to window connection state changes
  useEffect(() => {
    const handleOnline = () => {
      setOfflineMode(false);
      flushOfflineQueue();
    };

    const handleOffline = () => {
      setOfflineMode(true);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushOfflineQueue]);

  /**
   * Helper: Queue progress update to localStorage for later synchronization.
   */
  const queueOfflineProgress = (record) => {
    const queue = JSON.parse(localStorage.getItem('pending_progress_syncs') || '[]');
    
    // Check if progress for this module already exists in queue, overwrite it
    const existingIndex = queue.findIndex(q => q.moduleId === record.moduleId);
    if (existingIndex !== -1) {
      // Merge with previous offline watch data (taking max)
      const prev = queue[existingIndex];
      queue[existingIndex] = {
        ...record,
        watchPercent: Math.max(Number(prev.watchPercent || 0), Number(record.watchPercent || 0)),
        completed: prev.completed || record.completed
      };
    } else {
      queue.push(record);
    }

    localStorage.setItem('pending_progress_syncs', JSON.stringify(queue));
    setPendingCount(queue.length);
    setSyncStatus('offline');
  };

  /**
   * Helper: Check module locks.
   */
  const isModuleUnlocked = useCallback((moduleId) => {
    if (user?.role === 'admin') return true;

    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex <= 0) return true;

    const previousModule = modules[moduleIndex - 1];
    const prevProgress = userProgress[previousModule.id];
    return !!prevProgress?.completed;
  }, [modules, userProgress, user]);

  /**
   * Saves and updates the watch percentage/position for a module.
   */
  const saveWatchProgress = useCallback(async (moduleId, watchPercent, lastPosition) => {
    if (!user?.googleId) return;

    const currentRecord = userProgress[moduleId] || {};
    const updatedRecord = {
      googleId: user.googleId,
      moduleId,
      watchPercent: Math.max(currentRecord.watchPercent || 0, watchPercent),
      lastPosition,
      completed: !!currentRecord.completed
    };

    // Update local state immediately for fast feedback
    setUserProgress(prev => ({
      ...prev,
      [moduleId]: updatedRecord
    }));

    // Cache local progress map copy
    const cachedProg = JSON.parse(localStorage.getItem(`cached_progress_${user.googleId}`) || '{}');
    cachedProg[moduleId] = updatedRecord;
    localStorage.setItem(`cached_progress_${user.googleId}`, JSON.stringify(cachedProg));

    // Send or Cache
    if (navigator.onLine) {
      try {
        await sheetsService.upsertProgress(updatedRecord);
      } catch (err) {
        console.warn('Sync failed, caching watch progress locally:', err);
        queueOfflineProgress(updatedRecord);
      }
    } else {
      queueOfflineProgress(updatedRecord);
    }
  }, [user, userProgress]);

  /**
   * Marks a module as completed (quiz passed).
   */
  const completeModule = useCallback(async (moduleId) => {
    if (!user?.googleId) return;

    const currentRecord = userProgress[moduleId] || {};
    const updatedRecord = {
      googleId: user.googleId,
      moduleId,
      watchPercent: Math.max(currentRecord.watchPercent || 0, 100),
      lastPosition: currentRecord.lastPosition || 0,
      completed: true,
      completedAt: new Date().toISOString()
    };

    // Update local state immediately
    setUserProgress(prev => ({
      ...prev,
      [moduleId]: updatedRecord
    }));

    // Cache local progress copy
    const cachedProg = JSON.parse(localStorage.getItem(`cached_progress_${user.googleId}`) || '{}');
    cachedProg[moduleId] = updatedRecord;
    localStorage.setItem(`cached_progress_${user.googleId}`, JSON.stringify(cachedProg));

    if (navigator.onLine) {
      try {
        await sheetsService.upsertProgress(updatedRecord);
        await loadContentAndProgress();
      } catch (err) {
        console.warn('Sync failed, caching completion locally:', err);
        queueOfflineProgress(updatedRecord);
      }
    } else {
      queueOfflineProgress(updatedRecord);
    }
  }, [user, userProgress, loadContentAndProgress]);

  const val = {
    sections,
    modules,
    userProgress,
    loading,
    error,
    syncStatus,
    pendingCount,
    offlineMode,
    refreshProgress: loadContentAndProgress,
    isModuleUnlocked,
    saveWatchProgress,
    completeModule,
    flushOfflineQueue
  };

  return (
    <ProgressContext.Provider value={val}>
      {children}
    </ProgressContext.Provider>
  );
}

export default ProgressProvider;
