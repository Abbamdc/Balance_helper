import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fmtNaira } from '../utils/formatters';

export default function BalanceIndicator({ diff, colors }) {
  const isOver = diff > 0;
  const isShort = diff < 0;
  const isBalanced = diff === 0;

  const color = isOver ? colors.success : isShort ? colors.danger : colors.accent;
  const label = isOver ? 'OVER' : isShort ? 'SHORT' : 'BALANCED';
  const icon = isOver ? '📈' : isShort ? '📉' : '✅';
  const amountText = isBalanced
    ? 'PERFECT BALANCE'
    : `${isOver ? '+' : '-'}${fmtNaira(Math.abs(diff))}`;

  return (
    <View style={[styles.container, { backgroundColor: `${color}12`, borderColor: `${color}40` }]}>
      <View style={styles.left}>
        <Text style={styles.icon}>{icon}</Text>
        <View>
          <Text style={[styles.label, { color }]}>STATUS</Text>
          <Text style={[styles.badge, { color, backgroundColor: `${color}20` }]}>{label}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { color }]}>{amountText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12, borderWidth: 1, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 28 },
  label: { fontSize: 9, letterSpacing: 3, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  badge: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, overflow: 'hidden',
    textTransform: 'uppercase',
  },
  amount: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
