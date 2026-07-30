import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '../theme';

type ResultKind = 'won' | 'lost' | 'drawn';

const ICON_BY_KIND: Record<ResultKind, keyof typeof MaterialIcons.glyphMap> = {
  won: 'check-circle',
  lost: 'cancel',
  drawn: 'remove-circle',
};

type Props = {
  kind: ResultKind;
  size?: number;
};

// Ganados/perdidos/empatados se distinguen por la forma del ícono (check,
// cruz, línea), no solo por el color — para que se entiendan también con
// dificultades de percepción de color.
export function ResultIcon({ kind, size = 28 }: Props) {
  const { colors } = useTheme();
  const color = kind === 'won' ? colors.success : kind === 'lost' ? colors.danger : colors.textMuted;
  return <MaterialIcons name={ICON_BY_KIND[kind]} size={size} color={color} />;
}
