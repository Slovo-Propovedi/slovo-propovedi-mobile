import { ButtonProps, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

export const Button = ({
  title,
  color,
  disabled,
  style,
  ...rest
}: ButtonProps & { style?: ViewStyle }) => (
  <TouchableOpacity
    style={{
      ...(disabled ? { ...styles.button, backgroundColor: 'gray' } : styles.button),
      ...style,
    }}
    disabled={disabled}
    {...rest}
  >
    <Text style={{ ...styles.text, color }}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    padding: 2.5,
    borderRadius: 10,
    backgroundColor: 'blue',
  },
  text: {
    fontSize: 10,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
