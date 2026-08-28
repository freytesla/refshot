/**
 * Web 端辅助：分享 / 下载图片。
 * 浏览器沙箱不能直接写入系统相册，这里用系统分享面板（iOS Safari 支持）或下载兜底。
 */

export async function webShareImage(dataUri: string, filename: string): Promise<void> {
  const nav = (navigator as any);
  try {
    if (nav && typeof nav.share === 'function' && typeof (globalThis as any).File !== 'undefined') {
      const blob = await (await fetch(dataUri)).blob();
      const FileCtor = (globalThis as any).File;
      const file = new FileCtor([blob], filename, { type: blob.type || 'image/jpeg' });
      await nav.share({ files: [file] });
      return;
    }
  } catch {
    // 用户取消或浏览器不支持 → 退化为下载
  }
  webDownloadImage(dataUri, filename);
}

export function webDownloadImage(dataUri: string, filename: string): void {
  const doc = (globalThis as any).document;
  if (!doc || typeof doc.createElement !== 'function') return;
  const a = doc.createElement('a');
  a.href = dataUri;
  a.download = filename;
  doc.body.appendChild(a);
  a.click();
  doc.body.removeChild(a);
}
