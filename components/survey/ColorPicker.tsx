import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Types
export interface ColorPickerProps {
  color?: string;
  value?: string;
  onColorChange?: (color: string) => void;
  onValueChange?: (value: string) => void;
  isEnabled: boolean;
}

/**
 * ColorPicker component for color selection
 */
const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  value,
  onColorChange,
  onValueChange,
  isEnabled
}) => {
  // Use color or value prop, with fallback to default
  const colorValue = color || value || '#FFFFFF';
  
  // Use appropriate callback
  const handleColorChange = (newColor: string) => {
    if (onColorChange) onColorChange(newColor);
    if (onValueChange) onValueChange(newColor);
  };
  
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Predefined colors for a simple color picker
  const colors = [
    '#FF0000', '#FF9900', '#FFCC00', '#33CC33', '#3366FF', 
    '#9933FF', '#FF3399', '#000000', '#666666', '#CCCCCC', 
    '#FFFFFF', '#990000', '#663300', '#336600', '#003366', 
    '#330066', '#660033', '#FFCCCC', '#FFFF99', '#CCFFCC'
  ];
  
  return (
    <View>
      <TouchableOpacity 
        style={[
          styles.colorPreview, 
          { backgroundColor: colorValue },
          !isEnabled && styles.disabledInput
        ]}
        onPress={() => isEnabled && setShowColorPicker(true)}
        disabled={!isEnabled}
      >
        <Text style={[styles.colorPickerText, { color: getContrastColor(colorValue) }]}>
          {colorValue}
        </Text>
      </TouchableOpacity>
      
      <Modal
        visible={showColorPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.colorPickerContainer}>
            <Text style={styles.modalTitle}>Select a Color</Text>
            
            <FlatList
              data={colors}
              keyExtractor={(item) => item}
              numColumns={5}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.colorOption,
                    { backgroundColor: item },
                    colorValue === item && styles.selectedColorOption
                  ]}
                  onPress={() => {
                    handleColorChange(item);
                    setShowColorPicker(false);
                  }}
                >
                  {colorValue === item && (
                    <Text style={{ color: getContrastColor(item) }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowColorPicker(false)}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Helper function to determine if text should be white or black based on background color
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance - standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Styles
const styles = StyleSheet.create({
  colorPreview: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  colorPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  colorOption: {
    width: 50,
    height: 50,
    margin: 5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  modalDoneButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
});

export default ColorPicker;
