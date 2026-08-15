import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearReferences, getHoldBehavior, setHoldBehavior, HoldBehavior } from '../src/lib/storage';
import { t } from '../src/lib/i18n';
import { Icon } from '../src/components/Icon';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [holdBehavior, setHoldBehaviorState] = useState<HoldBehavior>('hide');

  useEffect(() => {
    let cancelled = false;
    void getHoldBehavior().then((value) => {
      if (!cancelled) setHoldBehaviorState(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onChangeHold = (value: HoldBehavior) => {
    setHoldBehaviorState(value);
    void setHoldBehavior(value);
  };

  const onClear = () => {
    Alert.alert(t('settingsClearConfirm'), t('settingsClearConfirmBody'), [
      { text: t('commonCancel'), style: 'cancel' },
      {
        text: t('commonDelete'),
        style: 'destructive',
        onPress: async () => {
          await clearReferences();
          Alert.alert(t('settingsCleared'));
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('settingsTitle')}>
          <Icon name="chevron-left" size={26} />
        </Pressable>
        <Text style={styles.title}>{t('settingsTitle')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>{t('settingsOverlayTitle')}</Text>
        <View style={styles.card}>
          <Text style={styles.rowLabel}>{t('holdSection')}</Text>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segmentItem, holdBehavior === 'hide' && styles.segmentActive]}
              onPress={() => onChangeHold('hide')}
            >
              <Text style={[styles.segmentText, holdBehavior === 'hide' && styles.segmentTextActive]}>
                {t('holdHide')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentItem, holdBehavior === 'show' && styles.segmentActive]}
              onPress={() => onChangeHold('show')}
            >
              <Text style={[styles.segmentText, holdBehavior === 'show' && styles.segmentTextActive]}>
                {t('holdShow')}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.rowDesc}>
            {holdBehavior === 'hide' ? t('holdHideDesc') : t('holdShowDesc')}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>{t('settingsPrivacyTitle')}</Text>
        <View style={styles.card}>
          <Text style={styles.cardBody}>{t('settingsPrivacyBody')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('settingsAboutTitle')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('appName')}</Text>
            <Text style={styles.rowValue}>{t('appName')}</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settingsVersion')}</Text>
            <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settingsPlatform')}</Text>
            <Text style={styles.rowValue}>iOS 16+</Text>
          </View>
        </View>

        <Pressable style={[styles.dangerBtn, { marginBottom: insets.bottom + 16 }]} onPress={onClear}>
          <Icon name="trash-2" size={16} color="#FF453A" />
          <Text style={styles.dangerText}>{t('settingsClear')}</Text>
        </Pressable>
      </ScrollView>
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
  content: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: { color: '#8E8E93', fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14 },
  cardBody: { color: '#E5E5EA', fontSize: 14, lineHeight: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowLabel: { color: '#E5E5EA', fontSize: 15 },
  rowValue: { color: '#8E8E93', fontSize: 15 },
  rowDesc: { color: '#8E8E93', fontSize: 13, lineHeight: 20, marginTop: 10 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#2C2C2E' },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 3,
    marginTop: 12,
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  segmentActive: { backgroundColor: '#4ADE80' },
  segmentText: { color: '#AEAEB2', fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: '#0B0B0F' },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2A1114',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 28,
  },
  dangerText: { color: '#FF453A', fontSize: 15, fontWeight: '600' },
});
