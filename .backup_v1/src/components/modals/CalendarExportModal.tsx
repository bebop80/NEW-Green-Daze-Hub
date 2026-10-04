import React from 'react';
import { Calendar, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';
import { safeParseLocal } from '../../lib/utils';

export interface CalendarEventItem {
  title: string;
  subtitle?: string;
  date: string;
  timeFrom?: string;
  timeTo?: string;
  location?: string;
  description?: string;
}

interface CalendarExportModalProps {
  item: CalendarEventItem | null;
  onClose: () => void;
}

export const CalendarExportModal: React.FC<CalendarExportModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const dateObj = safeParseLocal(item.date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  let startH = 21, startM = 0;
  if (item.timeFrom) {
    const parts = item.timeFrom.split(/[:.]/);
    if (parts[0] && !isNaN(parseInt(parts[0], 10))) {
      startH = parseInt(parts[0], 10);
      if (parts[1] && !isNaN(parseInt(parts[1], 10))) {
        startM = parseInt(parts[1], 10);
      }
    }
  }

  let endH = startH + 2, endM = startM;
  if (item.timeTo) {
    const parts = item.timeTo.split(/[:.]/);
    if (parts[0] && !isNaN(parseInt(parts[0], 10))) {
      endH = parseInt(parts[0], 10);
      if (parts[1] && !isNaN(parseInt(parts[1], 10))) {
        endM = parseInt(parts[1], 10);
      }
    }
  }

  const startHStr = String(startH).padStart(2, '0');
  const startMStr = String(startM).padStart(2, '0');
  const endHStr = String(endH).padStart(2, '0');
  const endMStr = String(endM).padStart(2, '0');

  const startStr = `${year}${month}${day}T${startHStr}${startMStr}00`;
  const endStr = `${year}${month}${day}T${endHStr}${endMStr}00`;

  const encTitle = encodeURIComponent(item.title);
  const encDetails = encodeURIComponent(item.description || item.subtitle || '');
  const encLocation = encodeURIComponent(item.location || '');

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encTitle}&details=${encDetails}&location=${encLocation}&dates=${startStr}/${endStr}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BandApp//Calendar//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${item.title}`,
    `LOCATION:${item.location || ''}`,
    `DESCRIPTION:${item.description || item.subtitle || ''}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const icsUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
  const fileName = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        style={{ backgroundColor: '#18181b', color: '#ffffff' }}
        className="border border-brand-green/50 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4 text-left relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="text-xs text-zinc-300 bg-[#111113] p-3 rounded-xl border border-zinc-800 space-y-1">
          <div className="font-bold text-white text-sm">{item.title}</div>
          <div className="text-brand-green font-mono text-xs font-bold">
            {format(dateObj, 'dd MMMM yyyy')} {item.timeFrom ? `(${item.timeFrom}${item.timeTo ? ` - ${item.timeTo}` : ''})` : ''}
          </div>
          {item.location && (
            <div className="text-zinc-400 text-xs flex items-center gap-1.5 break-words">
              <MapPin size={12} className="shrink-0 text-brand-green" />
              <span>{item.location}</span>
            </div>
          )}
        </div>

        <div className="space-y-2.5 pt-1">
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 p-3.5 bg-[#222226] hover:bg-brand-green/20 border border-zinc-700 hover:border-brand-green/60 rounded-xl text-white font-medium text-sm transition-all group cursor-pointer"
          >
            <span className="text-2xl">📅</span>
            <div className="flex flex-col">
              <span className="font-semibold text-white group-hover:text-brand-green transition-colors">Google Calendar</span>
              <span className="text-[11px] text-zinc-400">Apri web o app Google Calendar</span>
            </div>
          </a>

          <a
            href={icsUrl}
            download={fileName}
            onClick={onClose}
            className="w-full flex items-center gap-3 p-3.5 bg-[#222226] hover:bg-brand-green/20 border border-zinc-700 hover:border-brand-green/60 rounded-xl text-white font-medium text-sm transition-all group text-left cursor-pointer"
          >
            <span className="text-2xl">🍏</span>
            <div className="flex flex-col">
              <span className="font-semibold text-white group-hover:text-brand-green transition-colors">Apple / Calendario Nativo (.ics)</span>
              <span className="text-[11px] text-zinc-400">Scarica ed apri nell'app calendario</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
