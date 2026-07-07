import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import { getTheme } from '../theme/colors';
import { computeMonthlyStats } from '../utils/calculations';
import { fmt } from '../utils/formatters';
import { useToast } from '../components/ToastManager';

const buildSummaryText = (monthly) => {
  let t = `========================================\n   BALANCE HELPER — MONTHLY SUMMARY\n   Generated: ${new Date().toLocaleString()}\n========================================\n\n`;
  monthly.forEach((mo) => {
    t += `📅 ${mo.key.toUpperCase()}\n`;
    t += `----------------------------------------\n`;
    t += `  Total Liters Sold : ${fmt(mo.totalLiters)} L\n`;
    t += `  Total Amount Due  : ₦${fmt(mo.totalAmountDue)}\n`;
    t += `  Total Deposited   : ₦${fmt(mo.totalDeposited)}\n`;
    t += `  Total Overs       : +₦${fmt(mo.totalOvers)}\n`;
    t += `  Total Shorts      : -₦${fmt(mo.totalShorts)}\n`;
    t += `  Net Balance       : ${mo.netBalance >= 0 ? '+' : ''}₦${fmt(mo.netBalance)}\n\n`;
    t += `  Shift Breakdown:\n`;
    mo.shifts.forEach((r) => {
      const sl = r.shift === 'afternoon' ? 'Afternoon' : 'Morning';
      const d = r.diff || 0;
      const st = d > 0 ? `OVER ₦${fmt(d)}` : d < 0 ? `SHORT ₦${fmt(Math.abs(d))}` : 'BALANCED';
      t += `    ${r.date}  [${sl}]  Liters:${fmt(r.totalLiters || 0)}  Due:₦${fmt(r.totalAmountDue || 0)}  ${st}\n`;
    });
    t += `\n`;
  });
  t += `========================================\n`;
  return t;
};

export default function MonthlyScreen() {
  const { theme } = useAuth();
  const { records } = useRecords();
  const C = getTheme(theme === 'dark');
  const toast = useToast();
  const [openMonths, setOpenMonths] = useState({});

  const monthly = computeMonthlyStats(records);

  const toggleMonth = (key) => {
    setOpenMonths((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = async () => {
    if (!monthly.length) return toast.warn('No Records', 'No records to copy.');
    const text = buildSummaryText(monthly);
    await Clipboard.setStringAsync(text);
    toast.success('Copied!', 'Monthly summary copied to clipboard.');
  };

  const handleShare = async () => {
    if (!monthly.length) return toast.warn('No Records', 'No records to share.');
    const text = buildSummaryText(monthly);
    await Share.share({ message: text, title: 'Balance Helper — Monthly Summary' });
  };

  const s = styles(C);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>📊 MONTHLY SUMMARY</Text>
        <Text style={s.pageSub}>Totals & shift breakdown by month</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={monthly.length === 0 ? s.emptyContainer : s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {monthly.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>📊</Text>
            <Text style={s.emptyTitle}>NO DATA YET</Text>
            <Text style={s.emptyText}>Save shift records to see monthly summaries here.</Text>
          </View>
        ) : (
          <>
            {monthly.map((mo) => {
              const isOpen = !!openMonths[mo.key];
              return (
                <View key={mo.key} style={s.monthBlock}>
                  {/* Month toggle header */}
                  <TouchableOpacity
                    style={s.monthHeader}
                    onPress={() => toggleMonth(mo.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.monthTitle}>📅 {mo.key.toUpperCase()}</Text>
                    <View style={s.monthHeaderRight}>
                      <View style={s.monthBadge}>
                        <Text style={s.monthBadgeText}>{mo.shifts.length} shifts</Text>
                      </View>
                      <Text style={[s.chevron, isOpen && s.chevronOpen]}>▼</Text>
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={s.monthBody}>
                      {/* Stats grid */}
                      <View style={s.statsGrid}>
                        {[
                          { label: 'TOTAL LITERS', value: `${fmt(mo.totalLiters)} L` },
                          { label: 'AMOUNT DUE', value: `₦${fmt(mo.totalAmountDue)}` },
                          { label: 'DEPOSITED', value: `₦${fmt(mo.totalDeposited)}` },
                          { label: 'TOTAL OVERS', value: `+₦${fmt(mo.totalOvers)}`, color: C.success, cls: 'over' },
                          { label: 'TOTAL SHORTS', value: `-₦${fmt(mo.totalShorts)}`, color: C.danger, cls: 'short' },
                          {
                            label: 'NET BALANCE',
                            value: `${mo.netBalance >= 0 ? '+' : ''}₦${fmt(mo.netBalance)}`,
                            color: mo.netBalance >= 0 ? C.success : C.danger,
                          },
                        ].map(({ label, value, color }) => (
                          <View key={label} style={s.statItem}>
                            <Text style={s.statLabel}>{label}</Text>
                            <Text style={[s.statValue, color ? { color } : {}]}>{value}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Shift rows */}
                      <Text style={s.shiftBreakdownTitle}>SHIFT BREAKDOWN</Text>
                      {mo.shifts.map((r, i) => {
                        const d = r.diff || 0;
                        const dColor = d > 0 ? C.success : d < 0 ? C.danger : C.accent;
                        const dLabel = d > 0 ? `+₦${fmt(d)}` : d < 0 ? `-₦${fmt(Math.abs(d))}` : 'BALANCED';
                        return (
                          <View key={i} style={s.shiftRow}>
                            <View style={s.shiftRowLeft}>
                              <View style={[s.shiftDot, { backgroundColor: r.shift === 'morning' ? C.accent : C.accent2 }]} />
                              <View>
                                <Text style={s.shiftDate}>{r.date}</Text>
                                <Text style={[s.shiftName, { color: r.shift === 'morning' ? C.accent : C.accent2 }]}>
                                  {r.shift === 'morning' ? 'Morning' : 'Afternoon'}
                                </Text>
                              </View>
                            </View>
                            <View style={s.shiftRowRight}>
                              <Text style={s.shiftLiters}>{fmt(r.totalLiters || 0)} L</Text>
                              <Text style={[s.shiftDiff, { color: dColor }]}>{dLabel}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom action bar */}
      {monthly.length > 0 && (
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.bottomBtn} onPress={handleCopy} activeOpacity={0.8}>
            <Text style={s.bottomBtnText}>📋 COPY SUMMARY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.bottomBtn, s.shareBtn]} onPress={handleShare} activeOpacity={0.8}>
            <Text style={[s.bottomBtnText, { color: C.accent3 }]}>📤 SHARE</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  pageHeader: {
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  pageTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 18, letterSpacing: 3, color: C.text },
  pageSub: { fontFamily: 'ShareTechMono_400Regular', fontSize: 10, color: C.muted, marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 16, letterSpacing: 3, color: C.muted, marginBottom: 8 },
  emptyText: { fontFamily: 'ShareTechMono_400Regular', fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 20 },

  monthBlock: { marginBottom: 14 },
  monthHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,215,0,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)', borderRadius: 10,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    padding: 13,
  },
  monthTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, letterSpacing: 3, color: C.gold },
  monthHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monthBadge: { backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  monthBadgeText: { fontFamily: 'ShareTechMono_400Regular', fontSize: 10, color: C.gold },
  chevron: { color: C.gold, fontSize: 10 },
  chevronOpen: { transform: [{ rotate: '180deg' }] },

  monthBody: {
    backgroundColor: C.panel2, borderWidth: 1, borderTopWidth: 0,
    borderColor: 'rgba(255,215,0,0.15)', borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10, padding: 14,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statItem: {
    width: '47%', backgroundColor: `${C.bg}99`, borderRadius: 8,
    padding: 12, alignItems: 'center',
  },
  statLabel: { fontFamily: 'ShareTechMono_400Regular', fontSize: 8, letterSpacing: 1, color: C.muted, marginBottom: 5 },
  statValue: { fontFamily: 'ShareTechMono_400Regular', fontSize: 13, color: C.gold, fontWeight: '700' },

  shiftBreakdownTitle: {
    fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 2,
    color: C.muted, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 6,
  },
  shiftRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: `${C.border}80`,
  },
  shiftRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shiftDot: { width: 8, height: 8, borderRadius: 4 },
  shiftDate: { fontFamily: 'ShareTechMono_400Regular', fontSize: 12, color: C.text },
  shiftName: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 1, marginTop: 2 },
  shiftRowRight: { alignItems: 'flex-end' },
  shiftLiters: { fontFamily: 'ShareTechMono_400Regular', fontSize: 11, color: C.muted },
  shiftDiff: { fontFamily: 'ShareTechMono_400Regular', fontSize: 13, fontWeight: '700' },

  bottomBar: {
    flexDirection: 'row', gap: 10, padding: 12,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.panel,
  },
  bottomBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    borderColor: C.border, alignItems: 'center', backgroundColor: C.panel2,
  },
  shareBtn: { borderColor: `${C.accent3}66` },
  bottomBtnText: {
    fontFamily: 'Rajdhani_700Bold', fontSize: 13, letterSpacing: 2, color: C.text,
  },
});
