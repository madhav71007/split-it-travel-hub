import React, { useState } from "react";
import { Upload, X, Heart, MessageCircle, Calendar } from "lucide-react";
import { mockUsers } from "../lib/dataService";
import { ThemePhase } from "../hooks/useTimeTheme";

interface Photo {
  id: string;
  url: string;
  caption: string;
  uploadedBy: string; // User ID
  createdAt: string;
  likes: number;
}

const initialPhotos: Photo[] = [
  {
    id: "p1",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    caption: "Sunset overlooking the Tiger Point valley! Stunning winds.",
    uploadedBy: "u1", // Alice
    createdAt: "2026-05-28T18:30:00.000Z",
    likes: 12,
  },
  {
    id: "p2",
    url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80",
    caption: "Chilling by the villa pool after a long drive. Water is perfect.",
    uploadedBy: "u2", // Bob
    createdAt: "2026-05-28T11:45:00.000Z",
    likes: 8,
  },
  {
    id: "p3",
    url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80",
    caption: "Best German Bakery breakfast ever! Waffles and Coffee.",
    uploadedBy: "u3", // Charlie
    createdAt: "2026-05-29T09:15:00.000Z",
    likes: 15,
  },
  {
    id: "p4",
    url: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80",
    caption: "Rajmachi fort trek. Tough trail but absolutely worth it.",
    uploadedBy: "u4", // David
    createdAt: "2026-05-29T16:00:00.000Z",
    likes: 24,
  },
  {
    id: "p5",
    url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
    caption: "Campfire and guitar session back at the villa tonight.",
    uploadedBy: "u5", // Emma
    createdAt: "2026-05-29T22:30:00.000Z",
    likes: 19,
  },
];

const getThemeStyles = (phase: ThemePhase) => {
  switch (phase) {
    case "morning":
      return {
        card: "bg-white/70 backdrop-blur-md border border-emerald-100/50 shadow-sm text-emerald-950",
        cardTitle: "text-emerald-800 font-bold uppercase tracking-wider text-xs",
        uploadZone: "border-emerald-250 hover:border-emerald-400 bg-white/40 hover:bg-emerald-50/30",
        photoCard: "bg-white/60 border border-emerald-100/50 hover:border-emerald-200 text-emerald-950",
        textMuted: "text-emerald-800/80",
        textPrimary: "text-emerald-950",
        input: "bg-white/60 border border-emerald-200 focus:border-emerald-400 text-emerald-950 placeholder-emerald-800/40 focus:outline-none",
        modalBg: "bg-white border border-emerald-100 text-emerald-950",
        modalClose: "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700",
        likeBtn: "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-700 hover:text-emerald-950",
      };
    case "afternoon":
      return {
        card: "bg-white border border-slate-200 shadow-sm text-slate-900",
        cardTitle: "text-slate-500 font-bold uppercase tracking-wider text-xs",
        uploadZone: "border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100/40",
        photoCard: "bg-white border border-slate-200 hover:border-slate-300 text-slate-900",
        textMuted: "text-slate-500",
        textPrimary: "text-slate-900",
        input: "bg-slate-50 border border-slate-200 focus:border-sky-400 text-slate-900 placeholder-slate-400 focus:outline-none",
        modalBg: "bg-white border border-slate-200 text-slate-900",
        modalClose: "bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-650",
        likeBtn: "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800",
      };
    case "evening":
      return {
        card: "bg-slate-950/60 backdrop-blur border border-orange-500/20 shadow-lg text-amber-100",
        cardTitle: "text-orange-400/80 font-bold uppercase tracking-wider text-xs",
        uploadZone: "border-orange-900/40 hover:border-orange-500/50 bg-slate-950/20 hover:bg-orange-950/10",
        photoCard: "bg-slate-950/60 border border-orange-500/10 hover:border-orange-500/30 text-amber-100",
        textMuted: "text-amber-200/60",
        textPrimary: "text-amber-55",
        input: "bg-slate-900/60 border border-orange-900/40 focus:border-orange-500/60 text-amber-100 placeholder-amber-200/30 focus:outline-none",
        modalBg: "bg-slate-950 border border-orange-500/30 text-amber-100",
        modalClose: "bg-slate-900 hover:bg-slate-855 border border-orange-900/40 text-amber-300/80",
        likeBtn: "bg-slate-900 border border-orange-900/40 text-orange-450 hover:text-white",
      };
    default: // night
      return {
        card: "bg-slate-950 border border-slate-900 shadow-md text-slate-100",
        cardTitle: "text-slate-400 font-bold uppercase tracking-wider text-xs",
        uploadZone: "border-slate-800 hover:border-slate-600 bg-slate-950 hover:bg-slate-900/30",
        photoCard: "bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-100",
        textMuted: "text-slate-400",
        textPrimary: "text-slate-100",
        input: "bg-slate-900 border border-slate-800 focus:border-slate-700 text-white placeholder-slate-500 focus:outline-none",
        modalBg: "bg-slate-950 border border-slate-900 text-slate-100",
        modalClose: "bg-slate-900/55 hover:bg-slate-900 border border-slate-800 text-white",
        likeBtn: "bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white",
      };
  }
};

export default function MemoriesTab({ 
  themePhase = "night" 
}: { 
  themePhase?: ThemePhase 
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [captionText, setCaptionText] = useState("");
  const [uploading, setUploading] = useState(false);

  const styles = getThemeStyles(themePhase);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const localUrl = URL.createObjectURL(file);

    setTimeout(() => {
      const newPhoto: Photo = {
        id: `p_${Date.now()}`,
        url: localUrl,
        caption: captionText.trim() || "Captured a special travel memory!",
        uploadedBy: "u1", // Alice
        createdAt: new Date().toISOString(),
        likes: 0,
      };

      setPhotos((prev) => [newPhoto, ...prev]);
      setCaptionText("");
      setUploading(false);
    }, 1200);
  };

  const getUserName = (id: string) => {
    return mockUsers.find((u) => u.id === id)?.name || "Unknown";
  };

  const getUserAvatar = (id: string) => {
    return mockUsers.find((u) => u.id === id)?.avatarUrl || "";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + 
           " at " + 
           date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleLike = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className={`rounded-xl p-5 space-y-4 shadow-lg ${styles.card}`}>
        <h3 className={styles.cardTitle}>
          Upload Memories
        </h3>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Add a caption for your media..."
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            className={`w-full rounded-lg py-2.5 px-3 text-xs ${styles.input}`}
          />

          <label className={`border border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${styles.uploadZone}`}>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center space-y-2 text-xs opacity-75">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-500" />
                <span>Uploading image to server...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 text-xs group-hover:opacity-100 transition-opacity duration-300 opacity-75">
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-current transition-colors duration-300" />
                <span className="font-semibold">Drag & Drop or Click to Upload Travel Media</span>
                <span className="text-[10px] opacity-60">Supports JPG, PNG, GIF up to 10MB</span>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => {
          const uploaderName = getUserName(photo.uploadedBy);
          const uploaderAvatar = getUserAvatar(photo.uploadedBy);

          return (
            <div
              key={photo.id}
              onClick={() => setActivePhoto(photo)}
              className={`group border rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-black/20 hover:border-current/35 transition-all duration-300 flex flex-col justify-between ${styles.photoCard}`}
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-square overflow-hidden bg-slate-900/30">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4 text-white text-xs font-semibold">
                  <span className="flex items-center">
                    <Heart className="w-4 h-4 mr-1 fill-white" /> {photo.likes}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" /> 2
                  </span>
                </div>
              </div>

              {/* Photo Description Card */}
              <div className="p-3 space-y-2">
                <p className={`text-[10px] line-clamp-2 leading-relaxed opacity-85`}>
                  {photo.caption}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-current/5">
                  <div className="flex items-center space-x-2">
                    <img
                      src={uploaderAvatar}
                      alt={uploaderName}
                      className="w-5 h-5 rounded-full border border-current/5"
                    />
                    <span className="text-[9px] font-semibold opacity-75">
                      {uploaderName}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleLike(e, photo.id)}
                    className="flex items-center space-x-1 text-[10px] opacity-60 hover:opacity-100 transition-opacity duration-300"
                  >
                    <Heart className="w-3 h-3" />
                    <span>{photo.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / Overlay Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setActivePhoto(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setActivePhoto(null)}
            className={`absolute top-4 right-4 rounded-full p-2.5 transition-colors duration-300 ${styles.modalClose}`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Lightbox content card */}
          <div
            className={`w-full max-w-xl border rounded-2xl overflow-hidden shadow-2xl flex flex-col ${styles.modalBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* High-res Image */}
            <div className="relative max-h-[60vh] overflow-hidden bg-slate-900/10 flex items-center justify-center">
              <img
                src={activePhoto.url}
                alt={activePhoto.caption}
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>

            {/* Bottom info section */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={getUserAvatar(activePhoto.uploadedBy)}
                    alt={getUserName(activePhoto.uploadedBy)}
                    className="w-8 h-8 rounded-full border border-current/5"
                  />
                  <div>
                    <h4 className="text-xs font-bold">
                      {getUserName(activePhoto.uploadedBy)}
                    </h4>
                    <p className={`text-[9px] flex items-center ${styles.textMuted}`}>
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(activePhoto.createdAt)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleLike(e, activePhoto.id)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-300 ${styles.likeBtn}`}
                >
                  <Heart className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
                  Like ({activePhoto.likes})
                </button>
              </div>

              <p className="text-xs leading-relaxed font-medium">
                {activePhoto.caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
