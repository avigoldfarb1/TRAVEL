import { useState } from 'react';
import { useCurrentTripData } from '../store/tripStore';
import { Hotel } from '../types';
import { CURRENCY_SYMBOLS } from '../types';
import { Building2, Plus, Trash2, Pencil, X, Check, Star, MapPin } from 'lucide-react';
import CalendarSync from '../components/CalendarSync';
import { hotelToCalendarEvent } from '../utils/calendarExport';
import { differenceInDays, parseISO } from 'date-fns';

const CURRENCIES = ['ILS', 'EUR', 'USD', 'GBP'];

function emptyHotel(tripId: string): Hotel {
  return {
    id: `ht-${Date.now()}`, tripId, name: '', city: '',
    checkIn: '', checkOut: '', pricePerNight: 0, currency: 'EUR',
    confirmation: '', address: '', notes: '', rating: 4,
  };
}

export default function Hotels() {
  const { trip, hotels, addHotel, updateHotel, deleteHotel } = useCurrentTripData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Hotel>(emptyHotel(trip.id));

  const f = (field: keyof Hotel, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const nights = (h: Hotel) => {
    try { return differenceInDays(parseISO(h.checkOut), parseISO(h.checkIn)); }
    catch { return 0; }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-500" /> מלונות
        </h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyHotel(trip.id)); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> הוסף מלון
        </button>
      </div>

      {showForm && (
        <HotelForm form={form} onChange={f}
          onSave={() => { addHotel({ ...form, id: `ht-${Date.now()}` }); setShowForm(false); }}
          onCancel={() => setShowForm(false)} title="מלון חדש" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hotels.length === 0 && <div className="col-span-2 p-8 text-center text-slate-400 bg-white rounded-xl">אין מלונות. הוסף מלון חדש.</div>}
        {hotels.map(hotel => (
          editingId === hotel.id ? (
            <div key={hotel.id} className="col-span-2">
              <HotelForm form={form} onChange={f}
                onSave={() => { updateHotel(hotel.id, form); setEditingId(null); }}
                onCancel={() => setEditingId(null)} title="עריכת מלון" />
            </div>
          ) : (
            <div key={hotel.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">{hotel.name}</h3>
                  <div className="flex items-center gap-1 text-slate-500 text-sm">
                    <MapPin className="w-3 h-3" />{hotel.city}
                  </div>
                </div>
                <div className="flex gap-1 items-center">
                  <CalendarSync event={hotelToCalendarEvent(hotel)} />
                  <button onClick={() => { setForm({ ...hotel }); setEditingId(hotel.id); setShowForm(false); }} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteHotel(hotel.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < hotel.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-400">צ'ק-אין</div>
                  <div className="text-sm font-medium text-slate-700">{hotel.checkIn}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-xs text-slate-400">לילות</div>
                  <div className="text-lg font-bold text-blue-600">{nights(hotel)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-400">צ'ק-אאוט</div>
                  <div className="text-sm font-medium text-slate-700">{hotel.checkOut}</div>
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-green-600">
                  {CURRENCY_SYMBOLS[hotel.currency]}{(hotel.pricePerNight * nights(hotel)).toLocaleString()}
                </span>
                <span className="text-sm text-slate-400">{CURRENCY_SYMBOLS[hotel.currency]}{hotel.pricePerNight}/לילה</span>
              </div>

              {hotel.confirmation && (
                <div className="mt-2 text-xs text-slate-400">אישור: {hotel.confirmation}</div>
              )}
              {hotel.address && (
                <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{hotel.address}
                </div>
              )}
              {hotel.notes && <div className="mt-2 text-sm text-slate-600 bg-yellow-50 rounded p-2">{hotel.notes}</div>}
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function HotelForm({ form, onChange, onSave, onCancel, title }: {
  form: Hotel; onChange: (f: keyof Hotel, v: string | number) => void;
  onSave: () => void; onCancel: () => void; title: string;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <h3 className="font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2"><label className="text-xs text-slate-500 block mb-1">שם המלון</label>
          <input value={form.name} onChange={e => onChange('name', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">עיר</label>
          <input value={form.city} onChange={e => onChange('city', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">דירוג (כוכבים)</label>
          <input type="number" min={1} max={5} value={form.rating} onChange={e => onChange('rating', +e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">צ'ק-אין</label>
          <input type="date" value={form.checkIn} onChange={e => onChange('checkIn', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">צ'ק-אאוט</label>
          <input type="date" value={form.checkOut} onChange={e => onChange('checkOut', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">מחיר ללילה</label>
          <div className="flex gap-1">
            <input type="number" value={form.pricePerNight} onChange={e => onChange('pricePerNight', +e.target.value)} className="input-field flex-1" />
            <select value={form.currency} onChange={e => onChange('currency', e.target.value)} className="input-field w-20">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div><label className="text-xs text-slate-500 block mb-1">מספר אישור</label>
          <input value={form.confirmation} onChange={e => onChange('confirmation', e.target.value)} className="input-field" /></div>
        <div className="col-span-2 md:col-span-4"><label className="text-xs text-slate-500 block mb-1">כתובת</label>
          <input value={form.address} onChange={e => onChange('address', e.target.value)} className="input-field" /></div>
        <div className="col-span-2 md:col-span-4"><label className="text-xs text-slate-500 block mb-1">הערות</label>
          <input value={form.notes} onChange={e => onChange('notes', e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /> ביטול</button>
        <button onClick={onSave} className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"><Check className="w-4 h-4" /> שמור</button>
      </div>
    </div>
  );
}
