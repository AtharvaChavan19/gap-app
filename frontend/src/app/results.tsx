import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import ZoomableImage from '../components/ZoomableImage';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface AnalysisResultsData {
  total_gaps: number;
  estimated_missing_plants: number;
  estimated_yield_loss: number;
  coordinates: Coordinate[];
  annotated_image_url: string;
}

export default function ResultsScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Parse result payload passed from the upload screen
  let results: AnalysisResultsData | null = null;
  try {
    if (data) {
      results = JSON.parse(data);
    }
  } catch (e) {
    console.error('Error parsing results data', e);
  }

  if (!results) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>No analysis results found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const {
    total_gaps,
    estimated_missing_plants,
    estimated_yield_loss,
    coordinates,
    annotated_image_url,
  } = results;

  // Downloads annotated image and saves it to local Android gallery
  const handleSaveImage = async () => {
    try {
      setSaving(true);
      
      // Request media library permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Storage permission is required to save the image to your gallery.');
        setSaving(false);
        return;
      }

      // Download file to local cache
      const filename = annotated_image_url.split('/').pop() || 'annotated_field.jpg';
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      console.log(`Downloading annotated image: ${annotated_image_url} -> ${fileUri}`);
      const downloadResult = await FileSystem.downloadAsync(annotated_image_url, fileUri);

      if (downloadResult.status === 200) {
        // Save asset to gallery
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        // Create custom album
        await MediaLibrary.createAlbumAsync('Agritech Gaps', asset, false);
        Alert.alert('Success', 'Annotated image saved to your photo gallery!');
      } else {
        Alert.alert('Error', 'Failed to download the annotated image from the server.');
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'An error occurred while saving the image: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Downloads annotated image (if needed) and opens native OS Share Sheet
  const handleShareResults = async () => {
    try {
      setSharing(true);
      
      const filename = annotated_image_url.split('/').pop() || 'annotated_field.jpg';
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Check if file exists, download if not
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      let shareUri = fileUri;

      if (!fileInfo.exists) {
        const downloadResult = await FileSystem.downloadAsync(annotated_image_url, fileUri);
        shareUri = downloadResult.uri;
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Unavailable', 'Sharing is not supported on this device.');
        setSharing(false);
        return;
      }

      // Open Native Share Sheet with the file
      await Sharing.shareAsync(shareUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Agritech Gap Detection Results',
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'An error occurred while sharing the results: ' + e.message);
    } finally {
      setSharing(false);
    }
  };

  const handleCopyCoordinates = () => {
    const text = coordinates.map((c, i) => `Gap #${i+1}: Lat ${c.latitude}, Lon ${c.longitude}`).join('\n');
    // Show the coordinates in an Alert for easy manual copying on devices without clipboard access
    Alert.alert(
      'Gap Coordinates',
      text,
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Section 1: Dashboard Metrics */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Total Gaps */}
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{total_gaps}</Text>
            <Text style={styles.metricLabel}>Gaps Detected</Text>
            <View style={styles.metricColorIndicatorRed} />
          </View>

          {/* Card 2: Missing Plants */}
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{estimated_missing_plants}</Text>
            <Text style={styles.metricLabel}>Missing Plants</Text>
            <View style={styles.metricColorIndicatorOrange} />
          </View>

          {/* Card 3: Yield Loss */}
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{estimated_yield_loss}%</Text>
            <Text style={styles.metricLabel}>Yield Loss</Text>
            <View style={styles.metricColorIndicatorAmber} />
          </View>
        </View>

        {/* Section 2: Interactive Annotated Canopy Image */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Annotated Canopy Map</Text>
            <Text style={styles.sectionHeaderHint}>Double-tap or pinch to zoom</Text>
          </View>
          
          <ZoomableImage uri={annotated_image_url} />

          {/* Save/Share Buttons Container */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.saveBtn]} 
              onPress={handleSaveImage}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.btnEmoji}>💾</Text>
                  <Text style={styles.actionBtnText}>Save Image</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.shareBtn]} 
              onPress={handleShareResults}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.btnEmoji}>📤</Text>
                  <Text style={styles.actionBtnText}>Share Results</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: GPS Coordinates List */}
        <View style={[styles.sectionContainer, styles.coordinatesSection]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Detected Gap Coordinates</Text>
            <TouchableOpacity onPress={handleCopyCoordinates}>
              <Text style={styles.copyTextLink}>Copy All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.coordsListContainer}>
            {coordinates.length === 0 ? (
              <Text style={styles.noCoordsText}>No boundary points available.</Text>
            ) : (
              coordinates.map((item, index) => (
                <View key={index} style={styles.coordsRow}>
                  <View style={styles.coordsLabelContainer}>
                    <View style={styles.dotIndicator} />
                    <Text style={styles.coordsLabel}>Gap #{index + 1}</Text>
                  </View>
                  <Text style={styles.coordsValue}>
                    {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* New Analysis Button */}
        <TouchableOpacity style={styles.newAnalysisBtn} onPress={() => router.replace('/gap-detection')}>
          <Text style={styles.newAnalysisBtnText}>Analyze Another Field</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121318',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#121318',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    fontFamily: 'System',
  },
  backBtn: {
    backgroundColor: '#2e303a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'System',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1a1b22',
    borderColor: '#2e303a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: 'System',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8f92a1',
    textAlign: 'center',
    fontFamily: 'System',
  },
  metricColorIndicatorRed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#ef4444',
  },
  metricColorIndicatorOrange: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#f97316',
  },
  metricColorIndicatorAmber: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#f59e0b',
  },
  sectionContainer: {
    backgroundColor: '#1a1b22',
    borderColor: '#2e303a',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2e303a',
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  sectionHeaderHint: {
    fontSize: 11,
    color: '#8f92a1',
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  saveBtn: {
    backgroundColor: '#10b981',
  },
  shareBtn: {
    backgroundColor: '#2e303a',
    borderColor: '#424554',
    borderWidth: 1,
  },
  btnEmoji: {
    fontSize: 16,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'System',
  },
  coordinatesSection: {
    paddingBottom: 8,
  },
  copyTextLink: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'System',
  },
  coordsListContainer: {
    gap: 10,
  },
  noCoordsText: {
    color: '#8f92a1',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 12,
    textAlign: 'center',
    fontFamily: 'System',
  },
  coordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121318',
    borderColor: '#23252f',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  coordsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  coordsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'System',
  },
  coordsValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#8f92a1',
  },
  newAnalysisBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  newAnalysisBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'System',
  },
});
