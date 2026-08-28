import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library/legacy';
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

const PAGE_SIZE = 80;

/** 原生端：应用内相册网格（像修图 App 那样在应用里选图） */
export default function PhotoGrid({ onSelect }: PhotoGridProps) {
  const { width } = useWindowDimensions();
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [permission, setPermission] = useState<MediaLibrary.PermissionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const current = await MediaLibrary.getPermissionsAsync();
    if (!current.granted) {
      const requested = await MediaLibrary.requestPermissionsAsync();
      setPermission(requested);
      if (!requested.granted) {
        setLoading(false);
        return;
      }
    }
    const result = await MediaLibrary.getAssetsAsync({
      first: PAGE_SIZE,
      mediaType: 'photo',
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });
    setAssets(result.assets);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const pick = async (asset: MediaLibrary.Asset) => {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(asset);
      onSelect({
        uri: info.localUri ?? info.uri,
        name: asset.filename ?? '相册图片',
        width: asset.width ?? 0,
        height: asset.height ?? 0,
      });
    } catch {
      // 拿不到 localUri 时兜底直接用 uri
      onSelect({
        uri: asset.uri,
        name: asset.filename ?? '相册图片',
        width: asset.width ?? 0,
        height: asset.height ?? 0,
      });
    }
  };

  if (permission && !permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerTitle}>{t('pickerPermissionNeeded')}</Text>
        <Text style={styles.centerBody}>{t('pickerPermissionBody')}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => void load()}>
          <Text style={styles.primaryBtnText}>{t('grant')}</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FFD60A" size="large" />
      </View>
    );
  }

  const columns = 3;
  const gap = 2;
  const cell = (width - gap * (columns - 1)) / columns;

  return (
    <FlatList
      data={assets}
      keyExtractor={(item) => item.id}
      numColumns={columns}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => void pick(item)}
          style={{ width: cell, height: cell, padding: gap }}
        >
          <Image source={{ uri: item.uri }} style={styles.thumb} />
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.empty}>{t('pickerEmpty')}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  centerTitle: { color: '#F5F5F7', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  centerBody: { color: '#8E8E93', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  primaryBtn: { backgroundColor: '#FFD60A', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  primaryBtnText: { color: '#0B0B0F', fontSize: 15, fontWeight: '700' },
  thumb: { flex: 1, borderRadius: 2 },
  empty: { color: '#8E8E93', fontSize: 15 },
});
