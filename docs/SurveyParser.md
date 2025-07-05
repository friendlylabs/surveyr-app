# SurveyJS Parser for Offline-First Native Rendering

## Overview

This SurveyJS parser enables **offline-first** survey experiences by converting SurveyJS JSON forms into a normalized structure that can be rendered natively in React Native (or other native frameworks). This solves WebView limitations and provides better performance, offline capabilities, and native user experience.

## Features

### ✅ Supported Question Types

- **Text Input**: `text` with variants (email, number, date, etc.)
- **Text Area**: `comment` for multi-line input
- **Single Choice**: `radiogroup` with radio buttons
- **Multiple Choice**: `checkbox` with checkboxes
- **Dropdown**: `dropdown` with picker
- **Tag Selection**: `tagbox` for multiple tags
- **Boolean**: `boolean` with switch/toggle
- **Rating**: `rating` with stars, numbers, or smileys
- **File Upload**: `file` with multiple file support
- **Image Picker**: `imagepicker` with image selection
- **Ranking**: `ranking` for drag-and-drop ordering
- **Matrix**: `matrix` for grid-style questions
- **Matrix Dropdown**: `matrixdropdown` with complex cells
- **Matrix Dynamic**: `matrixdynamic` with dynamic rows
- **Multiple Text**: `multipletext` for grouped text inputs
- **HTML Content**: `html` for rich content display
- **Expression**: `expression` for calculated values
- **Panel**: `panel` for grouping questions
- **Panel Dynamic**: `paneldynamic` with dynamic panels
- **Image Display**: `image` for showing images
- **Signature**: `signaturepad` for signatures
- **Geolocation**: `geopoint` with GPS support
- **Audio Recording**: `microphone` for voice input

### ✅ Logic & Expressions

- **Page-level Logic**: `visibleIf`, `enableIf`, `requiredIf`
- **Question-level Logic**: All conditional properties
- **Dynamic Expressions**: Real-time value calculations
- **Triggers**: Survey-level reactions and automation
- **Placeholders**: Dynamic content with variable substitution

### ✅ Advanced Features

- **Offline Validation**: Client-side form validation
- **Progress Tracking**: Multi-page survey navigation
- **Theme Support**: Dark/light mode integration
- **File Management**: Local file storage and sync
- **Location Services**: GPS integration for geo questions
- **Expression Engine**: Full SurveyJS expression support

## Quick Start

### 1. Parse a Survey

```typescript
import { parseSurveyJS } from './utils/surveyParser';

const surveyJSON = {
  "title": "Customer Feedback",
  "pages": [
    {
      "elements": [
        {
          "type": "text",
          "name": "firstName",
          "title": "First Name",
          "isRequired": true
        },
        {
          "type": "rating",
          "name": "satisfaction",
          "title": "How satisfied are you?",
          "rateType": "stars",
          "rateMax": 5
        }
      ]
    }
  ]
};

const parsedSurvey = parseSurveyJS(surveyJSON);
console.log('Parsed successfully:', parsedSurvey.title);
```

### 2. Create Survey State

```typescript
import { createSurveyState } from './utils/surveyParser';

const surveyState = createSurveyState(parsedSurvey);

// Navigate through pages
surveyState.nextPage();
surveyState.previousPage();

// Update answers
surveyState.updateAnswer('firstName', 'John');
surveyState.updateAnswer('satisfaction', 5);

// Check question states
const firstNameQuestion = surveyState.survey.pages[0].elements[0];
const isVisible = surveyState.isQuestionVisible(firstNameQuestion);
const isRequired = surveyState.isQuestionRequired(firstNameQuestion);
```

### 3. Use Native Renderer

```typescript
import { NativeSurveyRenderer } from './components/NativeSurveyRenderer';

function MySurveyScreen() {
  const handleComplete = (data) => {
    console.log('Survey completed:', data);
    // Save to database, sync to server, etc.
  };

  return (
    <NativeSurveyRenderer
      surveyJSON={surveyJSON}
      onComplete={handleComplete}
      onError={(error) => console.error(error)}
    />
  );
}
```

## Expression Evaluation

The parser includes a powerful expression evaluator that supports:

### Operators

- **Arithmetic**: `+`, `-`, `*`, `/`, `%`, `^`
- **Comparison**: `=`, `<>`, `<`, `>`, `<=`, `>=`
- **Logical**: `&&` (and), `||` (or), `!` (not)
- **String**: `empty`, `notempty`, `contains`, `notcontains`, `startsWith`, `endsWith`

### Variables

```typescript
// Simple variables
"{firstName}" // References firstName question
"{age}" // References age question

// Array indexing
"{colors[0]}" // First selected color
"{matrix[1]}" // Second matrix row

// Nested properties
"{row.column}" // Matrix cell value
"{panel.question}" // Panel question value
```

### Functions

```typescript
// Date functions
"today()" // Current date
"age({birthDate})" // Calculate age

// Math functions
"sum({q1}, {q2}, {q3})" // Sum values
"min({values})" // Minimum value
"max({values})" // Maximum value

// Conditional function
"iif({age} >= 18, 'Adult', 'Minor')" // Ternary operator
```

### Example Expressions

```typescript
// Page visibility
"visibleIf": "{age} >= 18 and {employment} = 'Employed'"

// Question requirement
"requiredIf": "{contactMethod} = 'Email'"

// Value calculation
"setValueExpression": "sum({income}, {bonus}) / 12"

// Dynamic content
"title": "Welcome {firstName}! You are {age} years old."
```

## Validation

The parser provides comprehensive validation:

```typescript
import { validateSurveyData } from './utils/surveyParser';

const surveyData = {
  firstName: '',
  email: 'invalid-email',
  age: 15
};

const validation = validateSurveyData(parsedSurvey, surveyData);

if (!validation.isValid) {
  console.log('Validation errors:');
  validation.errors.forEach(error => {
    console.log(`- ${error}`);
  });
}
```

## Integration with Existing Code

### Replace WebView Rendering

```typescript
// Before: WebView approach
function ShowSurveyScreen() {
  return (
    <WebView
      source={{ html: getSurveyHTML() }}
      onMessage={handleWebViewMessage}
    />
  );
}

// After: Native approach
function ShowSurveyScreen() {
  const [useNative, setUseNative] = useState(true);
  
  if (useNative) {
    return (
      <NativeSurveyRenderer
        surveyJSON={form.content}
        onComplete={handleSurveyComplete}
      />
    );
  }
  
  // Fallback to WebView if needed
  return <WebView ... />;
}
```

### File Upload Integration

```typescript
// Integrate with your existing file upload logic
const handleFileUpload = async (question, files) => {
  for (const file of files) {
    // Use your existing file processing logic
    const localPath = await saveFileLocally(file);
    const serverUrl = generateServerUrl(file);
  
    // Save to database using your existing method
    await database.addFile({
      local_filename: file.name,
      server_url: serverUrl,
      local_path: localPath,
      form_id: formId
    });
  }
};
```

### Location Integration

```typescript
// Integrate with your existing location services
const handleLocationQuestion = async (question) => {
  if (question.type === 'geopoint') {
    // Use your existing location logic
    const location = await getCurrentLocation();
  
    switch (question.variant) {
      case 'default':
        return { lat: location.latitude, lng: location.longitude };
      case 'trace':
        return await startLocationTrace();
      case 'area':
        return await startAreaDrawing();
    }
  }
};
```

## Performance Benefits

### Offline-First Advantages

- ✅ **No Network Dependency**: Surveys work completely offline
- ✅ **Instant Loading**: No HTML/CSS/JS loading time
- ✅ **Native Performance**: 60fps animations and interactions
- ✅ **Memory Efficient**: Lower memory usage than WebView
- ✅ **Battery Friendly**: Better power efficiency

### Native UI Benefits

- ✅ **Consistent Styling**: Matches your app's design system
- ✅ **Native Components**: Platform-specific UI elements
- ✅ **Accessibility**: Built-in accessibility support
- ✅ **Responsive Layout**: Better mobile optimization
- ✅ **Dark Mode**: Seamless theme integration

## Advanced Usage

### Custom Question Types

```typescript
// Extend the parser for custom question types
function parseCustomQuestion(question: any): ParsedQuestion {
  switch (question.type) {
    case 'custom-slider':
      return {
        ...parseQuestion(question),
        min: question.min || 0,
        max: question.max || 100,
        step: question.step || 1
      };
    default:
      return parseQuestion(question);
  }
}
```

### Dynamic Choice Loading

```typescript
// Handle choicesByUrl for offline scenarios
const loadChoicesOffline = async (question: ParsedQuestion) => {
  if (question.choicesByUrl) {
    try {
      // Try to load from cache first
      const cachedChoices = await getCachedChoices(question.choicesByUrl.url);
      if (cachedChoices) return cachedChoices;
    
      // Fallback to network if available
      const response = await fetch(question.choicesByUrl.url);
      const data = await response.json();
    
      // Cache for offline use
      await cacheChoices(question.choicesByUrl.url, data);
      return data;
    } catch (error) {
      console.warn('Failed to load dynamic choices:', error);
      return [];
    }
  }
  return question.choices || [];
};
```

### Progress Persistence

```typescript
// Save survey progress for later completion
const saveProgress = async (surveyState: SurveyState) => {
  const progressData = {
    formId: surveyState.survey.id,
    currentPage: surveyState.currentPageIndex,
    answers: surveyState.surveyData,
    timestamp: new Date().toISOString()
  };
  
  await AsyncStorage.setItem(
    `survey_progress_${surveyState.survey.id}`,
    JSON.stringify(progressData)
  );
};

const restoreProgress = async (surveyState: SurveyState) => {
  const saved = await AsyncStorage.getItem(`survey_progress_${surveyState.survey.id}`);
  if (saved) {
    const progressData = JSON.parse(saved);
    surveyState.currentPageIndex = progressData.currentPage;
    surveyState.surveyData = progressData.answers;
    surveyState.evaluator.updateData(progressData.answers);
  }
};
```

## Migration Guide

### From WebView to Native

1. **Parse Existing Surveys**: Use `parseSurveyJS()` on your existing SurveyJS JSON
2. **Test Compatibility**: Check if all your question types are supported
3. **Update Components**: Replace WebView with `NativeSurveyRenderer`
4. **Integrate Logic**: Connect file uploads, location services, etc.
5. **Theme Integration**: Apply your app's styling to native components
6. **Test Thoroughly**: Validate all conditional logic and expressions

### Gradual Migration

```typescript
// Feature flag approach
const useNativeRenderer = await getFeatureFlag('native_survey_renderer');

if (useNativeRenderer && isSurveyCompatible(surveyJSON)) {
  return <NativeSurveyRenderer ... />;
} else {
  return <WebViewSurveyRenderer ... />;
}
```

## Troubleshooting

### Common Issues

1. **Expression Evaluation Errors**

   - Check variable names match question names exactly
   - Ensure proper syntax for expressions
   - Use the debugger to inspect survey data
2. **Missing Question Types**

   - Check if the question type is in the supported list
   - Add custom handling for unsupported types
   - Consider fallback to WebView for complex questions
3. **Performance Issues**

   - Use `React.memo` for question components
   - Implement virtualization for long surveys
   - Optimize re-renders with proper state management

### Debug Mode

```typescript
// Enable detailed logging
const surveyState = createSurveyState(parsedSurvey);
surveyState.debugMode = true;

// Log expression evaluations
const evaluator = new ExpressionEvaluator(surveyData);
evaluator.debug = true;
```

## API Reference

See the TypeScript interfaces in `surveyParser.ts` for complete API documentation:

- `ParsedSurvey`: Main survey structure
- `ParsedPage`: Page structure with elements
- `ParsedQuestion`: Question structure with all properties
- `ExpressionEvaluator`: Expression evaluation engine
- `SurveyState`: Runtime survey state management

## Contributing

To add support for new question types:

1. Add the type to `QuestTypesList` in `surveyParser.ts`
2. Add parsing logic in `parseQuestion()` function
3. Add rendering logic in `NativeSurveyRenderer.tsx`
4. Add validation logic in `validateSurveyData()` function
5. Test with various configurations and edge cases

---

This parser provides a solid foundation for offline-first, native survey rendering while maintaining compatibility with the SurveyJS ecosystem. The modular design allows for easy extension and customization based on your specific needs.
