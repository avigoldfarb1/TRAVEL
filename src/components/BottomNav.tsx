import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Plane, Wallet, MapPin, Calendar } from 'lucide-react';

const items = [
  { path: '/', label: 'בקרה', icon: LayoutDashboard },
  { path: '/flights', label: 'טיסות', icon: Plane },
  { path: '/activities', label: 'פעילויות', icon: MapPin },
  { path: '/itinerary', label: 'מסלול', icon: Calendar },
  { path: '/budget', label: 'תקציב', icon: Wallet },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 right-0 left-0 z-30 bg-white border-t border-slate-200 flex items-stretch safe-area-bottom shadow-lg">
      {items.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-blue-50' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="leading-none">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
