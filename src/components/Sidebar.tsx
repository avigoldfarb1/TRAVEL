import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Plane, Building2, Car, MapPin,
  Calendar, Wallet, CheckSquare, Plus, Save, ChevronDown,
  Check, FileText, Settings, LogOut, User, X, TrendingUp
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { useAuthStore } from '../store/authStore';
import NewTripModal from './NewTripModal';

const navItems = [
  { path: '/', label: 'לוח בקרה', icon: LayoutDashboard },
  { path: '/flights', label: 'טיסות', icon: Plane },
  { path: '/hotels', label: 'מלונות', icon: Building2 },
  { path: '/car-rental', label: 'השכרת רכב', icon: Car },
  { path: '/activities', label: 'פעילויות', icon: MapPin },
  { path: '/itinerary', label: 'מסלול יומי', icon: Calendar },
  { path: '/budget', label: 'תקציב', icon: Wallet },
  { path: '/checklist', label: 'רשימות תיוג', icon: CheckSquare },
  { path: '/report', label: 'דוח מפורט', icon: FileText },
  { path: '/currency', label: 'המרת מטבע', icon: TrendingUp },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ onClose }: Props) {
  const { trips, trip, switchTrip, save, lastSaved } = useTripStore();
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const [showTripSelector, setShowTripSelector] = useState(false);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    save();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    // Close mobile sidebar on nav click
    onClose();
  };

  return (
    <>
      <aside className="w-64 bg-slate-800 text-white flex flex-col h-full min-h-screen">

        {/* Logo */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <img src="/logo.png" alt="מסלול חכם" className="h-10 w-auto" />
          <button onClick={onClose} className="md:hidden p-2 rounded-lg hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trip Selector */}
        <div className="p-4 border-b border-slate-700">
          <button
            onClick={() => setShowTripSelector(v => !v)}
            className="w-full flex items-center justify-between gap-2 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Plane className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-right min-w-0">
                <div className="font-semibold text-sm leading-tight truncate">{trip.name}</div>
                <div className="text-slate-400 text-xs truncate">{trip.destination}</div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${showTripSelector ? 'rotate-180' : ''}`} />
          </button>

          {showTripSelector && (
            <div className="mt-2 bg-slate-700 rounded-lg overflow-hidden">
              {trips.map(t => (
                <button
                  key={t.id}
                  onClick={() => { switchTrip(t.id); setShowTripSelector(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-slate-600 transition-colors text-right ${t.id === trip.id ? 'bg-slate-600' : ''}`}
                >
                  <span className="truncate">{t.name}</span>
                  {t.id === trip.id && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                </button>
              ))}
              <button
                onClick={() => { setShowNewTrip(true); setShowTripSelector(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-400 hover:bg-slate-600 transition-colors border-t border-slate-600"
              >
                <Plus className="w-4 h-4" /> טיול חדש
              </button>
            </div>
          )}

          <p className="text-slate-500 text-xs mt-2 px-1">
            {trip.startDate} → {trip.endDate}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="pt-2 border-t border-slate-700 mt-2">
            <NavLink
              to="/settings"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <Settings className="w-4 h-4 shrink-0" />
              הגדרות
            </NavLink>
          </div>
        </nav>

        {/* User + Save */}
        <div className="p-4 border-t border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-slate-300 truncate">{currentUser?.displayName}</span>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors shrink-0 p-1" title="התנתק">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              justSaved ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {justSaved ? <><Check className="w-4 h-4" /> נשמר!</> : <><Save className="w-4 h-4" /> שמור</>}
          </button>
          {lastSaved && (
            <p className="text-xs text-slate-500 text-center">נשמר: {lastSaved}</p>
          )}
        </div>
      </aside>

      {showNewTrip && <NewTripModal onClose={() => setShowNewTrip(false)} />}
    </>
  );
}
