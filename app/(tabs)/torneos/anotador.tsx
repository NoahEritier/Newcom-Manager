import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { AppTextInput } from '../../../src/components/AppTextInput';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../../../src/theme';

type Phase = 'config' | 'playing' | 'finished';

function Stepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepperRow}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.stepperButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <Text style={[styles.stepperSymbol, { color: colors.text }]}>−</Text>
      </Pressable>
      <Text style={[styles.stepperValue, { color: colors.text }]}>{value}</Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        style={[styles.stepperButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <Text style={[styles.stepperSymbol, { color: colors.text }]}>+</Text>
      </Pressable>
    </View>
  );
}

export default function AnotadorScreen() {
  const { colors } = useTheme();
  const [phase, setPhase] = useState<Phase>('config');
  const [teamAName, setTeamAName] = useState('Nosotros');
  const [teamBName, setTeamBName] = useState('Rival');
  const [setsToWin, setSetsToWin] = useState(3); // mejor de 5 por default
  const [pointsPerSet, setPointsPerSet] = useState(25);

  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  const [pointsA, setPointsA] = useState(0);
  const [pointsB, setPointsB] = useState(0);
  const [setHistory, setSetHistory] = useState<{ a: number; b: number }[]>([]);

  function startMatch() {
    setSetsA(0);
    setSetsB(0);
    setPointsA(0);
    setPointsB(0);
    setSetHistory([]);
    setPhase('playing');
  }

  function checkSetEnd(nextA: number, nextB: number) {
    const reachedTarget = nextA >= pointsPerSet || nextB >= pointsPerSet;
    const leadsByTwo = Math.abs(nextA - nextB) >= 2;
    if (!reachedTarget || !leadsByTwo) return;

    const aWinsSet = nextA > nextB;
    const newSetsA = setsA + (aWinsSet ? 1 : 0);
    const newSetsB = setsB + (aWinsSet ? 0 : 1);
    setSetHistory((prev) => [...prev, { a: nextA, b: nextB }]);
    setSetsA(newSetsA);
    setSetsB(newSetsB);
    setPointsA(0);
    setPointsB(0);

    if (newSetsA >= setsToWin || newSetsB >= setsToWin) {
      setPhase('finished');
    }
  }

  function addPoint(team: 'a' | 'b') {
    if (team === 'a') {
      const next = pointsA + 1;
      setPointsA(next);
      checkSetEnd(next, pointsB);
    } else {
      const next = pointsB + 1;
      setPointsB(next);
      checkSetEnd(pointsA, next);
    }
  }

  function subtractPoint(team: 'a' | 'b') {
    if (team === 'a') setPointsA((p) => Math.max(0, p - 1));
    else setPointsB((p) => Math.max(0, p - 1));
  }

  if (phase === 'config') {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.configContainer}
      >
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Herramienta libre para anotar en la cancha — no se guarda en ningún lado, es solo para
          seguir el partido en vivo.
        </Text>

        <Text style={[styles.label, { color: colors.textMuted }]}>Nombre equipo propio</Text>
        <AppTextInput value={teamAName} onChangeText={setTeamAName} />

        <Text style={[styles.label, { color: colors.textMuted }]}>Nombre rival</Text>
        <AppTextInput value={teamBName} onChangeText={setTeamBName} />

        <Text style={[styles.label, { color: colors.textMuted }]}>Sets para ganar el partido</Text>
        <Stepper value={setsToWin} onChange={setSetsToWin} />

        <Text style={[styles.label, { color: colors.textMuted }]}>Puntos por set</Text>
        <Stepper value={pointsPerSet} onChange={setPointsPerSet} min={5} />

        <View style={styles.spacer} />
        <AppButton label="Empezar a anotar" onPress={startMatch} />
      </ScrollView>
    );
  }

  if (phase === 'finished') {
    const winner = setsA > setsB ? teamAName : teamBName;
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.winnerLabel, { color: colors.success }]}>¡Ganó {winner}!</Text>
        <Text style={[styles.finalScore, { color: colors.text }]}>
          {setsA} - {setsB}
        </Text>
        <View style={styles.spacer} />
        <AppButton label="Nuevo partido" onPress={() => setPhase('config')} />
      </View>
    );
  }

  return (
    <View style={[styles.playingContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.setsLabel, { color: colors.textMuted }]}>
        Sets: {setsA} - {setsB}
      </Text>

      <View style={styles.teamsRow}>
        <View style={styles.teamColumn}>
          <Text style={[styles.teamName, { color: colors.text }]}>{teamAName}</Text>
          <Text style={[styles.points, { color: colors.primary }]}>{pointsA}</Text>
          <Pressable
            onPress={() => addPoint('a')}
            style={[styles.pointButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.pointButtonLabel, { color: colors.primaryText }]}>+1</Text>
          </Pressable>
          <Pressable onPress={() => subtractPoint('a')} style={styles.minusButton}>
            <Text style={[styles.minusLabel, { color: colors.textMuted }]}>-1</Text>
          </Pressable>
        </View>

        <View style={styles.teamColumn}>
          <Text style={[styles.teamName, { color: colors.text }]}>{teamBName}</Text>
          <Text style={[styles.points, { color: colors.danger }]}>{pointsB}</Text>
          <Pressable
            onPress={() => addPoint('b')}
            style={[styles.pointButton, { backgroundColor: colors.danger }]}
          >
            <Text style={[styles.pointButtonLabel, { color: colors.primaryText }]}>+1</Text>
          </Pressable>
          <Pressable onPress={() => subtractPoint('b')} style={styles.minusButton}>
            <Text style={[styles.minusLabel, { color: colors.textMuted }]}>-1</Text>
          </Pressable>
        </View>
      </View>

      {setHistory.length > 0 ? (
        <Text style={[styles.historyLabel, { color: colors.textMuted }]}>
          Sets anteriores: {setHistory.map((s) => `${s.a}-${s.b}`).join(', ')}
        </Text>
      ) : null}

      <AppButton label="Terminar y salir" variant="secondary" onPress={() => setPhase('config')} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  configContainer: { padding: spacing.lg },
  hint: { fontSize: typography.caption, fontFamily: fonts.regular, marginBottom: spacing.md },
  label: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  spacer: { height: spacing.lg },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepperButton: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: { fontSize: 24, fontFamily: fonts.bold },
  stepperValue: { fontSize: typography.screenTitle, fontFamily: fonts.bold, minWidth: 40, textAlign: 'center' },
  winnerLabel: { fontSize: typography.screenTitle, fontFamily: fonts.bold },
  finalScore: { fontSize: 48, fontFamily: fonts.bold, marginTop: spacing.sm },
  playingContainer: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  setsLabel: { fontSize: typography.body, fontFamily: fonts.bold, textAlign: 'center' },
  teamsRow: { flex: 1, flexDirection: 'row', gap: spacing.lg },
  teamColumn: { flex: 1, alignItems: 'center', gap: spacing.md, justifyContent: 'center' },
  teamName: { fontSize: typography.body, fontFamily: fonts.bold, textAlign: 'center' },
  points: { fontSize: 72, fontFamily: fonts.bold },
  pointButton: {
    width: '100%',
    minHeight: 64,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointButtonLabel: { fontSize: typography.screenTitle, fontFamily: fonts.bold },
  minusButton: { minHeight: minTouchSize, alignItems: 'center', justifyContent: 'center' },
  minusLabel: { fontSize: typography.body, fontFamily: fonts.bold },
  historyLabel: { fontSize: typography.caption, fontFamily: fonts.regular, textAlign: 'center' },
});
