import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { MedicalStatus, PlayerInput } from '../db/supabase/players';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';
import { DateField } from './DateField';

type Props = {
  initialValue?: PlayerInput;
  onSubmit: (input: PlayerInput) => Promise<void>;
  submitLabel: string;
};

const MEDICAL_OPTIONS: { value: MedicalStatus; label: string }[] = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'unknown', label: 'Sin dato' },
];

export function PlayerForm({ initialValue, onSubmit, submitLabel }: Props) {
  const { colors } = useTheme();
  const [fullName, setFullName] = useState(initialValue?.full_name ?? '');
  const [phone, setPhone] = useState(initialValue?.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(initialValue?.whatsapp ?? '');
  const [birthDate, setBirthDate] = useState<string | null>(initialValue?.birth_date ?? null);
  const [medicalStatus, setMedicalStatus] = useState<MedicalStatus>(
    initialValue?.medical_status ?? 'unknown'
  );
  const [medicalExpiry, setMedicalExpiry] = useState<string | null>(
    initialValue?.medical_expiry ?? null
  );
  const [notes, setNotes] = useState(initialValue?.notes ?? '');
  const [photoUrl, setPhotoUrl] = useState(initialValue?.photo_url ?? '');
  const [emergencyName, setEmergencyName] = useState(initialValue?.emergency_contact_name ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(initialValue?.emergency_contact_phone ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError('El nombre es obligatorio.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        full_name: trimmedName,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        birth_date: birthDate,
        medical_status: medicalStatus,
        medical_expiry: medicalExpiry,
        notes: notes.trim() || null,
        photo_url: photoUrl.trim() || null,
        emergency_contact_name: emergencyName.trim() || null,
        emergency_contact_phone: emergencyPhone.trim() || null,
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
      <Text style={[styles.label, { color: colors.textMuted }]}>Nombre completo</Text>
      <AppTextInput value={fullName} onChangeText={setFullName} placeholder="Nombre y apellido" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Teléfono</Text>
      <AppTextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="+54 9 11 1234 5678"
        keyboardType="phone-pad"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>WhatsApp</Text>
      <AppTextInput
        value={whatsapp}
        onChangeText={setWhatsapp}
        placeholder="+54 9 11 1234 5678"
        keyboardType="phone-pad"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Fecha de nacimiento</Text>
      <DateField
        value={birthDate}
        onChange={setBirthDate}
        placeholder="Seleccionar fecha de nacimiento"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Apto médico</Text>
      <View style={styles.pillRow}>
        {MEDICAL_OPTIONS.map((option) => {
          const selected = option.value === medicalStatus;
          return (
            <Pressable
              key={option.value}
              onPress={() => setMedicalStatus(option.value)}
              style={[
                styles.pill,
                { borderColor: colors.border, backgroundColor: colors.surface },
                selected && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.pillLabel, { color: selected ? colors.primaryText : colors.text }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: colors.textMuted }]}>Vencimiento del apto</Text>
      <DateField
        value={medicalExpiry}
        onChange={setMedicalExpiry}
        placeholder="Seleccionar fecha de vencimiento"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Contacto de emergencia</Text>
      <AppTextInput
        value={emergencyName}
        onChangeText={setEmergencyName}
        placeholder="Nombre del contacto"
      />
      <View style={styles.smallSpacer} />
      <AppTextInput
        value={emergencyPhone}
        onChangeText={setEmergencyPhone}
        placeholder="Teléfono del contacto"
        keyboardType="phone-pad"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Link de foto (opcional)</Text>
      <AppTextInput
        value={photoUrl}
        onChangeText={setPhotoUrl}
        placeholder="https://..."
        keyboardType="url"
        autoCapitalize="none"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Notas</Text>
      <AppTextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notas libres (alergias, observaciones, etc.)"
        multiline
        numberOfLines={4}
        style={styles.notesInput}
      />

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <View style={styles.spacer} />
      <AppButton
        label={submitLabel}
        onPress={handleSubmit}
        loading={loading}
        disabled={!fullName.trim()}
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
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius,
    borderWidth: 1,
    justifyContent: 'center',
  },
  pillLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  notesInput: { minHeight: 96, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
  smallSpacer: { height: spacing.sm },
});
