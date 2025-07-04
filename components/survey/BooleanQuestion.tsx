import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

interface BooleanQuestionProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  isEnabled: boolean;
}

export function BooleanQuestion({
  value,
  onValueChange,
  isEnabled,
}: BooleanQuestionProps) {
  return (
    <View style={styles.booleanContainer}>
      <Switch
        value={value === true}
        onValueChange={onValueChange}
        disabled={!isEnabled}
      />
      <Text style={[styles.booleanLabel, !isEnabled && styles.disabledText]}>
        {value ? 'Yes' : 'No'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  booleanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  booleanLabel: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  disabledText: {
    color: '#999',
  },
});

export default BooleanQuestion;
