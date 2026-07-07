import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function DepositRow({ deposit, index, onChange, onRemove, colors }) {
  return (
    <View style={styles.row}>
      <View style={[styles.field, { flex: 1.2 }]}>
        <Text style={[styles.label, { color: colors.muted }]}>LABEL</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.panel2, borderColor: colors.border, color: colors.text }]}
          value={deposit.label}
          onChangeText={(v) => onChange(index, 'label', v)}
          placeholder="e.g. Cash 1"
          placeholderTextColor={colors.muted}
        />
      </View>
      <View style={[styles.field, { flex: 1 }]}>
        <Text style={[styles.label, { color: colors.muted }]}>AMOUNT (₦)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.panel2, borderColor: colors.border, color: colors.text }]}
          value={deposit.value !== undefined ? String(deposit.value) : ''}
          onChangeText={(v) => onChange(index, 'value', v)}
          placeholder="0"
          placeholderTextColor={colors.muted}
          keyboardType="numeric"
        />
      </View>
      <TouchableOpacity
        onPress={() => onRemove(index)}
        style={[styles.removeBtn, { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}40` }]}
      >
        <Text style={{ color: colors.danger, fontSize: 14 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  field: { gap: 5 },
  label: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, fontWeight: '600' },
  removeBtn: {
    width: 38, height: 38, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 1,
  },
});
