export interface CalendarEvent {
  title: string;
  startDate: string; // ISO datetime or date string
  endDate?: string;  // ISO datetime or date string
  location?: string;
  description?: string;
  allDay?: boolean;
}

// Format date to Google Calendar format: YYYYMMDDTHHmmssZ or YYYYMMDD for all-day
function toGCalDate(dateStr: string, allDay = false): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    if (allDay) {
      return d.toISOString().replace(/[-:]/g, '').split('T')[0];
    }
    return d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  } catch {
    return '';
  }
}

// Format date to ICS format
function toICSDate(dateStr: string, allDay = false): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    if (allDay) {
      return d.toISOString().replace(/[-:]/g, '').split('T')[0];
    }
    return d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  } catch {
    return '';
  }
}

function escapeICS(str: string): string {
  return (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function openGoogleCalendar(event: CalendarEvent) {
  const start = toGCalDate(event.startDate, event.allDay);
  const end = event.endDate
    ? toGCalDate(event.endDate, event.allDay)
    : start; // same-day event

  if (!start) return;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    ...(event.location ? { location: event.location } : {}),
    ...(event.description ? { details: event.description } : {}),
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
}

export function downloadICS(event: CalendarEvent) {
  const start = toICSDate(event.startDate, event.allDay);
  const end = event.endDate
    ? toICSDate(event.endDate, event.allDay)
    : start;

  if (!start) return;

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@trip-manager`;
  const now = toICSDate(new Date().toISOString());

  const datePrefix = event.allDay ? 'DATE' : 'DATE-TIME';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trip Manager//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    event.allDay
      ? `DTSTART;VALUE=${datePrefix}:${start}`
      : `DTSTART:${start}`,
    event.allDay
      ? `DTEND;VALUE=${datePrefix}:${end}`
      : `DTEND:${end}`,
    `SUMMARY:${escapeICS(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeICS(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${escapeICS(event.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^\w\s-]/g, '')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helpers per event type ──

import { Flight, Hotel, CarRental, Activity } from '../types';

export function flightToCalendarEvent(f: Flight): CalendarEvent {
  return {
    title: `טיסה ${f.airline} ${f.flightNumber}: ${f.from} → ${f.to}`,
    startDate: f.departure,
    endDate: f.arrival || f.departure,
    location: f.from,
    description: [
      f.flightNumber && `מספר טיסה: ${f.flightNumber}`,
      f.confirmation && `מספר אישור: ${f.confirmation}`,
      f.notes,
    ].filter(Boolean).join('\n'),
  };
}

export function hotelToCalendarEvent(h: Hotel): CalendarEvent {
  return {
    title: `מלון: ${h.name}`,
    startDate: h.checkIn,
    endDate: h.checkOut,
    location: h.address || h.city,
    description: [
      h.city && `עיר: ${h.city}`,
      h.confirmation && `מספר אישור: ${h.confirmation}`,
      h.notes,
    ].filter(Boolean).join('\n'),
    allDay: true,
  };
}

export function carRentalToCalendarEvent(c: CarRental): CalendarEvent {
  return {
    title: `השכרת רכב: ${c.company} — ${c.carType}`,
    startDate: c.pickupDate,
    endDate: c.returnDate,
    location: c.pickupLocation,
    description: [
      `איסוף: ${c.pickupLocation}`,
      `החזרה: ${c.dropoffLocation}`,
      c.confirmation && `מספר אישור: ${c.confirmation}`,
      c.notes,
    ].filter(Boolean).join('\n'),
    allDay: true,
  };
}

export function activityToCalendarEvent(a: Activity): CalendarEvent {
  const dateTime = a.date && a.time ? `${a.date}T${a.time}` : a.date;
  return {
    title: `${a.category}: ${a.name}`,
    startDate: dateTime,
    endDate: dateTime,
    location: a.location,
    description: [
      a.location && `מיקום: ${a.location}`,
      a.notes,
    ].filter(Boolean).join('\n'),
    allDay: !a.time,
  };
}
