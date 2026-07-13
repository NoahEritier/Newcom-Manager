import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { getOrCreateSessionForDate, listRecentSessions, type SessionSummary } from '../../../src/db/local/attendance';
import { signOut } from '../../../src/db/supabase/auth';
import { useAttendanceSync } from '../../../src/hooks/useAttendanceSync';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, radius, spacing, typography, useTheme } from '../../../src/theme';
import { openWhatsAppMessage } from '../../../src/utils/whatsapp';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function handleShareTraining() {
  const message = `Entrenamos hoy (${formatDate(todayIso())}). ¡Te esperamos!`;
  openWhatsAppMessage(message);
}

export default function AsistenciaScreen() {
  const { colors } = useTheme();
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <View style={styles.header}>
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
          {syncError ? <Text style={[styles.error, { color: colors.danger }]}>{syncError}</Text> : null}

          <AppButton
            label="Tomar asistencia de hoy"
            onPress={handleStartToday}
            loading={startingToday}
          />
          <AppButton
            label="Avisar entrenamiento por WhatsApp"
            variant="secondary"
            onPress={handleShareTraining}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sesiones recientes</Text>
        </View>
      }
      ListEmptyComponent={
        !loadingSessions ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Todavía no tomaste asistencia.
            </Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() => router.push({ pathname: '/asistencia/[sessionId]', params: { sessionId: item.id } })}
        >
          <Text style={[styles.rowDate, { color: colors.text }]}>{formatDate(item.session_date)}</Text>
          <Text style={[styles.rowSummary, { color: colors.textMuted }]}>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1 },
  header: { padding: spacing.lg, gap: spacing.md },
  syncBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radius,
    padding: spacing.md,
  },
  syncText: { fontSize: typography.caption, fontFamily: fonts.bold },
  syncAction: { fontSize: typography.caption, fontFamily: fonts.bold },
  error: { fontSize: typography.caption, fontFamily: fonts.regular },
  sectionTitle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold, marginTop: spacing.sm },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center' },
  row: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    justifyContent: 'center',
    gap: 2,
  },
  rowDate: { fontSize: typography.body, fontFamily: fonts.bold },
  rowSummary: { fontSize: typography.caption, fontFamily: fonts.regular },
  footer: { padding: spacing.lg },
});
