import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';

export type DropdownOption = { value: string; label: string };

type Props = {
  value: string | null;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
};

// Campo tipo "select": un field tocable que abre un modal de pantalla
// completa con opciones grandes (48px mínimo, checkmark en la seleccionada)
// — reemplaza el patrón de pastillas para elegir una sola opción fija.
export function Dropdown({ value, options, onChange, placeholder = 'Seleccionar', title }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        style={[styles.field, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={title ?? placeholder}
      >
        <Text
          style={[styles.fieldText, { color: selected ? colors.text : colors.textMuted }]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
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
                const isSelected = item.value === value;
                return (
                  <Pressable
                    style={[styles.option, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{item.label}</Text>
                    {isSelected ? (
                      <MaterialIcons name="check" size={22} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
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
  sheet: { maxHeight: '75%', borderTopLeftRadius: radius * 2, borderTopRightRadius: radius * 2 },
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
});
