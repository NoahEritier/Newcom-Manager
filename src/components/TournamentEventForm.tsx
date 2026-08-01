import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TournamentInput } from '../db/supabase/tournaments';
import { uploadTournamentFlyer } from '../db/supabase/storage';
import { fonts, radius, spacing, typography, useTheme } from '../theme';
import { defaultTournamentWhatsappMessage } from '../utils/tournamentMessage';
import {
  FEE_MODES,
  REGISTRATION_STATUSES,
  TOURNAMENT_TYPES,
  type FeeMode,
  type RegistrationStatus,
  type TournamentType,
} from '../utils/tournamentTypes';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';
import { DateField } from './DateField';
import { Dropdown } from './Dropdown';
import { YesNoPills } from './YesNoPills';

type Props = {
  teamId: string;
  initialValue?: TournamentInput;
  onSubmit: (input: TournamentInput) => Promise<void>;
  submitLabel: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function TournamentEventForm({ teamId, initialValue, onSubmit, submitLabel }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [startDate, setStartDate] = useState<string | null>(initialValue?.start_date ?? todayIso());
  const [endDate, setEndDate] = useState<string | null>(initialValue?.end_date ?? null);
  const [location, setLocation] = useState(initialValue?.location ?? '');
  const [address, setAddress] = useState(initialValue?.address ?? '');
  const [participatingTeams, setParticipatingTeams] = useState(initialValue?.participating_teams ?? '');
  const [fee, setFee] = useState(initialValue?.fee != null ? String(initialValue.fee) : '');
  const [feeMode, setFeeMode] = useState<FeeMode | null>(initialValue?.fee_mode ?? null);
  const [isPaid, setIsPaid] = useState(initialValue?.is_paid ?? false);
  const [type, setType] = useState<TournamentType>(initialValue?.type ?? 'encuentro');
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>(
    initialValue?.registration_status ?? 'pendiente'
  );
  const [fundingSource, setFundingSource] = useState(initialValue?.funding_source ?? '');
  const [flyerUrl, setFlyerUrl] = useState(initialValue?.flyer_url ?? '');
  const [uploadingFlyer, setUploadingFlyer] = useState(false);
  const [flyerError, setFlyerError] = useState<string | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState(
    initialValue?.whatsapp_message ?? defaultTournamentWhatsappMessage(title, startDate ?? todayIso(), endDate, location)
  );
  const [messageTouched, setMessageTouched] = useState(initialValue?.whatsapp_message != null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLeague = type === 'liga';
  const dateRangeInvalid = !!(endDate && startDate && endDate < startDate);

  // Mientras el coach no haya editado el mensaje a mano, lo mantenemos
  // sincronizado con los datos del torneo — apenas lo toca, dejamos de tocarlo.
  useEffect(() => {
    if (messageTouched) return;
    setWhatsappMessage(defaultTournamentWhatsappMessage(title, startDate ?? todayIso(), endDate, location));
  }, [title, startDate, endDate, location, messageTouched]);

  function handleMessageChange(text: string) {
    setMessageTouched(true);
    setWhatsappMessage(text);
  }

  async function pickAndUploadFlyer(fromCamera: boolean) {
    setFlyerError(null);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFlyerError('Necesitamos permiso para acceder a la cámara/galería.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });

    if (result.canceled || !result.assets?.[0]) return;

    setUploadingFlyer(true);
    try {
      const url = await uploadTournamentFlyer(teamId, result.assets[0].uri);
      setFlyerUrl(url);
    } catch {
      setFlyerError('No se pudo subir el flyer, probá cuando tengas señal.');
    } finally {
      setUploadingFlyer(false);
    }
  }

  function chooseFlyerSource() {
    Alert.alert('Flyer del torneo', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Elegir de la galería', onPress: () => pickAndUploadFlyer(false) },
      { text: 'Sacar foto', onPress: () => pickAndUploadFlyer(true) },
    ]);
  }

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('El nombre del torneo es obligatorio.');
      return;
    }
    if (!startDate) {
      setError('La fecha de inicio es obligatoria.');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const parsedFee = fee.trim() ? parseFloat(fee) : null;
      await onSubmit({
        title: trimmedTitle,
        start_date: startDate,
        end_date: endDate,
        location: isLeague ? null : location.trim() || null,
        address: isLeague ? null : address.trim() || null,
        participating_teams: participatingTeams.trim() || null,
        fee: Number.isFinite(parsedFee) ? parsedFee : null,
        fee_mode: feeMode,
        is_paid: isPaid,
        funding_source: fundingSource.trim() || null,
        flyer_url: flyerUrl.trim() || null,
        whatsapp_message: whatsappMessage.trim() || null,
        type,
        registration_status: registrationStatus,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.label, { color: colors.textMuted }]}>Nombre del torneo</Text>
      <AppTextInput value={title} onChangeText={setTitle} placeholder="Ej: Copa Newcom Verano" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Tipo</Text>
      <Dropdown
        value={type}
        options={TOURNAMENT_TYPES}
        onChange={(v) => setType(v as TournamentType)}
        title="Tipo de torneo"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Estado de inscripción</Text>
      <Dropdown
        value={registrationStatus}
        options={REGISTRATION_STATUSES}
        onChange={(v) => setRegistrationStatus(v as RegistrationStatus)}
        title="Estado de inscripción"
      />

      <View style={styles.row}>
        <View style={styles.rowField}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {isLeague ? 'Inicio de la temporada' : 'Fecha de inicio'}
          </Text>
          <DateField value={startDate} onChange={setStartDate} placeholder="Seleccionar fecha" />
        </View>
        <View style={styles.rowField}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {isLeague ? 'Fin de la temporada (opcional)' : 'Fecha de fin (opcional)'}
          </Text>
          <DateField value={endDate} onChange={setEndDate} placeholder="Si dura más de un día" />
        </View>
      </View>
      {dateRangeInvalid ? (
        <Text style={[styles.error, { color: colors.danger }]}>
          La fecha de fin no puede ser anterior a la fecha de inicio.
        </Text>
      ) : null}

      {isLeague ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Cada jornada de la liga se juega en su propia cancha/localidad — el lugar y la
          dirección se cargan partido por partido, no acá.
        </Text>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.textMuted }]}>Lugar</Text>
          <AppTextInput value={location} onChangeText={setLocation} placeholder="Nombre del predio/cancha" />

          <Text style={[styles.label, { color: colors.textMuted }]}>Dirección (para abrir en Maps)</Text>
          <AppTextInput value={address} onChangeText={setAddress} placeholder="Dirección completa" />
        </>
      )}

      <Text style={[styles.label, { color: colors.textMuted }]}>Equipos que participan</Text>
      <AppTextInput
        value={participatingTeams}
        onChangeText={setParticipatingTeams}
        placeholder="Ej: Newcom Sur, Club Atlético, ..."
        multiline
        numberOfLines={3}
        style={styles.multilineInput}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Tarifa de inscripción</Text>
      <AppTextInput value={fee} onChangeText={setFee} placeholder="Monto" keyboardType="decimal-pad" />

      <Text style={[styles.label, { color: colors.textMuted }]}>¿La tarifa es por jugador o por equipo?</Text>
      <Dropdown
        value={feeMode ?? ''}
        options={[{ value: '', label: 'Sin especificar' }, ...FEE_MODES]}
        onChange={(v) => setFeeMode((v || null) as FeeMode | null)}
        placeholder="Sin especificar"
        title="Modalidad de tarifa"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>¿Ya está pago?</Text>
      <YesNoPills value={isPaid} onChange={setIsPaid} yesLabel="Sí, pagado" noLabel="Todavía no" />

      <Text style={[styles.label, { color: colors.textMuted }]}>¿De dónde sale la plata?</Text>
      <AppTextInput
        value={fundingSource}
        onChangeText={setFundingSource}
        placeholder="Ej: cuota de cada jugador, fondo del club..."
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Flyer del torneo (opcional)</Text>
      {flyerUrl ? <Image source={{ uri: flyerUrl }} style={styles.flyerPreview} /> : null}
      <AppButton
        label={uploadingFlyer ? 'Subiendo...' : flyerUrl ? 'Cambiar flyer' : 'Agregar flyer'}
        variant="secondary"
        onPress={chooseFlyerSource}
        loading={uploadingFlyer}
        disabled={uploadingFlyer}
      />
      {flyerError ? <Text style={[styles.error, { color: colors.danger }]}>{flyerError}</Text> : null}

      <Text style={[styles.label, { color: colors.textMuted }]}>Mensaje de WhatsApp para la convocatoria</Text>
      <AppTextInput
        value={whatsappMessage}
        onChangeText={handleMessageChange}
        placeholder="Mensaje que se manda al grupo"
        multiline
        numberOfLines={4}
        style={styles.multilineInput}
      />

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <View style={styles.spacer} />
      <AppButton
        label={submitLabel}
        onPress={handleSubmit}
        loading={loading}
        disabled={!title.trim() || !startDate || dateRangeInvalid}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.lg },
  label: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  rowField: { flex: 1 },
  multilineInput: { minHeight: 72, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  hint: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.xs },
  flyerPreview: { width: 160, height: 160, borderRadius: radius, marginBottom: spacing.sm },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
});
