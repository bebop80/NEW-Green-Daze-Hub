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

  const startMillis = startDate.getTime();
  const endMillis = endDate.getTime();

  const startStr = format(startDate, "yyyyMMdd'T'HHmmss");
  const endStr = format(endDate, "yyyyMMdd'T'HHmmss");

  const encTitle = encodeURIComponent(item.title);
  const encDetails = encodeURIComponent(item.description || item.subtitle || '');
  const encLocation = encodeURIComponent(item.location || '');

  // Web Google Calendar URL (Universal browser fallback)
  const googleWebUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encTitle}&details=${encDetails}&location=${encLocation}&dates=${startStr}/${endStr}`;

  // Android Native Calendar Intent (Opens whichever calendar app is installed on the phone/tablet)
  // We explicitly DO NOT hardcode package=com.google.android.calendar so Android can launch Samsung Calendar,
  // Google Calendar, Xiaomi Calendar, etc.
  // If no calendar app exists, S.browser_fallback_url redirects automatically to Google Calendar Web.
  const androidIntentUrl = `intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.dir/event;S.title=${encTitle};S.description=${encDetails};S.eventLocation=${encLocation};l.beginTime=${startMillis};l.endTime=${endMillis};S.browser_fallback_url=${encodeURIComponent(googleWebUrl)};end;`;

  // Generic ICS Content for Apple / other native calendars
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GreenDaze//Calendar//IT',
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
    nativeAndroidIntentUrl: androidIntentUrl,
    icsUrl,
    fileName
  };
}

export function openNativeCalendarPriority(item: CalendarEventItem, onDone?: () => void) {
  const { googleWebUrl, androidIntentUrl, icsUrl, fileName } = getCalendarExportDetails(item);
  const isAndroid = isAndroidDevice();
  const isApple = isAppleDevice();

  if (isAndroid) {
    // 1. First, attempt to open the native calendar app installed on the device
    let appLaunched = false;
    const onVisibilityChange = () => {
      if (document.hidden) {
        appLaunched = true;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange, { once: true });

    const start = Date.now();
    try {
      window.location.href = androidIntentUrl;
    } catch {
      // If intent fails immediately, fallback to Google Calendar Web
      window.open(googleWebUrl, '_blank', 'noopener,noreferrer');
      if (onDone) onDone();
      return;
    }

    // 2. Fallback: If after 1500ms the browser is still visible and focused,
    // no native calendar app caught the intent; redirect to Google Calendar Web.
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (!appLaunched && typeof document !== 'undefined' && document.visibilityState === 'visible' && (Date.now() - start < 2500)) {
        window.open(googleWebUrl, '_blank', 'noopener,noreferrer');
      }
    }, 1500);

    if (onDone) {
      setTimeout(onDone, 600);
    }
  } else if (isApple) {
    // On iPhone / iPad / Mac, open native Calendar via .ics download/sheet
    try {
      const link = document.createElement('a');
      link.href = icsUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(googleWebUrl, '_blank', 'noopener,noreferrer');
    }
    if (onDone) onDone();
  } else {
    // Desktop / other: open Google Calendar Web
    window.open(googleWebUrl, '_blank', 'noopener,noreferrer');
    if (onDone) onDone();
  }
}

// Backward-compatible alias
export const openGoogleCalendarPriority = openNativeCalendarPriority;

export function handleCalendarExport(item: CalendarEventItem, onOpenModal: (item: CalendarEventItem) => void) {
  let direct = false;
  try {
    direct = isMobileOrTablet() && typeof localStorage !== 'undefined' && localStorage.getItem('gd_direct_calendar_app') === 'true';
  } catch {
    direct = false;
  }

  if (direct) {
    openNativeCalendarPriority(item);
  } else {
    onOpenModal(item);
  }
}

