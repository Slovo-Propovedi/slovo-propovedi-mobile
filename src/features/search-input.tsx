import React from 'react';
import { StyleProp, StyleSheet, TextInputProps, View, ViewStyle } from 'react-native';
import { Input, SearchButton, SearchButtonProps, COLORS, INDENTS } from 'shared';

type SearchInputProps = Pick<TextInputProps & SearchButtonProps, 'placeholder' | 'onPress'> & {
  style?: StyleProp<ViewStyle>;
};

export const SearchInput: React.FC<SearchInputProps> = ({ placeholder, onPress, style }) => (
  <View style={[styles.searchInput, style]}>
    <Input style={styles.input} placeholder={placeholder} placeholderTextColor={COLORS.onPrimary} />
    <SearchButton onPress={onPress} />
  </View>
);

const styles = StyleSheet.create({
  searchInput: {
    flexDirection: 'row',
    height: 39,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.onPrimary,
    borderStyle: 'solid',
  },

  input: {
    flex: 1,
    padding: INDENTS.low,
  },
});
