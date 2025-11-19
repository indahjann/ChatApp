// screens/ChatScreen.tsx (Updated)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from '../firebase';
import { messagesCollection } from '../firebase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MessageType } from '../types';
import { authService } from '../services/authService';
import { mmkvService } from '../services/mmkvService';
import { imageService } from '../services/imageService';
import { CommonActions } from '@react-navigation/native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { username, userId } = route.params;

  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Set logout button in header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 10 }}>
          <Text style={{ color: '#007AFF', fontSize: 16 }}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Phase 2: Load messages from MMKV cache first (instant UI)
  useEffect(() => {
    console.log('=== Loading Chat History from Cache ===');
    const cachedMessages = mmkvService.loadMessages();
    
    if (cachedMessages.length > 0) {
      setMessages(cachedMessages);
      console.log('✅ Loaded from MMKV cache:', cachedMessages.length, 'messages');
    }
    
    setIsLoadingCache(false);
  }, []);

  // Phase 2: Subscribe to Firestore (background sync)
  useEffect(() => {
    if (isLoadingCache) return; // Wait for cache to load first

    console.log('=== Starting Firestore Sync ===');
    const q = query(messagesCollection, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: MessageType[] = [];

        snapshot.forEach((doc) => {
          list.push({
            id: doc.id,
            ...(doc.data() as Omit<MessageType, 'id'>),
          });
        });

        setMessages(list);
        // Save to MMKV cache for offline use
        mmkvService.saveMessages(list);
        setIsOnline(true);
        console.log('✅ Firestore sync complete:', list.length, 'messages');
      },
      (error) => {
        console.error('❌ Firestore sync error:', error);
        setIsOnline(false);
        // Keep using cached messages when offline
      }
    );

    return () => unsub();
  }, [isLoadingCache]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Apakah Anda yakin ingin keluar?', [
      {
        text: 'Batal',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.logoutUser();
            // Reset navigation to Login screen
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
          } catch (error: any) {
            Alert.alert('Error', 'Logout gagal');
          }
        },
      },
    ]);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      await addDoc(messagesCollection, {
        text: message,
        user: username,
        userId: userId,
        createdAt: serverTimestamp(),
      });

      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengirim pesan');
    }
  };

  // Phase 3: Image picker and upload
  const pickImage = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Tidak dapat upload gambar saat offline');
      return;
    }

    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (result.didCancel) {
        console.log('📷 User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Gagal memilih gambar');
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Error', 'Tidak ada gambar yang dipilih');
        return;
      }

      setIsUploadingImage(true);
      console.log('📤 Uploading image...');

      // Upload to Firebase Storage
      const imageUrl = await imageService.uploadImage(asset.uri, userId);

      // Send message with image
      await addDoc(messagesCollection, {
        text: message.trim() || '📷 Foto',
        user: username,
        userId: userId,
        imageUrl: imageUrl,
        createdAt: serverTimestamp(),
      });

      setMessage('');
      Alert.alert('Sukses', 'Gambar berhasil dikirim!');
    } catch (error) {
      console.error('❌ Error picking/uploading image:', error);
      Alert.alert('Error', 'Gagal upload gambar');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const renderItem = ({ item }: { item: MessageType }) => {
    const isMyMessage = item.userId === userId;

    return (
      <View
        style={[
          styles.msgBox,
          isMyMessage ? styles.myMsg : styles.otherMsg,
        ]}
      >
        <Text style={styles.sender}>{item.user}</Text>
        
        {/* Phase 3: Display image if exists */}
        {item.imageUrl && (
          <Image 
            source={{ uri: item.imageUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Offline Indicator */}
      {!isOnline && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>
            📵 Offline - Showing cached messages
          </Text>
        </View>
      )}

      {/* Loading indicator while fetching cache */}
      {isLoadingCache ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading chat history...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 10 }}
          />

          <View style={styles.inputRow}>
            {/* Phase 3: Image picker button */}
            <TouchableOpacity 
              onPress={pickImage}
              style={styles.imageButton}
              disabled={!isOnline || isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.imageButtonText}>📷</Text>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Ketik pesan..."
              value={message}
              onChangeText={setMessage}
              editable={isOnline && !isUploadingImage}
            />
            <Button 
              title="Kirim" 
              onPress={sendMessage}
              disabled={!isOnline || isUploadingImage}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  msgBox: {
    padding: 10,
    marginVertical: 6,
    borderRadius: 6,
    maxWidth: '80%',
  },
  myMsg: {
    backgroundColor: '#d1f0ff',
    alignSelf: 'flex-end',
  },
  otherMsg: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  sender: {
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 12,
    color: '#555',
  },
  messageText: {
    fontSize: 15,
    color: '#000',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  // Phase 2: New styles for offline/loading states
  offlineBar: {
    backgroundColor: '#ff9800',
    padding: 10,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // Phase 3: Image styles
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
  },
  imageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
  },
  imageButtonText: {
    fontSize: 24,
  },
});