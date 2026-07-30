function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function defaultTournamentWhatsappMessage(
  title: string,
  startDate: string,
  endDate: string | null,
  location: string
): string {
  const parts = [
    `Convocatoria: ${title || '(nombre del torneo)'}`,
    `Fecha: ${formatDate(startDate)}${endDate ? ` al ${formatDate(endDate)}` : ''}`,
  ];
  if (location) parts.push(`Lugar: ${location}`);
  return parts.join('\n');
}
