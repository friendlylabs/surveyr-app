import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

/**
 * DatePicker component for form inputs
 * 
 * This component uses the native date picker from @react-native-community/datetimepicker
 * It handles different display modes including:
 * - date: Standard date picker
 * - datetime: Date and time picker
 * - month: Month selection (fallback to date picker on native)
 * - time: Time picker only (hours and minutes)
 * - week: Week picker (week number and year)
 * 
 * The component adapts to platform differences:
 * - On iOS: Shows a modal with spinner picker and confirmation buttons
 * - On Android: Uses the native date picker dialog
 * 
 * Dependencies:
 * - @react-native-community/datetimepicker
 */

// Types
export interface DatePickerProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  isEnabled: boolean;
  mode: 'date' | 'datetime' | 'month' | 'time' | 'week';
  placeholder: string;
}

/**
 * DatePicker component for date, datetime, and month inputs
 * Uses native date picker via @react-native-community/datetimepicker
 */
const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onValueChange,
  isEnabled,
  mode,
  placeholder
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(() => {
    if (value) {
      return parseInitialValue(value);
    }
    return new Date();
  });
  
  // Parse the initial value based on the format
  function parseInitialValue(val: string): Date {
    try {
      // Handle week format (YYYY-Wnn)
      if (mode === 'week' && val.includes('-W')) {
        // For week format, get first day of that week in that year
        const parts = val.split('-W');
        const year = parseInt(parts[0], 10);
        const weekNum = parseInt(parts[1], 10);
        
        // Create a date for Jan 1 of that year
        const date = new Date(year, 0, 1);
        
        // Calculate days to add for the week
        // Week 1 starts on the first Thursday of the year
        // We need to calculate to get the proper day in that week
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysToAdd = (weekNum - 1) * 7 + (4 - dayOfWeek);
        date.setDate(date.getDate() + daysToAdd);
        
        return date;
      }
      
      // Handle time format (HH:MM)
      if (mode === 'time' && /^\d{1,2}:\d{2}$/.test(val)) {
        const [hours, minutes] = val.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
      
      // Handle month format (YYYY-MM)
      if (mode === 'month' && /^\d{4}-\d{1,2}$/.test(val)) {
        const [year, month] = val.split('-').map(Number);
        return new Date(year, month - 1, 1);
      }
      
      // Default to standard date parsing
      return new Date(val);
    } catch {
      return new Date();
    }
  }
  
  // Helper function to calculate the week number for a given date
  // ISO 8601 week date calculation
  const getWeekNumber = (date: Date): number => {
    // Copy date to avoid mutation and ensure UTC
    const target = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    
    // ISO week starts on Monday, so we adjust for day 0 (Sunday)
    const dayNum = target.getUTCDay() || 7;
    
    // Set the target date to the nearest Thursday (ISO week centers on Thursday)
    target.setUTCDate(target.getUTCDate() + 4 - dayNum);
    
    // Get the first day of the year
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    
    // Return the week number
    const weekNumber = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    
    return weekNumber;
  };
  
  // Function to parse and display the value correctly
  const parseAndFormatValue = (val: string): string => {
    try {
      // Handle week format (YYYY-Wnn)
      if (mode === 'week' && val.includes('-W')) {
        const [year, weekPart] = val.split('-W');
        return `Week ${parseInt(weekPart, 10)}, ${year}`;
      }
      
      // For all other types, use the date object and formatDate
      return formatDate(parseInitialValue(val));
    } catch {
      // If parsing fails, return the raw value
      return val;
    }
  };
  
  // Format the date for display based on the mode
  const formatDate = (date: Date): string => {
    // Make sure we have a valid date object
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    
    switch (mode) {
      case 'date':
        return date.toLocaleDateString();
      case 'datetime':
        // Make sure we show both date and time in a user-friendly format
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      case 'month':
        // Format month in a more user-friendly way
        // Use month name and year
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
      case 'time':
        // Only show the time part
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      case 'week':
        // Show week number and year
        const weekNum = getWeekNumber(date);
        return `Week ${weekNum}, ${date.getFullYear()}`;
      default:
        return date.toLocaleDateString();
    }
  };
  
  const handleChange = (event: any, selectedDate?: Date) => {
    // If event is dismissed (Android) and no date selected
    // On Android, event will have a type property when the picker is dismissed or a date is set
    if (Platform.OS === 'android' && event?.type === 'dismissed') {
      setShowPicker(false);
      setIsTimePickerVisible(false);
      return;
    }
    
    const currentDate = selectedDate || tempDate;
    
    // Always update the temp date with the selected date
    setTempDate(currentDate);
    
    // On iOS, we don't need to do anything special here
    // The user will confirm with the Done button
    if (Platform.OS === 'ios') {
      return;
    }
    
    // On Android
    if (mode === 'datetime') {
      // For datetime mode on Android, we need a two-step process
      
      if (!isTimePickerVisible) {
        // Step 1: After selecting the date, show the time picker
        setIsTimePickerVisible(true);
        
        // We need to briefly hide and then show the picker again to switch modes
        setShowPicker(false);
        setTimeout(() => {
          setShowPicker(true);
        }, 100);
      } else {
        // Step 2: After selecting the time, we're done
        setShowPicker(false);
        setIsTimePickerVisible(false);
        submitValue(currentDate);
      }
    } else {
      // For other picker types on Android (date, month)
      setShowPicker(false);
      if (selectedDate) { // Only update if a date was selected (not cancelled)
        submitValue(currentDate);
      }
    }
  };
  
  const submitValue = (date: Date) => {
    let formattedValue: string;
    
    switch (mode) {
      case 'date':
        formattedValue = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'datetime':
        formattedValue = date.toISOString(); // Full ISO string
        break;
      case 'month':
        // For month picker, we only care about year and month
        // Format as YYYY-MM and set day to 01
        formattedValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'time':
        // Extract only the time part, format as HH:MM
        formattedValue = date.toTimeString().substring(0, 5); // HH:MM format
        break;
      case 'week':
        // Format as YYYY-Wnn (ISO week date format)
        const weekNum = getWeekNumber(date);
        formattedValue = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        console.log('Setting week value:', formattedValue);
        break;
      default:
        // Default fallback to ISO date
        formattedValue = date.toISOString().split('T')[0];
    }
    
    onValueChange(formattedValue);
  };
  
  const handleDone = () => {
    setShowPicker(false);
    setIsTimePickerVisible(false);
    submitValue(tempDate);
  };
  
  // We need to track if we're showing the time portion of datetime on Android
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  
  // Convert our mode to the native picker's mode
  const getNativeMode = () => {
    switch (mode) {
      case 'date':
        return 'date';
      case 'datetime':
        // On iOS, we can use the datetime mode directly
        if (Platform.OS === 'ios') {
          return 'datetime';
        }
        // On Android, we need to switch between date and time pickers
        return isTimePickerVisible ? 'time' : 'date';
      case 'month':
        // iOS supports month picker on iOS 14+ (won't work on Android)
        if (Platform.OS === 'ios') {
          return 'date';
        }
        return 'date';
      case 'time':
        // Both iOS and Android support time pickers directly
        return 'time';
      case 'week':
        // No native week picker, fallback to date picker
        return 'date';
    }
  };
  
  // Get the appropriate display style for Android
  const getAndroidDisplay = () => {
    // Choose the best display mode based on the picker type
    switch (mode) {
      case 'month':
        return 'calendar'; // Calendar makes it easier to select a month
      case 'time':
        return 'clock'; // Clock display for time selection
      case 'week':
        return 'calendar'; // Calendar for week selection
      default:
        // For other modes, use inline for newer Android versions, default for older
        // On Android 14+ (API 34+), we can use 'inline' for a more modern look
        // For older versions, use 'default' which shows the native dialog
        return Platform.OS === 'android' && Platform.Version >= 34 ? 'inline' : 'default';
    }
  };
  
  return (
    <View>
      <TouchableOpacity
        style={[styles.datePickerButton, !isEnabled && styles.disabledInput]}
        onPress={() => {
          if (isEnabled) {
            setIsTimePickerVisible(false);
            setShowPicker(true);
          }
        }}
        disabled={!isEnabled}
      >
        <Text style={[
          styles.datePickerButtonText,
          !value && styles.placeholderText,
          !isEnabled && styles.disabledText
        ]}>
          {value ? parseAndFormatValue(value) : placeholder}
        </Text>
      </TouchableOpacity>
      
      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal
            visible={showPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.datePickerContainer}>
                <Text style={styles.modalTitle}>
                  {mode === 'date' ? 'Select Date' : 
                   mode === 'datetime' ? 'Select Date & Time' : 
                   mode === 'month' ? 'Select Month/Year' : 
                   mode === 'time' ? 'Select Time' : 'Select Week'}
                </Text>
                {mode === 'month' && (
                  <Text style={styles.modalSubtitle}>
                    The day selection will be ignored
                  </Text>
                )}
                {mode === 'week' && (
                  <Text style={styles.modalSubtitle}>
                    Select any day in the desired week
                  </Text>
                )}
                
                <DateTimePicker
                  value={tempDate}
                  mode={getNativeMode() as any}
                  display="spinner"
                  onChange={handleChange}
                  style={styles.iosPicker}
                  disabled={!isEnabled}
                />
                
                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    style={[styles.datePickerAction, styles.datePickerCancel]}
                    onPress={() => {
                      setShowPicker(false);
                      setIsTimePickerVisible(false);
                    }}
                  >
                    <Text style={styles.datePickerActionText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.datePickerAction, styles.datePickerConfirm]}
                    onPress={handleDone}
                  >
                    <Text style={[styles.datePickerActionText, styles.datePickerConfirmText]}>
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ) : (
          // Android uses the native modal approach
          <>
            {mode === 'datetime' && (
              <View style={styles.androidPickerHint}>
                <Text style={styles.androidPickerHintText}>
                  {isTimePickerVisible ? 'Select time' : 'Select date'}
                </Text>
              </View>
            )}
            {mode === 'month' && (
              <View style={styles.androidPickerHint}>
                <Text style={styles.androidPickerHintText}>
                  Select month (day is ignored)
                </Text>
              </View>
            )}
            {mode === 'time' && (
              <View style={styles.androidPickerHint}>
                <Text style={styles.androidPickerHintText}>
                  Select time
                </Text>
              </View>
            )}
            {mode === 'week' && (
              <View style={styles.androidPickerHint}>
                <Text style={styles.androidPickerHintText}>
                  Select any day in the desired week
                </Text>
              </View>
            )}
            <DateTimePicker
              value={tempDate}
              mode={getNativeMode() as any}
              is24Hour={true}
              display={getAndroidDisplay()}
              onChange={handleChange}
              disabled={!isEnabled}
            />
          </>
        )
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  datePickerButton: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginTop: 5,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  disabledText: {
    color: '#999',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  iosPicker: {
    height: 200,
    width: '100%',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  datePickerAction: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  datePickerCancel: {
    backgroundColor: '#F3F4F6',
  },
  datePickerConfirm: {
    backgroundColor: '#10B981',
  },
  datePickerActionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  datePickerConfirmText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  androidPickerHint: {
    position: 'absolute',
    top: -45,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    zIndex: 100,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  androidPickerHintText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default DatePicker;
