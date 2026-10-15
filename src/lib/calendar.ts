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

  const startMillis = startDate.getTime();
  const endMillis = endDate.getTime();

  const startStr = format(startDate, "yyyyMMdd'T'HHmmss");
  const endStr = format(endDate, "yyyyMMdd'T'HHmmss");

  const encTitle = encodeURIComponent(item.title);
  const encDetails = encodeURIComponent(item.description || item.subtitle || '');
  const encLocation = encodeURIComponent(item.location || '');

  // Web Google Calendar URL (Priority 2 / Desktop)
  const googleWebUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encTitle}&details=${encDetails}&location=${encLocation}&dates=${startStr}/${endStr}`;

  // Android Native Google Calendar Intent (Priority 1 for Android)
  // Action: android.intent.action.INSERT
  // Type: vnd.android.cursor.dir/event
  // Package: com.google.android.calendar
  // Fallback: S.browser_fallback_url (points to Google Calendar Web if app is not installed)
  const androidIntentUrl = `intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.dir/event;package=com.google.android.calendar;S.title=${encTitle};S.description=${encDetails};S.eventLocation=${encLocation};l.beginTime=${startMillis};l.endTime=${endMillis};S.browser_fallback_url=${encodeURIComponent(googleWebUrl)};end;`;

  // Generic ICS Content for Apple / other native calendars
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
    startMillis,
    endMillis,
    googleWebUrl,
    androidIntentUrl,
    icsUrl,
    fileName
  };
}

export function openGoogleCalendarPriority(item: CalendarEventItem, onDone?: () => void) {
  const { googleWebUrl, androidIntentUrl } = getCalendarExportDetails(item);
  const isAndroid = isAndroidDevice();

  if (isAndroid) {
    // Priority 1: Launch Android Google Calendar native app via Intent URI
    const start = Date.now();
    try {
      window.location.href = androidIntentUrl;
    } catch (e) {
      window.open(googleWebUrl, '_blank', 'noopener,noreferrer');
    }

    // Priority 2 Fallback: if after 1500ms browser is still visible and focused, open web version
    setTimeout(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && (Date.now() - start < 2500)) {
        window.open(googleWebUrl, '_blank', 'noopener,noreferrer');
      }
    }, 1500);

    if (onDone) {
      setTimeout(onDone, 600);
    }
  } else {
    // Desktop / iOS: Open Google Calendar Web
    window.open(googleWebUrl, '_blank', 'noopener,noreferrer');
    if (onDone) onDone();
  }
}

export function handleCalendarExport(item: CalendarEventItem, onOpenModal: (item: CalendarEventItem) => void) {
  const direct = isAndroidDevice() && typeof localStorage !== 'undefined' && localStorage.getItem('gd_direct_calendar_app') === 'true';
  if (direct) {
    openGoogleCalendarPriority(item);
  } else {
    onOpenModal(item);
  }
}

