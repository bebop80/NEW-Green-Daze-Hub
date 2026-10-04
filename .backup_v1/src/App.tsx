import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isFuture, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { Eye } from 'lucide-react';

import { useAppData } from './hooks/useAppData';
import { Rehearsal, FutureRehearsal, Concert } from './types';
import { safeParseLocal } from './lib/utils';

// Layout & Navigation Components
import { AppHeader } from './components/AppHeader';
import { BottomNav, TabType } from './components/BottomNav';
import { PunkBackground } from './components/PunkBackground';
import { Toast } from './components/Toast';

// 4 Distinct Tab Views
import { HomeTab } from './components/tabs/HomeTab';
import { ProveTab } from './components/tabs/ProveTab';
import { PagamentiTab } from './components/tabs/PagamentiTab';
import { ConcertiTab } from './components/tabs/ConcertiTab';

// Modals
import { SettingsModal } from './components/modals/SettingsModal';
import { NextSessionModal } from './components/modals/NextSessionModal';
import { FutureSessionModal } from './components/modals/FutureSessionModal';
import { ConcertModal } from './components/modals/ConcertModal';
import { Modals } from './components/modals/Modals';
import { AvailabilityModal } from './components/modals/AvailabilityModal';

const App = () => {
  const {
    data,
    loading,
    lastSync,
    toast,
    showToast,
    calcolaTurno,
    apiAction
  } = useAppData();

  // Tab State: 'home' | 'prove' | 'pagamenti' | 'concerti'
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Modals visibility
  const [showSettings, setShowSettings] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [editingNext, setEditingNext] = useState(false);
  const [showAddFuture, setShowAddFuture] = useState(false);
  const [showAddConcert, setShowAddConcert] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Form States
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPayer, setSelectedPayer] = useState('');
  const [rehearsalForm, setRehearsalForm] = useState<Rehearsal>({
    date: '',
    from: '',
    to: '',
    room: '',
    notes: '',
    sharedExpense: false
  });
  const [futureForm, setFutureForm] = useState<Partial<FutureRehearsal>>({
    date: '',
    from: '',
    to: '',
    room: '',
    sharedExpense: false
  });
  const [concertForm, setConcertForm] = useState<Partial<Concert>>({
    date: '',
    name: '',
    address: ''
  });

  // Dark / Light Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync rehearsal form with data.next
  useEffect(() => {
    if (data?.next) {
      const isShared =
        !!data.next.sharedExpense ||
        (data.next.sharedExpense as any) === 'true' ||
        (data.next.sharedExpense as any) === 'TRUE' ||
        (!!data.next.notes && data.next.notes.includes('[SPESA_CONDIVISA]'));
      const cleanNotes = (data.next.notes || '')
        .replace(/\[SPESA_CONDIVISA\]/g, '')
        .trim();
      setRehearsalForm({
        date: data.next.date?.substring(0, 10) || '',
        from: data.next.from || '',
        to: data.next.to || '',
        room: data.next.room || '',
        notes: cleanNotes,
        sharedExpense: isShared
      });

      if (isShared) {
        setSelectedPayer('Spesa condivisa');
      } else if (calcolaTurno?.name) {
        setSelectedPayer((prev) =>
          prev === '' || prev === 'Spesa condivisa' ? calcolaTurno.name : prev
        );
      }
    } else if (calcolaTurno?.name) {
      setSelectedPayer((prev) =>
        prev === '' || prev === 'Spesa condivisa' ? calcolaTurno.name : prev
      );
    }
  }, [data, calcolaTurno]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  // Payment registration handler with automatic promotion logic
  const handleSendPayment = async () => {
    if (!paymentDate || !selectedPayer) return;

    let nextStep = Promise.resolve(true);

    if (data?.next?.date) {
      const payD = safeParseLocal(paymentDate);
      payD.setHours(12, 0, 0, 0);
      const nextD = safeParseLocal(data.next.date);
      nextD.setHours(12, 0, 0, 0);

      if (payD.getTime() === nextD.getTime()) {
        if (data.futureRehearsals.length > 0) {
          const sorted = [...data.futureRehearsals].sort(
            (a, b) =>
              safeParseLocal(a.date).getTime() -
              safeParseLocal(b.date).getTime()
          );
          const toPromote = sorted[0];
          const isPromoteShared =
            !!toPromote.sharedExpense ||
            (toPromote.sharedExpense as any) === 'true' ||
            (toPromote.sharedExpense as any) === 'TRUE' ||
            (!!toPromote.notes && toPromote.notes.includes('[SPESA_CONDIVISA]'));
          const cleanNotes = (toPromote.notes || '')
            .replace(/\[SPESA_CONDIVISA\]/g, '')
            .trim();
          const newNext = {
            date: toPromote.date,
            from: toPromote.from || '',
            to: toPromote.to || '',
            room: toPromote.room || '',
            notes: isPromoteShared
              ? `${cleanNotes} [SPESA_CONDIVISA]`.trim()
              : cleanNotes,
            sharedExpense: isPromoteShared
          };
          nextStep = apiAction('next_rehearsal', { next: newNext }).then(() =>
            apiAction('delete_future_rehearsal', { id: toPromote.id })
          );
        } else {
          nextStep = apiAction('clear_next_rehearsal', {});
        }
      }
    }

    await nextStep;
    await apiAction('payment', {
      payment: { date: paymentDate, payer: selectedPayer }
    });
  };

  const shareInfo = (text: string, platform: 'wa' | 'tg') => {
    const url =
      platform === 'wa'
        ? `https://wa.me/?text=${encodeURIComponent(text)}`
        : `https://t.me/share/url?url=${encodeURIComponent(
            location.href
          )}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const formatRehearsalForShare = (r: Rehearsal | FutureRehearsal) => {
    const sala = data?.customRooms.find((s) => s.id === r.room);
    const dateStr = format(safeParseLocal(r.date), 'EEEE d MMMM', { locale: it });
    let text = `🎸 PROSSIMA PROVA GREEN DAZE!\n\n📅 ${dateStr}\n`;
    if (r.from && r.to) text += `🕒 Dalle ${r.from} alle ${r.to}\n`;
    text += `📍 ${sala?.name || 'Da definire'}\n`;
    if (sala?.address)
      text += `🗺️ https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        sala.address
      )}\n`;
    const isShared =
      !!r.sharedExpense ||
      (r.sharedExpense as any) === 'true' ||
      (r.sharedExpense as any) === 'TRUE' ||
      (!!r.notes && r.notes.includes('[SPESA_CONDIVISA]'));
    if (isShared) {
      text += `💰 Spesa condivisa`;
    } else if (calcolaTurno) {
      text += `💰 Tocca pagare a: ${calcolaTurno.name}`;
    }
    return text;
  };

  // Concert handlers
  const handleOpenAddConcert = () => {
    setConcertForm({
      date: '',
      name: '',
      address: '',
      time: '',
      soundcheck: '',
      cachet: '',
      notes: ''
    });
    setShowAddConcert(true);
  };

  const handleEditConcert = (c: Concert) => {
    setConcertForm({
      id: c.id,
      date: c.date,
      name: c.name,
      address: c.address,
      time: c.time,
      soundcheck: c.soundcheck,
      cachet: c.cachet,
      notes: c.notes
    });
    setShowAddConcert(true);
  };

  // Future rehearsal handlers
  const handleOpenAddFuture = () => {
    setFutureForm({
      date: '',
      from: '',
      to: '',
      room: '',
      sharedExpense: false,
      notes: ''
    });
    setShowAddFuture(true);
  };

  const handleEditFuture = (fr: FutureRehearsal) => {
    setFutureForm({
      id: fr.id,
      date: fr.date,
      from: fr.from,
      to: fr.to,
      room: fr.room,
      sharedExpense: fr.sharedExpense,
      notes: fr.notes
    });
    setShowAddFuture(true);
  };

  // Count upcoming concerts for badge
  const upcomingConcertsCount = (data?.concerts || []).filter(
    (c) => isFuture(safeParseLocal(c.date)) || isToday(safeParseLocal(c.date))
  ).length;

  const nextHasNotes = !!(
    data?.next?.notes &&
    data.next.notes.replace(/\[SPESA_CONDIVISA\]/g, '').trim().length > 0
  );

  if (loading && !data) {
    return (
      <div className="h-[100dvh] w-full bg-brand-dark flex flex-col items-center justify-center space-y-6 relative overflow-hidden text-text-primary">
        <PunkBackground theme={theme} />
        <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Eye size={64} className="text-brand-green" />
          </motion.div>
          <p className="font-display font-semibold text-lg tracking-wider animate-pulse uppercase">
            Sincronizzazione Dati...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-brand-dark transition-colors duration-300 relative overflow-hidden select-none flex flex-col justify-center items-center">
      <PunkBackground theme={theme} />

      {/* Sleek App Frame: Consistent, refined proportions on smartphone, tablet and PC */}
      <div className="relative z-10 h-full w-full max-w-[430px] mx-auto flex flex-col justify-between overflow-hidden md:h-[94vh] md:max-h-[850px] md:rounded-3xl md:border md:border-brand-border/60 md:shadow-2xl md:shadow-black/70 bg-brand-dark/95 backdrop-blur-md">
        {/* Top Header: Horizontal Band Name + Theme + Sync + Settings */}
        <AppHeader
          theme={theme}
          toggleTheme={toggleTheme}
          lastSync={lastSync}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Main Tab Screen Area: Zero Scroll Viewport-Fit */}
        <main className="flex-1 min-h-0 overflow-hidden relative px-3 sm:px-4 py-2 flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                <HomeTab
                  data={data}
                  calcolaTurno={calcolaTurno}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenNextModal={() => setEditingNext(true)}
                  onOpenConcertModal={handleOpenAddConcert}
                  shareInfo={shareInfo}
                  formatRehearsalForShare={formatRehearsalForShare}
                />
              </motion.div>
            )}

            {activeTab === 'prove' && (
              <motion.div
                key="prove"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                <ProveTab
                  data={data}
                  calcolaTurno={calcolaTurno}
                  onOpenNextModal={() => setEditingNext(true)}
                  onOpenAddFuture={handleOpenAddFuture}
                  onEditFuture={handleEditFuture}
                  onOpenAvailability={() => setShowAvailability(true)}
                  apiAction={apiAction}
                  shareInfo={shareInfo}
                  formatRehearsalForShare={formatRehearsalForShare}
                />
              </motion.div>
            )}

            {activeTab === 'pagamenti' && (
              <motion.div
                key="pagamenti"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                <PagamentiTab
                  data={data}
                  calcolaTurno={calcolaTurno}
                  paymentDate={paymentDate}
                  setPaymentDate={setPaymentDate}
                  selectedPayer={selectedPayer}
                  setSelectedPayer={setSelectedPayer}
                  handleSendPayment={handleSendPayment}
                  setShowAddMember={setShowAddMember}
                  apiAction={apiAction}
                />
              </motion.div>
            )}

            {activeTab === 'concerti' && (
              <motion.div
                key="concerti"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                <ConcertiTab
                  data={data}
                  onOpenAddConcert={handleOpenAddConcert}
                  onEditConcert={handleEditConcert}
                  apiAction={apiAction}
                  shareInfo={shareInfo}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Menu Bar with 4 Rock/Punk Themed Tabs */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          nextHasNotes={nextHasNotes}
          upcomingConcertsCount={upcomingConcertsCount}
        />
      </div>

      {/* Global Modals (All original behaviors and forms preserved) */}
      <SettingsModal
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        data={data}
        apiAction={apiAction}
      />

      <AvailabilityModal
        isOpen={showAvailability}
        onClose={() => setShowAvailability(false)}
        data={data}
        showToast={showToast}
      />

      <NextSessionModal
        editingNext={editingNext}
        setEditingNext={setEditingNext}
        rehearsalForm={rehearsalForm}
        setRehearsalForm={setRehearsalForm}
        data={data}
        setShowAddRoom={setShowAddRoom}
        apiAction={apiAction}
      />

      <FutureSessionModal
        isOpen={showAddFuture}
        onClose={() => setShowAddFuture(false)}
        futureForm={futureForm}
        setFutureForm={setFutureForm}
        data={data}
        setShowAddRoom={setShowAddRoom}
        apiAction={apiAction}
      />

      <ConcertModal
        isOpen={showAddConcert}
        onClose={() => setShowAddConcert(false)}
        concertForm={concertForm}
        setConcertForm={setConcertForm}
        apiAction={apiAction}
      />

      <Modals
        data={data}
        showAddRoom={showAddRoom}
        setShowAddRoom={setShowAddRoom}
        showAddMember={showAddMember}
        setShowAddMember={setShowAddMember}
        apiAction={apiAction}
      />

      <Toast toast={toast} />
    </div>
  );
};

export default App;
