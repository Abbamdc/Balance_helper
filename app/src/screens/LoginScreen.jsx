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

export default function LoginScreen({ navigation }) {
  const { login, theme } = useAuth();
  const C = getTheme(theme === 'dark');
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) return toast.warn('Email Required', 'Please enter your email.');
    if (!password) return toast.warn('Password Required', 'Please enter your password.');

    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      // AuthContext sets isAuthenticated → RootNavigator swaps to main tabs
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed. Check your credentials.';
      toast.error('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const s = styles(C);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerIcon}>⛽</Text>
            <Text style={s.title}>BALANCE{'\n'}HELPER</Text>
            <Text style={s.subtitle}>FUEL STATION SHIFT CALCULATOR</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <View style={s.cardTopBar} />
            <Text style={s.cardTitle}>⚡ SIGN IN</Text>

            <View style={s.field}>
              <Text style={s.label}>EMAIL</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={C.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>PASSWORD</Text>
              <View style={s.passwordWrap}>
                <TextInput
                  style={[s.input, { flex: 1, borderWidth: 0 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={C.muted}
                  secureTextEntry={!showPass}
                  onSubmitEditing={handleLogin}
                  returnKeyType="go"
                />
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  style={s.eyeBtn}
                >
                  <Text style={s.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[s.primaryBtn, loading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#0077aa', C.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btnGradient}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnText}>SIGN IN</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>OR</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={s.secondaryBtnText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.footer}>
            Your shift records sync across all your devices
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, padding: 20, paddingTop: 40, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 36 },
  headerIcon: { fontSize: 48, marginBottom: 12 },
  title: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 36,
    letterSpacing: 6,
    textAlign: 'center',
    color: C.accent,
    textTransform: 'uppercase',
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: 'ShareTechMono_400Regular',
    fontSize: 10,
    letterSpacing: 3,
    color: C.muted,
    marginTop: 6,
  },
  card: {
    backgroundColor: C.panel,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    backgroundColor: C.accent, opacity: 0.6,
  },
  cardTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 13,
    letterSpacing: 3,
    color: C.accent,
    marginBottom: 20,
    marginTop: 6,
  },
  field: { marginBottom: 16 },
  label: {
    fontFamily: 'ShareTechMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    color: C.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.panel2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    fontFamily: 'ShareTechMono_400Regular',
    fontSize: 15,
    padding: 12,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.panel2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingRight: 8,
  },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 16 },
  primaryBtn: { borderRadius: 10, overflow: 'hidden', marginTop: 6 },
  btnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 16,
    letterSpacing: 3,
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: {
    fontFamily: 'ShareTechMono_400Regular',
    fontSize: 11,
    color: C.muted,
    marginHorizontal: 12,
  },
  secondaryBtn: {
    backgroundColor: C.panel2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 15,
    letterSpacing: 3,
    color: C.text,
  },
  footer: {
    fontFamily: 'ShareTechMono_400Regular',
    fontSize: 11,
    color: C.muted,
    textAlign: 'center',
  },
});
