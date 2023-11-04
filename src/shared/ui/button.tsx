import type { ButtonProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed';

type CustomButtonProps = ButtonProps & { style?: ViewStyle; titleStyle?: TextStyle };

export const Button = ({
  color,
  disabled,
  style,
  title,
  titleStyle,
  ...rest
}: CustomButtonProps) => {
  const buttonStyles: StyleProp<ViewStyle>[] = [styles.button];

  if (disabled) {
    buttonStyles.push({ backgroundColor: COLORS.disabled });
  }

  buttonStyles.push(style);

  return (
    <TouchableOpacity disabled={disabled} style={buttonStyles} {...rest}>
      <Text style={[styles.text, titleStyle, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    padding: INDENTS.middle,
  },
  text: {
    fontSize: FONT_SIZES.h5,
    textTransform: 'uppercase',
  },
});
