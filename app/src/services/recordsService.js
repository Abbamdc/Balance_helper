import api from './api';

/**
 * Fetch all records from server
 */
export const fetchRecords = async (params = {}) => {
  const { data } = await api.get('/records', { params });
  return data.data.records;
};

/**
 * Create a new record on server
 */
export const createRecord = async (record) => {
  const { data } = await api.post('/records', record);
  return data.data.record;
};

/**
 * Update a record on server
 */
export const updateRecord = async (id, record) => {
  const { data } = await api.put(`/records/${id}`, record);
  return data.data.record;
};

/**
 * Delete a record on server
 */
export const deleteRecord = async (id) => {
  const { data } = await api.delete(`/records/${id}`);
  return data;
};

/**
 * Bulk sync — send all local pending records to server.
 * Server returns the full updated list.
 * @param {Array} localRecords - all local records
 * @returns {{ records: Array, stats: object }}
 */
export const syncToServer = async (localRecords) => {
  const pending = localRecords.filter((r) => r.syncStatus !== 'synced');
  if (pending.length === 0) {
    // Still fetch latest from server to catch deletions/other-device changes
    const records = await fetchRecords();
    return { records, stats: { created: 0, skipped: 0, errors: [] } };
  }

  const { data } = await api.post('/records/sync', { records: pending });
  return { records: data.data.records, stats: data.data.stats };
};

/**
 * Get monthly summary from server
 */
export const fetchMonthlySummary = async (year) => {
  const params = year ? { year } : {};
  const { data } = await api.get('/records/monthly', { params });
  return data.data.monthly;
};
