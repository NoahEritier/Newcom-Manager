function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function defaultTournamentWhatsappMessage(
  title: string,
  startDate: string,
  endDate: string | null,
  locality: string
): string {
  const parts = [
    `Convocatoria: ${title || '(nombre del torneo)'}`,
    `Fecha: ${formatDate(startDate)}${endDate ? ` al ${formatDate(endDate)}` : ''}`,
  ];
  if (locality) parts.push(`Localidad: ${locality}`);
  return parts.join('\n');
}
