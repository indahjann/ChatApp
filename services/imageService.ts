// services/imageService.ts
import { storage, ref, uploadString, getDownloadURL, deleteObject } from '../firebase';
import { mmkvService } from './mmkvService';

class ImageService {
  /**
   * Upload image to Firebase Storage
   * @param uri Local image URI from image picker
   * @param userId User ID for organizing uploads
   * @returns Download URL of uploaded image
   */
  async uploadImage(uri: string, userId: string): Promise<string> {
    try {
      console.log('📤 Starting image upload:', uri);

      // Create unique filename
      const timestamp = Date.now();
      const filename = `${userId}_${timestamp}.jpg`;
      const storageRef = ref(storage, `chat-images/${filename}`);

      // Convert image to base64
      // For React Native, we need to read file as base64
      const base64 = await this.uriToBase64(uri);
      
      console.log('📦 Uploading base64 image...');

      // Upload as base64 string
      const snapshot = await uploadString(storageRef, base64, 'data_url');
      console.log('✅ Upload complete:', snapshot.metadata.fullPath);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log('🔗 Download URL:', downloadURL);

      // Cache the URL in MMKV
      const imageId = filename;
      mmkvService.cacheImageUrl(imageId, downloadURL);
      console.log('💾 Cached to MMKV:', imageId);

      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Convert URI to base64 data URL
   * @param uri Image URI
   * @returns Base64 data URL
   */
  private async uriToBase64(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Error converting to base64:', error);
      throw error;
    }
  }

  /**
   * Delete image from Firebase Storage
   * @param imageUrl Download URL of the image to delete
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract path from URL
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      console.log('🗑️ Image deleted from Storage');
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Get cached image URL or fetch from network
   * @param imageId Image identifier
   * @param fallbackUrl Fallback URL if cache miss
   * @returns Image URL
   */
  getImageUrl(imageId: string, fallbackUrl: string): string {
    const cached = mmkvService.getCachedImageUrl(imageId);
    if (cached) {
      console.log('💾 Using cached image URL:', imageId);
      return cached;
    }
    
    // Cache for next time
    mmkvService.cacheImageUrl(imageId, fallbackUrl);
    return fallbackUrl;
  }

  /**
   * Compress image before upload (optional enhancement)
   * For now, we upload as-is. Can add compression later.
   */
  // async compressImage(uri: string): Promise<string> {
  //   // TODO: Add image compression using react-native-image-resizer
  //   return uri;
  // }
}

export const imageService = new ImageService();
