import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getTheme } from '../theme/colors';
import { useToast } from '../components/ToastManager';

export default function RegisterScreen({ navigation }) {
  const { register, theme } = useAuth();
  const C = getTheme(theme === 'dark');
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) return toast.warn('Name Required', 'Please enter your name.');
    if (!email.trim()) return toast.warn('Email Required', 'Please enter your email.');
    if (password.length < 8) return toast.warn('Weak Password', 'Password must be at least 8 characters.');
    if (password !== confirm) return toast.warn('Passwords Don\'t Match', 'Please confirm your password correctly.');

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const s = styles(C);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← BACK</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerIcon}>⛽</Text>
            <Text style={s.title}>CREATE{'\n'}ACCOUNT</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <View style={s.cardTopBar} />
            <Text style={s.cardTitle}>✦ NEW ACCOUNT</Text>

            {[
              { label: 'FULL NAME', value: name, setter: setName, placeholder: 'John Doe', type: 'default' },
              { label: 'EMAIL', value: email, setter: setEmail, placeholder: 'you@example.com', type: 'email-address' },
            ].map(({ label, value, setter, placeholder, type }) => (
              <View style={s.field} key={label}>
                <Text style={s.label}>{label}</Text>
                <TextInput
                  style={s.input}
                  value={value}
                  onChangeText={setter}
                  placeholder={placeholder}
                  placeholderTextColor={C.muted}
                  keyboardType={type}
                  autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                  autoCorrect={false}
                />
              </View>
            ))}

            <View style={s.field}>
              <Text style={s.label}>PASSWORD</Text>
              <View style={s.passwordWrap}>
                <TextInput
                  style={[s.input, { flex: 1, borderWidth: 0 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={C.muted}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                  <Text style={s.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>CONFIRM PASSWORD</Text>
              <TextInput
                style={[s.input, confirm && password !== confirm && { borderColor: C.danger }]}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repeat password"
                placeholderTextColor={C.muted}
                secureTextEntry={!showPass}
                onSubmitEditing={handleRegister}
                returnKeyType="go"
              />
              {confirm && password !== confirm && (
                <Text style={s.errorHint}>Passwords do not match</Text>
              )}
            </View>

            <TouchableOpacity
              style={[s.primaryBtn, loading && s.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#006633', C.accent3]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btnGradient}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnText}>CREATE ACCOUNT</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} style={s.loginLink}>
            <Text style={s.loginLinkText}>Already have an account? <Text style={{ color: C.accent }}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
  backText: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 13, color: C.muted, letterSpacing: 2 },
  header: { alignItems: 'center', marginBottom: 28 },
  headerIcon: { fontSize: 36, marginBottom: 10 },
  title: {
    fontFamily: 'Rajdhani_700Bold', fontSize: 30, letterSpacing: 5,
    textAlign: 'center', color: C.accent3, lineHeight: 36,
  },
  card: {
    backgroundColor: C.panel, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  cardTopBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: C.accent3, opacity: 0.6 },
  cardTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 13, letterSpacing: 3, color: C.accent3, marginBottom: 20, marginTop: 6 },
  field: { marginBottom: 16 },
  label: { fontFamily: 'ShareTechMono_400Regular', fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 6 },
  input: {
    backgroundColor: C.panel2, borderRadius: 10, borderWidth: 1,
    borderColor: C.border, color: C.text,
    fontFamily: 'ShareTechMono_400Regular', fontSize: 15, padding: 12,
  },
  errorHint: { fontFamily: 'ShareTechMono_400Regular', fontSize: 10, color: C.danger, marginTop: 4 },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.panel2,
    borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingRight: 8,
  },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 16 },
  primaryBtn: { borderRadius: 10, overflow: 'hidden', marginTop: 6 },
  btnGradient: { paddingVertical: 15, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: 'Rajdhani_700Bold', fontSize: 16, letterSpacing: 3, color: '#fff' },
  loginLink: { alignItems: 'center' },
  loginLinkText: { fontFamily: 'ShareTechMono_400Regular', fontSize: 12, color: C.muted },
});
