import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { signOut } from '../../../src/db/supabase/auth';
import { colors, spacing, typography } from '../../../src/theme';

export default function AsistenciaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asistencia</Text>
      <Text style={styles.description}>
        Acá va la toma de asistencia por sesión. Próxima feature a implementar.
      </Text>
      <View style={styles.spacer} />
      <AppButton label="Cerrar sesión" variant="secondary" onPress={() => signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  description: { fontSize: typography.body, color: colors.textMuted },
  spacer: { height: spacing.lg },
});
