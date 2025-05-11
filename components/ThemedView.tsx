import { View, type ViewProps } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'surface';
};

export function ThemedView(props: ThemedViewProps) {
  const { style, lightColor, darkColor, variant = 'default', ...otherProps } = props;
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = lightColor || darkColor
    ? useCustomColors(lightColor, darkColor, colorScheme)
    : getVariantColor(variant, colorScheme);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

function useCustomColors(lightColor: string | undefined, darkColor: string | undefined, colorScheme: 'light' | 'dark'): string {
  if (colorScheme === 'dark') {
    return darkColor || Colors.dark.background;
  }
  return lightColor || Colors.light.background;
}

function getVariantColor(variant: 'default' | 'surface', colorScheme: 'light' | 'dark'): string {
  if (variant === 'surface') {
    return Colors[colorScheme].surfaceBackground;
  }
  return Colors[colorScheme].background;
}
