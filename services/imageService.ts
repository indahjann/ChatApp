// services/imageService.ts
import { storage, ref, getDownloadURL, deleteObject } from '../firebase';
import { mmkvService } from './mmkvService';
import ReactNativeBlobUtil from 'react-native-blob-util';

class ImageService {
  /**
   * Upload image to Firebase Storage
   * Production-ready method using react-native-blob-util
   * @param uri Local image URI from image picker
   * @param userId User ID for organizing uploads
   * @returns Download URL of uploaded image
   */
  async uploadImage(uri: string, userId: string): Promise<string> {
    try {
      console.log('📤 Starting image upload:', uri);

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${userId}_${timestamp}.jpg`;
      const storagePath = `chat-images/${filename}`;

      // Get Firebase Storage bucket
      const bucket = storage.app.options.storageBucket;
      if (!bucket) {
        throw new Error('Storage bucket not configured');
      }

      // Clean URI (remove file:// prefix if exists)
      const cleanUri = uri.replace('file://', '');

      console.log('📦 Uploading to Firebase Storage...');

      // Firebase Storage REST API endpoint
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(storagePath)}`;

      // Upload using react-native-blob-util
      const response = await ReactNativeBlobUtil.fetch(
        'POST',
        uploadUrl,
        {
          'Content-Type': 'image/jpeg',
        },
        ReactNativeBlobUtil.wrap(cleanUri)
      );

      // Check response status
      const status = response.info().status;
      if (status !== 200) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', status, errorText);
        throw new Error(`Upload failed with status ${status}`);
      }

      console.log('✅ Upload complete!');

      // Get download URL from Firebase
      const storageRef = ref(storage, storagePath);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('🔗 Download URL:', downloadURL);

      // Cache the URL in MMKV for offline access
      mmkvService.cacheImageUrl(filename, downloadURL);
      console.log('💾 Cached to MMKV:', filename);

      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      
      // User-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          throw new Error('Koneksi internet bermasalah. Silakan coba lagi.');
        }
        throw new Error('Gagal upload gambar. Silakan coba lagi.');
      }
      
      throw new Error('Gagal upload gambar');
    }
  }

  /**
   * Upload image with progress tracking
   * Great for showing upload progress to users
   * @param uri Local image URI
   * @param userId User ID
   * @param onProgress Progress callback (0-100)
   * @returns Download URL
   */
  async uploadImageWithProgress(
    uri: string, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      console.log('📤 Starting upload with progress tracking:', uri);

      const timestamp = Date.now();
      const filename = `${userId}_${timestamp}.jpg`;
      const storagePath = `chat-images/${filename}`;
      const bucket = storage.app.options.storageBucket;
      const cleanUri = uri.replace('file://', '');

      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(storagePath)}`;

      // Upload with progress callback
      const response = await ReactNativeBlobUtil.fetch(
        'POST',
        uploadUrl,
        {
          'Content-Type': 'image/jpeg',
        },
        ReactNativeBlobUtil.wrap(cleanUri)
      ).uploadProgress({ interval: 250 }, (written, total) => {
        const progress = Math.round((written / total) * 100);
        console.log(`📊 Upload progress: ${progress}%`);
        onProgress?.(progress);
      });

      if (response.info().status !== 200) {
        throw new Error(`Upload failed: ${response.info().status}`);
      }

      // Get download URL
      const storageRef = ref(storage, storagePath);
      const downloadURL = await getDownloadURL(storageRef);

      mmkvService.cacheImageUrl(filename, downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error in upload with progress:', error);
      throw error;
    }
  }

  /**
   * Upload with authentication token (if Storage Rules require auth)
   * @param uri Local image URI
   * @param userId User ID
   * @returns Download URL
   */
  async uploadImageWithAuth(uri: string, userId: string): Promise<string> {
    try {
      console.log('📤 Starting authenticated upload:', uri);

      const timestamp = Date.now();
      const filename = `${userId}_${timestamp}.jpg`;
      const storagePath = `chat-images/${filename}`;

      // Get Firebase auth token
      const { auth } = await import('../firebase');
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const bucket = storage.app.options.storageBucket;
      const cleanUri = uri.replace('file://', '');

      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(storagePath)}`;

      // Upload with Authorization header
      const response = await ReactNativeBlobUtil.fetch(
        'POST',
        uploadUrl,
        {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'image/jpeg',
        },
        ReactNativeBlobUtil.wrap(cleanUri)
      );

      if (response.info().status !== 200) {
        throw new Error(`Upload failed: ${response.info().status}`);
      }

      // Get download URL
      const storageRef = ref(storage, storagePath);
      const downloadURL = await getDownloadURL(storageRef);

      mmkvService.cacheImageUrl(filename, downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error in authenticated upload:', error);
      throw error;
    }
  }

  /**
   * Delete image from Firebase Storage
   * @param imageUrl Download URL of the image to delete
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      console.log('🗑️ Image deleted from Storage');
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Get cached image URL or use fallback
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
    
    mmkvService.cacheImageUrl(imageId, fallbackUrl);
    return fallbackUrl;
  }

  /**
   * Download image to local storage for offline viewing
   * @param imageUrl Remote image URL
   * @param imageId Unique identifier
   * @returns Local file path
   */
  async downloadImageForOffline(imageUrl: string, imageId: string): Promise<string> {
    try {
      const localPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${imageId}.jpg`;

      console.log('⬇️ Downloading image for offline:', imageUrl);

      await ReactNativeBlobUtil.config({
        path: localPath,
        fileCache: true,
      }).fetch('GET', imageUrl);

      console.log('✅ Image downloaded to:', localPath);

      // Cache the local path
      mmkvService.cacheImageUrl(imageId, localPath);

      return localPath;
    } catch (error) {
      console.error('❌ Error downloading image:', error);
      throw error;
    }
  }
}

export const imageService = new ImageService();