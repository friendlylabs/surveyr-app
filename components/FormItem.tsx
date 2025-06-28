import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { database, Form } from '../services/database';

interface FormItemProps {
  form: Form;
  onPress: (formId: string) => void;
}

export default function FormItem({ form, onPress }: FormItemProps) {
  const { colors } = useTheme();
  const [submissionCount, setSubmissionCount] = useState(0);

  useEffect(() => {
    database.countSubmissionsByFormId(form.id).then(setSubmissionCount);
  }, [form.id]);

  const formattedTitle = form.title.charAt(0).toUpperCase() + form.title.slice(1).toLowerCase();

  return (
    <TouchableOpacity
      style={[styles.formItem, { backgroundColor: colors.card }]}
      onPress={() => onPress(form.id)}
      activeOpacity={0.7}
    >
      <View style={styles.formContent}>
        <Text style={[styles.formTitle, { color: colors.text }]}>
          {formattedTitle}
        </Text>
        <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
          {submissionCount} submissions
        </Text>
      </View>
      <Ionicons
        name="documents-outline"
        size={24}
        color={colors.border}
        style={styles.formIcon}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  formItem: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formContent: {
    flex: 1,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  formIcon: {
    opacity: 0.3,
  },
});
