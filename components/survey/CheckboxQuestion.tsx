import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Choice } from './types';

interface CheckboxQuestionProps {
  choices: Choice[];
  value: string[];
  onValueChange: (value: string[]) => void;
  isEnabled: boolean;
}

export function CheckboxQuestion({
  choices,
  value,
  onValueChange,
  isEnabled,
}: CheckboxQuestionProps) {
  const currentValues = Array.isArray(value) ? value : [];

  return (
    <View style={styles.choicesContainer}>
      {choices?.map((choice) => {
        const isSelected = currentValues.includes(choice.value);
        return (
          <TouchableOpacity
            key={choice.value}
            style={styles.checkboxOption}
            onPress={() => {
              if (!isEnabled) return;
              const newValues = isSelected
                ? currentValues.filter(v => v !== choice.value)
                : [...currentValues, choice.value];
              onValueChange(newValues);
            }}
            disabled={!isEnabled}
          >
            <View style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
              !isEnabled && styles.disabledOption
            ]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.choiceText, !isEnabled && styles.disabledText]}>
              {choice.text}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  choicesContainer: {
    marginTop: 8,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  choiceText: {
    fontSize: 16,
    color: '#333',
  },
  disabledOption: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  disabledText: {
    color: '#999',
  },
});

export default CheckboxQuestion;
