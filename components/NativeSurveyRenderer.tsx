// Example React Native component using the SurveyJS Parser
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  createSurveyState,
  parseSurveyJS,
  validateSurveyData,
  type ParsedQuestion,
  type SurveyState
} from '../utils/surveyParser';
import {
  BooleanQuestion,
  CheckboxQuestion,
  ColorPicker,
  DatePicker,
  DropdownQuestion,
  ExpressionQuestion,
  FileUploadQuestion,
  GeopointQuestion,
  HtmlContent,
  ImagePickerQuestion,
  ImageQuestion,
  MatrixDropdownQuestion,
  MatrixQuestion,
  MicrophoneQuestion,
  MultipletextQuestion,
  RadioGroupQuestion,
  RangeSlider,
  RankingQuestion,
  RatingQuestion,
  SignaturePadQuestion,
  TagboxQuestion,
  TextQuestion
} from './survey';

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
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    try {
      const parsedSurvey = parseSurveyJS(surveyJSON);
      const state = createSurveyState(parsedSurvey);
      
      // Skip to first visible page if current page is not visible
      const currentPage = state.getCurrentPage();
      if (!state.isPageVisible(currentPage)) {
        // Find the first visible page
        for (let i = 0; i < state.survey.pages.length; i++) {
          if (state.isPageVisible(state.survey.pages[i])) {
            state.currentPageIndex = i;
            break;
          }
        }
      }
      
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
    
    // Check if this is the last page or if there are no more visible pages
    const isLastPageOrNoMoreVisiblePages = 
      surveyState.currentPageIndex === surveyState.survey.pages.length - 1 || 
      !surveyState.hasVisiblePagesAfterCurrent();
    
    if (isLastPageOrNoMoreVisiblePages) {
      // Last page or no more visible pages - validate entire survey before completion
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

      <ScrollView style={styles.content} scrollEnabled={scrollEnabled}>
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
            onScrollEnable={setScrollEnabled}
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
        
        {/* Determine if this is the last actionable page (either the last page or there are no more visible pages) */}
        {(() => {
          const isLastPageOrNoMoreVisiblePages = 
            surveyState.currentPageIndex === surveyState.survey.pages.length - 1 || 
            !surveyState.hasVisiblePagesAfterCurrent();
            
          return (
            <TouchableOpacity 
              style={isLastPageOrNoMoreVisiblePages ? styles.buttonPrimary : styles.buttonSecondary} 
              onPress={handleNext}
            >
              <Text style={isLastPageOrNoMoreVisiblePages ? styles.buttonPrimaryText : styles.buttonSecondaryText}>
                {isLastPageOrNoMoreVisiblePages ? 'Complete' : 'Next'}
              </Text>
            </TouchableOpacity>
          );
        })()}
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
  onScrollEnable?: (enabled: boolean) => void;
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
  validationError,
  onScrollEnable
}: QuestionRendererProps) {
  if (!isVisible) return null;

  const questionTitle = question.title || question.name;
  const displayTitle = questionNumber ? `${questionNumber}. ${questionTitle}` : questionTitle;

  const renderQuestion = () => {
    switch (question.type) {
      case 'text':
        switch (question.variant) {
          case 'color':
            return (
              <ColorPicker 
                color={value || '#ffffff'} 
                onValueChange={onValueChange} 
                isEnabled={isEnabled} 
              />
            );
            
          case 'date':
            return (
              <DatePicker 
                value={value} 
                onValueChange={onValueChange} 
                isEnabled={isEnabled} 
                mode="date"
                placeholder={question.placeholder || "Select a date"} 
              />
            );
            
          case 'datetime-local':
            return (
              <DatePicker 
                value={value} 
                onValueChange={onValueChange} 
                isEnabled={isEnabled} 
                mode="datetime"
                placeholder={question.placeholder || "Select date and time"} 
              />
            );
            
          case 'month':
            return (
              <DatePicker 
                value={value} 
                onValueChange={onValueChange} 
                isEnabled={isEnabled} 
                mode="month"
                placeholder={question.placeholder || "Select a month"} 
              />
            );
            
          case 'time':
            return (
              <DatePicker 
                value={value} 
                onValueChange={onValueChange} 
                isEnabled={isEnabled} 
                mode="time"
                placeholder={question.placeholder || "Select a time"} 
              />
            );
            
          case 'week':
            return (
              <DatePicker 
                value={value} 
                onValueChange={onValueChange} 
                isEnabled={isEnabled} 
                mode="week"
                placeholder={question.placeholder || "Select a week"} 
              />
            );
            
          case 'range':
            // Get min and max from question properties or use defaults
            const min = question.min !== undefined ? Number(question.min) : 0;
            const max = question.max !== undefined ? Number(question.max) : 10;
            const step = question.step !== undefined ? Number(question.step) : 1;
            
            return (
              <RangeSlider 
                value={value !== undefined ? Number(value) : min}
                minimumValue={min}
                maximumValue={max}
                step={step}
                onValueChange={onValueChange}
                isEnabled={isEnabled}
              />
            );
            
          case 'password':
            return (
              <TextQuestion
                value={value}
                onValueChange={onValueChange}
                placeholder={question.placeholder || "Password"}
                isEnabled={isEnabled}
                secureTextEntry={true}
                variant={question.variant}
              />
            );
            
          default:
            return (
              <TextQuestion
                value={value}
                onValueChange={onValueChange}
                placeholder={question.placeholder}
                isEnabled={isEnabled}
                variant={question.variant}
              />
            );
        }

      case 'comment':
        return (
          <TextQuestion
            value={value}
            onValueChange={onValueChange}
            placeholder={question.placeholder}
            isEnabled={isEnabled}
            multiline={true}
            numberOfLines={4}
          />
        );

      case 'radiogroup':
        return (
          <RadioGroupQuestion
            choices={question.choices || []}
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
          />
        );

      case 'checkbox':
        return (
          <CheckboxQuestion
            choices={question.choices || []}
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
          />
        );

      case 'boolean':
        return (
          <BooleanQuestion
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
          />
        );

      case 'rating':
        return (
          <RatingQuestion
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
            rateMin={question.rateMin}
            rateMax={question.rateMax}
            variant={question.variant}
          />
        );

      case 'html':
        return (
          <HtmlContent html={question.html || 'HTML content'} />
        );

      case 'expression':
        return (
          <ExpressionQuestion
            expression={question.expression}
            value={value}
          />
        );
        
      case 'matrix':
        return (
          <MatrixQuestion
            rows={question.rows || []}
            columns={question.choices || []}
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
          />
        );
        
      case 'matrixdropdown':
        return (
          <MatrixDropdownQuestion
            rows={question.rows || []}
            columns={question.columns || []}
            choices={question.choices}
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
            dynamic={false}
          />
        );
        
      case 'matrixdynamic':
        return (
          <MatrixDropdownQuestion
            rows={question.rows || []}
            columns={question.columns || []}
            choices={question.choices}
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
            dynamic={true}
            minRowCount={question.minRowCount || 0}
            maxRowCount={question.maxRowCount || 10}
          />
        );

      case 'file':
        return (
          <FileUploadQuestion
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
            questionName={question.name}
            allowedTypes={question.allowedTypes}
            maxFileSize={question.maxFileSize}
            onFileUpload={onFileUpload}
          />
        );

      case 'geopoint':
        return (
          <GeopointQuestion
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
            questionName={question.name}
            onLocationRequest={onLocationRequest}
          />
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
        
      case 'imagepicker':
        // Transform choices to include imageLink for ImagePickerQuestion
        const imageChoices = (question.choices || []).map(choice => ({
          value: choice.value,
          text: choice.text,
          imageLink: choice.imageLink || ''
        }));
        
        return (
          <ImagePickerQuestion
            choices={imageChoices}
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
            contentMode={(question.contentMode as 'image' | 'video') || 'image'}
            imageFit={(question.imageFit as 'cover' | 'contain' | 'fill' | 'scale-down') || 'cover'}
            showLabel={question.showLabel !== false}
            imageWidth={question.imageWidth}
            imageHeight={question.imageHeight}
            multiSelect={question.multiSelect}
          />
        );
        
      case 'image':
        return (
          <ImageQuestion
            imageLink={question.imageLink || ''}
            contentMode={(question.contentMode as 'image' | 'video' | 'youtube') || 'image'}
            imageFit={(question.imageFit as 'cover' | 'contain' | 'fill' | 'scale-down') || 'cover'}
            imageHeight={question.imageHeight}
            imageWidth={question.imageWidth}
            title={question.title}
            description={question.description}
          />
        );
        
      case 'multipletext':
        // Prepare items for the multipletext component
        const textItems = question.elements?.map(element => ({
          name: element.name.split('.').pop() || element.name,
          title: element.title,
          placeholder: element.placeholder,
          inputType: element.variant,
          required: element.isRequired
        })) || [];
        
        return (
          <MultipletextQuestion
            items={textItems}
            value={value || {}}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
          />
        );

      case 'signaturepad':
        return (
          <SignaturePadQuestion
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
            placeholder={question.placeholder || "Please sign here"}
            backgroundColor={question.backgroundColor}
            penColor={question.penColor}
            penSize={question.penSize}
            minWidth={question.minWidth}
            maxWidth={question.maxWidth}
            trimWhitespace={question.trimWhitespace}
            onScrollEnable={onScrollEnable}
          />
        );

      case 'microphone':
        return (
          <MicrophoneQuestion
            value={value}
            onValueChange={onValueChange}
            isEnabled={isEnabled}
            placeholder={question.placeholder || "Tap to record audio"}
            maxDuration={question.maxDuration}
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
      {/* Don't show title/description for image and html types as they are descriptive content */}
      {question.type !== 'image' && question.type !== 'html' && (
        <>
          <Text style={[styles.questionTitle, isRequired && styles.requiredTitle]}>
            {displayTitle}
            {isRequired && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
          
          {question.description && (
            <Text style={styles.questionDescription}>{question.description}</Text>
          )}
        </>
      )}
      
      {renderQuestion()}
      
      {validationError && (
        <Text style={styles.validationError}>{validationError}</Text>
      )}
    </View>
  );
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
    marginBottom: 18,
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
  ratingSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  ratingText: {
    fontSize: 16,
    color: '#333',
  },
  ratingTextSelected: {
    color: '#fff',
  },
  htmlContainer: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  htmlText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  htmlParagraph: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  htmlHeading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginVertical: 12,
  },
  htmlHeading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  htmlHeading3: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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
    backgroundColor: '#10B981', // Using primary color
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
