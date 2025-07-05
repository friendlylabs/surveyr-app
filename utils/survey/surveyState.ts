import { ParsedSurvey, ParsedPage, ParsedQuestion } from './types';
import { ExpressionEvaluator, evaluateCondition } from './expressionEvaluator';
import { validatePageData } from './validators';

// Get all questions from parsed survey (flattened)
export function getAllQuestions(parsedSurvey: ParsedSurvey): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  function extractQuestions(elements: ParsedQuestion[]) {
    for (const element of elements) {
      questions.push(element);
      if (element.elements) {
        extractQuestions(element.elements);
      }
    }
  }
  
  for (const page of parsedSurvey.pages) {
    extractQuestions(page.elements);
  }
  
  return questions;
}

// Get question by name
export function getQuestionByName(parsedSurvey: ParsedSurvey, name: string): ParsedQuestion | null {
  const allQuestions = getAllQuestions(parsedSurvey);
  return allQuestions.find(q => q.name === name) || null;
}

// Export for use in React Native components
export function createSurveyState(parsedSurvey: ParsedSurvey) {
  // Initialize evaluator
  const evaluator = new ExpressionEvaluator();
  
  // Create initial state
  const initialData: Record<string, any> = {};
  
  // Process any default values and default value expressions
  const allQuestions = getAllQuestions(parsedSurvey);
  for (const question of allQuestions) {
    // Check if there's a default value expression
    if (question.defaultValueExpression) {
      try {
        const result = evaluator.evaluate(question.defaultValueExpression);
        if (result !== undefined) {
          initialData[question.name] = result;
          // Update evaluator immediately so subsequent expressions can use this value
          evaluator.updateData({ [question.name]: result });
        }
      } catch (error) {
        console.error('Error evaluating default expression for', question.name, error);
        if (question.defaultValue !== undefined) {
          initialData[question.name] = question.defaultValue;
          // Update evaluator with default value
          evaluator.updateData({ [question.name]: question.defaultValue });
        }
      }
    } else if (question.defaultValue !== undefined) {
      // Use regular default value if available
      initialData[question.name] = question.defaultValue;
      // Update evaluator with default value
      evaluator.updateData({ [question.name]: question.defaultValue });
    }
  }
  
  // Update evaluator with initial data
  evaluator.updateData(initialData);
  
  return {
    survey: parsedSurvey,
    currentPageIndex: 0,
    surveyData: initialData,
    evaluator,
    
    // Helper methods
    getCurrentPage() {
      return this.survey.pages[this.currentPageIndex];
    },
    
    updateAnswer(questionName: string, value: any) {
      this.surveyData[questionName] = value;
      this.evaluator.updateData(this.surveyData);
      
      // Process any default value expressions that might depend on this value
      const allQuestions = getAllQuestions(this.survey);
      for (const question of allQuestions) {
        if (question.name !== questionName && question.defaultValueExpression && 
            question.defaultValueExpression.includes(`{${questionName}}`) && 
            !this.surveyData[question.name]) {
          try {
            const newDefaultValue = this.processDefaultValueExpression(question);
            if (newDefaultValue !== undefined) {
              this.surveyData[question.name] = newDefaultValue;
            }
          } catch (error) {
            console.error('Error re-processing default value expression:', error);
          }
        }
      }
      
      // Process any question resets that might be triggered by this answer
      this.checkResetValues();
    },
    
    checkResetValues() {
      // Check all questions for resetValueIf conditions
      const allQuestions = getAllQuestions(this.survey);
      let dataChanged = false;
      
      for (const question of allQuestions) {
        if (question.resetValueIf && evaluateCondition(question.resetValueIf, this.surveyData)) {
          if (this.surveyData[question.name] !== undefined) {
            delete this.surveyData[question.name];
            dataChanged = true;
            
            // After resetting, check if we need to set a default value
            if (question.defaultValueExpression) {
              try {
                this.surveyData[question.name] = this.processDefaultValueExpression(question);
              } catch (error) {
                console.error('Error re-applying default value expression after reset:', error);
                if (question.defaultValue !== undefined) {
                  this.surveyData[question.name] = question.defaultValue;
                }
              }
            } else if (question.defaultValue !== undefined) {
              this.surveyData[question.name] = question.defaultValue;
            }
          }
        }
      }
      
      // Update evaluator with potentially changed data
      if (dataChanged) {
        this.evaluator.updateData(this.surveyData);
      }
    },
    
    // Process default value expressions for a question (used when showing a new question)
    processDefaultValueExpression(question: ParsedQuestion): any {
      if (!question.defaultValueExpression) return question.defaultValue;
      
      try {
        return this.evaluator.evaluate(question.defaultValueExpression);
      } catch (error) {
        console.error('Error evaluating default expression for', question.name, error);
        return question.defaultValue;
      }
    },
    
    isQuestionVisible(question: ParsedQuestion): boolean {
      return !question.visibleIf || evaluateCondition(question.visibleIf, this.surveyData);
    },
    
    isQuestionEnabled(question: ParsedQuestion): boolean {
      return !question.enableIf || evaluateCondition(question.enableIf, this.surveyData);
    },
    
    isQuestionRequired(question: ParsedQuestion): boolean {
      return Boolean(question.isRequired) || 
             (question.requiredIf ? evaluateCondition(question.requiredIf, this.surveyData) : false);
    },
    
    isPageVisible(page: ParsedPage): boolean {
      // Check if the page has a visibleIf condition and evaluate it
      return !page.visibleIf || evaluateCondition(page.visibleIf, this.surveyData);
    },
    
    canGoToNextPage(): boolean {
      const currentPage = this.getCurrentPage();
      
      // Check if page is visible
      if (!this.isPageVisible(currentPage)) {
        return true; // Skip invisible pages
      }
      
      // Validate required questions on current page only
      const validation = validatePageData(currentPage, this.surveyData);
      return validation.isValid;
    },
    
    nextPage() {
      if (this.currentPageIndex < this.survey.pages.length - 1) {
        // Move to next page
        this.currentPageIndex++;
        
        // Skip pages that aren't visible due to conditions
        while (
          this.currentPageIndex < this.survey.pages.length - 1 && 
          !this.isPageVisible(this.survey.pages[this.currentPageIndex])
        ) {
          this.currentPageIndex++;
        }
      }
    },
    
    previousPage() {
      if (this.currentPageIndex > 0) {
        // Move to previous page
        this.currentPageIndex--;
        
        // Skip pages that aren't visible due to conditions
        while (
          this.currentPageIndex > 0 && 
          !this.isPageVisible(this.survey.pages[this.currentPageIndex])
        ) {
          this.currentPageIndex--;
        }
      }
    },
    
    // Check if there are any visible pages after the current one
    hasVisiblePagesAfterCurrent(): boolean {
      for (let i = this.currentPageIndex + 1; i < this.survey.pages.length; i++) {
        if (this.isPageVisible(this.survey.pages[i])) {
          return true;
        }
      }
      return false;
    },
    
    validateCurrentPage() {
      return validatePageData(this.getCurrentPage(), this.surveyData);
    }
  };
}

// Type for the survey state
export type SurveyState = ReturnType<typeof createSurveyState>;
