import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, UserType } from '../types';

interface AuthContextType {
  authState: AuthState;
  login: (phoneNumber: string, otp: string, userType: UserType) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const user: User = JSON.parse(userData);
        setAuthState({
          isAuthenticated: true,
          user,
          token,
        });
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phoneNumber: string, otp: string, userType: UserType): Promise<boolean> => {
    try {
      // Mock OTP validation - accept 123456 as valid OTP
      if (otp !== '123456') {
        return false;
      }

      // 1. Load user database
      const usersData = await AsyncStorage.getItem('userDatabase');
      const users: User[] = usersData ? JSON.parse(usersData) : [];

      // 2. Find existing user
      let user = users.find(u => u.phoneNumber === phoneNumber && u.type === userType);

      // 3. If user doesn't exist, create one and save it
      if (!user) {
        user = {
          id: `${userType}_${Date.now()}`,
          phoneNumber,
          name: userType === 'customer' ? 'Customer User' : 'Partner User',
          type: userType,
        };
        users.push(user);
        await AsyncStorage.setItem('userDatabase', JSON.stringify(users));
      }

      const token = `token_${Date.now()}`;

      // Store in AsyncStorage
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      setAuthState({
        isAuthenticated: true,
        user,
        token,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    authState,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 