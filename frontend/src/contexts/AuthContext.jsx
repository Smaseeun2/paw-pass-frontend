import React, { createContext, useState, useContext, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { loginWithGoogleCode, logoutBackend } from '../services/api';
import { toast } from '../utils/toast';
import { migrateGuestRoutes } from '../utils/migrationUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('paw_pass_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
    };
    
    window.addEventListener('paw_pass_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('paw_pass_auth_expired', handleAuthExpired);
  }, []);

  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        const response = await loginWithGoogleCode(codeResponse.code);
        const result = response.data || response;

        if (result.access_token) localStorage.setItem('paw_pass_access_token', result.access_token);
        if (result.refresh_token) localStorage.setItem('paw_pass_refresh_token', result.refresh_token);

        if (result.user) {
          setUser(result.user);
          localStorage.setItem('paw_pass_user', JSON.stringify(result.user));
          
          migrateGuestRoutes(result.user);

          toast.success(`환영합니다, ${result.user.name}님! 🐾`);
        }
      } catch (error) {
        console.error('로그인 실패:', error);
        toast.error('로그인 처리에 실패했습니다.');
      }
    }
  });

  const logout = async (navigateCallback) => {
    const refreshToken = localStorage.getItem('paw_pass_refresh_token');
    if (refreshToken) {
      await logoutBackend(refreshToken);
    }
    googleLogout();
    setUser(null);
    localStorage.removeItem('paw_pass_user');
    localStorage.removeItem('paw_pass_access_token');
    localStorage.removeItem('paw_pass_refresh_token');
    localStorage.removeItem('paw_pass_pets_guest');

    toast.info('로그아웃 되었습니다.');
    if (navigateCallback) navigateCallback();
  };

  const withdraw = async (navigateCallback) => {
    try {
      const currentUser = user;
      const { withdrawAccount } = await import('../services/api');
      await withdrawAccount();
      
      googleLogout();
      setUser(null);
      localStorage.removeItem('paw_pass_user');
      localStorage.removeItem('paw_pass_access_token');
      localStorage.removeItem('paw_pass_refresh_token');
      localStorage.removeItem('paw_pass_pets_guest');

      if (currentUser?.email) {
        localStorage.removeItem(`paw_pass_favorites_${currentUser.email}`);
        localStorage.removeItem(`paw_pass_routes_${currentUser.email}`);
      }
      if (currentUser?.id) {
        localStorage.removeItem(`paw_pass_routes_${currentUser.id}`);
      }

      toast.success('회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
      if (navigateCallback) navigateCallback();
    } catch (error) {
      console.error('회원 탈퇴 실패:', error);
      toast.error('회원 탈퇴 처리 중 문제가 발생했습니다.');
    }
  };

  const updateUser = (newUser) => {
    setUser(newUser);
    localStorage.setItem('paw_pass_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, withdraw, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
