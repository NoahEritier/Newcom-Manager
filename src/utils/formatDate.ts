export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Si el torneo es de un solo día (o end_date no está cargada), muestra una
// sola fecha en vez de un rango.
export function formatDateRange(startIso: string, endIso: string | null): string {
  if (!endIso || endIso === startIso) return formatDate(startIso);
  return `${formatDate(startIso)} - ${formatDate(endIso)}`;
}
