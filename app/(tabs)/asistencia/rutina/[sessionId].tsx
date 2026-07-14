import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../../src/components/AppButton';
import { AppTextInput } from '../../../../src/components/AppTextInput';
import {
  createRoutine,
  linkRoutineToSession,
  listRoutines,
  listRoutinesForSession,
  unlinkRoutineFromSession,
  type Routine,
} from '../../../../src/db/supabase/routines';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useTeam } from '../../../../src/hooks/useTeam';
import { fonts, minTouchSize, spacing, typography, useTheme } from '../../../../src/theme';

export default function RutinaDeSesionScreen() {
  const { colors } = useTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { session } = useAuth();
  const { teamId } = useTeam();
  const coachId = session?.user.id ?? null;

  const [linked, setLinked] = useState<Routine[]>([]);
  const [library, setLibrary] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);
    setError(null);
    try {
      const [linkedRoutines, allRoutines] = await Promise.all([
        listRoutinesForSession(sessionId),
        listRoutines(coachId),
      ]);
      setLinked(linkedRoutines);
      setLibrary(allRoutines);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No pudimos cargar la rutina. Si tomaste la asistencia offline, sincronizá primero.'
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId, coachId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleLink(routineId: string) {
    setBusyId(routineId);
    try {
      await linkRoutineToSession(sessionId, routineId);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnlink(routineId: string) {
    setBusyId(routineId);
    try {
      await unlinkRoutineFromSession(sessionId, routineId);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateAndLink() {
    const trimmed = newTitle.trim();
    if (!trimmed || !coachId) return;
    setCreating(true);
    try {
      const routineId = await createRoutine(coachId, teamId, trimmed);
      await linkRoutineToSession(sessionId, routineId);
      router.push({ pathname: '/ejercicios/rutinas/[routineId]', params: { routineId } });
    } finally {
      setCreating(false);
      setNewTitle('');
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      </View>
    );
  }

  const linkedIds = new Set(linked.map((r) => r.id));
  const availableToLink = library.filter((r) => !linkedIds.has(r.id));

  return (
    <FlatList
      data={linked}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Rutina/s de hoy</Text>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Todavía no vinculaste ninguna rutina a esta sesión.
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() => router.push({ pathname: '/ejercicios/rutinas/[routineId]', params: { routineId: item.id } })}
        >
          <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
          <Pressable onPress={() => handleUnlink(item.id)} disabled={busyId === item.id}>
            <Text style={[styles.removeLabel, { color: colors.danger }]}>Quitar</Text>
          </Pressable>
        </Pressable>
      )}
      ListFooterComponent={
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
            Crear rutina nueva para hoy
          </Text>
          <AppTextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Nombre de la rutina"
          />
          <View style={styles.smallSpacer} />
          <AppButton
            label="Crear y agregar ejercicios"
            onPress={handleCreateAndLink}
            loading={creating}
            disabled={!newTitle.trim()}
          />

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
            Vincular una rutina existente
          </Text>
          {availableToLink.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No hay más rutinas en tu biblioteca.
            </Text>
          ) : (
            availableToLink.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => handleLink(r.id)}
                disabled={busyId === r.id}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.rowTitle, { color: colors.text }]}>{r.title}</Text>
                <Text style={[styles.addLabel, { color: colors.link }]}>+ Vincular</Text>
              </Pressable>
            ))
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1, padding: spacing.lg },
  sectionTitle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular },
  row: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
  },
  rowTitle: { fontSize: typography.body, fontFamily: fonts.bold, flex: 1 },
  removeLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  addLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  smallSpacer: { height: spacing.sm },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
