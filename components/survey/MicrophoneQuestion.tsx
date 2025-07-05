import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Types
export interface MicrophoneQuestionProps {
  value?: string; // Audio file URI
  onValueChange: (value: string | undefined) => void;
  isEnabled: boolean;
  placeholder?: string;
  maxDuration?: number; // Maximum recording duration in milliseconds
}

/**
 * MicrophoneQuestion component for recording audio
 */
const MicrophoneQuestion: React.FC<MicrophoneQuestionProps> = ({
  value,
  onValueChange,
  isEnabled,
  placeholder = 'Tap to record audio',
  maxDuration = 300000 // 5 minutes default
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

  // Initialize audio session
  React.useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error('Failed to setup audio:', error);
      }
    };

    setupAudio();

    // Cleanup on unmount
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    if (!isEnabled) return;

    try {
      setIsLoading(true);
      
      // Stop any existing playback
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access to record audio.');
        return;
      }

      // Clear existing recording if any
      if (value) {
        onValueChange(undefined);
      }

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: 2, // MPEG_4
          audioEncoder: 3, // AAC
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: 3, // MPEG4AAC
          audioQuality: 96, // HIGH
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1000;
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsLoading(true);
      
      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        onValueChange(uri);
      }

      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const playRecording = async () => {
    if (!value || isPlaying) return;

    try {
      setIsLoading(true);

      // Unload any existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Create and load new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: value },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setIsPlaying(true);

      // Set playback status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Playback Error', 'Failed to play recording. Please try again.');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopPlayback = async () => {
    if (!soundRef.current || !isPlaying) return;

    try {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  };

  const clearRecording = () => {
    Alert.alert(
      'Clear Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onValueChange(undefined);
            setRecordingDuration(0);
            if (soundRef.current) {
              soundRef.current.unloadAsync();
              soundRef.current = null;
            }
            setIsPlaying(false);
          }
        }
      ]
    );
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderRecordingButton = () => {
    if (isRecording) {
      return (
        <TouchableOpacity
          style={[styles.recordButton, styles.stopButton]}
          onPress={stopRecording}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <MaterialIcons name="stop" size={32} color="#fff" />
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.recordButton, !isEnabled && styles.disabledButton]}
        onPress={startRecording}
        disabled={!isEnabled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <MaterialIcons name="mic" size={32} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  const renderPlaybackControls = () => {
    if (!value) return null;

    return (
      <View style={styles.playbackContainer}>
        <TouchableOpacity
          style={[styles.playButton, !isEnabled && styles.disabledButton]}
          onPress={isPlaying ? stopPlayback : playRecording}
          disabled={!isEnabled || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <MaterialIcons 
              name={isPlaying ? "pause" : "play-arrow"} 
              size={24} 
              color="#fff" 
            />
          )}
        </TouchableOpacity>

        <Text style={styles.recordingText}>Recording saved</Text>

        <TouchableOpacity
          style={[styles.clearButton, !isEnabled && styles.disabledButton]}
          onPress={clearRecording}
          disabled={!isEnabled}
        >
          <MaterialIcons name="delete" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!value ? (
        <View style={styles.recordingContainer}>
          {renderRecordingButton()}
          <View style={styles.recordingInfo}>
            <Text style={[styles.placeholderText, !isEnabled && styles.disabledText]}>
              {isRecording ? 'Recording...' : placeholder}
            </Text>
            {isRecording && (
              <Text style={styles.durationText}>
                {formatDuration(recordingDuration)} / {formatDuration(maxDuration)}
              </Text>
            )}
          </View>
        </View>
      ) : (
        renderPlaybackControls()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stopButton: {
    backgroundColor: '#ff6666',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  recordingInfo: {
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  disabledText: {
    color: '#999',
  },
  durationText: {
    fontSize: 14,
    color: '#666',
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
});

export default MicrophoneQuestion;
