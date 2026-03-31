import { create } from 'zustand';
import { hashPassword, checkPassword } from '../utils/hash';

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

  login: (username: string, password: string, remember: boolean) => boolean;
  logout: () => void;

  addUser: (username: string, displayName: string, password: string, role: 'admin' | 'user') => boolean;
  updateUser: (id: string, updates: { displayName?: string; password?: string; role?: 'admin' | 'user' }) => void;
  deleteUser: (id: string) => void;
  usernameExists: (username: string, excludeId?: string) => boolean;
}

const initialUser: AppUser = {
  id: 'user-avi',
  username: 'avi',
  displayName: 'אבי',
  passwordHash: hashPassword('asla1083'),
  role: 'admin',
};

const STORAGE_KEY = 'trip-manager-auth';

interface SavedAuth {
  users: AppUser[];
  currentUser: AppUser | null;
  rememberMe: boolean;
  rememberedUsername: string;
}

function loadSaved(): SavedAuth {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { users: [initialUser], currentUser: null, rememberMe: false, rememberedUsername: '' };
    const parsed = JSON.parse(raw);
    // Support both old Zustand persist format { state: {...}, version: N } and new direct format
    const data: Partial<SavedAuth> = parsed.state ?? parsed;
    return {
      users: Array.isArray(data.users) && data.users.length > 0 ? data.users : [initialUser],
      currentUser: data.currentUser ?? null,
      rememberMe: !!data.rememberMe,
      rememberedUsername: data.rememberedUsername ?? '',
    };
  } catch {
    return { users: [initialUser], currentUser: null, rememberMe: false, rememberedUsername: '' };
  }
}

function save(data: SavedAuth) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[authStore] localStorage write failed:', e);
  }
}

const initial = loadSaved();

export const useAuthStore = create<AuthStore>((set, get) => ({
  users: initial.users,
  currentUser: initial.currentUser,
  rememberMe: initial.rememberMe,
  rememberedUsername: initial.rememberedUsername,

  login: (username, password, remember) => {
    const user = get().users.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );
    if (!user || !checkPassword(password, user.passwordHash)) return false;
    const currentUser = user;
    const rememberMe = remember;
    const rememberedUsername = remember ? username : '';
    set({ currentUser, rememberMe, rememberedUsername });
    save({ users: get().users, currentUser, rememberMe, rememberedUsername });
    return true;
  },

  logout: () => {
    set({ currentUser: null });
    save({ users: get().users, currentUser: null, rememberMe: get().rememberMe, rememberedUsername: get().rememberedUsername });
  },

  addUser: (username, displayName, password, role) => {
    if (get().usernameExists(username)) return false;
    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      username,
      displayName,
      passwordHash: hashPassword(password),
      role,
    };
    const users = [...get().users, newUser];
    set({ users });
    save({ users, currentUser: get().currentUser, rememberMe: get().rememberMe, rememberedUsername: get().rememberedUsername });
    return true;
  },

  updateUser: (id, updates) => {
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
    save({ users, currentUser, rememberMe: get().rememberMe, rememberedUsername: get().rememberedUsername });
  },

  deleteUser: (id) => {
    const users = get().users.filter(u => u.id !== id);
    set({ users });
    save({ users, currentUser: get().currentUser, rememberMe: get().rememberMe, rememberedUsername: get().rememberedUsername });
  },

  usernameExists: (username, excludeId) =>
    get().users.some(
      u => u.username.toLowerCase() === username.toLowerCase() && u.id !== excludeId
    ),
}));
