// Question types list with their variants
export const QuestTypesList = [
  { type: "radiogroup" },
  { 
    type: "rating",
    variantKey: "rateType",     // Key for rating question variants
    variants: ["default", "stars", "smileys"] 
  },
  { type: "checkbox" },
  { type: "dropdown" },       // some dropdowns have url links to fetch options
                              // i.e {type:dropdown,name:String,choicesByUrl:{url:urlString,path:?String(urlReturnedData[Key]),valueName:?String,titleName:?String(Displayed value, default name)}}
  { type: "tagbox" },
  { type: "boolean" },
  { type: "file" },
  { type: "imagepicker" },
  { type: "ranking" },
  {
    type: "text",
    variantKey: "inputType", // Key for text question variants
    variants: [
      "default",
      "color",
      "date",
      "datetime-local",
      "email",
      "month",
      "number",
      "password",
      "range",
      "tel",
      "time",
      "url",
      "week"
    ]
  },
  { type: "comment" },
  { type: "multipletext" },
  { type: "matrix" },
  { type: "matrixdropdown" },
  { type: "matrixdynamic" },
  { type: "html" },             // HTML content, not a question type
  { type: "panel" },            // Panel for grouping questions, not a question type
  { type: "paneldynamic" },     // Dynamic panels, not a question type
  { type: "expression" },       // Expression question, not a user input type, it displays calculated values
  { type: "image" },
  { type: "signaturepad" },
  {
    type: "geopoint",
    variantKey: "geoFormat",    // Key for geopoint variants
    variants: [
      "default",  // Default geopoint question, gets current location
      "manual",   // Manual entry geopoint question starting with current location
      "trace",    // Geopoint question that allows tracing a path
      "area"      // Geopoint question that allows drawing an area (polygon)
    ]
  },
  { type: "microphone" }
] as const;

// Helper function to get question variant
export function getQuestionVariant(question: any): string | undefined {
  const questionTypeInfo = QuestTypesList.find(q => q.type === question.type);
  if (!questionTypeInfo || !('variantKey' in questionTypeInfo)) {
    return undefined;
  }
  
  const variantValue = question[questionTypeInfo.variantKey];
  if ('variants' in questionTypeInfo && questionTypeInfo.variants?.includes(variantValue)) {
    return variantValue;
  }
  
  return 'default';
}
