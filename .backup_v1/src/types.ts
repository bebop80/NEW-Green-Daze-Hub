export interface Member { name: string; color: string; }
export interface Payment { date: string; payer: string; amount?: number; notes?: string; }
export interface Concert { 
  id: string; 
  date: string; 
  name: string; 
  address?: string; 
  time?: string; 
  soundcheck?: string; 
  cachet?: string; 
  notes?: string; 
}
export interface Room { id: string; name: string; address?: string; }
export interface Rehearsal { date: string; from: string; to: string; room: string; notes: string; sharedExpense?: boolean; }
export interface FutureRehearsal { id: string; date: string; from: string; to: string; room: string; notes?: string; payer?: string; sharedExpense?: boolean; }
export interface SettingsData { NomeBand?: string; ColoreBand?: string; }

export type AvailabilityStatus = 'available' | 'doubtful' | 'unavailable';
export type MemberAvailabilityMap = Record<string, Record<string, AvailabilityStatus>>;

export interface AppData {
  payments: Payment[];
  concerts: Concert[];
  customRooms: Room[];
  members: Member[];
  settings: SettingsData;
  next: Rehearsal;
  futureRehearsals: FutureRehearsal[];
}
