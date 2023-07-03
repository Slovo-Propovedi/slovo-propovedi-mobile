import React, { FC } from 'react';
import { StyleSheet, TextInputProps, View, ViewStyle } from 'react-native';
import { Input, SearchButton, SearchButtonProps } from 'shared';
import { COLORS } from 'shared/config';

type SearchInputProps = Pick<TextInputProps & SearchButtonProps, 'placeholder' | 'onPress'> & {
  style?: ViewStyle;
};

export const SearchInput: FC<SearchInputProps> = ({ placeholder, onPress, style = {} }) => (
  <View style={{ ...styles.searchInput, ...style }}>
    <Input style={styles.input} placeholder={placeholder} placeholderTextColor={COLORS.OnPrimary} />
    <SearchButton onPress={onPress} />
  </View>
);

const styles = StyleSheet.create({
  searchInput: {
    flexDirection: 'row',
    height: 39,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.OnPrimary,
    borderStyle: 'solid',
  },

  input: {
    flex: 1,
    paddingTop: 7,
    paddingBottom: 9,
    paddingHorizontal: 10,
  },
});
