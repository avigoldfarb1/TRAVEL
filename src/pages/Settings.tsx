import { useState } from 'react';
import { useAuthStore, AppUser } from '../store/authStore';
import { Settings as SettingsIcon, Plus, Pencil, Trash2, X, Check, Eye, EyeOff, ShieldCheck, User, AlertCircle } from 'lucide-react';

type FormState = {
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'user';
};

const emptyForm = (): FormState => ({
  username: '', displayName: '', password: '', confirmPassword: '', role: 'user',
});

export default function Settings() {
  const { users, currentUser, addUser, updateUser, deleteUser, usernameExists } = useAuthStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const f = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const validateForm = (isEdit: boolean): string => {
    if (!isEdit && !form.username.trim()) return 'שם משתמש נדרש';
    if (!isEdit && usernameExists(form.username.trim(), editingId ?? undefined))
      return 'שם משתמש כבר קיים';
    if (!form.displayName.trim()) return 'שם תצוגה נדרש';
    if (!isEdit && !form.password) return 'סיסמה נדרשת';
    if (form.password && form.password.length < 4) return 'סיסמה חייבת להכיל לפחות 4 תווים';
    if (form.password && form.password !== form.confirmPassword) return 'הסיסמאות אינן תואמות';
    return '';
  };

  const handleAdd = async () => {
    const err = validateForm(false);
    if (err) { setError(err); return; }
    try {
      const ok = await addUser(form.username.trim(), form.displayName.trim(), form.password, form.role);
      if (!ok) { setError('שם משתמש כבר קיים'); return; }
      setShowAddForm(false);
      setForm(emptyForm());
      setError('');
      flash('משתמש נוסף בהצלחה');
    } catch (e) {
      setError('שגיאה בשמירת המשתמש. נסה שוב.');
    }
  };

  const startEdit = (user: AppUser) => {
    setForm({ username: user.username, displayName: user.displayName, password: '', confirmPassword: '', role: user.role });
    setEditingId(user.id);
    setShowAddForm(false);
    setError('');
  };

  const handleSaveEdit = async () => {
    const err = validateForm(true);
    if (err) { setError(err); return; }
    try {
      await updateUser(editingId!, {
        displayName: form.displayName.trim(),
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      });
      setEditingId(null);
      setError('');
      flash('משתמש עודכן בהצלחה');
    } catch (e) {
      setError('שגיאה בעדכון המשתמש. נסה שוב.');
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (user.id === currentUser?.id) { setError('לא ניתן למחוק את המשתמש המחובר'); return; }
    if (users.length === 1) { setError('חייב להישאר לפחות משתמש אחד'); return; }
    if (!confirm(`למחוק את המשתמש "${user.displayName}"?`)) return;
    try {
      await deleteUser(user.id);
      flash('משתמש נמחק');
    } catch (e) {
      setError('שגיאה במחיקת המשתמש. נסה שוב.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-500" /> הגדרות — ניהול משתמשים
        </h1>
        {isAdmin && (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); setForm(emptyForm()); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> הוסף משתמש
          </button>
        )}
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="mr-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add user form */}
      {showAddForm && isAdmin && (
        <UserForm
          form={form}
          onChange={f}
          showPass={showPass}
          onTogglePass={() => setShowPass(v => !v)}
          onSave={handleAdd}
          onCancel={() => { setShowAddForm(false); setError(''); }}
          title="הוספת משתמש חדש"
          isEdit={false}
          error={error}
          onClearError={() => setError('')}
        />
      )}

      {/* Users list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <span className="text-sm font-medium text-slate-600">{users.length} משתמשים במערכת</span>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map(user => (
            <div key={user.id}>
              {editingId === user.id ? (
                <div className="p-4">
                  <UserForm
                    form={form}
                    onChange={f}
                    showPass={showPass}
                    onTogglePass={() => setShowPass(v => !v)}
                    onSave={handleSaveEdit}
                    onCancel={() => { setEditingId(null); setError(''); }}
                    title={`עריכת משתמש: ${user.username}`}
                    isEdit={true}
                    error={error}
                    onClearError={() => setError('')}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${
                    user.role === 'admin' ? 'bg-blue-600' : 'bg-slate-500'
                  }`}>
                    {user.displayName.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{user.displayName}</span>
                      {user.id === currentUser?.id && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">אתה</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> {user.username}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        user.role === 'admin'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                        {user.role === 'admin' ? 'מנהל' : 'משתמש'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="עריכה"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={user.id === currentUser?.id}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="מחיקה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!isAdmin && (
        <p className="text-sm text-slate-400 text-center">רק מנהל יכול להוסיף ולערוך משתמשים.</p>
      )}
    </div>
  );
}

/* ── User Form (add / edit) ── */
function UserForm({ form, onChange, showPass, onTogglePass, onSave, onCancel, title, isEdit, error, onClearError }: {
  form: FormState;
  onChange: (field: keyof FormState, value: string) => void;
  showPass: boolean;
  onTogglePass: () => void;
  onSave: () => void;
  onCancel: () => void;
  title: string;
  isEdit: boolean;
  error?: string;
  onClearError?: () => void;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <h3 className="font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {!isEdit && (
          <div>
            <label className="text-xs text-slate-500 block mb-1 font-medium">שם משתמש *</label>
            <input
              value={form.username}
              onChange={e => onChange('username', e.target.value)}
              className="input-field"
              placeholder="לדוגמה: david"
              autoFocus
            />
          </div>
        )}

        <div>
          <label className="text-xs text-slate-500 block mb-1 font-medium">שם תצוגה *</label>
          <input
            value={form.displayName}
            onChange={e => onChange('displayName', e.target.value)}
            className="input-field"
            placeholder="לדוגמה: דוד כהן"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1 font-medium">
            {isEdit ? 'סיסמה חדשה (השאר ריק לאי-שינוי)' : 'סיסמה *'}
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => onChange('password', e.target.value)}
              className="input-field pl-10"
              placeholder={isEdit ? 'השאר ריק לאי-שינוי' : 'לפחות 4 תווים'}
            />
            <button type="button" onClick={onTogglePass}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1 font-medium">אימות סיסמה</label>
          <input
            type={showPass ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={e => onChange('confirmPassword', e.target.value)}
            className="input-field"
            placeholder="חזור על הסיסמה"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1 font-medium">הרשאה</label>
          <select value={form.role} onChange={e => onChange('role', e.target.value)} className="input-field">
            <option value="user">משתמש רגיל</option>
            <option value="admin">מנהל מערכת</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm mt-4">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          {onClearError && <button type="button" onClick={onClearError} className="mr-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>}
        </div>
      )}

      <div className="flex gap-2 mt-4 justify-end">
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-100 transition-colors">
          <X className="w-4 h-4" /> ביטול
        </button>
        <button type="button" onClick={onSave}
          className="flex items-center gap-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Check className="w-4 h-4" /> {isEdit ? 'שמור שינויים' : 'הוסף משתמש'}
        </button>
      </div>
    </div>
  );
}
