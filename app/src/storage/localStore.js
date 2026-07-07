import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  RECORDS: 'bh_records',
  THEME: 'bh_theme',
  PIN: 'bh_pin',
};

// ── Records ───────────────────────────────────────────────────

export const loadRecords = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.RECORDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveRecords = async (records) => {
  try {
    await AsyncStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('saveRecords error:', err);
  }
};

/**
 * Upsert a single record by localId. Returns updated list.
 */
export const upsertRecord = async (record) => {
  const records = await loadRecords();
  const idx = records.findIndex((r) => r.localId === record.localId);
  if (idx >= 0) {
    records[idx] = { ...records[idx], ...record };
  } else {
    records.unshift({ ...record, syncStatus: record.syncStatus || 'pending' });
  }
  await saveRecords(records);
  return records;
};

/**
 * Delete a record by localId. Returns updated list.
 */
export const deleteLocalRecord = async (localId) => {
  const records = await loadRecords();
  const updated = records.filter((r) => r.localId !== localId);
  await saveRecords(updated);
  return updated;
};

/**
 * Mark records as synced after a successful sync
 */
export const markRecordsSynced = async (localIds) => {
  const records = await loadRecords();
  const updated = records.map((r) =>
    localIds.includes(r.localId) ? { ...r, syncStatus: 'synced' } : r
  );
  await saveRecords(updated);
  return updated;
};

/**
 * Replace all local records with server data (after full sync)
 */
export const replaceAllRecords = async (serverRecords) => {
  const records = serverRecords.map((r) => ({ ...r, syncStatus: 'synced' }));
  await saveRecords(records);
  return records;
};

// ── Theme ─────────────────────────────────────────────────────

export const loadTheme = async () => {
  try {
    const t = await AsyncStorage.getItem(KEYS.THEME);
    return t || 'dark';
  } catch {
    return 'dark';
  }
};

export const saveTheme = async (theme) => {
  try {
    await AsyncStorage.setItem(KEYS.THEME, theme);
  } catch {}
};

// ── PIN (local device PIN, separate from server PIN) ──────────

export const loadPin = async () => {
  try {
    return await AsyncStorage.getItem(KEYS.PIN);
  } catch {
    return null;
  }
};

export const savePin = async (pin) => {
  try {
    if (pin) {
      await AsyncStorage.setItem(KEYS.PIN, pin);
    } else {
      await AsyncStorage.removeItem(KEYS.PIN);
    }
  } catch {}
};

// ── Clear all local data ──────────────────────────────────────

export const clearLocalData = async () => {
  try {
    await AsyncStorage.multiRemove([KEYS.RECORDS, KEYS.PIN]);
  } catch {}
};
