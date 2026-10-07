import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { AppData, Member, Rehearsal } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';
import { getCustomMemberColors, initMemberColorsSync, MEMBER_COLORS_UPDATED_EVENT } from '../lib/memberColors';

export const useAppData = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [customColorsVersion, setCustomColorsVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('--');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Real-time Firestore sync & local event listener for member color changes
  useEffect(() => {
    const handleColorUpdate = () => {
      setCustomColorsVersion(v => v + 1);
    };
    window.addEventListener(MEMBER_COLORS_UPDATED_EVENT, handleColorUpdate);
    window.addEventListener('storage', handleColorUpdate);
    const unsubFirestore = initMemberColorsSync(() => {
      setCustomColorsVersion(v => v + 1);
    });

    return () => {
      window.removeEventListener(MEMBER_COLORS_UPDATED_EVENT, handleColorUpdate);
      window.removeEventListener('storage', handleColorUpdate);
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`);
      const json = await resp.json();
      
      // Sanitization: deduplicate members array received from backend
      if (json && Array.isArray(json.members)) {
        const uniqueMembers: Member[] = [];
        const seen = new Set<string>();
        for (const m of json.members) {
          const norm = (m?.name || '').trim().toLowerCase();
          if (norm && !seen.has(norm)) {
            seen.add(norm);
            uniqueMembers.push({
              name: m.name.trim(),
              color: m.color || '#00e660'
            });
          }
        }
        json.members = uniqueMembers;
      }

      setData(json);
      setLastSync(format(new Date(), 'HH:mm'));
      return json;
    } catch (error) {
      showToast('Errore di connessione', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 180000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Data with custom member colors applied and members deduplicated
  const enrichedData: AppData | null = useMemo(() => {
    if (!data) return null;
    const customColors = getCustomMemberColors();

    const uniqueMembers: Member[] = [];
    const seen = new Set<string>();

    for (const m of (data.members || [])) {
      const trimmed = (m?.name || '').trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);

      const overrideColor = customColors[lower];
      uniqueMembers.push({
        ...m,
        name: trimmed,
        color: (overrideColor && overrideColor.startsWith('#')) ? overrideColor : (m.color || '#00e660')
      });
    }

    return {
      ...data,
      members: uniqueMembers
    };
  }, [data, customColorsVersion]);

  const calcolaTurno = useMemo(() => {
    const currentData = enrichedData || data;
    if (!currentData || currentData.payments.length === 0 || currentData.members.length === 0) return null;
    const totals: Record<string, number> = {};
    currentData.members.forEach(m => totals[m.name] = 0);
    currentData.payments.forEach(p => { if (totals[p.payer] !== undefined) totals[p.payer]++; });
    
    let minVal = Math.min(...Object.values(totals));
    let candidati = currentData.members.filter(m => totals[m.name] === minVal);

    if (candidati.length === 1) return candidati[0];
    
    const reversePayments = [...currentData.payments].reverse();
    for (const p of reversePayments) {
      if (candidati.length === 1) break;
      const foundIdx = candidati.findIndex(c => c.name === p.payer);
      if (foundIdx !== -1) {
        candidati.splice(foundIdx, 1);
      }
    }
    return candidati[0];
  }, [enrichedData, data]);

  const apiAction = async (type: string, payload: any) => {
    try {
      const resp = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ type, ...payload })
      });
      if (resp.ok) {
        await fetchData();
        return true;
      }
    } catch (e) {
      showToast('Errore durante l\'operazione', 'error');
    }
    return false;
  };

  return {
    data: enrichedData || data,
    loading,
    lastSync,
    toast,
    showToast,
    fetchData,
    calcolaTurno,
    apiAction
  };
};
