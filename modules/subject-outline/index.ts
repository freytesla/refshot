import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

export type OutlineType = 'person' | 'contour' | 'fallback';

export interface GenerateOutlineOptions {
  /** 本地图片 file:// URI（已复制到 App 目录） */
  sourceUri: string;
  /** 生成的剪影 PNG 输出路径（file:// URI） */
  outputUri: string;
  /** 线条颜色，如 '#FFFFFF' */
  lineColor?: string;
  /** 线条相对粗细，1-10，默认 3 */
  lineWidth?: number;
}

export interface OutlineResult {
  /** 生成成功后的剪影 PNG file:// URI；失败为 null */
  outputUri: string | null;
  /** person=人像剪影，contour=整图轮廓回退，fallback=失败 */
  type: OutlineType;
  error?: string | null;
}

let native: any = null;
if (Platform.OS === 'ios') {
  try {
    native = requireNativeModule('SubjectOutline');
  } catch {
    native = null;
  }
}

/**
 * 生成主体剪影描边 PNG。仅 iOS 可用；其他平台/未编译原生模块时返回 fallback。
 */

export function normalizeOutlineResult(result: any): OutlineResult {
  return {
    outputUri: result && typeof result.outputUri === 'string' && result.outputUri.length > 0 ? result.outputUri : null,
    type: (result && typeof result.type === 'string' ? result.type : 'fallback') as OutlineType,
    error: result && typeof result.error === 'string' && result.error.length > 0 ? result.error : null,
  };
}

export async function generateOutline(options: GenerateOutlineOptions): Promise<OutlineResult> {
  if (!native) {
    return { outputUri: null, type: 'fallback', error: '当前平台不支持剪影生成' };
  }
  const result: any = await native.generateOutline(
    options.sourceUri,
    options.outputUri,
    options.lineColor ?? '#FFFFFF',
    options.lineWidth ?? 3
  );
  return normalizeOutlineResult(result);
}
