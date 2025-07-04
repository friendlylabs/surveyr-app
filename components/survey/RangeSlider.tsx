import React, { useRef, useState } from 'react';
import {
    GestureResponderEvent,
    PanResponder,
    PanResponderGestureState,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

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
 * RangeSlider component for range/slider inputs
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
  
  // Reference to track container for layout measurements
  const trackRef = useRef<View>(null);
  const [trackLayout, setTrackLayout] = useState({ width: 0, x: 0 });
  
  // Calculate the position percentage for the slider thumb
  const percentage = ((localValue - minValue) / (maxValue - minValue)) * 100;
  
  // Update local value and parent value
  const handleValueChange = (newValue: number) => {
    // Snap to step increments
    const snappedValue = Math.round((newValue - minValue) / step) * step + minValue;
    // Ensure the value is within bounds
    const boundedValue = Math.max(minValue, Math.min(maxValue, snappedValue));
    setLocalValue(boundedValue);
    onValueChange(boundedValue);
  };

  // Handle direct tap on the slider track
  const handleTrackPress = (event: GestureResponderEvent) => {
    if (!isEnabled || trackLayout.width === 0) return;
    
    // Calculate tap position relative to the track
    // Using measure to get absolute positioning
    trackRef.current?.measure((x, y, width, height, pageX, pageY) => {
      const tapX = event.nativeEvent.pageX - pageX;
      const percentage = Math.max(0, Math.min(1, tapX / width));
      const newValue = minValue + percentage * (maxValue - minValue);
      handleValueChange(newValue);
    });
  };

  // State to store the starting thumb position for dragging
  const [thumbStartX, setThumbStartX] = useState(0);

  // For handling thumb dragging
  const handleThumbMove = (event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    if (!isEnabled || trackLayout.width === 0) return;
    
    // Calculate new position based on drag distance
    const newX = Math.max(0, Math.min(trackLayout.width, thumbStartX + gestureState.dx));
    const newPercentage = newX / trackLayout.width;
    const newValue = minValue + newPercentage * (maxValue - minValue);
    handleValueChange(newValue);
  };

  // Create pan responder for the thumb
  const thumbPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isEnabled,
      onMoveShouldSetPanResponder: () => isEnabled,
      onPanResponderGrant: () => {
        // Store the current thumb position when starting to drag
        setThumbStartX(percentage * trackLayout.width / 100);
      },
      onPanResponderMove: handleThumbMove,
      onPanResponderRelease: () => {}
    })
  ).current;

  return (
    <View style={styles.sliderContainer}>
      {/* Track background with tap handling */}
      <View 
        ref={trackRef}
        style={styles.sliderTrackContainer}
        onLayout={(event) => {
          const { width, x } = event.nativeEvent.layout;
          setTrackLayout({ width, x });
        }}
      >
        {/* Touchable track area */}
        <TouchableOpacity
          activeOpacity={isEnabled ? 0.8 : 1}
          disabled={!isEnabled}
          style={[
            styles.sliderTrack,
            !isEnabled && styles.disabledSliderTrack
          ]}
          onPress={handleTrackPress}
        >
          {/* Colored fill area */}
          <View 
            style={[
              styles.sliderFill, 
              { width: `${percentage}%` },
              !isEnabled && styles.disabledSliderFill
            ]} 
          />
        </TouchableOpacity>

        {/* Draggable thumb */}
        <View 
          style={[
            styles.sliderThumb,
            { left: `${percentage}%` },
            !isEnabled && styles.disabledSliderThumb
          ]} 
          {...(isEnabled ? thumbPanResponder.panHandlers : {})}
        />
      </View>
      
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
  sliderTrackContainer: {
    position: 'relative',
    width: '100%', 
    height: 40, // Height including the touch area
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    width: '100%',
  },
  sliderFill: {
    height: 6,
    backgroundColor: '#10B981',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    width: 28,
    height: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#10B981',
    position: 'absolute',
    top: '50%',
    marginTop: -14,
    marginLeft: -14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    zIndex: 2, // Ensure thumb is above other elements
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
  disabledSliderTrack: {
    opacity: 0.5,
  },
  disabledSliderFill: {
    backgroundColor: '#9CA3AF',
  },
  disabledSliderThumb: {
    borderColor: '#9CA3AF',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default RangeSlider;
