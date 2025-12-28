/**
 * Indian Standard Time (IST) Timezone Utilities
 * IST is UTC+5:30
 */

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Get current date and time in IST
 */
export function getNowIST() {
  const now = new Date();
  return toIST(now);
}

/**
 * Convert any Date to IST
 */
export function toIST(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Convert to IST timezone
  const istDate = new Date(d.toLocaleString("en-US", { timeZone: IST_TIMEZONE }));
  
  return istDate;
}

/**
 * Format date as YYYY-MM-DD in IST
 */
export function formatDateIST(date?: Date | string): string {
  const d = date ? toIST(date) : getNowIST();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format time as HH:MM in IST
 */
export function formatTimeIST(date?: Date | string): string {
  const d = date ? toIST(date) : getNowIST();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Format date and time for display in IST
 */
export function formatDateTimeIST(date: Date | string): string {
  const d = toIST(date);
  return d.toLocaleString("en-IN", { 
    timeZone: IST_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short"
  });
}

/**
 * Format date for display (e.g., "Dec 27")
 */
export function formatDateDisplayIST(date: Date | string): string {
  const d = toIST(date);
  return d.toLocaleDateString("en-IN", { 
    timeZone: IST_TIMEZONE,
    month: "short", 
    day: "numeric" 
  });
}

/**
 * Format time for display (e.g., "02:30 PM")
 */
export function formatTimeDisplayIST(date: Date | string): string {
  const d = toIST(date);
  return d.toLocaleTimeString("en-IN", { 
    timeZone: IST_TIMEZONE,
    hour: "2-digit", 
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Format weekday in IST (e.g., "Mon")
 */
export function formatWeekdayIST(date: Date | string): string {
  const d = toIST(date);
  return d.toLocaleDateString("en-IN", { 
    timeZone: IST_TIMEZONE,
    weekday: "short" 
  });
}

/**
 * Get IST date-time object with separate date and time strings
 * Useful for form inputs
 */
export function getISTDateTime(date?: Date | string) {
  const d = date ? toIST(date) : getNowIST();
  
  return {
    date: formatDateIST(d),
    time: formatTimeIST(d),
    dateTime: d
  };
}

/**
 * Create ISO string from date and time inputs (assumes inputs are in IST)
 */
export function createISOFromIST(dateStr: string, timeStr: string): string {
  // Create date in local context but interpret as IST
  const dateTime = `${dateStr}T${timeStr}:00`;
  const localDate = new Date(dateTime);
  
  // Get IST equivalent
  const istDate = new Date(localDate.toLocaleString("en-US", { timeZone: IST_TIMEZONE }));
  
  // Calculate offset to convert back to UTC for ISO string
  const offset = localDate.getTime() - istDate.getTime();
  const utcDate = new Date(localDate.getTime() - offset);
  
  return utcDate.toISOString();
}

/**
 * Create UTC Date object from IST date and time strings
 * This is for server-side use to properly store IST times in UTC
 */
export function createUTCDateFromIST(dateStr: string, timeStr: string): Date {
  // Parse the IST date and time
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create a date object treating the input as IST
  // We build the UTC timestamp by calculating: IST time - IST offset = UTC time
  // IST is UTC+5:30, so UTC = IST - 5:30
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000; // 5 hours 30 minutes in milliseconds
  
  // Create a UTC date with the given values (this treats them as UTC)
  const dateAsUTC = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  
  // Subtract IST offset to get the actual UTC time
  const utcDate = new Date(dateAsUTC - istOffsetMs);
  
  return utcDate;
}

/**
 * Get month bounds in IST
 */
export function getMonthBoundsIST(date: Date) {
  const d = toIST(date);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  
  return { 
    from: formatDateIST(start), 
    to: formatDateIST(end) 
  };
}
