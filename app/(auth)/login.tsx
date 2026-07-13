import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/AppButton';
import { AppTextInput } from '../../src/components/AppTextInput';
import { sendOtp } from '../../src/db/supabase/auth';
import { colors, spacing, typography } from '../../src/theme';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp() {
    const trimmedPhone = phone.trim();
    setError(null);
    setLoading(true);
    try {
      await sendOtp(trimmedPhone);
      router.push({ pathname: '/verify-otp', params: { phone: trimmedPhone } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos enviar el código. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresar</Text>
      <Text style={styles.label}>Tu número de teléfono</Text>
      <AppTextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="+54 9 11 1234 5678"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.spacer} />
      <AppButton
        label="Enviar código"
        onPress={handleSendOtp}
        loading={loading}
        disabled={!phone.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: typography.label, color: colors.textMuted, marginBottom: spacing.xs },
  error: { fontSize: typography.label, color: colors.danger, marginTop: spacing.sm },
  spacer: { height: spacing.md },
});
