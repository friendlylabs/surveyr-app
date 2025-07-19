import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Choice } from './types';

interface RankingQuestionProps {
  choices: Choice[];
  value: string[];
  onValueChange: (value: string[]) => void;
  isEnabled: boolean;
}

const ITEM_HEIGHT = 60;

interface DraggableItemProps {
  choice: Choice;
  index: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  isEnabled: boolean;
  totalItems: number;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  choice,
  index,
  onReorder,
  isEnabled,
  totalItems,
}) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (!isEnabled) return;
      scale.value = withSpring(1.05);
      zIndex.value = 1000;
    },
    onActive: (event) => {
      if (!isEnabled) return;
      translateY.value = event.translationY;
    },
    onEnd: (event) => {
      if (!isEnabled) return;
      scale.value = withSpring(1);
      zIndex.value = 0;
      
      const moveY = event.translationY;
      const moveDistance = Math.round(moveY / ITEM_HEIGHT);
      
      if (moveDistance !== 0) {
        const newIndex = Math.max(0, Math.min(totalItems - 1, index + moveDistance));
        if (newIndex !== index) {
          runOnJS(onReorder)(index, newIndex);
        }
      }
      
      translateY.value = withSpring(0);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: zIndex.value,
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler} enabled={isEnabled}>
      <Animated.View style={[styles.rankingItem, animatedStyle, !isEnabled && styles.disabledOption]}>
        <View style={styles.rankingNumber}>
          <Text style={styles.rankingNumberText}>{index + 1}</Text>
        </View>
        <Text style={[styles.rankingText, !isEnabled && styles.disabledText]}>
          {choice.text}
        </Text>
        <View style={styles.dragHandle}>
          <Text style={styles.dragHandleText}>⋮⋮</Text>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

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

  const reorderItems = (fromIndex: number, toIndex: number) => {
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
        {isEnabled ? 'Drag items to reorder them by preference (most preferred at top)' : 'Items ranked by preference'}
      </Text>
      <View style={styles.itemsContainer}>
        {currentOrder.map((choiceValue, index) => {
          const choice = getChoiceByValue(choiceValue);
          if (!choice) return null;

          return (
            <DraggableItem
              key={choiceValue}
              choice={choice}
              index={index}
              onReorder={reorderItems}
              isEnabled={isEnabled}
              totalItems={currentOrder.length}
            />
          );
        })}
      </View>
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
    textAlign: 'center',
  },
  itemsContainer: {
    gap: 8,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: ITEM_HEIGHT,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rankingNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  dragHandle: {
    padding: 8,
    marginLeft: 8,
  },
  dragHandleText: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
    lineHeight: 16,
  },
  disabledOption: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  disabledText: {
    color: '#999',
  },
});

export default RankingQuestion;
