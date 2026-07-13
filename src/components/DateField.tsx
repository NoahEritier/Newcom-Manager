import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';

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
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  return (
    <View>
      <Pressable
        style={[styles.field, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={() => setShow(true)}
      >
        <Text style={[styles.text, { color: value ? colors.text : colors.textMuted }]}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </Pressable>
      {value ? (
        <Pressable style={styles.clearButton} onPress={() => onChange(null)}>
          <Text style={[styles.clearLabel, { color: colors.link }]}>Quitar fecha</Text>
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
