import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { TournamentEventForm } from '../../../src/components/TournamentEventForm';
import { listMatchesForTournament, type Match } from '../../../src/db/supabase/matches';
import { listPlayers, type Player } from '../../../src/db/supabase/players';
import {
  deleteTournament,
  getTournament,
  listTournamentAttendeeIds,
  setTournamentAttendees,
  updateTournament,
  type Tournament,
  type TournamentInput,
} from '../../../src/db/supabase/tournaments';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../../../src/theme';
import { openWhatsAppMessage } from '../../../src/utils/whatsapp';

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function TorneoDetalleScreen() {
  const { colors } = useTheme();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const { teamId } = useTeam();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendeeIds, setAttendeeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingAttendees, setSavingAttendees] = useState(false);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [t, matchList, playerList, attendees] = await Promise.all([
        getTournament(tournamentId),
        listMatchesForTournament(tournamentId),
        listPlayers(teamId),
        listTournamentAttendeeIds(tournamentId),
      ]);
      setTournament(t);
      setMatches(matchList);
      setPlayers(playerList);
      setAttendeeIds(new Set(attendees));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar el torneo.');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, teamId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSubmit(input: TournamentInput) {
    await updateTournament(tournamentId, input);
    await load();
  }

  function confirmDelete() {
    Alert.alert(
      'Eliminar torneo',
      `¿Seguro que querés eliminar "${tournament?.title}"? Se van a eliminar también sus partidos. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTournament(tournamentId);
      router.replace('/torneos');
    } catch (e) {
      setDeleting(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No pudimos eliminar el torneo.');
    }
  }

  async function toggleAttendee(playerId: string) {
    const next = new Set(attendeeIds);
    if (next.has(playerId)) next.delete(playerId);
    else next.add(playerId);
    setAttendeeIds(next);
    setSavingAttendees(true);
    try {
      await setTournamentAttendees(tournamentId, Array.from(next));
    } finally {
      setSavingAttendees(false);
    }
  }

  function handleShare() {
    if (!tournament) return;
    const parts = [
      `Convocatoria: ${tournament.title}`,
      `Fecha: ${formatDate(tournament.start_date)}${tournament.end_date ? ` al ${formatDate(tournament.end_date)}` : ''}`,
    ];
    if (tournament.location) parts.push(`Lugar: ${tournament.location}`);
    if (tournament.fee) parts.push(`Cuota: ${tournament.fee}`);
    openWhatsAppMessage(parts.join('\n'));
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !tournament) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{error ?? 'Torneo no encontrado.'}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={matches}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          <Stack.Screen options={{ title: tournament.title }} />
          <AppButton label="Enviar convocatoria por WhatsApp" variant="secondary" onPress={handleShare} />

          <TournamentEventForm
            submitLabel="Guardar datos del torneo"
            onSubmit={handleSubmit}
            initialValue={{
              title: tournament.title,
              start_date: tournament.start_date,
              end_date: tournament.end_date,
              location: tournament.location,
              address: tournament.address,
              participating_teams: tournament.participating_teams,
              fee: tournament.fee,
              is_paid: tournament.is_paid,
              funding_source: tournament.funding_source,
            }}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quiénes van {savingAttendees ? '(guardando...)' : `(${attendeeIds.size})`}
          </Text>
          {players.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No hay jugadores cargados en el equipo.
            </Text>
          ) : (
            players.map((p) => {
              const checked = attendeeIds.has(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => toggleAttendee(p.id)}
                  style={[styles.attendeeRow, { borderBottomColor: colors.border }]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: colors.border },
                      checked && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  />
                  <Text style={[styles.attendeeName, { color: colors.text }]}>{p.full_name}</Text>
                </Pressable>
              );
            })
          )}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>Partidos</Text>
          <AppButton
            label="+ Agregar partido"
            onPress={() =>
              router.push({ pathname: '/torneos/partido/nuevo', params: { tournamentId } })
            }
          />
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted, paddingHorizontal: spacing.lg }]}>
          Todavía no cargaste partidos para este torneo.
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.matchRow, { borderBottomColor: colors.border }]}
          onPress={() => router.push({ pathname: '/torneos/partido/[matchId]', params: { matchId: item.id } })}
        >
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            {formatDate(item.match_date)}
            {item.match_time ? ` · ${item.match_time.slice(0, 5)}` : ''} vs {item.opponent}
          </Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            {item.result ?? 'Sin resultado cargado'}
          </Text>
        </Pressable>
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          <AppButton
            label="Eliminar torneo"
            variant="secondary"
            onPress={confirmDelete}
            loading={deleting}
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1 },
  headerBlock: { padding: spacing.lg, gap: spacing.md },
  sectionTitle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular },
  attendeeRow: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2 },
  attendeeName: { fontSize: typography.body, fontFamily: fonts.regular },
  matchRow: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    justifyContent: 'center',
    gap: 2,
  },
  rowTitle: { fontSize: typography.body, fontFamily: fonts.bold },
  rowSub: { fontSize: typography.caption, fontFamily: fonts.regular },
  footer: { padding: spacing.lg },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
