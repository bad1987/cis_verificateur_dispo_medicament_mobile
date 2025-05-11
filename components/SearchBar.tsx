import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
}

export function SearchBar({
  placeholder,
  value,
  onChangeText,
  onSubmit,
  onClear,
}: SearchBarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <ThemedView
      style={[
        styles.container,
        isFocused ? styles.containerFocused : null,
        { borderColor: Colors[colorScheme].border }
      ]}
    >
      <IconSymbol
        name="magnifyingglass"
        size={20}
        color={Colors[colorScheme].icon}
        style={styles.searchIcon}
      />
      <TextInput
        style={[
          styles.input,
          { color: Colors[colorScheme].text }
        ]}
        placeholder={placeholder || t('search')}
        placeholderTextColor={Colors[colorScheme].placeholder}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        clearButtonMode="never"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <IconSymbol
            name="xmark.circle.fill"
            size={20}
            color={Colors[colorScheme].icon}
          />
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  containerFocused: {
    borderWidth: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
});
