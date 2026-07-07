import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';

const ICONS = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
const COLORS = {
  success: '#2ed573',
  error: '#ff4757',
  warn: '#ffd700',
  info: '#00d4ff',
};

export default function Toast({ type = 'info', title, message, onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide?.());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const color = COLORS[type] || COLORS.info;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }], borderLeftColor: color }]}>
      <Text style={styles.icon}>{ICONS[type]}</Text>
      <View style={styles.textWrap}>
        {title ? <Text style={[styles.title, { color }]}>{title}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: { fontSize: 18 },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3, marginBottom: 2 },
  message: { fontSize: 12, color: '#a0b0c8', lineHeight: 16 },
});
