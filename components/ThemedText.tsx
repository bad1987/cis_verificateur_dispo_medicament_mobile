import { StyleSheet, Text, type TextProps } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  variant?: 'primary' | 'secondary' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  variant = 'primary',
  ...rest
}: ThemedTextProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  const textColor = getTextColor(variant, colorScheme, lightColor, darkColor);

  return (
    <Text
      style={[
        { color: textColor },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

function getTextColor(
  variant: 'primary' | 'secondary' | 'link',
  colorScheme: 'light' | 'dark',
  lightColor?: string,
  darkColor?: string
): string {
  if (lightColor && darkColor) {
    return colorScheme === 'dark' ? darkColor : lightColor;
  }

  if (variant === 'link') {
    return Colors[colorScheme].tint;
  }

  if (variant === 'secondary') {
    return colorScheme === 'dark' ? '#9BA1A6' : '#687076';
  }

  return Colors[colorScheme].text;
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
});
