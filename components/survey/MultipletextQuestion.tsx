import React from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';
import { TextQuestion } from './';

export interface TextItem {
  name: string;
  title?: string;
  placeholder?: string;
  inputType?: string;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
}

export interface MultipletextQuestionProps {
  items: TextItem[];
  value: Record<string, string> | undefined;
  onValueChange: (value: Record<string, string>) => void;
  isEnabled: boolean;
}

/**
 * MultipletextQuestion component for multiple text inputs
 * 
 * This component displays a group of text inputs, each with its own label
 */
const MultipletextQuestion: React.FC<MultipletextQuestionProps> = ({
  items,
  value = {},
  onValueChange,
  isEnabled
}) => {
  // Handle individual text field changes
  const handleTextChange = (itemName: string, itemValue: string) => {
    if (!isEnabled) return;
    
    // Update only the changed field within the record
    const updatedValue = {
      ...value,
      [itemName]: itemValue
    };
    
    onValueChange(updatedValue);
  };

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={item.name} style={styles.itemContainer}>
          {item.title && (
            <Text style={[
              styles.itemLabel,
              item.required && styles.requiredLabel,
              !isEnabled && styles.disabledText
            ]}>
              {item.title}
              {item.required && <Text style={styles.requiredAsterisk}> *</Text>}
            </Text>
          )}
          
          <TextQuestion
            value={value?.[item.name] || ''}
            onValueChange={(text) => handleTextChange(item.name, text)}
            placeholder={item.placeholder || ''}
            isEnabled={isEnabled}
            variant={item.inputType}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  itemContainer: {
    marginBottom: 12,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  requiredLabel: {
    color: '#111',
  },
  requiredAsterisk: {
    color: '#E53935',
  },
  disabledText: {
    color: '#999',
  },
});

export default MultipletextQuestion;
