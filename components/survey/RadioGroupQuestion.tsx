import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Choice } from './types';

interface RadioGroupQuestionProps {
  choices: Choice[];
  value: string;
  onValueChange: (value: string) => void;
  isEnabled: boolean;
}

export function RadioGroupQuestion({
  choices,
  value,
  onValueChange,
  isEnabled,
}: RadioGroupQuestionProps) {
  return (
    <View style={styles.choicesContainer}>
      {choices?.map((choice) => (
        <TouchableOpacity
          key={choice.value}
          style={styles.radioOption}
          onPress={() => isEnabled && onValueChange(choice.value)}
          disabled={!isEnabled}
        >
          <View style={[
            styles.radioCircle,
            value === choice.value && styles.radioSelected,
            !isEnabled && styles.disabledOption
          ]} />
          <Text style={[styles.choiceText, !isEnabled && styles.disabledText]}>
            {choice.text}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  choicesContainer: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
  },
  radioSelected: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  disabledOption: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  choiceText: {
    fontSize: 16,
    color: '#333',
  },
  disabledText: {
    color: '#999',
  },
});

export default RadioGroupQuestion;
