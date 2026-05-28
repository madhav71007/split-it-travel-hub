"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Users,
  MapPin,
  Copy,
  Check,
  Compass,
  Lock,
  Plus,
  X,
  Share2,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Settings,
  Clock,
  Car,
  Vote,
  Image,
  Receipt,
  ChevronRight,
  Sliders,
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
  isSupabaseConfigured,
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

const tabConfig: { key: Tab; label: string; icon: typeof Clock }[] = [
  { key: "Timeline", label: "Timeline", icon: Clock },
  { key: "Expenses", label: "Expenses", icon: Receipt },
  { key: "Convoy", label: "Convoy", icon: Car },
  { key: "Polls", label: "Polls", icon: Vote },
  { key: "Memories", label: "Memories", icon: Image },
];

const getPageStyles = (phase: ThemePhase) => {
  const isLight = phase === "morning" || phase === "afternoon";
  switch (phase) {
    case "morning":
      return {
        bodyBg: "bg-[#F8FAF9] text-[#1E293B]",
        headerBg: "bg-[#F1F5F9]/80 text-[#1E293B] backdrop-blur-xl",
        headerBorder: "border-[#D1FAE5]/30",
        connPill: "bg-[#D1FAE5] text-[#1E293B] border border-[#A7F3D0]/60",
        bannerBg: "bg-white border border-[#D1FAE5]/50 shadow-sm text-[#1E293B]",
        bannerSub: "text-[#1E293B]/80 bg-[#D1FAE5]/60 border border-[#A7F3D0]/60",
        tripMetaBg: "bg-[#F0FDF4]/50 border border-[#D1FAE5]/60",
        metaIcon: "bg-[#D1FAE5]/60 border border-[#A7F3D0]/20 text-[#1E293B]",
        metaTitle: "text-[#1E293B] font-bold",
        metaLabel: "text-[#1E293B]/60",
        shareCard: "bg-[#F0FDF4]/30 border border-[#D1FAE5] text-[#1E293B]",
        shareBtn: "bg-white text-[#1E293B] hover:bg-[#F1F5F9] border border-slate-200",
        shareBtnInvite: "bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#1E293B] font-bold",
        lockedBanner: "bg-rose-50 text-rose-800 border-b border-rose-100",
        lockText: "text-rose-700",
        lockIcon: "text-rose-500",
        modalBg: "bg-white border border-[#D1FAE5] text-[#1E293B]",
        input: "bg-white border border-[#D1FAE5] focus:border-[#A7F3D0] text-[#1E293B] placeholder-[#1E293B]/40 focus:outline-none",
        endTripBtnActive: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
        endTripBtnInactive: "border-[#D1FAE5] bg-[#D1FAE5]/40 text-[#1E293B] hover:bg-[#D1FAE5]/60",
        textMuted: "text-[#1E293B]/65",
        btnActive: "bg-[#D1FAE5] text-[#1E293B] hover:bg-[#A7F3D0] shadow-md shadow-[#D1FAE5]/30 font-bold",
        bottomNavBg: "bg-white/90 backdrop-blur-xl border-t border-[#D1FAE5]/30",
        bottomNavActive: "text-emerald-700",
        bottomNavInactive: "text-[#1E293B]/40",
        bottomNavIndicator: "bg-emerald-600",
        bottomNavLabel: "text-emerald-700 font-bold",
        sheetBg: "bg-white border border-[#D1FAE5] text-[#1E293B]",
        sheetHandle: "bg-[#1E293B]/15",
        themeChipActive: "bg-[#D1FAE5] text-[#1E293B] border border-[#A7F3D0]",
        themeChipInactive: "bg-[#F1F5F9] text-[#1E293B]/60 border border-[#D1FAE5]/40",
        skeletonBase: "bg-[#D1FAE5]/20",
        skeletonShine: "bg-[#A7F3D0]/30",
      };
    case "afternoon":
      return {
        bodyBg: "bg-[#F5F5F4] text-[#1C1917]",
        headerBg: "bg-[#FAF9F6]/80 text-[#1C1917] backdrop-blur-xl",
        headerBorder: "border-[#E4E4E7]/40",
        connPill: "bg-[#E4E4E7] text-[#1C1917] border border-slate-200",
        bannerBg: "bg-white border border-[#E4E4E7] shadow-sm text-[#1C1917]",
        bannerSub: "text-[#1C1917]/80 bg-[#E4E4E7]/60 border border-slate-200",
        tripMetaBg: "bg-[#FAF9F6]/50 border border-[#E4E4E7]/60",
        metaIcon: "bg-[#E4E4E7]/60 border border-slate-200 text-[#1C1917]",
        metaTitle: "text-[#1C1917] font-bold",
        metaLabel: "text-[#1C1917]/60",
        shareCard: "bg-[#FAF9F6]/30 border border-[#E4E4E7] text-[#1C1917]",
        shareBtn: "bg-white text-[#1C1917] hover:bg-[#FAF9F6] border border-[#E4E4E7]",
        shareBtnInvite: "bg-[#E4E4E7] hover:bg-[#D4D4D8] text-[#1C1917] font-bold",
        lockedBanner: "bg-rose-50 text-rose-800 border-b border-rose-100",
        lockText: "text-rose-700",
        lockIcon: "text-rose-500",
        modalBg: "bg-white border border-[#E4E4E7] text-[#1C1917]",
        input: "bg-white border border-[#E4E4E7] focus:border-[#D4D4D8] text-[#1C1917] placeholder-[#1C1917]/40 focus:outline-none",
        endTripBtnActive: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
        endTripBtnInactive: "border-[#E4E4E7] bg-[#E4E4E7]/40 text-[#1C1917] hover:bg-[#E4E4E7]/60",
        textMuted: "text-[#1C1917]/65",
        btnActive: "bg-[#E4E4E7] text-[#1C1917] hover:bg-[#D4D4D8] shadow-md shadow-[#E4E4E7]/30 font-bold",
        bottomNavBg: "bg-white/90 backdrop-blur-xl border-t border-[#E4E4E7]/50",
        bottomNavActive: "text-sky-700",
        bottomNavInactive: "text-[#1C1917]/35",
        bottomNavIndicator: "bg-sky-600",
        bottomNavLabel: "text-sky-700 font-bold",
        sheetBg: "bg-white border border-[#E4E4E7] text-[#1C1917]",
        sheetHandle: "bg-[#1C1917]/15",
        themeChipActive: "bg-[#E4E4E7] text-[#1C1917] border border-slate-300",
        themeChipInactive: "bg-[#F5F5F4] text-[#1C1917]/50 border border-[#E4E4E7]/50",
        skeletonBase: "bg-[#E4E4E7]/30",
        skeletonShine: "bg-[#D4D4D8]/30",
      };
    case "evening":
      return {
        bodyBg: "bg-[#0C0A09] text-[#E7E5E4]",
        headerBg: "bg-[#1C1917]/70 text-[#E7E5E4] backdrop-blur-xl",
        headerBorder: "border-[#FED7AA]/8",
        connPill: "bg-[#7C2D12]/40 text-[#E7E5E4] border border-[#FED7AA]/10",
        bannerBg: "bg-[#1C1917]/60 border border-[#FED7AA]/8 text-[#E7E5E4] shadow-lg shadow-black/20",
        bannerSub: "text-[#E7E5E4]/80 bg-[#7C2D12]/40 border border-[#FED7AA]/10",
        tripMetaBg: "bg-[#1C1917]/30 border border-[#FED7AA]/5",
        metaIcon: "bg-[#7C2D12]/30 border border-[#FED7AA]/5 text-[#E7E5E4]",
        metaTitle: "text-[#E7E5E4] font-bold",
        metaLabel: "text-[#E7E5E4]/60",
        shareCard: "bg-[#1C1917]/30 border border-[#FED7AA]/5 text-[#E7E5E4]",
        shareBtn: "bg-[#1C1917]/50 text-[#E7E5E4] hover:bg-[#1C1917]/80 border border-[#FED7AA]/10",
        shareBtnInvite: "bg-[#7C2D12]/60 hover:bg-[#7C2D12]/90 border border-[#FED7AA]/10 text-[#E7E5E4] font-bold",
        lockedBanner: "bg-rose-950/30 text-rose-400 border-b border-rose-900/30",
        lockText: "text-rose-400",
        lockIcon: "text-rose-500",
        modalBg: "bg-[#1C1917] border border-[#FED7AA]/10 text-[#E7E5E4]",
        input: "bg-[#1C1917]/50 border border-[#FED7AA]/10 focus:border-[#7C2D12] text-[#E7E5E4] placeholder-[#E7E5E4]/40 focus:outline-none",
        endTripBtnActive: "border-rose-900 bg-rose-950/20 text-rose-400 hover:bg-rose-900",
        endTripBtnInactive: "border-orange-900 bg-[#7C2D12]/20 text-[#E7E5E4] hover:bg-[#7C2D12]/40",
        textMuted: "text-[#E7E5E4]/65",
        btnActive: "bg-[#7C2D12]/80 border border-[#FED7AA]/15 text-[#E7E5E4] shadow-md shadow-[#7C2D12]/50 font-bold",
        bottomNavBg: "bg-[#1C1917]/90 backdrop-blur-xl border-t border-[#FED7AA]/8",
        bottomNavActive: "text-orange-400",
        bottomNavInactive: "text-[#E7E5E4]/30",
        bottomNavIndicator: "bg-orange-500",
        bottomNavLabel: "text-orange-400 font-bold",
        sheetBg: "bg-[#1C1917] border border-[#FED7AA]/10 text-[#E7E5E4]",
        sheetHandle: "bg-[#E7E5E4]/15",
        themeChipActive: "bg-[#7C2D12]/60 text-[#E7E5E4] border border-[#FED7AA]/15",
        themeChipInactive: "bg-[#1C1917]/50 text-[#E7E5E4]/40 border border-[#FED7AA]/5",
        skeletonBase: "bg-[#7C2D12]/15",
        skeletonShine: "bg-[#7C2D12]/25",
      };
    default: // night
      return {
        bodyBg: "bg-[#09090B] text-[#CBD5E1]",
        headerBg: "bg-[#0F172A]/60 text-[#CBD5E1] backdrop-blur-xl",
        headerBorder: "border-slate-800/40",
        connPill: "bg-slate-800/50 text-[#CBD5E1] border border-slate-700/50",
        bannerBg: "bg-[#0F172A]/40 border border-slate-800/50 text-[#CBD5E1] shadow-md shadow-black/30",
        bannerSub: "text-[#CBD5E1]/80 bg-slate-800/40 border border-slate-700/30",
        tripMetaBg: "bg-[#0F172A]/20 border border-slate-800/30",
        metaIcon: "bg-slate-800/40 border border-slate-700/30 text-[#CBD5E1]",
        metaTitle: "text-[#CBD5E1] font-bold",
        metaLabel: "text-[#CBD5E1]/60",
        shareCard: "bg-[#0F172A]/20 border border-slate-800/40 text-[#CBD5E1]",
        shareBtn: "bg-slate-800/40 text-[#CBD5E1] hover:bg-slate-800/60 border border-slate-700/40",
        shareBtnInvite: "bg-slate-700/50 hover:bg-slate-700/70 text-[#CBD5E1] font-bold",
        lockedBanner: "bg-amber-950/30 text-amber-400 border-b border-amber-900/50",
        lockText: "text-amber-400",
        lockIcon: "text-amber-500",
        modalBg: "bg-[#09090B] border border-slate-800 text-[#CBD5E1]",
        input: "bg-slate-900/40 border border-slate-800 focus:border-slate-700 text-[#CBD5E1] placeholder-[#CBD5E1]/40 focus:outline-none",
        endTripBtnActive: "border-rose-900 bg-rose-950/20 text-rose-400 hover:bg-rose-900",
        endTripBtnInactive: "border-slate-700 bg-slate-800/30 text-[#CBD5E1] hover:bg-slate-800/50",
        textMuted: "text-[#CBD5E1]/65",
        btnActive: "bg-slate-700/70 text-[#CBD5E1] hover:bg-slate-700/90 shadow-md shadow-black/30 font-bold",
        bottomNavBg: "bg-[#0F172A]/90 backdrop-blur-xl border-t border-slate-800/50",
        bottomNavActive: "text-slate-100",
        bottomNavInactive: "text-[#CBD5E1]/30",
        bottomNavIndicator: "bg-slate-100",
        bottomNavLabel: "text-slate-100 font-bold",
        sheetBg: "bg-[#09090B] border border-slate-800 text-[#CBD5E1]",
        sheetHandle: "bg-[#CBD5E1]/15",
        themeChipActive: "bg-slate-700/60 text-[#CBD5E1] border border-slate-600",
        themeChipInactive: "bg-slate-900/30 text-[#CBD5E1]/40 border border-slate-800/30",
        skeletonBase: "bg-slate-800/20",
        skeletonShine: "bg-slate-700/20",
      };
  }
};

function SkeletonCard({ styles, count = 1 }: { styles: ReturnType<typeof getPageStyles>; count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-3 mb-4">
          <div className={`rounded-2xl p-5 space-y-4 ${styles.bannerBg}`}>
            <div className="flex space-x-3">
              <div className={`h-4 w-24 rounded-full ${styles.skeletonBase}`} />
              <div className={`h-4 w-16 rounded-full ${styles.skeletonBase}`} />
            </div>
            <div className={`h-6 w-48 rounded-lg ${styles.skeletonBase}`} />
            <div className="grid grid-cols-3 gap-2">
              <div className={`h-14 rounded-xl ${styles.skeletonBase}`} />
              <div className={`h-14 rounded-xl ${styles.skeletonBase}`} />
              <div className={`h-14 rounded-xl ${styles.skeletonBase}`} />
            </div>
            <div className={`h-12 rounded-xl ${styles.skeletonBase}`} />
          </div>
        </div>
      ))}
    </>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("Expenses");
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [tripLoading, setTripLoading] = useState(true);

  const { phase, isManual, setManualPhase, autoPhase } = useTimeTheme();
  const styles = getPageStyles(phase);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [creating, setCreating] = useState(false);

  const [slideDir, setSlideDir] = useState<"left" | "right">("left");
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTabIndex = useRef(1);

  const currentUserId = "u1";
  const defaultInviteCode = "LONA-2026-GET";

  const loadTripData = async (code: string) => {
    setTripLoading(true);
    const details = await getTripDetails(code);
    setTrip(details);
    setDbConnected(isSupabaseConfigured());
    setTripLoading(false);
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
    setTrip((prev) => (prev ? { ...prev, isActive: newActiveState } : null));
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
      isActive: true,
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

  const handleTabChange = useCallback(
    (tab: Tab) => {
      if (tab === activeTab) return;
      const newIdx = tabConfig.findIndex((t) => t.key === tab);
      setSlideDir(newIdx > prevTabIndex.current ? "left" : "right");
      prevTabIndex.current = newIdx;
      setIsAnimating(true);
      setActiveTab(tab);
      setTimeout(() => setIsAnimating(false), 250);
    },
    [activeTab]
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOwner = trip?.ownerId === currentUserId;
  const isLight = phase === "morning" || phase === "afternoon";

  const tabContentKey = activeTab;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-700 selection:bg-current/10 ${styles.bodyBg}`}
    >
      {/* Concluded Trip Banner */}
      {trip && !trip.isActive && (
        <div
          className={`py-2.5 px-4 text-[11px] font-semibold text-center flex items-center justify-center space-x-2 ${styles.lockedBanner}`}
        >
          <Lock className={`w-3.5 h-3.5 stroke-[2.5] ${styles.lockIcon}`} />
          <span className={styles.lockText}>Trip concluded -- ledger locked, read-only</span>
        </div>
      )}

      {/* Android-style Toolbar */}
      <header
        className={`sticky top-0 z-40 border-b px-4 py-3 transition-colors duration-700 ${styles.headerBg} ${styles.headerBorder}`}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isLight ? "bg-emerald-600" : "bg-slate-100"
              }`}
            >
              <Compass className={`w-4.5 h-4.5 ${isLight ? "text-white" : "text-slate-900"}`} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none">Split-It</h1>
              <p className={`text-[10px] leading-none mt-0.5 ${styles.textMuted}`}>
                {dbConnected ? "Live sync on" : "Preview mode"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {dbConnected && (
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 active:scale-95 ${
                isLight
                  ? "hover:bg-black/5"
                  : "hover:bg-white/5"
              } ${styles.textMuted}`}
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className={`h-9 rounded-full px-4 text-[11px] font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                isLight
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-white text-slate-900 hover:bg-slate-200"
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Trip</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24 space-y-5 overflow-y-auto">
        {/* Trip Banner Card */}
        {tripLoading ? (
          <SkeletonCard styles={styles} />
        ) : trip ? (
          <div className={`rounded-2xl p-4 space-y-3.5 transition-colors duration-700 ${styles.bannerBg}`}>
            {/* Title Row */}
            <div className="flex justify-between items-start">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                  <span
                    className={`inline-flex items-center text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${styles.bannerSub}`}
                  >
                    Active Trip
                  </span>
                </div>
                <h2 className="text-lg font-bold tracking-tight leading-tight truncate">
                  {trip.title}
                </h2>
                <p className={`text-[11px] ${styles.textMuted}`}>{trip.destination}</p>
              </div>

              {isOwner && (
                <button
                  onClick={handleToggleActive}
                  className={`text-[10px] font-bold py-1.5 px-3 rounded-lg border transition-all duration-200 flex items-center active:scale-95 ${
                    trip.isActive ? styles.endTripBtnActive : styles.endTripBtnInactive
                  }`}
                >
                  <Lock className="w-3 h-3 mr-1" />
                  <span>{trip.isActive ? "End" : "Resume"}</span>
                </button>
              )}
            </div>

            {/* Metadata Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`flex items-center space-x-2 rounded-xl p-2 ${styles.tripMetaBg}`}>
                <div className={`p-1.5 rounded-lg ${styles.metaIcon}`}>
                  <MapPin className="w-3 h-3 stroke-[2.5]" />
                </div>
                <div className="text-left truncate">
                  <p className={`text-[8px] uppercase tracking-wider font-semibold ${styles.metaLabel}`}>
                    Where
                  </p>
                  <p className={`text-[11px] truncate ${styles.metaTitle}`}>{trip.destination}</p>
                </div>
              </div>
              <div className={`flex items-center space-x-2 rounded-xl p-2 ${styles.tripMetaBg}`}>
                <div className={`p-1.5 rounded-lg ${styles.metaIcon}`}>
                  <Calendar className="w-3 h-3 stroke-[2.5]" />
                </div>
                <div className="text-left truncate">
                  <p className={`text-[8px] uppercase tracking-wider font-semibold ${styles.metaLabel}`}>
                    When
                  </p>
                  <p className={`text-[11px] truncate ${styles.metaTitle}`}>
                    {formatDate(trip.startDate)}-{formatDate(trip.endDate)}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-2 rounded-xl p-2 ${styles.tripMetaBg}`}>
                <div className={`p-1.5 rounded-lg ${styles.metaIcon}`}>
                  <Users className="w-3 h-3 stroke-[2.5]" />
                </div>
                <div className="text-left truncate">
                  <p className={`text-[8px] uppercase tracking-wider font-semibold ${styles.metaLabel}`}>
                    Group
                  </p>
                  <p className={`text-[11px] truncate ${styles.metaTitle}`}>5</p>
                </div>
              </div>
            </div>

            {/* Invite / Share */}
            <div className={`flex items-center justify-between rounded-xl p-3 ${styles.shareCard}`}>
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-[10px] font-mono font-bold tracking-wider">{trip.inviteCode}</span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleCopyInvite}
                  className={`h-8 px-3 rounded-lg text-[10px] font-bold flex items-center transition-colors duration-200 active:scale-95 ${styles.shareBtn}`}
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-500 mr-1 stroke-[2.5]" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  {copied ? "Done" : "Copy"}
                </button>
                <button
                  onClick={handleShareAccess}
                  className={`h-8 px-3 rounded-lg text-[10px] font-bold flex items-center transition-all duration-200 active:scale-95 ${styles.shareBtnInvite}`}
                >
                  {shareCopied ? (
                    <Check className="w-3 h-3 mr-1 stroke-[2.5]" />
                  ) : (
                    <Share2 className="w-3 h-3 mr-1 stroke-[2.5]" />
                  )}
                  {shareCopied ? "Copied" : "Share"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tab Content with slide transition */}
        <div
          key={tabContentKey}
          className={`space-y-0 transition-all duration-200 ease-out ${
            isAnimating
              ? slideDir === "left"
                ? "translate-x-3 opacity-0"
                : "-translate-x-3 opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          {activeTab === "Timeline" && <TimelineTab isActive={trip?.isActive} themePhase={phase} />}
          {activeTab === "Expenses" && <ExpensesTab isActive={trip?.isActive} themePhase={phase} />}
          {activeTab === "Convoy" && <ConvoyTab isActive={trip?.isActive} themePhase={phase} />}
          {activeTab === "Polls" && <PollsTab isActive={trip?.isActive} themePhase={phase} />}
          {activeTab === "Memories" && <MemoriesTab themePhase={phase} />}
        </div>
      </main>

      {/* Bottom Navigation Bar - Material 3 style */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 transition-colors duration-700 ${styles.bottomNavBg}`}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 pt-1.5 pb-5">
          {tabConfig.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className="flex flex-col items-center justify-center relative min-w-[48px] py-1 transition-colors duration-200 active:scale-95"
              >
                {/* Active indicator pill */}
                {isActive && (
                  <div
                    className={`absolute -top-1.5 h-1 w-12 rounded-full transition-all duration-300 ${styles.bottomNavIndicator}`}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? styles.bottomNavActive : styles.bottomNavInactive
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  fill={isActive ? "currentColor" : "none"}
                />
                <span
                  className={`text-[9px] mt-0.5 transition-colors duration-200 ${
                    isActive ? styles.bottomNavLabel : styles.bottomNavInactive
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Settings / Theme Sheet */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
          <div
            className={`relative w-full max-w-2xl rounded-t-2xl p-6 space-y-6 animate-in slide-in-from-bottom duration-300 ${styles.sheetBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pb-2">
              <div className={`w-10 h-1 rounded-full ${styles.sheetHandle}`} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wide">Settings</h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isLight ? "hover:bg-black/5" : "hover:bg-white/5"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Appearance */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 opacity-60" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${styles.textMuted}`}>
                    Appearance
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {(
                    [
                      { key: "morning", label: "Morning", icon: Sunrise },
                      { key: "afternoon", label: "Afternoon", icon: Sun },
                      { key: "evening", label: "Sunset", icon: Sunset },
                      { key: "night", label: "Night", icon: Moon },
                    ] as const
                  ).map(({ key, label, icon: ThemeIcon }) => (
                    <button
                      key={key}
                      onClick={() => setManualPhase(key)}
                      className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                        isManual && phase === key
                          ? styles.themeChipActive
                          : styles.themeChipInactive
                      }`}
                    >
                      <ThemeIcon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}

                  <button
                    onClick={() => setManualPhase(null)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                      !isManual ? styles.themeChipActive : styles.themeChipInactive
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Auto</span>
                  </button>
                </div>

                {!isManual && (
                  <p className={`text-[10px] ${styles.textMuted}`}>
                    Currently following {autoPhase} theme based on time of day
                  </p>
                )}
              </div>

              {/* Connection Status */}
              <div className="space-y-2 pt-2 border-t border-current/5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${styles.textMuted}`}>
                    Connection
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.connPill}`}
                  >
                    {dbConnected ? "Live" : "Preview"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Management Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
          <div
            className={`relative w-full max-w-md sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom sm:zoom-in duration-300 ${styles.modalBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="flex justify-center pb-1 sm:hidden">
              <div className={`w-10 h-1 rounded-full ${styles.sheetHandle || "bg-current/15"}`} />
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold tracking-wide">Create New Trip</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isLight ? "hover:bg-black/5" : "hover:bg-white/5"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTrip} className="space-y-4">
              <div>
                <label
                  className={`block text-[10px] uppercase tracking-wider mb-1.5 font-bold ${styles.textMuted}`}
                >
                  Trip Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa Family Trip"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full rounded-xl py-3 px-4 text-sm ${styles.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-[10px] uppercase tracking-wider mb-1.5 font-bold ${styles.textMuted}`}
                >
                  Destination
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa, India"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className={`w-full rounded-xl py-3 px-4 text-sm ${styles.input}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-[10px] uppercase tracking-wider mb-1.5 font-bold ${styles.textMuted}`}
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className={`w-full rounded-xl py-3 px-4 text-sm ${styles.input}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-[10px] uppercase tracking-wider mb-1.5 font-bold ${styles.textMuted}`}
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className={`w-full rounded-xl py-3 px-4 text-sm ${styles.input}`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`rounded-xl py-2.5 px-5 text-sm font-semibold transition-colors duration-200 ${
                    isLight
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`rounded-xl py-2.5 px-5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    creating ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    isLight
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-white text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  {creating ? "Creating..." : "Create Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
