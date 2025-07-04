import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Types
export interface GeopointQuestionProps {
  value?: any;
  onValueChange: (value: any) => void;
  isEnabled: boolean;
  questionName: string;
  onLocationRequest?: (questionName: string) => Promise<any>;
}

/**
 * GeopointQuestion component for location-based questions
 */
const GeopointQuestion: React.FC<GeopointQuestionProps> = ({
  value,
  onValueChange,
  isEnabled,
  questionName,
  onLocationRequest
}) => {
  const handleLocationRequest = async () => {
    if (!isEnabled || !onLocationRequest) return;
    try {
      const location = await onLocationRequest(questionName);
      if (location) {
        onValueChange(location);
      }
    } catch (error) {
      console.error('Location request failed:', error);
    }
  };

  return (
    <View style={styles.geopointContainer}>
      <TouchableOpacity
        style={[styles.locationButton, !isEnabled && styles.disabledInput]}
        onPress={handleLocationRequest}
        disabled={!isEnabled}
      >
        <Text style={[styles.locationButtonText, !isEnabled && styles.disabledText]}>
          {value ? `Location: ${value.latitude?.toFixed(6)}, ${value.longitude?.toFixed(6)}` : 'Get Current Location'}
        </Text>
      </TouchableOpacity>
      {value && (
        <Text style={styles.locationAccuracy}>
          Accuracy: ±{value.accuracy?.toFixed(0)}m
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  geopointContainer: {
    marginTop: 8,
  },
  locationButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationButtonText: {
    fontSize: 16,
    color: '#1976d2',
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  disabledText: {
    color: '#999',
  },
});

export default GeopointQuestion;
