import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ParsedQuestion } from '../../utils/surveyParser';

interface PanelQuestionProps {
  question: ParsedQuestion;
  value: Record<string, any>;
  onValueChange: (value: Record<string, any>) => void;
  surveyData: Record<string, any>;
  isVisible: boolean;
  isEnabled: boolean;
  isRequired: boolean;
  isDynamic?: boolean;
  minPanelCount?: number;
  maxPanelCount?: number;
  renderQuestion: (question: ParsedQuestion, parentName?: string, index?: number) => React.ReactNode;
}

export function PanelQuestion({
  question,
  value,
  onValueChange,
  surveyData,
  isVisible,
  isEnabled,
  isRequired,
  isDynamic = false,
  minPanelCount = 1,
  maxPanelCount = 10,
  renderQuestion
}: PanelQuestionProps) {
  // For dynamic panels, handle array of panel instances
  const panelData = Array.isArray(value) ? value : [];
  const panelCount = panelData.length;

  // Ensure minimum panel count for dynamic panels
  React.useEffect(() => {
    if (isDynamic && panelCount < minPanelCount) {
      const newPanelData = [];
      for (let i = 0; i < minPanelCount; i++) {
        const newPanel: Record<string, any> = {};
        question.elements?.forEach(element => {
          if (element.defaultValue !== undefined) {
            newPanel[element.name] = element.defaultValue;
          }
        });
        newPanelData.push(newPanel);
      }
      onValueChange(newPanelData);
    }
  }, [isDynamic, minPanelCount, panelCount, question.elements, onValueChange]);

  if (!isVisible) return null;

  // For static panels, just render the questions directly
  if (!isDynamic) {
    return (
      <View style={styles.panelContainer}>
        {question.title && (
          <Text style={[styles.panelTitle, isRequired && styles.requiredTitle]}>
            {question.title}
            {isRequired && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        )}
        {question.description && (
          <Text style={styles.panelDescription}>{question.description}</Text>
        )}
        <View style={styles.panelContent}>
          {question.elements?.map((element) => (
            <View key={element.id}>
              {renderQuestion(element, question.name)}
            </View>
          ))}
        </View>
      </View>
    );
  }

  // For dynamic panels, handle array of panel instances
  const addPanel = () => {
    if (!isEnabled || panelCount >= maxPanelCount) return;
    
    const newPanel: Record<string, any> = {};
    // Initialize with default values for questions in the panel
    question.elements?.forEach(element => {
      if (element.defaultValue !== undefined) {
        newPanel[element.name] = element.defaultValue;
      }
    });
    
    const newPanelData = [...panelData, newPanel];
    onValueChange(newPanelData);
  };

  const removePanel = (index: number) => {
    if (!isEnabled || panelCount <= minPanelCount) return;
    
    const newPanelData = panelData.filter((_, i) => i !== index);
    onValueChange(newPanelData);
  };

  const updatePanelData = (index: number, questionName: string, questionValue: any) => {
    const newPanelData = [...panelData];
    if (!newPanelData[index]) {
      newPanelData[index] = {};
    }
    newPanelData[index][questionName] = questionValue;
    onValueChange(newPanelData);
  };

  return (
    <View style={styles.panelContainer}>
      {question.title && (
        <Text style={[styles.panelTitle, isRequired && styles.requiredTitle]}>
          {question.title}
          {isRequired && <Text style={styles.requiredAsterisk}> *</Text>}
        </Text>
      )}
      {question.description && (
        <Text style={styles.panelDescription}>{question.description}</Text>
      )}

      {/* Dynamic panel instances */}
      {panelData.map((panel, index) => (
        <View key={index} style={styles.dynamicPanelInstance}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelInstanceTitle}>
              {question.title ? `${question.title} ${index + 1}` : `Panel ${index + 1}`}
            </Text>
            {isEnabled && panelCount > minPanelCount && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePanel(index)}
              >
                <Ionicons name="close-circle" size={24} color="#f44336" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.panelContent}>
            {question.elements?.map((element) => {
              // Create a modified question renderer that updates the panel data
              const wrappedRenderQuestion = (childQuestion: ParsedQuestion) => {
                // Clone the question with panel-specific props
                const modifiedQuestion = {
                  ...childQuestion,
                  id: `${question.name}[${index}].${childQuestion.name}`,
                };

                // Create a mock question renderer component
                return (
                  <View key={childQuestion.id} style={styles.childQuestion}>
                    {renderQuestion(modifiedQuestion, question.name, index)}
                  </View>
                );
              };

              return wrappedRenderQuestion(element);
            })}
          </View>
        </View>
      ))}

      {/* Add panel button */}
      {isEnabled && panelCount < maxPanelCount && (
        <TouchableOpacity
          style={[styles.addButton, !isEnabled && styles.disabledButton]}
          onPress={addPanel}
          disabled={!isEnabled}
        >
          <Ionicons name="add-circle-outline" size={20} color="#10B981" />
          <Text style={[styles.addButtonText, !isEnabled && styles.disabledText]}>
            Add {question.title || 'Panel'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Panel count info */}
      <Text style={styles.countInfo}>
        {panelCount} of {maxPanelCount} panels
        {minPanelCount > 0 && ` (minimum: ${minPanelCount})`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panelContainer: {
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  requiredTitle: {
    color: '#333',
  },
  requiredAsterisk: {
    color: '#d32f2f',
  },
  panelDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  panelContent: {
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#e0e0e0',
  },
  dynamicPanelInstance: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  panelInstanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  childQuestion: {
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#f0fff4',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledButton: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  disabledText: {
    color: '#999',
  },
  countInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default PanelQuestion;
