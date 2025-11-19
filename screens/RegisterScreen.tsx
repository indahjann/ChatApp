// screens/RegisterScreen.tsx (Phase 1 Final)
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

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    // Validation
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username harus minimal 3 karakter');
      return;
    }

    if (/\s/.test(username)) {
      Alert.alert('Error', 'Username tidak boleh mengandung spasi');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password harus minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting registration...');
      const userData = await authService.registerUser(
        username.trim(),
        email.trim(),
        password
      );

      console.log('Registration successful!');

      // Langsung navigate ke Chat
      navigation.replace('Chat', {
        username: userData.username,
        userId: userData.uid,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrasi</Text>
      <Text style={styles.subtitle}>Buat akun baru</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
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

      <TextInput
        style={styles.input}
        placeholder="Konfirmasi Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <Button title="Daftar" onPress={handleRegister} />
      )}

      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => navigation.navigate('Login')}
        disabled={loading}
      >
        <Text style={styles.linkText}>
          Sudah punya akun? <Text style={styles.linkBold}>Login</Text>
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