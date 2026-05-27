"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Users, 
  MapPin, 
  Copy, 
  Check, 
  ShieldCheck, 
  ShieldAlert, 
  Compass, 
  Lock, 
  Plus, 
  X, 
  Share2, 
  Sunrise, 
  Sun, 
  Sunset, 
  Moon,
  Sparkles
} from "lucide-react";
import TimelineTab from "../components/TimelineTab";
import ExpensesTab from "../components/ExpensesTab";
import ConvoyTab from "../components/ConvoyTab";
import PollsTab from "../components/PollsTab";
import MemoriesTab from "../components/MemoriesTab";
import { 
  getTripDetails, 
  saveTrip, 
  toggleTripActive, 
  isSupabaseConfigured 
} from "../lib/dataService";
import { useTimeTheme, ThemePhase } from "../hooks/useTimeTheme";

type Tab = "Timeline" | "Expenses" | "Convoy" | "Polls" | "Memories";

interface TripDetails {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  inviteCode: string;
  ownerId?: string;
  isActive?: boolean;
}

const getPageStyles = (phase: ThemePhase) => {
  switch (phase) {
    case "morning":
      return {
        bodyBg: "bg-gradient-to-br from-[#F1F5F9] to-[#F0FDF4] text-[#1E293B]",
        headerBg: "bg-[#F1F5F9]/60 border-[#D1FAE5]/50 text-[#1E293B]",
        logoColor: "text-[#1E293B]",
        connPill: "bg-[#D1FAE5] text-[#1E293B] border border-[#A7F3D0]/60",
        bannerBg: "bg-white/70 border border-[#D1FAE5]/60 shadow-sm shadow-[#D1FAE5]/10 text-[#1E293B]",
        bannerSub: "text-[#1E293B]/80 bg-[#D1FAE5]/60 border border-[#A7F3D0]/60",
        tripMetaBg: "bg-[#F0FDF4]/50 border border-[#D1FAE5]/60",
        metaIcon: "bg-[#D1FAE5]/60 border border-[#A7F3D0]/20 text-[#1E293B]",
        metaTitle: "text-[#1E293B] font-bold",
        metaLabel: "text-[#1E293B]/60",
        shareCard: "bg-[#F0FDF4]/30 border border-[#D1FAE5] text-[#1E293B]",
        shareBtn: "bg-white text-[#1E293B] hover:bg-[#F1F5F9] border border-slate-200 text-[#1E293B]/80",
        shareBtnInvite: "bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#1E293B] font-bold",
        tabBar: "bg-[#F1F5F9]/50 border border-[#D1FAE5]/80",
        tabActive: "bg-[#D1FAE5] text-[#1E293B] shadow-[#D1FAE5]/30 font-bold",
        tabInactive: "text-[#1E293B]/70 hover:text-[#1E293B]",
        lockedBanner: "bg-rose-50 text-rose-800 border-b border-rose-100",
        lockText: "text-rose-700",
        lockIcon: "text-rose-500",
        modalBg: "bg-white border border-[#D1FAE5] text-[#1E293B]",
        input: "bg-white border border-[#D1FAE5] focus:border-[#A7F3D0] text-[#1E293B] placeholder-[#1E293B]/40 focus:outline-none",
        endTripBtnActive: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
        endTripBtnInactive: "border-[#D1FAE5] bg-[#D1FAE5]/40 text-[#1E293B] hover:bg-[#D1FAE5]/60",
        ambientPill: "bg-[#D1FAE5]/40 border border-[#D1FAE5] text-[#1E293B]",
        textMuted: "text-[#1E293B]/65",
        btnActive: "bg-[#D1FAE5] text-[#1E293B] hover:bg-[#A7F3D0] shadow-md shadow-[#D1FAE5]/30 font-bold",
      };
    case "afternoon":
      return {
        bodyBg: "bg-gradient-to-br from-[#F5F5F4] to-[#FAF9F6] text-[#1C1917]",
        headerBg: "bg-[#FAF9F6]/60 border-[#E4E4E7]/50 text-[#1C1917]",
        logoColor: "text-[#1C1917]",
        connPill: "bg-[#E4E4E7] text-[#1C1917] border border-slate-200",
        bannerBg: "bg-white/70 border border-[#E4E4E7] shadow-sm shadow-[#E4E4E7]/10 text-[#1C1917]",
        bannerSub: "text-[#1C1917]/80 bg-[#E4E4E7]/60 border border-slate-200",
        tripMetaBg: "bg-[#FAF9F6]/50 border border-[#E4E4E7]/60",
        metaIcon: "bg-[#E4E4E7]/60 border border-slate-200 text-[#1C1917]",
        metaTitle: "text-[#1C1917] font-bold",
        metaLabel: "text-[#1C1917]/60",
        shareCard: "bg-[#FAF9F6]/30 border border-[#E4E4E7] text-[#1C1917]",
        shareBtn: "bg-white text-[#1C1917] hover:bg-[#FAF9F6] border border-[#E4E4E7]",
        shareBtnInvite: "bg-[#E4E4E7] hover:bg-[#D4D4D8] text-[#1C1917] font-bold",
        tabBar: "bg-[#FAF9F6]/50 border border-[#E4E4E7]",
        tabActive: "bg-[#E4E4E7] text-[#1C1917] shadow-[#E4E4E7]/30 font-bold",
        tabInactive: "text-[#1C1917]/70 hover:text-[#1C1917]",
        lockedBanner: "bg-rose-50 text-rose-800 border-b border-rose-100",
        lockText: "text-rose-700",
        lockIcon: "text-rose-500",
        modalBg: "bg-white border border-[#E4E4E7] text-[#1C1917]",
        input: "bg-white border border-[#E4E4E7] focus:border-[#D4D4D8] text-[#1C1917] placeholder-[#1C1917]/40 focus:outline-none",
        endTripBtnActive: "border-rose-300 bg-rose-55 text-rose-700 hover:bg-rose-100",
        endTripBtnInactive: "border-[#E4E4E7] bg-[#E4E4E7]/40 text-[#1C1917] hover:bg-[#E4E4E7]/60",
        ambientPill: "bg-[#E4E4E7]/40 border border-[#E4E4E7] text-[#1C1917]",
        textMuted: "text-[#1C1917]/65",
        btnActive: "bg-[#E4E4E7] text-[#1C1917] hover:bg-[#D4D4D8] shadow-md shadow-[#E4E4E7]/30 font-bold",
      };
    case "evening":
      return {
        bodyBg: "bg-gradient-to-br from-[#1C1917] to-[#0F172A] text-[#E7E5E4]",
        headerBg: "bg-[#1C1917]/40 border-[#FED7AA]/5 text-[#E7E5E4] backdrop-blur-md",
        logoColor: "text-[#E7E5E4]",
        connPill: "bg-[#7C2D12]/40 text-[#E7E5E4] border border-[#FED7AA]/10",
        bannerBg: "bg-[#1C1917]/40 border border-[#FED7AA]/5 text-[#E7E5E4] shadow-lg shadow-[#7C2D12]/5",
        bannerSub: "text-[#E7E5E4]/80 bg-[#7C2D12]/40 border border-[#FED7AA]/10",
        tripMetaBg: "bg-[#1C1917]/20 border border-[#FED7AA]/5",
        metaIcon: "bg-[#7C2D12]/30 border border-[#FED7AA]/5 text-[#E7E5E4]",
        metaTitle: "text-[#E7E5E4] font-bold",
        metaLabel: "text-[#E7E5E4]/60",
        shareCard: "bg-[#1C1917]/30 border border-[#FED7AA]/5 text-[#E7E5E4]",
        shareBtn: "bg-[#1C1917]/50 text-[#E7E5E4] hover:bg-[#1C1917]/80 border border-[#FED7AA]/10",
        shareBtnInvite: "bg-[#7C2D12]/60 hover:bg-[#7C2D12]/90 border border-[#FED7AA]/10 text-[#E7E5E4] font-bold",
        tabBar: "bg-[#1C1917]/50 border border-[#FED7AA]/5",
        tabActive: "bg-[#7C2D12]/80 border border-[#FED7AA]/15 text-[#E7E5E4] shadow-[#7C2D12]/50 font-bold",
        tabInactive: "text-[#E7E5E4]/70 hover:text-[#E7E5E4]",
        lockedBanner: "bg-rose-955/30 text-rose-450 border-b border-rose-900/30",
        lockText: "text-rose-450",
        lockIcon: "text-rose-500",
        modalBg: "bg-[#1C1917] border border-[#FED7AA]/10 text-[#E7E5E4]",
        input: "bg-[#1C1917]/50 border border-[#FED7AA]/10 focus:border-[#7C2D12] text-[#E7E5E4] placeholder-[#E7E5E4]/40 focus:outline-none",
        endTripBtnActive: "border-rose-900 bg-rose-950/20 text-rose-450 hover:bg-rose-900 hover:text-white",
        endTripBtnInactive: "border-orange-900 bg-[#7C2D12]/20 text-[#E7E5E4] hover:bg-[#7C2D12]/40",
        ambientPill: "bg-[#7C2D12]/30 border border-[#FED7AA]/5 text-[#E7E5E4]",
        textMuted: "text-[#E7E5E4]/65",
        btnActive: "bg-[#7C2D12]/80 border border-[#FED7AA]/15 text-[#E7E5E4] shadow-md shadow-[#7C2D12]/50 font-bold",
      };
    default: // night
      return {
        bodyBg: "bg-gradient-to-br from-[#020617] to-[#09090B] text-[#CBD5E1]",
        headerBg: "bg-[#0F172A]/30 border border-slate-900/40 text-[#CBD5E1] backdrop-blur-md",
        logoColor: "text-[#CBD5E1]",
        connPill: "bg-[#1E1B4B]/30 text-[#CBD5E1] border border-slate-800",
        bannerBg: "bg-[#0F172A]/30 border border-slate-900 shadow-md shadow-black/40 text-[#CBD5E1]",
        bannerSub: "text-[#CBD5E1]/80 bg-[#1E1B4B]/30 border border-slate-800",
        tripMetaBg: "bg-[#0F172A]/20 border border-slate-900/40",
        metaIcon: "bg-[#1E1B4B]/30 border border-slate-800 text-[#CBD5E1]",
        metaTitle: "text-[#CBD5E1] font-bold",
        metaLabel: "text-[#CBD5E1]/60",
        shareCard: "bg-[#0F172A]/20 border border-slate-900 text-[#CBD5E1]",
        shareBtn: "bg-[#0F172A]/30 text-[#CBD5E1] hover:bg-[#0F172A]/60 border border-slate-800",
        shareBtnInvite: "bg-[#1E1B4B]/50 hover:bg-[#1E1B4B]/80 border border-slate-800 text-[#CBD5E1] font-bold",
        tabBar: "bg-[#0F172A]/30 border border-slate-900",
        tabActive: "bg-[#1E1B4B]/60 border border-slate-705 text-[#CBD5E1] shadow-[#1E1B4B]/50 font-bold",
        tabInactive: "text-[#CBD5E1]/70 hover:text-[#CBD5E1]",
        lockedBanner: "bg-amber-955/30 text-amber-400 border-b border-amber-900/50",
        lockText: "text-amber-400",
        lockIcon: "text-amber-500",
        modalBg: "bg-[#09090B] border border-slate-900 text-[#CBD5E1]",
        input: "bg-[#0F172A]/30 border border-slate-850 focus:border-slate-750 text-[#CBD5E1] placeholder-[#CBD5E1]/40 focus:outline-none",
        endTripBtnActive: "border-rose-900 bg-rose-950/20 text-rose-450 hover:bg-rose-900 hover:text-white",
        endTripBtnInactive: "border-indigo-900 bg-[#1E1B4B]/20 text-[#CBD5E1] hover:bg-[#1E1B4B]/40",
        ambientPill: "bg-[#1E1B4B]/30 border border-slate-800 text-indigo-300",
        textMuted: "text-[#CBD5E1]/65",
        btnActive: "bg-[#1E1B4B]/60 border border-slate-705 text-[#CBD5E1] shadow-md shadow-[#1E1B4B]/50 font-bold",
      };
  }
};

const getAmbientDetails = (phase: ThemePhase) => {
  switch (phase) {
    case "morning":
      return {
        icon: <Sunrise className="w-3.5 h-3.5 text-[#1E293B] stroke-[2.5]" />,
        name: "Morning Sky",
        color: "bg-[#D1FAE5] border border-[#A7F3D0]/60 text-[#1E293B]"
      };
    case "afternoon":
      return {
        icon: <Sun className="w-3.5 h-3.5 text-[#1C1917] stroke-[2.5]" />,
        name: "Bright Sun",
        color: "bg-[#E4E4E7] border border-slate-300 text-[#1C1917]"
      };
    case "evening":
      return {
        icon: <Sunset className="w-3.5 h-3.5 text-[#E7E5E4] stroke-[2.5]" />,
        name: "Cozy Sunset",
        color: "bg-[#7C2D12]/40 border border-[#FED7AA]/10 text-[#E7E5E4]"
      };
    default:
      return {
        icon: <Moon className="w-3.5 h-3.5 text-[#CBD5E1] stroke-[2.5]" />,
        name: "Midnight Blue",
        color: "bg-[#1E1B4B]/30 border border-slate-800 text-[#CBD5E1]"
      };
  }
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("Expenses");
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Time Theme Engine
  const { phase, isManual, setManualPhase, autoPhase } = useTimeTheme();
  const styles = getPageStyles(phase);
  const ambient = getAmbientDetails(phase);

  // Trip Management Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [creating, setCreating] = useState(false);

  const currentUserId = "u1"; 
  const defaultInviteCode = "LONA-2026-GET";

  const loadTripData = async (code: string) => {
    const details = await getTripDetails(code);
    setTrip(details);
    setDbConnected(isSupabaseConfigured());
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlInvite = params.get("invite");
    const codeToLoad = urlInvite || defaultInviteCode;
    loadTripData(codeToLoad);
  }, []);

  const handleCopyInvite = () => {
    if (!trip) return;
    navigator.clipboard.writeText(trip.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareAccess = () => {
    if (!trip) return;
    const shareUrl = `${window.location.origin}/?invite=${trip.inviteCode}`;
    const shareMessage = `Hey! Join our trip "${trip.title}" on Split-It Travel Hub. View details and expenses here: ${shareUrl}`;
    
    navigator.clipboard.writeText(shareMessage);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleToggleActive = async () => {
    if (!trip) return;
    const newActiveState = !trip.isActive;

    setTrip((prev) => prev ? { ...prev, isActive: newActiveState } : null);

    if (isSupabaseConfigured()) {
      await toggleTripActive(trip.id, newActiveState);
    }
  };

  const handleCreateNewTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDestination || !newStartDate || !newEndDate) return;

    setCreating(true);
    const generatedCode = "TRIP-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const newTrip = {
      title: newTitle,
      destination: newDestination,
      startDate: newStartDate,
      endDate: newEndDate,
      inviteCode: generatedCode,
      ownerId: currentUserId,
      isActive: true
    };

    const res = await saveTrip(newTrip);
    if (res.success && res.trip) {
      setTrip(res.trip);
      const newUrl = `${window.location.origin}/?invite=${res.trip.inviteCode}`;
      window.history.pushState({ path: newUrl }, "", newUrl);
      
      setNewTitle("");
      setNewDestination("");
      setNewStartDate("");
      setNewEndDate("");
      setIsModalOpen(false);
    } else {
      alert("Failed to save new trip.");
    }
    setCreating(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOwner = trip?.ownerId === currentUserId;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all duration-[3000ms] ease-in-out selection:bg-current/10 ${styles.bodyBg}`}>
      {/* Concluded Trip Banner */}
      {trip && !trip.isActive && (
        <div className={`py-3 px-4 text-xs font-semibold text-center flex items-center justify-center space-x-2 animate-in slide-in-from-top duration-300 ${styles.lockedBanner}`}>
          <Lock className={`w-4 h-4 stroke-[2.5] ${styles.lockIcon}`} />
          <span className={styles.lockText}>This trip has concluded and the ledger is locked. Actions are read-only.</span>
        </div>
      )}

      {/* Sticky Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3 sm:px-6 transition-all duration-[3000ms] ease-in-out ${styles.headerBg}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className={`w-5 h-5 ${styles.logoColor}`} />
            <span className={`text-sm font-bold tracking-wider uppercase ${styles.logoColor}`}>
              Split-It Hub
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className={`border rounded-lg py-1 px-3 text-xs font-semibold flex items-center transition-all duration-300 ${
                phase === "morning" || phase === "afternoon"
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-white"
              }`}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New Trip
            </button>

            {dbConnected ? (
              <div className={`flex items-center space-x-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${styles.connPill}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Live</span>
              </div>
            ) : (
              <div className={`flex items-center space-x-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${styles.connPill}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <span>Preview</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Trip Banner */}
        {trip && (
          <div className={`rounded-2xl p-5 space-y-4 shadow-xl transition-all duration-[3000ms] ease-in-out ${styles.bannerBg}`}>
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                  <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${styles.bannerSub}`}>
                    Trip Details
                  </span>
                  
                  {/* Ambient Sky micro-badge */}
                  <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${ambient.color}`}>
                    {ambient.icon}
                    <span className="ml-1 hidden sm:inline">{ambient.name}</span>
                  </span>
                </div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl mt-2 leading-none">
                  {trip.title}
                </h1>
              </div>

              {/* End Trip Toggle */}
              {isOwner && (
                <button
                  onClick={handleToggleActive}
                  className={`text-[10px] font-bold py-1.5 px-3 rounded-lg border transition-all duration-300 flex items-center space-x-1 ${
                    trip.isActive ? styles.endTripBtnActive : styles.endTripBtnInactive
                  }`}
                >
                  <Lock className="w-3 h-3 mr-1" />
                  <span>{trip.isActive ? "End Trip" : "Resume Trip"}</span>
                </button>
              )}
            </div>

            {/* Metadata Cards Row */}
            <div className="grid grid-cols-3 gap-2 border-t border-current/5 pt-4">
              <div className={`flex items-center space-x-2 rounded-xl p-2 border border-current/5 ${styles.tripMetaBg}`}>
                <div className={`p-1.5 rounded-lg ${styles.metaIcon}`}>
                  <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="text-left truncate">
                  <p className={`text-[9px] uppercase tracking-wider font-semibold ${styles.metaLabel}`}>Location</p>
                  <p className={`text-[11px] truncate ${styles.metaTitle}`}>{trip.destination}</p>
                </div>
              </div>
              <div className={`flex items-center space-x-2 rounded-xl p-2 border border-current/5 ${styles.tripMetaBg}`}>
                <div className={`p-1.5 rounded-lg ${styles.metaIcon}`}>
                  <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="text-left truncate">
                  <p className={`text-[9px] uppercase tracking-wider font-semibold ${styles.metaLabel}`}>Dates</p>
                  <p className={`text-[11px] truncate ${styles.metaTitle}`}>
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-2 rounded-xl p-2 border border-current/5 ${styles.tripMetaBg}`}>
                <div className={`p-1.5 rounded-lg ${styles.metaIcon}`}>
                  <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="text-left truncate">
                  <p className={`text-[9px] uppercase tracking-wider font-semibold ${styles.metaLabel}`}>Group Size</p>
                  <p className={`text-[11px] truncate ${styles.metaTitle}`}>5 Members</p>
                </div>
              </div>
            </div>

            {/* Privacy & Sharing Section */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-3 gap-3 ${styles.shareCard}`}>
              <div className="text-left space-y-0.5">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${styles.metaLabel}`}>Privacy & Sharing</p>
                <p className="text-[11px] opacity-80">Invite code: <span className="font-mono font-bold">{trip.inviteCode}</span></p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyInvite}
                  className={`text-[10px] font-bold border px-3 py-1.5 rounded-lg transition-colors duration-300 flex items-center space-x-1 ${styles.shareBtn}`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500 stroke-[2.5]" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleShareAccess}
                  className={`text-[10px] font-bold transition-all duration-300 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg shadow ${styles.shareBtnInvite}`}
                >
                  {shareCopied ? (
                    <>
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Invite Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3 h-3 stroke-[2.5]" />
                      <span>Share Access</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Horizontal Swipeable/Scrollable Tab Bar */}
        <div className={`sticky top-[53px] z-30 border rounded-xl p-1 flex space-x-1 overflow-x-auto no-scrollbar scroll-smooth backdrop-blur transition-all duration-[3000ms] ease-in-out ${styles.tabBar}`}>
          {(["Timeline", "Expenses", "Convoy", "Polls", "Memories"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[80px] text-center py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 whitespace-nowrap ${
                activeTab === tab ? styles.tabActive : styles.tabInactive
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Active Tab View */}
        <div className="mt-4 transition-all duration-500">
          {activeTab === "Timeline" && <TimelineTab isActive={trip?.isActive} themePhase={phase} />}
          {activeTab === "Expenses" && <ExpensesTab isActive={trip?.isActive} themePhase={phase} />}
          {activeTab === "Convoy" && <ConvoyTab isActive={trip?.isActive} themePhase={phase} />}
          {activeTab === "Polls" && <PollsTab isActive={trip?.isActive} themePhase={phase} />}
          {activeTab === "Memories" && <MemoriesTab themePhase={phase} />}
        </div>
      </main>

      {/* Dynamic Theme Engine Preview Controller Deck */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-full px-4 py-2 shadow-2xl flex items-center space-x-2 text-[10px] font-bold text-slate-400">
        <Sparkles className="w-3 h-3 text-indigo-400 mr-1 animate-pulse" />
        <span className="hidden sm:inline">Theme Override:</span>
        <div className="flex space-x-1 bg-slate-900 border border-slate-850 p-0.5 rounded-full">
          {(["morning", "afternoon", "evening", "night"] as ThemePhase[]).map((p) => (
            <button
              key={p}
              onClick={() => setManualPhase(p)}
              className={`px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider transition-all duration-300 ${
                isManual && phase === p
                  ? "bg-white text-slate-950"
                  : "hover:text-white"
              }`}
            >
              {p === "morning" && "🌅"}
              {p === "afternoon" && "☀️"}
              {p === "evening" && "🌇"}
              {p === "night" && "🌙"}
            </button>
          ))}
          <button
            onClick={() => setManualPhase(null)}
            className={`px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider transition-all duration-300 ${
              !isManual ? "bg-white text-slate-950" : "hover:text-white"
            }`}
          >
            Auto ({autoPhase === "morning" && "🌅"}{autoPhase === "afternoon" && "☀️"}{autoPhase === "evening" && "🌇"}{autoPhase === "night" && "🌙"})
          </button>
        </div>
      </div>

      {/* Trip Management Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl space-y-4 ${styles.modalBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold tracking-wide">
                Create New Travel Group
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-1 rounded-lg border border-transparent hover:border-current/10 ${
                  phase === "morning" || phase === "afternoon"
                    ? "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                    : "text-slate-500 hover:text-white hover:bg-slate-900"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTrip} className="space-y-4">
              <div>
                <label className={`block text-[10px] uppercase tracking-wider mb-1.5 font-bold ${styles.textMuted}`}>
                  Trip Name / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa Family Trip, Office Retreat"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full rounded-lg py-2 px-3 text-xs ${styles.input}`}
                />
              </div>

              <div>
                <label className={`block text-[10px] uppercase tracking-wider mb-1.5 font-bold ${styles.textMuted}`}>
                  Destination
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa, India"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className={`w-full rounded-lg py-2 px-3 text-xs ${styles.input}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] uppercase tracking-wider mb-1.5 font-bold ${styles.textMuted}`}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className={`w-full rounded-lg py-2 px-3 text-xs ${styles.input}`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] uppercase tracking-wider mb-1.5 font-bold ${styles.textMuted}`}>
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className={`w-full rounded-lg py-2 px-3 text-xs ${styles.input}`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`rounded-lg py-2 px-4 text-xs font-semibold border transition-colors duration-300 ${
                    phase === "morning" || phase === "afternoon"
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-350 text-slate-700"
                      : "bg-slate-900 text-slate-400 hover:text-white border-slate-800"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`rounded-lg py-2 px-5 text-xs font-semibold shadow transition-all duration-300 flex items-center justify-center ${
                    creating 
                      ? "bg-current/10 text-current/30 cursor-not-allowed" 
                      : styles.btnActive
                  }`}
                >
                  {creating ? "Creating..." : "Initialize Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
