import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../src/lib/i18n';
import { Icon } from '../src/components/Icon';
import PhotoGrid, { PickedAsset } from '../src/components/PhotoGrid';
import { MockBanner } from '../src/lib/ads';
import { ADS_CONFIG } from '../src/lib/adsConfig';
import { getMembership, isProActive } from '../src/lib/membership';
import { setCurrentReferenceId } from '../src/lib/storage';
import { createReferenceFromUri } from '../src/lib/import';

/** 应用内选照片（像修图 App 一样），底部放 banner */
export default function PickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isPro, setIsPro] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getMembership().then((m) => {
      if (!cancelled) setIsPro(isProActive(m));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = async (asset: PickedAsset) => {
    if (busy) return;
    setBusy(true);
    try {
      const ref = await createReferenceFromUri(asset.uri, asset.name, asset.width, asset.height);
      await setCurrentReferenceId(ref.id);
      router.back();
    } catch (error) {
      Alert.alert(t('importFailed'), String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('pickerTitle')}>
          <Icon name="chevron-left" size={26} />
        </Pressable>
        <Text style={styles.title}>{t('pickerTitle')}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.body}>
        <PhotoGrid onSelect={(asset) => void onSelect(asset)} />
      </View>

      {/* 选照片界面底部 banner（非会员） */}
      {ADS_CONFIG.enableBannerOnPicker && !isPro ? (
        <View style={[styles.bannerWrap, { paddingBottom: insets.bottom + 8 }]}>
          <MockBanner />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0B0F' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#F5F5F7', fontSize: 17, fontWeight: '600' },
  body: { flex: 1 },
  bannerWrap: { paddingHorizontal: 12, paddingTop: 8 },
});
