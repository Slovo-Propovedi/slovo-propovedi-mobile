import {
  ButtonProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS, INDENTS, FONT_SIZES, RADIUSES } from 'shared/themed';

type CustomButtonProps = ButtonProps & { style?: ViewStyle; titleStyle?: TextStyle };

export const Button = ({
  title,
  color,
  disabled,
  style,
  titleStyle,
  ...rest
}: CustomButtonProps) => {
  const buttonStyles: StyleProp<ViewStyle>[] = [styles.button];

  if (disabled) {
    buttonStyles.push({ backgroundColor: COLORS.disabled });
  }

  buttonStyles.push(style);

  return (
    <TouchableOpacity style={buttonStyles} disabled={disabled} {...rest}>
      <Text style={[styles.text, titleStyle, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: INDENTS.low,
    borderRadius: RADIUSES.low,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: FONT_SIZES.h5,
    textTransform: 'uppercase',
  },
});
