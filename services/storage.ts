import { UserStorageData } from '../types';

const STORAGE_KEY = 'maestro_quiz_data_v2';

export const loadData = (): UserStorageData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { items: {}, daily: {} };
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load data', e);
    return { items: {}, daily: {} };
  }
};

export const saveData = (data: UserStorageData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data', e);
  }
};

export const clearData = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const updateStats = (answerKey: string, isCorrect: boolean) => {
  const data = loadData();
  
  // 1. Update Item Stats (for Adaptive Learning)
  if (!data.items[answerKey]) {
    data.items[answerKey] = { correct: 0, wrong: 0 };
  }
  if (isCorrect) {
    data.items[answerKey].correct += 1;
  } else {
    data.items[answerKey].wrong += 1;
  }

  // 2. Update Daily Stats
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  if (!data.daily[today]) {
    data.daily[today] = { date: today, correct: 0, total: 0 };
  }
  
  data.daily[today].total += 1;
  if (isCorrect) {
    data.daily[today].correct += 1;
  }
  
  saveData(data);
  return data;
};

// Helper to get simple item stats for the generator
export const getItemStats = () => {
  return loadData().items;
};