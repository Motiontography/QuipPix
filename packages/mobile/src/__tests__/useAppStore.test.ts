import { useAppStore } from '../store/useAppStore';
import { GalleryItem } from '../types';

const makeItem = (id: string): GalleryItem => ({
  id,
  localUri: `/mock/path/${id}.png`,
  styleId: 'caricature-classic',
  styleName: 'Classic Caricature',
  createdAt: new Date().toISOString(),
  params: {
    styleId: 'caricature-classic',
    sliders: {
      intensity: 50,
      faceFidelity: 70,
      backgroundStrength: 50,
      colorMood: 'warm',
      detail: 50,
    },
    toggles: {
      keepIdentity: true,
      preserveSkinTone: true,
    },
  },
});

function resetStore() {
  useAppStore.setState({
    gallery: [],
    favorites: [],
    collections: [],
    hasShownInterstitial: false,
    creationCount: 0,
    watermarkEnabled: false,
    hasSeenOnboarding: false,
    lastSliders: {
      intensity: 50,
      faceFidelity: 70,
      backgroundStrength: 50,
      colorMood: 'warm',
      detail: 50,
    },
    lastToggles: { keepIdentity: true, preserveSkinTone: true },
    lastStyleOptions: undefined,
  });
}

describe('useAppStore', () => {
  beforeEach(resetStore);

  it('has correct initial state', () => {
    const state = useAppStore.getState();
    expect(state.gallery).toEqual([]);
    expect(state.favorites).toEqual([]);
    expect(state.collections).toEqual([]);
    expect(state.creationCount).toBe(0);
    expect(state.watermarkEnabled).toBe(false);
    expect(state.hasShownInterstitial).toBe(false);
  });

  it('adds item to gallery', async () => {
    const item = makeItem('item-1');
    await useAppStore.getState().addToGallery(item);
    expect(useAppStore.getState().gallery).toHaveLength(1);
    expect(useAppStore.getState().gallery[0].id).toBe('item-1');
  });

  it('prepends new items to gallery', async () => {
    await useAppStore.getState().addToGallery(makeItem('item-1'));
    await useAppStore.getState().addToGallery(makeItem('item-2'));
    expect(useAppStore.getState().gallery[0].id).toBe('item-2');
    expect(useAppStore.getState().gallery[1].id).toBe('item-1');
  });

  it('removes item from gallery', async () => {
    await useAppStore.getState().addToGallery(makeItem('item-1'));
    await useAppStore.getState().addToGallery(makeItem('item-2'));
    await useAppStore.getState().removeFromGallery('item-1');
    expect(useAppStore.getState().gallery).toHaveLength(1);
    expect(useAppStore.getState().gallery[0].id).toBe('item-2');
  });

  it('clears entire gallery', async () => {
    await useAppStore.getState().addToGallery(makeItem('item-1'));
    await useAppStore.getState().addToGallery(makeItem('item-2'));
    await useAppStore.getState().clearGallery();
    expect(useAppStore.getState().gallery).toEqual([]);
    expect(useAppStore.getState().favorites).toEqual([]);
    expect(useAppStore.getState().collections).toEqual([]);
  });

  it('toggles favorites', async () => {
    await useAppStore.getState().toggleFavorite('item-1');
    expect(useAppStore.getState().favorites).toContain('item-1');

    await useAppStore.getState().toggleFavorite('item-1');
    expect(useAppStore.getState().favorites).not.toContain('item-1');
  });

  it('isFavorite returns correct value', async () => {
    await useAppStore.getState().toggleFavorite('item-1');
    expect(useAppStore.getState().isFavorite('item-1')).toBe(true);
    expect(useAppStore.getState().isFavorite('item-2')).toBe(false);
  });

  it('manages collections', async () => {
    await useAppStore.getState().addCollection('Test Collection');
    const collections = useAppStore.getState().collections;
    expect(collections).toHaveLength(1);
    expect(collections[0].name).toBe('Test Collection');

    const colId = collections[0].id;
    await useAppStore.getState().renameCollection(colId, 'Renamed');
    expect(useAppStore.getState().collections[0].name).toBe('Renamed');

    await useAppStore.getState().removeCollection(colId);
    expect(useAppStore.getState().collections).toHaveLength(0);
  });

  it('adds and removes items from collections', async () => {
    await useAppStore.getState().addCollection('My Col');
    const colId = useAppStore.getState().collections[0].id;

    await useAppStore.getState().addToCollection(colId, 'item-1');
    expect(useAppStore.getState().collections[0].itemIds).toContain('item-1');

    await useAppStore.getState().removeFromCollection(colId, 'item-1');
    expect(useAppStore.getState().collections[0].itemIds).not.toContain('item-1');
  });

  it('increments creation count', async () => {
    await useAppStore.getState().incrementCreationCount();
    expect(useAppStore.getState().creationCount).toBe(1);
    await useAppStore.getState().incrementCreationCount();
    expect(useAppStore.getState().creationCount).toBe(2);
  });

  it('toggles watermark', async () => {
    await useAppStore.getState().setWatermarkEnabled(true);
    expect(useAppStore.getState().watermarkEnabled).toBe(true);
    await useAppStore.getState().setWatermarkEnabled(false);
    expect(useAppStore.getState().watermarkEnabled).toBe(false);
  });

  it('sets interstitial flag', () => {
    useAppStore.getState().setInterstitialShown();
    expect(useAppStore.getState().hasShownInterstitial).toBe(true);
  });

  it('sets onboarding complete', async () => {
    await useAppStore.getState().setOnboardingComplete();
    expect(useAppStore.getState().hasSeenOnboarding).toBe(true);
  });
});
