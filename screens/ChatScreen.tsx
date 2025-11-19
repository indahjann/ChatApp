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
import { CommonActions } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { username, userId } = route.params;

  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

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
            <TextInput
              style={styles.input}
              placeholder="Ketik pesan..."
              value={message}
              onChangeText={setMessage}
              editable={isOnline} // Disable input when offline
            />
            <Button 
              title="Kirim" 
              onPress={sendMessage}
              disabled={!isOnline} // Disable button when offline
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
});