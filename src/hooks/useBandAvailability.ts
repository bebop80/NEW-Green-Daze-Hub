import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Member } from '../types';

export const AVAILABILITY_STORAGE_KEY = 'green_daze_band_availability_v1';

export const DEFAULT_BAND_MEMBERS: Member[] = [
  { name: 'Al', color: '#00e660' },
  { name: 'Marco', color: '#38bdf8' },
  { name: 'Dave', color: '#f59e0b' },
  { name: 'Tommy', color: '#ec4899' }
];

export const useBandAvailability = (rawMembers?: Member[]) => {
  // Normalize members list
  const members: Member[] = useMemo(() => {
    if (rawMembers && rawMembers.length > 0) {
      const seen = new Set<string>();
      const list: Member[] = [];
      for (const m of rawMembers) {
        const name = (m?.name || '').trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          list.push({
            name,
            color: m.color || '#00e660'
          });
        }
      }
      if (list.length > 0) return list;
    }
    return DEFAULT_BAND_MEMBERS;
  }, [rawMembers]);

  // Availability map: { [memberName]: { [YYYY-MM-DD]: boolean } }
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, Record<string, boolean>>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(AVAILABILITY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const converted: Record<string, Record<string, boolean>> = {};
          Object.keys(parsed).forEach(mem => {
            converted[mem] = {};
            Object.keys(parsed[mem] || {}).forEach(date => {
              if (parsed[mem][date] === 'available' || parsed[mem][date] === true) {
                converted[mem][date] = true;
              }
            });
          });
          return converted;
        }
      } catch (e) {
        console.error('Failed to parse availability from localStorage', e);
      }
    }
    return {};
  });

  // Listen to local custom events and storage events
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(AVAILABILITY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const converted: Record<string, Record<string, boolean>> = {};
          Object.keys(parsed).forEach(mem => {
            converted[mem] = {};
            Object.keys(parsed[mem] || {}).forEach(date => {
              if (parsed[mem][date] === 'available' || parsed[mem][date] === true) {
                converted[mem][date] = true;
              }
            });
          });
          setAvailabilityMap(converted);
        }
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('band_availability_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('band_availability_updated', handleUpdate);
    };
  }, []);

  // Live Firestore Synchronization across all devices
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const colRef = collection(db, 'member_availability');
      unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const remoteMap: Record<string, Record<string, boolean>> = {};
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            if (d && d.memberName && d.dates) {
              remoteMap[d.memberName] = d.dates as Record<string, boolean>;
            }
          });

          if (Object.keys(remoteMap).length > 0) {
            setAvailabilityMap((prev) => {
              const updated = { ...prev };
              Object.entries(remoteMap).forEach(([mem, dates]) => {
                updated[mem] = dates && typeof dates === 'object' ? dates : {};
              });
              try {
                localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(updated));
              } catch {
                // ignore
              }
              return updated;
            });
          }
        },
        (err) => {
          console.warn('Firestore live sync listener error:', err);
        }
      );
    } catch (e) {
      console.warn('Firestore init warning:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Helper to check if a specific member is available on a specific dateKey
  const isMemberAvail = (memberName: string, dateKey: string): boolean => {
    const target = (memberName || '').trim().toLowerCase();
    for (const [key, dates] of Object.entries(availabilityMap)) {
      if (key.trim().toLowerCase() === target && dates) {
        const val = dates[dateKey];
        if (val === true || val === 'true' || val === 'available' || val === 1 || Boolean(val)) {
          return true;
        }
      }
    }
    return false;
  };

  // List of members who have entered at least one preference, preserving their assigned color
  const availableMembers = useMemo(() => {
    return members.filter((m) => {
      const target = m.name.trim().toLowerCase();
      for (const [key, dates] of Object.entries(availabilityMap)) {
        if (key.trim().toLowerCase() === target && dates) {
          const hasAny = Object.values(dates).some(
            (v) => v === true || v === 'true' || Boolean(v)
          );
          if (hasAny) return true;
        }
      }
      return false;
    });
  }, [members, availabilityMap]);

  // Count of members with at least one preference
  const availableMembersCount = availableMembers.length;

  // Check if there is at least one day compatible with ALL members in the band
  const hasAllMembersCommonDate = useMemo(() => {
    if (members.length < 2) return false;

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const candidateDates = new Set<string>();

    for (const dates of Object.values(availabilityMap)) {
      if (dates) {
        for (const [dateKey, val] of Object.entries(dates)) {
          if (Boolean(val) && dateKey >= todayKey) {
            candidateDates.add(dateKey);
          }
        }
      }
    }

    for (const dateKey of candidateDates) {
      const allAvailable = members.every((m) => isMemberAvail(m.name, dateKey));
      if (allAvailable) {
        return true;
      }
    }

    return false;
  }, [members, availabilityMap]);

  return {
    availabilityMap,
    members,
    availableMembers,
    availableMembersCount,
    hasAllMembersCommonDate
  };
};
