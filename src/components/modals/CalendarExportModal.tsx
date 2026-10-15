import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, X, ExternalLink, Download, Smartphone, Globe, Check } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  CalendarEventItem, 
  getCalendarExportDetails, 
  openGoogleCalendarPriority, 
  isAndroidDevice, 
  isAppleDevice 
} from '../../lib/calendar';

export type { CalendarEventItem };

interface CalendarExportModalProps {
  item: CalendarEventItem | null;
  onClose: () => void;
}

export const CalendarExportModal: React.FC<CalendarExportModalProps> = ({ item, onClose }) => {
  const [directAppPref, setDirectAppPref] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    setIsAndroid(isAndroidDevice());
    setIsApple(isAppleDevice());
    const stored = localStorage.getItem('gd_direct_calendar_app');
    if (stored === 'true') {
      setDirectAppPref(true);
    }
  }, []);

  if (!item) return null;

  const {
    dateObj,
    googleWebUrl,
    androidIntentUrl,
    icsUrl,
    fileName
  } = getCalendarExportDetails(item);

  const toggleDirectPref = (checked: boolean) => {
    setDirectAppPref(checked);
    localStorage.setItem('gd_direct_calendar_app', checked ? 'true' : 'false');
  };

  const handleGoogleCalendarAction = (e: React.MouseEvent) => {
    if (isAndroid) {
      // Priority 1: Launch Android app intent, fallback to web
      e.preventDefault();
      openGoogleCalendarPriority(item, onClose);
    } else {
      // Desktop / other: open web calendar
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        style={{ backgroundColor: '#18181b', color: '#ffffff' }}
        className="border border-brand-green/50 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4 text-left relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-700/60">
          <div className="flex items-center gap-2 text-brand-green font-bold text-base">
            <Calendar size={20} />
            <span>Aggiungi al Calendario</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        {/* Event Preview Card */}
        <div className="text-xs text-zinc-300 bg-[#111113] p-3 rounded-xl border border-zinc-800 space-y-1.5">
          <div className="font-bold text-white text-sm leading-tight">{item.title}</div>
          <div className="text-brand-green font-mono text-xs font-bold flex items-center gap-1.5">
            <Calendar size={13} className="shrink-0 text-brand-green" />
            <span>
              {format(dateObj, 'EEEE d MMMM yyyy', { locale: it })}
              {item.timeFrom ? ` (${item.timeFrom}${item.timeTo ? ` - ${item.timeTo}` : ''})` : ''}
            </span>
          </div>
          {item.location && (
            <div className="text-zinc-400 text-xs flex items-center gap-1.5 break-words">
              <MapPin size={12} className="shrink-0 text-brand-green" />
              <span>{item.location}</span>
            </div>
          )}
        </div>

        {/* Android Priority Notice */}
        {isAndroid && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] leading-snug">
            <Smartphone size={14} className="shrink-0 text-emerald-400" />
            <span>
              <strong>Smartphone Android:</strong> apertura prioritaria sull'app Google Calendar.
            </span>
          </div>
        )}

        {/* Calendar Action Options */}
        <div className="space-y-2.5 pt-0.5">
          {/* Priority 1 Option: Google Calendar */}
          <div className="space-y-1.5">
            <a
              href={isAndroid ? androidIntentUrl : googleWebUrl}
              target={isAndroid ? '_self' : '_blank'}
              rel="noopener noreferrer"
              onClick={handleGoogleCalendarAction}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all group cursor-pointer ${
                isAndroid 
                  ? 'bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-500/60 hover:border-emerald-400 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/20' 
                  : 'bg-[#222226] hover:bg-brand-green/20 border-zinc-700 hover:border-brand-green/60'
              }`}
            >
              <span className="text-2xl shrink-0">📅</span>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-white group-hover:text-brand-green transition-colors text-sm">
                    {isAndroid ? 'Google Calendar (App)' : 'Google Calendar'}
                  </span>
                  {isAndroid && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                      Priorità 1 App
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  {isAndroid 
                    ? 'Apre l\'app Google Calendar sul telefono (fallback Web)' 
                    : 'Apri nella versione Web di Google Calendar'}
                </span>
              </div>
            </a>

            {/* If on Android, also provide direct Web link if user specifically wants browser */}
            {isAndroid && (
              <a
                href={googleWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <Globe size={12} className="text-zinc-500" />
                <span>Oppure apri versione Google Calendar Web</span>
                <ExternalLink size={10} className="text-zinc-500" />
              </a>
            )}
          </div>

          {/* Option 2: Apple Calendar / Generic .ics */}
          <a
            href={icsUrl}
            download={fileName}
            onClick={onClose}
            className="w-full flex items-center gap-3 p-3.5 bg-[#222226] hover:bg-brand-green/20 border border-zinc-700 hover:border-brand-green/60 rounded-xl text-white font-medium text-sm transition-all group text-left cursor-pointer"
          >
            <span className="text-2xl shrink-0">🍏</span>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-semibold text-white group-hover:text-brand-green transition-colors text-sm">
                Apple / Altri (.ics)
              </span>
              <span className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                Scarica file ed apri con Calendario nativo
              </span>
            </div>
            <Download size={15} className="text-zinc-500 group-hover:text-brand-green shrink-0" />
          </a>
        </div>

        {/* Android Instant 1-Touch Preference */}
        {isAndroid && (
          <div className="pt-2 border-t border-zinc-800/80">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox"
                checked={directAppPref}
                onChange={(e) => toggleDirectPref(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-brand-green focus:ring-brand-green/30 cursor-pointer w-3.5 h-3.5"
              />
              <span className="text-[11px] text-zinc-400 group-hover:text-zinc-300 transition-colors">
                Apri direttamente l'app al tocco dei tasti Calendario
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
