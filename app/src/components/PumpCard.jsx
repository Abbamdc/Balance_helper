import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function PumpCard({ pump, index, onChange, onRemove, colors, canRemove }) {
  const field = (label, key, placeholder, keyboardType = 'numeric') => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
        value={pump[key] !== undefined ? String(pump[key]) : ''}
        onChangeText={(v) => onChange(index, key, v)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.panel2, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: colors.accent2 }]} />
          <Text style={[styles.title, { color: colors.accent2 }]}>PUMP {index + 1}</Text>
        </View>
        {canRemove && (
          <TouchableOpacity
            onPress={() => onRemove(index)}
            style={[styles.removeBtn, { borderColor: `${colors.danger}50` }]}
          >
            <Text style={[styles.removeText, { color: colors.danger }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.grid}>
        <View style={styles.half}>{field('PUMP #', 'num', '1')}</View>
        <View style={styles.half}>{field('PRICE / LITER (₦)', 'price', '700')}</View>
        <View style={styles.half}>{field('OPENING METER', 'open', '10000')}</View>
        <View style={styles.half}>{field('CLOSING METER', 'close', '10500')}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  title: { fontWeight: '700', fontSize: 11, letterSpacing: 3 },
  removeBtn: { width: 30, height: 30, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  half: { width: '47.5%' },
  field: { gap: 5 },
  label: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15, fontWeight: '600' },
});
