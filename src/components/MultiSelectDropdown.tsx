import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';
import type { DropdownOption } from './Dropdown';
import { AppButton } from './AppButton';

type Props = {
  values: string[];
  options: DropdownOption[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  title?: string;
};

// Igual que Dropdown pero de selección múltiple: checkboxes en vez de
// checkmark único, y un botón "Listo" para cerrar (no cierra al tocar una
// opción, porque se espera marcar varias seguidas).
export function MultiSelectDropdown({ values, options, onChange, placeholder = 'Seleccionar', title }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selectedLabels = options.filter((o) => values.includes(o.value)).map((o) => o.label);

  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  return (
    <>
      <Pressable
        style={[styles.field, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={title ?? placeholder}
      >
        <Text
          style={[styles.fieldText, { color: selectedLabels.length > 0 ? colors.text : colors.textMuted }]}
          numberOfLines={1}
        >
          {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={26} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.md },
            ]}
          >
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{title ?? placeholder}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected = values.includes(item.value);
                return (
                  <Pressable style={[styles.option, { borderBottomColor: colors.border }]} onPress={() => toggle(item.value)}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{item.label}</Text>
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: colors.border },
                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      {isSelected ? <MaterialIcons name="check" size={16} color={colors.primaryText} /> : null}
                    </View>
                  </Pressable>
                );
              }}
            />
            <View style={styles.doneContainer}>
              <AppButton label="Listo" onPress={() => setOpen(false)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: minTouchSize,
    borderWidth: 1,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fieldText: { flex: 1, fontSize: typography.body, fontFamily: fonts.regular },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '80%', borderTopLeftRadius: radius * 2, borderTopRightRadius: radius * 2 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold, flex: 1 },
  closeButton: { minWidth: minTouchSize, minHeight: minTouchSize, alignItems: 'center', justifyContent: 'center' },
  list: { flexGrow: 0 },
  option: {
    minHeight: minTouchSize + 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  optionLabel: { fontSize: typography.body, fontFamily: fonts.regular, flex: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  doneContainer: { padding: spacing.lg },
});
