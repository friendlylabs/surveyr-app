import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import type { ParsedChoice } from '../../utils/surveyParser';

export interface MatrixQuestionProps {
  rows: ParsedChoice[];
  columns: ParsedChoice[];
  value: Record<string, string> | undefined;
  onValueChange: (value: Record<string, string>) => void;
  isEnabled: boolean;
}

/**
 * MatrixQuestion component for matrix-style questions
 * 
 * This component displays a table with rows and columns where the user
 * can select one column value for each row
 */
const MatrixQuestion: React.FC<MatrixQuestionProps> = ({
  rows,
  columns,
  value = {},
  onValueChange,
  isEnabled
}) => {
  // Handle selection of a cell
  const handleCellSelect = (rowValue: string, columnValue: string) => {
    if (!isEnabled) return;
    
    // Update the value for this row
    const updatedValue = {
      ...value,
      [rowValue]: columnValue
    };
    
    onValueChange(updatedValue);
  };
  
  // Calculate column widths - use a number
  const columnWidthPercent = 100 / (columns.length + 1);
  
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
          <View style={[styles.headerCell, { width: `${columnWidthPercent}%` }]} />
          
          {/* Column headers */}
          {columns.map(column => (
            <View 
              key={`header-${column.value}`} 
              style={[styles.headerCell, { width: `${columnWidthPercent}%` }]}
            >
              <Text style={[
                styles.headerText,
                !isEnabled && styles.disabledText
              ]}>
                {column.text}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Table rows */}
        {rows.map(row => (
          <View key={`row-${row.value}`} style={styles.tableRow}>
            {/* Row label */}
            <View style={[styles.rowLabelCell, { width: `${columnWidthPercent}%` }]}>
              <Text style={[
                styles.rowLabelText,
                !isEnabled && styles.disabledText
              ]}>
                {row.text}
              </Text>
            </View>
            
            {/* Row cells (selectable) */}
            {columns.map(column => {
              const isSelected = value?.[row.value] === column.value;
              
              return (
                <TouchableOpacity
                  key={`cell-${row.value}-${column.value}`}
                  style={[
                    styles.tableCell,
                    { width: `${columnWidthPercent}%` },
                    isSelected && styles.selectedCell,
                    !isEnabled && styles.disabledCell
                  ]}
                  onPress={() => handleCellSelect(row.value, column.value)}
                  disabled={!isEnabled}
                >
                  <View style={[
                    styles.radioCircle,
                    isSelected && styles.selectedRadioCircle,
                    !isEnabled && styles.disabledRadioCircle
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
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
    flexGrow: 1, // Make sure content expands
  },
  table: {
    flex: 1, // Take up all available space
    width: '100%',
    minWidth: '100%', // Ensure minimum width
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    width: '100%', // Ensure row takes full width
  },
  headerCell: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#374151',
  },
  rowLabelCell: {
    padding: 12,
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  rowLabelText: {
    fontSize: 14,
    color: '#374151',
  },
  tableCell: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  selectedCell: {
    backgroundColor: '#F0FDF4',
  },
  disabledCell: {
    backgroundColor: '#F5F5F5',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioCircle: {
    borderColor: '#10B981',
  },
  disabledRadioCircle: {
    borderColor: '#9CA3AF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  disabledText: {
    color: '#9CA3AF',
  },
});

export default MatrixQuestion;
