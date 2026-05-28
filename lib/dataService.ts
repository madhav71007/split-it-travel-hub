import { supabase } from "./supabaseClient";

// Helper to check if Supabase is properly configured with real credentials
export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return (
    url.length > 0 &&
    !url.includes("placeholder") &&
    key.length > 0 &&
    !key.includes("placeholder") &&
    !key.includes("YOUR_COPIED")
  );
};

// Rich Mock Data Fallbacks
export const mockUsers = [
  { id: "u1", name: "Alice", email: "alice@example.com", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alice" },
  { id: "u2", name: "Bob", email: "bob@example.com", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Bob" },
  { id: "u3", name: "Charlie", email: "charlie@example.com", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie" },
  { id: "u4", name: "David", email: "david@example.com", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=David" },
  { id: "u5", name: "Emma", email: "emma@example.com", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Emma" },
];

export const mockItinerary = [
  { id: "1", dayNumber: 1, time: "07:00 AM", activity: "Assemble at Meeting Point (Gateway of India)", notes: "Please arrive on time. Quick breakfast before starting our drive." },
  { id: "2", dayNumber: 1, time: "10:30 AM", activity: "Check-in at Lonavala Villa", locationName: "Whispering Pines Villa", locationUrl: "https://maps.google.com", notes: "Welcome drinks & room allocation." },
  { id: "3", dayNumber: 1, time: "01:00 PM", activity: "Group Lunch at German Bakery", locationName: "German Bakery Wunderbar", locationUrl: "https://maps.google.com", notes: "Pre-ordered set menu to save time." },
  { id: "4", dayNumber: 1, time: "04:30 PM", activity: "Sunset Trek to Tiger Point", locationName: "Tiger Point Lookout", locationUrl: "https://maps.google.com", notes: "Carry jackets; it gets breezy and chilly." },
  { id: "5", dayNumber: 2, time: "09:00 AM", activity: "Adventure Sports at Della Adventure Park", locationName: "Della Adventure", locationUrl: "https://maps.google.com", notes: "Wear comfortable sportswear. Passes are pre-booked." },
  { id: "6", dayNumber: 2, time: "08:00 PM", activity: "Barbecue & Music Night", notes: "At the villa courtyard. Shared expenses for BBQ supplies." },
];

export const mockExpenses = [
  { id: "e1", tripId: "t1", description: "Villa Booking Deposit", amount: 15000, paidById: "u1", createdAt: "2026-05-27T10:00:00.000Z" },
  { id: "e2", tripId: "t1", description: "Rental SUV Fuel", amount: 4500, paidById: "u2", createdAt: "2026-05-27T12:30:00.000Z" },
  { id: "e3", tripId: "t1", description: "German Bakery Lunch", amount: 3500, paidById: "u3", createdAt: "2026-05-27T14:15:00.000Z" },
  { id: "e4", tripId: "t1", description: "BBQ Charcoal & Meat", amount: 2000, paidById: "u4", createdAt: "2026-05-27T18:00:00.000Z" },
];

export const mockSplits = [
  // Villa splits (divided equally among 5 users = 3000 each)
  { id: "s1_1", expenseId: "e1", userId: "u1", amount: 3000 },
  { id: "s1_2", expenseId: "e1", userId: "u2", amount: 3000 },
  { id: "s1_3", expenseId: "e1", userId: "u3", amount: 3000 },
  { id: "s1_4", expenseId: "e1", userId: "u4", amount: 3000 },
  { id: "s1_5", expenseId: "e1", userId: "u5", amount: 3000 },
  // Fuel splits
  { id: "s2_1", expenseId: "e2", userId: "u1", amount: 900 },
  { id: "s2_2", expenseId: "e2", userId: "u2", amount: 900 },
  { id: "s2_3", expenseId: "e2", userId: "u3", amount: 900 },
  { id: "s2_4", expenseId: "e2", userId: "u4", amount: 900 },
  { id: "s2_5", expenseId: "e2", userId: "u5", amount: 900 },
  // Lunch splits
  { id: "s3_1", expenseId: "e3", userId: "u1", amount: 700 },
  { id: "s3_2", expenseId: "e3", userId: "u2", amount: 700 },
  { id: "s3_3", expenseId: "e3", userId: "u3", amount: 700 },
  { id: "s3_4", expenseId: "e3", userId: "u4", amount: 700 },
  { id: "s3_5", expenseId: "e3", userId: "u5", amount: 700 },
  // BBQ splits
  { id: "s4_1", expenseId: "e4", userId: "u1", amount: 400 },
  { id: "s4_2", expenseId: "e4", userId: "u2", amount: 400 },
  { id: "s4_3", expenseId: "e4", userId: "u3", amount: 400 },
  { id: "s4_4", expenseId: "e4", userId: "u4", amount: 400 },
  { id: "s4_5", expenseId: "e4", userId: "u5", amount: 400 },
];

export const mockVehicles = [
  { id: "v1", name: "Tata Harrier (SUV)", driverName: "Bob", driverPhone: "+91 98765 43210", routeLink: "https://maps.google.com", capacity: 5, passengers: ["Bob", "Alice", "David"] },
  { id: "v2", name: "Hyundai Creta (SUV)", driverName: "Charlie", driverPhone: "+91 91234 56789", routeLink: "https://maps.google.com", capacity: 5, passengers: ["Charlie", "Emma"] },
];

export const mockPolls = [
  { id: "p1", question: "Where should we stop for tea/snacks along the highway?", options: ["Lonavala Expressway Food Court", "Datta Food Mall", "Sunny Da Dhaba"], votes: { 0: 5, 1: 3, 2: 1 }, expiresAt: "2026-05-28T18:00:00.000Z", userVotedIndex: undefined },
  { id: "p2", question: "Which activities should we book for Saturday morning?", options: ["Pawna Lake Camping & Kayaking", "Della Adventure Park (All-Day Pass)", "Relax at the Villa (Pool Party & BBQ)"], votes: { 0: 2, 1: 6, 2: 2 }, expiresAt: "2026-05-27T23:59:59.000Z", userVotedIndex: 1 },
];

// Data service methods with Model Mapping
export async function getTripDetails(inviteCode: string) {
  if (!isSupabaseConfigured()) {
    return { id: "t1", title: "Lonavala Weekend Getaway", destination: "Lonavala, IN", startDate: "2026-05-28", endDate: "2026-05-30", inviteCode, ownerId: "u1", isActive: true };
  }
  try {
    const { data, error } = await supabase.from("trips").select("*").eq("invite_code", inviteCode).single();
    if (error || !data) throw error || new Error("No trip found");
    return {
      id: data.id,
      title: data.title,
      destination: data.destination,
      startDate: data.start_date,
      endDate: data.end_date,
      inviteCode: data.invite_code,
      ownerId: data.owner_id,
      isActive: data.is_active
    };
  } catch (err) {
    console.warn("getTripDetails failed, using fallback mock data:", err);
    return { id: "t1", title: "Lonavala Weekend Getaway", destination: "Lonavala, IN", startDate: "2026-05-28", endDate: "2026-05-30", inviteCode, ownerId: "u1", isActive: true };
  }
}

export async function getItinerary(tripId: string) {
  if (!isSupabaseConfigured()) return mockItinerary;
  try {
    const { data, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("trip_id", tripId)
      .order("day_number", { ascending: true })
      .order("time", { ascending: true });
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(item => ({
        id: item.id,
        dayNumber: item.day_number,
        time: item.time,
        activity: item.activity,
        locationUrl: item.location_url,
        notes: item.notes
      }));
    }
    return mockItinerary;
  } catch (err) {
    console.warn("getItinerary failed, using fallback mock data:", err);
    return mockItinerary;
  }
}

export async function getExpenses(tripId: string) {
  if (!isSupabaseConfigured()) return mockExpenses;
  try {
    const { data, error } = await supabase.from("expenses").select("*").eq("trip_id", tripId).order("created_at", { ascending: false });
    if (error) throw error;
    if (data && data.length > 0) {
      return data.map(item => ({
        id: item.id,
        tripId: item.trip_id,
        description: item.description,
        amount: Number(item.amount),
        paidById: item.paid_by_id,
        createdAt: item.created_at
      }));
    }
    return mockExpenses;
  } catch (err) {
    console.warn("getExpenses failed, using fallback mock data:", err);
    return mockExpenses;
  }
}

export async function getExpenseSplits(tripId: string) {
  if (!isSupabaseConfigured()) return mockSplits;
  try {
    const { data: expenses } = await supabase.from("expenses").select("id").eq("trip_id", tripId);
    if (!expenses || expenses.length === 0) return mockSplits;
    
    const expenseIds = expenses.map(e => e.id);
    const { data, error } = await supabase.from("expense_splits").select("*").in("expense_id", expenseIds);
    if (error) throw error;
    if (data && data.length > 0) {
      return data.map(item => ({
        id: item.id,
        expenseId: item.expense_id,
        userId: item.user_id,
        amount: Number(item.amount)
      }));
    }
    return mockSplits;
  } catch (err) {
    console.warn("getExpenseSplits failed, using fallback mock data:", err);
    return mockSplits;
  }
}

export async function saveExpense(expense: any, splits: any[]) {
  if (!isSupabaseConfigured()) return { success: true, expense, splits };
  try {
    const dbExpense = {
      trip_id: expense.tripId,
      description: expense.description,
      amount: expense.amount,
      paid_by_id: expense.paidById,
      created_at: expense.createdAt
    };
    const { data: newExpense, error: expError } = await supabase.from("expenses").insert([dbExpense]).select().single();
    if (expError) throw expError;

    const formattedSplits = splits.map(s => ({
      expense_id: newExpense.id,
      user_id: s.userId,
      amount: s.amount
    }));
    
    const { error: splitError } = await supabase.from("expense_splits").insert(formattedSplits);
    if (splitError) throw splitError;

    return {
      success: true,
      expense: {
        id: newExpense.id,
        tripId: newExpense.trip_id,
        description: newExpense.description,
        amount: Number(newExpense.amount),
        paidById: newExpense.paid_by_id,
        createdAt: newExpense.created_at
      }
    };
  } catch (err) {
    console.error("saveExpense failed:", err);
    return { success: false, error: err };
  }
}

export async function deleteExpense(expenseId: string) {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("deleteExpense failed:", err);
    return { success: false, error: err };
  }
}

export async function getVehicles(tripId: string) {
  if (!isSupabaseConfigured()) return mockVehicles;
  try {
    const { data, error } = await supabase.from("vehicles").select("*").eq("trip_id", tripId);
    if (error) throw error;
    if (data && data.length > 0) {
      // In database, let's assume route_link mapping. Wait, routeLink matches route_link
      // and driver_phone matches driverPhone, etc.
      // Since schema uses array of passengers or simple text, we'll map driver_name/phone/route_link.
      // Note: passengers can be loaded from mock or handled via metadata if we have a table join, 
      // but let's parse passenger list safely.
      return data.map(item => ({
        id: item.id,
        name: item.name,
        driverName: item.driver_name,
        driverPhone: item.driver_phone,
        routeLink: item.route_link,
        capacity: 5, // default capacity
        passengers: item.passengers || []
      }));
    }
    return mockVehicles;
  } catch (err) {
    console.warn("getVehicles failed, using fallback mock data:", err);
    return mockVehicles;
  }
}

export async function savePassenger(vehicleId: string, passengers: string[]) {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const { error } = await supabase.from("vehicles").update({ passengers }).eq("id", vehicleId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("savePassenger failed:", err);
    return { success: false, error: err };
  }
}

export async function getPolls(tripId: string) {
  if (!isSupabaseConfigured()) return mockPolls;
  try {
    const { data, error } = await supabase.from("polls").select("*").eq("trip_id", tripId).order("created_at", { ascending: false });
    if (error) throw error;
    
    if (!data || data.length === 0) return mockPolls;
    const pollIds = data.map(p => p.id);
    const { data: votesData } = await supabase.from("votes").select("*").in("poll_id", pollIds);

    const formattedPolls = data.map(p => {
      const optionVotes: Record<number, number> = {};
      p.options.forEach((_: any, idx: number) => {
        optionVotes[idx] = 0;
      });

      let userVotedIndex: number | undefined = undefined;
      
      if (votesData) {
        votesData.forEach(v => {
          if (v.poll_id === p.id) {
            optionVotes[v.option_index] = (optionVotes[v.option_index] || 0) + 1;
            // Simulated user vote match
            if (v.user_id === "current-user-uuid") {
              userVotedIndex = v.option_index;
            }
          }
        });
      }

      return {
        id: p.id,
        question: p.question,
        options: p.options,
        votes: optionVotes,
        expiresAt: p.expires_at,
        userVotedIndex
      };
    });

    return formattedPolls;
  } catch (err) {
    console.warn("getPolls failed, using fallback mock data:", err);
    return mockPolls;
  }
}

export async function saveVote(pollId: string, optionIndex: number) {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const userId = "current-user-uuid"; // Simulated ID
    
    await supabase.from("votes").delete().eq("poll_id", pollId).eq("user_id", userId);
    
    const { error } = await supabase.from("votes").insert([{
      poll_id: pollId,
      user_id: userId,
      option_index: optionIndex
    }]);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("saveVote failed:", err);
    return { success: false, error: err };
  }
}

export async function savePoll(poll: any) {
  if (!isSupabaseConfigured()) return { success: true, poll };
  try {
    const dbPoll = {
      trip_id: poll.tripId,
      question: poll.question,
      options: poll.options,
      expires_at: poll.expiresAt
    };
    const { data, error } = await supabase.from("polls").insert([dbPoll]).select().single();
    if (error) throw error;
    return {
      success: true,
      poll: {
        id: data.id,
        question: data.question,
        options: data.options,
        expiresAt: data.expires_at,
        votes: {}
      }
    };
  } catch (err) {
    console.error("savePoll failed:", err);
    return { success: false, error: err };
  }
}

export async function saveTrip(trip: any) {
  if (!isSupabaseConfigured()) {
    return { 
      success: true, 
      trip: { 
        ...trip, 
        id: `t_${Date.now()}`, 
        inviteCode: trip.inviteCode || "MOCK-CODE", 
        ownerId: "u1", 
        isActive: true 
      } 
    };
  }
  try {
    const dbTrip = {
      title: trip.title,
      destination: trip.destination,
      start_date: trip.startDate,
      end_date: trip.endDate,
      invite_code: trip.inviteCode,
      owner_id: trip.ownerId || "u1",
      is_active: trip.isActive !== undefined ? trip.isActive : true
    };
    const { data, error } = await supabase.from("trips").insert([dbTrip]).select().single();
    if (error) throw error;
    return {
      success: true,
      trip: {
        id: data.id,
        title: data.title,
        destination: data.destination,
        startDate: data.start_date,
        endDate: data.end_date,
        inviteCode: data.invite_code,
        ownerId: data.owner_id,
        isActive: data.is_active
      }
    };
  } catch (err) {
    console.error("saveTrip failed:", err);
    return { success: false, error: err };
  }
}

export async function toggleTripActive(tripId: string, isActive: boolean) {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const { error } = await supabase.from("trips").update({ is_active: isActive }).eq("id", tripId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("toggleTripActive failed:", err);
    return { success: false, error: err };
  }
}
