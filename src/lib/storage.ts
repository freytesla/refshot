import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReferenceImage, STORAGE_KEY } from '../types';

/** 当前在相机页使用的参考图 id（相机优先流程） */
export const CURRENT_REFERENCE_KEY = 'refshot.currentReferenceId.v1';

/** 按住参考图按钮时的行为：'hide'=长按隐藏（默认显示），'show'=长按出现（默认隐藏） */
export type HoldBehavior = 'hide' | 'show';
export const HOLD_BEHAVIOR_KEY = 'refshot.holdBehavior.v1';

/**
 * 解析持久化的 JSON。对缺失字段/旧版本数据做容错，保证不崩溃。
 */
export function parseReferences(raw: string | null): ReferenceImage[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((item): item is ReferenceImage => !!item && typeof item === 'object' && typeof item.id === 'string' && typeof item.sourceUri === 'string')
      .map((item) => normalizeReference(item));
  } catch {
    return [];
  }
}

export function normalizeReference(item: Partial<ReferenceImage> & { id: string; sourceUri: string }): ReferenceImage {
  return {
    id: item.id,
    name: typeof item.name === 'string' ? item.name : item.id,
    sourceUri: item.sourceUri,
    stencilUri: typeof item.stencilUri === 'string' ? item.stencilUri : null,
    outlineType: item.outlineType ?? null,
    outlineStatus: item.outlineStatus ?? 'pending',
    width: typeof item.width === 'number' ? item.width : 0,
    height: typeof item.height === 'number' ? item.height : 0,
    createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
    isFavorite: item.isFavorite === true,
  };
}

export function sortReferences(list: ReferenceImage[]): ReferenceImage[] {
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export async function listReferences(): Promise<ReferenceImage[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return sortReferences(parseReferences(raw));
}

export async function findReference(id: string): Promise<ReferenceImage | null> {
  const list = await listReferences();
  return list.find((item) => item.id === id) ?? null;
}

export async function saveReference(reference: ReferenceImage): Promise<void> {
  const list = await listReferences();
  const idx = list.findIndex((item) => item.id === reference.id);
  if (idx >= 0) {
    list[idx] = reference;
  } else {
    list.push(reference);
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function removeReference(id: string): Promise<ReferenceImage[]> {
  const list = await listReferences();
  const next = list.filter((item) => item.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function clearReferences(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function getCurrentReferenceId(): Promise<string | null> {
  return AsyncStorage.getItem(CURRENT_REFERENCE_KEY);
}

export async function setCurrentReferenceId(id: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_REFERENCE_KEY, id);
}

export async function clearCurrentReferenceId(): Promise<void> {
  await AsyncStorage.removeItem(CURRENT_REFERENCE_KEY);
}

export async function getHoldBehavior(): Promise<HoldBehavior> {
  const value = await AsyncStorage.getItem(HOLD_BEHAVIOR_KEY);
  return value === 'show' ? 'show' : 'hide';
}

export async function setHoldBehavior(behavior: HoldBehavior): Promise<void> {
  await AsyncStorage.setItem(HOLD_BEHAVIOR_KEY, behavior);
}
