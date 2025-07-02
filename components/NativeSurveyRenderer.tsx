// Example React Native component using the SurveyJS Parser
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createSurveyState,
  parseSurveyJS,
  validateSurveyData,
  type ParsedQuestion,
  type SurveyState
} from '../utils/surveyParser';

interface NativeSurveyRendererProps {
  surveyJSON: any;
  onComplete: (data: Record<string, any>) => void;
  onError?: (error: string) => void;
  onFileUpload?: (questionName: string, allowedTypes?: string[], maxFileSize?: number) => Promise<any>;
  onLocationRequest?: (questionName: string) => Promise<any>;
  currentLocation?: any;
  isDarkTheme?: boolean;
}

export function NativeSurveyRenderer({ 
  surveyJSON, 
  onComplete, 
  onError,
  onFileUpload,
  onLocationRequest,
  currentLocation,
  isDarkTheme 
}: NativeSurveyRendererProps) {
  const [surveyState, setSurveyState] = useState<SurveyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const parsedSurvey = parseSurveyJS(surveyJSON);
      const state = createSurveyState(parsedSurvey);
      setSurveyState(state);
      setLoading(false);
    } catch (error) {
      console.error('Survey parsing error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to parse survey');
      setLoading(false);
    }
  }, [surveyJSON, onError]);

  // Check for resetValueIf conditions whenever survey data changes
  useEffect(() => {
    if (surveyState) {
      surveyState.checkResetValues();
      // We don't need to update the state object here because checkResetValues 
      // modifies the surveyData directly in the existing state object
    }
  }, [surveyState]);

  const updateAnswer = (questionName: string, value: any) => {
    if (!surveyState) return;
    
    surveyState.updateAnswer(questionName, value);
    
    // Clear validation error for this question when user provides an answer
    if (validationErrors[questionName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionName];
        return newErrors;
      });
    }
    
    // Force re-render to update conditional logic
    setSurveyState({ ...surveyState });
  };

  const handleNext = () => {
    if (!surveyState) return;
    
    // Always validate current page first
    const currentPageValidation = surveyState.validateCurrentPage();
    if (!currentPageValidation.isValid) {
      // Convert validation errors to a map for display next to questions
      const errorMap: Record<string, string> = {};
      currentPageValidation.errors.forEach(error => {
        // Extract question name from error message (assuming format "Question Title is required")
        const currentPage = surveyState.getCurrentPage();
        currentPage.elements.forEach(question => {
          const questionTitle = question.title || question.name;
          if (error.includes(questionTitle)) {
            errorMap[question.name] = error;
          }
        });
      });
      setValidationErrors(errorMap);
      return;
    }
    
    // Clear any validation errors
    setValidationErrors({});
    
    if (surveyState.currentPageIndex === surveyState.survey.pages.length - 1) {
      // Last page - validate entire survey before completion
      const fullSurveyValidation = validateSurveyData(surveyState.survey, surveyState.surveyData);
      
      if (!fullSurveyValidation.isValid) {
        Alert.alert('Survey Incomplete', 'Please complete all required fields before submitting:\n\n' + fullSurveyValidation.errors.join('\n'));
        return;
      }
      
      // Complete survey
      onComplete(surveyState.surveyData);
    } else {
      surveyState.nextPage();
      setSurveyState({ ...surveyState });
    }
  };

  const handlePrevious = () => {
    if (!surveyState) return;
    
    // Clear validation errors when going back
    setValidationErrors({});
    
    surveyState.previousPage();
    setSurveyState({ ...surveyState });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading survey...</Text>
      </View>
    );
  }

  if (!surveyState) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load survey</Text>
      </View>
    );
  }

  const currentPage = surveyState.getCurrentPage();
  const progress = (surveyState.currentPageIndex + 1) / surveyState.survey.pages.length;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      {surveyState.survey.showProgressBar && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      )}

      {/* Survey Title */}
      {surveyState.survey.showTitle && surveyState.survey.title && (
        <Text style={styles.surveyTitle}>{surveyState.survey.title}</Text>
      )}

      {/* Page Title */}
      {surveyState.survey.showPageTitles && currentPage.title && (
        <Text style={styles.pageTitle}>{currentPage.title}</Text>
      )}

      <ScrollView style={styles.content}>
        {currentPage.elements.map((question, index) => (
          <QuestionRenderer
            key={question.id}
            question={question}
            value={surveyState.surveyData[question.name]}
            onValueChange={(value) => updateAnswer(question.name, value)}
            surveyData={surveyState.surveyData}
            isVisible={surveyState.isQuestionVisible(question)}
            isEnabled={surveyState.isQuestionEnabled(question)}
            isRequired={surveyState.isQuestionRequired(question)}
            questionNumber={surveyState.survey.showQuestionNumbers === 'on' ? index + 1 : undefined}
            onFileUpload={onFileUpload}
            onLocationRequest={onLocationRequest}
            validationError={validationErrors[question.name]}
          />
        ))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {surveyState.currentPageIndex > 0 && (
          <TouchableOpacity style={styles.buttonSecondary} onPress={handlePrevious}>
            <Text style={styles.buttonSecondaryText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={surveyState.currentPageIndex === surveyState.survey.pages.length - 1 ? styles.buttonPrimary : styles.buttonSecondary} 
          onPress={handleNext}
        >
          <Text style={surveyState.currentPageIndex === surveyState.survey.pages.length - 1 ? styles.buttonPrimaryText : styles.buttonSecondaryText}>
            {surveyState.currentPageIndex === surveyState.survey.pages.length - 1 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface QuestionRendererProps {
  question: ParsedQuestion;
  value: any;
  onValueChange: (value: any) => void;
  surveyData: Record<string, any>;
  isVisible: boolean;
  isEnabled: boolean;
  isRequired: boolean;
  questionNumber?: number;
  onFileUpload?: (questionName: string, allowedTypes?: string[], maxFileSize?: number) => Promise<any>;
  onLocationRequest?: (questionName: string) => Promise<any>;
  validationError?: string;
}

function QuestionRenderer({
  question,
  value,
  onValueChange,
  surveyData,
  isVisible,
  isEnabled,
  isRequired,
  questionNumber,
  onFileUpload,
  onLocationRequest,
  validationError
}: QuestionRendererProps) {
  if (!isVisible) return null;

  const questionTitle = question.title || question.name;
  const displayTitle = questionNumber ? `${questionNumber}. ${questionTitle}` : questionTitle;

  const renderQuestion = () => {
    switch (question.type) {
      case 'text':
        return (
          <TextInput
            style={[styles.textInput, !isEnabled && styles.disabledInput]}
            value={value || ''}
            onChangeText={onValueChange}
            placeholder={question.placeholder}
            editable={isEnabled}
            keyboardType={getKeyboardType(question.variant)}
            secureTextEntry={question.variant === 'password'}
          />
        );

      case 'comment':
        return (
          <TextInput
            style={[styles.textArea, !isEnabled && styles.disabledInput]}
            value={value || ''}
            onChangeText={onValueChange}
            placeholder={question.placeholder}
            editable={isEnabled}
            multiline
            numberOfLines={4}
          />
        );

      case 'radiogroup':
        return (
          <View style={styles.choicesContainer}>
            {question.choices?.map((choice) => (
              <TouchableOpacity
                key={choice.value}
                style={styles.radioOption}
                onPress={() => isEnabled && onValueChange(choice.value)}
                disabled={!isEnabled}
              >
                <View style={[
                  styles.radioCircle,
                  value === choice.value && styles.radioSelected,
                  !isEnabled && styles.disabledOption
                ]} />
                <Text style={[styles.choiceText, !isEnabled && styles.disabledText]}>
                  {choice.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'checkbox':
        return (
          <View style={styles.choicesContainer}>
            {question.choices?.map((choice) => {
              const isSelected = Array.isArray(value) && value.includes(choice.value);
              return (
                <TouchableOpacity
                  key={choice.value}
                  style={styles.checkboxOption}
                  onPress={() => {
                    if (!isEnabled) return;
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = isSelected
                      ? currentValues.filter(v => v !== choice.value)
                      : [...currentValues, choice.value];
                    onValueChange(newValues);
                  }}
                  disabled={!isEnabled}
                >
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                    !isEnabled && styles.disabledOption
                  ]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.choiceText, !isEnabled && styles.disabledText]}>
                    {choice.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'boolean':
        return (
          <View style={styles.booleanContainer}>
            <Switch
              value={value === true}
              onValueChange={onValueChange}
              disabled={!isEnabled}
            />
            <Text style={[styles.booleanLabel, !isEnabled && styles.disabledText]}>
              {value ? 'Yes' : 'No'}
            </Text>
          </View>
        );

      case 'rating':
        return (
          <View style={styles.ratingContainer}>
            {Array.from({ length: (question.rateMax || 5) - (question.rateMin || 1) + 1 }, (_, i) => {
              const rating = (question.rateMin || 1) + i;
              const isSelected = value === rating;
              return (
                <TouchableOpacity
                  key={rating}
                  style={[styles.ratingItem, isSelected && styles.ratingSelected]}
                  onPress={() => isEnabled && onValueChange(rating)}
                  disabled={!isEnabled}
                >
                  <Text style={[styles.ratingText, isSelected && styles.ratingTextSelected]}>
                    {question.variant === 'stars' ? '★' : rating}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'html':
        return (
          <View style={styles.htmlContainer}>
            <Text style={styles.htmlText}>{question.html || 'HTML content'}</Text>
          </View>
        );

      case 'expression':
        // For expression questions, we would evaluate the expression here
        return (
          <View style={styles.expressionContainer}>
            <Text style={styles.expressionText}>
              Calculated value: {question.expression || 'No expression'}
            </Text>
          </View>
        );

      case 'file':
        return (
          <TouchableOpacity
            style={[styles.fileUploadContainer, !isEnabled && styles.disabledInput]}
            onPress={async () => {
              if (!isEnabled || !onFileUpload) return;
              try {
                const result = await onFileUpload(question.name, question.allowedTypes, question.maxFileSize);
                if (result) {
                  onValueChange(result);
                }
              } catch (error) {
                console.error('File upload failed:', error);
              }
            }}
            disabled={!isEnabled}
          >
            <View style={styles.fileUploadContent}>
              <Text style={[styles.fileUploadIcon, !isEnabled && styles.disabledText]}>📁</Text>
              <Text style={[styles.fileUploadMainText, !isEnabled && styles.disabledText]}>
                {value ? `Selected: ${value.fileName || 'File'}` : 'Upload a file'}
              </Text>
              {question.allowedTypes && question.allowedTypes.length > 0 && (
                <Text style={[styles.fileUploadSubText, !isEnabled && styles.disabledText]}>
                  Allowed types: {question.allowedTypes.join(', ')}
                </Text>
              )}
              {question.maxFileSize && (
                <Text style={[styles.fileUploadSubText, !isEnabled && styles.disabledText]}>
                  Max size: {(question.maxFileSize / (1024 * 1024)).toFixed(1)}MB
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );

      case 'geopoint':
        return (
          <View style={styles.geopointContainer}>
            <TouchableOpacity
              style={[styles.locationButton, !isEnabled && styles.disabledInput]}
              onPress={async () => {
                if (!isEnabled || !onLocationRequest) return;
                try {
                  const location = await onLocationRequest(question.name);
                  if (location) {
                    onValueChange(location);
                  }
                } catch (error) {
                  console.error('Location request failed:', error);
                }
              }}
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

      case 'dropdown':
        return (
          <DropdownQuestion
            choices={question.choices || []}
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
            placeholder="Select an option..."
          />
        );

      case 'tagbox':
        return (
          <TagboxQuestion
            choices={question.choices || []}
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
            placeholder="Select multiple options..."
          />
        );

      case 'ranking':
        return (
          <RankingQuestion
            choices={question.choices || []}
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
          />
        );

      default:
        return (
          <View style={styles.unsupportedContainer}>
            <Text style={styles.unsupportedText}>
              Question type &apos;{question.type}&apos; not yet implemented in native renderer
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.questionContainer}>
      <Text style={[styles.questionTitle, isRequired && styles.requiredTitle]}>
        {displayTitle}
        {isRequired && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      
      {question.description && (
        <Text style={styles.questionDescription}>{question.description}</Text>
      )}
      
      {renderQuestion()}
      
      {validationError && (
        <Text style={styles.validationError}>{validationError}</Text>
      )}
    </View>
  );
}

// Dropdown component for single selection
function DropdownQuestion({ 
  choices, 
  value, 
  onValueChange, 
  isEnabled, 
  placeholder 
}: {
  choices: any[];
  value: any;
  onValueChange: (value: any) => void;
  isEnabled: boolean;
  placeholder: string;
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedChoice = choices.find(choice => choice.value === value);

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownButton, !isEnabled && styles.disabledInput]}
        onPress={() => isEnabled && setModalVisible(true)}
        disabled={!isEnabled}
      >
        <Text style={[styles.dropdownText, !isEnabled && styles.disabledText]}>
          {selectedChoice ? selectedChoice.text : placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Option</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={choices}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    value === item.value && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    value === item.value && styles.dropdownOptionTextSelected
                  ]}>
                    {item.text}
                  </Text>
                  {value === item.value && (
                    <Text style={styles.dropdownCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Tagbox component for multiple selection
function TagboxQuestion({ 
  choices, 
  value, 
  onValueChange, 
  isEnabled, 
  placeholder 
}: {
  choices: any[];
  value: any;
  onValueChange: (value: any) => void;
  isEnabled: boolean;
  placeholder: string;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleSelection = (choiceValue: string) => {
    const isSelected = selectedValues.includes(choiceValue);
    const newValues = isSelected
      ? selectedValues.filter(v => v !== choiceValue)
      : [...selectedValues, choiceValue];
    onValueChange(newValues);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const choice = choices.find(c => c.value === selectedValues[0]);
      return choice ? choice.text : selectedValues[0];
    }
    return `${selectedValues.length} items selected`;
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownButton, !isEnabled && styles.disabledInput]}
        onPress={() => isEnabled && setModalVisible(true)}
        disabled={!isEnabled}
      >
        <Text style={[styles.dropdownText, !isEnabled && styles.disabledText]}>
          {getDisplayText()}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {/* Selected tags display */}
      {selectedValues.length > 0 && (
        <View style={styles.tagContainer}>
          {selectedValues.map((selectedValue) => {
            const choice = choices.find(c => c.value === selectedValue);
            return (
              <View key={selectedValue} style={styles.tag}>
                <Text style={styles.tagText}>{choice ? choice.text : selectedValue}</Text>
                {isEnabled && (
                  <TouchableOpacity
                    style={styles.tagRemove}
                    onPress={() => toggleSelection(selectedValue)}
                  >
                    <Text style={styles.tagRemoveText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Options</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={choices}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = selectedValues.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected
                    ]}
                    onPress={() => toggleSelection(item.value)}
                  >
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[
                      styles.dropdownOptionText,
                      isSelected && styles.dropdownOptionTextSelected
                    ]}>
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Ranking component for ordering items
function RankingQuestion({ 
  choices, 
  value, 
  onValueChange, 
  isEnabled 
}: {
  choices: any[];
  value: any;
  onValueChange: (value: any) => void;
  isEnabled: boolean;
}) {
  const orderedValues = Array.isArray(value) ? value : [];
  
  // Initialize with all choices if no value is set
  const initializeRanking = () => {
    if (orderedValues.length === 0) {
      const initialOrder = choices.map(choice => choice.value);
      onValueChange(initialOrder);
      return initialOrder;
    }
    return orderedValues;
  };

  const currentOrder = orderedValues.length > 0 ? orderedValues : initializeRanking();

  const moveItem = (fromIndex: number, toIndex: number) => {
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
        Drag items to reorder them by preference (most preferred at top)
      </Text>
      {currentOrder.map((choiceValue, index) => {
        const choice = getChoiceByValue(choiceValue);
        if (!choice) return null;

        return (
          <View key={choiceValue} style={[
            styles.rankingItem,
            !isEnabled && styles.disabledOption
          ]}>
            <View style={styles.rankingNumber}>
              <Text style={styles.rankingNumberText}>{index + 1}</Text>
            </View>
            <Text style={[styles.rankingText, !isEnabled && styles.disabledText]}>
              {choice.text}
            </Text>
            <View style={styles.rankingControls}>
              {index > 0 && isEnabled && (
                <TouchableOpacity
                  style={styles.rankingButton}
                  onPress={() => moveItem(index, index - 1)}
                >
                  <Text style={styles.rankingButtonText}>▲</Text>
                </TouchableOpacity>
              )}
              {index < currentOrder.length - 1 && isEnabled && (
                <TouchableOpacity
                  style={styles.rankingButton}
                  onPress={() => moveItem(index, index + 1)}
                >
                  <Text style={styles.rankingButtonText}>▼</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function getKeyboardType(variant?: string) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    margin: 16,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196f3',
    borderRadius: 2,
  },
  surveyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#333',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    color: '#555',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  questionContainer: {
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 16,
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
  questionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  validationError: {
    fontSize: 14,
    color: '#d32f2f',
    marginTop: 4,
    fontStyle: 'italic',
  },
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
  choicesContainer: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
  },
  radioSelected: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  choiceText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  disabledOption: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
  booleanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  booleanLabel: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  ratingSelected: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  ratingText: {
    fontSize: 16,
    color: '#333',
  },
  ratingTextSelected: {
    color: '#fff',
  },
  htmlContainer: {
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  htmlText: {
    fontSize: 14,
    color: '#333',
  },
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
  unsupportedContainer: {
    padding: 8,
    backgroundColor: '#fff3e0',
    borderRadius: 4,
  },
  unsupportedText: {
    fontSize: 14,
    color: '#f57c00',
    fontStyle: 'italic',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  buttonPrimary: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonSecondary: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
    flex: 1,
    marginRight: 8,
  },
  buttonSecondaryText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  fileUploadContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileUploadContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileUploadIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  fileUploadMainText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  fileUploadSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
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
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 16,
    backgroundColor: '#f1f1f1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#333',
  },
  dropdownOption: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownOptionTextSelected: {
    fontWeight: '600',
  },
  dropdownCheckmark: {
    fontSize: 16,
    color: '#10B981',
    marginLeft: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 16,
    color: '#333',
  },
  tagRemove: {
    marginLeft: 8,
  },
  tagRemoveText: {
    fontSize: 16,
    color: '#d32f2f',
  },
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
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  rankingNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  rankingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rankingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Additional styles for modal done button
  modalDoneButton: {
    backgroundColor: '#2196f3',
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
});

export default NativeSurveyRenderer;
