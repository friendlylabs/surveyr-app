import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getChoicesFromZoneUrl } from '../../utils/surveyParser';
import { Choice } from './types';

interface DropdownQuestionProps {
  choices: Choice[];
  choicesByUrl?: {
    url: string;
    valueName?: string;
    titleName?: string;
  };
  value: string | number | null | undefined;
  onValueChange: (value: string) => void;
  isEnabled: boolean;
  placeholder: string;
  surveyData?: Record<string, any>;
}

export function DropdownQuestion({
  choices: initialChoices,
  choicesByUrl,
  value,
  onValueChange,
  isEnabled,
  placeholder,
  surveyData = {}
}: DropdownQuestionProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [choices, setChoices] = useState<Choice[]>(initialChoices || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update choices when initial choices change
    setChoices(initialChoices || []);
  }, [initialChoices]);

  // Listen for changes in any dependency fields referenced in the URL or params
  // Compute a stable dependency key for referenced fields
  useEffect(() => {
    if (!choicesByUrl?.url) {
      setChoices(initialChoices || []);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Find all referenced keys in the URL
    const getDependencyKeys = () => {
      const keys = new Set<string>();
      const url = choicesByUrl.url;
      const matches = url.matchAll(/\{([^}]+)\}/g);
      for (const m of matches) {
        if (m[1]) keys.add(m[1]);
      }
      return Array.from(keys).sort(); // sort for stable order
    };

    const dependencyKeys = getDependencyKeys();
    const dependencyValues = dependencyKeys.map(k => surveyData[k]);

    const loadChoicesFromUrl = async () => {
      try {
        const dynamicChoices = await getChoicesFromZoneUrl(choicesByUrl, surveyData);
        if (!isMounted) return;
        if (dynamicChoices && dynamicChoices.length > 0) {
          setChoices(dynamicChoices);
        } else if (dynamicChoices && dynamicChoices.length === 0) {
          setChoices([]);
          setError('No options available');
        } else {
          setChoices([]);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading choices from URL:', err);
        setError('Failed to load options');
        setChoices([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadChoicesFromUrl();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choicesByUrl, initialChoices, JSON.stringify((() => {
    // Stable dependency: referenced keys and their values
    if (!choicesByUrl?.url) return [];
    const keys = Array.from((choicesByUrl.url.matchAll(/\{([^}]+)\}/g)), m => m[1]).sort();
    return keys.map(k => [k, surveyData[k]]);
  })())]);

  // Handle various value types by converting to string for comparison
  const stringValue = value !== null && value !== undefined ? String(value) : '';
  const selectedChoice = choices.find(choice => choice.value === stringValue);

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
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
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
            )}
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
    maxHeight: '90%', // was 100%, now 90% to avoid overflow
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#e53935',
    fontSize: 16,
  },
});

export default DropdownQuestion;
