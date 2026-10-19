import React from 'react';
import { Calendar, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  CalendarEventItem, 
  getCalendarExportDetails 
} from '../../lib/calendar';

export type { CalendarEventItem };

interface CalendarExportModalProps {
  item: CalendarEventItem | null;
  onClose: () => void;
}

export const CalendarExportModal: React.FC<CalendarExportModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const {
    dateObj,
    googleWebUrl,
    icsUrl,
    fileName,
    icsContent
  } = getCalendarExportDetails(item);

  const handleIcsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Attempt modern Blob download first for maximal compatibility, fallback to data URI
    try {
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      e.preventDefault();
    } catch {
      // Allow default <a> href with data: URI to proceed
    }
    onClose();
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

        {/* Calendar Action Options - faithfully matching the original GreenDazeHub project */}
        <div className="space-y-2.5 pt-1">
          {/* Option 1: Native Phone / Apple Calendar (.ics) - opens native calendar app on phone/tablet */}
          <a
            href={icsUrl}
            download={fileName}
            onClick={handleIcsClick}
            className="w-full flex items-center gap-3 p-3.5 bg-[#222226] hover:bg-brand-green/20 border border-zinc-700 hover:border-brand-green/60 rounded-xl text-white font-medium text-sm transition-all group text-left cursor-pointer"
          >
            <span className="text-2xl shrink-0">🍏</span>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-semibold text-white group-hover:text-brand-green transition-colors text-sm">
                Apple / Calendario Nativo (.ics)
              </span>
              <span className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                Scarica ed apri nell'app calendario
              </span>
            </div>
          </a>

          {/* Option 2: Google Calendar */}
          <a
            href={googleWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center gap-3 p-3.5 bg-[#222226] hover:bg-brand-green/20 border border-zinc-700 hover:border-brand-green/60 rounded-xl text-white font-medium text-sm transition-all group text-left cursor-pointer"
          >
            <span className="text-2xl shrink-0">📅</span>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-semibold text-white group-hover:text-brand-green transition-colors text-sm">
                Google Calendar
              </span>
              <span className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                Apri web o app Google Calendar
              </span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
