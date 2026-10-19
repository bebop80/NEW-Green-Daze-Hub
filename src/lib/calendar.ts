import { format } from 'date-fns';
import { safeParseLocal } from './utils';

export interface CalendarEventItem {
  title: string;
  subtitle?: string;
  date: string;
  timeFrom?: string;
  timeTo?: string;
  location?: string;
  description?: string;
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
}

export function isMobileOrTablet(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isOtherMobile = /Mobile|Tablet|Silk|Kindle/i.test(ua);
  return isAndroid || isIOS || isOtherMobile;
}

export function getCalendarExportDetails(item: CalendarEventItem) {
  const dateObj = safeParseLocal(item.date);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();

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

  const startDate = new Date(year, month, day, startH, startM, 0, 0);
  let endDate = new Date(year, month, day, endH, endM, 0, 0);
  if (endDate.getTime() <= startDate.getTime()) {
    // Overnight event rollover
    endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  }

  const startStr = format(startDate, "yyyyMMdd'T'HHmmss");
  const endStr = format(endDate, "yyyyMMdd'T'HHmmss");

  const encTitle = encodeURIComponent(item.title);
  const encDetails = encodeURIComponent(item.description || item.subtitle || '');
  const encLocation = encodeURIComponent(item.location || '');

  // Web Google Calendar URL
  const googleWebUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encTitle}&details=${encDetails}&location=${encLocation}&dates=${startStr}/${endStr}`;

  // Standard VCALENDAR (.ics) Content - perfectly compatible with iOS & Android native calendar apps
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

  return {
    dateObj,
    startDate,
    endDate,
    googleWebUrl,
    icsUrl,
    icsContent,
    fileName
  };
}

export function openNativeCalendarPriority(item: CalendarEventItem, onDone?: () => void) {
  const { icsUrl, fileName, icsContent } = getCalendarExportDetails(item);
  try {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch {
    window.location.href = icsUrl;
  }
  if (onDone) onDone();
}

// Backward-compatible alias
export const openGoogleCalendarPriority = openNativeCalendarPriority;

export function handleCalendarExport(item: CalendarEventItem, onOpenModal: (item: CalendarEventItem) => void) {
  onOpenModal(item);
}
