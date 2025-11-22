// screens/ChatScreen.tsx (Base64 Version - No Firebase Storage)
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
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Set logout button in header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 10 }}>
          <Text style={{ fontSize: 24 }}>🚪</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Load messages from MMKV cache first
  useEffect(() => {
    console.log('=== Loading Chat History from Cache ===');
    const cachedMessages = mmkvService.loadMessages();
    
    if (cachedMessages.length > 0) {
      setMessages(cachedMessages);
      console.log('✅ Loaded from MMKV cache:', cachedMessages.length, 'messages');
    }
    
    setIsLoadingCache(false);
  }, []);

  // Subscribe to Firestore
  useEffect(() => {
    if (isLoadingCache) return;

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
        mmkvService.saveMessages(list);
        setIsOnline(true);
        console.log('✅ Firestore sync complete:', list.length, 'messages');
      },
      (error) => {
        console.error('❌ Firestore sync error:', error);
        setIsOnline(false);
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

  // ✅ NEW: Base64 Image Picker (No Firebase Storage needed)
  const pickImage = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Tidak dapat upload gambar saat offline');
      return;
    }

    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.5,        // ← Kompress lebih agresif
        maxWidth: 800,       // ← Resize ke 800px
        maxHeight: 800,
        includeBase64: true, // ← PENTING: Minta base64
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
      if (!asset?.base64) {
        Alert.alert('Error', 'Tidak ada gambar yang dipilih');
        return;
      }

      setIsUploadingImage(true);
      console.log('📤 Processing image...');

      // Buat full base64 string
      const imageType = asset.type || 'image/jpeg';
      const fullBase64 = `data:${imageType};base64,${asset.base64}`;

      // ⚠️ CEK UKURAN (Firestore limit ~1MB per document)
      const sizeInBytes = fullBase64.length;
      const sizeInKB = Math.round(sizeInBytes / 1024);
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

      console.log(`📊 Image size: ${sizeInKB}KB (${sizeInMB}MB)`);

      // Firestore document max size = 1MB
      // Tapi sebaiknya jangan sampai 1MB penuh, sisakan untuk field lain
      if (sizeInBytes > 1048487) { // ~1MB - 100KB buffer
        Alert.alert(
          'Gambar Terlalu Besar', 
          `Ukuran: ${sizeInKB}KB\n\nMaksimal ~1000KB.\nSilakan pilih gambar yang lebih kecil atau foto ulang dengan kualitas lebih rendah.`
        );
        setIsUploadingImage(false);
        return;
      }

      // Send message with base64 image
      await addDoc(messagesCollection, {
        text: message.trim() || '📷 Foto',
        user: username,
        userId: userId,
        imageUrl: fullBase64, // ← Simpan base64 langsung
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
        
        {/* Display image (Base64 atau URL) */}
        {item.imageUrl && (
          <TouchableOpacity onPress={() => setSelectedImage(item.imageUrl!)}>
            <Image 
              source={{ uri: item.imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
              onError={(e) => {
                console.error('❌ Image load error:', e.nativeEvent.error);
              }}
              onLoadStart={() => console.log('🔄 Loading image...')}
              onLoadEnd={() => console.log('✅ Image loaded')}
            />
          </TouchableOpacity>
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

      {/* Loading indicator */}
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
            {/* Image picker button */}
            <TouchableOpacity 
              onPress={pickImage}
              style={styles.imageButton}
              disabled={!isOnline || isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={{ fontSize: 24 }}>📷</Text>
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

      {/* Full Screen Image Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
          >
            <Icon name="x" size={30} color="white" />
          </TouchableOpacity>
          
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
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
    marginLeft: 10,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
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
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  imageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});