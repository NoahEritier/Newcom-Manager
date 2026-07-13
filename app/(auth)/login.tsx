import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/AppButton';
import { AppTextInput } from '../../src/components/AppTextInput';
import { sendOtp } from '../../src/db/supabase/auth';
import { fonts, spacing, typography, useTheme } from '../../src/theme';

export default function LoginScreen() {
  const { colors } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Ingresar</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>Tu número de teléfono</Text>
      <AppTextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="+54 9 11 1234 5678"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
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
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: typography.screenTitle, fontFamily: fonts.bold, marginBottom: spacing.lg },
  label: { fontSize: typography.caption, fontFamily: fonts.bold, marginBottom: spacing.xs },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.sm },
  spacer: { height: spacing.md },
});
