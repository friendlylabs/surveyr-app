import React from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';

// Types
export interface ExpressionQuestionProps {
  expression?: string;
  value?: any;
}

/**
 * ExpressionQuestion component for displaying calculated expressions
 */
const ExpressionQuestion: React.FC<ExpressionQuestionProps> = ({
  expression,
  value
}) => {
  // Display the expression or its calculated value
  const displayValue = value !== undefined ? value : expression;

  return (
    <View style={styles.expressionContainer}>
      <Text style={styles.expressionText}>
        Calculated value: {displayValue || 'No expression'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  expressionContainer: {
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  expressionText: {
    fontSize: 14,
    color: '#1976d2',
    fontStyle: 'italic',
  },
});

export default ExpressionQuestion;
