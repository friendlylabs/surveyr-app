import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Choice } from './types';

interface RankingQuestionProps {
  choices: Choice[];
  value: string[];
  onValueChange: (value: string[]) => void;
  isEnabled: boolean;
}

export function RankingQuestion({
  choices,
  value,
  onValueChange,
  isEnabled
}: RankingQuestionProps) {
  const orderedValues = Array.isArray(value) ? value : [];
  
  // Use an effect to initialize the ranking instead of doing it during render
  useEffect(() => {
    if (orderedValues.length === 0) {
      const initialOrder = choices.map(choice => choice.value);
      onValueChange(initialOrder);
    }
  }, [choices, onValueChange, orderedValues.length]);

  const currentOrder = orderedValues.length > 0 ? orderedValues : choices.map(choice => choice.value);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (!isEnabled) return;
    
    const newOrder = [...currentOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    onValueChange(newOrder);
  };

  const getChoiceByValue = (value: string) => {
    return choices.find(choice => choice.value === value);
  };

  return (
    <View style={styles.rankingContainer}>
      <Text style={styles.rankingInstructions}>
        Drag items to reorder them by preference (most preferred at top)
      </Text>
      {currentOrder.map((choiceValue, index) => {
        const choice = getChoiceByValue(choiceValue);
        if (!choice) return null;

        return (
          <View key={choiceValue} style={[
            styles.rankingItem,
            !isEnabled && styles.disabledOption
          ]}>
            <View style={styles.rankingNumber}>
              <Text style={styles.rankingNumberText}>{index + 1}</Text>
            </View>
            <Text style={[styles.rankingText, !isEnabled && styles.disabledText]}>
              {choice.text}
            </Text>
            <View style={styles.rankingControls}>
              {index > 0 && isEnabled && (
                <TouchableOpacity
                  style={styles.rankingButton}
                  onPress={() => moveItem(index, index - 1)}
                >
                  <Text style={styles.rankingButtonText}>▲</Text>
                </TouchableOpacity>
              )}
              {index < currentOrder.length - 1 && isEnabled && (
                <TouchableOpacity
                  style={styles.rankingButton}
                  onPress={() => moveItem(index, index + 1)}
                >
                  <Text style={styles.rankingButtonText}>▼</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rankingContainer: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  rankingInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  rankingNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankingNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rankingText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  disabledOption: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
  rankingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rankingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RankingQuestion;
