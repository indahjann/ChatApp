// App.tsx (Phase 1 Final - Auto-login Enabled)
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ChatScreen from './screens/ChatScreen';
import { RootStackParamList, User } from './types';
import { authService } from './services/authService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initializing, setInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAutoLogin();
  }, []);

  const checkAutoLogin = async () => {
    console.log('=== Starting Auto-Login Check ===');
    try {
      const userData = await authService.autoLogin();

      if (userData) {
        setUser(userData);
        console.log('✅ Auto-login SUCCESS:', userData.username);
      } else {
        console.log('ℹ️ No saved credentials found');
      }
    } catch (error) {
      console.error('❌ Auto-login ERROR:', error);
      setUser(null);
    } finally {
      console.log('=== Auto-Login Check Complete ===');
      // Add minimum loading time for better UX
      setTimeout(() => {
        setInitializing(false);
      }, 500);
    }
  };

  // Show loading screen while checking auto-login
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? 'Chat' : 'Login'}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          initialParams={
            user
              ? {
                  username: user.username,
                  userId: user.uid,
                }
              : undefined
          }
          options={{ title: 'Chat Room' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});