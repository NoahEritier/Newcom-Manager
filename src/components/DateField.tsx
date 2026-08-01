import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';
import { AppTextInput } from './AppTextInput';

type Props = {
  value: string | null; // formato 'YYYY-MM-DD'
  onChange: (value: string | null) => void;
  placeholder?: string;
  // Sin calendario ni toggle: solo el campo de texto dd/mm/aaaa. Para casos
  // donde el calendario molesta más de lo que ayuda (ej. fecha de fin de
  // una liga que dura toda la temporada, muy lejos en el calendario).
  manualOnly?: boolean;
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Autocompleta las barras mientras el usuario escribe dd/mm/aaaa.
function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join('/');
}

// Valida dd/mm/aaaa completo y lo convierte a ISO 'YYYY-MM-DD', o null si no es una fecha real.
function parseMaskedDate(masked: string): string | null {
  const match = masked.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

export function DateField({ value, onChange, placeholder = 'Seleccionar fecha', manualOnly = false }: Props) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);
  const [manualMode, setManualMode] = useState(manualOnly);
  const [manualText, setManualText] = useState(value ? formatDate(value) : '');
  const [manualError, setManualError] = useState<string | null>(null);

  function handleManualChange(text: string) {
    const masked = maskDateInput(text);
    setManualText(masked);
    setManualError(null);
    if (masked.length === 10) {
      const iso = parseMaskedDate(masked);
      if (iso) {
        onChange(iso);
      } else {
        setManualError('Fecha inválida.');
      }
    }
  }

  function toggleManualMode() {
    if (!manualMode) {
      setManualText(value ? formatDate(value) : '');
      setManualError(null);
    }
    setManualMode((m) => !m);
  }

  return (
    <View>
      {manualMode ? (
        <AppTextInput
          value={manualText}
          onChangeText={handleManualChange}
          placeholder="dd/mm/aaaa"
          keyboardType="number-pad"
          maxLength={10}
        />
      ) : (
        <Pressable
          style={[styles.field, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={() => setShow(true)}
        >
          <Text style={[styles.text, { color: value ? colors.text : colors.textMuted }]}>
            {value ? formatDate(value) : placeholder}
          </Text>
        </Pressable>
      )}

      {manualError ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>{manualError}</Text>
      ) : null}

      <View style={styles.actionsRow}>
        {!manualOnly ? (
          <Pressable style={styles.clearButton} onPress={toggleManualMode}>
            <Text style={[styles.clearLabel, { color: colors.link }]}>
              {manualMode ? 'Elegir del calendario' : 'Escribir la fecha'}
            </Text>
          </Pressable>
        ) : null}
        {value ? (
          <Pressable
            style={styles.clearButton}
            onPress={() => {
              onChange(null);
              setManualText('');
              setManualError(null);
            }}
          >
            <Text style={[styles.clearLabel, { color: colors.link }]}>Quitar fecha</Text>
          </Pressable>
        ) : null}
      </View>

      {show && !manualOnly ? (
        <DateTimePicker
          // 'T00:00:00' fuerza a que se parsee como hora local, no UTC —
          // new Date('YYYY-MM-DD') interpreta medianoche UTC, que en
          // Argentina (UTC-3) cae en el día anterior.
          value={value ? new Date(`${value}T00:00:00`) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShow(false);
            if (event.type === 'set' && selectedDate) {
              // Se arman los componentes en hora local (no toISOString, que
              // convierte a UTC y puede correr la fecha un día para atrás).
              const year = selectedDate.getFullYear();
              const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const day = String(selectedDate.getDate()).padStart(2, '0');
              onChange(`${year}-${month}-${day}`);
            }
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: minTouchSize,
    borderWidth: 1,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  text: {
    fontSize: typography.body,
    fontFamily: fonts.regular,
  },
  errorText: {
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  clearButton: {
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  clearLabel: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
});
