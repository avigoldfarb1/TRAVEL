import { useState } from 'react';
import { useCurrentTripData } from '../store/tripStore';
import { Flight } from '../types';
import { CURRENCY_SYMBOLS } from '../types';
import { Plane, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import CalendarSync from '../components/CalendarSync';
import { flightToCalendarEvent } from '../utils/calendarExport';

const FLIGHT_TYPES = { outbound: 'הלוך', return: 'חזור', connecting: 'מעבר' };
const CURRENCIES = ['ILS', 'EUR', 'USD', 'GBP'];

function emptyFlight(tripId: string): Flight {
  return {
    id: `fl-${Date.now()}`,
    tripId,
    type: 'outbound',
    airline: '',
    flightNumber: '',
    from: '',
    to: '',
    departure: '',
    arrival: '',
    price: 0,
    currency: 'ILS',
    confirmation: '',
    notes: '',
  };
}

export default function Flights() {
  const { trip, flights, addFlight, updateFlight, deleteFlight } = useCurrentTripData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Flight>(emptyFlight(trip.id));

  const startEdit = (flight: Flight) => {
    setForm({ ...flight });
    setEditingId(flight.id);
    setShowForm(false);
  };

  const saveEdit = () => {
    if (editingId) {
      updateFlight(editingId, form);
      setEditingId(null);
    }
  };

  const saveNew = () => {
    addFlight({ ...form, id: `fl-${Date.now()}`, tripId: trip.id });
    setForm(emptyFlight(trip.id));
    setShowForm(false);
  };

  const f = (field: keyof Flight, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Plane className="w-6 h-6 text-blue-500" /> טיסות
        </h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyFlight(trip.id)); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> הוסף טיסה
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <FlightForm
          form={form}
          onChange={f}
          onSave={saveNew}
          onCancel={() => setShowForm(false)}
          title="טיסה חדשה"
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {flights.length === 0 ? (
          <div className="p-8 text-center text-slate-400">אין טיסות. הוסף טיסה חדשה.</div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full text-sm min-w-max">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['סוג', 'חברה', 'מספר', 'מ', 'אל', 'יציאה', 'הגעה', 'מחיר', 'אישור', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {flights.map(flight => (
                  editingId === flight.id ? (
                    <tr key={flight.id} className="bg-blue-50">
                      <td colSpan={10} className="p-4">
                        <FlightForm
                          form={form}
                          onChange={f}
                          onSave={saveEdit}
                          onCancel={() => setEditingId(null)}
                          title="עריכת טיסה"
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={flight.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          flight.type === 'outbound' ? 'bg-green-100 text-green-700' :
                          flight.type === 'return' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>{FLIGHT_TYPES[flight.type]}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{flight.airline}</td>
                      <td className="px-4 py-3 text-slate-500">{flight.flightNumber}</td>
                      <td className="px-4 py-3">{flight.from}</td>
                      <td className="px-4 py-3">{flight.to}</td>
                      <td className="px-4 py-3 text-slate-600">{flight.departure?.replace('T', ' ')}</td>
                      <td className="px-4 py-3 text-slate-600">{flight.arrival?.replace('T', ' ')}</td>
                      <td className="px-4 py-3 font-medium">{CURRENCY_SYMBOLS[flight.currency]}{flight.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{flight.confirmation}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <CalendarSync event={flightToCalendarEvent(flight)} />
                          <button onClick={() => startEdit(flight)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteFlight(flight.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FlightForm({ form, onChange, onSave, onCancel, title }: {
  form: Flight;
  onChange: (field: keyof Flight, value: string | number) => void;
  onSave: () => void;
  onCancel: () => void;
  title: string;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <h3 className="font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">סוג טיסה</label>
          <select value={form.type} onChange={e => onChange('type', e.target.value)} className="input-field">
            <option value="outbound">הלוך</option>
            <option value="return">חזור</option>
            <option value="connecting">מעבר</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">חברת תעופה</label>
          <input value={form.airline} onChange={e => onChange('airline', e.target.value)} className="input-field" placeholder="EL AL" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">מספר טיסה</label>
          <input value={form.flightNumber} onChange={e => onChange('flightNumber', e.target.value)} className="input-field" placeholder="LY315" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">מוצא</label>
          <input value={form.from} onChange={e => onChange('from', e.target.value)} className="input-field" placeholder="תל אביב (TLV)" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">יעד</label>
          <input value={form.to} onChange={e => onChange('to', e.target.value)} className="input-field" placeholder="אמסטרדם (AMS)" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">יציאה</label>
          <input type="datetime-local" value={form.departure} onChange={e => onChange('departure', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">הגעה</label>
          <input type="datetime-local" value={form.arrival} onChange={e => onChange('arrival', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">מחיר</label>
          <div className="flex gap-1">
            <input type="number" value={form.price} onChange={e => onChange('price', +e.target.value)} className="input-field flex-1" />
            <select value={form.currency} onChange={e => onChange('currency', e.target.value)} className="input-field w-20">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">מספר אישור</label>
          <input value={form.confirmation} onChange={e => onChange('confirmation', e.target.value)} className="input-field" />
        </div>
        <div className="col-span-2 md:col-span-3">
          <label className="text-xs text-slate-500 block mb-1">הערות</label>
          <input value={form.notes} onChange={e => onChange('notes', e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-100 transition-colors">
          <X className="w-4 h-4" /> ביטול
        </button>
        <button onClick={onSave} className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
          <Check className="w-4 h-4" /> שמור
        </button>
      </div>
    </div>
  );
}
