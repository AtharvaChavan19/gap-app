import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation } from '@tanstack/react-query';
import { uploadFieldData, UploadResponse } from '../services/api';

interface FileInfo {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
}

export default function GapDetectionScreen() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<FileInfo | null>(null);
  const [kmlFile, setKmlFile] = useState<FileInfo | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // React Query Mutation to handle multipart API upload
  const uploadMutation = useMutation({
    mutationFn: (): Promise<UploadResponse> => {
      if (!imageFile || !kmlFile) {
        throw new Error('Please select both a plantation image and a KML boundary file.');
      }
      return uploadFieldData(
        imageFile.uri,
        imageFile.name,
        imageFile.mimeType || 'image/jpeg',
        kmlFile.uri,
        kmlFile.name
      );
    },
    onSuccess: (data: UploadResponse) => {
      setErrorText(null);
      // Navigate to results screen, passing the full JSON payload as a param
      router.push({
        pathname: '/results',
        params: { data: JSON.stringify(data) }
      });
    },
    onError: (error: any) => {
      console.error('[UploadError]', error);
      
      let message = 'Connection failed. Please ensure the backend is running and your device is on the same local network.';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail)) {
          // Format Pydantic validation list errors (e.g. type, loc, msg, input, ctx)
          message = detail.map((err: any) => {
            const field = err.loc ? err.loc.join('.') : 'unknown';
            return `${field}: ${err.msg}`;
          }).join('\n');
        } else {
          message = JSON.stringify(detail);
        }
      } else if (error.message) {
        message = error.message;
      }
      
      setErrorText(message);
    }
  });

  // Pick plantation image from gallery
  const handlePickImageGallery = async () => {
    try {
      setErrorText(null);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setErrorText('Media Library access permission is required to select files.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageFile({
          uri: asset.uri,
          name: asset.fileName || 'plantation_image.jpg',
          size: asset.fileSize || 0,
          mimeType: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (e: any) {
      setErrorText('Error picking image: ' + e.message);
    }
  };

  // Pick plantation image from phone file system storage
  const handlePickImageStorage = async () => {
    try {
      setErrorText(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (e: any) {
      setErrorText('Error selecting image document: ' + e.message);
    }
  };

  // Pick KML file from Android system file picker
  const handlePickKml = async () => {
    try {
      setErrorText(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const extension = asset.name.split('.').pop()?.toLowerCase();

        if (extension !== 'kml') {
          setErrorText('Invalid file format. Please select a boundary file ending in .kml.');
          return;
        }

        setKmlFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: 'application/vnd.google-earth.kml+xml',
        });
      }
    } catch (e: any) {
      setErrorText('Error selecting KML file: ' + e.message);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setKmlFile(null);
    setErrorText(null);
    uploadMutation.reset();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isFormValid = imageFile && kmlFile;
  const isPending = uploadMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.introContainer}>
          <Text style={styles.subtitle}>
            Select plantation imagery and its KML boundary map file to upload to the gap detection pipeline.
          </Text>
        </View>

        {/* Input 1: Plantation Image Selector Card */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Plantation Image (JPG, JPEG, PNG)</Text>
          {imageFile ? (
            <View style={styles.fileSelectedCard}>
              <View style={styles.fileSelectedInfo}>
                <Image source={{ uri: imageFile.uri }} style={styles.imageThumbnail} />
                <View style={styles.fileTextContainer}>
                  <Text style={styles.fileName} numberOfLines={1}>{imageFile.name}</Text>
                  <Text style={styles.fileSize}>{formatBytes(imageFile.size)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setImageFile(null)}
                disabled={isPending}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerDashedCard}>
              <Text style={styles.pickerIcon}>🖼️</Text>
              <Text style={styles.pickerPrompt}>No plantation image selected</Text>
              <View style={styles.pickerButtonsRow}>
                <TouchableOpacity
                  style={styles.pickerInlineButton}
                  onPress={handlePickImageGallery}
                  disabled={isPending}
                >
                  <Text style={styles.pickerInlineButtonText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerInlineButton}
                  onPress={handlePickImageStorage}
                  disabled={isPending}
                >
                  <Text style={styles.pickerInlineButtonText}>Files</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Input 2: KML Boundary File Selector Card */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Field Boundary (KML)</Text>
          {kmlFile ? (
            <View style={styles.fileSelectedCard}>
              <View style={styles.fileSelectedInfo}>
                <View style={styles.kmlDocIconContainer}>
                  <Text style={styles.kmlDocIcon}>🗺️</Text>
                </View>
                <View style={styles.fileTextContainer}>
                  <Text style={styles.fileName} numberOfLines={1}>{kmlFile.name}</Text>
                  <Text style={styles.fileSize}>{formatBytes(kmlFile.size)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setKmlFile(null)}
                disabled={isPending}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerDashedCard}>
              <Text style={styles.pickerIcon}>🗺️</Text>
              <Text style={styles.pickerPrompt}>No KML boundary file selected</Text>
              <TouchableOpacity
                style={styles.pickerFullButton}
                onPress={handlePickKml}
                disabled={isPending}
              >
                <Text style={styles.pickerFullButtonText}>Select KML File</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Error Banner */}
        {errorText && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorHeader}>⚠️ ERROR</Text>
            <Text style={styles.errorBody}>{errorText}</Text>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!isFormValid || isPending) && styles.analyzeButtonDisabled
            ]}
            onPress={() => uploadMutation.mutate()}
            disabled={!isFormValid || isPending}
          >
            {isPending ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#ffffff" size="small" style={styles.spinner} />
                <Text style={styles.analyzeButtonText}>Analyzing Field...</Text>
              </View>
            ) : (
              <Text style={styles.analyzeButtonText}>Upload & Analyze Field</Text>
            )}
          </TouchableOpacity>

          {/* Reset link when files are selected */}
          {(imageFile || kmlFile) && !isPending && (
            <TouchableOpacity style={styles.resetLink} onPress={handleReset}>
              <Text style={styles.resetLinkText}>Clear All Files</Text>
            </TouchableOpacity>
          )}
        </View>
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
    padding: 24,
    paddingBottom: 40,
  },
  introContainer: {
    marginBottom: 28,
  },
  subtitle: {
    fontSize: 14,
    color: '#8f92a1',
    lineHeight: 22,
    fontFamily: 'System',
  },
  inputGroup: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  pickerDashedCard: {
    backgroundColor: '#1a1b22',
    borderWidth: 1.5,
    borderColor: '#2e303a',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  pickerPrompt: {
    fontSize: 14,
    color: '#8f92a1',
    marginBottom: 20,
    fontWeight: '500',
    fontFamily: 'System',
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  pickerInlineButton: {
    flex: 1,
    maxWidth: 120,
    backgroundColor: '#2e303a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerInlineButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  pickerFullButton: {
    backgroundColor: '#2e303a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  pickerFullButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  fileSelectedCard: {
    backgroundColor: '#1a1b22',
    borderWidth: 1,
    borderColor: '#2e303a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileSelectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  imageThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2e303a',
  },
  kmlDocIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kmlDocIcon: {
    fontSize: 20,
  },
  fileTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'System',
  },
  fileSize: {
    fontSize: 12,
    color: '#8f92a1',
    marginTop: 4,
    fontFamily: 'System',
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorHeader: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'System',
  },
  errorBody: {
    color: '#f87171',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'System',
  },
  actionContainer: {
    marginTop: 12,
  },
  analyzeButton: {
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
  },
  analyzeButtonDisabled: {
    backgroundColor: '#1e2029',
    shadowOpacity: 0,
    elevation: 0,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  resetLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  resetLinkText: {
    color: '#8f92a1',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
