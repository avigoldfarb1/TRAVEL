import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { decodeSharedTrip, SharedTripData } from '../utils/shareTrip';
import { format, parseISO, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Plane, Building2, Car, MapPin, Calendar, Clock,
  AlertCircle, Eye, Star, ChevronDown, ChevronUp,
  Edit3, Check, X, Save,
} from 'lucide-react';

type Tab = 'overview' | 'flights' | 'hotels' | 'cars' | 'activities';

type ActivityEdit = { booked?: boolean; notes?: string };
type ItemEdit = { notes?: string };
type LocalEdits = {
  activities: Record<string, ActivityEdit>;
  flights: Record<string, ItemEdit>;
  hotels: Record<string, ItemEdit>;
  carRentals: Record<string, ItemEdit>;
};

const FLIGHT_TYPES: Record<string, string> = { outbound: 'הלוך', return: 'חזור', connecting: 'מעבר' };
const CATEGORY_COLORS: Record<string, string> = {
  תרבות: 'bg-purple-100 text-purple-700', טבע: 'bg-green-100 text-green-700',
  אוכל: 'bg-orange-100 text-orange-700', קניות: 'bg-pink-100 text-pink-700',
  בידור: 'bg-yellow-100 text-yellow-700', ספורט: 'bg-blue-100 text-blue-700',
  אחר: 'bg-slate-100 text-slate-700',
};

function fmt(dateStr: string) {
  try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: he }); } catch { return dateStr || '—'; }
}
function fmtDT(dateStr: string) {
  try { return format(parseISO(dateStr), 'dd/MM/yyyy HH:mm', { locale: he }); } catch { return dateStr || '—'; }
}

function editsKey(hash: string): string {
  return `shared-trip-edits:${hash.slice(0, 40)}`;
}

function loadEdits(hash: string): LocalEdits {
  try {
    const raw = localStorage.getItem(editsKey(hash));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { activities: {}, flights: {}, hotels: {}, carRentals: {} };
}

function saveEdits(hash: string, edits: LocalEdits) {
  try {
    localStorage.setItem(editsKey(hash), JSON.stringify(edits));
  } catch { /* ignore */ }
}

export default function SharedTrip() {
  const navigate = useNavigate();
  const [data, setData] = useState<SharedTripData | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [edits, setEdits] = useState<LocalEdits>({ activities: {}, flights: {}, hotels: {}, carRentals: {} });
  const [savedBanner, setSavedBanner] = useState(false);

  const hash = window.location.hash.slice(1);

  useEffect(() => {
    if (!hash) { setError(true); return; }
    const decoded = decodeSharedTrip(hash);
    if (!decoded) { setError(true); return; }
    setData(decoded);
    setEdits(loadEdits(hash));
  }, []);

  const persistEdits = useCallback((next: LocalEdits) => {
    setEdits(next);
    saveEdits(hash, next);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  }, [hash]);

  const setActivityEdit = (id: string, patch: ActivityEdit) => {
    persistEdits({
      ...edits,
      activities: { ...edits.activities, [id]: { ...edits.activities[id], ...patch } },
    });
  };

  const setItemEdit = (section: 'flights' | 'hotels' | 'carRentals', id: string, patch: ItemEdit) => {
    persistEdits({
      ...edits,
      [section]: { ...edits[section], [id]: { ...edits[section][id], ...patch } },
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">קישור לא תקין</h2>
          <p className="text-slate-500 text-sm">הקישור שגוי או שפג תוקפו. בקש מבעל הטיול קישור חדש.</p>
          <button onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
            כניסה למערכת
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const { trip, flights, hotels, carRentals, activities, canEdit } = data;
  const tripDays = trip.startDate && trip.endDate
    ? differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1
    : null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'overview', label: 'סקירה', icon: <Calendar className="w-4 h-4" />, count: 0 },
    { id: 'flights', label: 'טיסות', icon: <Plane className="w-4 h-4" />, count: flights.length },
    { id: 'hotels', label: 'מלונות', icon: <Building2 className="w-4 h-4" />, count: hotels.length },
    { id: 'cars', label: 'רכב', icon: <Car className="w-4 h-4" />, count: carRentals.length },
    { id: 'activities', label: 'פעילויות', icon: <MapPin className="w-4 h-4" />, count: activities.length },
  ];

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">

      {/* Banner */}
      <div className={`text-white text-center text-xs py-2 px-4 flex items-center justify-center gap-2 ${canEdit ? 'bg-orange-500' : 'bg-indigo-600'}`}>
        {canEdit
          ? <><Edit3 className="w-3.5 h-3.5 shrink-0" /> מצב עריכה — מחירים ותקציב אינם מוצגים. השינויים נשמרים בדפדפן שלך.</>
          : <><Eye className="w-3.5 h-3.5 shrink-0" /> מצב צפייה בלבד — מחירים ותקציב אינם מוצגים</>
        }
        <button onClick={() => navigate('/login')} className="underline opacity-80 hover:opacity-100 mr-3">
          כניסה למערכת
        </button>
      </div>

      {/* Saved notification */}
      {savedBanner && (
        <div className="bg-green-500 text-white text-xs text-center py-1.5 flex items-center justify-center gap-1.5 animate-pulse">
          <Check className="w-3.5 h-3.5" /> השינויים נשמרו
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-bl from-blue-700 to-blue-500 text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">{trip.name}</h1>
              <p className="text-blue-100 text-lg mt-1">{trip.destination}</p>
            </div>
            {canEdit && (
              <span className="bg-orange-400/80 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 self-start mt-1">
                <Edit3 className="w-3.5 h-3.5" /> הרשאת עריכה
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-blue-100">
            {trip.startDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {fmt(trip.startDate)} — {fmt(trip.endDate)}
              </span>
            )}
            {tripDays && (
              <span className="bg-white/20 rounded-full px-3 py-0.5 font-medium">
                {tripDays} ימים
              </span>
            )}
          </div>
          {trip.notes && <p className="mt-3 text-blue-50 text-sm max-w-xl">{trip.notes}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.icon} {t.label}
              {t.count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === t.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'טיסות', value: flights.length, icon: <Plane className="w-5 h-5 text-blue-500" /> },
              { label: 'מלונות', value: hotels.length, icon: <Building2 className="w-5 h-5 text-purple-500" /> },
              { label: 'השכרות רכב', value: carRentals.length, icon: <Car className="w-5 h-5 text-green-500" /> },
              { label: 'פעילויות', value: activities.length, icon: <MapPin className="w-5 h-5 text-orange-500" /> },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
                <div className="flex justify-center mb-2">{card.icon}</div>
                <div className="text-2xl font-bold text-slate-800">{card.value}</div>
                <div className="text-sm text-slate-500 mt-1">{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Flights */}
        {tab === 'flights' && (
          <div className="space-y-3">
            {flights.length === 0 && <Empty text="אין טיסות" />}
            {flights.map(f => {
              const fe = edits.flights[f.id] ?? {};
              return (
                <div key={f.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Plane className="w-5 h-5 text-blue-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-800">{f.airline} {f.flightNumber}</div>
                        <div className="text-sm text-slate-500">{f.from} → {f.to}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      f.type === 'outbound' ? 'bg-green-100 text-green-700' :
                      f.type === 'return' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                    }`}>{FLIGHT_TYPES[f.type] ?? f.type}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                    <div><span className="text-slate-400">יציאה: </span>{fmtDT(f.departure)}</div>
                    <div><span className="text-slate-400">הגעה: </span>{fmtDT(f.arrival)}</div>
                    {f.confirmation && <div><span className="text-slate-400">אישור: </span>{f.confirmation}</div>}
                  </div>
                  {/* Original notes */}
                  {f.notes && !fe.notes && <p className="mt-2 text-sm text-slate-500 bg-slate-50 rounded p-2">{f.notes}</p>}
                  {/* Editable notes */}
                  {canEdit && (
                    <NotesEditor
                      value={fe.notes ?? f.notes ?? ''}
                      placeholder="הוסף הערה לטיסה..."
                      onChange={v => setItemEdit('flights', f.id, { notes: v })}
                    />
                  )}
                  {!canEdit && fe.notes && <p className="mt-2 text-sm text-slate-500 bg-slate-50 rounded p-2">{fe.notes}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Hotels */}
        {tab === 'hotels' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hotels.length === 0 && <Empty text="אין מלונות" />}
            {hotels.map(h => {
              const he2 = edits.hotels[h.id] ?? {};
              return (
                <div key={h.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">{h.name}</h3>
                      <div className="flex items-center gap-1 text-slate-500 text-sm">
                        <MapPin className="w-3 h-3" />{h.city}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < h.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1 mt-3">
                    <div><span className="text-slate-400">צ׳ק-אין: </span>{fmt(h.checkIn)}</div>
                    <div><span className="text-slate-400">צ׳ק-אאוט: </span>{fmt(h.checkOut)}</div>
                    {h.address && <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{h.address}</div>}
                    {h.confirmation && <div><span className="text-slate-400">אישור: </span>{h.confirmation}</div>}
                  </div>
                  {h.notes && !he2.notes && <p className="mt-2 text-sm text-slate-500 bg-slate-50 rounded p-2">{h.notes}</p>}
                  {canEdit && (
                    <NotesEditor
                      value={he2.notes ?? h.notes ?? ''}
                      placeholder="הוסף הערה למלון..."
                      onChange={v => setItemEdit('hotels', h.id, { notes: v })}
                    />
                  )}
                  {!canEdit && he2.notes && <p className="mt-2 text-sm text-slate-500 bg-slate-50 rounded p-2">{he2.notes}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Car Rentals */}
        {tab === 'cars' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {carRentals.length === 0 && <Empty text="אין השכרות רכב" />}
            {carRentals.map(c => {
              const ce = edits.carRentals[c.id] ?? {};
              return (
                <div key={c.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-slate-800">{c.company}</h3>
                      <p className="text-slate-500 text-sm">{c.carType}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-green-500 shrink-0" />
                      <span><strong>איסוף:</strong> {c.pickupLocation} — {fmt(c.pickupDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      <span><strong>החזרה:</strong> {c.dropoffLocation} — {fmt(c.returnDate)}</span>
                    </div>
                    {c.confirmation && <div><span className="text-slate-400">אישור: </span>{c.confirmation}</div>}
                  </div>
                  {c.notes && !ce.notes && <p className="mt-2 text-sm text-slate-500 bg-slate-50 rounded p-2">{c.notes}</p>}
                  {canEdit && (
                    <NotesEditor
                      value={ce.notes ?? c.notes ?? ''}
                      placeholder="הוסף הערה להשכרת הרכב..."
                      onChange={v => setItemEdit('carRentals', c.id, { notes: v })}
                    />
                  )}
                  {!canEdit && ce.notes && <p className="mt-2 text-sm text-slate-500 bg-slate-50 rounded p-2">{ce.notes}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Activities */}
        {tab === 'activities' && (
          <ActivitiesView
            activities={activities}
            canEdit={!!canEdit}
            edits={edits.activities}
            onEditActivity={setActivityEdit}
          />
        )}

      </div>
    </div>
  );
}

/** Inline notes editor — shows a textarea when editing, plain text when not */
function NotesEditor({ value, placeholder, onChange }: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    return (
      <div className="mt-2 space-y-1">
        <textarea
          className="w-full text-sm border border-orange-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-orange-400"
          rows={2}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={cancel} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <X className="w-3 h-3" /> ביטול
          </button>
          <button onClick={commit} className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg flex items-center gap-1">
            <Save className="w-3 h-3" /> שמור
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="mt-2 w-full text-right text-xs text-orange-500 hover:text-orange-700 flex items-center gap-1 transition-colors"
    >
      <Edit3 className="w-3 h-3" />
      {value ? <span className="text-slate-500 truncate">{value}</span> : placeholder}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="col-span-2 py-10 text-center text-slate-400 bg-white rounded-xl border border-slate-100">
      {text}
    </div>
  );
}

function ActivitiesView({ activities, canEdit, edits, onEditActivity }: {
  activities: SharedTripData['activities'];
  canEdit: boolean;
  edits: Record<string, ActivityEdit>;
  onEditActivity: (id: string, patch: ActivityEdit) => void;
}) {
  const sorted = [...activities].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const byDate = sorted.reduce<Record<string, typeof sorted>>((acc, act) => {
    const key = act.date || 'ללא תאריך';
    if (!acc[key]) acc[key] = [];
    acc[key].push(act);
    return acc;
  }, {});

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (date: string) => setCollapsed(prev => ({ ...prev, [date]: !prev[date] }));

  if (sorted.length === 0) return <Empty text="אין פעילויות" />;

  return (
    <div className="space-y-4">
      {Object.entries(byDate).map(([date, acts]) => (
        <div key={date} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => toggle(date)}
            className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-blue-500" />
              {date !== 'ללא תאריך' ? (() => { try { return format(parseISO(date), 'EEEE, dd/MM/yyyy', { locale: he }); } catch { return date; } })() : 'ללא תאריך'}
              <span className="text-xs font-normal text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                {acts.length} פעילויות
              </span>
            </div>
            {collapsed[date] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </button>

          {!collapsed[date] && (
            <div className="divide-y divide-slate-50">
              {acts.map(act => {
                const ae = edits[act.id] ?? {};
                const isBooked = ae.booked !== undefined ? ae.booked : act.booked;

                return (
                  <div key={act.id} className="flex items-start gap-3 px-5 py-3.5">
                    {/* Booked toggle (edit mode only) */}
                    {canEdit && (
                      <button
                        onClick={() => onEditActivity(act.id, { booked: !isBooked })}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isBooked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-green-400'
                        }`}
                        title={isBooked ? 'בטל הזמנה' : 'סמן כהוזמן'}
                      >
                        {isBooked && <Check className="w-3 h-3" />}
                      </button>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[act.category] ?? 'bg-slate-100 text-slate-700'}`}>
                          {act.category}
                        </span>
                        <span className={`font-medium ${isBooked ? 'text-slate-800' : 'text-slate-700'}`}>{act.name}</span>
                        {isBooked && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> הוזמן
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                        {act.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{act.time}</span>}
                        {act.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{act.location}</span>}
                      </div>
                      {act.notes && !ae.notes && <p className="mt-1 text-xs text-slate-500">{act.notes}</p>}
                      {canEdit && (
                        <NotesEditor
                          value={ae.notes ?? act.notes ?? ''}
                          placeholder="הוסף הערה לפעילות..."
                          onChange={v => onEditActivity(act.id, { notes: v })}
                        />
                      )}
                      {!canEdit && ae.notes && <p className="mt-1 text-xs text-slate-500">{ae.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
