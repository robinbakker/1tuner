export const getLocalTimeFromUrlKey = (key: string, timeZone?: string) => {
  try {
    const hourMatch = key.match(/h(\d+)/);
    if (!hourMatch) return undefined;
    let h = +hourMatch[1];
    if (h < 0 || h > 23) return undefined;

    const minuteMatch = key.match(/m(\d+)/);
    let m = minuteMatch ? +minuteMatch[1] : 0;
    if (m < 0 || m > 59) return undefined;

    if (timeZone) {
      const { hour, minute } = convertToTargetTimezone(h, m, timeZone);
      h = hour;
      m = minute;
    }

    return `${`${h}`.padStart(2, '0')}:${`${m}`.padStart(2, '0')}`;
  } catch {
    return undefined;
  }
};

export const getValidTimeZone = (timeZone: string | undefined) => {
  if (!!timeZone && isValidTimeZone(timeZone)) return timeZone;
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const convertToTargetTimezone = (hour: number, minute = 0, sourceTimeZone: string, targetTimeZone?: string) => {
  // First get a ISO string of the current date in UTC
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = now.getUTCDate().toString().padStart(2, '0');
  const hourStr = hour.toString().padStart(2, '0');
  const minuteStr = minute.toString().padStart(2, '0');

  // Create a Date object for the source timezone
  const sourceDate = new Date(`${year}-${month}-${day}T${hourStr}:${minuteStr}:00${getTimeZoneOffset(sourceTimeZone)}`);

  const timeZone = getValidTimeZone(targetTimeZone);

  // Convert the source date to the target timezone
  return {
    hour: +sourceDate.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: timeZone }),
    minute: +sourceDate.toLocaleString('en-US', { minute: 'numeric', timeZone: timeZone }),
  };
};

const getTimeZoneOffset = (timezone: string) => {
  const date = new Date();
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone })).getTime();
  const offset = (tzDate - utcDate) / 60000; // Offset in minutes

  const hours = Math.floor(Math.abs(offset) / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
  return `${offset >= 0 ? '+' : '-'}${hours}:${minutes}`;
};

const isValidTimeZone = (timezone: string) => {
  try {
    // Try to create a Date object with the given timezone to validate it
    new Date().toLocaleString('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};
