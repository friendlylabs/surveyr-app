import { ParsedSurvey, ParsedPage, ParsedQuestion, ValidationResult } from './types';
import { evaluateCondition } from './expressionEvaluator';

// Helper function to validate an element (question or panel)
function validateElement(question: ParsedQuestion, surveyData: Record<string, any>, errors: string[]): void {
  const value = surveyData[question.name];
  
  // Check if element is visible and enabled
  const isVisible = !question.visibleIf || evaluateCondition(question.visibleIf, surveyData);
  const isEnabled = !question.enableIf || evaluateCondition(question.enableIf, surveyData);
  
  if (!isVisible || !isEnabled) return;
  
  // For panels, validate child elements
  if (question.elements) {
    for (const childElement of question.elements) {
      validateElement(childElement, surveyData, errors);
    }
    return;
  }
    
  // Check required fields
  const isRequired = question.isRequired || 
                    (question.requiredIf && evaluateCondition(question.requiredIf, surveyData));
  
  if (isRequired && (value === undefined || value === null || value === '')) {
    errors.push(`${question.title || question.name} is required`);
  }
  
  // Type-specific validation
  if (value !== undefined && value !== null && value !== '') {
    switch (question.type) {
      case 'text':
        if (question.variant === 'email' && !isValidEmail(String(value))) {
          errors.push(`${question.title || question.name} must be a valid email`);
        }
        if (question.variant === 'number' && isNaN(Number(value))) {
          errors.push(`${question.title || question.name} must be a number`);
        }
        if (question.minLength && String(value).length < question.minLength) {
          errors.push(`${question.title || question.name} must be at least ${question.minLength} characters`);
        }
        if (question.maxLength && String(value).length > question.maxLength) {
          errors.push(`${question.title || question.name} must be no more than ${question.maxLength} characters`);
        }
        break;
        
      case 'file':
        if (question.multiple && !Array.isArray(value)) {
          errors.push(`${question.title || question.name} must be an array for multiple files`);
        }
        break;
        
      case 'microphone':
        if (typeof value !== 'string') {
          errors.push(`${question.title || question.name} must be a valid audio file`);
        }
        break;
    }
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate survey data against parsed survey
export function validateSurveyData(parsedSurvey: ParsedSurvey, surveyData: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  
  // Only validate questions on visible pages
  for (const page of parsedSurvey.pages) {
    // Skip validation for invisible pages
    if (page.visibleIf && !evaluateCondition(page.visibleIf, surveyData)) {
      continue;
    }
    
    // Validate all questions on this visible page
    for (const element of page.elements) {
      validateElement(element, surveyData, errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate only questions on a specific page
export function validatePageData(page: ParsedPage, surveyData: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  
  function validateQuestions(questions: ParsedQuestion[]) {
    for (const question of questions) {
      const value = surveyData[question.name];
      
      // Check if question is visible and enabled
      const isVisible = !question.visibleIf || evaluateCondition(question.visibleIf, surveyData);
      const isEnabled = !question.enableIf || evaluateCondition(question.enableIf, surveyData);
      
      if (!isVisible || !isEnabled) continue;
      
      // Check required fields
      const isRequired = question.isRequired || 
                        (question.requiredIf && evaluateCondition(question.requiredIf, surveyData));
      
      if (isRequired && (value === undefined || value === null || value === '')) {
        errors.push(`${question.title || question.name} is required`);
      }
      
      // Type-specific validation
      if (value !== undefined && value !== null && value !== '') {
        switch (question.type) {
          case 'text':
            if (question.variant === 'email' && !isValidEmail(String(value))) {
              errors.push(`${question.title || question.name} must be a valid email`);
            }
            if (question.variant === 'number' && isNaN(Number(value))) {
              errors.push(`${question.title || question.name} must be a number`);
            }
            if (question.minLength && String(value).length < question.minLength) {
              errors.push(`${question.title || question.name} must be at least ${question.minLength} characters`);
            }
            if (question.maxLength && String(value).length > question.maxLength) {
              errors.push(`${question.title || question.name} must be no more than ${question.maxLength} characters`);
            }
            break;
            
          case 'file':
            if (question.multiple && !Array.isArray(value)) {
              errors.push(`${question.title || question.name} must be an array for multiple files`);
            }
            break;
        }
      }
      
      // Recursively validate nested questions (panels, etc.)
      if (question.elements) {
        validateQuestions(question.elements);
      }
    }
  }
  
  validateQuestions(page.elements);
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
