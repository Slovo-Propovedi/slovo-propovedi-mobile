import React from 'react';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { COLORS, INDENTS, RADIUSES } from 'shared/themed';
import { Input } from './input';
import type { SearchButtonProps } from './search-button';
import { SearchButton } from './search-button';

type SearchInputProps = Pick<TextInputProps & SearchButtonProps, 'onPress' | 'placeholder'> & {
  style?: StyleProp<ViewStyle>;
};

export const SearchInput: React.FC<SearchInputProps> = ({ onPress, placeholder, style }) => (
  <View style={[styles.searchInput, style]}>
    <Input placeholder={placeholder} placeholderTextColor={COLORS.onPrimary} style={styles.input} />
    <SearchButton onPress={onPress} />
  </View>
);

const styles = StyleSheet.create({
  input: {
    flex: 1,
    padding: INDENTS.middle,
  },

  searchInput: {
    borderColor: COLORS.onPrimary,
    borderRadius: RADIUSES.middle,
    borderStyle: 'solid',
    borderWidth: 1,
    flexDirection: 'row',
    height: 39,
  },
});
