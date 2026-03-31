import { useState } from 'react';
import { useCurrentTripData } from '../store/tripStore';
import { Activity } from '../types';
import { CURRENCY_SYMBOLS } from '../types';
import { MapPin, Plus, Trash2, Pencil, X, Check, Clock } from 'lucide-react';
import CalendarSync from '../components/CalendarSync';
import { activityToCalendarEvent } from '../utils/calendarExport';

const CURRENCIES = ['ILS', 'EUR', 'USD', 'GBP'];
const CATEGORIES: Activity['category'][] = ['תרבות', 'טבע', 'אוכל', 'קניות', 'בידור', 'ספורט', 'אחר'];
const CATEGORY_COLORS: Record<string, string> = {
  תרבות: 'bg-purple-100 text-purple-700',
  טבע: 'bg-green-100 text-green-700',
  אוכל: 'bg-orange-100 text-orange-700',
  קניות: 'bg-pink-100 text-pink-700',
  בידור: 'bg-yellow-100 text-yellow-700',
  ספורט: 'bg-blue-100 text-blue-700',
  אחר: 'bg-slate-100 text-slate-700',
};

function emptyActivity(tripId: string): Activity {
  return {
    id: `act-${Date.now()}`, tripId, name: '', date: '', time: '',
    location: '', price: 0, currency: 'EUR', category: 'אחר', notes: '', booked: false,
  };
}

export default function Activities() {
  const { trip, activities, addActivity, updateActivity, deleteActivity } = useCurrentTripData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Activity>(emptyActivity(trip.id));
  const [filterCat, setFilterCat] = useState<string>('הכל');

  const f = (field: keyof Activity, value: string | number | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const filtered = filterCat === 'הכל' ? activities : activities.filter(a => a.category === filterCat);
  const sorted = [...filtered].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-500" /> פעילויות
        </h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyActivity(trip.id)); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> הוסף פעילות
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['הכל', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterCat === cat ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <ActivityForm form={form} onChange={f}
          onSave={() => { addActivity({ ...form, id: `act-${Date.now()}` }); setShowForm(false); }}
          onCancel={() => setShowForm(false)} title="פעילות חדשה" />
      )}

      <div className="space-y-3">
        {sorted.length === 0 && <div className="p-8 text-center text-slate-400 bg-white rounded-xl">אין פעילויות.</div>}
        {sorted.map(act => (
          editingId === act.id ? (
            <ActivityForm key={act.id} form={form} onChange={f}
              onSave={() => { updateActivity(act.id, form); setEditingId(null); }}
              onCancel={() => setEditingId(null)} title="עריכת פעילות" />
          ) : (
            <div key={act.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[act.category]}`}>{act.category}</span>
                  <h3 className="font-semibold text-slate-800">{act.name}</h3>
                  {act.booked && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">הוזמן</span>}
                </div>
                <div className="flex gap-4 text-sm text-slate-500 flex-wrap">
                  {act.date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{act.date} {act.time}</span>}
                  {act.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{act.location}</span>}
                  {act.price > 0 && <span className="font-medium text-green-600">{CURRENCY_SYMBOLS[act.currency]}{act.price}</span>}
                </div>
                {act.notes && <p className="text-sm text-slate-500 mt-1">{act.notes}</p>}
              </div>
              <div className="flex gap-1 shrink-0 items-center">
                <CalendarSync event={activityToCalendarEvent(act)} />
                <button onClick={() => { setForm({ ...act }); setEditingId(act.id); setShowForm(false); }} className="p-2 text-slate-400 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => deleteActivity(act.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function ActivityForm({ form, onChange, onSave, onCancel, title }: {
  form: Activity; onChange: (f: keyof Activity, v: string | number | boolean) => void;
  onSave: () => void; onCancel: () => void; title: string;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <h3 className="font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2"><label className="text-xs text-slate-500 block mb-1">שם הפעילות</label>
          <input value={form.name} onChange={e => onChange('name', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">קטגוריה</label>
          <select value={form.category} onChange={e => onChange('category', e.target.value)} className="input-field">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><label className="text-xs text-slate-500 block mb-1">הוזמן מראש?</label>
          <div className="flex items-center gap-2 h-10">
            <input type="checkbox" checked={form.booked} onChange={e => onChange('booked', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-slate-600">כן</span>
          </div>
        </div>
        <div><label className="text-xs text-slate-500 block mb-1">תאריך</label>
          <input type="date" value={form.date} onChange={e => onChange('date', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">שעה</label>
          <input type="time" value={form.time} onChange={e => onChange('time', e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="text-xs text-slate-500 block mb-1">מיקום</label>
          <input value={form.location} onChange={e => onChange('location', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">מחיר</label>
          <div className="flex gap-1">
            <input type="number" value={form.price} onChange={e => onChange('price', +e.target.value)} className="input-field flex-1" />
            <select value={form.currency} onChange={e => onChange('currency', e.target.value)} className="input-field w-20">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="col-span-2 md:col-span-3"><label className="text-xs text-slate-500 block mb-1">הערות</label>
          <input value={form.notes} onChange={e => onChange('notes', e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-100"><X className="w-4 h-4" /> ביטול</button>
        <button onClick={onSave} className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"><Check className="w-4 h-4" /> שמור</button>
      </div>
    </div>
  );
}
