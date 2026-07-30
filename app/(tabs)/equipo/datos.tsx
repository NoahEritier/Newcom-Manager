import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { DetailRow, DetailSection } from '../../../src/components/DetailView';
import { TeamForm } from '../../../src/components/TeamForm';
import { updateTeam, type TeamGender, type TeamInput } from '../../../src/db/supabase/team';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, spacing, typography, useTheme } from '../../../src/theme';

const GENDER_LABEL: Record<TeamGender, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  mixto: 'Mixto',
};

const DAY_LABEL: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export default function DatosDelEquipoScreen() {
  const { colors } = useTheme();
  const { team, isLoading, refresh } = useTeam();
  const [editing, setEditing] = useState(false);

  if (isLoading || !team) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  async function handleSubmit(input: TeamInput) {
    await updateTeam(team!.id, input);
    await refresh();
    setEditing(false);
  }

  if (editing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TeamForm
          initialValue={{
            name: team.name,
            gender: team.gender,
            category: team.category,
            default_location: team.default_location,
            training_days: team.training_days,
          }}
          onSubmit={handleSubmit}
        />
        <View style={styles.actionsContainer}>
          <AppButton label="Cancelar" variant="secondary" onPress={() => setEditing(false)} />
        </View>
      </View>
    );
  }

  const trainingDaysLabel = [...team.training_days]
    .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
    .map((d) => DAY_LABEL[d])
    .join(', ');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{team.name}</Text>

        <DetailSection>
          <DetailRow label="Género" value={team.gender ? GENDER_LABEL[team.gender] : null} />
          <DetailRow label="Categoría" value={team.category} />
          <DetailRow label="Lugar de entrenamiento habitual" value={team.default_location} />
          <DetailRow label="Días de entrenamiento" value={trainingDaysLabel || null} />
        </DetailSection>

        <View style={styles.actions}>
          <AppButton label="Editar" onPress={() => setEditing(true)} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
  title: { fontSize: typography.screenTitle, fontFamily: fonts.bold },
  actions: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  actionsContainer: { padding: spacing.lg, paddingTop: 0 },
});
