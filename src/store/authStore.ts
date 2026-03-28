import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      users: [initialUser],
      currentUser: null,
      rememberMe: false,
      rememberedUsername: '',

      login: (username, password, remember) => {
        const user = get().users.find(
          u => u.username.toLowerCase() === username.toLowerCase()
        );
        if (!user || !checkPassword(password, user.passwordHash)) return false;
        set({
          currentUser: user,
          rememberMe: remember,
          rememberedUsername: remember ? username : '',
        });
        return true;
      },

      logout: () => set({ currentUser: null }),

      addUser: (username, displayName, password, role) => {
        if (get().usernameExists(username)) return false;
        const newUser: AppUser = {
          id: `user-${Date.now()}`,
          username,
          displayName,
          passwordHash: hashPassword(password),
          role,
        };
        set(s => ({ users: [...s.users, newUser] }));
        return true;
      },

      updateUser: (id, updates) => set(s => ({
        users: s.users.map(u => {
          if (u.id !== id) return u;
          return {
            ...u,
            ...(updates.displayName !== undefined ? { displayName: updates.displayName } : {}),
            ...(updates.role !== undefined ? { role: updates.role } : {}),
            ...(updates.password ? { passwordHash: hashPassword(updates.password) } : {}),
          };
        }),
        // refresh currentUser if editing self
        currentUser: s.currentUser?.id === id
          ? {
              ...s.currentUser,
              ...(updates.displayName !== undefined ? { displayName: updates.displayName } : {}),
              ...(updates.role !== undefined ? { role: updates.role } : {}),
            }
          : s.currentUser,
      })),

      deleteUser: (id) => set(s => ({
        users: s.users.filter(u => u.id !== id),
      })),

      usernameExists: (username, excludeId) =>
        get().users.some(
          u => u.username.toLowerCase() === username.toLowerCase() && u.id !== excludeId
        ),
    }),
    { name: 'trip-manager-auth' }
  )
);
