import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

export interface ImageQuestionProps {
  imageLink: string; // URL or base64 string
  contentMode?: 'image' | 'video' | 'youtube';
  imageFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  imageHeight?: string | number; // 'auto', percentage, or pixel value
  imageWidth?: string | number; // 'auto', percentage, or pixel value
  title?: string;
  description?: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

// YouTube URL parser
const getYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Full-screen modal video player
const ModalVideoPlayer: React.FC<{
  uri: string;
  onClose: () => void;
  contentMode: 'video' | 'youtube';
}> = ({ uri, onClose, contentMode }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.muted = false;
    player.play();
  });

  if (contentMode === 'youtube') {
    const videoId = getYouTubeVideoId(uri);
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : uri;
    
    return (
      <View style={styles.modalContainer}>
        <WebView
          style={styles.modalWebView}
          source={{ uri: embedUrl }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
        <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
          <Text style={styles.modalCloseButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.modalContainer}>
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

/**
 * ImageQuestion component for displaying preset media content
 */
const ImageQuestion: React.FC<ImageQuestionProps> = ({
  imageLink,
  contentMode = 'image',
  imageFit = 'cover',
  imageHeight = 'auto', // Default to auto for 16:10 aspect ratio
  imageWidth = '100%',  // Default to 100% width
  title,
  description
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Initialize video player for video content mode (always call hook)
  const videoPlayer = useVideoPlayer(
    contentMode === 'video' ? imageLink : '', 
    player => {
      if (contentMode === 'video') {
        player.loop = true;
        player.muted = true;
        // Don't auto-play to save bandwidth
      }
    }
  );

  // Calculate dimensions with 16:10 aspect ratio default
  const getContainerStyle = () => {
    const style: any = {};

    // Handle width - use percentage to avoid overflow
    if (typeof imageWidth === 'string') {
      if (imageWidth.endsWith('%')) {
        style.width = imageWidth; // Use percentage directly
      } else if (imageWidth === 'auto') {
        style.width = '100%'; // Use 100% instead of SCREEN_WIDTH
      } else {
        style.width = imageWidth;
      }
    } else {
      style.width = imageWidth || '100%';
    }

    // Handle height with 16:10 aspect ratio
    if (typeof imageHeight === 'string') {
      if (imageHeight.endsWith('%')) {
        const percentage = parseInt(imageHeight.replace('%', '')) / 100;
        style.height = SCREEN_HEIGHT * percentage;
      } else if (imageHeight === 'auto') {
        // For auto height with percentage width, we need to calculate based on container
        // Use aspect ratio but let flexbox handle the actual sizing
        style.aspectRatio = 16 / 10; // Use aspectRatio for responsive design
      } else {
        style.height = imageHeight;
      }
    } else {
      if (imageHeight === undefined) {
        // Use aspect ratio instead of calculated pixel height for responsive design
        style.aspectRatio = 16 / 10; // 16:10 ratio
      } else {
        style.height = imageHeight;
      }
    }

    return style;
  };

  const getResizeMode = () => {
    switch (imageFit) {
      case 'cover': return 'cover';
      case 'contain': return 'contain';
      case 'fill': return 'stretch';
      case 'scale-down': return 'contain';
      default: return 'cover';
    }
  };

  const handlePress = () => {
    if (contentMode === 'video' || contentMode === 'youtube') {
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const renderContent = () => {
    const containerStyle = getContainerStyle();

    if (contentMode === 'youtube') {
      const videoId = getYouTubeVideoId(imageLink);
      const thumbnailUrl = videoId 
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : imageLink;

      return (
        <TouchableOpacity 
          style={[styles.container, containerStyle]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Image
            style={styles.media}
            source={{ uri: thumbnailUrl }}
            resizeMode={getResizeMode() as any}
            onError={() => setImageError(true)}
          />
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (contentMode === 'video') {
      return (
        <TouchableOpacity 
          style={[styles.container, containerStyle]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <VideoView
            style={styles.media}
            player={videoPlayer}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            contentFit={getResizeMode() === 'stretch' ? 'fill' : getResizeMode() as any}
          />
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Default to image
    return (
      <View style={[styles.container, containerStyle]}>
        {imageError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load image</Text>
          </View>
        ) : (
          <Image
            style={styles.media}
            source={{ uri: imageLink }}
            resizeMode={getResizeMode() as any}
            onError={() => setImageError(true)}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      {title && <Text style={styles.title}>{title}</Text>}
      {description && <Text style={styles.description}>{description}</Text>}
      
      {renderContent()}

      {/* Modal for full-screen video viewing */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ModalVideoPlayer
                uri={imageLink}
                onClose={closeModal}
                contentMode={contentMode as 'video' | 'youtube'}
              />
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  container: {
    position: 'relative',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playButtonText: {
    color: 'white',
    fontSize: 24,
    marginLeft: 4, // Slightly offset for visual centering
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorText: {
    color: '#666',
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    height: '80%',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
  },
  modalWebView: {
    width: '100%',
    height: '100%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default ImageQuestion;
