import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Choice } from './types';

interface DropdownQuestionProps {
  choices: Choice[];
  value: string;
  onValueChange: (value: string) => void;
  isEnabled: boolean;
  placeholder: string;
}

export function DropdownQuestion({
  choices,
  value,
  onValueChange,
  isEnabled,
  placeholder
}: DropdownQuestionProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedChoice = choices.find(choice => choice.value === value);

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownButton, !isEnabled && styles.disabledInput]}
        onPress={() => isEnabled && setModalVisible(true)}
        disabled={!isEnabled}
      >
        <Text style={[styles.dropdownText, !isEnabled && styles.disabledText]}>
          {selectedChoice ? selectedChoice.text : placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Option</Text>
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
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    value === item.value && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    value === item.value && styles.dropdownOptionTextSelected
                  ]}>
                    {item.text}
                  </Text>
                  {value === item.value && (
                    <Text style={styles.dropdownCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
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
  dropdownCheckmark: {
    fontSize: 16,
    color: '#10B981',
    marginLeft: 8,
  },
});

export default DropdownQuestion;
