import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Types
export interface FileUploadQuestionProps {
  value?: any;
  onValueChange: (value: any) => void;
  isEnabled: boolean;
  questionName: string;
  allowedTypes?: string[];
  maxFileSize?: number;
  allowMultiple?: boolean;
  onFileUpload?: (questionName: string, allowedTypes?: string[], maxFileSize?: number, allowMultiple?: boolean) => Promise<any>;
}

/**
 * FileUploadQuestion component for handling file uploads
 */
const FileUploadQuestion: React.FC<FileUploadQuestionProps> = ({
  value,
  onValueChange,
  isEnabled,
  questionName,
  allowedTypes,
  maxFileSize,
  allowMultiple = false,
  onFileUpload
}) => {
  const handleFileUpload = async () => {
    if (!isEnabled || !onFileUpload) return;
    try {
      const result = await onFileUpload(questionName, allowedTypes, maxFileSize, allowMultiple);
      if (result) {
        if (allowMultiple) {
          // For multiple files, append to existing array or create new array
          const existingFiles = Array.isArray(value) ? value : [];
          const newFiles = Array.isArray(result) ? result : [result];
          onValueChange([...existingFiles, ...newFiles]);
        } else {
          // For single file, replace existing value
          onValueChange(result);
        }
      }
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.fileUploadContainer, !isEnabled && styles.disabledInput]}
      onPress={handleFileUpload}
      disabled={!isEnabled}
    >
      <View style={styles.fileUploadContent}>
        <Ionicons 
          name="document-attach-outline" 
          size={48} 
          color={!isEnabled ? '#999' : '#666'} 
          style={styles.fileUploadIcon}
        />
        <Text style={[styles.fileUploadMainText, !isEnabled && styles.disabledText]}>
          {value ? 
            (allowMultiple && Array.isArray(value) ? 
              `Selected: ${value.length} file${value.length !== 1 ? 's' : ''}` :
              `Selected: ${Array.isArray(value) ? value[0]?.fileName || 'File' : value.fileName || 'File'}`
            ) : 
            `Upload ${allowMultiple ? 'files' : 'a file'}`
          }
        </Text>
        {allowMultiple && Array.isArray(value) && value.length > 0 && (
          <Text style={[styles.fileUploadSubText, !isEnabled && styles.disabledText]}>
            {value.map((file, index) => file.fileName || `File ${index + 1}`).join(', ')}
          </Text>
        )}
        {allowedTypes && allowedTypes.length > 0 && (
          <Text style={[styles.fileUploadSubText, !isEnabled && styles.disabledText]}>
            Allowed types: {allowedTypes.join(', ')}
          </Text>
        )}
        {maxFileSize && (
          <Text style={[styles.fileUploadSubText, !isEnabled && styles.disabledText]}>
            Max size: {(maxFileSize / (1024 * 1024)).toFixed(1)}MB
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fileUploadContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileUploadContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileUploadIcon: {
    marginBottom: 16,
  },
  fileUploadMainText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  fileUploadSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  disabledText: {
    color: '#999',
  },
});

export default FileUploadQuestion;
