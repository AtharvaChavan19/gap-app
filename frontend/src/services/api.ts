import axios from 'axios';

// Get API base URL from environment config (defaulting to local host if not set)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.2:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
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
export async function uploadFieldData(
  imageUri: string,
  imageName: string,
  imageType: string,
  kmlUri: string,
  kmlName: string
): Promise<UploadResponse> {
  const formData = new FormData();

  // On React Native, we need to append the file objects containing uri, name, and type
  // Use type casting to any so TypeScript doesn't throw a type error on React Native file shapes
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

  const response = await api.post<UploadResponse>('/api/gap-detection/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export default api;
