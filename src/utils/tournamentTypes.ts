export type TournamentType = 'amistoso' | 'encuentro' | 'liga';

export const TOURNAMENT_TYPES: { value: TournamentType; label: string }[] = [
  { value: 'amistoso', label: 'Amistoso' },
  { value: 'encuentro', label: 'Encuentro' },
  { value: 'liga', label: 'Liga' },
];

export function tournamentTypeLabel(type: TournamentType): string {
  return TOURNAMENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export type RegistrationStatus = 'pendiente' | 'inscripto' | 'confirmado';

export const REGISTRATION_STATUSES: { value: RegistrationStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'inscripto', label: 'Inscripto' },
  { value: 'confirmado', label: 'Confirmado' },
];

export function registrationStatusLabel(status: RegistrationStatus): string {
  return REGISTRATION_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export type FeeMode = 'individual' | 'equipo';

export const FEE_MODES: { value: FeeMode; label: string }[] = [
  { value: 'individual', label: 'Por jugador' },
  { value: 'equipo', label: 'Por equipo' },
];
