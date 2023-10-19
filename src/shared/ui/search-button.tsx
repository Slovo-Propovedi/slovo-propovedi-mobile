import type { ButtonProps, StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SEARCH_ICON } from 'shared/images';
import { COLORS } from 'shared/themed';

export type SearchButtonProps = Omit<ButtonProps, 'color' | 'title'>;

export const SearchButton = ({ disabled, ...rest }: SearchButtonProps) => {
  const buttonStyles: StyleProp<ViewStyle>[] = [styles.button];

  if (disabled) {
    buttonStyles.push({ backgroundColor: COLORS.disabled });
  }

  return (
    <TouchableOpacity disabled={disabled} style={buttonStyles} {...rest}>
      <Image source={{ uri: SEARCH_ICON }} style={styles.image} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 15,
    borderTopRightRadius: 15,
    height: '100%',
    justifyContent: 'center',
    width: 50,
  },
  image: {
    height: '100%',
    resizeMode: 'contain',
    width: '100%',
  },
});
