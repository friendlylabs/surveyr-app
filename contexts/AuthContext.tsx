import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  fullname: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  projectUrl: string | null;
  login: (token: string, user: User, projectUrl: string, projectId: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [projectUrl, setProjectUrl] = useState<string | null>(null);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const [storedToken, storedUser, storedProjectUrl] = await AsyncStorage.multiGet([
        'token',
        'user',
        'projectUrl'
      ]);

      if (storedToken[1] && storedUser[1] && storedProjectUrl[1]) {
        // Validate token by making a simple API call
        const isValid = await validateToken(storedToken[1], storedProjectUrl[1]);
        
        if (isValid) {
          setToken(storedToken[1]);
          setUser(JSON.parse(storedUser[1]));
          setProjectUrl(storedProjectUrl[1]);
          setIsAuthenticated(true);
          return true;
        } else {
          // Token is invalid, clear data
          await logout();
        }
      }
      
      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async (token: string, projectUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(`${projectUrl}auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.log('Token validation failed:', error);
      return false;
    }
  };

  const login = async (token: string, user: User, projectUrl: string, projectId: string): Promise<void> => {
    try {
      await AsyncStorage.multiSet([
        ['token', token],
        ['user', JSON.stringify(user)],
        ['projectUrl', projectUrl],
        ['project', projectId],
      ]);

      setToken(token);
      setUser(user);
      setProjectUrl(projectUrl);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(['token', 'user', 'projectUrl', 'project']);
      setToken(null);
      setUser(null);
      setProjectUrl(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    token,
    projectUrl,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
