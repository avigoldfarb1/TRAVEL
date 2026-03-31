import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, AppUser } from '../store/authStore';
import { Plane, CheckCircle, AlertCircle } from 'lucide-react';

export default function Join() {
  const navigate = useNavigate();
  const { importUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) { setStatus('error'); return; }
    try {
      const user: AppUser = JSON.parse(atob(hash));
      if (!user.id || !user.username || !user.passwordHash) throw new Error('invalid');
      importUser(user);
      setUsername(user.username);
      setDisplayName(user.displayName);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Plane className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">מערכת ניהול טיול</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-4">
          {status === 'loading' && (
            <div className="space-y-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
              <p className="text-slate-500 text-sm">מעבד קישור...</p>
            </div>
          )}

          {status === 'ok' && (
            <div className="space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">ברוך הבא, {displayName}!</h2>
                <p className="text-slate-500 text-sm mt-1">המשתמש נוסף בהצלחה למכשיר זה</p>
                <p className="text-slate-400 text-xs mt-2">שם משתמש: <span className="font-mono font-medium text-slate-600">{username}</span></p>
              </div>
              <button
                onClick={() => navigate(`/login?u=${encodeURIComponent(username)}`)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                כניסה למערכת
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">קישור לא תקין</h2>
                <p className="text-slate-500 text-sm mt-1">בקש מהמנהל לשלוח קישור חדש</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                לדף הכניסה
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
