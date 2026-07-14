import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { AppTextInput } from '../../../src/components/AppTextInput';
import { TimeField } from '../../../src/components/TimeField';
import {
  deleteSessionLocal,
  getRecordsForSession,
  getSession,
  markAllPresent,
  setAttendance,
  setSessionDetails,
  type LocalRecord,
  type LocalSession,
} from '../../../src/db/local/attendance';
import { getCachedPlayers, type CachedPlayer } from '../../../src/db/local/playersCache';
import { useAttendanceSync } from '../../../src/hooks/useAttendanceSync';
import { deleteSessionRemoteIfSynced } from '../../../src/sync/attendanceSync';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../../../src/theme';

type PresenceMap = Record<string, boolean | undefined>;
type NoteMap = Record<string, string>;
type EditedMap = Record<string, number | null>;

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function TomarAsistenciaScreen() {
  const { colors } = useTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<LocalSession | null>(null);
  const [players, setPlayers] = useState<CachedPlayer[]>([]);
  const [presence, setPresence] = useState<PresenceMap>({});
  const [notes, setNotes] = useState<NoteMap>({});
  const [edited, setEdited] = useState<EditedMap>({});
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { isSyncing, pendingCount, syncNow, refreshPendingCount } = useAttendanceSync(
    session?.team_id ?? null
  );

  const load = useCallback(async () => {
    const foundSession = await getSession(sessionId);
    if (!foundSession) {
      setLoading(false);
      return;
    }
    setSession(foundSession);
    const [cachedPlayers, records] = await Promise.all([
      getCachedPlayers(foundSession.team_id),
      getRecordsForSession(sessionId),
    ]);
    setPlayers(cachedPlayers);
    const presenceMap: PresenceMap = {};
    const noteMap: NoteMap = {};
    const editedMap: EditedMap = {};
    for (const record of records as LocalRecord[]) {
      presenceMap[record.player_id] = record.present === 1;
      noteMap[record.player_id] = record.note ?? '';
      editedMap[record.player_id] = record.edited_at;
    }
    setPresence(presenceMap);
    setNotes(noteMap);
    setEdited(editedMap);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMark(playerId: string, present: boolean) {
    setPresence((prev) => ({ ...prev, [playerId]: present }));
    await setAttendance(sessionId, playerId, present);
    await refreshPendingCount();
  }

  async function handleNoteChange(playerId: string, note: string) {
    setNotes((prev) => ({ ...prev, [playerId]: note }));
  }

  async function handleNoteBlur(playerId: string) {
    const present = presence[playerId] ?? false;
    await setAttendance(sessionId, playerId, present, notes[playerId] || null);
    await refreshPendingCount();
  }

  async function handleMarkAllPresent() {
    if (players.length === 0) return;
    await markAllPresent(sessionId, players.map((p) => p.id));
    const nextPresence: PresenceMap = {};
    for (const p of players) nextPresence[p.id] = true;
    setPresence(nextPresence);
    await refreshPendingCount();
  }

  async function handleSessionDetailsChange(next: { session_time: string | null; location: string | null }) {
    if (!session) return;
    await setSessionDetails(session.id, next);
    setSession({ ...session, ...next });
  }

  function confirmDeleteSession() {
    Alert.alert(
      'Eliminar sesión',
      '¿Seguro que querés eliminar esta sesión de asistencia? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleDeleteSession },
      ]
    );
  }

  async function handleDeleteSession() {
    if (!session) return;
    setDeleting(true);
    try {
      await deleteSessionRemoteIfSynced(session);
      await deleteSessionLocal(session.id);
      router.replace('/asistencia');
    } catch (e) {
      setDeleting(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No pudimos eliminar la sesión.');
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>No encontramos esta sesión.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: formatDate(session.session_date) }} />
      <View style={[styles.syncBanner, { backgroundColor: colors.surface }]}>
        {isSyncing ? (
          <Text style={[styles.syncText, { color: colors.textMuted }]}>Sincronizando…</Text>
        ) : pendingCount > 0 ? (
          <Text style={[styles.syncText, { color: colors.textMuted }]}>
            {pendingCount} cambios pendientes de subir
          </Text>
        ) : (
          <Text style={[styles.syncText, { color: colors.success }]}>Todo sincronizado</Text>
        )}
        <Pressable onPress={syncNow} disabled={isSyncing}>
          <Text style={[styles.syncAction, { color: colors.link }]}>Sincronizar ahora</Text>
        </Pressable>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailsRow}>
          <View style={styles.detailsField}>
            <Text style={[styles.smallLabel, { color: colors.textMuted }]}>Hora</Text>
            <TimeField
              value={session.session_time}
              onChange={(session_time) => handleSessionDetailsChange({ session_time, location: session.location })}
            />
          </View>
        </View>
        <Text style={[styles.smallLabel, { color: colors.textMuted }]}>Lugar</Text>
        <AppTextInput
          value={session.location ?? ''}
          onChangeText={(location) =>
            setSession((prev) => (prev ? { ...prev, location } : prev))
          }
          onBlur={() => handleSessionDetailsChange({ session_time: session.session_time, location: session.location })}
          placeholder="Cancha / dirección"
        />
      </View>

      <View style={styles.routineButtonContainer}>
        <AppButton
          label="Rutina de hoy"
          variant="secondary"
          disabled={session.sync_status !== 'synced'}
          onPress={() =>
            router.push({ pathname: '/asistencia/rutina/[sessionId]', params: { sessionId: session.id } })
          }
        />
        {session.sync_status !== 'synced' ? (
          <Text style={[styles.routineHint, { color: colors.textMuted }]}>
            Sincronizá la sesión para poder armar la rutina.
          </Text>
        ) : null}
        <AppButton label="Marcar todos presentes" variant="secondary" onPress={handleMarkAllPresent} />
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No hay jugadores en el equipo todavía. Cargalos desde la tab Equipo.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const present = presence[item.id];
          const noteExpanded = expandedNotes.has(item.id);
          const hasNote = !!notes[item.id];
          return (
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={styles.rowHeader}>
                <Text style={[styles.rowName, { color: colors.text }]}>{item.full_name}</Text>
                {edited[item.id] ? (
                  <Text style={[styles.editedLabel, { color: colors.textMuted }]}>editado</Text>
                ) : null}
              </View>
              <View style={styles.pillRow}>
                <Pressable
                  onPress={() => handleMark(item.id, true)}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    present === true && { backgroundColor: colors.success, borderColor: colors.success },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillLabel,
                      { color: present === true ? colors.primaryText : colors.text },
                    ]}
                  >
                    Presente
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleMark(item.id, false)}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    present === false && { backgroundColor: colors.danger, borderColor: colors.danger },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillLabel,
                      { color: present === false ? colors.primaryText : colors.text },
                    ]}
                  >
                    Ausente
                  </Text>
                </Pressable>
              </View>
              {noteExpanded ? (
                <AppTextInput
                  value={notes[item.id] ?? ''}
                  onChangeText={(text) => handleNoteChange(item.id, text)}
                  onBlur={() => handleNoteBlur(item.id)}
                  placeholder="Nota (ej: llegó tarde)"
                  style={styles.noteInput}
                />
              ) : (
                <Pressable
                  onPress={() => setExpandedNotes((prev) => new Set(prev).add(item.id))}
                >
                  <Text style={[styles.addNoteLabel, { color: colors.link }]}>
                    {hasNote ? notes[item.id] : '+ Agregar nota'}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />

      <View style={styles.deleteContainer}>
        <AppButton
          label="Eliminar sesión"
          variant="secondary"
          onPress={confirmDeleteSession}
          loading={deleting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
  syncBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: spacing.lg,
    marginBottom: 0,
    borderRadius: radius,
    padding: spacing.md,
  },
  syncText: { fontSize: typography.caption, fontFamily: fonts.bold },
  syncAction: { fontSize: typography.caption, fontFamily: fonts.bold },
  detailsContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.xs },
  detailsRow: { flexDirection: 'row', gap: spacing.md },
  detailsField: { flex: 1 },
  smallLabel: { fontSize: typography.caption, fontFamily: fonts.bold, marginBottom: spacing.xs },
  routineButtonContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  routineHint: { fontSize: typography.caption, fontFamily: fonts.regular },
  listContent: { padding: spacing.lg, gap: spacing.sm },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center' },
  row: {
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowName: { fontSize: typography.body, fontFamily: fonts.bold },
  editedLabel: { fontSize: 11, fontFamily: fonts.regular, fontStyle: 'italic' },
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1,
    minHeight: minTouchSize,
    borderRadius: radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  addNoteLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  noteInput: { minHeight: 40, paddingVertical: spacing.xs },
  deleteContainer: { padding: spacing.lg, paddingTop: 0 },
});
