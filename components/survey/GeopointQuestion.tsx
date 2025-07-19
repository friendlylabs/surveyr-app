import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

// Types
export interface GeopointQuestionProps {
  value?: any;
  onValueChange: (value: any) => void;
  isEnabled: boolean;
  questionName: string;
  variant?: 'default' | 'manual' | 'trace' | 'area';
  onLocationRequest?: (questionName: string) => Promise<any>;
}

/**
 * GeopointQuestion component for location-based questions
 */
const GeopointQuestion: React.FC<GeopointQuestionProps> = ({
  value,
  onValueChange,
  isEnabled,
  questionName,
  variant = 'default',
  onLocationRequest
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [hasInitialLocation, setHasInitialLocation] = useState(false);
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Get current location on component mount
  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for this question.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      };

      setCurrentLocation(coords);
      
      // Only update map region if we haven't set initial location yet, or if manually triggered
      if (!hasInitialLocation) {
        setMapRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setHasInitialLocation(true);
      } else {
        // If manually triggered, animate to new location
        mapRef.current?.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

      // For default variant, automatically set the location
      if (variant === 'default') {
        onValueChange(coords);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location.');
    }
  }, [variant, onValueChange, hasInitialLocation]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const handleMapPress = (event: any) => {
    if (!isEnabled) return;

    const coordinate = event.nativeEvent.coordinate;

    switch (variant) {
      case 'manual':
        onValueChange({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          accuracy: null
        });
        break;

      case 'area':
        const currentPolygon = value?.polygon || [];
        const newPolygon = [...currentPolygon, coordinate];
        onValueChange({
          polygon: newPolygon
        });
        break;

      default:
        break;
    }
  };

  const startTracing = async () => {
    if (!isEnabled) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for tracing.');
        return;
      }

      setIsTracking(true);
      
      // Initialize path with current location if available
      const initialPath = currentLocation ? [currentLocation] : [];
      onValueChange({ path: initialPath });

      // Start location updates
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 5  // Update every 5 meters
        },
        (location) => {
          const newPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp
          };

          // Update the path by adding the new point
          onValueChange((currentValue: any) => {
            const currentPath = currentValue?.path || [];
            return {
              path: [...currentPath, newPoint]
            };
          });
        }
      );

      locationSubscription.current = subscription;
    } catch (error) {
      console.error('Error starting trace:', error);
      Alert.alert('Error', 'Failed to start location tracking.');
      setIsTracking(false);
    }
  };

  const stopTracing = () => {
    setIsTracking(false);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const clearData = () => {
    switch (variant) {
      case 'trace':
        onValueChange({ path: [] });
        break;
      case 'area':
        onValueChange({ polygon: [] });
        break;
      default:
        onValueChange(null);
        break;
    }
  };

  // Helper function to render coordinates overlay
  const renderCoordinatesOverlay = () => {
    let coordinateText = '';
    
    switch (variant) {
      case 'default':
      case 'manual':
        if (value?.latitude && value?.longitude) {
          coordinateText = `Lat: ${value.latitude.toFixed(6)}, Lng: ${value.longitude.toFixed(6)}`;
          if (value.accuracy) {
            coordinateText += ` (±${value.accuracy.toFixed(0)}m)`;
          }
        }
        break;
      case 'trace':
        if (value?.path && value.path.length > 0) {
          coordinateText = `Path points: ${value.path.length}`;
        }
        break;
      case 'area':
        if (value?.polygon && value.polygon.length > 0) {
          coordinateText = `Vertices: ${value.polygon.length}`;
          if (value.polygon.length >= 3) {
            coordinateText += ' (Area formed)';
          }
        }
        break;
    }

    if (coordinateText) {
      return (
        <View style={styles.coordinatesOverlay}>
          <Text style={styles.coordinatesOverlayText}>{coordinateText}</Text>
        </View>
      );
    }
    return null;
  };

  const renderVariantSpecificUI = () => {
    switch (variant) {
      case 'default':
        return (
          <View style={styles.controlsContainer}>
            <Text style={styles.instructions}>
              Current location will be automatically detected
            </Text>
          </View>
        );

      case 'manual':
        return (
          <View style={styles.controlsContainer}>
            <Text style={styles.instructions}>
              Tap on the map to set your location
            </Text>
          </View>
        );

      case 'trace':
        return (
          <View style={styles.controlsContainer}>
            <Text style={styles.instructions}>
              {isTracking ? 'Recording your path...' : 'Start tracking to record your path'}
            </Text>
          </View>
        );

      case 'area':
        return (
          <View style={styles.controlsContainer}>
            <Text style={styles.instructions}>
              Tap on the map to create polygon vertices. Tap at least 3 points to form an area.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const renderMapOverlays = () => {
    const overlays = [];

    // Current location marker
    if (currentLocation) {
      overlays.push(
        <Marker
          key="current-location"
          coordinate={currentLocation}
          title="Current Location"
          pinColor="blue"
        />
      );
    }

    switch (variant) {
      case 'default':
      case 'manual':
        if (value?.latitude && value?.longitude) {
          overlays.push(
            <Marker
              key="selected-location"
              coordinate={{
                latitude: value.latitude,
                longitude: value.longitude
              }}
              title="Selected Location"
              pinColor="red"
            />
          );
        }
        break;

      case 'trace':
        if (value?.path && value.path.length > 1) {
          overlays.push(
            <Polyline
              key="trace-path"
              coordinates={value.path}
              strokeColor="#FF0000"
              strokeWidth={3}
            />
          );
        }
        if (value?.path && value.path.length > 0) {
          value.path.forEach((point: any, index: number) => {
            overlays.push(
              <Marker
                key={`trace-point-${index}`}
                coordinate={point}
                title={`Point ${index + 1}`}
                pinColor={index === 0 ? "green" : index === value.path.length - 1 ? "red" : "orange"}
              />
            );
          });
        }
        break;

      case 'area':
        if (value?.polygon && value.polygon.length >= 3) {
          overlays.push(
            <Polygon
              key="area-polygon"
              coordinates={value.polygon}
              fillColor="rgba(255, 0, 0, 0.3)"
              strokeColor="#FF0000"
              strokeWidth={2}
            />
          );
        }
        if (value?.polygon && value.polygon.length > 0) {
          value.polygon.forEach((point: any, index: number) => {
            overlays.push(
              <Marker
                key={`area-point-${index}`}
                coordinate={point}
                title={`Vertex ${index + 1}`}
                pinColor="red"
              />
            );
          });
        }
        break;
    }

    return overlays;
  };

  const { width } = Dimensions.get('window');
  const mapHeight = Math.min(300, width * 0.6);

  // Check if there's data to clear
  const hasDataToClear = () => {
    switch (variant) {
      case 'trace':
        return value?.path && value.path.length > 0;
      case 'area':
        return value?.polygon && value.polygon.length > 0;
      case 'manual':
        return value?.latitude && value?.longitude;
      case 'default':
        return false; // No clear button needed for default variant
      default:
        return false;
    }
  };

  return (
    <View style={styles.geopointContainer}>
      {renderVariantSpecificUI()}
      
      <View style={[styles.mapContainer, { height: mapHeight }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          onPress={handleMapPress}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          showsMyLocationButton={false}
          moveOnMarkerPress={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          {renderMapOverlays()}
        </MapView>
        
        {/* Coordinates Overlay */}
        {renderCoordinatesOverlay()}
        
        {/* Location Update Button - Available for all variants */}
        {isEnabled && (
          <TouchableOpacity
            style={[styles.locationButton, !isEnabled && styles.disabledButton]}
            onPress={getCurrentLocation}
            disabled={!isEnabled}
          >
            <Ionicons name="location-outline" size={20} color="#10B981" />
          </TouchableOpacity>
        )}
        
        {/* Trace Control Button */}
        {variant === 'trace' && isEnabled && (
          <TouchableOpacity
            style={[
              styles.traceButton,
              isTracking ? styles.stopButton : styles.startButton,
              !isEnabled && styles.disabledButton
            ]}
            onPress={isTracking ? stopTracing : startTracing}
            disabled={!isEnabled}
          >
            <Ionicons 
              name={isTracking ? "stop" : "play"} 
              size={18} 
              color="#fff" 
            />
          </TouchableOpacity>
        )}
        
        {/* Absolute Clear Button */}
        {hasDataToClear() && isEnabled && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearData}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  geopointContainer: {
    marginTop: 8,
  },
  controlsContainer: {
    marginBottom: 12,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    flex: 1,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  clearButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#ff5722',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  traceButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  coordinatesOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  coordinatesOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  locationButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '500',
  },
  whiteText: {
    color: '#fff',
  },
  coordinates: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginVertical: 4,
  },
  mapContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  disabledText: {
    color: '#999',
  },
});

export default GeopointQuestion;
