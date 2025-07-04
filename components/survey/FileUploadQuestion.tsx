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
  onFileUpload?: (questionName: string, allowedTypes?: string[], maxFileSize?: number) => Promise<any>;
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
  onFileUpload
}) => {
  const handleFileUpload = async () => {
    if (!isEnabled || !onFileUpload) return;
    try {
      const result = await onFileUpload(questionName, allowedTypes, maxFileSize);
      if (result) {
        onValueChange(result);
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
        <Text style={[styles.fileUploadIcon, !isEnabled && styles.disabledText]}>📁</Text>
        <Text style={[styles.fileUploadMainText, !isEnabled && styles.disabledText]}>
          {value ? `Selected: ${value.fileName || 'File'}` : 'Upload a file'}
        </Text>
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
    fontSize: 48,
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
