import { useEffect, useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReferenceImage } from '../src/types';
import { findReference } from '../src/lib/storage';
import { t } from '../src/lib/i18n';
import { Icon } from '../src/components/Icon';
import { webDownloadImage, webShareImage } from '../src/lib/web';

export default function CompareScreen() {
  const { refId, photo } = useLocalSearchParams<{ refId: string; photo: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reference, setReference] = useState<ReferenceImage | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void findReference(refId ?? '').then(setReference);
  }, [refId]);

  const onSave = async () => {
    if (!photo || saving) return;
    if (Platform.OS === 'web') {
      webDownloadImage(photo, 'refshot-photo.jpg');
      Alert.alert(t('saved'), t('webSaveHint'));
      return;
    }
    setSaving(true);
    try {
      const MediaLibrary = await import('expo-media-library');
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert(t('saveNoPermission'));
        return;
      }
      await MediaLibrary.saveToLibraryAsync(photo);
      Alert.alert(t('saved'));
    } catch (error) {
      Alert.alert(t('saveFailed'), String(error));
    } finally {
      setSaving(false);
    }
  };

  const onShare = async () => {
    if (!photo) return;
    if (Platform.OS === 'web') {
      await webShareImage(photo, 'refshot-photo.jpg');
      return;
    }
    try {
      const Sharing = await import('expo-sharing');
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('shareUnavailable'));
        return;
      }
      await Sharing.shareAsync(photo, { mimeType: 'image/jpeg', dialogTitle: t('compareTitle') });
    } catch (error) {
      Alert.alert(t('commonError'), String(error));
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('compareTitle')}>
          <Icon name="chevron-left" size={26} />
        </Pressable>
        <Text style={styles.title}>{t('compareTitle')}</Text>
        <View style={styles.backBtn} />
      </View>

      {/* 照片大图 + 参考图小图 */}
      <View style={styles.stage}>
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        ) : null}
        {reference ? (
          <View style={styles.refBadge} pointerEvents="none">
            <Image source={{ uri: reference.sourceUri }} style={styles.refThumb} resizeMode="cover" />
            <View style={styles.refLabelWrap}>
              <Text style={styles.refLabel}>{t('compareReference')}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={[styles.actionBtn, saving && styles.actionDisabled]} onPress={() => void onSave()}>
          <Text style={styles.actionText}>{t('save')}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => void onShare()}>
          <Text style={styles.actionText}>{t('share')}</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.retakeBtn]} onPress={() => router.back()}>
          <Text style={styles.actionText}>{t('retake')}</Text>
        </Pressable>
      </View>
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
  stage: {
    flex: 1,
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#141416',
  },
  refBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 116,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  refThumb: { width: 112, height: 112 },
  refLabelWrap: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  refLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 8 },
  actionBtn: { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  actionDisabled: { opacity: 0.5 },
  retakeBtn: { backgroundColor: '#3A3A3C' },
  actionText: { color: '#F5F5F7', fontSize: 15, fontWeight: '600' },
});
