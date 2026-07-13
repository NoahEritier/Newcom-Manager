import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { PlayerForm } from '../../../src/components/PlayerForm';
import {
  deactivatePlayer,
  getPlayer,
  updatePlayer,
  type Player,
  type PlayerInput,
} from '../../../src/db/supabase/players';
import { colors, spacing, typography } from '../../../src/theme';

export default function EditarJugadorScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getPlayer(playerId)
      .then(setPlayer)
      .catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar el jugador.'))
      .finally(() => setLoading(false));
  }, [playerId]);

  async function handleSubmit(input: PlayerInput) {
    await updatePlayer(playerId, input);
    router.back();
  }

  function confirmDelete() {
    Alert.alert(
      'Eliminar jugador',
      `¿Seguro que querés eliminar a ${player?.full_name}? Se va a quitar del equipo, pero se conserva su historial de asistencia.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deactivatePlayer(playerId);
      router.replace('/equipo');
    } catch (e) {
      setDeleting(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No pudimos eliminar el jugador.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Jugador no encontrado.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: player.full_name }} />
      <PlayerForm
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
        initialValue={{
          full_name: player.full_name,
          phone: player.phone,
          whatsapp: player.whatsapp,
          birth_date: player.birth_date,
          medical_status: player.medical_status,
          medical_expiry: player.medical_expiry,
          notes: player.notes,
        }}
      />
      <View style={styles.deleteContainer}>
        <AppButton
          label="Eliminar jugador"
          variant="secondary"
          onPress={confirmDelete}
          loading={deleting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  error: { fontSize: typography.body, color: colors.danger, textAlign: 'center', padding: spacing.lg },
  deleteContainer: { padding: spacing.lg, paddingTop: 0 },
});
