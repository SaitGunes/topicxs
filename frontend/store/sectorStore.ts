import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SectorId = 'drivers' | 'sports' | 'science' | 'construction' | 'finance' | 'tourism' | 'food' | 'health' | 'music' | 'gaming';

interface Sector {
  id: SectorId;
  icon: string;
  nameKey: string;
  isActive: boolean;
}

export const sectors: Sector[] = [
  { id: 'drivers', icon: '🚗', nameKey: 'sectorDrivers', isActive: true },
  { id: 'sports', icon: '⚽', nameKey: 'sectorSports', isActive: true },
  { id: 'science', icon: '🔬', nameKey: 'sectorScience', isActive: true },
  { id: 'construction', icon: '🏗️', nameKey: 'sectorConstruction', isActive: true },
  { id: 'finance', icon: '💰', nameKey: 'sectorFinance', isActive: true },
  { id: 'tourism', icon: '🎭', nameKey: 'sectorTourism', isActive: true },
  { id: 'food', icon: '🍔', nameKey: 'sectorFood', isActive: true },
  { id: 'health', icon: '💊', nameKey: 'sectorHealth', isActive: true },
  { id: 'music', icon: '🎵', nameKey: 'sectorMusic', isActive: true },
  { id: 'gaming', icon: '🎮', nameKey: 'sectorGaming', isActive: true },
];

interface SectorState {
  currentSector: SectorId | null;
  setCurrentSector: (sectorId: SectorId) => Promise<void>;
  loadCurrentSector: () => Promise<void>;
  clearSector: () => Promise<void>;
}

export const useSectorStore = create<SectorState>((set) => ({
  currentSector: null,
  
  setCurrentSector: async (sectorId: SectorId) => {
    try {
      await AsyncStorage.setItem('currentSector', sectorId);
      set({ currentSector: sectorId });
    } catch (error) {
      console.error('Error saving sector:', error);
    }
  },
  
  loadCurrentSector: async () => {
    try {
      const savedSector = await AsyncStorage.getItem('currentSector');
      if (savedSector) {
        set({ currentSector: savedSector as SectorId });
      }
    } catch (error) {
      console.error('Error loading sector:', error);
    }
  },
  
  clearSector: async () => {
    try {
      await AsyncStorage.removeItem('currentSector');
      set({ currentSector: null });
    } catch (error) {
      console.error('Error clearing sector:', error);
    }
  },
}));