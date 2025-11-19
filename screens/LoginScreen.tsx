// screens/LoginScreen.tsx (Phase 1 Final)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { authService } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    // Validation
    if (!usernameOrEmail.trim() || !password) {
      Alert.alert('Error', 'Username/Email dan password harus diisi');
      return;
    }

    setLoading(true);

    try {
      const userData = await authService.loginUser(usernameOrEmail.trim(), password);

      // Navigate to Chat
      navigation.replace('Chat', {
        username: userData.username,
        userId: userData.uid,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>Masuk ke ChatApp</Text>

      <TextInput
        style={styles.input}
        placeholder="Username atau Email"
        value={usernameOrEmail}
        onChangeText={setUsernameOrEmail}
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <Button title="Masuk" onPress={handleLogin} />
      )}

      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => navigation.navigate('Register')}
        disabled={loading}
      >
        <Text style={styles.linkText}>
          Belum punya akun? <Text style={styles.linkBold}>Daftar</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loader: {
    marginVertical: 20,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkBold: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});