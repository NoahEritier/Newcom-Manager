import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { DetailRow, DetailSection } from '../../../src/components/DetailView';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { TournamentEventForm } from '../../../src/components/TournamentEventForm';
import { listMatchesForTournament, type Match } from '../../../src/db/supabase/matches';
import { listPlayers, type Player } from '../../../src/db/supabase/players';
import {
  deleteTournamentClub,
  listTournamentClubs,
  type TournamentClub,
} from '../../../src/db/supabase/tournamentClubs';
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
import { defaultTournamentWhatsappMessage } from '../../../src/utils/tournamentMessage';
import { registrationStatusLabel, tournamentTypeLabel } from '../../../src/utils/tournamentTypes';
import { formatDate, formatDateRange } from '../../../src/utils/formatDate';
import { openWhatsAppMessage } from '../../../src/utils/whatsapp';

export default function TorneoDetalleScreen() {
  const { colors } = useTheme();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const { teamId } = useTeam();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<TournamentClub[]>([]);
  const [attendeeIds, setAttendeeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingAttendees, setSavingAttendees] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [t, matchList, playerList, attendees, clubList] = await Promise.all([
        getTournament(tournamentId),
        listMatchesForTournament(tournamentId),
        listPlayers(teamId),
        listTournamentAttendeeIds(tournamentId),
        listTournamentClubs(tournamentId),
      ]);
      setTournament(t);
      setMatches(matchList);
      setPlayers(playerList);
      setAttendeeIds(new Set(attendees));
      setClubs(clubList);
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
    setEditing(false);
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

  function handleOpenClubMaps(address: string) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  }

  function confirmDeleteClub(club: TournamentClub) {
    Alert.alert(
      'Eliminar club',
      `¿Seguro que querés eliminar "${club.name}"? Los partidos que lo tenían cargado quedan sin sede asignada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteTournamentClub(club.id);
            await load();
          },
        },
      ]
    );
  }

  function handleShare() {
    if (!tournament) return;
    const message =
      tournament.whatsapp_message ||
      defaultTournamentWhatsappMessage(
        tournament.title,
        tournament.start_date,
        tournament.end_date,
        tournament.locality ?? ''
      );

    if (!tournament.flyer_url) {
      openWhatsAppMessage(message);
      return;
    }

    Alert.alert(
      'Enviar convocatoria con flyer',
      'Copiamos el mensaje al portapapeles. En la siguiente pantalla elegí WhatsApp para mandar la imagen, y pegá el mensaje en el chat.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: () => shareFlyerWithMessage(tournament.flyer_url as string, message) },
      ]
    );
  }

  async function shareFlyerWithMessage(flyerUrl: string, message: string) {
    setSharing(true);
    try {
      await Clipboard.setStringAsync(message);
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Error', 'Este dispositivo no puede compartir archivos.');
        return;
      }
      const localUri = `${FileSystem.cacheDirectory}flyer-${tournamentId}.jpg`;
      const { uri } = await FileSystem.downloadAsync(flyerUrl, localUri);
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Enviar flyer del torneo' });
    } catch {
      Alert.alert('Error', 'No pudimos preparar el flyer para compartir. Probá cuando tengas señal.');
    } finally {
      setSharing(false);
    }
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

  if (editing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: tournament.title }} />
        <TournamentEventForm
          teamId={tournament.team_id}
          submitLabel="Guardar cambios"
          onSubmit={handleSubmit}
          initialValue={{
            title: tournament.title,
            start_date: tournament.start_date,
            end_date: tournament.end_date,
            locality: tournament.locality,
            participating_teams: tournament.participating_teams,
            fee: tournament.fee,
            is_paid: tournament.is_paid,
            funding_source: tournament.funding_source,
            flyer_url: tournament.flyer_url,
            whatsapp_message: tournament.whatsapp_message,
            fee_mode: tournament.fee_mode,
            type: tournament.type,
            registration_status: tournament.registration_status,
          }}
        />
        <View style={styles.cancelContainer}>
          <AppButton label="Cancelar" variant="secondary" onPress={() => setEditing(false)} />
        </View>
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

          {tournament.flyer_url ? <Image source={{ uri: tournament.flyer_url }} style={styles.flyer} /> : null}

          <Text style={[styles.title, { color: colors.text }]}>{tournament.title}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge label={tournamentTypeLabel(tournament.type)} />
            <StatusBadge
              label={registrationStatusLabel(tournament.registration_status)}
              tone={tournament.registration_status === 'confirmado' ? 'success' : 'default'}
            />
          </View>

          <DetailSection>
            <DetailRow label="Fecha" value={formatDateRange(tournament.start_date, tournament.end_date)} />
            <DetailRow label="Localidad" value={tournament.locality} />
            <DetailRow label="Equipos que participan" value={tournament.participating_teams} />
            <DetailRow
              label="Tarifa de inscripción"
              value={
                tournament.fee != null
                  ? `${tournament.fee}${tournament.fee_mode ? (tournament.fee_mode === 'individual' ? ' por jugador' : ' por equipo') : ''} · ${tournament.is_paid ? 'Pagado' : 'Pendiente de pago'}`
                  : null
              }
            />
            <DetailRow label="¿De dónde sale la plata?" value={tournament.funding_source} />
          </DetailSection>

          <View style={styles.actions}>
            <AppButton label="Editar" onPress={() => setEditing(true)} />
            <AppButton
              label="Enviar convocatoria por WhatsApp"
              variant="secondary"
              onPress={handleShare}
              loading={sharing}
              disabled={sharing}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
            Clubes sede
          </Text>
          {clubs.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Todavía no cargaste clubes sede para este torneo.
            </Text>
          ) : (
            clubs.map((club) => (
              <View key={club.id} style={[styles.clubCard, { borderColor: colors.border }]}>
                <Text style={[styles.clubName, { color: colors.text }]}>{club.name}</Text>
                {club.address ? (
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>{club.address}</Text>
                ) : null}
                <View style={styles.clubActions}>
                  {club.address ? (
                    <Pressable onPress={() => handleOpenClubMaps(club.address as string)}>
                      <Text style={[styles.linkLabel, { color: colors.link }]}>Ver en Maps</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: '/torneos/club/[clubId]', params: { clubId: club.id } })
                    }
                  >
                    <Text style={[styles.linkLabel, { color: colors.link }]}>Editar</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmDeleteClub(club)}>
                    <Text style={[styles.linkLabel, { color: colors.danger }]}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
          <AppButton
            label="+ Agregar club sede"
            variant="secondary"
            onPress={() => router.push({ pathname: '/torneos/club/nuevo', params: { tournamentId } })}
          />

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
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

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
            {tournament.type === 'liga' ? 'Jornadas' : 'Partidos'}
          </Text>
          <AppButton
            label={tournament.type === 'liga' ? '+ Agregar jornada' : '+ Agregar partido'}
            onPress={() =>
              router.push({ pathname: '/torneos/partido/nuevo', params: { tournamentId } })
            }
          />
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted, paddingHorizontal: spacing.lg }]}>
          {tournament.type === 'liga'
            ? 'Todavía no cargaste jornadas para esta liga.'
            : 'Todavía no cargaste partidos para este torneo.'}
        </Text>
      }
      renderItem={({ item }) => {
        const club = clubs.find((c) => c.id === item.club_id);
        return (
          <Pressable
            style={[styles.matchRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push({ pathname: '/torneos/partido/[matchId]', params: { matchId: item.id } })}
          >
            <View style={styles.matchInfo}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                {formatDate(item.match_date)}
                {item.match_time ? ` · ${item.match_time.slice(0, 5)}` : ''} vs {item.opponent}
              </Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                {club ? club.name : 'Sin club asignado'}
                {item.court_name ? ` · ${item.court_name}` : ''}
              </Text>
              {item.status === 'jugado' ? (
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  {item.result ?? 'Sin resultado cargado'}
                </Text>
              ) : null}
            </View>
            <StatusBadge
              label={item.status === 'jugado' ? 'Jugado' : 'Programado'}
              tone={item.status === 'jugado' ? 'success' : 'default'}
            />
          </Pressable>
        );
      }}
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
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1 },
  headerBlock: { padding: spacing.lg, gap: spacing.sm },
  flyer: { width: '100%', aspectRatio: 1.4, borderRadius: radius, marginBottom: spacing.sm },
  title: { fontSize: typography.screenTitle, fontFamily: fonts.bold },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
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
  clubCard: { borderWidth: 1, borderRadius: radius, padding: spacing.sm, marginBottom: spacing.sm, gap: 2 },
  clubName: { fontSize: typography.body, fontFamily: fonts.bold },
  clubActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  linkLabel: { fontSize: typography.caption, fontFamily: fonts.bold, minHeight: minTouchSize, textAlignVertical: 'center' },
  matchRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  matchInfo: { flex: 1, gap: 2 },
  rowTitle: { fontSize: typography.body, fontFamily: fonts.bold },
  rowSub: { fontSize: typography.caption, fontFamily: fonts.regular },
  footer: { padding: spacing.lg },
  cancelContainer: { padding: spacing.lg, paddingTop: 0 },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
