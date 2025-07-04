import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Choice } from './types';

interface TagboxQuestionProps {
  choices: Choice[];
  value: string[];
  onValueChange: (value: string[]) => void;
  isEnabled: boolean;
  placeholder: string;
}

export function TagboxQuestion({
  choices,
  value,
  onValueChange,
  isEnabled,
  placeholder
}: TagboxQuestionProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleSelection = (choiceValue: string) => {
    const isSelected = selectedValues.includes(choiceValue);
    const newValues = isSelected
      ? selectedValues.filter(v => v !== choiceValue)
      : [...selectedValues, choiceValue];
    onValueChange(newValues);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const choice = choices.find(c => c.value === selectedValues[0]);
      return choice ? choice.text : selectedValues[0];
    }
    return `${selectedValues.length} items selected`;
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownButton, !isEnabled && styles.disabledInput]}
        onPress={() => isEnabled && setModalVisible(true)}
        disabled={!isEnabled}
      >
        <Text style={[styles.dropdownText, !isEnabled && styles.disabledText]}>
          {getDisplayText()}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {/* Selected tags display */}
      {selectedValues.length > 0 && (
        <View style={styles.tagContainer}>
          {selectedValues.map((selectedValue) => {
            const choice = choices.find(c => c.value === selectedValue);
            return (
              <View key={selectedValue} style={styles.tag}>
                <Text style={styles.tagText}>{choice ? choice.text : selectedValue}</Text>
                {isEnabled && (
                  <TouchableOpacity
                    style={styles.tagRemove}
                    onPress={() => toggleSelection(selectedValue)}
                  >
                    <Text style={styles.tagRemoveText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Options</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={choices}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = selectedValues.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected
                    ]}
                    onPress={() => toggleSelection(item.value)}
                  >
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[
                      styles.dropdownOptionText,
                      isSelected && styles.dropdownOptionTextSelected
                    ]}>
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  disabledText: {
    color: '#999',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 16,
    color: '#333',
  },
  tagRemove: {
    marginLeft: 8,
  },
  tagRemoveText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 16,
    backgroundColor: '#f1f1f1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#333',
  },
  dropdownOption: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownOptionTextSelected: {
    fontWeight: '600',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalDoneButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 6,
    margin: 16,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TagboxQuestion;
