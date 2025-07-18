// Expression evaluator for SurveyJS expressions
export class ExpressionEvaluator {
  private data: Record<string, any> = {};
  
  constructor(surveyData: Record<string, any> = {}) {
    this.data = surveyData;
  }
  
  updateData(newData: Record<string, any>) {
    this.data = { ...this.data, ...newData };
  }
  
  evaluate(expression: string): any {
    if (!expression) return true;
    
    try {
      // First check for direct comparison and contains/notcontains operators
      // These are better handled with direct string manipulation than JavaScript evaluation
      
      // Handle contains operator directly
      if (/ contains /.test(expression)) {
        const parts = expression.split(' contains ');
        if (parts.length === 2) {
          const [varPart, valuePart] = parts.map(p => p.trim());
          const varName = varPart.replace(/[{}]/g, '');
          // Handle string literals by removing quotes
          const searchValue = valuePart.replace(/^['"]|['"]$/g, '');
          const varValue = this.getVariableValue(varName);
          return String(varValue || '').includes(searchValue);
        }
      }
      
      // Handle notcontains operator directly
      if (/ notcontains /.test(expression)) {
        const parts = expression.split(' notcontains ');
        if (parts.length === 2) {
          const [varPart, valuePart] = parts.map(p => p.trim());
          const varName = varPart.replace(/[{}]/g, '');
          const searchValue = valuePart.replace(/^['"]|['"]$/g, '');
          const varValue = this.getVariableValue(varName);
          return !String(varValue || '').includes(searchValue);
        }
      }
      
      // Handle empty/notempty operators
      if (/ empty$/.test(expression.trim())) {
        const varName = expression.replace(/ empty$/, '').trim().replace(/[{}]/g, '');
        const value = this.getVariableValue(varName);
        return !value || value === '' || 
               (Array.isArray(value) && value.length === 0) || 
               (typeof value === 'object' && value !== null && Object.keys(value).length === 0);
      }
      
      if (/ notempty$/.test(expression.trim())) {
        const varName = expression.replace(/ notempty$/, '').trim().replace(/[{}]/g, '');
        const value = this.getVariableValue(varName);
        return value && value !== '' && 
               !(Array.isArray(value) && value.length === 0) && 
               !(typeof value === 'object' && value !== null && Object.keys(value).length === 0);
      }
      
      // For simple equals conditions, handle directly (most common case)
      if (/ = /.test(expression) && !/ == /.test(expression) && !/ != /.test(expression)) {
        const parts = expression.split(' = ');
        if (parts.length === 2) {
          const [varPart, valuePart] = parts.map(p => p.trim());
          const varName = varPart.replace(/[{}]/g, '');
          // Remove quotes for string comparison
          const compareValue = valuePart.replace(/^['"]|['"]$/g, '');
          const varValue = this.getVariableValue(varName);
          // Use loose equality (==) for type coercion
          // Use loose equality for SurveyJS compatibility, but avoid the lint warning
          // eslint-disable-next-line eqeqeq
          return String(varValue) == String(compareValue);
        }
      }
      
      // For not equal conditions
      if (/ <> /.test(expression)) {
        const parts = expression.split(' <> ');
        if (parts.length === 2) {
          const [varPart, valuePart] = parts.map(p => p.trim());
          const varName = varPart.replace(/[{}]/g, '');
          const compareValue = valuePart.replace(/^['"]|['"]$/g, '');
          const varValue = this.getVariableValue(varName);
          // Use loose inequality for SurveyJS compatibility, but avoid the lint warning
          // eslint-disable-next-line eqeqeq
          return String(varValue) != String(compareValue);
        }
      }
      
      // For more complex expressions, fall back to JavaScript evaluation
      let processedExpression = this.replaceVariables(expression);
      processedExpression = this.replaceSpecialFunctions(processedExpression);
      return this.safeEvaluate(processedExpression);
    } catch (error) {
      console.warn('Expression evaluation error:', error, 'Expression:', expression);
      return false;
    }
  }
  
  private replaceVariables(expression: string): string {
    // Check if this is a simple contains/notcontains expression and handle it directly
    if (/ contains | notcontains /.test(expression)) {
      return expression; // Let the contains/notcontains specific handler deal with this
    }
    
    // Replace {variableName} with actual values
    return expression.replace(/\{([^}]+)\}/g, (match, variable) => {
      const value = this.getVariableValue(variable);
      if (typeof value === 'string') {
        // Properly escape single quotes in strings
        return `'${value.replace(/'/g, "\\'").replace(/"/g, '\\"')}'`;
      } else if (value === null || value === undefined) {
        return 'null';
      }
      return String(value);
    });
  }
  
  private getVariableValue(variable: string): any {
    // Handle array indexing like {question[0]}
    if (variable.includes('[') && variable.includes(']')) {
      const [baseName, indexPart] = variable.split('[');
      const index = parseInt(indexPart.replace(']', ''));
      const baseValue = this.data[baseName];
      return Array.isArray(baseValue) ? baseValue[index] : undefined;
    }
    
    // Handle nested properties like {row.column} or {panel.question}
    if (variable.includes('.')) {
      const parts = variable.split('.');
      let value = this.data;
      for (const part of parts) {
        value = value?.[part];
      }
      return value;
    }
    
    return this.data[variable];
  }
  
  private replaceSpecialFunctions(expression: string): string {
    // Replace today() with current date
    expression = expression.replace(/today\(\)/g, `'${new Date().toISOString().split('T')[0]}'`);
    
    // Replace age() function
    expression = expression.replace(/age\(([^)]+)\)/g, (match, dateVar) => {
      const dateValue = this.getVariableValue(dateVar.replace(/[{}]/g, ''));
      if (dateValue) {
        const age = new Date().getFullYear() - new Date(dateValue).getFullYear();
        return String(age);
      }
      return '0';
    });
    
    // Replace sum() function
    expression = expression.replace(/sum\(([^)]+)\)/g, (match, vars) => {
      const variables = vars.split(',').map((v: string) => v.trim().replace(/[{}]/g, ''));
      const sum = variables.reduce((acc: number, variable: string) => {
        const value = this.getVariableValue(variable);
        return acc + (Number(value) || 0);
      }, 0);
      return String(sum);
    });
    
    // Replace iif() function (ternary operator)
    expression = expression.replace(/iif\(([^,]+),([^,]+),([^)]+)\)/g, '($1 ? $2 : $3)');
    
    return expression;
  }
  
  private safeEvaluate(expression: string): any {
    // At this point, we should have already handled the specific SurveyJS operators
    // This method just handles standard JavaScript expressions
    
    // Convert SurveyJS operators to JavaScript if any remain
    let jsExpression = expression
      .replace(/\s+<>\s+/g, ' !== ')
      .replace(/\s+=\s+/g, ' == ') // Use loose equality for type coercion
      .replace(/\s+and\s+/g, ' && ')
      .replace(/\s+or\s+/g, ' || ');
    
    // Use Function constructor for safe evaluation (better than eval)
    try {
      return new Function('return ' + jsExpression)();
    } catch (error) {
      console.log('Error evaluating expression:', error, jsExpression);
      // No need to call basicEvaluation anymore, just return false
      return false;
    }
  }
  
  private basicEvaluation(expression: string): boolean {
    // This method is no longer needed as we handle all expression types directly
    // Keeping it as a fallback just in case
    console.warn('Using basicEvaluation fallback for:', expression);
    return false;
  }
}