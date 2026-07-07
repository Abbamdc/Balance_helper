import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function ShiftSelector({ value, onChange, colors }) {
  const isMorning = value === 'morning';
  const isAfternoon = value === 'afternoon';

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[
          styles.btn,
          { borderColor: colors.border, backgroundColor: colors.panel2 },
          isMorning && { borderColor: colors.accent, backgroundColor: `${colors.accent}15` },
        ]}
        onPress={() => onChange('morning')}
        activeOpacity={0.8}
      >
        <Text style={styles.emoji}>🌅</Text>
        <Text style={[styles.label, { color: isMorning ? colors.accent : colors.muted }]}>
          MORNING
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.btn,
          { borderColor: colors.border, backgroundColor: colors.panel2 },
          isAfternoon && { borderColor: colors.accent2, backgroundColor: `${colors.accent2}15` },
        ]}
        onPress={() => onChange('afternoon')}
        activeOpacity={0.8}
      >
        <Text style={styles.emoji}>🌇</Text>
        <Text style={[styles.label, { color: isAfternoon ? colors.accent2 : colors.muted }]}>
          AFTERNOON
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 13, borderRadius: 10, borderWidth: 2,
  },
  emoji: { fontSize: 16 },
  label: { fontWeight: '700', fontSize: 13, letterSpacing: 2 },
});
