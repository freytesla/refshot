export interface Size {
  width: number;
  height: number;
}

export function clamp(value: number, min: number, max: number): number {
  'worklet';
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * cover 模式缩放：让图片铺满容器（可超出裁剪）。
 * 返回 1 表示原尺寸，>1 表示放大。
 */
export function coverScale(image: Size, container: Size): number {
  if (image.width <= 0 || image.height <= 0 || container.width <= 0 || container.height <= 0) {
    return 1;
  }
  const scaleX = container.width / image.width;
  const scaleY = container.height / image.height;
  return Math.max(scaleX, scaleY);
}

/**
 * contain 模式缩放：让图片完整显示在容器内。
 */
export function containScale(image: Size, container: Size): number {
  if (image.width <= 0 || image.height <= 0 || container.width <= 0 || container.height <= 0) {
    return 1;
  }
  const scaleX = container.width / image.width;
  const scaleY = container.height / image.height;
  return Math.min(scaleX, scaleY);
}

export const MIN_OVERLAY_SCALE = 0.2;
export const MAX_OVERLAY_SCALE = 8;

export function clampOverlayScale(scale: number): number {
  return clamp(scale, MIN_OVERLAY_SCALE, MAX_OVERLAY_SCALE);
}

/** 对比页划杆位置：限制在 5%-95% 之间，避免手柄滑出边界 */
export function clampDivider(x: number): number {
  return clamp(x, 0.05, 0.95);
}
