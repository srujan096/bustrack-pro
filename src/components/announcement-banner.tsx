'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Info, AlertTriangle, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementBannerProps {
  userRole: string;
}

const typeConfig: Record<string, {
  bg: string;
  bgDark: string;
  border: string;
  borderDark: string;
  text: string;
  textDark: string;
  icon: React.ReactNode;
  badge: string;
  badgeDark: string;
  dot: string;
}> = {
  info: {
    bg: 'bg-sky-50',
    bgDark: 'dark:bg-sky-950/60',
    border: 'border-sky-200',
    borderDark: 'dark:border-sky-800/50',
    text: 'text-sky-800',
    textDark: 'dark:text-sky-200',
    icon: <Info className="w-4 h-4 text-sky-500 dark:text-sky-400" />,
    badge: 'bg-sky-100 text-sky-700',
    badgeDark: 'dark:bg-sky-900/40 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  warning: {
    bg: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/60',
    border: 'border-amber-200',
    borderDark: 'dark:border-amber-800/50',
    text: 'text-amber-800',
    textDark: 'dark:text-amber-200',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
    badge: 'bg-amber-100 text-amber-700',
    badgeDark: 'dark:bg-amber-900/40 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  success: {
    bg: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/60',
    border: 'border-emerald-200',
    borderDark: 'dark:border-emerald-800/50',
    text: 'text-emerald-800',
    textDark: 'dark:text-emerald-200',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
    badge: 'bg-emerald-100 text-emerald-700',
    badgeDark: 'dark:bg-emerald-900/40 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  urgent: {
    bg: 'bg-red-50',
    bgDark: 'dark:bg-red-950/60',
    border: 'border-red-200',
    borderDark: 'dark:border-red-800/50',
    text: 'text-red-800',
    textDark: 'dark:text-red-200',
    icon: <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />,
    badge: 'bg-red-100 text-red-700',
    badgeDark: 'dark:bg-red-900/40 dark:text-red-300',
    dot: 'bg-red-500',
  },
};

function getDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem('bus_dismissed_announcements');
    if (stored) return new Set(JSON.parse(stored));
  } catch { /* ignore */ }
  return new Set();
}

function addDismissedId(id: string) {
  const ids = getDismissedIds();
  ids.add(id);
  try {
    localStorage.setItem('bus_dismissed_announcements', JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

export default function AnnouncementBanner({ userRole }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Lazy-initialize dismissed IDs from localStorage to avoid effect
  const [dismissed, setDismissed] = useState<Set<string>>(() => getDismissedIds());
  const [paused, setPaused] = useState(false);
  const mountedRef = useRef(false);

  // Filter out dismissed announcements (derived, not state)
  const visibleAnnouncements = useMemo(
    () => announcements.filter(a => !dismissed.has(a.id)),
    [announcements, dismissed]
  );

  // Derive visibility from data (no extra state needed)
  const hasVisible = visibleAnnouncements.length > 0;

  // Fetch announcements using effect with interval
  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetch(`/api/announcements?role=${userRole}&active=true`);
        const data = await res.json();
        if (data.announcements) {
          setAnnouncements(data.announcements);
        }
      } catch {
        // silent
      }
    };

    // Schedule initial fetch via microtask to avoid synchronous setState in effect
    const taskId = setTimeout(doFetch, 0);
    const interval = setInterval(doFetch, 60000);

    return () => {
      clearTimeout(taskId);
      clearInterval(interval);
    };
  }, [userRole]);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (visibleAnnouncements.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visibleAnnouncements.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [visibleAnnouncements.length, paused]);

  // Track mounted state for animation
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // Handle dismiss
  const handleDismiss = (id: string) => {
    addDismissedId(id);
    setDismissed(prev => new Set(prev).add(id));
  };

  if (!hasVisible) return null;

  const current = visibleAnnouncements[currentIndex];
  if (!current) return null;

  const config = typeConfig[current.type] || typeConfig.info;
  const isUrgent = current.type === 'urgent';

  return (
    <div
      className={`relative overflow-hidden animate-banner-slide-in ${config.bg} ${config.bgDark} ${config.border} ${config.borderDark} border-b`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Subtle progress bar for auto-rotation */}
      {visibleAnnouncements.length > 1 && !paused && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/5 overflow-hidden">
          <div
            key={currentIndex}
            className={`h-full ${config.dot} opacity-60`}
            style={{
              animation: 'bannerProgress 8s linear forwards',
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Type icon */}
        <div className="flex-shrink-0">{config.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config.badge} ${config.badgeDark}`}
            >
              {current.type}
            </span>
            {isUrgent && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
            <span className={`text-xs font-semibold ${config.text} ${config.textDark} truncate`}>
              {current.title}
            </span>
          </div>
          <p className={`text-xs ${config.text} ${config.textDark} opacity-80 truncate leading-relaxed`}>
            {current.message}
          </p>
        </div>

        {/* Navigation dots (multiple announcements) */}
        {visibleAnnouncements.length > 1 && (
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            {visibleAnnouncements.map((_, i) => (
              <button
                key={visibleAnnouncements[i].id}
                onClick={() => setCurrentIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? `w-4 h-1.5 ${config.dot}`
                    : 'w-1.5 h-1.5 bg-black/15 dark:bg-white/15 hover:bg-black/25 dark:hover:bg-white/25'
                }`}
                aria-label={`Go to announcement ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Dismiss button */}
        <button
          onClick={() => handleDismiss(current.id)}
          className={`flex-shrink-0 p-1 rounded-md ${config.text} ${config.textDark} opacity-50 hover:opacity-100 transition-opacity`}
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <style>{`
        @keyframes bannerProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes bannerSlideIn {
          from {
            max-height: 0;
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            max-height: 80px;
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-banner-slide-in {
          animation: bannerSlideIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
