export interface ParsedChoice {
  value: string;
  text: string;
  enableIf?: string;
  visibleIf?: string;
  imageLink?: string; // For imagepicker questions
}

export interface ParsedColumn {
  name: string;
  title?: string;
  cellType?: string;
  choices?: ParsedChoice[];
  inputType?: string;
  isRequired?: boolean;
}

export interface ParsedQuestion {
  id: string;
  name: string;
  type: string;
  variant?: string;
  title?: string;
  description?: string;
  isRequired?: boolean;
  choices?: ParsedChoice[];
  columns?: ParsedColumn[];
  rows?: ParsedChoice[];
  defaultValue?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  allowedTypes?: string[];
  maxFileSize?: number;
  multiple?: boolean;
  
  // Logic properties
  visibleIf?: string;
  enableIf?: string;
  requiredIf?: string;
  setValueIf?: string;
  setValueExpression?: string;
  defaultValueExpression?: string; // Evaluates expression for default value
  resetValueIf?: string; // Resets value when condition is met
  
  // For matrix questions
  rowCount?: number;
  minRowCount?: number;
  maxRowCount?: number;
  
  // For panels
  elements?: ParsedQuestion[];
  
  // For image picker
  imageHeight?: number;
  imageWidth?: number;
  multiSelect?: boolean;
  contentMode?: string; // 'image' or 'video' for imagepicker
  imageFit?: string;   // 'cover', 'contain', 'fill', 'scale-down'
  showLabel?: boolean; // Whether to show labels on images
  
  // For image question (preset media)
  imageLink?: string;  // URL for preset media content
  
  // For rating
  rateMin?: number;
  rateMax?: number;
  rateStep?: number;
  rateValues?: ParsedChoice[];
  
  // For HTML/Expression
  html?: string;
  expression?: string;
  
  // For signature pad
  backgroundColor?: string;
  penColor?: string;
  penSize?: number;
  minWidth?: number;
  maxWidth?: number;
  trimWhitespace?: boolean;
  
  // For microphone
  maxDuration?: number; // Maximum recording duration in milliseconds
  
  // Dynamic URLs for choices
  choicesByUrl?: {
    url: string;
    path?: string;
    valueName?: string;
    titleName?: string;
  };
}

export interface ParsedPage {
  id: string;
  name: string;
  title?: string;
  description?: string;
  elements: ParsedQuestion[];
  
  // Page-level logic
  visibleIf?: string;
  enableIf?: string;
  requiredIf?: string;
  
  // Navigation
  navigationButtonsVisibility?: string;
  questionsOrder?: string;
}

export interface ParsedTrigger {
  type: 'complete' | 'setvalue' | 'copyvalue' | 'runexpression' | 'skip';
  expression: string;
  setToName?: string;
  setValue?: any;
  fromName?: string;
  gotoName?: string;
  runExpression?: string;
}

export interface ParsedSurvey {
  id?: string;
  title?: string;
  description?: string;
  pages: ParsedPage[];
  triggers?: ParsedTrigger[];
  
  // Survey-level settings
  showProgressBar?: boolean;
  progressBarType?: string;
  showNavigationButtons?: boolean;
  showTitle?: boolean;
  showPageTitles?: boolean;
  showQuestionNumbers?: string;
  questionErrorLocation?: string;
  focusFirstQuestionAutomatic?: boolean;
  goNextPageAutomatic?: boolean;
  allowCompleteSurveyAutomatic?: boolean;
  
  // Validation
  checkErrorsMode?: string;
  textUpdateMode?: string;
  
  // Completion
  completedHtml?: string;
  loadingHtml?: string;
  
  // Branding
  logo?: string;
  logoPosition?: string;
  logoWidth?: number;
  logoHeight?: number;
}