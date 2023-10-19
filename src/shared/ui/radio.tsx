import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type RadioButtonGroupProps = React.PropsWithChildren<object>;

type RadioButtonProps = {
  disabled?: boolean;
  label: string;
  onValueChange?: (selected: boolean) => void;
  selected: boolean;
};

export const RadioButtonGroup: React.FC<RadioButtonGroupProps> = ({ children }) => (
  <View>{children}</View>
);

export const RadioButton = (props: RadioButtonProps) => {
  const { disabled, label, onValueChange, selected } = props;

  const handleOnPress = () => {
    !disabled && onValueChange && onValueChange(!selected);
  };

  return (
    <TouchableOpacity disabled={disabled} onPress={handleOnPress}>
      <View>
        {label ? <Text>{label}</Text> : null}
        <View>{selected ? <View /> : null}</View>
      </View>
    </TouchableOpacity>
  );
};
