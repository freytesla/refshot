import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createReferenceFromUri } from '../import';
import { listReferences } from '../storage';
import * as outlineModule from '../../../modules/subject-outline';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('createReferenceFromUri on web', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('keeps the original URI, marks outline as failed, and never calls the native outline module', async () => {
    const spy = jest.spyOn(outlineModule, 'generateOutline');
    jest.replaceProperty(Platform, 'OS', 'web');

    const ref = await createReferenceFromUri('blob:http://localhost/abc.png', '测试图', 100, 200);

    // Web 没有文件系统：直接使用原始 URI，不做复制
    expect(ref.sourceUri).toBe('blob:http://localhost/abc.png');
    // Web 没有原生剪影模块：立即标记 failed，不进入 pending（不会卡在「剪影生成中」）
    expect(ref.outlineStatus).toBe('failed');
    expect(spy).not.toHaveBeenCalled();

    // 记录已持久化
    const stored = await listReferences();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(ref.id);
  });
});
