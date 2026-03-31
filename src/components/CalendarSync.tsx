import { useState, useRef, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { CalendarEvent, openGoogleCalendar, downloadICS } from '../utils/calendarExport';

interface Props {
  event: CalendarEvent;
  size?: 'sm' | 'md';
}

export default function CalendarSync({ event, size = 'sm' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const iconClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
        title="סנכרון ליומן"
      >
        <CalendarDays className={iconClass} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-48" dir="rtl">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-slate-100">
            הוסף ליומן
          </div>

          {/* Google Calendar */}
          <button
            onClick={() => { openGoogleCalendar(event); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-sm text-slate-700"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="3" fill="#fff"/>
              <path d="M18 6H6v12h12V6z" fill="#fff" stroke="#e5e7eb"/>
              <path d="M9 2v4M15 2v4M6 10h12" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 14l2 2 4-4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Google Calendar
          </button>

          {/* Apple / iCal */}
          <button
            onClick={() => { downloadICS(event); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-sm text-slate-700"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="3" fill="#fff" stroke="#e5e7eb"/>
              <rect x="4" y="6" width="16" height="14" rx="1.5" fill="#FF3B30"/>
              <rect x="4" y="6" width="16" height="4" fill="#FF3B30"/>
              <rect x="4" y="6" width="16" height="3" rx="1" fill="#FF453A"/>
              <text x="12" y="17" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="system-ui">
                {new Date().getDate()}
              </text>
              <line x1="8" y1="4" x2="8" y2="8" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="16" y1="4" x2="16" y2="8" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Apple / iCloud
          </button>
        </div>
      )}
    </div>
  );
}
