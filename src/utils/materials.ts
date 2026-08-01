// Lista fija de materiales de entrenamiento — el coach siempre puede elegir
// "Otro" y escribir uno que no esté acá (ver MaterialField.tsx).
export const MATERIALS_LIST = [
  'Pelotas',
  'Conos',
  'Escalera de coordinación',
  'Sogas',
  'Aros',
  'Vallas bajas',
  'Chalecos/petos',
  'Red',
  'Bandas elásticas',
  'Medicine ball',
  'Silbato',
] as const;

export const MATERIALS_OPTIONS = MATERIALS_LIST.map((m) => ({ value: m, label: m }));

export const OTHER_MATERIAL_VALUE = '__otro__';
