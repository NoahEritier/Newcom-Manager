import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { AppTextInput } from '../../../src/components/AppTextInput';
import { listPlayers, type Player } from '../../../src/db/supabase/players';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, radius, spacing, typography, useTheme, type ThemeColors } from '../../../src/theme';
import { openWhatsAppMessage } from '../../../src/utils/whatsapp';

const FREE_PLAN_PLAYER_LIMIT = 15;

const MEDICAL_LABEL: Record<Player['medical_status'], string> = {
  vigente: 'Apto vigente',
  vencido: 'Apto vencido',
  unknown: 'Sin apto cargado',
};

const GENDER_LABEL: Record<string, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  mixto: 'Mixto',
};

function medicalColor(status: Player['medical_status'], colors: ThemeColors) {
  if (status === 'vigente') return colors.success;
  if (status === 'vencido') return colors.danger;
  return colors.textMuted;
}

export default function EquipoScreen() {
  const { colors } = useTheme();
  const { team, teamId, isLoading: teamLoading, error: teamError } = useTeam();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadPlayers = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPlayers(teamId);
      setPlayers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar los jugadores.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, [loadPlayers])
  );

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return players;
    return players.filter((p) => p.full_name.toLowerCase().includes(query));
  }, [players, search]);

  function handleAddPlayer() {
    if (players.length >= FREE_PLAN_PLAYER_LIMIT) {
      Alert.alert(
        'Límite del plan gratuito',
        `Tu plan actual permite hasta ${FREE_PLAN_PLAYER_LIMIT} jugadores. Para agregar más, actualizá al plan Pro.`,
        [{ text: 'Entendido' }]
      );
      return;
    }
    router.push('/equipo/nuevo');
  }

  function handleShareGroup() {
    openWhatsAppMessage(`Hola equipo${team?.name ? ` ${team.name}` : ''}, ¿cómo andan?`);
  }

  if (teamLoading || (loading && players.length === 0)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (teamError || error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{teamError ?? error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredPlayers}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/equipo/datos')} style={styles.teamInfo}>
            <Text style={[styles.teamName, { color: colors.text }]}>{team?.name}</Text>
            <Text style={[styles.teamSub, { color: colors.textMuted }]}>
              {[team?.category, team?.gender ? GENDER_LABEL[team.gender] : null]
                .filter(Boolean)
                .join(' · ') || 'Tocá para completar los datos del equipo'}
            </Text>
          </Pressable>

          <AppTextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar jugador por nombre"
            autoCapitalize="none"
          />

          <AppButton label="+ Agregar jugador" onPress={handleAddPlayer} />
          <AppButton
            label="Avisar al grupo por WhatsApp"
            variant="secondary"
            onPress={handleShareGroup}
          />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {search ? 'No encontramos jugadores con ese nombre.' : 'Todavía no cargaste jugadores.'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() => router.push({ pathname: '/equipo/[playerId]', params: { playerId: item.id } })}
        >
          <View style={styles.rowText}>
            <Text style={[styles.rowName, { color: colors.text }]}>{item.full_name}</Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: medicalColor(item.medical_status, colors) + '22' },
            ]}
          >
            <Text style={[styles.badgeLabel, { color: medicalColor(item.medical_status, colors) }]}>
              {MEDICAL_LABEL[item.medical_status]}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1 },
  header: { padding: spacing.lg, gap: spacing.md },
  teamInfo: { gap: 2 },
  teamName: { fontSize: typography.screenTitle, fontFamily: fonts.bold },
  teamSub: { fontSize: typography.caption, fontFamily: fonts.regular },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center' },
  row: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowText: { gap: 2, flex: 1 },
  rowName: { fontSize: typography.body, fontFamily: fonts.bold },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius },
  badgeLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
