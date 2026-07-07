import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  loadRecords, upsertRecord, deleteLocalRecord,
  markRecordsSynced, replaceAllRecords,
} from '../storage/localStore';
import { syncToServer, deleteRecord as apiDeleteRecord } from '../services/recordsService';
import { useAuth } from './AuthContext';

const RecordsContext = createContext(null);

export const RecordsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [records, setRecords] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const syncLock = useRef(false);

  // ── Load local records on mount ───────────────────────────────
  useEffect(() => {
    loadRecords().then(setRecords);
  }, []);

  // ── Sync when coming back online ──────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        sync();
      }
    });
    return unsub;
  }, [isAuthenticated]);

  // ── Sync after auth ───────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) sync();
  }, [isAuthenticated]);

  // ── Sync function ─────────────────────────────────────────────
  const sync = useCallback(async () => {
    if (syncLock.current || !isAuthenticated) return;
    syncLock.current = true;
    setIsSyncing(true);

    try {
      const local = await loadRecords();
      const { records: serverRecords } = await syncToServer(local);
      const updated = await replaceAllRecords(serverRecords);
      setRecords(updated);
      setLastSyncedAt(new Date());
    } catch (err) {
      // Offline or server error — stay with local data
      console.log('Sync skipped:', err.message);
    } finally {
      setIsSyncing(false);
      syncLock.current = false;
    }
  }, [isAuthenticated]);

  // ── Save a record (local-first) ───────────────────────────────
  const saveRecord = useCallback(async (record) => {
    const withStatus = { ...record, syncStatus: 'pending' };
    const updated = await upsertRecord(withStatus);
    setRecords(updated);

    // Try to sync immediately
    sync();

    return updated;
  }, [sync]);

  // ── Delete a record ───────────────────────────────────────────
  const deleteRecord = useCallback(async (localId) => {
    // Find server _id if it exists
    const rec = records.find((r) => r.localId === localId);

    // Remove locally first
    const updated = await deleteLocalRecord(localId);
    setRecords(updated);

    // Delete from server if synced
    if (rec?._id && isAuthenticated) {
      try {
        await apiDeleteRecord(rec._id);
      } catch {}
    }
  }, [records, isAuthenticated]);

  // ── Check for duplicate date+shift ───────────────────────────
  const hasDuplicate = useCallback((date, shift, excludeLocalId) => {
    return records.some(
      (r) =>
        r.date === date &&
        r.shift === shift &&
        r.localId !== excludeLocalId
    );
  }, [records]);

  return (
    <RecordsContext.Provider
      value={{
        records,
        isSyncing,
        lastSynced: lastSyncedAt,   // alias used by RecordsScreen
        lastSyncedAt,
        saveRecord,
        deleteRecord,
        hasDuplicate,
        sync,
        syncRecords: sync,           // alias used by RecordsScreen
      }}
    >
      {children}
    </RecordsContext.Provider>
  );
};

export const useRecords = () => {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within RecordsProvider');
  return ctx;
};
