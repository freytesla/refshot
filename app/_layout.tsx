import 'react-native-gesture-handler';
import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AdsProvider, useAds } from '../src/lib/ads';
import { ADS_CONFIG } from '../src/lib/adsConfig';
import { getMembership, isProActive } from '../src/lib/membership';

/** 开屏广告门：非会员且开启时，启动先看一次（可跳过） */
function SplashGate({ children }: { children: React.ReactNode }) {
  const ads = useAds();
  const [ready, setReady] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const membership = await getMembership();
      if (cancelled) return;
      if (!isProActive(membership) && ADS_CONFIG.enableSplash && !shown.current) {
        shown.current = true;
        await ads.showSplash();
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [ads]);

  if (!ready) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AdsProvider>
          <SplashGate>
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
          </SplashGate>
        </AdsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
