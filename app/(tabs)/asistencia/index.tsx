import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { getOrCreateSessionForDate, listRecentSessions, type SessionSummary } from '../../../src/db/local/attendance';
import { signOut } from '../../../src/db/supabase/auth';
import { useAttendanceSync } from '../../../src/hooks/useAttendanceSync';
import { useTeam } from '../../../src/hooks/useTeam';
import { colors, spacing, typography } from '../../../src/theme';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function AsistenciaScreen() {
  const { teamId, isLoading: teamLoading } = useTeam();
  const { isSyncing, pendingCount, error: syncError, syncNow } = useAttendanceSync(teamId);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [startingToday, setStartingToday] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!teamId) return;
    setLoadingSessions(true);
    setSessions(await listRecentSessions(teamId));
    setLoadingSessions(false);
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  async function handleStartToday() {
    if (!teamId) return;
    setStartingToday(true);
    try {
      const session = await getOrCreateSessionForDate(teamId, todayIso());
      router.push({ pathname: '/asistencia/[sessionId]', params: { sessionId: session.id } });
    } finally {
      setStartingToday(false);
    }
  }

  if (teamLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.header}>
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
          {syncError ? <Text style={styles.error}>{syncError}</Text> : null}

          <AppButton
            label="Tomar asistencia de hoy"
            onPress={handleStartToday}
            loading={startingToday}
          />

          <Text style={styles.sectionTitle}>Sesiones recientes</Text>
        </View>
      }
      ListEmptyComponent={
        !loadingSessions ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Todavía no tomaste asistencia.</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => router.push({ pathname: '/asistencia/[sessionId]', params: { sessionId: item.id } })}
        >
          <Text style={styles.rowDate}>{formatDate(item.session_date)}</Text>
          <Text style={styles.rowSummary}>
            {item.present_count} presentes · {item.absent_count} ausentes
            {item.sync_status !== 'synced' ? ' · sin subir' : ''}
          </Text>
        </Pressable>
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          <AppButton label="Cerrar sesión" variant="secondary" onPress={() => signOut()} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  listContent: { flexGrow: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, gap: spacing.md },
  syncBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
  },
  syncTextOk: { fontSize: typography.label, color: colors.success, fontWeight: '600' },
  syncTextPending: { fontSize: typography.label, color: colors.textMuted, fontWeight: '600' },
  syncAction: { fontSize: typography.label, color: colors.primary, fontWeight: '600' },
  error: { fontSize: typography.label, color: colors.danger },
  sectionTitle: { fontSize: typography.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body, color: colors.textMuted, textAlign: 'center' },
  row: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center',
    gap: 2,
  },
  rowDate: { fontSize: typography.body, fontWeight: '600', color: colors.text },
  rowSummary: { fontSize: typography.label, color: colors.textMuted },
  footer: { padding: spacing.lg },
});
