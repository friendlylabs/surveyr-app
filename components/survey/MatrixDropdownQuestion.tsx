import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import type { ParsedChoice, ParsedColumn } from '../../utils/surveyParser';
import { DropdownQuestion } from './';

// Helper function to normalize choices to proper format
const normalizeChoices = (choices: any[] | undefined): ParsedChoice[] => {
  if (!choices || !Array.isArray(choices)) return [];
  
  return choices.map(choice => {
    if (typeof choice === 'object' && choice !== null) {
      // If already an object with value and text
      return {
        value: String(choice.value || ''),
        text: choice.text || String(choice.value || '')
      };
    } else {
      // If primitive value (string, number)
      return {
        value: String(choice),
        text: String(choice)
      };
    }
  });
};

export interface MatrixColumnDefinition {
  name: string;
  title?: string;
  cellType?: string;
  choices?: ParsedChoice[];
}

export interface MatrixDropdownQuestionProps {
  rows: ParsedChoice[];
  columns: ParsedColumn[];
  choices?: ParsedChoice[];
  value: Record<string, Record<string, any>> | undefined;
  onValueChange: (value: Record<string, Record<string, any>>) => void;
  isEnabled: boolean;
  dynamic?: boolean;
  minRowCount?: number;
  maxRowCount?: number;
}

/**
 * MatrixDropdownQuestion component for matrix dropdown questions
 * 
 * This component displays a table with rows and columns where each cell contains a dropdown
 * In dynamic mode, it allows adding and removing rows
 */
const MatrixDropdownQuestion: React.FC<MatrixDropdownQuestionProps> = ({
  rows: initialRows,
  columns,
  choices,
  value = {},
  onValueChange,
  isEnabled,
  dynamic = false,
  minRowCount = 0,
  maxRowCount = 10
}) => {
  // For dynamic matrix, we need to keep track of the rows
  const [dynamicRows, setDynamicRows] = React.useState<ParsedChoice[]>(
    dynamic ? (initialRows || []) : []
  );
  
  // Use the appropriate rows based on whether this is a dynamic matrix
  const rows = dynamic ? dynamicRows : initialRows;
  
  // Normalize the default choices for dropdowns when not specified in the column
  const defaultChoices = normalizeChoices(choices);
  
  // Handle cell value changes
  const handleCellChange = (rowValue: string, columnName: string, cellValue: any) => {
    if (!isEnabled) return;
    
    // Get the current row values or initialize a new object
    const rowValues = value?.[rowValue] || {};
    
    // Update the value for this cell
    const updatedRowValues = {
      ...rowValues,
      [columnName]: cellValue
    };
    
    // Update the entire value object with the new row values
    const updatedValue = {
      ...value,
      [rowValue]: updatedRowValues
    };
    
    onValueChange(updatedValue);
  };
  
  // Add a new row for dynamic matrix
  const handleAddRow = () => {
    if (!dynamic || !isEnabled) return;
    if (maxRowCount && rows.length >= maxRowCount) return;
    
    // Create a unique row ID based on timestamp
    const newRowId = `row_${Date.now()}`;
    
    const newRow: ParsedChoice = {
      value: newRowId,
      text: `Row ${rows.length + 1}`
    };
    
    setDynamicRows([...rows, newRow]);
    
    // Initialize empty row values
    const updatedValue = {
      ...value,
      [newRowId]: {}
    };
    
    onValueChange(updatedValue);
  };
  
  // Remove a row for dynamic matrix
  const handleRemoveRow = (rowIndex: number) => {
    if (!dynamic || !isEnabled) return;
    if (minRowCount && rows.length <= minRowCount) return;
    
    // Get the row being removed
    const removedRow = rows[rowIndex];
    
    // Remove the row from the array
    const updatedRows = [...rows];
    updatedRows.splice(rowIndex, 1);
    setDynamicRows(updatedRows);
    
    // Remove the row's values from the value object
    const updatedValue = { ...value };
    delete updatedValue[removedRow.value];
    
    onValueChange(updatedValue);
  };
  
  // No need for calculation now, we'll use flex in the styles
  
  return (
    <ScrollView 
      style={styles.container} 
      horizontal={true}
      showsHorizontalScrollIndicator={true}
      contentContainerStyle={[styles.contentContainer, { minWidth: '100%' }]}
    >
      <View style={[styles.table, { minWidth: '100%' }]}>
        {/* Header row with column titles */}
        <View style={styles.tableRow}>
          {/* Empty cell in top-left corner */}
          <View style={styles.headerCell} />
          
          {/* Column headers */}
          {columns.map((column, index) => (
            <View 
              key={`header-${column.name}`} 
              style={styles.headerCell}
            >
              <Text style={[
                styles.headerText,
                !isEnabled && styles.disabledText
              ]}>
                {column.title || column.name}
              </Text>
            </View>
          ))}
          
          {/* Extra column for remove buttons in dynamic mode */}
          {dynamic && (
            <View style={styles.actionCell} />
          )}
        </View>
        
        {/* Table rows */}
        {rows.map((row, rowIndex) => (
          <View key={`row-${row.value}`} style={styles.tableRow}>
            {/* Row label */}
            <View style={styles.rowLabelCell}>
              <Text style={[
                styles.rowLabelText,
                !isEnabled && styles.disabledText
              ]}>
                {row.text}
              </Text>
            </View>
            
            {/* Row cells (dropdowns) */}
            {columns.map((column) => {
              // Get the current value for this cell
              const cellValue = value?.[row.value]?.[column.name];
              
              // Use column-specific choices if available, otherwise use default
              // Make sure to normalize all choices to proper format
              const columnChoices = column.choices ? normalizeChoices(column.choices) : [];
              const cellChoices = columnChoices.length > 0 ? columnChoices : defaultChoices;
              
              return (
                <View
                  key={`cell-${row.value}-${column.name}`}
                  style={styles.tableCell}
                >
                  <DropdownQuestion
                    choices={cellChoices}
                    value={cellValue}
                    onValueChange={(value) => handleCellChange(row.value, column.name, value)}
                    isEnabled={isEnabled}
                    placeholder={`Select...`}
                  />
                </View>
              );
            })}
            
            {/* Remove button for dynamic matrix */}
            {dynamic && (
              <TouchableOpacity
                style={[
                  styles.actionCell,
                  (!isEnabled || (minRowCount && rows.length <= minRowCount)) ? styles.disabledCell : null
                ]}
                onPress={() => handleRemoveRow(rowIndex)}
                disabled={!isEnabled || (!!minRowCount && rows.length <= minRowCount)}
              >
                <Feather name="trash-2" size={20} color={!isEnabled ? "#9CA3AF" : "#EF4444"} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        {/* Add row button for dynamic matrix */}
        {dynamic && (
          <View style={styles.addRowContainer}>
            <TouchableOpacity
              style={[
                styles.addRowButton,
                (!isEnabled || (maxRowCount && rows.length >= maxRowCount)) ? styles.disabledButton : null
              ]}
              onPress={handleAddRow}
              disabled={!isEnabled || (!!maxRowCount && rows.length >= maxRowCount)}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.addRowText}>Add Row</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
  contentContainer: {
    paddingBottom: 8,
    flexGrow: 1,
  },
  table: {
    flex: 1,
    width: '100%',
    minWidth: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    width: '100%',
  },
  headerCell: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minWidth: 150,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#374151',
  },
  rowLabelCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minWidth: 150,
  },
  rowLabelText: {
    fontSize: 14,
    color: '#374151',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minWidth: 150,
  },
  actionCell: {
    width: 50,
    minWidth: 50,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  disabledCell: {
    backgroundColor: '#F5F5F5',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  addRowContainer: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addRowText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  }
});

export default MatrixDropdownQuestion;
