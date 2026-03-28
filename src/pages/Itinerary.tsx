import { useCurrentTripData } from '../store/tripStore';
import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import { eachDayOfInterval, parseISO, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useState } from 'react';

const CATEGORY_COLORS: Record<string, string> = {
  תרבות: 'border-purple-400 bg-purple-50',
  טבע: 'border-green-400 bg-green-50',
  אוכל: 'border-orange-400 bg-orange-50',
  קניות: 'border-pink-400 bg-pink-50',
  בידור: 'border-yellow-400 bg-yellow-50',
  ספורט: 'border-blue-400 bg-blue-50',
  אחר: 'border-slate-300 bg-slate-50',
};

export default function Itinerary() {
  const { trip, activities, updateActivity } = useCurrentTripData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({});

  let days: Date[] = [];
  try {
    days = eachDayOfInterval({ start: parseISO(trip.startDate), end: parseISO(trip.endDate) });
  } catch {
    days = [];
  }

  const getActivitiesForDay = (dateStr: string) =>
    activities
      .filter(a => a.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-blue-500" /> מסלול יומי
      </h1>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedDate(null)}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedDate === null ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          כל הימים
        </button>
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const count = getActivitiesForDay(dateStr).length;
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`shrink-0 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedDate === dateStr ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div>{format(day, 'dd/MM')}</div>
              <div className="text-xs opacity-75">{count > 0 ? `${count} פעילויות` : 'ריק'}</div>
            </button>
          );
        })}
      </div>

      {/* Day cards */}
      <div className="space-y-6">
        {days
          .filter(day => selectedDate === null || format(day, 'yyyy-MM-dd') === selectedDate)
          .map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayActivities = getActivitiesForDay(dateStr);
            const dayLabel = format(day, 'EEEE, d MMMM yyyy', { locale: he });

            return (
              <div key={dateStr} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Day header */}
                <div className="bg-gradient-to-l from-blue-600 to-blue-500 text-white px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm opacity-75">יום {idx + 1}</span>
                    <h2 className="font-semibold text-lg capitalize">{dayLabel}</h2>
                  </div>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {dayActivities.length} פעילויות
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  {/* Notes */}
                  <div>
                    <input
                      placeholder="הוסף הערה ליום זה..."
                      value={dayNotes[dateStr] ?? ''}
                      onChange={e => setDayNotes(prev => ({ ...prev, [dateStr]: e.target.value }))}
                      className="w-full text-sm text-slate-600 border-0 border-b border-slate-200 focus:border-blue-400 outline-none pb-1 bg-transparent"
                    />
                  </div>

                  {dayActivities.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">אין פעילויות מתוכננות ליום זה</p>
                  ) : (
                    <div className="space-y-2">
                      {dayActivities.map(act => (
                        <div
                          key={act.id}
                          className={`border-r-4 rounded-lg p-3 ${CATEGORY_COLORS[act.category] || CATEGORY_COLORS['אחר']}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-800">{act.name}</span>
                                {act.booked && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                              <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
                                {act.time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{act.time}
                                  </span>
                                )}
                                {act.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />{act.location}
                                  </span>
                                )}
                              </div>
                              {act.notes && <p className="text-xs text-slate-500 mt-1">{act.notes}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={act.booked}
                                onChange={() => updateActivity(act.id, { booked: !act.booked })}
                                className="w-4 h-4 accent-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
