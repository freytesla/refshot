import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0B0B0F' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="camera" options={{ gestureEnabled: false }} />
          <Stack.Screen name="compare" options={{ gestureEnabled: false }} />
          <Stack.Screen name="settings" />
        </Stack>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
