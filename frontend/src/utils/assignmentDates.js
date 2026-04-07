const DATE_PART_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const TIME_PART_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DUE_TIME = '23:59';

function extractDateParts(dateValue) {
  if (!dateValue) {
    return null;
  }

  const match = String(dateValue).match(DATE_PART_PATTERN);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    datePart: `${year}-${month}-${day}`,
  };
}

function extractTimeParts(timeValue) {
  if (!timeValue) {
    return null;
  }

  const match = String(timeValue).match(TIME_PART_PATTERN);
  if (!match) {
    return null;
  }

  const [, hours, minutes] = match;
  return {
    hours: Number(hours),
    minutes: Number(minutes),
    timePart: `${hours}:${minutes}`,
  };
}

function parseDateValue(dateValue) {
  if (!dateValue) {
    return null;
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function getTimeZoneOffset(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
  const minutes = String(absoluteOffset % 60).padStart(2, '0');

  return `${sign}${hours}:${minutes}`;
}

export function formatAssignmentDate(dateValue) {
  const parts = extractDateParts(dateValue);
  if (!parts) {
    return 'TBD';
  }

  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utcDate);
}

export function formatAssignmentInputDate(dateValue) {
  const parsedDate = parseDateValue(dateValue);
  if (!parsedDate) {
    return '';
  }

  return [
    parsedDate.getFullYear(),
    String(parsedDate.getMonth() + 1).padStart(2, '0'),
    String(parsedDate.getDate()).padStart(2, '0'),
  ].join('-');
}

export function formatAssignmentInputTime(dateValue) {
  const parsedDate = parseDateValue(dateValue);
  if (!parsedDate) {
    return '';
  }

  return `${String(parsedDate.getHours()).padStart(2, '0')}:${String(
    parsedDate.getMinutes()
  ).padStart(2, '0')}`;
}

export function formatRelativeDueDate(dateValue) {
  if (!dateValue) {
    return 'No due date';
  }

  const dueDate = new Date(dateValue);
  if (Number.isNaN(dueDate.getTime())) {
    return 'No due date';
  }

  const relativeFormatter = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
  });
  const difference = dueDate.getTime() - Date.now();
  const absoluteDifference = Math.abs(difference);

  if (absoluteDifference >= DAY_IN_MS) {
    return relativeFormatter.format(Math.round(difference / DAY_IN_MS), 'day');
  }

  const hourInMs = 60 * 60 * 1000;
  if (absoluteDifference >= hourInMs) {
    return relativeFormatter.format(Math.round(difference / hourInMs), 'hour');
  }

  return relativeFormatter.format(Math.round(difference / (60 * 1000)), 'minute');
}

export function toAssignmentDueDate(dateValue, timeValue = DEFAULT_DUE_TIME) {
  const parts = extractDateParts(dateValue);
  const timeParts = extractTimeParts(timeValue) ?? extractTimeParts(DEFAULT_DUE_TIME);

  if (!parts || !timeParts) {
    return '';
  }

  const localDueDate = new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    timeParts.hours,
    timeParts.minutes,
    0,
    0
  );

  return `${parts.datePart}T${timeParts.timePart}:00.000${getTimeZoneOffset(localDueDate)}`;
}

export function getTomorrowDateInputValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, '0'),
    String(tomorrow.getDate()).padStart(2, '0'),
  ].join('-');
}

export function sortAssignmentsByDueDate(assignments = []) {
  return [...assignments].sort(
    (left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
  );
}
