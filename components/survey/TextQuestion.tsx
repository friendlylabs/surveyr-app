import React from 'react';
import {
    StyleSheet,
    TextInput
} from 'react-native';

// Types
export interface TextQuestionProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  isEnabled: boolean;
  placeholder?: string;
  variant?: string;
  min?: number;
  max?: number;
  step?: number;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
}

/**
 * TextQuestion component that handles different types of text inputs
 * including regular text, password, email, number, etc.
 */
const TextQuestion: React.FC<TextQuestionProps> = ({
  value,
  onValueChange,
  isEnabled,
  placeholder = '',
  variant,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false
}) => {
  // Get keyboard type based on variant
  const keyboardType = getKeyboardType(variant);

  return (
    <TextInput
      style={[
        multiline ? styles.textArea : styles.textInput, 
        !isEnabled && styles.disabledInput
      ]}
      value={value || ''}
      onChangeText={onValueChange}
      placeholder={placeholder}
      editable={isEnabled}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      secureTextEntry={secureTextEntry}
    />
  );
};

// Helper function to determine keyboard type based on variant
function getKeyboardType(variant?: string): 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url' {
  switch (variant) {
    case 'email':
      return 'email-address';
    case 'number':
    case 'range':
      return 'numeric';
    case 'tel':
      return 'phone-pad';
    case 'url':
      return 'url';
    default:
      return 'default';
  }
}

// Styles
const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    paddingVertical: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
});

export default TextQuestion;
