// Generador simple de UUID v4 en JS puro (no cripto-seguro, alcanza para IDs
// locales de un piloto de pocos dispositivos) — evita sumar otra dependencia nativa.
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
