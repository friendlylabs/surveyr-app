import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AlertContainer from '../../components/AlertContainer';
import TopBar from '../../components/TopBar';
import { useTheme } from '../../contexts/ThemeContext';
import { addZones, Zone as DatabaseZone, getZones } from '../../services/database';

interface CloudZone {
  id: string;
  name: string;
  hash: string;
}

export default function DownloadZonesScreen() {
  const { isDarkTheme, colors, styles: themeStyles } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [zones, setZones] = useState<CloudZone[]>([]);
  const [search, setSearch] = useState('');
  const [downloadedZones, setDownloadedZones] = useState<DatabaseZone[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const checkConnectivity = async (): Promise<boolean> => {
    // Basic connectivity check - in a real app you might use a library like NetInfo
    return true;
  };

  const fetchZones = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const hasConnection = await checkConnectivity();
      if (!hasConnection) {
        setError('No internet connection. Please check your internet connection and try again.');
        return;
      }

      const projectUrl = await AsyncStorage.getItem('projectUrl');
      const token = await AsyncStorage.getItem('token');

      if (!projectUrl || !token) {
        setError('Missing project configuration. Please log in again.');
        return;
      }

      const requestUrl = `${projectUrl}zones`;
      
      console.log('Fetching zones from:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status && data.zones) {
        if (Object.keys(data.zones).length === 0) {
          setError('No zones available for download.');
          return;
        }
        
        console.log('Zones loaded:', Object.keys(data.zones).length);
        
        // Convert from object format to array format for easier handling
        const zonesArray = Object.entries(data.zones).map(([hash, name]) => ({
          id: hash,
          name: name as string,
          hash: hash
        }));
        
        setZones(zonesArray);
      } else {
        setError(data.message || 'Could not fetch zones from server.');
      }
    } catch (err) {
      console.error('Error fetching zones:', err);
      setError('An error occurred while fetching zones. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load downloaded zones from database
  const loadDownloadedZones = useCallback(async () => {
    try {
      const zones = await getZones();
      setDownloadedZones(zones);
      
      // Auto-select downloaded zones
      const downloadedIds = new Set(zones.map(z => z.zone_id));
      setSelectedZoneIds(downloadedIds);
    } catch (error) {
      console.error('Error loading downloaded zones:', error);
    }
  }, []);

  useEffect(() => {
    loadDownloadedZones();
  }, [loadDownloadedZones]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const toggleZoneSelection = (zoneId: string) => {
    setSelectedZoneIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(zoneId)) {
        newSelection.delete(zoneId);
      } else {
        newSelection.add(zoneId);
      }
      return newSelection;
    });
  };

  const downloadSelectedZones = async () => {
    if (selectedZoneIds.size === 0) {
      Toast.show({
        type: 'error',
        text1: 'No zones selected',
        text2: 'Please select at least one zone to download.',
      });
      return;
    }

    try {
      setIsDownloading(true);

      const hasConnection = await checkConnectivity();
      if (!hasConnection) {
        Toast.show({
          type: 'error',
          text1: 'No internet connection',
          text2: 'Please check your internet connection and try again.',
        });
        return;
      }

      const projectUrl = await AsyncStorage.getItem('projectUrl');
      const token = await AsyncStorage.getItem('token');

      if (!projectUrl || !token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication error',
          text2: 'Please log in again.',
        });
        return;
      }

      // For each selected zone, download its data
      const downloadedZonesData: Omit<DatabaseZone, 'id' | 'project_id'>[] = [];
      const errors: string[] = [];

      for (const zoneId of selectedZoneIds) {
        try {
          const zone = zones.find(z => z.id === zoneId);
          if (!zone) continue;

          const zoneUrl = `${projectUrl}zones/show/${zoneId}`;
          
          console.log('Downloading zone data:', zone.name, 'from', zoneUrl);
          
          const response = await fetch(zoneUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const zoneData = await response.json();
          
          // Store the zone data for database insertion
          const now = new Date().toISOString();
          downloadedZonesData.push({
            zone_id: zoneId,
            name: zone.name,
            hash: zone.hash,
            content: JSON.stringify(zoneData),
            downloaded_at: now,
            updated_at: now
          });
        } catch (err) {
          console.error(`Error downloading zone ${zoneId}:`, err);
          errors.push(`Failed to download ${zones.find(z => z.id === zoneId)?.name || zoneId}`);
        }
      }

      // Save to database
      if (downloadedZonesData.length > 0) {
        try {
          const success = await addZones(downloadedZonesData);
          
          if (success) {
            // Refresh downloaded zones list
            await loadDownloadedZones();
            
            Toast.show({
              type: 'success',
              text1: 'Zones downloaded',
              text2: `Successfully downloaded ${downloadedZonesData.length} zones.`,
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Storage error',
              text2: 'Failed to save zones to database.',
            });
          }
        } catch (err) {
          console.error('Error saving zones to database:', err);
          Toast.show({
            type: 'error',
            text1: 'Storage error',
            text2: 'Failed to save zones to database.',
          });
        }
      }

      if (errors.length > 0) {
        Toast.show({
          type: 'error',
          text1: 'Some downloads failed',
          text2: `${errors.length} zone(s) failed to download.`,
        });
      }

    } catch (err) {
      console.error('Error in zone download process:', err);
      Toast.show({
        type: 'error',
        text1: 'Download failed',
        text2: 'An error occurred while downloading zones. Please try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const renderZone = (zone: CloudZone) => {
    const isSelected = selectedZoneIds.has(zone.id);
    const downloadedZone = downloadedZones.find(dz => dz.zone_id === zone.id);
    const lastDownloaded = downloadedZone?.downloaded_at;
    
    return (
      <TouchableOpacity
        key={zone.id}
        style={[
          styles.zoneItem,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : 'transparent',
          }
        ]}
        onPress={() => toggleZoneSelection(zone.id)}
        activeOpacity={0.7}
      >
        <View style={styles.zoneContent}>
          <Text 
            style={[
              styles.zoneTitle, 
              { color: colors.text }
            ]}
            numberOfLines={1}
          >
            {zone.name}
          </Text>
          <Text 
            style={[
              styles.zoneHash, 
              { color: colors.textSecondary }
            ]}
            numberOfLines={1}
          >
            ID: {zone.hash}
          </Text>
          {lastDownloaded && (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              Last updated: {new Date(lastDownloaded).toLocaleString()}
            </Text>
          )}
        </View>

        <View style={styles.zoneActions}>
          <View 
            style={[
              styles.checkbox, 
              { 
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primary : 'transparent' 
              }
            ]}
          >
            {isSelected && (
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Filtered zones based on search
  const filteredZones = search.trim().length === 0
    ? zones
    : zones.filter(z =>
        z.name.toLowerCase().includes(search.toLowerCase()) ||
        z.hash.toLowerCase().includes(search.toLowerCase())
      );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}> 
            Loading available zones...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <AlertContainer
          icon="warning-outline"
          title="Could not fetch zones"
          message={error}
          isDarkTheme={isDarkTheme}
        />
      );
    }

    return (
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.zonesContainer}>
          {filteredZones.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 32 }}>
              No zones found.
            </Text>
          ) : (
            filteredZones.map(renderZone)
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[themeStyles.container, { backgroundColor: colors.background }]}> 
      {/* Header */}
      <TopBar title="Download Zones" />

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderRadius: 8,
          paddingHorizontal: 12,
          marginBottom: 4,
        }}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, color: colors.text, fontSize: 16, backgroundColor: 'transparent', paddingVertical: 10 }}
            placeholder="Search zones..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Download Button */}
      {!isLoading && !error && zones.length > 0 && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.downloadButton,
              { backgroundColor: colors.primary },
              isDownloading && { opacity: 0.7 }
            ]}
            onPress={downloadSelectedZones}
            disabled={isDownloading || selectedZoneIds.size === 0}
            activeOpacity={0.7}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={20} color="#ffffff" />
                <Text style={styles.downloadButtonText}>
                  Download {selectedZoneIds.size > 0 ? `(${selectedZoneIds.size})` : 'Zones'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    opacity: 0.6,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  zonesContainer: {
    paddingBottom: 100, // Space for download button
  },
  zoneItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  zoneContent: {
    flex: 1,
    marginRight: 12,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  zoneHash: {
    fontSize: 14,
    opacity: 0.8,
  },
  zoneActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
  },
  downloadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
