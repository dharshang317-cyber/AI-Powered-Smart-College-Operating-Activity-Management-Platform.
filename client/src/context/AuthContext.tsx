import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User, College, CollegeSettings } from '../types';
import { joinUserRooms } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  college: College | null;
  settings: CollegeSettings | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: string) => Promise<any>;
  loginWithToken: (token: string, user: User, college?: College, settings?: CollegeSettings) => void;
  registerAdmin: (data: any) => Promise<any>;
  registerFaculty: (data: any) => Promise<any>;
  registerStudent: (data: any) => Promise<any>;
  registerCareClub: (data: any) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('campusnexus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('campusnexus_token'));
  const [college, setCollege] = useState<College | null>(null);
  const [settings, setSettings] = useState<CollegeSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setAuthData = (newToken: string, newUser: User, newCollege?: College, newSettings?: CollegeSettings) => {
    localStorage.setItem('campusnexus_token', newToken);
    localStorage.setItem('campusnexus_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    if (newCollege) setCollege(newCollege);
    if (newSettings) setSettings(newSettings);

    // Join real-time socket room
    joinUserRooms(newUser.id, newUser.college_id, newUser.role);
  };

  const refreshUser = async () => {
    try {
      if (!token) return;
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setCollege(res.data.college);
      setSettings(res.data.settings);
      localStorage.setItem('campusnexus_user', JSON.stringify(res.data.user));
      joinUserRooms(res.data.user.id, res.data.user.college_id, res.data.user.role);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await refreshUser();
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email: string, password: string, role?: string) => {
    const res = await api.post('/auth/login', { email, password, role });
    setAuthData(res.data.token, res.data.user);
    return res.data;
  };

  const registerAdmin = async (data: any) => {
    const res = await api.post('/auth/register-admin', data);
    setAuthData(res.data.token, res.data.user, res.data.college);
    return res.data;
  };

  const registerFaculty = async (data: any) => {
    const res = await api.post('/auth/register-faculty', data);
    return res.data;
  };

  const registerStudent = async (data: any) => {
    const res = await api.post('/auth/register-student', data);
    return res.data;
  };

  const registerCareClub = async (data: any) => {
    const res = await api.post('/auth/register-care-club', data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('campusnexus_token');
    localStorage.removeItem('campusnexus_user');
    setToken(null);
    setUser(null);
    setCollege(null);
    setSettings(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        college,
        settings,
        isLoading,
        login,
        loginWithToken: (newToken: string, newUser: User, newCollege?: College, newSettings?: CollegeSettings) => setAuthData(newToken, newUser, newCollege, newSettings),
        registerAdmin,
        registerFaculty,
        registerStudent,
        registerCareClub,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
