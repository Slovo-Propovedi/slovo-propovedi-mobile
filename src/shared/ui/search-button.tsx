import {
  ButtonProps,
  StyleSheet,
  Image,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SEARCH_ICON } from 'shared/images';
import { COLORS } from 'shared/themed';

export type SearchButtonProps = Omit<ButtonProps, 'title' | 'color'>;

export const SearchButton = ({ disabled, ...rest }: SearchButtonProps) => {
  const buttonStyles: StyleProp<ViewStyle>[] = [styles.button];

  if (disabled) {
    buttonStyles.push({ backgroundColor: COLORS.disabled });
  }

  return (
    <TouchableOpacity style={buttonStyles} disabled={disabled} {...rest}>
      <Image source={{ uri: SEARCH_ICON }} style={styles.image} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: '100%',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
