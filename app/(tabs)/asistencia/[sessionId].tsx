import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getSession, getRecordsForSession, setAttendance, type LocalSession } from '../../../src/db/local/attendance';
import { getCachedPlayers, type CachedPlayer } from '../../../src/db/local/playersCache';
import { useAttendanceSync } from '../../../src/hooks/useAttendanceSync';
import { colors, minTouchSize, spacing, typography } from '../../../src/theme';

type PresenceMap = Record<string, boolean | undefined>;

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function TomarAsistenciaScreen() {
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
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No encontramos esta sesión.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: formatDate(session.session_date) }} />
      <View style={styles.syncBanner}>
        {isSyncing ? (
          <Text style={styles.syncTextPending}>Sincronizando…</Text>
        ) : pendingCount > 0 ? (
          <Text style={styles.syncTextPending}>{pendingCount} cambios pendientes de subir</Text>
        ) : (
          <Text style={styles.syncTextOk}>Todo sincronizado</Text>
        )}
        <Pressable onPress={syncNow} disabled={isSyncing}>
          <Text style={styles.syncAction}>Sincronizar ahora</Text>
        </Pressable>
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No hay jugadores en el equipo todavía. Cargalos desde la tab Equipo.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const present = presence[item.id];
          return (
            <View style={styles.row}>
              <Text style={styles.rowName}>{item.full_name}</Text>
              <View style={styles.pillRow}>
                <Pressable
                  onPress={() => handleMark(item.id, true)}
                  style={[styles.pill, present === true && styles.pillPresent]}
                >
                  <Text style={[styles.pillLabel, present === true && styles.pillLabelSelected]}>
                    Presente
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleMark(item.id, false)}
                  style={[styles.pill, present === false && styles.pillAbsent]}
                >
                  <Text style={[styles.pillLabel, present === false && styles.pillLabelSelected]}>
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
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  error: { fontSize: typography.body, color: colors.danger, textAlign: 'center', padding: spacing.lg },
  syncBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    marginBottom: 0,
    borderRadius: 10,
    padding: spacing.md,
  },
  syncTextOk: { fontSize: typography.label, color: colors.success, fontWeight: '600' },
  syncTextPending: { fontSize: typography.label, color: colors.textMuted, fontWeight: '600' },
  syncAction: { fontSize: typography.label, color: colors.primary, fontWeight: '600' },
  listContent: { padding: spacing.lg, gap: spacing.sm },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body, color: colors.textMuted, textAlign: 'center' },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  rowName: { fontSize: typography.body, fontWeight: '600', color: colors.text },
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1,
    minHeight: minTouchSize,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  pillPresent: { backgroundColor: colors.success, borderColor: colors.success },
  pillAbsent: { backgroundColor: colors.danger, borderColor: colors.danger },
  pillLabel: { fontSize: typography.label, fontWeight: '600', color: colors.text },
  pillLabelSelected: { color: colors.primaryText },
});
