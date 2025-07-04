import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface HtmlContentProps {
  html: string;
}

export function HtmlContent({ html }: HtmlContentProps) {
  return (
    <View style={styles.htmlContainer}>
      {renderHtmlContent(html || 'HTML content')}
    </View>
  );
}

function renderHtmlContent(htmlContent: string): React.ReactNode {
  if (!htmlContent) return null;
  
  // Simple HTML to React Native JSX parser
  // This is a basic implementation - for production, consider using a library
  
  // Remove any script tags for security
  const sanitizedHtml = htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
  
  // Convert common HTML elements to React Native components
  // This handles basic formatting like paragraphs, headings, and basic styling
  
  // Replace <p> tags with Text components
  let result = sanitizedHtml.replace(/<p[^>]*>(.*?)<\/p>/gi, (match, content) => {
    return `<paragraph>${content}</paragraph>`;
  });
  
  // Replace headings
  result = result.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '<heading1>$1</heading1>');
  result = result.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '<heading2>$1</heading2>');
  result = result.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '<heading3>$1</heading3>');
  
  // Replace <strong> and <b> tags
  result = result.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '<bold>$2</bold>');
  
  // Replace <em> and <i> tags
  result = result.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '<italic>$2</italic>');
  
  // Replace <br> tags
  result = result.replace(/<br\s*\/?>/gi, '\n');
  
  // Replace <ul> and <li> tags
  result = result.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
  result = result.replace(/<\/?ul[^>]*>/gi, '');
  
  // Remove any remaining HTML tags
  result = result.replace(/<[^>]*>/g, '');
  
  // Handle common HTML entities
  result = result.replace(/&nbsp;/g, ' ');
  result = result.replace(/&amp;/g, '&');
  result = result.replace(/&lt;/g, '<');
  result = result.replace(/&gt;/g, '>');
  result = result.replace(/&quot;/g, '"');
  
  // Split by custom tags and render with appropriate styles
  const parts = result.split(/(<heading1>|<\/heading1>|<heading2>|<\/heading2>|<heading3>|<\/heading3>|<bold>|<\/bold>|<italic>|<\/italic>|<paragraph>|<\/paragraph>)/);
  
  const elements: React.ReactNode[] = [];
  let currentText = '';
  let isHeading1 = false;
  let isHeading2 = false;
  let isHeading3 = false;
  let isParagraph = false;
  
  parts.forEach((part, index) => {
    if (part === '<heading1>') isHeading1 = true;
    else if (part === '</heading1>') isHeading1 = false;
    else if (part === '<heading2>') isHeading2 = true;
    else if (part === '</heading2>') isHeading2 = false;
    else if (part === '<heading3>') isHeading3 = true;
    else if (part === '</heading3>') isHeading3 = false;
    else if (part === '<paragraph>') isParagraph = true;
    else if (part === '</paragraph>') {
      isParagraph = false;
      elements.push(
        <Text key={index} style={styles.htmlParagraph}>
          {currentText}
        </Text>
      );
      currentText = '';
    }
    else if (part) {
      // Actual text content
      if (isParagraph || (!isHeading1 && !isHeading2 && !isHeading3)) {
        currentText += part;
      } else {
        // Direct rendering for headings
        const style = isHeading1 
          ? styles.htmlHeading1 
          : isHeading2 
            ? styles.htmlHeading2
            : styles.htmlHeading3;
        
        elements.push(
          <Text key={index} style={style}>
            {part}
          </Text>
        );
      }
    }
  });
  
  // Add any remaining text
  if (currentText) {
    elements.push(
      <Text key="last" style={styles.htmlText}>
        {currentText}
      </Text>
    );
  }
  
  // If no elements were created, return the original text
  if (elements.length === 0) {
    return <Text style={styles.htmlText}>{result}</Text>;
  }
  
  return <>{elements}</>;
}

const styles = StyleSheet.create({
  htmlContainer: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  htmlText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  htmlParagraph: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  htmlHeading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginVertical: 12,
  },
  htmlHeading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  htmlHeading3: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
});

export default HtmlContent;
