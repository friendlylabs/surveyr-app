import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Types
export interface RangeSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  minimumValue?: number;
  maximumValue?: number;
  onValueChange: (value: number) => void;
  isEnabled: boolean;
}

/**
 * RangeSlider component for range/slider inputs using @react-native-community/slider
 */
const RangeSlider: React.FC<RangeSliderProps> = ({
  value,
  min = 0,
  max = 10,
  step = 1,
  minimumValue,
  maximumValue,
  onValueChange,
  isEnabled
}) => {
  // Use provided min/max values or their aliases
  const minValue = minimumValue !== undefined ? minimumValue : min;
  const maxValue = maximumValue !== undefined ? maximumValue : max;
  const [localValue, setLocalValue] = useState(value || minValue);
  
  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value || minValue);
  }, [value, minValue]);

  // Handle value changes
  const handleValueChange = (newValue: number) => {
    setLocalValue(newValue);
    onValueChange(newValue);
  };

  return (
    <View style={styles.sliderContainer}>
      {/* Slider component */}
      <Slider
        style={styles.slider}
        minimumValue={minValue}
        maximumValue={maxValue}
        step={step}
        value={localValue}
        onValueChange={handleValueChange}
        disabled={!isEnabled}
        minimumTrackTintColor={isEnabled ? "#10B981" : "#9CA3AF"}
        maximumTrackTintColor="#E5E7EB"
        thumbTintColor={isEnabled ? "#10B981" : "#9CA3AF"}
      />
      
      {/* Value labels */}
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderMinLabel}>{minValue}</Text>
        <Text style={styles.sliderValue}>{localValue}</Text>
        <Text style={styles.sliderMaxLabel}>{maxValue}</Text>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  sliderContainer: {
    width: '100%',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sliderMinLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  sliderMaxLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
});

export default RangeSlider;
