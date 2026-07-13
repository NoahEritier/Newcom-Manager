import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { getSession, getRecordsForSession, setAttendance, type LocalSession } from '../../../src/db/local/attendance';
import { getCachedPlayers, type CachedPlayer } from '../../../src/db/local/playersCache';
import { useAttendanceSync } from '../../../src/hooks/useAttendanceSync';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../../../src/theme';

type PresenceMap = Record<string, boolean | undefined>;

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
  const [loading, setLoading] = useState(true);
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
    const map: PresenceMap = {};
    for (const record of records) {
      map[record.player_id] = record.present === 1;
    }
    setPresence(map);
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
          return (
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <Text style={[styles.rowName, { color: colors.text }]}>{item.full_name}</Text>
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
            </View>
          );
        }}
      />
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
  routineButtonContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.xs },
  routineHint: { fontSize: typography.caption, fontFamily: fonts.regular },
  listContent: { padding: spacing.lg, gap: spacing.sm },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center' },
  row: {
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  rowName: { fontSize: typography.body, fontFamily: fonts.bold },
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
});
