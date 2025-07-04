import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RatingQuestionProps {
  value: number;
  onValueChange: (value: number) => void;
  isEnabled: boolean;
  rateMin?: number;
  rateMax?: number;
  variant?: string;
}

export function RatingQuestion({
  value,
  onValueChange,
  isEnabled,
  rateMin = 1,
  rateMax = 5,
  variant
}: RatingQuestionProps) {
  const totalRatings = rateMax - rateMin + 1;
  const needsMultipleRows = totalRatings > 6;
  const itemsPerRow = needsMultipleRows ? 5 : totalRatings;
  
  // Create rating rows
  const ratingRows = [];
  let remainingItems = totalRatings;
  let currentIndex = 0;
  
  while (remainingItems > 0) {
    const rowItems = Math.min(remainingItems, itemsPerRow);
    const isLastRow = remainingItems <= itemsPerRow;
    const rowStyle = {
      flexDirection: 'row' as const,
      justifyContent: isLastRow && needsMultipleRows ? 'center' as const : 'space-around' as const,
      marginBottom: 10
    };
    
    const rowContent = Array.from({ length: rowItems }, (_, i) => {
      const itemIndex = currentIndex + i;
      const rating = rateMin + itemIndex;
      const isHighlighted = value !== undefined && rating <= value;
      
      // Calculate color based on rating value (red -> yellow -> green gradient)
      const colorRatio = (rating - rateMin) / (rateMax - rateMin);
      let backgroundColor = '#ff4d4d'; // Default to red (low rating)
      if (colorRatio >= 0.67) {
        backgroundColor = '#10B981'; // Primary color for high ratings
      } else if (colorRatio >= 0.33) {
        backgroundColor = '#ffcc00'; // Yellow for mid ratings
      }
      
      return (
        <TouchableOpacity
          key={rating}
          style={[
            styles.ratingItem, 
            isHighlighted && { backgroundColor, borderColor: backgroundColor }
          ]}
          onPress={() => isEnabled && onValueChange(rating)}
          disabled={!isEnabled}
        >
          <Text style={[styles.ratingText, isHighlighted && styles.ratingTextSelected]}>
            {variant === 'stars' ? '★' : rating}
          </Text>
        </TouchableOpacity>
      );
    });
    
    ratingRows.push(
      <View key={`row-${currentIndex}`} style={rowStyle}>
        {rowContent}
      </View>
    );
    
    currentIndex += rowItems;
    remainingItems -= rowItems;
  }
  
  return (
    <View style={styles.ratingContainer}>
      {ratingRows}
    </View>
  );
}

const styles = StyleSheet.create({
  ratingContainer: {
    flexDirection: 'column',
    marginTop: 8,
  },
  ratingItem: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 44,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    color: '#333',
  },
  ratingTextSelected: {
    color: '#fff',
  },
});

export default RatingQuestion;
