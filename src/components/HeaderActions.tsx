import { View } from 'react-native';

import { SettingsButton } from './SettingsButton';
import { ThemeToggleButton } from './ThemeToggleButton';

export function HeaderActions() {
  return (
    <View style={{ flexDirection: 'row' }}>
      <ThemeToggleButton />
      <SettingsButton />
    </View>
  );
}
