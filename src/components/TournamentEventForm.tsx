import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TournamentInput } from '../db/supabase/tournaments';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';
import { DateField } from './DateField';

type Props = {
  initialValue?: TournamentInput;
  onSubmit: (input: TournamentInput) => Promise<void>;
  submitLabel: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function TournamentEventForm({ initialValue, onSubmit, submitLabel }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [startDate, setStartDate] = useState<string | null>(initialValue?.start_date ?? todayIso());
  const [endDate, setEndDate] = useState<string | null>(initialValue?.end_date ?? null);
  const [location, setLocation] = useState(initialValue?.location ?? '');
  const [address, setAddress] = useState(initialValue?.address ?? '');
  const [participatingTeams, setParticipatingTeams] = useState(initialValue?.participating_teams ?? '');
  const [fee, setFee] = useState(initialValue?.fee != null ? String(initialValue.fee) : '');
  const [isPaid, setIsPaid] = useState(initialValue?.is_paid ?? false);
  const [fundingSource, setFundingSource] = useState(initialValue?.funding_source ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    setLoading(true);
    try {
      const parsedFee = fee.trim() ? parseFloat(fee) : null;
      await onSubmit({
        title: trimmedTitle,
        start_date: startDate,
        end_date: endDate,
        location: location.trim() || null,
        address: address.trim() || null,
        participating_teams: participatingTeams.trim() || null,
        fee: Number.isFinite(parsedFee) ? parsedFee : null,
        is_paid: isPaid,
        funding_source: fundingSource.trim() || null,
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

      <View style={styles.row}>
        <View style={styles.rowField}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Fecha de inicio</Text>
          <DateField value={startDate} onChange={setStartDate} placeholder="Seleccionar fecha" />
        </View>
        <View style={styles.rowField}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Fecha de fin (opcional)</Text>
          <DateField value={endDate} onChange={setEndDate} placeholder="Si dura más de un día" />
        </View>
      </View>

      <Text style={[styles.label, { color: colors.textMuted }]}>Lugar</Text>
      <AppTextInput value={location} onChangeText={setLocation} placeholder="Nombre del predio/cancha" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Dirección (para abrir en Maps)</Text>
      <AppTextInput value={address} onChangeText={setAddress} placeholder="Dirección completa" />

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

      <Text style={[styles.label, { color: colors.textMuted }]}>¿Ya está pago?</Text>
      <View style={styles.pillRow}>
        <Pressable
          onPress={() => setIsPaid(true)}
          style={[
            styles.pill,
            { borderColor: colors.border, backgroundColor: colors.surface },
            isPaid && { backgroundColor: colors.success, borderColor: colors.success },
          ]}
        >
          <Text style={[styles.pillLabel, { color: isPaid ? colors.primaryText : colors.text }]}>
            Sí, pagado
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setIsPaid(false)}
          style={[
            styles.pill,
            { borderColor: colors.border, backgroundColor: colors.surface },
            !isPaid && { backgroundColor: colors.danger, borderColor: colors.danger },
          ]}
        >
          <Text style={[styles.pillLabel, { color: !isPaid ? colors.primaryText : colors.text }]}>
            Todavía no
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.label, { color: colors.textMuted }]}>¿De dónde sale la plata?</Text>
      <AppTextInput
        value={fundingSource}
        onChangeText={setFundingSource}
        placeholder="Ej: cuota de cada jugador, fondo del club..."
      />

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Text style={styles.spacer} />
      <AppButton
        label={submitLabel}
        onPress={handleSubmit}
        loading={loading}
        disabled={!title.trim() || !startDate}
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
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius,
    borderWidth: 1,
    justifyContent: 'center',
  },
  pillLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
});
