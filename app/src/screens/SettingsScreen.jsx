import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Pressable, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getTheme } from '../theme/colors';
import { useToast } from '../components/ToastManager';
import api from '../services/api';

export default function SettingsScreen() {
  const { user, theme, toggleTheme, logout, refreshUser } = useAuth();
  const C = getTheme(theme === 'dark');
  const toast = useToast();
  const s = styles(C);

  const [pinModal, setPinModal] = useState(false);
  const [pinStep, setPinStep] = useState('enter'); // 'enter' | 'confirm'
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try { await logout(); } catch {}
          setLoggingOut(false);
        },
      },
    ]);
  };

  const openPinModal = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinModal(true);
  };

  const handleSavePin = async () => {
    if (newPin && newPin.length < 4) return toast.warn('Invalid PIN', 'PIN must be 4–6 digits.');
    if (newPin && !/^\d+$/.test(newPin)) return toast.warn('Invalid PIN', 'PIN must be numbers only.');
    if (newPin && newPin !== confirmPin) return toast.warn('PIN Mismatch', 'PINs do not match.');
    if (user?.hasPin && !currentPin) return toast.warn('Current PIN Required', 'Enter your current PIN to change it.');

    setPinLoading(true);
    try {
      await api.put('/auth/pin', { currentPin: currentPin || undefined, newPin: newPin || null });
      await refreshUser();
      setPinModal(false);
      toast.success('PIN Updated', newPin ? 'Your PIN has been set.' : 'PIN protection disabled.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update PIN.';
      toast.error('Error', msg);
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>⚙️ SETTINGS</Text>
        </View>

        {/* Account info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ACCOUNT</Text>
          <View style={s.infoCard}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={s.infoText}>
              <Text style={s.infoName}>{user?.name || 'User'}</Text>
              <Text style={s.infoEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>APPEARANCE</Text>
          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <Text style={s.settingIcon}>{theme === 'dark' ? '🌙' : '☀️'}</Text>
              <View>
                <Text style={s.settingLabel}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
                <Text style={s.settingDesc}>Toggle app theme</Text>
              </View>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: C.border, true: `${C.accent}66` }}
              thumbColor={theme === 'dark' ? C.accent : C.muted}
            />
          </View>
        </View>

        {/* Security */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SECURITY</Text>
          <TouchableOpacity style={s.settingRow} onPress={openPinModal} activeOpacity={0.8}>
            <View style={s.settingLeft}>
              <Text style={s.settingIcon}>🔐</Text>
              <View>
                <Text style={s.settingLabel}>Delete PIN</Text>
                <Text style={s.settingDesc}>
                  {user?.hasPin ? 'PIN protection is ON' : 'Protect record deletion'}
                </Text>
              </View>
            </View>
            <View style={[s.statusBadge, user?.hasPin ? s.badgeOn : s.badgeOff]}>
              <Text style={[s.statusText, { color: user?.hasPin ? C.success : C.muted }]}>
                {user?.hasPin ? 'ON' : 'OFF'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ABOUT</Text>
          {[
            { label: 'App Version', value: '1.0.0' },
            { label: 'Records Sync', value: 'Cloud + Local' },
            { label: 'Backend', value: 'Node.js + MongoDB' },
          ].map(({ label, value }) => (
            <View key={label} style={[s.settingRow, { borderBottomWidth: 0, paddingVertical: 10 }]}>
              <Text style={s.settingLabel}>{label}</Text>
              <Text style={s.settingDesc}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
        >
          {loggingOut
            ? <ActivityIndicator color={C.danger} />
            : <Text style={s.logoutText}>SIGN OUT</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* PIN Modal */}
      <Modal
        visible={pinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModal(false)}
      >
        <Pressable style={s.overlay} onPress={() => setPinModal(false)}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>🔐 PIN MANAGEMENT</Text>
            <Text style={s.modalSub}>Protect record deletion with a 4–6 digit PIN</Text>

            {user?.hasPin && (
              <View style={s.modalField}>
                <Text style={s.label}>CURRENT PIN</Text>
                <TextInput
                  style={s.modalInput}
                  value={currentPin}
                  onChangeText={setCurrentPin}
                  placeholder="••••"
                  placeholderTextColor={C.muted}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            )}
            <View style={s.modalField}>
              <Text style={s.label}>NEW PIN (leave empty to disable)</Text>
              <TextInput
                style={s.modalInput}
                value={newPin}
                onChangeText={setNewPin}
                placeholder="New PIN"
                placeholderTextColor={C.muted}
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            {newPin.length > 0 && (
              <View style={s.modalField}>
                <Text style={s.label}>CONFIRM PIN</Text>
                <TextInput
                  style={[s.modalInput, newPin !== confirmPin && confirmPin.length > 0 && { borderColor: C.danger }]}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  placeholder="Confirm"
                  placeholderTextColor={C.muted}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            )}

            <TouchableOpacity
              style={s.modalSaveBtn}
              onPress={handleSavePin}
              disabled={pinLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#0077aa', C.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.modalBtnGrad}
              >
                {pinLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.modalBtnText}>SAVE PIN</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setPinModal(false)}>
              <Text style={s.modalCancelText}>CANCEL</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },
  pageHeader: { paddingBottom: 16 },
  pageTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 18, letterSpacing: 3, color: C.text },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: 'ShareTechMono_400Regular', fontSize: 9, letterSpacing: 3,
    color: C.muted, marginBottom: 8, paddingLeft: 2,
  },

  infoCard: {
    backgroundColor: C.panel, borderRadius: 12, borderWidth: 1,
    borderColor: C.border, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: `${C.accent}22`,
    borderWidth: 2, borderColor: `${C.accent}55`, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Rajdhani_700Bold', fontSize: 20, color: C.accent },
  infoText: { flex: 1 },
  infoName: { fontFamily: 'Rajdhani_700Bold', fontSize: 16, color: C.text, letterSpacing: 1 },
  infoEmail: { fontFamily: 'ShareTechMono_400Regular', fontSize: 11, color: C.muted, marginTop: 2 },

  settingRow: {
    backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon: { fontSize: 20, width: 28 },
  settingLabel: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 14, color: C.text, letterSpacing: 0.5 },
  settingDesc: { fontFamily: 'ShareTechMono_400Regular', fontSize: 10, color: C.muted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeOn: { backgroundColor: `${C.success}18`, borderColor: `${C.success}44` },
  badgeOff: { backgroundColor: C.panel2, borderColor: C.border },
  statusText: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 1 },

  logoutBtn: {
    backgroundColor: `${C.danger}14`, borderWidth: 1, borderColor: `${C.danger}44`,
    borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10,
  },
  logoutText: { fontFamily: 'Rajdhani_700Bold', fontSize: 15, letterSpacing: 3, color: C.danger },

  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: {
    backgroundColor: C.panel, borderRadius: 16, padding: 20,
    width: '100%', maxWidth: 400, borderWidth: 1, borderColor: C.border,
  },
  modalTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 16, letterSpacing: 3, color: C.accent, marginBottom: 6 },
  modalSub: { fontFamily: 'ShareTechMono_400Regular', fontSize: 10, color: C.muted, marginBottom: 16 },
  modalField: { marginBottom: 14 },
  label: { fontFamily: 'ShareTechMono_400Regular', fontSize: 9, letterSpacing: 2, color: C.muted, marginBottom: 6 },
  modalInput: {
    backgroundColor: C.panel2, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    color: C.text, fontFamily: 'ShareTechMono_400Regular', fontSize: 20,
    padding: 12, letterSpacing: 6, textAlign: 'center',
  },
  modalSaveBtn: { borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  modalBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  modalBtnText: { fontFamily: 'Rajdhani_700Bold', fontSize: 15, letterSpacing: 3, color: '#fff' },
  modalCancelBtn: {
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
    paddingVertical: 12, alignItems: 'center',
  },
  modalCancelText: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, letterSpacing: 2, color: C.muted },
});
