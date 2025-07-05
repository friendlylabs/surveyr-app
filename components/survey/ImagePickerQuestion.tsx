import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
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

// Full-screen video player for modal
const ModalVideoPlayer: React.FC<{
  uri: string;
  onClose: () => void;
}> = ({ uri, onClose }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.muted = false; // Allow audio in modal
    player.play(); // Auto-play in modal for better UX
  });

  return (
    <View style={styles.modalVideoContainer}>
      <VideoView
        style={styles.modalVideo}
        player={player}
        allowsFullscreen={true}
        allowsPictureInPicture={true}
        contentFit="contain"
      />
      <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
        <Text style={styles.modalCloseButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

// Video item renderer component using expo-video
const VideoItemRenderer: React.FC<{
  uri: string;
  height: number;
  resizeMode: 'cover' | 'contain' | 'stretch';
}> = ({ uri, height, resizeMode }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.muted = true;
    // Don't auto-play to save bandwidth and battery
  });

  // Map resize mode to valid VideoContentFit values
  const getVideoContentFit = (mode: 'cover' | 'contain' | 'stretch') => {
    switch (mode) {
      case 'cover': return 'cover';
      case 'contain': return 'contain';
      case 'stretch': return 'fill'; // Use 'fill' instead of 'stretch'
      default: return 'cover';
    }
  };

  return (
    <VideoView
      style={[styles.mediaItem, { height }]}
      player={player}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
      contentFit={getVideoContentFit(resizeMode)}
    />
  );
};

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
  // State for modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<ImageChoice | null>(null);

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

  const handleLongPress = (item: ImageChoice) => {
    setSelectedMedia(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMedia(null);
  };

  const getResizeMode = (): 'cover' | 'contain' | 'stretch' => {
    switch (imageFit) {
      case 'cover': return 'cover';
      case 'contain': return 'contain';
      case 'fill': return 'stretch';
      case 'scale-down': return 'contain'; // Closest match
      default: return 'cover';
    }
  };

  const renderImageItem = ({ item }: { item: ImageChoice }, itemWidth?: number) => {
    const isSelected = selectedValues.includes(item.value);
    const actualWidth = itemWidth || imageWidth;
    
    return (
      <TouchableOpacity 
        style={[
          styles.itemContainer, 
          { width: actualWidth }, 
          isSelected && styles.selectedItem,
          !isEnabled && styles.disabledItem
        ]}
        onPress={() => handleSelect(item.value)}
        onLongPress={() => handleLongPress(item)}
        disabled={!isEnabled}
        delayLongPress={500}
      >
        {contentMode === 'video' ? (
          <VideoItemRenderer 
            uri={item.imageLink}
            height={imageHeight}
            resizeMode={getResizeMode()}
          />
        ) : (
          <Image
            style={[styles.mediaItem, { height: imageHeight }]}
            source={{ uri: item.imageLink }}
            resizeMode={getResizeMode()}
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

  // Fixed 3 columns layout
  const numColumns = 3;
  const containerPadding = 32; // Total horizontal padding (16 on each side)
  const itemSpacing = 12; // Space between items
  const totalSpacing = itemSpacing * (numColumns - 1); // Space between items in a row
  const availableWidth = SCREEN_WIDTH - containerPadding - totalSpacing;
  const calculatedItemWidth = Math.floor(availableWidth / numColumns);

  return (
    <View style={styles.container}>
      <FlatList
        data={choices}
        renderItem={({ item }) => renderImageItem({ item }, calculatedItemWidth)}
        keyExtractor={(item) => item.value}
        numColumns={numColumns}
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={false} // Let parent ScrollView handle scrolling
        style={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      
      {/* Modal for full-screen media viewing */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                {selectedMedia && (
                  <>
                    {contentMode === 'video' ? (
                      <ModalVideoPlayer uri={selectedMedia.imageLink} onClose={closeModal} />
                    ) : (
                      <View style={styles.modalImageContainer}>
                        <Image
                          style={styles.modalImage}
                          source={{ uri: selectedMedia.imageLink }}
                          resizeMode="contain"
                        />
                        <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
                          <Text style={styles.modalCloseButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {selectedMedia.text && (
                      <Text style={styles.modalTitle}>{selectedMedia.text}</Text>
                    )}
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  list: {
    width: '100%',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemContainer: {
    marginBottom: 12,
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalImageContainer: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: 400,
  },
  modalVideoContainer: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    height: 300,
  },
  modalVideo: {
    width: '100%',
    height: '100%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
});

export default ImagePickerQuestion;
