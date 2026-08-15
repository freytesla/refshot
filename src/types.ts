export type OutlineType = 'person' | 'contour' | 'fallback' | null;

export type OutlineStatus = 'pending' | 'done' | 'failed';

export interface ReferenceImage {
  id: string;
  /** 显示名（导入来源命名） */
  name: string;
  /** 复制到 App Documents 的图片 file:// URI */
  sourceUri: string;
  /** 剪影描边 PNG file:// URI；未生成/失败为 null */
  stencilUri: string | null;
  outlineType: OutlineType;
  outlineStatus: OutlineStatus;
  width: number;
  height: number;
  createdAt: number;
  isFavorite: boolean;
}

export const STORAGE_KEY = 'refshot.references.v1';
