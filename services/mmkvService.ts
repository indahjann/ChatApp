// services/mmkvService.ts
import { createMMKV } from 'react-native-mmkv';
import { MessageType } from '../types';

// Initialize MMKV storage
const storage = createMMKV();

// Keys for different data types
const KEYS = {
  MESSAGES: 'chat_messages',
  IMAGE_CACHE: 'image_urls_cache',
  LAST_SYNC: 'last_sync_timestamp',
};

class MMKVService {
  // ==================== CHAT MESSAGES ====================
  
  /**
   * Save messages to MMKV cache
   * @param messages Array of messages to cache
   */
  saveMessages(messages: MessageType[]): void {
    try {
      const jsonString = JSON.stringify(messages);
      storage.set(KEYS.MESSAGES, jsonString);
      // Update last sync timestamp
      storage.set(KEYS.LAST_SYNC, Date.now());
      console.log('✅ Messages saved to MMKV:', messages.length);
    } catch (error) {
      console.error('❌ Error saving messages to MMKV:', error);
    }
  }

  /**
   * Load messages from MMKV cache
   * @returns Array of cached messages or empty array
   */
  loadMessages(): MessageType[] {
    try {
      const jsonString = storage.getString(KEYS.MESSAGES);
      if (!jsonString) {
        console.log('ℹ️ No cached messages found in MMKV');
        return [];
      }
      
      const messages: MessageType[] = JSON.parse(jsonString);
      console.log('✅ Messages loaded from MMKV:', messages.length);
      return messages;
    } catch (error) {
      console.error('❌ Error loading messages from MMKV:', error);
      return [];
    }
  }

  /**
   * Clear all cached messages
   */
  clearMessages(): void {
    try {
      storage.remove(KEYS.MESSAGES);
      console.log('✅ Messages cache cleared');
    } catch (error) {
      console.error('❌ Error clearing messages:', error);
    }
  }

  // ==================== IMAGE CACHE ====================

  /**
   * Cache image URL with its local path or Firebase Storage URL
   * @param imageId Unique identifier for the image
   * @param url Firebase Storage URL or local path
   */
  cacheImageUrl(imageId: string, url: string): void {
    try {
      const cacheKey = `${KEYS.IMAGE_CACHE}_${imageId}`;
      storage.set(cacheKey, url);
      console.log(`✅ Image URL cached: ${imageId}`);
    } catch (error) {
      console.error('❌ Error caching image URL:', error);
    }
  }

  /**
   * Get cached image URL
   * @param imageId Unique identifier for the image
   * @returns Cached URL or null
   */
  getCachedImageUrl(imageId: string): string | null {
    try {
      const cacheKey = `${KEYS.IMAGE_CACHE}_${imageId}`;
      return storage.getString(cacheKey) || null;
    } catch (error) {
      console.error('❌ Error getting cached image URL:', error);
      return null;
    }
  }

  /**
   * Clear specific image from cache
   * @param imageId Unique identifier for the image
   */
  clearImageCache(imageId: string): void {
    try {
      const cacheKey = `${KEYS.IMAGE_CACHE}_${imageId}`;
      storage.remove(cacheKey);
      console.log(`✅ Image cache cleared: ${imageId}`);
    } catch (error) {
      console.error('❌ Error clearing image cache:', error);
    }
  }

  // ==================== UTILITY ====================

  /**
   * Get last sync timestamp
   * @returns Timestamp in milliseconds or null
   */
  getLastSyncTimestamp(): number | null {
    try {
      return storage.getNumber(KEYS.LAST_SYNC) || null;
    } catch (error) {
      console.error('❌ Error getting last sync timestamp:', error);
      return null;
    }
  }

  /**
   * Clear all MMKV data (use carefully!)
   */
  clearAll(): void {
    try {
      storage.clearAll();
      console.log('✅ All MMKV data cleared');
    } catch (error) {
      console.error('❌ Error clearing all data:', error);
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): { messageCount: number; lastSync: number | null } {
    const messages = this.loadMessages();
    const lastSync = this.getLastSyncTimestamp();
    
    return {
      messageCount: messages.length,
      lastSync,
    };
  }
}

// Export singleton instance
export const mmkvService = new MMKVService();
