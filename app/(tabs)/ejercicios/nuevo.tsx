import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ExerciseForm } from '../../../src/components/ExerciseForm';
import { createExercise, type ExerciseInput } from '../../../src/db/supabase/exercises';
import { useAuth } from '../../../src/hooks/useAuth';
import { fonts, spacing, typography, useTheme } from '../../../src/theme';

export default function NuevoEjercicioScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const coachId = session?.user.id;

  if (!coachId) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>No pudimos identificar tu cuenta.</Text>
      </View>
    );
  }

  async function handleSubmit(input: ExerciseInput) {
    await createExercise(coachId as string, input);
    router.back();
  }

  return <ExerciseForm submitLabel="Guardar ejercicio" onSubmit={handleSubmit} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
