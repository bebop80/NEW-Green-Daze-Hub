import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeParseLocal(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // If we have a pure date string without timezone info (e.g., "2026-06-21")
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day, 12, 0, 0); // Local noon prevents shifting
  }
  
  // If we have an ISO date string (e.g. "2026-06-20T22:00:00.000Z"),
  // convert it to a Date object, retrieve its fields in the Europe/Rome timezone,
  // and construct a local Date object at noon on that day!
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date();
  
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    
    // formatter returns e.g. "6/21/2026"
    const parts = formatter.formatToParts(d);
    let year = d.getFullYear();
    let month = d.getMonth();
    let day = d.getDate();
    
    parts.forEach(p => {
      if (p.type === 'year') year = parseInt(p.value, 10);
      else if (p.type === 'month') month = parseInt(p.value, 10) - 1;
      else if (p.type === 'day') day = parseInt(p.value, 10);
    });
    
    return new Date(year, month, day, 12, 0, 0); // Local noon prevents shifting
  } catch (e) {
    return d;
  }
}

export function toLocalYYYYMMDD(dateStr: string): string {
  if (!dateStr) return '';
  
  // If it's already a pure date string (e.g., "2026-06-21"), return it directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // formatter returns "MM/DD/YYYY" by default with en-US
    const formatted = formatter.format(d);
    const [month, day, year] = formatted.split('/');
    return `${year}-${month}-${day}`;
  } catch (e) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
