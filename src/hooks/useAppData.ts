import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { AppData, Member, Rehearsal } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';

export const useAppData = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('--');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`);
      const json = await resp.json();
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

  const calcolaTurno = useMemo(() => {
    if (!data || data.payments.length === 0 || data.members.length === 0) return null;
    const totals: Record<string, number> = {};
    data.members.forEach(m => totals[m.name] = 0);
    data.payments.forEach(p => { if (totals[p.payer] !== undefined) totals[p.payer]++; });
    
    let minVal = Math.min(...Object.values(totals));
    let candidati = data.members.filter(m => totals[m.name] === minVal);

    if (candidati.length === 1) return candidati[0];
    
    const reversePayments = [...data.payments].reverse();
    for (const p of reversePayments) {
      if (candidati.length === 1) break;
      const foundIdx = candidati.findIndex(c => c.name === p.payer);
      if (foundIdx !== -1) {
        candidati.splice(foundIdx, 1);
      }
    }
    return candidati[0];
  }, [data]);

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
    data,
    loading,
    lastSync,
    toast,
    showToast,
    fetchData,
    calcolaTurno,
    apiAction
  };
};
