import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { getTheme } from '../theme/colors';
import { calculateShift } from '../utils/calculations';
import { formatDate } from '../utils/formatters';
import { generateId } from '../utils/formatters';
import { useToast } from '../components/ToastManager';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const emptyPump = (num) => ({ id: generateId(), num: String(num), open: '', close: '', price: '' });

export default function HomeScreen({ navigation }) {
  const { theme } = useAuth();
  const C = getTheme(theme === 'dark');
  const toast = useToast();

  const today = new Date();
  const [date, setDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [shift, setShift] = useState('morning');
  const [pumps, setPumps] = useState([emptyPump(1)]);
  const [pos, setPos] = useState('');
  const [deposits, setDeposits] = useState([]);

  // ── Date picker ───────────────────────────────────────────────
  const onDateChange = (event, selected) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setDate(selected);
  };

  // ── Pumps ─────────────────────────────────────────────────────
  const addPump = () => {
    if (pumps.length >= 10) return toast.warn('Max Pumps', 'Maximum 10 pumps allowed.');
    setPumps([...pumps, emptyPump(pumps.length + 1)]);
  };

  const removePump = (id) => {
    if (pumps.length === 1) return toast.warn('Min Pumps', 'At least one pump is required.');
    setPumps(pumps.filter((p) => p.id !== id));
  };

  const updatePump = (id, field, val) => {
    setPumps(pumps.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  // ── Deposits ──────────────────────────────────────────────────
  const addDeposit = (value = '') => {
    setDeposits([...deposits, { id: generateId(), label: `Cash ${deposits.length + 1}`, value: value ? String(value) : '' }]);
  };

  const quickAdd = (amount) => {
    setDeposits([...deposits, { id: generateId(), label: `Cash ${deposits.length + 1}`, value: String(amount) }]);
  };

  const removeDeposit = (id) => setDeposits(deposits.filter((d) => d.id !== id));

  const updateDeposit = (id, field, val) => {
    setDeposits(deposits.map((d) => (d.id === id ? { ...d, [field]: val } : d)));
  };

  // ── Calculate ─────────────────────────────────────────────────
  const handleCalculate = useCallback(() => {
    const { valid, errors, result } = calculateShift({
      date: formatDate(date),
      shift,
      pumps,
      pos,
      deposits,
      localId: generateId(),
    });

    if (!valid) {
      toast.warn('Check Your Inputs', errors[0]);
      return;
    }

    navigation.navigate('Result', { result });
  }, [date, shift, pumps, pos, deposits, navigation, toast]);

  // ── Clear all ─────────────────────────────────────────────────
  const handleClear = () => {
    setDate(new Date());
    setShift('morning');
    setPumps([emptyPump(1)]);
    setPos('');
    setDeposits([]);
  };

  const s = styles(C);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.headerIcon}>⛽</Text>
          <Text style={s.headerTitle}>BALANCE HELPER</Text>
          <Text style={s.headerSub}>FUEL STATION SHIFT CALCULATOR</Text>
          <View style={s.headerLine} />
        </View>

        {/* ── Shift Details Card ── */}
        <View style={s.card}>
          <View style={s.cardBar} />
          <Text style={s.cardTitle}>SHIFT DETAILS</Text>

          {/* Date */}
          <Text style={s.label}>DATE</Text>
          <TouchableOpacity
            style={s.dateBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={s.dateBtnText}>{formatDate(date)}</Text>
            <Text style={{ fontSize: 18 }}>📅</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Shift selector */}
          <Text style={[s.label, { marginTop: 14 }]}>SHIFT</Text>
          <View style={s.shiftRow}>
            <TouchableOpacity
              style={[s.shiftBtn, shift === 'morning' && s.shiftBtnMorning]}
              onPress={() => setShift('morning')}
              activeOpacity={0.8}
            >
              <Text style={[s.shiftBtnText, shift === 'morning' && { color: C.accent }]}>🌅  MORNING</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.shiftBtn, shift === 'afternoon' && s.shiftBtnAfternoon]}
              onPress={() => setShift('afternoon')}
              activeOpacity={0.8}
            >
              <Text style={[s.shiftBtnText, shift === 'afternoon' && { color: C.accent2 }]}>🌇  AFTERNOON</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Pump Data Card ── */}
        <View style={s.card}>
          <View style={s.cardBar} />
          <Text style={s.cardTitle}>PUMP DATA</Text>

          {pumps.map((pump, idx) => (
            <View key={pump.id} style={s.pumpCard}>
              <View style={s.pumpHeader}>
                <View style={s.pumpDot} />
                <Text style={s.pumpLabel}>PUMP {idx + 1}</Text>
                {pumps.length > 1 && (
                  <TouchableOpacity onPress={() => removePump(pump.id)} style={s.pumpRemove}>
                    <Text style={{ color: C.danger, fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={s.pumpFieldRow}>
                <View style={[s.field, { flex: 1, marginRight: 8 }]}>
                  <Text style={s.label}>PUMP #</Text>
                  <TextInput
                    style={s.input}
                    value={pump.num}
                    onChangeText={(v) => updatePump(pump.id, 'num', v)}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={C.muted}
                  />
                </View>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.label}>PRICE/L (₦)</Text>
                  <TextInput
                    style={s.input}
                    value={pump.price}
                    onChangeText={(v) => updatePump(pump.id, 'price', v)}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={C.muted}
                  />
                </View>
              </View>
              <View style={s.pumpFieldRow}>
                <View style={[s.field, { flex: 1, marginRight: 8 }]}>
                  <Text style={s.label}>OPENING METER</Text>
                  <TextInput
                    style={s.input}
                    value={pump.open}
                    onChangeText={(v) => updatePump(pump.id, 'open', v)}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={C.muted}
                  />
                </View>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.label}>CLOSING METER</Text>
                  <TextInput
                    style={s.input}
                    value={pump.close}
                    onChangeText={(v) => updatePump(pump.id, 'close', v)}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={C.muted}
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={s.addBtn} onPress={addPump} activeOpacity={0.8}>
            <Text style={{ color: C.accent, fontSize: 15, marginRight: 6 }}>＋</Text>
            <Text style={s.addBtnText}>ADD PUMP</Text>
          </TouchableOpacity>
        </View>

        {/* ── Deposits Card ── */}
        <View style={s.card}>
          <View style={s.cardBar} />
          <Text style={s.cardTitle}>DEPOSITS</Text>

          {/* POS */}
          <View style={s.field}>
            <Text style={s.label}>POS AMOUNT (₦)</Text>
            <TextInput
              style={s.input}
              value={pos}
              onChangeText={setPos}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={C.muted}
            />
          </View>

          {/* Quick Add */}
          <Text style={[s.label, { marginTop: 4, marginBottom: 8 }]}>QUICK ADD CASH</Text>
          <View style={s.quickRow}>
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={s.quickBtn}
                onPress={() => quickAdd(amt)}
                activeOpacity={0.7}
              >
                <Text style={s.quickBtnText}>₦{amt >= 1000 ? `${amt / 1000}k` : amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom deposits */}
          {deposits.map((d) => (
            <View key={d.id} style={s.depositRow}>
              <View style={[s.field, { flex: 1.2, marginRight: 8 }]}>
                <Text style={s.label}>LABEL</Text>
                <TextInput
                  style={s.input}
                  value={d.label}
                  onChangeText={(v) => updateDeposit(d.id, 'label', v)}
                  placeholder="Cash 1"
                  placeholderTextColor={C.muted}
                />
              </View>
              <View style={[s.field, { flex: 1, marginRight: 8 }]}>
                <Text style={s.label}>AMOUNT (₦)</Text>
                <TextInput
                  style={s.input}
                  value={d.value}
                  onChangeText={(v) => updateDeposit(d.id, 'value', v)}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={C.muted}
                />
              </View>
              <TouchableOpacity
                style={s.removeDepBtn}
                onPress={() => removeDeposit(d.id)}
              >
                <Text style={{ color: C.danger, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={s.addBtn} onPress={() => addDeposit()} activeOpacity={0.8}>
            <Text style={{ color: C.accent, fontSize: 15, marginRight: 6 }}>＋</Text>
            <Text style={s.addBtnText}>ADD DEPOSIT</Text>
          </TouchableOpacity>
        </View>

        {/* ── Action Buttons ── */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.clearBtn} onPress={handleClear} activeOpacity={0.8}>
            <Text style={s.clearBtnText}>CLEAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.calcBtn}
            onPress={handleCalculate}
            activeOpacity={0.85}
          >
            <Text style={s.calcBtnText}>CALCULATE</Text>
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

  header: { alignItems: 'center', paddingVertical: 20, marginBottom: 6 },
  headerIcon: { fontSize: 28, marginBottom: 6 },
  headerTitle: {
    fontFamily: 'Rajdhani_700Bold', fontSize: 26, letterSpacing: 5,
    color: C.accent, textTransform: 'uppercase',
  },
  headerSub: {
    fontFamily: 'ShareTechMono_400Regular', fontSize: 9, letterSpacing: 3,
    color: C.muted, marginTop: 4,
  },
  headerLine: {
    height: 2, width: '100%', marginTop: 16,
    backgroundColor: C.accent, opacity: 0.3,
  },

  card: {
    backgroundColor: C.panel, borderRadius: 12, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  cardBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: C.accent, opacity: 0.4 },
  cardTitle: {
    fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 3,
    color: C.accent, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: C.accent, paddingLeft: 8,
  },

  label: { fontFamily: 'ShareTechMono_400Regular', fontSize: 9, letterSpacing: 2, color: C.muted, marginBottom: 6 },
  field: { marginBottom: 12 },
  input: {
    backgroundColor: C.panel2, borderRadius: 8, borderWidth: 1, borderColor: C.border,
    color: C.text, fontFamily: 'ShareTechMono_400Regular', fontSize: 15, padding: 10,
  },

  dateBtn: {
    backgroundColor: C.panel2, borderRadius: 8, borderWidth: 1, borderColor: C.border,
    padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dateBtnText: { fontFamily: 'ShareTechMono_400Regular', fontSize: 15, color: C.text },

  shiftRow: { flexDirection: 'row', gap: 10 },
  shiftBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 2,
    borderColor: C.border, backgroundColor: C.panel2, alignItems: 'center',
  },
  shiftBtnMorning: { borderColor: C.accent, backgroundColor: 'rgba(0,212,255,0.06)' },
  shiftBtnAfternoon: { borderColor: C.accent2, backgroundColor: 'rgba(255,107,53,0.06)' },
  shiftBtnText: { fontFamily: 'Rajdhani_700Bold', fontSize: 13, letterSpacing: 2, color: C.muted },

  pumpCard: {
    backgroundColor: C.panel2, borderRadius: 10, borderWidth: 1,
    borderColor: C.border, padding: 12, marginBottom: 10,
  },
  pumpHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pumpDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent2, marginRight: 8 },
  pumpLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 3, color: C.accent2, flex: 1 },
  pumpRemove: { padding: 4 },
  pumpFieldRow: { flexDirection: 'row', marginBottom: 0 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderStyle: 'dashed', borderColor: `${C.accent}66`,
    borderRadius: 8, paddingVertical: 10, marginTop: 6,
    backgroundColor: `${C.accent}11`,
  },
  addBtnText: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 12, letterSpacing: 2, color: C.accent },

  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  quickBtn: {
    backgroundColor: `${C.accent2}18`, borderWidth: 1, borderColor: `${C.accent2}44`,
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14,
  },
  quickBtnText: { fontFamily: 'Rajdhani_700Bold', fontSize: 13, color: C.accent2, letterSpacing: 1 },

  depositRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  removeDepBtn: {
    width: 36, height: 40, backgroundColor: `${C.danger}18`, borderWidth: 1,
    borderColor: `${C.danger}44`, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  clearBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 10, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.panel, alignItems: 'center',
  },
  clearBtnText: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, letterSpacing: 3, color: C.muted },
  calcBtn: {
    flex: 1.6, paddingVertical: 15, borderRadius: 10,
    backgroundColor: C.accent, alignItems: 'center',
    shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4,
  },
  calcBtnText: { fontFamily: 'Rajdhani_700Bold', fontSize: 15, letterSpacing: 3, color: '#fff' },
});
