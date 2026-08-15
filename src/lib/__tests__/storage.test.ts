import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReferenceImage } from '../../types';
import {
  clearReferences,
  listReferences,
  parseReferences,
  removeReference,
  saveReference,
  sortReferences,
} from '../storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const makeRef = (id: string, createdAt: number): ReferenceImage => ({
  id,
  name: `ref-${id}`,
  sourceUri: `file:///refs/${id}.jpg`,
  stencilUri: null,
  outlineType: null,
  outlineStatus: 'pending',
  width: 100,
  height: 100,
  createdAt,
  isFavorite: false,
});

describe('parseReferences', () => {
  it('returns [] for null/empty/invalid input', () => {
    expect(parseReferences(null)).toEqual([]);
    expect(parseReferences('')).toEqual([]);
    expect(parseReferences('not json')).toEqual([]);
    expect(parseReferences('{"a":1}')).toEqual([]);
  });

  it('normalizes partial records', () => {
    const raw = JSON.stringify([{ id: 'x', sourceUri: 'file:///x.jpg' }]);
    const parsed = parseReferences(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('x');
    expect(parsed[0].outlineStatus).toBe('pending');
    expect(parsed[0].isFavorite).toBe(false);
  });
});

describe('sortReferences', () => {
  it('sorts by createdAt desc', () => {
    const list = [makeRef('a', 1), makeRef('b', 3), makeRef('c', 2)];
    expect(sortReferences(list).map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('storage CRUD', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('saves and lists references', async () => {
    await saveReference(makeRef('a', 100));
    await saveReference(makeRef('b', 200));
    const list = await listReferences();
    expect(list.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('updates an existing reference instead of duplicating', async () => {
    const ref = makeRef('a', 100);
    await saveReference(ref);
    await saveReference({ ...ref, outlineStatus: 'done', stencilUri: 'file:///outline.png' });
    const list = await listReferences();
    expect(list).toHaveLength(1);
    expect(list[0].outlineStatus).toBe('done');
    expect(list[0].stencilUri).toBe('file:///outline.png');
  });

  it('removes a reference', async () => {
    await saveReference(makeRef('a', 100));
    await saveReference(makeRef('b', 200));
    const next = await removeReference('a');
    expect(next.map((r) => r.id)).toEqual(['b']);
  });

  it('clears all references', async () => {
    await saveReference(makeRef('a', 100));
    await clearReferences();
    expect(await listReferences()).toEqual([]);
  });
});
