import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 seconds timeout for CPU model inference
  headers: {
    'Accept': 'application/json',
  }
});

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface UploadResponse {
  total_gaps: number;
  estimated_missing_plants: number;
  estimated_yield_loss: number;
  coordinates: Coordinate[];
  annotated_image_url: string;
}

/**
 * Uploads plantation image and KML boundary files to FastAPI backend
 */
import { Platform } from 'react-native';

export async function uploadFieldData(
  imageUri: string,
  imageName: string,
  imageType: string,
  kmlUri: string,
  kmlName: string
): Promise<UploadResponse> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // On Web (browser), we must convert the picked file URIs (blob:http...) to actual Blobs
    const imageBlob = await fetch(imageUri).then((r) => r.blob());
    formData.append('image_file', imageBlob, imageName || 'plantation_image.jpg');

    const kmlBlob = await fetch(kmlUri).then((r) => r.blob());
    formData.append('kml_file', kmlBlob, kmlName || 'field_boundary.kml');
  } else {
    // On Mobile (Android/iOS), append the React Native specific file reference shape
    formData.append('image_file', {
      uri: imageUri,
      name: imageName || 'plantation_image.jpg',
      type: imageType || 'image/jpeg',
    } as any);

    formData.append('kml_file', {
      uri: kmlUri,
      name: kmlName || 'field_boundary.kml',
      type: 'application/vnd.google-earth.kml+xml',
    } as any);
  }

  const response = await api.post<UploadResponse>('/api/gap-detection/analyze', formData);

  return response.data;
}

export default api;
