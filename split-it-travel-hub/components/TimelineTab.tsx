import React, { useState, useEffect } from "react";
import { Clock, MapPin, ExternalLink, Plus, RefreshCw } from "lucide-react";
import { getItinerary, isSupabaseConfigured } from "../lib/dataService";
import { supabase } from "../lib/supabaseClient";
import { ThemePhase } from "../hooks/useTimeTheme";

interface ItineraryItem {
  id: string;
  dayNumber: number;
  time: string;
  activity: string;
  locationUrl?: string;
  locationName?: string;
  notes?: string;
}

const getThemeStyles = (phase: ThemePhase) => {
  switch (phase) {
    case "morning":
      return {
        card: "bg-white/80 border border-emerald-100 hover:border-emerald-300 shadow-sm text-emerald-950",
        textMuted: "text-emerald-800/80",
        textPrimary: "text-emerald-950",
        dayBtnActive: "bg-emerald-600 text-white shadow-md shadow-emerald-200/50",
        dayBtnInactive: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60",
        addBtn: "border-emerald-200 text-emerald-700 hover:text-emerald-900 hover:border-emerald-400 hover:bg-emerald-50/50",
        line: "border-emerald-100",
        dotOuter: "bg-emerald-50 border border-emerald-200 group-hover:border-emerald-400",
        dotInner: "bg-emerald-600 group-hover:bg-emerald-800",
        tabBorder: "border-emerald-100"
      };
    case "afternoon":
      return {
        card: "bg-white border border-slate-200 hover:border-slate-300 shadow-sm text-slate-900",
        textMuted: "text-slate-500",
        textPrimary: "text-slate-900",
        dayBtnActive: "bg-sky-500 text-white shadow-md shadow-sky-200/50",
        dayBtnInactive: "bg-slate-100 text-slate-600 hover:bg-slate-200",
        addBtn: "border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-400 hover:bg-slate-50",
        line: "border-slate-200",
        dotOuter: "bg-slate-50 border border-slate-200 group-hover:border-slate-400",
        dotInner: "bg-sky-500 group-hover:bg-sky-700",
        tabBorder: "border-slate-200"
      };
    case "evening":
      return {
        card: "bg-slate-950/60 border border-orange-500/20 hover:border-orange-500/40 shadow-lg text-amber-100",
        textMuted: "text-amber-200/60",
        textPrimary: "text-amber-50",
        dayBtnActive: "bg-orange-600 text-white shadow-md shadow-orange-950/50",
        dayBtnInactive: "bg-slate-800 text-amber-300 hover:bg-slate-700",
        addBtn: "border-orange-900/40 text-orange-400 hover:text-orange-300 hover:border-orange-700 hover:bg-orange-950/10",
        line: "border-orange-500/20",
        dotOuter: "bg-slate-950 border border-orange-500/20 group-hover:border-orange-500/50",
        dotInner: "bg-orange-500 group-hover:bg-orange-400",
        tabBorder: "border-orange-500/20"
      };
    default: // night
      return {
        card: "bg-slate-950 border border-slate-900 hover:border-slate-800 shadow-md text-slate-100",
        textMuted: "text-slate-400",
        textPrimary: "text-slate-100",
        dayBtnActive: "bg-white text-slate-950 shadow-md shadow-white/5",
        dayBtnInactive: "bg-slate-900 text-slate-400 hover:text-slate-200",
        addBtn: "border-slate-850 hover:border-slate-600 text-slate-400 hover:text-white",
        line: "border-slate-900",
        dotOuter: "bg-slate-950 border border-slate-800 group-hover:border-white",
        dotInner: "bg-slate-600 group-hover:bg-white",
        tabBorder: "border-slate-900"
      };
  }
};

export default function TimelineTab({ 
  isActive = true, 
  themePhase = "night" 
}: { 
  isActive?: boolean; 
  themePhase?: ThemePhase 
}) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const styles = getThemeStyles(themePhase);

  const loadItineraryData = async () => {
    try {
      const data = await getItinerary("t1");
      setItinerary(data);
      const days = Array.from(new Set(data.map((item) => item.dayNumber)));
      if (days.length > 0 && !days.includes(selectedDay)) {
        setSelectedDay(days[0]);
      }
    } catch (err) {
      console.error("Error loading itinerary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItineraryData();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("itinerary-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "itineraries" },
          () => {
            loadItineraryData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const days = Array.from(new Set(itinerary.map((item) => item.dayNumber))).sort((a, b) => a - b);
  const filteredItinerary = itinerary.filter((item) => item.dayNumber === selectedDay);

  if (loading) {
    return (
      <div className={`h-48 flex items-center justify-center ${styles.textMuted}`}>
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading timeline...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Day Selector */}
      <div className={`flex space-x-2 border-b pb-4 ${styles.tabBorder}`}>
        {days.length === 0 ? (
          <button className={`px-4 py-2 rounded-lg text-sm font-semibold ${styles.dayBtnActive}`}>
            Day 1
          </button>
        ) : (
          days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                selectedDay === day ? styles.dayBtnActive : styles.dayBtnInactive
              }`}
            >
              Day {day}
            </button>
          ))
        )}
      </div>

      {/* Timeline List */}
      <div className={`relative border-l ml-4 pl-6 space-y-8 ${styles.line}`}>
        {filteredItinerary.length === 0 ? (
          <div className={`text-center py-10 text-xs border border-dashed rounded-xl ${styles.card}`}>
            No events scheduled for Day {selectedDay}.
          </div>
        ) : (
          filteredItinerary.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline Dot */}
              <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full transition-colors duration-300 flex items-center justify-center ${styles.dotOuter}`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${styles.dotInner}`}></div>
              </div>

              {/* Content */}
              <div className={`rounded-xl p-5 space-y-3 transition-all duration-300 ${styles.card}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className={`flex items-center text-xs font-medium ${styles.textMuted}`}>
                    <Clock className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                    {item.time.slice(0, 5)}
                  </div>
                  {item.locationUrl && (
                    <a
                      href={item.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center text-xs hover:underline transition-colors duration-300 ${styles.textMuted}`}
                    >
                      <MapPin className="w-3 h-3 mr-1 opacity-80" />
                      View Location
                      <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-60" />
                    </a>
                  )}
                </div>

                <h4 className={`text-base font-semibold tracking-wide ${styles.textPrimary}`}>
                  {item.activity}
                </h4>

                {item.notes && (
                  <p className={`text-xs leading-relaxed border-l-2 pl-3 ${styles.textMuted} border-current/20`}>
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Add Activity CTA */}
      <button
        disabled={!isActive}
        className={`w-full py-4 border rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
          !isActive
            ? "border-current/10 text-current/30 cursor-not-allowed opacity-40"
            : styles.addBtn
        }`}
      >
        <Plus className="w-4 h-4 mr-2" /> Add Activity
      </button>
    </div>
  );
}
