import { useState, useEffect, useMemo } from 'react';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
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

  // Option 1 Target Horizon Logic:
  // - Days 1 to 20: Target is current month (focus on remaining days: todayKey to endOfCurrentMonthKey).
  // - Days 21 to end of month: Target switches automatically to next month (startOfNextMonthKey to endOfNextMonthKey).
  // If no one has filled next month yet while in late month, we also include remaining future days of current month so initials don't disappear prematurely.
  const targetPeriodInfo = useMemo(() => {
    const now = new Date();
    const todayKey = format(now, 'yyyy-MM-dd');
    const isLateMonth = now.getDate() >= 21;

    const currentMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
    const nextMonth = addMonths(now, 1);
    const nextMonthStart = format(startOfMonth(nextMonth), 'yyyy-MM-dd');
    const nextMonthEnd = format(endOfMonth(nextMonth), 'yyyy-MM-dd');

    return {
      now,
      todayKey,
      isLateMonth,
      currentMonthEnd,
      nextMonth,
      nextMonthStart,
      nextMonthEnd
    };
  }, []);

  // Members who have marked availability in the active target period:
  const availableMembers = useMemo(() => {
    const { todayKey, isLateMonth, currentMonthEnd, nextMonthStart, nextMonthEnd } = targetPeriodInfo;

    // Helper to test if member has preferences in a date range
    const memberHasDatesInRange = (memberName: string, rangeStart: string, rangeEnd: string): boolean => {
      const target = memberName.trim().toLowerCase();
      for (const [key, dates] of Object.entries(availabilityMap)) {
        if (key.trim().toLowerCase() === target && dates) {
          const hasAny = Object.entries(dates).some(([dKey, val]) => {
            const isAvailable = val === true || val === 'true' || Boolean(val);
            return isAvailable && dKey >= rangeStart && dKey <= rangeEnd;
          });
          if (hasAny) return true;
        }
      }
      return false;
    };

    if (isLateMonth) {
      // Check next month first (switch proattivo)
      const nextMonthMembers = members.filter((m) =>
        memberHasDatesInRange(m.name, nextMonthStart, nextMonthEnd)
      );

      // If at least one member has filled next month, show next month members!
      if (nextMonthMembers.length > 0) {
        return nextMonthMembers;
      }

      // If nobody has filled next month yet, fall back to remaining days of current month
      return members.filter((m) =>
        memberHasDatesInRange(m.name, todayKey, currentMonthEnd)
      );
    } else {
      // Days 1-20: current month from today onwards
      return members.filter((m) =>
        memberHasDatesInRange(m.name, todayKey, currentMonthEnd)
      );
    }
  }, [members, availabilityMap, targetPeriodInfo]);

  // Count of members with at least one preference in target period
  const availableMembersCount = availableMembers.length;

  // Check if there is at least one day compatible with ALL members in the band
  // In late month: checks next month and remaining days of current month.
  // In early month: checks current month from today onwards.
  const hasAllMembersCommonDate = useMemo(() => {
    if (members.length < 2) return false;

    const { todayKey, isLateMonth, currentMonthEnd, nextMonthEnd } = targetPeriodInfo;
    const candidateDates = new Set<string>();

    const rangeStart = todayKey;
    const rangeEnd = isLateMonth ? nextMonthEnd : currentMonthEnd;

    for (const dates of Object.values(availabilityMap)) {
      if (dates) {
        for (const [dateKey, val] of Object.entries(dates)) {
          if (Boolean(val) && dateKey >= rangeStart && dateKey <= rangeEnd) {
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
  }, [members, availabilityMap, targetPeriodInfo]);

  return {
    availabilityMap,
    members,
    availableMembers,
    availableMembersCount,
    hasAllMembersCommonDate,
    targetPeriodInfo
  };
};
