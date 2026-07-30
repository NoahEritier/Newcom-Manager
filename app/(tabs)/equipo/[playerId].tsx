import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { DetailRow, DetailSection } from '../../../src/components/DetailView';
import { PlayerForm } from '../../../src/components/PlayerForm';
import { StatusBadge } from '../../../src/components/StatusBadge';
import {
  deactivatePlayer,
  getPlayer,
  updatePlayer,
  type Player,
  type PlayerInput,
} from '../../../src/db/supabase/players';
import { fonts, radius, spacing, typography, useTheme } from '../../../src/theme';
import { formatDate } from '../../../src/utils/formatDate';
import { openWhatsAppToNumber } from '../../../src/utils/whatsapp';

const MEDICAL_LABEL: Record<Player['medical_status'], string> = {
  vigente: 'Apto vigente',
  vencido: 'Apto vencido',
  unknown: 'Apto sin dato',
};

export default function EditarJugadorScreen() {
  const { colors } = useTheme();
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    return getPlayer(playerId)
      .then(setPlayer)
      .catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar el jugador.'))
      .finally(() => setLoading(false));
  }, [playerId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(input: PlayerInput) {
    await updatePlayer(playerId, input);
    await load();
    setEditing(false);
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

  function handleWhatsApp() {
    const number = player?.whatsapp || player?.phone;
    if (!number) return;
    openWhatsAppToNumber(number, `Hola ${player?.full_name?.split(' ')[0] ?? ''}!`);
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>
          {error ?? 'Jugador no encontrado.'}
        </Text>
      </View>
    );
  }

  if (editing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: player.full_name }} />
        <PlayerForm
          teamId={player.team_id}
          submitLabel="Guardar cambios"
          onSubmit={handleSubmit}
          initialValue={{
            full_name: player.full_name,
            jersey_number: player.jersey_number,
            phone: player.phone,
            whatsapp: player.whatsapp,
            birth_date: player.birth_date,
            medical_status: player.medical_status,
            medical_expiry: player.medical_expiry,
            notes: player.notes,
            photo_url: player.photo_url,
            emergency_contact_name: player.emergency_contact_name,
            emergency_contact_phone: player.emergency_contact_phone,
            practices_other_sport: player.practices_other_sport,
            other_sport_detail: player.other_sport_detail,
            has_injuries: player.has_injuries,
            injuries_detail: player.injuries_detail,
          }}
        />
        <View style={styles.cancelContainer}>
          <AppButton label="Cancelar" variant="secondary" onPress={() => setEditing(false)} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: player.full_name }} />
      <View style={styles.content}>
        {player.photo_url ? <Image source={{ uri: player.photo_url }} style={styles.photo} /> : null}

        <Text style={[styles.name, { color: colors.text }]}>
          {player.full_name}
          {player.jersey_number != null ? ` · #${player.jersey_number}` : ''}
        </Text>
        <StatusBadge
          label={MEDICAL_LABEL[player.medical_status]}
          tone={player.medical_status === 'vigente' ? 'success' : player.medical_status === 'vencido' ? 'danger' : 'default'}
        />

        <DetailSection title="Contacto">
          <DetailRow label="Teléfono" value={player.phone} />
          <DetailRow label="WhatsApp" value={player.whatsapp} />
        </DetailSection>

        <DetailSection title="Datos personales">
          <DetailRow label="Fecha de nacimiento" value={player.birth_date ? formatDate(player.birth_date) : null} />
          <DetailRow
            label="Vencimiento del apto"
            value={player.medical_expiry ? formatDate(player.medical_expiry) : null}
          />
        </DetailSection>

        {player.practices_other_sport || player.has_injuries ? (
          <DetailSection title="Salud y actividad">
            {player.practices_other_sport ? (
              <DetailRow label="Practica otro deporte" value={player.other_sport_detail ?? 'Sí'} />
            ) : null}
            {player.has_injuries ? (
              <DetailRow label="Lesiones" value={player.injuries_detail ?? 'Sí'} />
            ) : null}
          </DetailSection>
        ) : null}

        {player.emergency_contact_name || player.emergency_contact_phone ? (
          <DetailSection title="Contacto de emergencia">
            <DetailRow label="Nombre" value={player.emergency_contact_name} />
            <DetailRow label="Teléfono" value={player.emergency_contact_phone} />
          </DetailSection>
        ) : null}

        {player.notes ? (
          <DetailSection title="Notas">
            <Text style={[styles.notes, { color: colors.text }]}>{player.notes}</Text>
          </DetailSection>
        ) : null}

        <View style={styles.actions}>
          <AppButton label="Editar" onPress={() => setEditing(true)} />
          {player.whatsapp || player.phone ? (
            <AppButton label="Escribir por WhatsApp" variant="secondary" onPress={handleWhatsApp} />
          ) : null}
          <AppButton
            label="Eliminar jugador"
            variant="secondary"
            onPress={confirmDelete}
            loading={deleting}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
  photo: { width: 120, height: 120, borderRadius: radius, marginBottom: spacing.sm },
  name: { fontSize: typography.screenTitle, fontFamily: fonts.bold },
  notes: { fontSize: typography.body, fontFamily: fonts.regular },
  actions: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  cancelContainer: { padding: spacing.lg, paddingTop: 0 },
});
