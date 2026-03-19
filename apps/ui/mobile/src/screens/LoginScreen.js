import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, Alert, Animated,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';
import { api } from '../api';

export default function LoginScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  const toggleMode = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setIsLogin(!isLogin);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Oops!', 'Please enter both email and password.');
      return;
    }
    if (!isLogin && !displayName.trim()) {
      Alert.alert('Oops!', 'Please enter a display name.');
      return;
    }
    setLoading(true);
    try {
      const data = isLogin
        ? await api.login(email.trim(), password)
        : await api.register(email.trim(), password, displayName.trim());
      if (data.error || data.detail) {
        Alert.alert('Error', data.error || data.detail);
      } else {
        await AsyncStorage.setItem('userEmail', email.trim());
        await AsyncStorage.setItem('userDisplayName', data.user.displayName || email.split('@')[0]);
        await AsyncStorage.setItem('userCoins', String(data.user.coins || 0));
        await AsyncStorage.setItem('equippedAvatar', data.user.avatar || '🧢');
        navigation.replace('Home', { email: email.trim(), displayName: data.user.displayName });
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Could not connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <Text style={styles.greeting}>{isLogin ? 'Welcome back' : 'Create account'}</Text>
        <Text style={styles.subtitle}>Wealth Manager Arena</Text>
        <Text style={styles.tagline}>Learn to invest. Play to win. 🚀</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formContainer}>
        <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
          <Text style={styles.formTitle}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput style={styles.input} placeholder="Your player name" placeholderTextColor={colors.textLight}
                value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
            </View>
          )}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor={colors.textLight}
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.textLight}
              value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <TouchableOpacity style={[styles.submitButton, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={colors.textOnAccent} /> :
              <Text style={styles.submitButtonText}>{isLogin ? '🔐  Login' : '✨  Create Account'}</Text>}
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity onPress={toggleMode} style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.toggleLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary, paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 40, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl,
  },
  greeting: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textOnDark, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.lg, fontWeight: '500', color: colors.accent, marginBottom: spacing.xs },
  tagline: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  formContainer: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center', marginTop: -20 },
  formCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.card },
  formTitle: { fontSize: fontSize.xl, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.lg },
  inputContainer: { marginBottom: spacing.md },
  inputLabel: { fontSize: fontSize.sm, fontWeight: '500', color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.background, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: fontSize.md,
    color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.accent, borderRadius: borderRadius.full,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.md, ...shadows.button,
  },
  submitButtonText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textOnAccent },
  toggleContainer: { alignItems: 'center', marginTop: spacing.lg, paddingBottom: spacing.xl },
  toggleText: { fontSize: fontSize.md, color: colors.textSecondary },
  toggleLink: { color: colors.primary, fontWeight: '600' },
});
