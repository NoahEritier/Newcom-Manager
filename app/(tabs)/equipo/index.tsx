import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { listPlayers, type Player } from '../../../src/db/supabase/players';
import { useTeam } from '../../../src/hooks/useTeam';
import { colors, spacing, typography } from '../../../src/theme';

const MEDICAL_LABEL: Record<Player['medical_status'], string> = {
  vigente: 'Apto vigente',
  vencido: 'Apto vencido',
  unknown: 'Sin apto cargado',
};

const MEDICAL_COLOR: Record<Player['medical_status'], string> = {
  vigente: colors.success,
  vencido: colors.danger,
  unknown: colors.textMuted,
};

export default function EquipoScreen() {
  const { teamId, isLoading: teamLoading, error: teamError } = useTeam();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (teamLoading || (loading && players.length === 0)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (teamError || error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{teamError ?? error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={players}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppButton label="+ Agregar jugador" onPress={() => router.push('/equipo/nuevo')} />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Todavía no cargaste jugadores.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => router.push({ pathname: '/equipo/[playerId]', params: { playerId: item.id } })}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowName}>{item.full_name}</Text>
            <Text style={[styles.rowMedical, { color: MEDICAL_COLOR[item.medical_status] }]}>
              {MEDICAL_LABEL[item.medical_status]}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  listContent: { flexGrow: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body, color: colors.textMuted, textAlign: 'center' },
  row: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center',
  },
  rowText: { gap: 2 },
  rowName: { fontSize: typography.body, fontWeight: '600', color: colors.text },
  rowMedical: { fontSize: typography.label },
  error: { fontSize: typography.body, color: colors.danger, textAlign: 'center', padding: spacing.lg },
});
