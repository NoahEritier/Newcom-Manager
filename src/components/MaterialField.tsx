import { useState } from 'react';
import { View } from 'react-native';

import { MATERIALS_LIST, MATERIALS_OPTIONS, OTHER_MATERIAL_VALUE } from '../utils/materials';
import { AppTextInput } from './AppTextInput';
import { Dropdown } from './Dropdown';

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
};

const OPTIONS = [...MATERIALS_OPTIONS, { value: OTHER_MATERIAL_VALUE, label: 'Otro' }];

// Dropdown de materiales con lista fija + "Otro" que despliega un campo de
// texto libre. Si el valor guardado no está en la lista fija (se cargó como
// "Otro" antes, o viene de datos viejos en texto libre), arranca mostrando
// el campo de texto con ese valor.
export function MaterialField({ value, onChange }: Props) {
  const isKnown = value != null && (MATERIALS_LIST as readonly string[]).includes(value);
  const [showCustom, setShowCustom] = useState(value != null && !isKnown);

  function handleSelect(selected: string) {
    if (selected === OTHER_MATERIAL_VALUE) {
      setShowCustom(true);
      onChange(null);
    } else {
      setShowCustom(false);
      onChange(selected);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Dropdown
        value={showCustom ? OTHER_MATERIAL_VALUE : value}
        options={OPTIONS}
        onChange={handleSelect}
        placeholder="Seleccionar material"
        title="Materiales"
      />
      {showCustom ? (
        <AppTextInput
          value={value ?? ''}
          onChangeText={onChange}
          placeholder="Escribir material"
        />
      ) : null}
    </View>
  );
}
