import { create } from 'zustand';
import { hashPassword, checkPassword } from '../utils/hash';
import { supabase, supabaseEnabled } from '../lib/supabase';

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: 'admin' | 'user';
}

interface AuthStore {
  users: AppUser[];
  currentUser: AppUser | null;
  rememberMe: boolean;
  rememberedUsername: string;
  usersLoaded: boolean;

  loadUsers: () => Promise<void>;
  login: (username: string, password: string, remember: boolean) => boolean;
  logout: () => void;

  addUser: (username: string, displayName: string, password: string, role: 'admin' | 'user') => Promise<boolean>;
  updateUser: (id: string, updates: { displayName?: string; password?: string; role?: 'admin' | 'user' }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  usernameExists: (username: string, excludeId?: string) => boolean;
  importUser: (user: AppUser) => void;
}

const ADMIN_ID = 'user-avi';

const initialAdmin: AppUser = {
  id: ADMIN_ID,
  username: 'avi',
  displayName: 'אבי',
  passwordHash: hashPassword('asla1083'),
  role: 'admin',
};

// LocalStorage fallback (used when Supabase is not configured)
const USERS_KEY = 'trip-manager-users';

function loadLocalUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Also try old Zustand persist format
    const old = localStorage.getItem('trip-manager-auth');
    if (old) {
      const parsed = JSON.parse(old);
      const data = parsed.state ?? parsed;
      if (Array.isArray(data.users) && data.users.length > 0) return data.users;
    }
  } catch {}
  return [initialAdmin];
}

function saveLocalUsers(users: AppUser[]) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
}

// Session persistence (currentUser, rememberMe) stays in localStorage
const SESSION_KEY = 'trip-manager-session';

function loadSession(): Pick<AuthStore, 'currentUser' | 'rememberMe' | 'rememberedUsername'> {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        currentUser: s.currentUser ?? null,
        rememberMe: !!s.rememberMe,
        rememberedUsername: s.rememberedUsername ?? '',
      };
    }
  } catch {}
  return { currentUser: null, rememberMe: false, rememberedUsername: '' };
}

function saveSession(s: Pick<AuthStore, 'currentUser' | 'rememberMe' | 'rememberedUsername'>) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      currentUser: s.currentUser,
      rememberMe: s.rememberMe,
      rememberedUsername: s.rememberedUsername,
    }));
  } catch {}
}

// Map DB row → AppUser
function rowToUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    passwordHash: row.password_hash as string,
    role: row.role as 'admin' | 'user',
  };
}

const session = loadSession();

export const useAuthStore = create<AuthStore>((set, get) => ({
  users: [initialAdmin],
  usersLoaded: false,
  currentUser: session.currentUser,
  rememberMe: session.rememberMe,
  rememberedUsername: session.rememberedUsername,

  loadUsers: async () => {
    if (!supabaseEnabled) {
      // Fall back to localStorage
      const saved = loadLocalUsers();
      set({ users: saved, usersLoaded: true });
      return;
    }
    try {
      const { data, error } = await supabase.from('app_users').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        set({ users: data.map(rowToUser), usersLoaded: true });
      } else {
        // First run: seed the admin user into Supabase
        await supabase.from('app_users').upsert({
          id: initialAdmin.id,
          username: initialAdmin.username,
          display_name: initialAdmin.displayName,
          password_hash: initialAdmin.passwordHash,
          role: initialAdmin.role,
        });
        set({ users: [initialAdmin], usersLoaded: true });
      }
    } catch (e) {
      console.error('[authStore] loadUsers failed:', e);
      // Fall back to localStorage on error
      const saved = loadLocalUsers();
      set({ users: saved, usersLoaded: true });
    }
  },

  login: (username, password, remember) => {
    const user = get().users.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );
    if (!user || !checkPassword(password, user.passwordHash)) return false;
    const next = { currentUser: user, rememberMe: remember, rememberedUsername: remember ? username : '' };
    set(next);
    saveSession(next);
    return true;
  },

  logout: () => {
    set({ currentUser: null });
    saveSession({ currentUser: null, rememberMe: get().rememberMe, rememberedUsername: get().rememberedUsername });
  },

  addUser: async (username, displayName, password, role) => {
    if (get().usernameExists(username)) return false;
    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      username,
      displayName,
      passwordHash: hashPassword(password),
      role,
    };
    if (supabaseEnabled) {
      const { error } = await supabase.from('app_users').insert({
        id: newUser.id,
        username: newUser.username,
        display_name: newUser.displayName,
        password_hash: newUser.passwordHash,
        role: newUser.role,
      });
      if (error) throw new Error(error.message);
    }
    const users = [...get().users, newUser];
    set({ users });
    if (!supabaseEnabled) saveLocalUsers(users);
    return true;
  },

  updateUser: async (id, updates) => {
    if (supabaseEnabled) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.password) dbUpdates.password_hash = hashPassword(updates.password);
      const { error } = await supabase.from('app_users').update(dbUpdates).eq('id', id);
      if (error) throw new Error(error.message);
    }
    const users = get().users.map(u => {
      if (u.id !== id) return u;
      return {
        ...u,
        ...(updates.displayName !== undefined ? { displayName: updates.displayName } : {}),
        ...(updates.role !== undefined ? { role: updates.role } : {}),
        ...(updates.password ? { passwordHash: hashPassword(updates.password) } : {}),
      };
    });
    const currentUser = get().currentUser?.id === id
      ? {
          ...get().currentUser!,
          ...(updates.displayName !== undefined ? { displayName: updates.displayName } : {}),
          ...(updates.role !== undefined ? { role: updates.role } : {}),
        }
      : get().currentUser;
    set({ users, currentUser });
    if (!supabaseEnabled) saveLocalUsers(users);
  },

  deleteUser: async (id) => {
    if (supabaseEnabled) {
      const { error } = await supabase.from('app_users').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
    const users = get().users.filter(u => u.id !== id);
    set({ users });
    if (!supabaseEnabled) saveLocalUsers(users);
  },

  usernameExists: (username, excludeId) =>
    get().users.some(
      u => u.username.toLowerCase() === username.toLowerCase() && u.id !== excludeId
    ),

  importUser: (user: AppUser) => {
    // Add or update user from a join link (used on new devices)
    const exists = get().users.some(u => u.id === user.id);
    const users = exists
      ? get().users.map(u => u.id === user.id ? user : u)
      : [...get().users, user];
    set({ users });
    saveLocalUsers(users);
  },
}));
