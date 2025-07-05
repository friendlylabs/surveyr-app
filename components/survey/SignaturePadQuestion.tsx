import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';

interface SignaturePadQuestionProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  isEnabled: boolean;
  placeholder?: string;
  backgroundColor?: string;
  penColor?: string;
  penSize?: number;
  minWidth?: number;
  maxWidth?: number;
  trimWhitespace?: boolean;
  onScrollEnable?: (enabled: boolean) => void; // Callback to control parent scroll
}

const SignaturePadQuestion: React.FC<SignaturePadQuestionProps> = ({
  value,
  onValueChange,
  isEnabled = true,
  placeholder = "Please sign here",
  backgroundColor = "#ffffff",
  penColor = "#000000",
  penSize = 3,
  minWidth = 0.5,
  maxWidth = 2.5,
  trimWhitespace = true,
  onScrollEnable
}) => {
  const signatureRef = useRef<any>(null);
  const [hasSignature, setHasSignature] = useState(!!value);
  
  // Signature pad height (adjust based on your needs)
  const signatureHeight = 200;

  const handleBegin = () => {
    // Disable scroll when user starts signing
    onScrollEnable?.(false);
  };

  const handleEnd = () => {
    // Re-enable scroll when user stops signing
    setTimeout(() => {
      onScrollEnable?.(true);
    }, 100);
  };

  const handleOK = (signature: string) => {
    if (signature) {
      onValueChange(signature);
      setHasSignature(true);
    }
  };

  const handleEmpty = () => {
    // Called when the signature pad is empty
    setHasSignature(false);
  };

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
      onValueChange(null);
      setHasSignature(false);
    }
  };

  const handleUndo = () => {
    if (signatureRef.current) {
      signatureRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (signatureRef.current) {
      signatureRef.current.redo();
    }
  };

  const handleConfirm = () => {
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  const style = `
    .m-signature-pad {
      position: relative;
      font-size: 10px;
      width: 100%;
      height: ${signatureHeight}px;
      border: 1px solid #e8e8e8;
      background-color: ${backgroundColor};
      border-radius: 4px;
      touch-action: none; /* Prevent default touch behavior */
    }
    .m-signature-pad--body {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      touch-action: none; /* Prevent default touch behavior */
    }
    .m-signature-pad--body canvas {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border-radius: 4px;
      touch-action: none; /* Prevent default touch behavior */
    }
    .m-signature-pad--footer {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 40px;
      display: none; /* Hide default footer */
    }
  `;

  if (!isEnabled) {
    return (
      <View style={styles.disabledContainer}>
        <View style={[styles.signatureContainer, styles.disabled]}>
          {value ? (
            <Text style={styles.disabledText}>Signature captured</Text>
          ) : (
            <Text style={styles.disabledText}>{placeholder}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View 
        style={styles.signatureContainer}
        onTouchStart={handleBegin}
        onTouchEnd={handleEnd}
      >
        <SignatureScreen
          ref={signatureRef}
          onOK={handleOK}
          onEmpty={handleEmpty}
          onGetData={() => {}}
          autoClear={false}
          imageType="image/png"
          descriptionText=""
          clearText=""
          confirmText=""
          webStyle={style}
          penColor={penColor}
          backgroundColor={backgroundColor}
          minWidth={minWidth}
          maxWidth={maxWidth}
          trimWhitespace={trimWhitespace}
        />
      </View>
      
      {/* Control buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.undoButton]}
            onPress={handleUndo}
            activeOpacity={0.7}
          >
            <Text style={styles.undoButtonText}>Undo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.redoButton]}
            onPress={handleRedo}
            activeOpacity={0.7}
          >
            <Text style={styles.redoButtonText}>Redo</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={handleConfirm}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
      
      {/* Status indicator */}
      {hasSignature && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>✓ Signature captured</Text>
        </View>
      )}
      
      {!hasSignature && (
        <View style={styles.statusContainer}>
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  signatureContainer: {
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 4,
    height: 200,
    backgroundColor: '#ffffff',
    overflow: 'hidden', // Ensure content stays within bounds
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  disabledContainer: {
    marginVertical: 8,
  },
  disabled: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledText: {
    color: '#999',
    fontSize: 16,
    fontStyle: 'italic',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#ffffff',
    borderColor: '#dc3545',
  },
  clearButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '600',
  },
  undoButton: {
    backgroundColor: '#ffffff',
    borderColor: '#6c757d',
  },
  undoButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '600',
  },
  redoButton: {
    backgroundColor: '#ffffff',
    borderColor: '#6c757d',
  },
  redoButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  statusText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#6c757d',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default SignaturePadQuestion;
