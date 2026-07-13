import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/AppButton';
import { AppTextInput } from '../../src/components/AppTextInput';
import { sendOtp, verifyOtp } from '../../src/db/supabase/auth';
import { colors, spacing, typography } from '../../src/theme';

export default function VerifyOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(phone, code.trim());
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Código incorrecto. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setResent(false);
    setResending(true);
    try {
      await sendOtp(phone);
      setResent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos reenviar el código.');
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificar código</Text>
      <Text style={styles.label}>Ingresá el código que te llegó por SMS al {phone}</Text>
      <AppTextInput
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {resent && !error ? <Text style={styles.success}>Código reenviado.</Text> : null}
      <View style={styles.spacer} />
      <AppButton
        label="Confirmar"
        onPress={handleVerify}
        loading={loading}
        disabled={code.trim().length < 4}
      />
      <View style={styles.spacer} />
      <AppButton label="Reenviar código" onPress={handleResend} loading={resending} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: typography.body, color: colors.textMuted, marginBottom: spacing.md },
  error: { fontSize: typography.label, color: colors.danger, marginTop: spacing.sm },
  success: { fontSize: typography.label, color: colors.success, marginTop: spacing.sm },
  spacer: { height: spacing.md },
});
