import React, { useState, useEffect } from "react";
import { Car, Phone, ExternalLink, Users, Plus, Check, RefreshCw } from "lucide-react";
import { getVehicles, savePassenger, isSupabaseConfigured } from "../lib/dataService";
import { supabase } from "../lib/supabaseClient";
import { ThemePhase } from "../hooks/useTimeTheme";

interface Vehicle {
  id: string;
  name: string;
  driverName: string;
  driverPhone: string;
  routeLink: string;
  capacity: number;
  passengers: string[];
}

const getThemeStyles = (phase: ThemePhase) => {
  switch (phase) {
    case "morning":
      return {
        card: "bg-white/70 backdrop-blur-md border border-emerald-100/50 shadow-sm text-emerald-950",
        cardTitle: "text-emerald-800 font-bold uppercase tracking-wider text-xs",
        btnActive: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200/50",
        btnActiveDisabled: "bg-emerald-100 text-emerald-400 cursor-not-allowed opacity-50",
        progressTrack: "bg-emerald-100",
        progressBar: "bg-emerald-600",
        progressBarFull: "bg-rose-500",
        linkText: "text-emerald-700 hover:text-emerald-900",
        passengerTag: "bg-emerald-50 text-emerald-855 border border-emerald-100/60",
        input: "bg-white/60 border border-emerald-200 focus:border-emerald-400 text-emerald-950 placeholder-emerald-800/40 focus:outline-none",
        textMuted: "text-emerald-800/80",
        textPrimary: "text-emerald-950",
        iconContainer: "bg-emerald-50 border border-emerald-150 text-emerald-700",
        formCancelBtn: "bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 border border-emerald-200",
        addBtn: "border-emerald-350 hover:bg-emerald-50 text-emerald-700",
      };
    case "afternoon":
      return {
        card: "bg-white border border-slate-200 shadow-sm text-slate-900",
        cardTitle: "text-slate-500 font-bold uppercase tracking-wider text-xs",
        btnActive: "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-200/50",
        btnActiveDisabled: "bg-slate-200 text-slate-400 cursor-not-allowed opacity-50",
        progressTrack: "bg-slate-100",
        progressBar: "bg-sky-500",
        progressBarFull: "bg-rose-500",
        linkText: "text-sky-600 hover:text-sky-850",
        passengerTag: "bg-slate-100 text-slate-650 border border-slate-150",
        input: "bg-slate-50 border border-slate-200 focus:border-sky-400 text-slate-900 placeholder-slate-400 focus:outline-none",
        textMuted: "text-slate-500",
        textPrimary: "text-slate-900",
        iconContainer: "bg-slate-50 border border-slate-200 text-slate-600",
        formCancelBtn: "bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200",
        addBtn: "border-slate-300 hover:bg-slate-50 text-slate-650",
      };
    case "evening":
      return {
        card: "bg-slate-955/60 backdrop-blur border border-orange-500/20 shadow-lg text-amber-100",
        cardTitle: "text-orange-400/80 font-bold uppercase tracking-wider text-xs",
        btnActive: "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-950/50",
        btnActiveDisabled: "bg-slate-800 text-orange-900/60 cursor-not-allowed opacity-50",
        progressTrack: "bg-slate-900/60",
        progressBar: "bg-orange-500",
        progressBarFull: "bg-rose-500",
        linkText: "text-orange-400 hover:text-orange-300",
        passengerTag: "bg-slate-900/80 text-amber-200 border border-orange-900/30",
        input: "bg-slate-900/60 border border-orange-900/40 focus:border-orange-500/60 text-amber-100 placeholder-amber-200/30 focus:outline-none",
        textMuted: "text-amber-200/60",
        textPrimary: "text-amber-50",
        iconContainer: "bg-slate-900 border border-orange-955 text-orange-400",
        formCancelBtn: "bg-slate-900 hover:bg-slate-855 text-amber-300/80 border border-orange-900/40",
        addBtn: "border-orange-900/40 hover:bg-orange-950/20 text-orange-400",
      };
    default: // night
      return {
        card: "bg-slate-950 border border-slate-900 shadow-md text-slate-100",
        cardTitle: "text-slate-400 font-bold uppercase tracking-wider text-xs",
        btnActive: "bg-white text-slate-955 hover:bg-slate-200 shadow-md shadow-white/5",
        btnActiveDisabled: "bg-slate-900 text-slate-600 cursor-not-allowed opacity-50",
        progressTrack: "bg-slate-900",
        progressBar: "bg-white",
        progressBarFull: "bg-rose-500",
        linkText: "text-slate-400 hover:text-white",
        passengerTag: "bg-slate-900 text-slate-300 border border-slate-800/60",
        input: "bg-slate-900 border border-slate-800 focus:border-slate-700 text-white placeholder-slate-500 focus:outline-none",
        textMuted: "text-slate-400",
        textPrimary: "text-slate-100",
        iconContainer: "bg-slate-900 border border-slate-800 text-white",
        formCancelBtn: "bg-slate-900 hover:bg-slate-855 text-slate-400 hover:text-white border border-slate-800",
        addBtn: "border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white",
      };
  }
};

export default function ConvoyTab({ 
  isActive = true, 
  themePhase = "night" 
}: { 
  isActive?: boolean; 
  themePhase?: ThemePhase 
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPassengerName, setNewPassengerName] = useState("");
  const [addingToVehicleId, setAddingToVehicleId] = useState<string | null>(null);

  const styles = getThemeStyles(themePhase);

  const loadVehiclesData = async () => {
    try {
      const data = await getVehicles("t1");
      setVehicles(data);
    } catch (err) {
      console.error("Error loading vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehiclesData();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("vehicles-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "vehicles" },
          () => {
            loadVehiclesData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Handle adding a passenger
  const handleAddPassenger = async (vehicleId: string) => {
    if (!newPassengerName.trim()) return;

    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    if (vehicle.passengers.length >= vehicle.capacity) {
      alert("Vehicle is already at full capacity!");
      return;
    }

    const updatedPassengers = [...vehicle.passengers, newPassengerName.trim()];

    if (isSupabaseConfigured()) {
      const res = await savePassenger(vehicleId, updatedPassengers);
      if (res.success) {
        loadVehiclesData();
      } else {
        alert("Failed to update passengers in database. Updating locally.");
        setVehicles((prev) =>
          prev.map((v) => (v.id === vehicleId ? { ...v, passengers: updatedPassengers } : v))
        );
      }
    } else {
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, passengers: updatedPassengers } : v))
      );
    }

    setNewPassengerName("");
    setAddingToVehicleId(null);
  };

  if (loading) {
    return (
      <div className={`h-48 flex items-center justify-center ${styles.textMuted}`}>
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading convoy...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Convoy Header Summary */}
      <div className={`rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${styles.card}`}>
        <div>
          <h3 className={styles.cardTitle}>
            Convoy Logistics
          </h3>
          <p className={`text-xs mt-1 ${styles.textMuted}`}>
            {vehicles.length} vehicles active • {vehicles.reduce((acc, v) => acc + v.passengers.length, 0)} passengers assigned
          </p>
        </div>
        <button
          disabled={!isActive}
          className={`font-semibold text-xs py-2 px-4 rounded-lg flex items-center shadow-lg transition-all duration-300 ${
            !isActive ? styles.btnActiveDisabled : styles.btnActive
          }`}
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[3]" /> Add Car
        </button>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vehicles.map((vehicle) => {
          const filledSeats = vehicle.passengers.length;
          const availableSeats = vehicle.capacity - filledSeats;
          const fillPercentage = (filledSeats / vehicle.capacity) * 100;

          return (
            <div
              key={vehicle.id}
              className={`rounded-xl p-5 space-y-4 hover:border-current/30 transition-all duration-300 flex flex-col justify-between ${styles.card}`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className={`border p-2.5 rounded-lg ${styles.iconContainer}`}>
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-semibold tracking-wide ${styles.textPrimary}`}>
                        {vehicle.name}
                      </h4>
                      <p className={`text-[10px] ${styles.textMuted}`}>
                        Driver: <span className="font-medium opacity-90">{vehicle.driverName}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] border px-2 py-0.5 rounded font-mono ${styles.passengerTag}`}>
                    {filledSeats}/{vehicle.capacity} Seats
                  </span>
                </div>

                {/* Progress bar */}
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${styles.progressTrack}`}>
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      fillPercentage >= 100 ? styles.progressBarFull : styles.progressBar
                    }`}
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>

                {/* Driver phone and route link */}
                <div className="flex flex-wrap items-center gap-3 pt-1 border-b border-current/5 pb-2">
                  <a
                    href={`tel:${vehicle.driverPhone}`}
                    className={`inline-flex items-center text-xs hover:underline transition-colors duration-300 ${styles.textMuted}`}
                  >
                    <Phone className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                    {vehicle.driverPhone}
                  </a>
                  {vehicle.routeLink && (
                    <a
                      href={vehicle.routeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center text-xs hover:underline transition-colors duration-300 ml-auto ${styles.textMuted}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                      View Route Map
                    </a>
                  )}
                </div>

                {/* Passenger list */}
                <div className="space-y-2 pt-1">
                  <div className={`flex items-center text-[10px] uppercase tracking-wider ${styles.textMuted}`}>
                    <Users className="w-3 h-3 mr-1.5 opacity-80" />
                    Passengers
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {vehicle.passengers.map((p, idx) => (
                      <span
                        key={idx}
                        className={`text-xs border rounded-lg px-2.5 py-1 ${styles.passengerTag}`}
                      >
                        {p}
                      </span>
                    ))}
                    {isActive && availableSeats > 0 && addingToVehicleId !== vehicle.id && (
                      <button
                        onClick={() => setAddingToVehicleId(vehicle.id)}
                        className={`text-xs border border-dashed rounded-lg px-2.5 py-1 flex items-center transition-colors duration-300 ${styles.addBtn}`}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Passenger
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Passenger Mini Form */}
              {addingToVehicleId === vehicle.id && (
                <div className="mt-4 pt-4 border-t border-current/10 flex space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <input
                    type="text"
                    required
                    placeholder="Enter name..."
                    value={newPassengerName}
                    onChange={(e) => setNewPassengerName(e.target.value)}
                    className={`flex-1 rounded-lg py-1.5 px-3 text-xs ${styles.input}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddPassenger(vehicle.id);
                    }}
                  />
                  <button
                    onClick={() => handleAddPassenger(vehicle.id)}
                    className={`rounded-lg p-1.5 font-semibold text-xs shadow flex items-center justify-center transition-colors duration-300 ${styles.btnActive}`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAddingToVehicleId(null)}
                    className={`rounded-lg px-2.5 text-xs font-semibold border transition-colors duration-300 ${styles.formCancelBtn}`}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
