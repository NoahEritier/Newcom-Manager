import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, radius, spacing, typography, useTheme } from '../theme';

type Props = {
  trainingDays: number[]; // 0=domingo .. 6=sábado
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  sessionDates: Set<string>;
};

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function WeekCalendar({ trainingDays, selectedDate, onSelectDate, sessionDates }: Props) {
  const { colors } = useTheme();
  const monday = getMonday(new Date());
  const todayIso = toIso(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <View style={styles.row}>
      {days.map((d) => {
        const iso = toIso(d);
        const dayOfWeek = d.getDay();
        const isTrainingDay = trainingDays.includes(dayOfWeek);
        const isToday = iso === todayIso;
        const isSelected = iso === selectedDate;
        const hasSession = sessionDates.has(iso);

        return (
          <Pressable
            key={iso}
            onPress={() => onSelectDate(iso)}
            style={[
              styles.day,
              { backgroundColor: isSelected ? colors.primary : colors.surface },
              !isSelected && isTrainingDay && { borderWidth: 2, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.dayLabel, { color: isSelected ? colors.primaryText : colors.textMuted }]}>
              {DAY_LABELS[dayOfWeek]}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                { color: isSelected ? colors.primaryText : isToday ? colors.primary : colors.text },
              ]}
            >
              {d.getDate()}
            </Text>
            <View
              style={[
                styles.dot,
                { backgroundColor: hasSession ? (isSelected ? colors.primaryText : colors.success) : 'transparent' },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  day: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 2,
  },
  dayLabel: { fontSize: 11, fontFamily: fonts.bold },
  dayNumber: { fontSize: typography.body, fontFamily: fonts.bold },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
});
