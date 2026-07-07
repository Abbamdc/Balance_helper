import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import { getTheme } from '../theme/colors';
import { fmt } from '../utils/formatters';
import { useToast } from '../components/ToastManager';

const buildTextReport = (r) => {
  const sn = r.shift === 'morning' ? 'MORNING' : 'AFTERNOON';
  let t = `============================\n  BALANCE HELPER — SHIFT REPORT\n  Date  : ${r.date}\n  Shift : ${sn}\n============================\n\n`;
  r.pumps.forEach((p) => {
    t += `--- Pump ${p.num} ---\n  Opening Meter : ${fmt(p.open)}\n  Closing Meter : ${fmt(p.close)}\n  Price/Liter   : ₦${fmt(p.price)}\n  Total Liters  : ${fmt(p.liters)} L\n  Amount        : ₦${fmt(p.amount)}\n\n`;
  });
  t += `--- SUMMARY ---\n  Total Liters Sold   : ${fmt(r.totalLiters)} L\n  Amount to Deposit   : ₦${fmt(r.totalAmountDue)}\n  POS                 : ₦${fmt(r.pos)}\n`;
  r.deposits.forEach((d) => { t += `  ${d.label.padEnd(20)}: ₦${fmt(d.value)}\n`; });
  t += `  Total Deposited     : ₦${fmt(r.totalDeposited)}\n\n`;
  t += r.diff > 0
    ? `  STATUS: OVER by ₦${fmt(r.diff)}\n`
    : r.diff < 0
      ? `  STATUS: SHORT by ₦${fmt(Math.abs(r.diff))}\n`
      : `  STATUS: BALANCED ✓\n`;
  t += `============================\n`;
  return t;
};

export default function ResultScreen({ navigation, route }) {
  const { result } = route.params;
  const { theme } = useAuth();
  const { saveRecord } = useRecords();
  const C = getTheme(theme === 'dark');
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const statusType = result.diff > 0 ? 'over' : result.diff < 0 ? 'short' : 'balanced';
  const statusColor = { over: C.success, short: C.danger, balanced: C.accent }[statusType];
  const statusLabel = { over: `OVER ₦${fmt(result.diff)}`, short: `SHORT ₦${fmt(Math.abs(result.diff))}`, balanced: 'BALANCED ✓' }[statusType];
  const statusBg = { over: `${C.success}14`, short: `${C.danger}14`, balanced: `${C.accent}14` }[statusType];
  const statusBorder = { over: `${C.success}44`, short: `${C.danger}44`, balanced: `${C.accent}44` }[statusType];

  const handleSave = async () => {
    if (saved) return toast.warn('Already Saved', 'This record has already been saved.');
    setSaving(true);
    try {
      await saveRecord(result);
      setSaved(true);
      toast.success('Record Saved', `${result.shift === 'morning' ? 'Morning' : 'Afternoon'} shift for ${result.date} saved.`);
    } catch (err) {
      const msg = err?.message || 'Could not save record.';
      toast.error('Save Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(buildTextReport(result));
    toast.success('Copied!', 'Shift report copied to clipboard.');
  };

  const s = styles(C);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← BACK</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>SHIFT RESULTS</Text>
          <View style={s.shiftBadgeRow}>
            <Text style={s.dateText}>{result.date}</Text>
            <View style={[s.shiftBadge, result.shift === 'morning' ? s.badgeMorning : s.badgeAfternoon]}>
              <Text style={[s.shiftBadgeText, { color: result.shift === 'morning' ? C.accent : C.accent2 }]}>
                {result.shift === 'morning' ? '🌅 MORNING' : '🌇 AFTERNOON'}
              </Text>
            </View>
          </View>
        </View>

        {/* Pump breakdown */}
        <View style={s.card}>
          <View style={s.cardBar} />
          <Text style={s.cardTitle}>PUMP BREAKDOWN</Text>
          {result.pumps.map((p) => (
            <View key={p.num} style={s.pumpResult}>
              <Text style={s.pumpResultTitle}>PUMP {p.num}</Text>
              <View style={s.resultGrid}>
                {[
                  { label: 'OPENING', value: fmt(p.open) },
                  { label: 'CLOSING', value: fmt(p.close) },
                  { label: 'LITERS', value: `${fmt(p.liters)} L` },
                  { label: 'AMOUNT', value: `₦${fmt(p.amount)}` },
                ].map(({ label, value }) => (
                  <View key={label} style={s.resultItem}>
                    <Text style={s.rLabel}>{label}</Text>
                    <Text style={s.rValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={s.card}>
          <View style={[s.cardBar, { backgroundColor: C.accent3 }]} />
          <Text style={[s.cardTitle, { color: C.accent3, borderLeftColor: C.accent3 }]}>SUMMARY</Text>
          <View style={s.summaryGrid}>
            {[
              { label: 'TOTAL LITERS', value: `${fmt(result.totalLiters)} L` },
              { label: 'AMOUNT DUE', value: `₦${fmt(result.totalAmountDue)}` },
              { label: 'TOTAL DEPOSITED', value: `₦${fmt(result.totalDeposited)}` },
            ].map(({ label, value }) => (
              <View key={label} style={s.summaryItem}>
                <Text style={s.sLabel}>{label}</Text>
                <Text style={s.sValue}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Deposit breakdown */}
          {(result.pos > 0 || result.deposits.length > 0) && (
            <View style={s.depositBreakdown}>
              {result.pos > 0 && (
                <View style={s.depositLine}>
                  <Text style={s.depositLineLabel}>POS</Text>
                  <Text style={s.depositLineValue}>₦{fmt(result.pos)}</Text>
                </View>
              )}
              {result.deposits.map((d, i) => (
                <View key={i} style={s.depositLine}>
                  <Text style={s.depositLineLabel}>{d.label}</Text>
                  <Text style={s.depositLineValue}>₦{fmt(d.value)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Balance indicator */}
        <View style={[s.balanceCard, { backgroundColor: statusBg, borderColor: statusBorder }]}>
          <View>
            <Text style={[s.balanceLabel, { color: statusColor }]}>BALANCE STATUS</Text>
            <Text style={[s.balanceAmount, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: `${statusColor}44` }]}>
            <Text style={[s.statusBadgeText, { color: statusColor }]}>
              {statusType.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.saveBtn, saved && s.savedBtn]}
            onPress={handleSave}
            disabled={saving || saved}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={saved ? [C.muted, C.muted] : ['#006633', C.accent3]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.btnGradient}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>{saved ? '✓ SAVED' : '💾 SAVE'}</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.copyBtn} onPress={handleCopy} activeOpacity={0.85}>
            <LinearGradient
              colors={['#1a3a5c', '#0077aa']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.btnGradient}
            >
              <Text style={s.btnText}>📋 COPY</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 30 },

  backBtn: { marginBottom: 12, alignSelf: 'flex-start' },
  backText: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 13, color: C.muted, letterSpacing: 2 },

  pageHeader: { marginBottom: 16 },
  pageTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 22, letterSpacing: 4, color: C.text, marginBottom: 8 },
  shiftBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateText: { fontFamily: 'ShareTechMono_400Regular', fontSize: 13, color: C.muted },
  shiftBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeMorning: { backgroundColor: 'rgba(0,212,255,0.1)', borderColor: 'rgba(0,212,255,0.3)' },
  badgeAfternoon: { backgroundColor: 'rgba(255,107,53,0.1)', borderColor: 'rgba(255,107,53,0.3)' },
  shiftBadgeText: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 2 },

  card: {
    backgroundColor: C.panel, borderRadius: 12, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  cardBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: C.accent, opacity: 0.5 },
  cardTitle: {
    fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 3,
    color: C.accent, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: C.accent, paddingLeft: 8,
  },

  pumpResult: {
    backgroundColor: C.panel2, borderRadius: 10, borderWidth: 1,
    borderColor: C.border, padding: 12, marginBottom: 10,
  },
  pumpResultTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 3, color: C.accent2, marginBottom: 10 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resultItem: { flex: 1, minWidth: '45%', backgroundColor: `${C.bg}99`, borderRadius: 8, padding: 10 },
  rLabel: { fontFamily: 'ShareTechMono_400Regular', fontSize: 9, letterSpacing: 2, color: C.muted, marginBottom: 4 },
  rValue: { fontFamily: 'ShareTechMono_400Regular', fontSize: 14, color: C.text, fontWeight: '600' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  summaryItem: {
    flex: 1, minWidth: '45%', backgroundColor: C.panel2, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, padding: 14, alignItems: 'center',
  },
  sLabel: { fontFamily: 'ShareTechMono_400Regular', fontSize: 8, letterSpacing: 2, color: C.muted, marginBottom: 6 },
  sValue: { fontFamily: 'ShareTechMono_400Regular', fontSize: 16, color: C.gold, fontWeight: '700' },

  depositBreakdown: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  depositLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  depositLineLabel: { fontFamily: 'ShareTechMono_400Regular', fontSize: 11, color: C.muted },
  depositLineValue: { fontFamily: 'ShareTechMono_400Regular', fontSize: 11, color: C.text },

  balanceCard: {
    borderRadius: 12, padding: 18, borderWidth: 1, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  balanceLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 3, marginBottom: 6 },
  balanceAmount: { fontFamily: 'ShareTechMono_400Regular', fontSize: 22, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusBadgeText: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 2 },

  actionRow: { flexDirection: 'row', gap: 12 },
  saveBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  savedBtn: { opacity: 0.7 },
  copyBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  btnGradient: { paddingVertical: 16, alignItems: 'center' },
  btnText: { fontFamily: 'Rajdhani_700Bold', fontSize: 15, letterSpacing: 3, color: '#fff' },
});
