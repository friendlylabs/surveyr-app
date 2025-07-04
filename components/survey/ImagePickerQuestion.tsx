import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export interface ImageChoice {
  value: string;
  text?: string;
  imageLink: string;
}

export interface ImagePickerQuestionProps {
  choices: ImageChoice[];
  value: string | undefined;
  onValueChange: (value: string | string[] | undefined) => void;
  isEnabled: boolean;
  contentMode?: 'image' | 'video';
  imageFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  showLabel?: boolean;
  imageWidth?: number;
  imageHeight?: number;
  multiSelect?: boolean;
}

const DEFAULT_IMAGE_SIZE = 120;
const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * ImagePickerQuestion component for image and video selection
 */
const ImagePickerQuestion: React.FC<ImagePickerQuestionProps> = ({
  choices,
  value,
  onValueChange,
  isEnabled,
  contentMode = 'image',
  imageFit = 'cover',
  showLabel = true,
  imageWidth = DEFAULT_IMAGE_SIZE,
  imageHeight = DEFAULT_IMAGE_SIZE,
  multiSelect = false
}) => {
  // For multi-select mode, value is an array
  const selectedValues = multiSelect && value ? 
    (Array.isArray(value) ? value : [value]) : 
    (value ? [value] : []);

  const handleSelect = (choiceValue: string) => {
    if (!isEnabled) return;

    if (multiSelect) {
      // For multi-select mode, toggle the selection
      const newSelectedValues = selectedValues.includes(choiceValue)
        ? selectedValues.filter(v => v !== choiceValue)
        : [...selectedValues, choiceValue];
      
      onValueChange(newSelectedValues.length > 0 ? newSelectedValues : undefined);
    } else {
      // For single select mode, just set the value
      onValueChange(choiceValue);
    }
  };

  const getResizeMode = () => {
    switch (imageFit) {
      case 'cover': return ResizeMode.COVER;
      case 'contain': return ResizeMode.CONTAIN;
      case 'fill': return 'stretch' as any;
      case 'scale-down': return ResizeMode.CONTAIN; // Closest match
      default: return ResizeMode.COVER;
    }
  };

  const renderImageItem = ({ item }: { item: ImageChoice }) => {
    const isSelected = selectedValues.includes(item.value);
    
    return (
      <TouchableOpacity 
        style={[
          styles.itemContainer, 
          { width: imageWidth }, 
          isSelected && styles.selectedItem,
          !isEnabled && styles.disabledItem
        ]}
        onPress={() => handleSelect(item.value)}
        disabled={!isEnabled}
      >
        {contentMode === 'video' ? (
          <Video
            style={[styles.mediaItem, { height: imageHeight }]}
            source={{ uri: item.imageLink }}
            useNativeControls={false}
            resizeMode={getResizeMode()}
            isLooping
            shouldPlay={false}
          />
        ) : (
          <Image
            style={[styles.mediaItem, { height: imageHeight }]}
            source={{ uri: item.imageLink }}
            resizeMode={getResizeMode() as any}
          />
        )}

        {showLabel && item.text && (
          <Text style={[
            styles.itemLabel, 
            isSelected && styles.selectedLabel,
            !isEnabled && styles.disabledText
          ]}>
            {item.text}
          </Text>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIndicatorText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Calculate numColumns based on screen width and image width
  const numColumns = Math.max(1, Math.floor((SCREEN_WIDTH - 32) / (imageWidth + 12)));

  return (
    <View style={styles.container}>
      <FlatList
        data={choices}
        renderItem={renderImageItem}
        keyExtractor={(item) => item.value}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        scrollEnabled={false} // Let parent ScrollView handle scrolling
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
  list: {
    width: '100%',
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  itemContainer: {
    marginBottom: 12,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedItem: {
    borderColor: '#10B981',
  },
  disabledItem: {
    opacity: 0.6,
  },
  mediaItem: {
    width: '100%',
  },
  itemLabel: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  selectedLabel: {
    fontWeight: '500',
    color: '#10B981',
  },
  disabledText: {
    color: '#999',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#10B981',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default ImagePickerQuestion;
