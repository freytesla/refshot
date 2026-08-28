import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../lib/i18n';
export interface PickedAsset {
  uri: string;
  name: string;
  width: number;
  height: number;
}

export interface PhotoGridProps {
  onSelect: (asset: PickedAsset) => void;
}

/** Web 端：浏览器不能枚举相册，回退到系统文件选择 */
export default function PhotoGrid({ onSelect }: PhotoGridProps) {
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        // web 上多数直接放行；若拒绝则仍尝试打开选择器
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        onSelect({
          uri: asset.uri,
          name: asset.fileName ?? '相册图片',
          width: asset.width ?? 0,
          height: asset.height ?? 0,
        });
      }
    } catch {
      // 用户取消或出错，忽略
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.center}>
      <Pressable style={styles.btn} onPress={() => void pick()} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#0B0B0F" size="small" />
        ) : (
          <Text style={styles.btnText}>{t('pickerWebPick')}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  btn: {
    backgroundColor: '#FFD60A',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 180,
    alignItems: 'center',
  },
  btnText: { color: '#0B0B0F', fontSize: 15, fontWeight: '700' },
});
