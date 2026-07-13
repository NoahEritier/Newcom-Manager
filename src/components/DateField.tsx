import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, minTouchSize, spacing, typography } from '../theme';

type Props = {
  value: string | null; // formato 'YYYY-MM-DD'
  onChange: (value: string | null) => void;
  placeholder?: string;
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function DateField({ value, onChange, placeholder = 'Seleccionar fecha' }: Props) {
  const [show, setShow] = useState(false);

  return (
    <View>
      <Pressable style={styles.field} onPress={() => setShow(true)}>
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </Pressable>
      {value ? (
        <Pressable style={styles.clearButton} onPress={() => onChange(null)}>
          <Text style={styles.clearLabel}>Quitar fecha</Text>
        </Pressable>
      ) : null}
      {show ? (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShow(false);
            if (event.type === 'set' && selectedDate) {
              onChange(selectedDate.toISOString().slice(0, 10));
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
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  value: {
    fontSize: typography.body,
    color: colors.text,
  },
  placeholder: {
    fontSize: typography.body,
    color: colors.textMuted,
  },
  clearButton: {
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  clearLabel: {
    fontSize: typography.label,
    color: colors.primary,
  },
});
