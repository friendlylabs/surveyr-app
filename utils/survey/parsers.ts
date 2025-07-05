import { ParsedChoice, ParsedColumn, ParsedQuestion, ParsedPage, ParsedTrigger, ParsedSurvey } from './types';
import { getQuestionVariant } from './constants';

// Utility functions for parsing
export function parseChoices(choices: any[]): ParsedChoice[] {
  if (!choices) return [];
  
  return choices.map(choice => {
    // Handle primitive types (string, number, etc.)
    if (typeof choice !== 'object' || choice === null) {
      const stringValue = String(choice);
      return { value: stringValue, text: stringValue };
    }
    
    // Handle object with value/text properties
    return {
      value: String(choice.value || choice.name || choice.text || ''),
      text: String(choice.text || choice.title || choice.value || choice.name || ''),
      enableIf: choice.enableIf,
      visibleIf: choice.visibleIf,
      imageLink: choice.imageLink // For imagepicker questions
    };
  });
}

export function parseColumns(columns: any[]): ParsedColumn[] {
  if (!columns) return [];
  
  return columns.map(col => ({
    name: col.name,
    title: col.title,
    cellType: col.cellType,
    choices: col.choices ? parseChoices(col.choices) : undefined,
    inputType: col.inputType,
    isRequired: col.isRequired
  }));
}

export function parseQuestion(question: any, parentId?: string): ParsedQuestion {
  const questionId = parentId ? `${parentId}.${question.name}` : question.name;
  
  const parsed: ParsedQuestion = {
    id: questionId,
    name: question.name,
    type: question.type,
    variant: getQuestionVariant(question),
    title: question.title,
    description: question.description,
    isRequired: question.isRequired,
    defaultValue: question.defaultValue,
    placeholder: question.placeholder,
    
    // Logic properties
    visibleIf: question.visibleIf,
    enableIf: question.enableIf,
    requiredIf: question.requiredIf,
    setValueIf: question.setValueIf,
    setValueExpression: question.setValueExpression,
    defaultValueExpression: question.defaultValueExpression,
    resetValueIf: question.resetValueIf
  };
  
  // Type-specific parsing
  switch (question.type) {
    case 'radiogroup':
    case 'checkbox':
    case 'dropdown':
    case 'tagbox':
    case 'ranking':
      parsed.choices = parseChoices(question.choices);
      if (question.choicesByUrl) {
        parsed.choicesByUrl = {
          url: question.choicesByUrl.url,
          path: question.choicesByUrl.path,
          valueName: question.choicesByUrl.valueName,
          titleName: question.choicesByUrl.titleName
        };
      }
      break;
      
    case 'imagepicker':
      // Parse image choices including imageLink property
      parsed.choices = parseChoices(question.choices);
      
      // Add support for imagepicker specific properties
      parsed.imageHeight = question.imageHeight;
      parsed.imageWidth = question.imageWidth;
      parsed.multiSelect = question.multiSelect;
      parsed.contentMode = question.contentMode || 'image';
      parsed.imageFit = question.imageFit || 'cover';
      parsed.showLabel = question.showLabel !== false;
      
      if (question.choicesByUrl) {
        parsed.choicesByUrl = {
          url: question.choicesByUrl.url,
          path: question.choicesByUrl.path,
          valueName: question.choicesByUrl.valueName,
          titleName: question.choicesByUrl.titleName
        };
      }
      break;
      
    case 'image':
      // Parse image question properties for preset media display
      parsed.imageLink = question.imageLink;
      parsed.contentMode = question.contentMode || 'image'; // 'image', 'video', 'youtube'
      parsed.imageFit = question.imageFit || 'cover';
      parsed.imageHeight = question.imageHeight;
      parsed.imageWidth = question.imageWidth;
      break;
      
    case 'text':
      parsed.variant = question.inputType || 'default';
      parsed.min = question.min;
      parsed.max = question.max;
      parsed.step = question.step;
      parsed.minLength = question.minLength;
      parsed.maxLength = question.maxLength;
      break;
      
    case 'comment':
      parsed.maxLength = question.maxLength;
      parsed.minLength = question.minLength;
      break;
      
    case 'rating':
      parsed.rateMin = question.rateMin || 1;
      parsed.rateMax = question.rateMax || 5;
      parsed.rateStep = question.rateStep || 1;
      parsed.rateValues = question.rateValues ? parseChoices(question.rateValues) : undefined;
      break;
      
    case 'matrix':
      parsed.rows = parseChoices(question.rows);
      // For simple matrix, columns are treated as choices (radio buttons)
      parsed.choices = parseChoices(question.columns);
      break;
      
    case 'matrixdropdown':
    case 'matrixdynamic':
      parsed.rows = parseChoices(question.rows);
      parsed.columns = parseColumns(question.columns);
      parsed.rowCount = question.rowCount;
      parsed.minRowCount = question.minRowCount;
      parsed.maxRowCount = question.maxRowCount;
      break;
      
    case 'multipletext':
      parsed.elements = question.items?.map((item: any) => parseQuestion({
        ...item,
        type: 'text'
      }, questionId));
      break;
      
    case 'file':
      parsed.allowedTypes = question.acceptedTypes || question.allowedTypes;
      parsed.maxFileSize = question.maxSize;
      parsed.multiple = question.allowMultiple;
      break;
      
    case 'html':
      parsed.html = question.html;
      break;
      
    case 'expression':
      parsed.expression = question.expression;
      break;
      
    case 'signaturepad':
      parsed.backgroundColor = question.backgroundColor || '#ffffff';
      parsed.penColor = question.penColor || '#000000';
      parsed.penSize = question.penSize || 3;
      parsed.minWidth = question.minWidth || 0.5;
      parsed.maxWidth = question.maxWidth || 2.5;
      parsed.trimWhitespace = question.trimWhitespace !== false;
      break;
      
    case 'microphone':
      parsed.maxDuration = question.maxDuration || 300000; // 5 minutes default
      break;
      
    case 'panel':
    case 'paneldynamic':
      parsed.elements = question.elements?.map((el: any) => parseQuestion(el, questionId));
      if (question.type === 'paneldynamic') {
        parsed.rowCount = question.panelCount;
        parsed.minRowCount = question.minPanelCount;
        parsed.maxRowCount = question.maxPanelCount;
      }
      break;
  }
  
  return parsed;
}

export function parsePage(page: any): ParsedPage {
  return {
    id: page.name,
    name: page.name,
    title: page.title,
    description: page.description,
    elements: page.elements?.map((el: any) => parseQuestion(el)) || [],
    
    // Page-level logic
    visibleIf: page.visibleIf,
    enableIf: page.enableIf,
    requiredIf: page.requiredIf,
    
    // Navigation
    navigationButtonsVisibility: page.navigationButtonsVisibility,
    questionsOrder: page.questionsOrder
  };
}

export function parseTriggers(triggers: any[]): ParsedTrigger[] {
  if (!triggers) return [];
  
  return triggers.map(trigger => {
    const parsed: ParsedTrigger = {
      type: trigger.operator || trigger.type,
      expression: trigger.expression
    };
    
    switch (trigger.operator || trigger.type) {
      case 'setvalue':
        parsed.setToName = trigger.setToName;
        parsed.setValue = trigger.setValue;
        break;
      case 'copyvalue':
        parsed.setToName = trigger.setToName;
        parsed.fromName = trigger.fromName;
        break;
      case 'runexpression':
        parsed.runExpression = trigger.runExpression;
        parsed.setToName = trigger.setToName;
        break;
      case 'skip':
        parsed.gotoName = trigger.gotoName;
        break;
    }
    
    return parsed;
  });
}

// Main parser function
export function parseSurveyJS(surveyJSON: any): ParsedSurvey {
  try {
    const survey = typeof surveyJSON === 'string' ? JSON.parse(surveyJSON) : surveyJSON;
    
    const parsed: ParsedSurvey = {
      id: survey.surveyId,
      title: survey.title,
      description: survey.description,
      pages: [],
      triggers: parseTriggers(survey.triggers),
      
      // Survey settings
      showProgressBar: survey.showProgressBar,
      progressBarType: survey.progressBarType,
      showNavigationButtons: survey.showNavigationButtons,
      showTitle: survey.showTitle,
      showPageTitles: survey.showPageTitles,
      showQuestionNumbers: survey.showQuestionNumbers,
      questionErrorLocation: survey.questionErrorLocation,
      focusFirstQuestionAutomatic: survey.focusFirstQuestionAutomatic,
      goNextPageAutomatic: survey.goNextPageAutomatic,
      allowCompleteSurveyAutomatic: survey.allowCompleteSurveyAutomatic,
      
      // Validation
      checkErrorsMode: survey.checkErrorsMode,
      textUpdateMode: survey.textUpdateMode,
      
      // Completion
      completedHtml: survey.completedHtml,
      loadingHtml: survey.loadingHtml,
      
      // Branding
      logo: survey.logo,
      logoPosition: survey.logoPosition,
      logoWidth: survey.logoWidth,
      logoHeight: survey.logoHeight
    };
    
    // Parse pages
    if (survey.pages && survey.pages.length > 0) {
      parsed.pages = survey.pages.map(parsePage);
    } else if (survey.elements) {
      // Single page survey
      parsed.pages = [{
        id: 'page1',
        name: 'page1',
        elements: survey.elements.map((el: any) => parseQuestion(el))
      }];
    }
    
    return parsed;
  } catch (error) {
    console.error('Survey parsing error:', error);
    throw new Error(`Failed to parse survey: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
