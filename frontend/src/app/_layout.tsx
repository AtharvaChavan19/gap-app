import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, StyleSheet } from 'react-native';

// Initialize React Query Client for API cache and mutations management
const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#121318',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 20,
              fontFamily: 'System', // Fallback to standard premium font in RN
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: '#121318',
            },
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="gap-detection" 
            options={{ 
              title: 'Gap Detection',
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#191a1f',
              },
            }} 
          />
          <Stack.Screen
            name="results"
            options={{
              title: 'Analysis Results',
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#191a1f',
              },
            }}
          />
        </Stack>
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121318',
  },
});
