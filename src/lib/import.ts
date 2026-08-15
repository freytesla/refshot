import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { ReferenceImage, OutlineType } from '../types';
import { generateOutline } from '../../modules/subject-outline';
import { saveReference } from './storage';

const REF_DIR = `${FileSystem.documentDirectory ?? ''}references/`;

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function extFromUri(uri: string): string {
  const match = uri.match(/\.(\w+)(\?|$)/);
  const ext = match ? match[1].toLowerCase() : '';
  return ext === 'png' ? 'png' : 'jpg';
}

export async function ensureRefDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(REF_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(REF_DIR, { intermediates: true });
  }
}

/**
 * 把导入的图片复制到 App Documents。
 * Web 端没有文件系统（expo-file-system 为空壳），直接沿用原始 URI（blob/data），不做复制。
 */
export async function copyToRefDir(sourceUri: string, id: string): Promise<string> {
  if (Platform.OS === 'web') {
    return sourceUri;
  }
  await ensureRefDir();
  const dest = `${REF_DIR}${id}.${extFromUri(sourceUri)}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

/**
 * 从相册导入参考图并保存记录。
 * - 原生：复制文件到 Documents，后台生成剪影（失败自动降级）。
 * - Web：直接使用原始 URI，不生成剪影（无原生模块），状态标记为 failed。
 */
export async function createReferenceFromUri(
  uri: string,
  name: string,
  width: number,
  height: number
): Promise<ReferenceImage> {
  const id = makeId();
  const sourceUri = await copyToRefDir(uri, id);
  const reference: ReferenceImage = {
    id,
    name,
    sourceUri,
    stencilUri: null,
    outlineType: null,
    outlineStatus: Platform.OS === 'web' ? 'failed' : 'pending',
    width,
    height,
    createdAt: Date.now(),
    isFavorite: false,
  };
  await saveReference(reference);
  if (Platform.OS !== 'web') {
    // 后台生成剪影，不阻塞主流程；失败自动降级（stencilUri 保持 null）
    void generateOutlineAsync(reference);
  }
  return reference;
}

/**
 * 生成剪影并更新记录。失败时返回 updated 记录（outlineStatus='failed'）。
 */
export async function generateOutlineAsync(reference: ReferenceImage): Promise<ReferenceImage> {
  try {
    const outputUri = `${REF_DIR}${reference.id}-outline.png`;
    const result = await generateOutline({
      sourceUri: reference.sourceUri,
      outputUri,
      lineColor: '#FFFFFF',
      lineWidth: 3,
    });
    const updated: ReferenceImage = {
      ...reference,
      stencilUri: result.outputUri,
      outlineType: result.outputUri ? (result.type as OutlineType) : reference.outlineType,
      outlineStatus: result.outputUri ? 'done' : 'failed',
    };
    await saveReference(updated);
    return updated;
  } catch {
    const updated: ReferenceImage = { ...reference, outlineStatus: 'failed' };
    await saveReference(updated);
    return updated;
  }
}

export async function importFromLibrary(): Promise<ReferenceImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('需要相册权限');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) {
    return null;
  }
  const asset = result.assets[0];
  return createReferenceFromUri(asset.uri, asset.fileName ?? '相册图片', asset.width ?? 0, asset.height ?? 0);
}
