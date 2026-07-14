import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { WeekCalendar } from '../../../src/components/WeekCalendar';
import {
  getOrCreateSessionForDate,
  listRecentSessions,
  listSessionDatesForTeam,
  type SessionSummary,
} from '../../../src/db/local/attendance';
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
  const { team, teamId, isLoading: teamLoading } = useTeam();
  const { isSyncing, pendingCount, error: syncError, syncNow } = useAttendanceSync(teamId);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionDates, setSessionDates] = useState<Set<string>>(new Set());
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [openingDate, setOpeningDate] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!teamId) return;
    setLoadingSessions(true);
    const [recent, dates] = await Promise.all([
      listRecentSessions(teamId),
      listSessionDatesForTeam(teamId),
    ]);
    setSessions(recent);
    setSessionDates(new Set(dates));
    setLoadingSessions(false);
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  async function handleOpenDate(dateIso: string) {
    if (!teamId) return;
    setOpeningDate(dateIso);
    try {
      const session = await getOrCreateSessionForDate(teamId, dateIso, team?.default_location ?? null);
      router.push({ pathname: '/asistencia/[sessionId]', params: { sessionId: session.id } });
    } finally {
      setOpeningDate(null);
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

          <WeekCalendar
            trainingDays={team?.training_days ?? []}
            selectedDate={todayIso()}
            onSelectDate={handleOpenDate}
            sessionDates={sessionDates}
          />
          {openingDate ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <AppButton label="Tomar asistencia de hoy" onPress={() => handleOpenDate(todayIso())} />
          )}
          <AppButton
            label="Avisar entrenamiento por WhatsApp"
            variant="secondary"
            onPress={handleShareTraining}
          />
          <AppButton
            label="Ver % de asistencia"
            variant="secondary"
            onPress={() => router.push('/asistencia/porcentaje')}
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
          <Text style={[styles.rowDate, { color: colors.text }]}>
            {formatDate(item.session_date)}
            {item.session_time ? ` · ${item.session_time.slice(0, 5)}` : ''}
          </Text>
          <Text style={[styles.rowSummary, { color: colors.textMuted }]}>
            {item.present_count} presentes · {item.absent_count} ausentes
            {item.sync_status !== 'synced' ? ' · sin subir' : ''}
          </Text>
        </Pressable>
      )}
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
});
