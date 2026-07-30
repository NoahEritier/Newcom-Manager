import * as ImagePicker from 'expo-image-picker';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../../../../src/components/AppButton';
import { StatReviewForm } from '../../../../../../src/components/StatReviewForm';
import {
  getOrCreateStatSheet,
  getStatSheetForMatch,
  listPlayerMatchStats,
  updateStatSheetStatus,
  upsertPlayerMatchStats,
  type PlayerMatchStats,
  type PlayerMatchStatsCounts,
} from '../../../../../../src/db/supabase/matchStats';
import { getPlayer, type Player } from '../../../../../../src/db/supabase/players';
import { scanStatSheetImage, type ScannedStatRow } from '../../../../../../src/db/supabase/statScan';
import { uploadStatSheetImage } from '../../../../../../src/db/supabase/storage';
import { fonts, radius, spacing, typography, useTheme } from '../../../../../../src/theme';
import type { StatFieldKey } from '../../../../../../src/utils/statFields';

type Mode = 'choose' | 'review';

// El escaneo con AWS Textract requiere secrets configurados en el proyecto
// de Supabase (ver supabase/functions/scan-stat-sheet). Hasta que se
// deployee con esas credenciales, se esconde el botón de escaneo para no
// mostrar una acción que sabemos que va a fallar — la carga manual no
// depende de esto y funciona siempre. Cambiar a `true` una vez deployada
// la función con AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_REGION.
const STAT_SCAN_ENABLED = false;

export default function EscanearEstadisticasScreen() {
  const { colors } = useTheme();
  const { matchId, playerId } = useLocalSearchParams<{ matchId: string; playerId: string }>();

  const [player, setPlayer] = useState<Player | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [existingStats, setExistingStats] = useState<PlayerMatchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('choose');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [recognized, setRecognized] = useState<Record<StatFieldKey, ScannedStatRow> | null>(null);
  const [scannedImageUrl, setScannedImageUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getPlayer(playerId);
      const sheet = await getOrCreateStatSheet(matchId);
      const stats = await listPlayerMatchStats(sheet.id);
      setPlayer(p);
      setSheetId(sheet.id);
      setExistingStats(stats.find((s) => s.player_id === playerId) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [matchId, playerId]);

  useEffect(() => {
    load();
  }, [load]);

  async function pickAndScan(fromCamera: boolean) {
    if (!player) return;
    setScanError(null);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setScanError('Necesitamos permiso para acceder a la cámara/galería.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });

    if (result.canceled || !result.assets?.[0]) return;

    setScanning(true);
    try {
      // team_id no lo tenemos a mano acá directo, pero player.team_id ya lo trae.
      const url = await uploadStatSheetImage(player.team_id, result.assets[0].uri);
      const scanResult = await scanStatSheetImage(url);
      const byKey = {} as Record<StatFieldKey, ScannedStatRow>;
      for (const row of scanResult.rows) {
        byKey[row.key] = row;
      }
      setRecognized(byKey);
      setScannedImageUrl(url);
      setMode('review');
    } catch {
      setScanError('No se pudo escanear la planilla. Probá cuando tengas señal, o cargá los datos a mano.');
    } finally {
      setScanning(false);
    }
  }

  function chooseSource() {
    Alert.alert('Foto de la planilla', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Elegir de la galería', onPress: () => pickAndScan(false) },
      { text: 'Sacar foto', onPress: () => pickAndScan(true) },
    ]);
  }

  function loadManually() {
    setRecognized(null);
    setScannedImageUrl(null);
    setMode('review');
  }

  async function handleConfirm(counts: PlayerMatchStatsCounts) {
    if (!sheetId) return;
    await upsertPlayerMatchStats(sheetId, playerId, counts, scannedImageUrl);
    // Primera carga de la planilla: pasa de 'borrador' a 'revisada'. Si ya
    // estaba escaneada/revisada/confirmada, no la retrocedemos.
    const sheet = await getStatSheetForMatch(matchId);
    if (sheet?.status === 'borrador') {
      await updateStatSheetStatus(sheetId, 'revisada');
    }
    router.back();
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !player || !sheetId) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{error ?? 'Jugador no encontrado.'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: player.full_name }} />

      {mode === 'choose' ? (
        <View style={styles.chooseContent}>
          <Text style={[styles.title, { color: colors.text }]}>{player.full_name}</Text>
          {existingStats ? (
            <Text style={[styles.note, { color: colors.textMuted }]}>
              Ya hay datos cargados para este jugador — escanear o cargar de nuevo los va a reemplazar.
            </Text>
          ) : null}
          {existingStats?.scanned_image_url ? (
            <Image source={{ uri: existingStats.scanned_image_url }} style={styles.preview} />
          ) : null}

          {STAT_SCAN_ENABLED ? (
            <AppButton
              label="Escanear planilla"
              onPress={chooseSource}
              loading={scanning}
              disabled={scanning}
            />
          ) : null}
          <AppButton
            label="Cargar datos a mano"
            onPress={loadManually}
            disabled={scanning}
          />
          {scanError ? <Text style={[styles.error, { color: colors.danger }]}>{scanError}</Text> : null}
        </View>
      ) : (
        <StatReviewForm
          recognized={recognized}
          initialCounts={existingStats ?? undefined}
          confirmLabel="Confirmar datos"
          onConfirm={handleConfirm}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chooseContent: { padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: typography.screenTitle, fontFamily: fonts.bold, marginBottom: spacing.sm },
  note: { fontSize: typography.caption, fontFamily: fonts.regular },
  preview: { width: 160, height: 160, borderRadius: radius, marginBottom: spacing.sm },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.sm },
});
