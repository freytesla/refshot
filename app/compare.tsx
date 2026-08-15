import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReferenceImage } from '../src/types';
import { findReference } from '../src/lib/storage';
import { clampDivider } from '../src/lib/geometry';
import { t } from '../src/lib/i18n';
import { Icon } from '../src/components/Icon';

export default function CompareScreen() {
  const { refId, photo } = useLocalSearchParams<{ refId: string; photo: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reference, setReference] = useState<ReferenceImage | null>(null);
  const [divider, setDivider] = useState(0.5);
  const [containerWidth, setContainerWidth] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void findReference(refId ?? '').then(setReference);
  }, [refId]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (event) => {
          if (containerWidth > 0) {
            setDivider(clampDivider(event.nativeEvent.locationX / containerWidth));
          }
        },
      }),
    [containerWidth]
  );

  const onSave = async () => {
    if (!photo || saving) return;
    if (Platform.OS === 'web') {
      Alert.alert(t('saveFailed'));
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
      Alert.alert(t('shareUnavailable'));
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

  const dividerX = divider * containerWidth;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('compareTitle')}>
          <Icon name="chevron-left" size={26} />
        </Pressable>
        <Text style={styles.title}>{t('compareTitle')}</Text>
        <View style={styles.backBtn} />
      </View>

      <View
        style={styles.stage}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        ) : null}

        {reference ? (
          <View style={[styles.clip, { width: dividerX }]}>
            <Image
              source={{ uri: reference.sourceUri }}
              style={{ width: containerWidth, height: '100%' }}
              resizeMode="contain"
            />
          </View>
        ) : null}

        <View style={[styles.divider, { left: dividerX - 1, pointerEvents: 'none' }]}>
          <View style={styles.handle}>
            <Icon name="move-horizontal" size={18} color="#0B0B0F" />
          </View>
        </View>

        <View style={[styles.labels, { pointerEvents: 'none' }]}>
          <Text style={styles.labelLeft}>{t('compareReference')}</Text>
          <Text style={styles.labelRight}>{t('compareResult')}</Text>
        </View>
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
  stage: { flex: 1, margin: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#141416' },
  clip: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  divider: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#FFFFFF' },
  handle: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    left: -18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: { position: 'absolute', top: 10, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  labelLeft: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  labelRight: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionDisabled: { opacity: 0.5 },
  retakeBtn: { backgroundColor: '#3A3A3C' },
  actionText: { color: '#F5F5F7', fontSize: 15, fontWeight: '600' },
});
