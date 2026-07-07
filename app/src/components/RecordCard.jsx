import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { fmtDate, fmtNaira, fmtLiters } from '../utils/formatters';

export default function RecordCard({ record, onDelete, colors }) {
  const [expanded, setExpanded] = useState(false);

  const diff = record.diff || 0;
  const isOver = diff > 0;
  const isShort = diff < 0;
  const statusColor = isOver ? colors.success : isShort ? colors.danger : colors.accent;
  const statusText = isOver
    ? `OVER ₦${Math.abs(diff).toLocaleString()}`
    : isShort
    ? `SHORT ₦${Math.abs(diff).toLocaleString()}`
    : 'BALANCED';

  const shiftColor = record.shift === 'morning' ? colors.accent : colors.accent2;

  const syncIcon = record.syncStatus === 'synced' ? '☁️' : '⟳';

  return (
    <TouchableOpacity
      onPress={() => setExpanded((e) => !e)}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.border }]}
    >
      {/* Top accent line */}
      <View style={[styles.accentLine, { backgroundColor: shiftColor }]} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.date, { color: colors.text }]}>{fmtDate(record.date)}</Text>
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: `${shiftColor}20`, borderColor: `${shiftColor}40` }]}>
              <Text style={[styles.tagText, { color: shiftColor }]}>
                {record.shift === 'morning' ? '🌅 MORNING' : '🌇 AFTERNOON'}
              </Text>
            </View>
            <Text style={[styles.syncBadge, { color: colors.muted }]}>{syncIcon}</Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={[styles.status, { color: statusColor }]}>{statusText}</Text>
          <TouchableOpacity
            onPress={() => onDelete(record.localId)}
            style={[styles.deleteBtn, { borderColor: `${colors.danger}40` }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ color: colors.danger, fontSize: 13 }}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {expanded && (
        <View style={[styles.details, { borderTopColor: colors.border }]}>
          <View style={styles.statsRow}>
            <StatItem label="LITERS SOLD" value={fmtLiters(record.totalLiters)} color={colors.gold} muted={colors.muted} />
            <StatItem label="AMOUNT DUE" value={fmtNaira(record.totalAmountDue)} color={colors.text} muted={colors.muted} />
            <StatItem label="DEPOSITED" value={fmtNaira(record.totalDeposited)} color={colors.text} muted={colors.muted} />
          </View>

          {(record.pumps || []).map((p, i) => (
            <View key={i} style={[styles.pumpRow, { borderColor: colors.border }]}>
              <Text style={[styles.pumpLabel, { color: colors.accent2 }]}>PUMP {p.num}</Text>
              <Text style={[styles.pumpVal, { color: colors.muted }]}>
                {p.liters?.toLocaleString()} L @ ₦{p.price?.toLocaleString()} = ₦{p.amount?.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.chevron, { color: colors.muted }]}>
        {expanded ? '▲' : '▼'}
      </Text>
    </TouchableOpacity>
  );
}

const StatItem = ({ label, value, color, muted }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statLabel, { color: muted }]}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  accentLine: { height: 2, width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14 },
  date: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tag: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  syncBadge: { fontSize: 12 },
  right: { alignItems: 'flex-end', gap: 8 },
  status: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  deleteBtn: { borderWidth: 1, borderRadius: 6, padding: 5 },
  details: { borderTopWidth: 1, padding: 14, paddingTop: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 8, letterSpacing: 1.5, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 12, fontWeight: '700' },
  pumpRow: { borderTopWidth: 1, paddingTop: 8, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' },
  pumpLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  pumpVal: { fontSize: 11 },
  chevron: { textAlign: 'center', paddingBottom: 8, fontSize: 10 },
});
