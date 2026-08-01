import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../../src/components/AppButton';
import { Dropdown } from '../../../../src/components/Dropdown';
import { RoutineExerciseModal } from '../../../../src/components/RoutineExerciseModal';
import { listExercises, type Exercise } from '../../../../src/db/supabase/exercises';
import { listPlayers, type Player } from '../../../../src/db/supabase/players';
import {
  addExerciseToRoutine,
  deleteRoutine,
  duplicateRoutine,
  getRoutine,
  listRoutineExercises,
  listRoutinePlayerIds,
  listRoutines,
  removeRoutineExercise,
  setRoutinePlayers,
  swapRoutineExercisePositions,
  updateRoutine,
  updateRoutineExercise,
  type Routine,
  type RoutineExercise,
  type RoutineExerciseDetails,
  type RoutineLevel,
} from '../../../../src/db/supabase/routines';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useTeam } from '../../../../src/hooks/useTeam';
import { fonts, minTouchSize, spacing, typography, useTheme } from '../../../../src/theme';
import { ROUTINE_LEVELS } from '../../../../src/utils/routineLevels';

export default function RutinaDetalleScreen() {
  const { colors } = useTheme();
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const { session } = useAuth();
  const coachId = session?.user.id ?? null;
  const { teamId } = useTeam();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [allRoutines, setAllRoutines] = useState<Routine[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [assignedPlayerIds, setAssignedPlayerIds] = useState<Set<string>>(new Set());
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showNextPicker, setShowNextPicker] = useState(false);

  const [modalExercise, setModalExercise] = useState<Exercise | null>(null);
  const [modalTarget, setModalTarget] = useState<RoutineExercise | null>(null);

  const load = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);
    setError(null);
    try {
      const [r, items, allExercises, routines, assignedIds, teamPlayers] = await Promise.all([
        getRoutine(routineId),
        listRoutineExercises(routineId),
        listExercises(coachId),
        listRoutines(coachId),
        listRoutinePlayerIds(routineId),
        teamId ? listPlayers(teamId) : Promise.resolve([]),
      ]);
      setRoutine(r);
      setRoutineExercises(items);
      setLibrary(allExercises);
      setAllRoutines(routines);
      setAssignedPlayerIds(new Set(assignedIds));
      setPlayers(teamPlayers);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar la rutina.');
    } finally {
      setLoading(false);
    }
  }, [routineId, coachId, teamId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function persistRoutine(patch: Partial<Pick<Routine, 'is_favorite' | 'level' | 'next_routine_id'>>) {
    if (!routine) return;
    setBusy(true);
    try {
      await updateRoutine(routine.id, {
        title: routine.title,
        is_favorite: routine.is_favorite,
        level: routine.level,
        next_routine_id: routine.next_routine_id,
        ...patch,
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  function toggleFavorite() {
    if (!routine) return;
    persistRoutine({ is_favorite: !routine.is_favorite });
  }

  function setLevel(level: string) {
    if (!routine) return;
    persistRoutine({ level: (level || null) as RoutineLevel | null });
  }

  async function toggleAssignedPlayer(playerId: string) {
    const next = new Set(assignedPlayerIds);
    if (next.has(playerId)) next.delete(playerId);
    else next.add(playerId);
    setAssignedPlayerIds(next);
    setSavingAssignments(true);
    try {
      await setRoutinePlayers(routineId, Array.from(next));
    } finally {
      setSavingAssignments(false);
    }
  }

  function chooseNextRoutine(nextId: string) {
    setShowNextPicker(false);
    persistRoutine({ next_routine_id: nextId });
  }

  function clearNextRoutine() {
    persistRoutine({ next_routine_id: null });
  }

  async function handleRemove(routineExerciseId: string) {
    setBusy(true);
    try {
      await removeRoutineExercise(routineExerciseId);
      setRoutineExercises(await listRoutineExercises(routineId));
    } finally {
      setBusy(false);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= routineExercises.length) return;
    setBusy(true);
    try {
      await swapRoutineExercisePositions(routineExercises[index], routineExercises[targetIndex]);
      setRoutineExercises(await listRoutineExercises(routineId));
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicate() {
    setBusy(true);
    try {
      const newId = await duplicateRoutine(routineId);
      router.replace({ pathname: '/ejercicios/rutinas/[routineId]', params: { routineId: newId } });
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Eliminar rutina',
      `¿Seguro que querés eliminar "${routine?.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteRoutine(routineId);
      router.replace('/ejercicios/rutinas');
    } catch (e) {
      setBusy(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No pudimos eliminar la rutina.');
    }
  }

  async function handleSaveModal(details: RoutineExerciseDetails) {
    if (modalTarget) {
      await updateRoutineExercise(modalTarget.id, details);
    } else if (modalExercise) {
      await addExerciseToRoutine(
        routineId,
        modalExercise.id,
        routineExercises.length,
        details.duration_minutes,
        details.notes,
        details.adaptations,
        details.variants
      );
    }
    setModalExercise(null);
    setModalTarget(null);
    setRoutineExercises(await listRoutineExercises(routineId));
  }

  async function handleRemoveFromModal() {
    if (!modalTarget) return;
    await removeRoutineExercise(modalTarget.id);
    setModalTarget(null);
    setRoutineExercises(await listRoutineExercises(routineId));
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !routine) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{error ?? 'Rutina no encontrada.'}</Text>
      </View>
    );
  }

  const addedIds = new Set(routineExercises.map((re) => re.exercise_id));
  const available = library.filter((ex) => !addedIds.has(ex.id));
  const totalMinutes = routineExercises.reduce((sum, re) => sum + (re.duration_minutes ?? 0), 0);
  const nextRoutine = allRoutines.find((r) => r.id === routine.next_routine_id) ?? null;
  const otherRoutines = allRoutines.filter((r) => r.id !== routine.id);

  return (
    <>
      <FlatList
        data={routineExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Stack.Screen options={{ title: routine.title }} />
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>{routine.title}</Text>
              <Pressable onPress={toggleFavorite} style={styles.favButton}>
                <Text style={[styles.favIcon, { color: routine.is_favorite ? colors.accent : colors.textMuted }]}>
                  {routine.is_favorite ? '★' : '☆'}
                </Text>
              </Pressable>
            </View>
            {totalMinutes > 0 ? (
              <Text style={[styles.duration, { color: colors.textMuted }]}>Duración total: {totalMinutes} min</Text>
            ) : null}

            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Nivel</Text>
            <Dropdown
              value={routine.level ?? ''}
              options={[{ value: '', label: 'Sin nivel' }, ...ROUTINE_LEVELS]}
              onChange={setLevel}
              placeholder="Sin nivel"
              title="Nivel"
            />

            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Progresión: rutina siguiente</Text>
            {nextRoutine ? (
              <View style={styles.nextRoutineRow}>
                <Pressable
                  style={styles.nextRoutineLink}
                  onPress={() =>
                    router.push({ pathname: '/ejercicios/rutinas/[routineId]', params: { routineId: nextRoutine.id } })
                  }
                >
                  <Text style={[styles.linkText, { color: colors.link }]}>{nextRoutine.title}</Text>
                </Pressable>
                <Pressable onPress={clearNextRoutine} disabled={busy} style={styles.removeButton}>
                  <Text style={[styles.removeLabel, { color: colors.danger }]}>Quitar</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setShowNextPicker((v) => !v)} style={styles.toggleButton}>
                <Text style={[styles.linkText, { color: colors.link }]}>
                  {showNextPicker ? 'Cancelar' : '+ Elegir rutina siguiente'}
                </Text>
              </Pressable>
            )}
            {showNextPicker && !nextRoutine ? (
              <View>
                {otherRoutines.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No hay otras rutinas todavía.
                  </Text>
                ) : (
                  otherRoutines.map((r) => (
                    <Pressable
                      key={r.id}
                      onPress={() => chooseNextRoutine(r.id)}
                      style={[styles.row, { borderBottomColor: colors.border }]}
                    >
                      <Text style={[styles.rowTitle, { color: colors.text }]}>{r.title}</Text>
                    </Pressable>
                  ))
                )}
              </View>
            ) : null}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Jugadores asignados {savingAssignments ? '(guardando...)' : `(${assignedPlayerIds.size})`}
            </Text>
            {players.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No hay jugadores cargados en el equipo.
              </Text>
            ) : (
              players.map((p) => {
                const checked = assignedPlayerIds.has(p.id);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => toggleAssignedPlayer(p.id)}
                    style={[styles.row, { borderBottomColor: colors.border }]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: colors.border },
                        checked && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    />
                    <Text style={[styles.rowTitle, { color: colors.text }]}>{p.full_name}</Text>
                  </Pressable>
                );
              })
            )}

            <View style={styles.spacer} />
            <AppButton label="Duplicar rutina" variant="secondary" onPress={handleDuplicate} loading={busy} />
            <AppButton label="Eliminar rutina" variant="secondary" onPress={confirmDelete} loading={busy} />
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => setModalTarget(item)}
          >
            <View style={styles.reorderColumn}>
              <Pressable
                onPress={() => handleMove(index, -1)}
                disabled={index === 0}
                style={styles.arrowButton}
                hitSlop={8}
              >
                <Text style={[styles.arrow, { color: index === 0 ? colors.border : colors.primary }]}>▲</Text>
              </Pressable>
              <Pressable
                onPress={() => handleMove(index, 1)}
                disabled={index === routineExercises.length - 1}
                style={styles.arrowButton}
                hitSlop={8}
              >
                <Text
                  style={[
                    styles.arrow,
                    { color: index === routineExercises.length - 1 ? colors.border : colors.primary },
                  ]}
                >
                  ▼
                </Text>
              </Pressable>
            </View>
            <View style={styles.rowMain}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{item.exercise_title}</Text>
              {item.duration_minutes ? (
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>{item.duration_minutes} min</Text>
              ) : null}
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleRemove(item.id);
              }}
              style={styles.removeButton}
            >
              <Text style={[styles.removeLabel, { color: colors.danger }]}>Quitar</Text>
            </Pressable>
          </Pressable>
        )}
        ListFooterComponent={
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Agregar de tu biblioteca</Text>
            {available.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No hay más ejercicios para agregar. Cargá más desde Ejercicios.
              </Text>
            ) : (
              available.map((ex) => (
                <Pressable
                  key={ex.id}
                  onPress={() => setModalExercise(ex)}
                  disabled={busy}
                  style={[styles.row, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{ex.title}</Text>
                  <Text style={[styles.addLabel, { color: colors.link }]}>+ Agregar</Text>
                </Pressable>
              ))
            )}
          </View>
        }
      />

      <RoutineExerciseModal
        visible={modalExercise != null || modalTarget != null}
        exerciseTitle={modalTarget?.exercise_title ?? modalExercise?.title ?? ''}
        initialValue={
          modalTarget
            ? {
                duration_minutes: modalTarget.duration_minutes,
                notes: modalTarget.notes,
                adaptations: modalTarget.adaptations,
                variants: modalTarget.variants,
              }
            : {
                duration_minutes: modalExercise?.duration_minutes ?? null,
                notes: null,
                adaptations: null,
                variants: null,
              }
        }
        saveLabel={modalTarget ? 'Guardar cambios' : 'Agregar a la rutina'}
        onCancel={() => {
          setModalExercise(null);
          setModalTarget(null);
        }}
        onSave={handleSaveModal}
        onRemove={modalTarget ? handleRemoveFromModal : undefined}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1, padding: spacing.lg },
  headerBlock: { gap: spacing.sm, marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.screenTitle, fontFamily: fonts.bold, flex: 1 },
  favButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  favIcon: { fontSize: 24 },
  duration: { fontSize: typography.caption, fontFamily: fonts.regular },
  sectionLabel: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2 },
  nextRoutineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nextRoutineLink: { minHeight: minTouchSize, justifyContent: 'center', flex: 1 },
  toggleButton: { minHeight: minTouchSize, justifyContent: 'center' },
  linkText: { fontSize: typography.body, fontFamily: fonts.bold },
  spacer: { height: spacing.xs },
  row: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
  },
  reorderColumn: { gap: 2 },
  arrowButton: { minWidth: 32, minHeight: 24, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 14 },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: typography.body, fontFamily: fonts.bold },
  rowSub: { fontSize: typography.caption, fontFamily: fonts.regular },
  removeButton: { minHeight: minTouchSize, justifyContent: 'center', paddingLeft: spacing.sm },
  removeLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  addLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
