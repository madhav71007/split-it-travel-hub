import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabaseClient';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';


export interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  invite_code: string;
  is_active: boolean;
  owner_id?: string;
  created_at?: string;
}

export interface TripMember {
  id: string;
  name: string;
  avatarUrl: string;
}

interface TripContextType {
  trips: Trip[];
  activeTripId: string | null;
  activeTrip: Trip | null;
  members: TripMember[];
  loading: boolean;
  selectTrip: (tripId: string) => Promise<void>;
  createTrip: (title: string, destination: string, start_date: string, end_date: string, initialMembers: string[]) => Promise<Trip | null>;
  joinTrip: (inviteCode: string, memberName: string) => Promise<Trip | null>;
  addMember: (name: string) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  refreshTrips: () => Promise<void>;
}

const TripContext = createContext<TripContextType | null>(null);

export const useTrip = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within a TripProvider');
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

export const TripProvider = ({ children }: { children: React.ReactNode }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();


  // Load default/mock members if none are found in storage
  const getDefaultMembers = (tripId: string): TripMember[] => {
    return [
      { id: `m_${tripId}_1`, name: 'Alice', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face' },
      { id: `m_${tripId}_2`, name: 'Bob', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
      { id: `m_${tripId}_3`, name: 'Charlie', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face' },
    ];
  };

  const loadMembers = async (tripId: string) => {
    if (!tripId) return;
    try {
      // 1. Try to fetch from database if supabase is configured
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('trip_members')
            .select('*')
            .eq('trip_id', tripId);

          if (!error && data && data.length > 0) {
            const dbMembers = data.map((m: any) => ({
              id: m.id || m.user_id,
              name: m.name || m.user_name || 'Member',
              avatarUrl: m.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.name || m.id}`,
            }));
            setMembers(dbMembers);
            return;
          }
        } catch (dbErr) {
          // Table probably doesn't exist, fall back to local storage
        }
      }

      // 2. Fetch from AsyncStorage
      const stored = await AsyncStorage.getItem(`trip_members_${tripId}`);
      if (stored) {
        setMembers(JSON.parse(stored));
      } else {
        const defaults = getDefaultMembers(tripId);
        await AsyncStorage.setItem(`trip_members_${tripId}`, JSON.stringify(defaults));
        setMembers(defaults);
      }
    } catch (e) {
      console.warn('Error loading trip members:', e);
    }
  };

  const refreshTrips = useCallback(async () => {
    setLoading(true);
    try {
      let allTrips: Trip[] = [];

      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          allTrips = data;
        }
      } else {
        const stored = await AsyncStorage.getItem(`local_trips_${user?.id || 'guest'}`);
        if (stored) {
          allTrips = JSON.parse(stored);
        } else {
          // Initial mock trip
          const mockTrip: Trip = {
            id: 't1',
            title: 'Lonavala Weekend Getaway',
            destination: 'Lonavala, IN',
            start_date: '2026-05-28',
            end_date: '2026-05-30',
            invite_code: 'LONA2026',
            is_active: true,
            owner_id: user?.id || 'guest',
          };
          allTrips = [mockTrip];
          await AsyncStorage.setItem(`local_trips_${user?.id || 'guest'}`, JSON.stringify(allTrips));
        }
      }


      setTrips(allTrips);

      // Load active trip selection
      const savedActiveId = await AsyncStorage.getItem('active_trip_id');
      let currentActive = allTrips.find((t) => t.id === savedActiveId);

      if (!currentActive && allTrips.length > 0) {
        // Fallback to first active trip or first trip
        currentActive = allTrips.find((t) => t.is_active) || allTrips[0];
      }

      if (currentActive) {
        setActiveTripId(currentActive.id);
        setActiveTrip(currentActive);
        await loadMembers(currentActive.id);
      } else {
        setActiveTripId(null);
        setActiveTrip(null);
        setMembers([]);
      }
    } catch (e) {
      console.warn('Error refreshing trips:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);


  const selectTrip = async (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (trip) {
      setActiveTripId(trip.id);
      setActiveTrip(trip);
      await AsyncStorage.setItem('active_trip_id', trip.id);
      await loadMembers(trip.id);
    }
  };

  const createTrip = async (
    title: string,
    destination: string,
    start_date: string,
    end_date: string,
    initialMembers: string[]
  ): Promise<Trip | null> => {
    try {
      const invite_code = Math.random().toString(36).substring(2, 10).toUpperCase();
      let newTrip: Trip;

      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('trips')
          .insert([
            {
              title,
              destination,
              start_date: start_date || null,
              end_date: end_date || null,
              invite_code,
              owner_id: user?.id || 'guest',
              is_active: true,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        newTrip = data;

        // Try to save members in db if table exists
        try {
          const dbMembersToInsert = initialMembers.map((name) => ({
            trip_id: newTrip.id,
            name,
          }));
          await supabase.from('trip_members').insert(dbMembersToInsert);
        } catch (dbErr) {
          // If table doesn't exist, we will write to AsyncStorage below
        }
      } else {
        newTrip = {
          id: `t_${Date.now()}`,
          title,
          destination,
          start_date,
          end_date,
          invite_code,
          is_active: true,
          owner_id: user?.id || 'guest',
        };
        const updated = [newTrip, ...trips];
        setTrips(updated);
        await AsyncStorage.setItem(`local_trips_${user?.id || 'guest'}`, JSON.stringify(updated));
      }


      // Save initial member list to AsyncStorage
      const formattedMembers: TripMember[] = initialMembers.map((name, index) => ({
        id: `m_${newTrip.id}_${Date.now()}_${index}`,
        name,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
      }));
      await AsyncStorage.setItem(`trip_members_${newTrip.id}`, JSON.stringify(formattedMembers));

      await selectTrip(newTrip.id);
      await refreshTrips();
      return newTrip;
    } catch (e: any) {
      Alert.alert('Error creating trip', e.message);
      return null;
    }
  };

  const joinTrip = async (inviteCode: string, memberName: string): Promise<Trip | null> => {
    try {
      let matchedTrip: Trip | undefined;

      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('invite_code', inviteCode.trim().toUpperCase())
          .single();

        if (error || !data) {
          throw new Error('Trip not found. Please verify the invite code.');
        }
        matchedTrip = data;

        // Try to insert participant in database
        try {
          await supabase.from('trip_members').insert([
            {
              trip_id: data.id,
              name: memberName,
            },
          ]);
        } catch (dbErr) {
          // Table doesn't exist, we will use AsyncStorage fallback
        }
      } else {
        // Fallback local search
        matchedTrip = trips.find(
          (t) => t.invite_code.toUpperCase() === inviteCode.trim().toUpperCase()
        );
      }

      if (!matchedTrip) {
        throw new Error('Trip not found. Please verify the invite code.');
      }

      // Add user to the members list in AsyncStorage
      const currentMembersStored = await AsyncStorage.getItem(`trip_members_${matchedTrip.id}`);
      let currentMembersList: TripMember[] = currentMembersStored ? JSON.parse(currentMembersStored) : getDefaultMembers(matchedTrip.id);
      
      const newMember: TripMember = {
        id: `m_${matchedTrip.id}_${Date.now()}_join`,
        name: memberName,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${memberName}`,
      };

      if (!currentMembersList.some((m) => m.name.toLowerCase() === memberName.toLowerCase())) {
        currentMembersList.push(newMember);
        await AsyncStorage.setItem(`trip_members_${matchedTrip.id}`, JSON.stringify(currentMembersList));
      }

      // Save to local trips list if not already there (for local access)
      if (!isSupabaseConfigured()) {
        if (!trips.some((t) => t.id === matchedTrip.id)) {
          const updated = [matchedTrip, ...trips];
          setTrips(updated);
          await AsyncStorage.setItem(`local_trips_${user?.id || 'guest'}`, JSON.stringify(updated));
        }
      }


      await selectTrip(matchedTrip.id);
      await refreshTrips();
      return matchedTrip;
    } catch (e: any) {
      Alert.alert('Join Failed', e.message);
      return null;
    }
  };

  const addMember = async (name: string) => {
    if (!activeTripId) return;
    try {
      const newMember: TripMember = {
        id: `m_${activeTripId}_${Date.now()}_add`,
        name,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
      };

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('trip_members').insert([
            {
              trip_id: activeTripId,
              name,
            },
          ]);
        } catch (dbErr) {
          // Table doesn't exist
        }
      }

      const updated = [...members, newMember];
      setMembers(updated);
      await AsyncStorage.setItem(`trip_members_${activeTripId}`, JSON.stringify(updated));
    } catch (e: any) {
      Alert.alert('Error adding member', e.message);
    }
  };

  const removeMember = async (id: string) => {
    if (!activeTripId) return;
    try {
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('trip_members').delete().eq('id', id);
        } catch (dbErr) {
          // Table doesn't exist
        }
      }

      const updated = members.filter((m) => m.id !== id);
      setMembers(updated);
      await AsyncStorage.setItem(`trip_members_${activeTripId}`, JSON.stringify(updated));
    } catch (e: any) {
      Alert.alert('Error removing member', e.message);
    }
  };

  useEffect(() => {
    refreshTrips();
  }, [refreshTrips]);

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTripId,
        activeTrip,
        members,
        loading,
        selectTrip,
        createTrip,
        joinTrip,
        addMember,
        removeMember,
        refreshTrips,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};
