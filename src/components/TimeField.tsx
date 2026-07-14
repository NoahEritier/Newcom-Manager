import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';

type Props = {
  value: string | null; // formato 'HH:MM'
  onChange: (value: string | null) => void;
  placeholder?: string;
};

function toDate(value: string): Date {
  const [h, m] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatTime(value: string): string {
  const [h, m] = value.split(':');
  return `${h}:${m}`;
}

export function TimeField({ value, onChange, placeholder = 'Seleccionar hora' }: Props) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  return (
    <View>
      <Pressable
        style={[styles.field, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={() => setShow(true)}
      >
        <Text style={[styles.text, { color: value ? colors.text : colors.textMuted }]}>
          {value ? formatTime(value) : placeholder}
        </Text>
      </Pressable>
      {value ? (
        <Pressable style={styles.clearButton} onPress={() => onChange(null)}>
          <Text style={[styles.clearLabel, { color: colors.link }]}>Quitar hora</Text>
        </Pressable>
      ) : null}
      {show ? (
        <DateTimePicker
          value={value ? toDate(value) : new Date()}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShow(false);
            if (event.type === 'set' && selectedDate) {
              const hh = String(selectedDate.getHours()).padStart(2, '0');
              const mm = String(selectedDate.getMinutes()).padStart(2, '0');
              onChange(`${hh}:${mm}`);
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
  clearButton: {
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  clearLabel: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
});
