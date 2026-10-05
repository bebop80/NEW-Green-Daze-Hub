import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  User, 
  Repeat, 
  Check, 
  Sparkles,
  Cloud,
  Eraser,
  Trash2,
  Paintbrush
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isToday,
  getDay
} from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, MemberAvailabilityMap } from '../../types';
import { cn } from '../../lib/utils';
import { db } from '../../firebase';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'green_daze_band_availability_v1';
const ACTIVE_MEMBER_KEY = 'green_daze_active_member';

const PALETTE_8_COLORS = [
  '#00e660', // 1: Neon Green
  '#38bdf8', // 2: Sky Blue
  '#f59e0b', // 3: Amber Orange
  '#ec4899', // 4: Pink
  '#a855f7', // 5: Purple
  '#ef4444', // 6: Coral Red
  '#06b6d4', // 7: Cyan
  '#eab308'  // 8: Golden Yellow
];

const DEFAULT_MEMBERS = [
  { name: 'Al', color: '#00e660' },
  { name: 'Marco', color: '#38bdf8' },
  { name: 'Dave', color: '#f59e0b' },
  { name: 'Tommy', color: '#ec4899' }
];

const WEEKDAY_ITEMS = [
  { label: 'Lun', dayIndex: 1 },
  { label: 'Mar', dayIndex: 2 },
  { label: 'Mer', dayIndex: 3 },
  { label: 'Gio', dayIndex: 4 },
  { label: 'Ven', dayIndex: 5 },
  { label: 'Sab', dayIndex: 6 },
  { label: 'Dom', dayIndex: 0 },
];

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  data,
  showToast
}) => {
  // Members list: use real band members from remote data, fallback to DEFAULT_MEMBERS if no remote members
  const members = useMemo(() => {
    const raw = (data?.members && data.members.length > 0) ? data.members : DEFAULT_MEMBERS;
    const seen = new Set<string>();
    const unique: Array<{ name: string; color: string }> = [];

    let idx = 0;
    for (const m of raw) {
      const name = (m?.name || '').trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        unique.push({
          name,
          color: m.color || PALETTE_8_COLORS[idx % PALETTE_8_COLORS.length]
        });
        idx++;
      }
    }
    return unique.length > 0 ? unique : DEFAULT_MEMBERS;
  }, [data?.members]);

  // Active member for editing availability
  const [selectedMember, setSelectedMember] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ACTIVE_MEMBER_KEY);
      if (saved && members.some(m => m.name === saved)) return saved;
    }
    return members[0]?.name || 'Al';
  });

  // Keep selectedMember valid if members array changes
  useEffect(() => {
    if (members.length > 0 && !members.some(m => m.name === selectedMember)) {
      setSelectedMember(members[0].name);
    }
  }, [members, selectedMember]);

  // Current calendar month view (defaults to next month when day >= 21)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return now.getDate() >= 21 ? addMonths(now, 1) : now;
  });

  // Show dropdown for member selector
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Show recurring shifts modal / panel
  const [showRecurringPanel, setShowRecurringPanel] = useState(false);
  const [recurringWeekdays, setRecurringWeekdays] = useState<number[]>([]);

  // Clear confirmation dialog state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Feedback state for auto-save
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const saveFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Availability state map: { [memberName]: { [YYYY-MM-DD]: boolean } }
  // Only available days are stored as true
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, Record<string, boolean>>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const converted: Record<string, Record<string, boolean>> = {};
          // Migrate or read
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
        console.error('Failed to load availability from localStorage', e);
      }
    }
    return {};
  });

  useEffect(() => {
    if (selectedMember && typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_MEMBER_KEY, selectedMember);
    }
  }, [selectedMember]);

  // Load from localStorage and reset month view when opening (Option 1: day >= 21 opens on next month)
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setCurrentMonth(now.getDate() >= 21 ? addMonths(now, 1) : now);

      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
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
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

  // Real-time synchronization across all devices via Firebase Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const colRef = collection(db, 'member_availability');
      unsubscribe = onSnapshot(colRef, (snapshot) => {
        const remoteMap: Record<string, Record<string, boolean>> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.memberName && data.dates) {
            remoteMap[data.memberName] = data.dates as Record<string, boolean>;
          }
        });

        if (Object.keys(remoteMap).length > 0) {
          setAvailabilityMap(prev => {
            const updated = { ...prev };
            Object.entries(remoteMap).forEach(([mem, dates]) => {
              updated[mem] = (dates && typeof dates === 'object') ? dates : {};
            });
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
        }
      }, (err) => {
        console.warn('Firestore live sync listener:', err);
      });
    } catch (e) {
      console.warn('Firestore init warning:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false);
      }
    };
    if (showMemberDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMemberDropdown]);

  // Trigger quick visual auto-saved badge
  const triggerAutoSaveFeedback = () => {
    setIsSavedFeedback(true);
    if (saveFeedbackTimeoutRef.current) {
      clearTimeout(saveFeedbackTimeoutRef.current);
    }
    saveFeedbackTimeoutRef.current = setTimeout(() => {
      setIsSavedFeedback(false);
    }, 1500);
  };

  // Helper to persist to localStorage & dispatch events immediately, with Firestore Cloud sync
  const persistAvailability = async (
    newMap: Record<string, Record<string, boolean>>,
    updatedMember?: string,
    memberDates?: Record<string, boolean>
  ) => {
    // 1. Instant local persistence and event dispatch
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMap));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('band_availability_updated', { detail: newMap }));
      }
      triggerAutoSaveFeedback();
    } catch (e) {
      console.error('Failed to auto-save availability locally', e);
    }

    // 2. Real-time Cloud persistence to Firestore (multi-device synchronization)
    try {
      if (updatedMember && memberDates !== undefined) {
        const docId = updatedMember.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        await setDoc(doc(db, 'member_availability', docId), {
          memberId: docId,
          memberName: updatedMember,
          dates: memberDates,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Firestore cloud sync write:', e);
    }
  };

  // Current active member object
  const currentMemberObj = useMemo(() => {
    return members.find(m => m.name === selectedMember) || members[0] || { name: 'Al', color: '#00e660' };
  }, [members, selectedMember]);

  // Helper: check if a member is marked available on a specific dateKey (handles true, 'true', 'available', 1)
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

  // Toggle availability for active member on clicked day (Auto-saved immediately, cleanly isolated)
  const handleToggleDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const isCurrentlyAvailable = isMemberAvail(selectedMember, dateKey);

    const targetLower = selectedMember.trim().toLowerCase();
    const newMap: Record<string, Record<string, boolean>> = {};
    let currentMemberDates: Record<string, boolean> = {};

    for (const [key, dates] of Object.entries(availabilityMap)) {
      const safeDates = (dates && typeof dates === 'object') ? dates : {};
      if (key.trim().toLowerCase() === targetLower) {
        currentMemberDates = { ...currentMemberDates, ...safeDates };
      } else {
        newMap[key] = { ...safeDates };
      }
    }

    if (isCurrentlyAvailable) {
      delete currentMemberDates[dateKey];
    } else {
      currentMemberDates[dateKey] = true;
    }

    const canonicalMember = members.find(m => m.name.toLowerCase() === targetLower)?.name || selectedMember.trim();
    newMap[canonicalMember] = currentMemberDates;

    setAvailabilityMap(newMap);
    persistAvailability(newMap, canonicalMember, currentMemberDates);
  };

  // Generate calendar days for currentMonth
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Check if active member is available on day
  const isMemberAvailable = (day: Date, memberName: string): boolean => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return isMemberAvail(memberName, dateKey);
  };

  // All members available on day (strictly deduplicated, robust matching)
  const getAllAvailableOnDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const seen = new Set<string>();
    return members.filter(m => {
      const cleanName = m.name.trim();
      if (seen.has(cleanName)) return false;
      if (isMemberAvail(cleanName, dateKey)) {
        seen.add(cleanName);
        return true;
      }
      return false;
    });
  };

  // Apply recurring shift pattern to the current month (Auto-saved immediately)
  const applyRecurringPattern = (weekdaysToSet: number[]) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    let d = monthStart;

    const targetLower = selectedMember.trim().toLowerCase();
    const newMap: Record<string, Record<string, boolean>> = {};
    let currentMemberDates: Record<string, boolean> = {};

    for (const [key, dates] of Object.entries(availabilityMap)) {
      const safeDates = (dates && typeof dates === 'object') ? dates : {};
      if (key.trim().toLowerCase() === targetLower) {
        currentMemberDates = { ...currentMemberDates, ...safeDates };
      } else {
        newMap[key] = { ...safeDates };
      }
    }

    while (d <= monthEnd) {
      const dayOfWeek = getDay(d); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const dateKey = format(d, 'yyyy-MM-dd');

      if (weekdaysToSet.includes(dayOfWeek)) {
        currentMemberDates[dateKey] = true;
      }
      d = addDays(d, 1);
    }

    const canonicalMember = members.find(m => m.name.toLowerCase() === targetLower)?.name || selectedMember.trim();
    newMap[canonicalMember] = currentMemberDates;

    setAvailabilityMap(newMap);
    persistAvailability(newMap, canonicalMember, currentMemberDates);
    showToast(`Giorni ricorrenti salvati per ${format(currentMonth, 'MMMM', { locale: it })}!`, 'success');
    setShowRecurringPanel(false);
  };

  // Clear this month for active member (Auto-saved immediately in cancellation)
  const clearCurrentMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    let d = monthStart;

    const targetLower = selectedMember.trim().toLowerCase();
    const newMap: Record<string, Record<string, boolean>> = {};
    let currentMemberDates: Record<string, boolean> = {};

    for (const [key, dates] of Object.entries(availabilityMap)) {
      const safeDates = (dates && typeof dates === 'object') ? dates : {};
      if (key.trim().toLowerCase() === targetLower) {
        currentMemberDates = { ...currentMemberDates, ...safeDates };
      } else {
        newMap[key] = { ...safeDates };
      }
    }

    while (d <= monthEnd) {
      const dateKey = format(d, 'yyyy-MM-dd');
      delete currentMemberDates[dateKey];
      d = addDays(d, 1);
    }

    const canonicalMember = members.find(m => m.name.toLowerCase() === targetLower)?.name || selectedMember.trim();
    newMap[canonicalMember] = currentMemberDates;

    setAvailabilityMap(newMap);
    persistAvailability(newMap, canonicalMember, currentMemberDates);
    showToast(`Mese azzerato e salvato per ${selectedMember}`, 'success');
    setShowRecurringPanel(false);
  };

  // Clear all availability selections for the currently selected member across all dates
  const clearMemberAllChoices = () => {
    const targetLower = selectedMember.trim().toLowerCase();
    const newMap: Record<string, Record<string, boolean>> = {};

    for (const [key, dates] of Object.entries(availabilityMap)) {
      const safeDates = (dates && typeof dates === 'object') ? dates : {};
      if (key.trim().toLowerCase() !== targetLower) {
        newMap[key] = { ...safeDates };
      }
    }

    const canonicalMember = members.find(m => m.name.toLowerCase() === targetLower)?.name || selectedMember.trim();
    // Empty object for this member
    newMap[canonicalMember] = {};

    setAvailabilityMap(newMap);
    persistAvailability(newMap, canonicalMember, {});
    showToast(`Tutte le disponibilità di ${selectedMember} sono state cancellate`, 'success');
    setShowClearConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md p-2.5 sm:p-4 flex items-center justify-center overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.18 }}
        className="glass-card w-full max-w-[460px] sm:max-w-[480px] p-4 sm:p-5 border-brand-green/30 relative text-text-primary shadow-2xl flex flex-col my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Resembling the screenshot closely */}
        <div className="flex items-center justify-between pb-2.5 border-b border-brand-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Calendar Icon Button */}
            <div className="w-10 h-10 rounded-xl bg-brand-dark border border-brand-border/80 flex items-center justify-center text-brand-green shadow-inner shrink-0">
              <CalendarIcon size={20} className="text-brand-green" />
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold tracking-widest text-text-secondary uppercase block leading-none">
                CALENDARIO
              </span>
              <h3 className="font-display font-black uppercase text-lg sm:text-xl tracking-tight text-brand-green leading-tight">
                DISPONIBILITÀ
              </h3>
              <div 
                className="flex items-center gap-1.5 leading-none pt-1 select-none"
                title="Sincronizzato in tempo reale su tutti i dispositivi via Cloud Firestore"
              >
                <Cloud size={12} className={cn("shrink-0", isSavedFeedback ? "text-emerald-400" : "text-brand-green")} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider leading-none">
                  {isSavedFeedback ? (
                    <span className="text-emerald-400 font-black">SALVATO ✓</span>
                  ) : (
                    <span className="text-text-secondary">CLOUD LIVE</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Controls Row: [Member Selector Pill] (left), [Giorni Ricorrenti Pill] (center), [Clear Button] (right) - Equidistanti */}
        <div className="pt-2 pb-1.5 flex items-center justify-between relative w-full">
          {/* 1. Nome Membro Pill (All'estrema sinistra) */}
          <div className="flex justify-start min-w-0" ref={dropdownRef}>
            <button
              onClick={() => setShowMemberDropdown(!showMemberDropdown)}
              className="h-[34px] px-2.5 py-1 rounded-full bg-brand-dark/90 hover:bg-brand-dark border border-brand-border/80 hover:border-brand-green/60 text-text-primary flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <User size={13} className="text-text-secondary shrink-0" />
              {/* Colored Dot of user */}
              <span 
                className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
                style={{ 
                  backgroundColor: currentMemberObj.color || '#00e660', 
                  color: currentMemberObj.color || '#00e660' 
                }} 
              />
              <span className="font-display font-black text-[11.5px] uppercase tracking-wider text-text-primary truncate">
                {selectedMember}
              </span>
            </button>

            {/* Dropdown Menu with Member Options */}
            <AnimatePresence>
              {showMemberDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-1.5 z-50 w-44 bg-brand-card border border-brand-border rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl"
                >
                  <div className="text-[9px] font-mono font-bold uppercase text-text-secondary px-2.5 py-1 border-b border-brand-border/40">
                    Seleziona Membro:
                  </div>
                  <div className="space-y-0.5 mt-1 max-h-48 overflow-y-auto">
                    {members.map(m => (
                      <button
                        key={m.name}
                        onClick={() => {
                          setSelectedMember(m.name);
                          setShowMemberDropdown(false);
                        }}
                        className={cn(
                          "w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer",
                          selectedMember === m.name
                            ? "bg-brand-green/15 text-brand-green"
                            : "hover:bg-white/5 text-text-primary"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: m.color || '#00e660' }}
                          />
                          <span className="font-display font-black uppercase text-xs">{m.name}</span>
                        </div>
                        {selectedMember === m.name && <Check size={14} className="text-brand-green" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Giorni Ricorrenti Pill (Perfettamente centrato ed equidistante) */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowRecurringPanel(!showRecurringPanel)}
              className={cn(
                "h-[34px] px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 whitespace-nowrap",
                showRecurringPanel
                  ? "bg-brand-green/20 border-brand-green text-brand-green"
                  : "bg-brand-dark/90 hover:bg-brand-dark border-brand-border/80 hover:border-brand-green/50 text-text-primary"
              )}
            >
              <Repeat size={12} className="text-brand-green shrink-0" />
              <span className="font-display font-black text-[11.5px] uppercase tracking-normal">
                Giorni Ricorrenti
              </span>
            </button>
          </div>

          {/* 3. Pulsante Cancellazione (All'estrema destra) */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="h-[34px] w-[34px] rounded-full bg-brand-dark hover:bg-red-500/15 border border-brand-border/80 hover:border-red-500/60 text-text-secondary hover:text-red-400 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90 shrink-0"
              title={`Cancella tutte le disponibilità di ${selectedMember}`}
              aria-label="Cancella disponibilità"
            >
              <Eraser size={15} className="shrink-0 transition-transform active:rotate-12" />
            </button>
          </div>
        </div>

        {/* Centered Modal Confirmation Popup with Blurred Backdrop */}
        <AnimatePresence>
          {showClearConfirm && (
            <div 
              className="absolute inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl"
              onClick={() => setShowClearConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                transition={{ duration: 0.16 }}
                className="w-full max-w-xs bg-brand-card/95 border border-red-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3.5 text-center relative"
                onClick={e => e.stopPropagation()}
              >
                {/* Icon Badge */}
                <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
                  <Eraser size={24} />
                </div>

                {/* Question Text */}
                <div className="space-y-1.5">
                  <h4 className="font-display font-black text-sm uppercase tracking-tight text-white">
                    Conferma Cancellazione
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed px-1">
                    <span 
                      className="font-bold uppercase tracking-wide inline-flex items-center gap-1"
                      style={{ color: currentMemberObj.color || '#00e660' }}
                    >
                      <span 
                        className="w-2 h-2 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: currentMemberObj.color || '#00e660' }}
                      />
                      {selectedMember}
                    </span>, cancellare tutte le tue disponibilità e iniziare da capo?
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-brand-dark/80 hover:bg-brand-dark border border-brand-border/70 text-text-secondary hover:text-text-primary transition-all cursor-pointer active:scale-95"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={clearMemberAllChoices}
                    className="flex-1 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    Cancella
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Turni Ricorrenti Floating Overlay Panel - matching screenshot */}
        <AnimatePresence>
          {showRecurringPanel && (
            <>
              {/* Backdrop over calendar to focus on the panel and prevent clicks underneath */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs rounded-2xl"
                onClick={() => setShowRecurringPanel(false)}
              />

              {/* Floating Dialog matching screenshot */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-x-2.5 sm:inset-x-4 top-[102px] z-50 bg-[#111923] border border-brand-green/60 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-brand-green min-w-0">
                    <Repeat size={16} className="text-brand-green shrink-0" />
                    <h4 className="font-display font-black text-xs sm:text-sm uppercase tracking-wide text-brand-green truncate">
                      GIORNI FISSI RICORRENTI ({selectedMember})
                    </h4>
                  </div>
                  <button 
                    onClick={() => setShowRecurringPanel(false)}
                    className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    aria-label="Chiudi pannello turni"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Subtitle / Description */}
                <p className="text-[11.5px] sm:text-xs text-text-secondary leading-relaxed font-sans">
                  Sei sempre libero in determinati giorni della settimana? Selezionali per renderli disponibili in questo mese.
                </p>

                {/* Weekday Selection Pills: Lun, Mar, Mer, Gio, Ven, Sab, Dom */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-0.5">
                  {WEEKDAY_ITEMS.map(({ label, dayIndex }) => {
                    const isSelected = recurringWeekdays.includes(dayIndex);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setRecurringWeekdays(prev => 
                            prev.includes(dayIndex) 
                              ? prev.filter(d => d !== dayIndex) 
                              : [...prev, dayIndex]
                          );
                        }}
                        className={cn(
                          "py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border text-center font-sans select-none active:scale-95",
                          isSelected
                            ? "bg-brand-green/20 border-brand-green text-brand-green ring-1 ring-brand-green/60 shadow-sm font-extrabold"
                            : "bg-[#0b121a] border-brand-border/70 text-text-secondary hover:text-text-primary hover:border-brand-green/40"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Divider Line & Action Buttons */}
                <div className="border-t border-brand-border/60 pt-3 flex items-center justify-between gap-3">
                  {/* Left: Azzera */}
                  <button
                    type="button"
                    onClick={() => {
                      setRecurringWeekdays([]);
                      clearCurrentMonth();
                    }}
                    className="text-brand-green hover:underline font-bold text-xs sm:text-sm px-1 py-1 transition-colors cursor-pointer select-none active:opacity-75"
                  >
                    Azzera
                  </button>

                  {/* Right: APPLICA A <MESE> */}
                  <button
                    type="button"
                    onClick={() => applyRecurringPattern(recurringWeekdays)}
                    disabled={recurringWeekdays.length === 0}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 disabled:opacity-40 text-black font-display font-black text-xs sm:text-sm uppercase tracking-wide shadow-md shadow-brand-green/20 transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    APPLICA A {format(currentMonth, 'MMMM', { locale: it }).toUpperCase()}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Month Navigation (Centered exactly like in screenshot) */}
        <div className="flex items-center justify-between py-1 px-1">
          <button
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
            className="w-8 h-8 rounded-lg bg-brand-dark border border-brand-border hover:border-brand-green flex items-center justify-center text-text-secondary hover:text-brand-green transition-all cursor-pointer active:scale-95"
            title="Mese precedente"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="font-display font-black text-sm sm:text-base uppercase tracking-wider text-text-primary text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </div>

          <button
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            className="w-8 h-8 rounded-lg bg-brand-dark border border-brand-border hover:border-brand-green flex items-center justify-center text-text-secondary hover:text-brand-green transition-all cursor-pointer active:scale-95"
            title="Mese successivo"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Weekday Row (LUN, MAR, MER, GIO, VEN, SAB, DOM) */}
        <div className="grid grid-cols-7 text-center pt-1 pb-1">
          {['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'].map(wd => (
            <span key={wd} className="text-[10px] font-mono font-bold text-text-secondary/70">
              {wd}
            </span>
          ))}
        </div>

        {/* Calendar Grid - Uniform square cells divided into 3 invisible horizontal rows */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 select-none pt-0.5">
          {calendarDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCurMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);
            const isAvailable = isMemberAvailable(day, selectedMember);
            const allAvailable = getAllAvailableOnDay(day);
            const isFullBand = members.length > 0 && allAvailable.length === members.length;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => isCurMonth && handleToggleDay(day)}
                disabled={!isCurMonth}
                className={cn(
                  "aspect-square min-h-[46px] sm:min-h-[52px] w-full rounded-xl py-1.5 px-0.5 sm:py-2 sm:px-1 transition-all relative border select-none text-left overflow-hidden min-w-0 cursor-pointer flex flex-col justify-between items-center",
                  // Outside current month
                  !isCurMonth && "opacity-20 cursor-default border-transparent bg-transparent",
                  
                  // Inside current month:
                  // Case 1: ALL band members available -> ILLUMINATO / ACCESO (Glowing vibrant neon backlight & border)
                  isCurMonth && isFullBand && "bg-[#00e660]/35 border-2 border-[#00e660] shadow-[0_0_24px_rgba(0,230,96,0.85),inset_0_0_16px_rgba(0,230,96,0.4)] ring-2 ring-[#00e660]/70",
                  
                  // Case 2: Active member available, but not whole band
                  isCurMonth && !isFullBand && isAvailable && "bg-brand-card/90 border border-brand-green shadow-[0_0_8px_rgba(0,230,96,0.22)] ring-1 ring-brand-green/60",
                  
                  // Case 3: Other members available, not active member and not full band
                  isCurMonth && !isFullBand && !isAvailable && allAvailable.length > 0 && "bg-brand-dark/80 border border-brand-border/90 hover:border-brand-green/50",
                  
                  // Case 4: No one available
                  isCurMonth && !isFullBand && !isAvailable && allAvailable.length === 0 && "bg-brand-dark/70 border border-brand-border/70 hover:border-brand-green/40",
                  
                  // Today highlight
                  isCurMonth && isDayToday && !isFullBand && "border-brand-green/80 ring-1 ring-brand-green/50"
                )}
              >
                {/* Internal Radial Light Beam when whole cell is illuminated */}
                {isCurMonth && isFullBand && (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,102,0.45)_0%,rgba(0,230,96,0.2)_70%,transparent_100%)] pointer-events-none" />
                )}

                {/* Top Section: Day Number (High contrast & perfectly legible) */}
                <div className="flex items-center justify-center w-full leading-none pt-0.5 z-10">
                  <span className={cn(
                    "text-xs sm:text-sm font-mono font-bold leading-none text-center",
                    isDayToday 
                      ? (isFullBand ? "text-black font-black bg-[#00e660] px-1.5 py-0.5 rounded-sm shadow-xs" : "text-brand-green font-black underline underline-offset-2 decoration-2") 
                      : isCurMonth 
                        ? (isFullBand ? "text-white font-black drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]" : isAvailable ? "text-brand-green font-black" : "text-text-primary") 
                        : "text-zinc-600"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Bottom Section: Rock hand emoji 🤘 if full band, otherwise Member Squares */}
                <div className="w-full flex items-center justify-center pb-0.5 z-10 min-w-0">
                  {isCurMonth && isFullBand ? (
                    <span 
                      className="text-xs sm:text-sm leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] select-none transform hover:scale-110 transition-transform"
                      role="img"
                      aria-label="Tutti disponibili"
                      title="Tutta la band disponibile!"
                    >
                      🤘
                    </span>
                  ) : isCurMonth && allAvailable.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-center gap-[2.5px] max-w-[34px] sm:max-w-[40px] transition-all">
                      {allAvailable.map(m => (
                        <span 
                          key={m.name} 
                          className="w-[4.5px] h-[4.5px] sm:w-[5.5px] sm:h-[5.5px] rounded-[1px] shrink-0 transition-all shadow-xs ring-1 ring-black/40" 
                          style={{ 
                            backgroundColor: m.color || '#00e660'
                          }} 
                          title={`${m.name}: Disponibile`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-[4.5px] sm:h-[5.5px]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-brand-border/60 my-2.5 sm:my-3" />

        {/* Legenda Band - Perfectly contained and styled */}
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center justify-between text-[10px] font-mono font-black uppercase tracking-wider text-text-secondary px-0.5">
            <span>MEMBRI ({members.length})</span>
            <span className="text-[9.5px] font-sans text-text-secondary/70 lowercase">clicca un membro per selezionarlo</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Rock Hand Legend Pill = TUTTI */}
            <div 
              className="px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold flex items-center gap-1.5 bg-[#00e660]/15 border border-[#00e660]/40 text-[#00e660] shadow-xs select-none shrink-0"
              title="Tutta la band disponibile nello stesso giorno"
            >
              <span className="text-xs leading-none">🤘</span>
              <span className="font-black tracking-wider">TUTTI</span>
            </div>

            {members.map(m => {
              const isSelected = m.name === selectedMember;
              return (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => setSelectedMember(m.name)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95 shrink-0",
                    isSelected
                      ? "bg-brand-dark border-brand-green text-text-primary shadow-xs ring-1 ring-brand-green/50"
                      : "bg-brand-dark/50 border-brand-border/60 text-text-secondary hover:text-text-primary hover:border-brand-green/30"
                  )}
                  title={`Seleziona ${m.name} per modificare la sua disponibilità`}
                >
                  <span 
                    className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: m.color || '#00e660' }}
                  />
                  <span>{m.name}</span>
                  {isSelected && <span className="text-[9px] text-brand-green font-normal">(Tu)</span>}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

