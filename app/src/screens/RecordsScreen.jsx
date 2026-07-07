import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import { getTheme } from '../theme/colors';
import { fmt } from '../utils/formatters';
import { useToast } from '../components/ToastManager';

const statusColors = (C) => ({
  synced: C.success,
  pending_sync: C.gold,
  error: C.danger,
});

export default function RecordsScreen() {
  const { theme, user } = useAuth();
  const { records, syncRecords, deleteRecord, isSyncing, lastSynced } = useRecords();
  const C = getTheme(theme === 'dark');
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [pinModal, setPinModal] = useState(null); // record to delete
  const [pinInput, setPinInput] = useState('');

  // Pull to refresh → sync with cloud
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncRecords();
    } catch {
      toast.warn('Sync Failed', 'Could not sync with cloud. Records saved locally.');
    } finally {
      setRefreshing(false);
    }
  }, [syncRecords, toast]);

  // Delete flow
  const confirmDelete = (record) => {
    if (user?.hasPin) {
      setPinModal(record);
    } else {
      Alert.alert(
        'Delete Record',
        `Delete ${record.shift} shift for ${record.date}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => doDelete(record) },
        ]
      );
    }
  };

  const doDelete = async (record) => {
    try {
      await deleteRecord(record.localId || record._id);
      toast.success('Deleted', `${record.shift} shift for ${record.date} removed.`);
    } catch {
      toast.error('Delete Failed', 'Could not delete record.');
    }
  };

  // Group records by month
  const grouped = groupByMonth(records);
  const sc = statusColors(C);
  const s = styles(C);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>💾 SAVED RECORDS</Text>
        <View style={s.syncRow}>
          {isSyncing && <Text style={[s.syncText, { color: C.gold }]}>⟳ Syncing...</Text>}
          {!isSyncing && lastSynced && (
            <Text style={s.syncText}>✓ Synced {timeAgo(lastSynced)}</Text>
          )}
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={records.length === 0 ? s.emptyContainer : s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
      >
        {records.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyTitle}>NO RECORDS YET</Text>
            <Text style={s.emptyText}>Calculate a shift and tap Save to store records here.</Text>
          </View>
        ) : (
          grouped.map((month) => (
            <View key={month.key} style={s.monthBlock}>
              {/* Month header */}
              <View style={s.monthHeader}>
                <Text style={s.monthTitle}>📅 {month.key.toUpperCase()}</Text>
                <View style={s.monthBadge}>
                  <Text style={s.monthBadgeText}>{month.records.length} shifts</Text>
                </View>
              </View>

              {/* Month stats */}
              <View style={s.monthStats}>
                {[
                  { label: 'LITERS', value: `${fmt(month.totalLiters)} L` },
                  { label: 'AMOUNT DUE', value: `₦${fmt(month.totalAmountDue)}` },
                  { label: 'NET', value: `${month.net >= 0 ? '+' : ''}₦${fmt(month.net)}`, color: month.net >= 0 ? C.success : C.danger },
                ].map(({ label, value, color }) => (
                  <View key={label} style={s.monthStat}>
                    <Text style={s.msLabel}>{label}</Text>
                    <Text style={[s.msValue, color ? { color } : {}]}>{value}</Text>
                  </View>
                ))}
              </View>

              {/* Shift records */}
              {month.records.map((rec) => {
                const diff = rec.diff || 0;
                const diffColor = diff > 0 ? C.success : diff < 0 ? C.danger : C.accent;
                const diffLabel = diff > 0 ? `+₦${fmt(diff)}` : diff < 0 ? `-₦${fmt(Math.abs(diff))}` : '₦0';
                const isExpanded = expandedId === rec.localId;
                const syncColor = sc[rec.syncStatus] || C.muted;

                return (
                  <TouchableOpacity
                    key={rec.localId}
                    style={s.recordCard}
                    onPress={() => setExpandedId(isExpanded ? null : rec.localId)}
                    activeOpacity={0.85}
                  >
                    <View style={s.recordTop}>
                      <View style={s.recordLeft}>
                        <View style={[
                          s.shiftDot,
                          { backgroundColor: rec.shift === 'morning' ? C.accent : C.accent2 },
                        ]} />
                        <View>
                          <Text style={s.recordDate}>{rec.date}</Text>
                          <Text style={[s.recordShift, { color: rec.shift === 'morning' ? C.accent : C.accent2 }]}>
                            {rec.shift === 'morning' ? '🌅 Morning' : '🌇 Afternoon'}
                          </Text>
                        </View>
                      </View>
                      <View style={s.recordRight}>
                        <Text style={[s.recordDiff, { color: diffColor }]}>{diffLabel}</Text>
                        <View style={[s.syncDot, { backgroundColor: syncColor }]} />
                      </View>
                    </View>

                    {isExpanded && (
                      <View style={s.expandedBody}>
                        <View style={s.expandedGrid}>
                          {[
                            { label: 'LITERS', value: `${fmt(rec.totalLiters)} L` },
                            { label: 'AMOUNT DUE', value: `₦${fmt(rec.totalAmountDue)}` },
                            { label: 'DEPOSITED', value: `₦${fmt(rec.totalDeposited)}` },
                          ].map(({ label, value }) => (
                            <View key={label} style={s.expandedItem}>
                              <Text style={s.exLabel}>{label}</Text>
                              <Text style={s.exValue}>{value}</Text>
                            </View>
                          ))}
                        </View>
                        <TouchableOpacity
                          style={s.deleteBtn}
                          onPress={() => confirmDelete(rec)}
                          activeOpacity={0.8}
                        >
                          <Text style={s.deleteBtnText}>🗑  DELETE RECORD</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function groupByMonth(records) {
  const map = {};
  records.forEach((r) => {
    const key = r.date ? r.date.slice(0, 7) : 'unknown';
    if (!map[key]) map[key] = { key, records: [], totalLiters: 0, totalAmountDue: 0, net: 0 };
    map[key].records.push(r);
    map[key].totalLiters += r.totalLiters || 0;
    map[key].totalAmountDue += r.totalAmountDue || 0;
    map[key].net += r.diff || 0;
  });
  return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

const styles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  pageHeader: {
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  pageTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 18, letterSpacing: 3, color: C.text },
  syncRow: { marginTop: 4 },
  syncText: { fontFamily: 'ShareTechMono_400Regular', fontSize: 10, color: C.muted },

  scroll: { flex: 1 },
  scrollContent: { padding: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 16, letterSpacing: 3, color: C.muted, marginBottom: 8 },
  emptyText: { fontFamily: 'ShareTechMono_400Regular', fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 20 },

  monthBlock: { marginBottom: 16 },
  monthHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,215,0,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)', borderRadius: 10, padding: 12, marginBottom: 2,
  },
  monthTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, letterSpacing: 3, color: C.gold },
  monthBadge: { backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  monthBadgeText: { fontFamily: 'ShareTechMono_400Regular', fontSize: 10, color: C.gold },
  monthStats: { flexDirection: 'row', gap: 6, marginBottom: 8, marginTop: 6 },
  monthStat: {
    flex: 1, backgroundColor: C.panel, borderRadius: 8, borderWidth: 1,
    borderColor: C.border, padding: 10, alignItems: 'center',
  },
  msLabel: { fontFamily: 'ShareTechMono_400Regular', fontSize: 8, letterSpacing: 1, color: C.muted, marginBottom: 4 },
  msValue: { fontFamily: 'ShareTechMono_400Regular', fontSize: 12, color: C.gold, fontWeight: '700' },

  recordCard: {
    backgroundColor: C.panel, borderRadius: 10, borderWidth: 1,
    borderColor: C.border, marginBottom: 6, padding: 12, overflow: 'hidden',
  },
  recordTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shiftDot: { width: 8, height: 8, borderRadius: 4 },
  recordDate: { fontFamily: 'ShareTechMono_400Regular', fontSize: 13, color: C.text },
  recordShift: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, letterSpacing: 1, marginTop: 2 },
  recordRight: { alignItems: 'flex-end', gap: 6 },
  recordDiff: { fontFamily: 'ShareTechMono_400Regular', fontSize: 14, fontWeight: '700' },
  syncDot: { width: 6, height: 6, borderRadius: 3 },

  expandedBody: { marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  expandedGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  expandedItem: {
    flex: 1, backgroundColor: C.panel2, borderRadius: 8,
    borderWidth: 1, borderColor: C.border, padding: 10, alignItems: 'center',
  },
  exLabel: { fontFamily: 'ShareTechMono_400Regular', fontSize: 8, letterSpacing: 1, color: C.muted, marginBottom: 4 },
  exValue: { fontFamily: 'ShareTechMono_400Regular', fontSize: 12, color: C.text },
  deleteBtn: {
    backgroundColor: 'rgba(255,71,87,0.1)', borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.3)', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  deleteBtnText: { fontFamily: 'Rajdhani_700Bold', fontSize: 13, letterSpacing: 2, color: C.danger },
});
