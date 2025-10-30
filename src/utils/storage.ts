import { Song } from '../types/song';

const STORAGE_KEY = 'tbd-curator-songs';

export const loadFromLocalStorage = (): Song[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return [];
  }
};

export const saveToLocalStorage = (songs: Song[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};
