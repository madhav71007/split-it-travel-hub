import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabaseClient';
import { Alert } from 'react-native';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isOfflineMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

const isSupabaseConfigured = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  return (
    url.length > 0 &&
    url.startsWith('https://') &&
    key.length > 0 &&
    key !== 'YOUR_COPIED_PUBLISHABLE_ANON_KEY'
  );
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(!isSupabaseConfigured());

  // Supabase Auth Listener
  useEffect(() => {
    if (!isOfflineMode) {
      // 1. Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${session.user.id}`,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      // 2. Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${session.user.id}`,
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Offline local load session
      const loadLocalSession = async () => {
        try {
          const sessionStr = await AsyncStorage.getItem('local_user_session');
          if (sessionStr) {
            setUser(JSON.parse(sessionStr));
          }
        } catch (e) {
          console.warn('Error reading local user session:', e);
        } finally {
          setLoading(false);
        }
      };
      loadLocalSession();
    }
  }, [isOfflineMode]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (!isOfflineMode) {
        // Cloud sign in
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session && data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'User',
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.user.id}`,
          });
        }
      } else {
        // Local simulator sign in
        const usersStr = await AsyncStorage.getItem('local_registered_users');
        const users = usersStr ? JSON.parse(usersStr) : [];
        const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase().trim());
        if (!found) {
          throw new Error('No account found with this email. Please register first.');
        }
        if (found.password !== password) {
          throw new Error('Incorrect password. Please try again.');
        }

        const profile: UserProfile = {
          id: found.id,
          email: found.email,
          name: found.name,
          avatarUrl: found.avatarUrl,
        };

        await AsyncStorage.setItem('local_user_session', JSON.stringify(profile));
        setUser(profile);
      }
    } catch (e: any) {
      Alert.alert('Sign In Failed', e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      if (!isOfflineMode) {
        // Cloud sign up
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
            },
          },
        });
        if (error) throw error;
        if (data.session && data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'User',
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.user.id}`,
          });
          Alert.alert('Account Created', 'Successfully registered and logged in!');
        } else if (data.user) {
          Alert.alert(
            'Verification Required',
            'Account created! Please check your email for a verification link to complete your registration, then log in.'
          );
        }
      } else {
        // Local simulator sign up
        if (!displayName.trim()) {
          throw new Error('Display Name is required.');
        }
        const usersStr = await AsyncStorage.getItem('local_registered_users');
        const users = usersStr ? JSON.parse(usersStr) : [];
        if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase().trim())) {
          throw new Error('An account with this email already exists.');
        }

        const newId = `u_local_${Date.now()}`;
        const newLocalUser = {
          id: newId,
          email: email.trim(),
          password,
          name: displayName.trim(),
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${displayName}`,
        };

        const updatedUsers = [...users, newLocalUser];
        await AsyncStorage.setItem('local_registered_users', JSON.stringify(updatedUsers));

        const profile: UserProfile = {
          id: newId,
          email: newLocalUser.email,
          name: newLocalUser.name,
          avatarUrl: newLocalUser.avatarUrl,
        };

        await AsyncStorage.setItem('local_user_session', JSON.stringify(profile));
        setUser(profile);
        Alert.alert('Account Created', 'Successfully registered local offline account!');
      }
    } catch (e: any) {
      Alert.alert('Sign Up Failed', e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (!isOfflineMode) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } else {
        await AsyncStorage.removeItem('local_user_session');
      }
      setUser(null);
    } catch (e: any) {
      Alert.alert('Sign Out Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOfflineMode,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
