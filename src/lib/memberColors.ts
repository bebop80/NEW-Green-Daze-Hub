import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Utility for custom member color overrides synchronized across devices and sessions
const MEMBER_COLORS_KEY = 'green_daze_member_custom_colors_v1';
export const MEMBER_COLORS_UPDATED_EVENT = 'green_daze_member_colors_updated';

/**
 * Returns a map of memberName.toLowerCase() -> hexColor from localStorage
 */
export function getCustomMemberColors(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(MEMBER_COLORS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading custom member colors from localStorage', e);
  }
  return {};
}

/**
 * Sets or updates the color for a specific member name, saving locally and syncing to Firestore
 */
export async function setCustomMemberColor(memberName: string, hexColor: string): Promise<void> {
  if (typeof window === 'undefined' || !memberName) return;
  const key = memberName.trim().toLowerCase();
  
  // 1. Immediately update localStorage for instant local reactivity
  try {
    const current = getCustomMemberColors();
    current[key] = hexColor;
    localStorage.setItem(MEMBER_COLORS_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(MEMBER_COLORS_UPDATED_EVENT, { 
      detail: { memberName: memberName.trim(), color: hexColor } 
    }));
  } catch (e) {
    console.error('Error saving custom member color to localStorage', e);
  }

  // 2. Persist to Firestore so all band members get the updated color
  try {
    const current = getCustomMemberColors();
    await setDoc(doc(db, 'member_colors', 'palette'), {
      colors: current,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('Could not sync member color to Firestore:', e);
  }
}

/**
 * Subscribes to remote member colors from Firestore and syncs them to localStorage
 */
let isListenerActive = false;
export function initMemberColorsSync(onColorsUpdated?: () => void): () => void {
  if (typeof window === 'undefined' || isListenerActive) {
    return () => {};
  }
  isListenerActive = true;

  try {
    const unsub = onSnapshot(doc(db, 'member_colors', 'palette'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.colors && typeof data.colors === 'object') {
          const local = getCustomMemberColors();
          const merged = { ...local, ...data.colors };
          localStorage.setItem(MEMBER_COLORS_KEY, JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent(MEMBER_COLORS_UPDATED_EVENT));
          if (onColorsUpdated) onColorsUpdated();
        }
      }
    }, (err) => {
      console.warn('Firestore member colors snapshot listener error:', err);
    });

    return () => {
      isListenerActive = false;
      unsub();
    };
  } catch (err) {
    isListenerActive = false;
    console.warn('Failed to initialize member colors sync:', err);
    return () => {};
  }
}
