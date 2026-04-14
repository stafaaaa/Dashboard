/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Clock, Cloud, Calendar as CalendarIcon, Image as ImageIcon, 
  Music, Youtube, BookOpen, StickyNote, Settings, Plus, 
  X, ChevronLeft, ChevronRight, Maximize2, Trash2, 
  Sun, CloudRain, CloudLightning, Wind, Thermometer,
  ExternalLink, Play, Pause, RefreshCw, Palette, Type,
  LayoutGrid, Monitor, Zap, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type TileType = 'clock' | 'weather' | 'calendar' | 'appointments' | 'spotify' | 'youtube' | 'amazonmusic' | 'recipe' | 'note' | 'app';

interface TileConfig {
  id: string;
  type: TileType;
  title: string;
  colSpan: number;
  rowSpan: number;
  color?: string;
  bgImage?: string;
  opacity?: number;
  view: string;
  appLink?: string;
  customIcon?: string;
  glowEffect?: 'none' | 'pulse' | 'static' | 'rainbow' | 'tap';
  glowColor?: string;
  content?: string;
  bgImageFit?: 'cover' | 'contain' | 'auto';
  bgImagePosition?: string;
}

interface UserConfig {
  city: string;
  spotifyUrl: string;
  youtubeUrl: string;
  amazonMusicUrl: string;
  recipeUrl: string;
  appointmentsText: string;
  globalAccent: string;
  globalTextColor: string;
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  tileOpacity: number;
  dashboardBgImage: string;
  dashboardBgColor: string;
  effect3D: 'none' | 'float-low' | 'float-medium' | 'float-high';
  layoutTheme: string;
  isKioskMode: boolean;
  fontFamily: 'sans' | 'space' | 'serif' | 'mono' | 'outfit' | 'montserrat';
  dashboardBgImageFit?: 'cover' | 'contain' | 'auto';
  dashboardBgImagePosition?: string;
  globalGlow: 'none' | 'pulse' | 'static' | 'rainbow' | 'tap';
  globalGlowColor: string;
  globalGlowSize: number;
  events: Record<string, string[]>;
}

// --- Constants ---
const DEFAULT_TILES: TileConfig[] = [
  { id: '1', type: 'weather', title: 'Wetter', colSpan: 2, rowSpan: 2, view: 'home', glowEffect: 'pulse', glowColor: '#0071e3' },
  { id: '2', type: 'clock', title: 'Uhrzeit', colSpan: 2, rowSpan: 2, view: 'home', glowEffect: 'none' },
  { id: '3', type: 'calendar', title: 'Kalender', colSpan: 2, rowSpan: 2, view: 'home', glowEffect: 'static', glowColor: '#af52de' },
  { id: '4', type: 'appointments', title: 'Termine', colSpan: 2, rowSpan: 2, view: 'home', glowEffect: 'static', glowColor: '#ff9f0a' },
  { id: '5', type: 'spotify', title: 'Spotify', colSpan: 2, rowSpan: 1, view: 'media', glowEffect: 'pulse', glowColor: '#28cd41' },
  { id: '6', type: 'youtube', title: 'YouTube', colSpan: 2, rowSpan: 1, view: 'media', glowEffect: 'pulse', glowColor: '#ff0000' },
  { id: '7', type: 'amazonmusic', title: 'Amazon Music', colSpan: 2, rowSpan: 1, view: 'media', glowEffect: 'pulse', glowColor: '#00a8e1' },
];

const DEFAULT_CONFIG: UserConfig = {
  city: 'Düsseldorf',
  spotifyUrl: 'spotify:',
  youtubeUrl: 'vnd.youtube://',
  amazonMusicUrl: 'amazonmusic://',
  recipeUrl: 'https://www.chefkoch.de/',
  appointmentsText: '',
  globalAccent: '#0071e3',
  globalTextColor: '#ffffff',
  theme: 'dark',
  fontSize: 'medium',
  tileOpacity: 0.8,
  dashboardBgImage: '',
  dashboardBgColor: '#1d1d1f',
  effect3D: 'float-medium',
  layoutTheme: 'apple-dark',
  isKioskMode: false,
  fontFamily: 'sans',
  globalGlow: 'none',
  globalGlowColor: '#0071e3',
  globalGlowSize: 2,
  events: {}
};

const THEMES: Record<string, { name: string; config: Partial<UserConfig> }> = {
  'apple-dark': {
    name: 'Apple Dark',
    config: {
      dashboardBgColor: '#000000',
      globalAccent: '#0071e3',
      globalTextColor: '#ffffff',
      tileOpacity: 0.7,
      effect3D: 'float-medium',
      theme: 'dark',
      globalGlow: 'none',
      dashboardBgImage: ''
    }
  },
  'apple-light': {
    name: 'Apple Light',
    config: {
      dashboardBgColor: '#f5f5f7',
      globalAccent: '#0071e3',
      globalTextColor: '#1d1d1f',
      tileOpacity: 0.8,
      effect3D: 'float-medium',
      theme: 'light',
      globalGlow: 'none',
      dashboardBgImage: ''
    }
  },
  'xiaomi': {
    name: 'Xiaomi HyperOS',
    config: {
      dashboardBgColor: '#0a0a0a',
      globalAccent: '#ff6700',
      globalTextColor: '#ffffff',
      tileOpacity: 0.9,
      effect3D: 'float-low',
      theme: 'dark',
      globalGlow: 'pulse',
      globalGlowColor: '#ff6700',
      dashboardBgImage: ''
    }
  },
  'nothing': {
    name: 'Nothing Phone',
    config: {
      dashboardBgColor: '#000000',
      globalAccent: '#ff0000',
      globalTextColor: '#ffffff',
      tileOpacity: 0.1,
      effect3D: 'none',
      theme: 'dark',
      globalGlow: 'static',
      globalGlowColor: '#ffffff',
      dashboardBgImage: ''
    }
  },
  'sunset': {
    name: 'Sunset Glow',
    config: {
      dashboardBgColor: '#1a0b1a',
      globalAccent: '#ff7e5f',
      globalTextColor: '#ffffff',
      tileOpacity: 0.6,
      effect3D: 'float-medium',
      theme: 'dark',
      fontFamily: 'outfit',
      globalGlow: 'pulse',
      globalGlowColor: '#feb47b',
      dashboardBgImage: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2000'
    }
  },
  'ocean': {
    name: 'Ocean Breeze',
    config: {
      dashboardBgColor: '#051015',
      globalAccent: '#2193b0',
      globalTextColor: '#ffffff',
      tileOpacity: 0.5,
      effect3D: 'float-high',
      theme: 'dark',
      fontFamily: 'space',
      globalGlow: 'static',
      globalGlowColor: '#6dd5ed',
      dashboardBgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000'
    }
  },
  'neon': {
    name: 'Neon Night',
    config: {
      dashboardBgColor: '#000000',
      globalAccent: '#ff00ff',
      globalTextColor: '#ffffff',
      tileOpacity: 0.3,
      effect3D: 'float-medium',
      theme: 'dark',
      fontFamily: 'mono',
      globalGlow: 'rainbow',
      globalGlowColor: '#00ffff',
      dashboardBgImage: ''
    }
  },
  'candy': {
    name: 'Candy Pop',
    config: {
      dashboardBgColor: '#fff0f0',
      globalAccent: '#ff4d6d',
      globalTextColor: '#4a1a1a',
      tileOpacity: 0.8,
      effect3D: 'float-low',
      theme: 'light',
      fontFamily: 'montserrat',
      globalGlow: 'pulse',
      globalGlowColor: '#ffecd2',
      dashboardBgImage: ''
    }
  },
  'forest': {
    name: 'Forest Fresh',
    config: {
      dashboardBgColor: '#0a1a10',
      globalAccent: '#71b280',
      globalTextColor: '#ffffff',
      tileOpacity: 0.7,
      effect3D: 'float-medium',
      theme: 'dark',
      fontFamily: 'sans',
      globalGlow: 'static',
      globalGlowColor: '#a8e063',
      dashboardBgImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2000'
    }
  }
};

// --- Components ---

interface TileProps {
  tile: TileConfig;
  config: UserConfig;
  editMode: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  children: React.ReactNode;
  key?: string | number;
}

const Tile = ({ 
  tile, 
  config, 
  editMode, 
  onEdit, 
  onDelete,
  children 
}: TileProps) => {
  const controls = useAnimation();
  const [isTapped, setIsTapped] = useState(false);

  const handleDoubleTap = useCallback(async () => {
    if (editMode) return;
    
    // Fall animation
    await controls.start({
      y: window.innerHeight,
      rotate: Math.random() * 20 - 10,
      opacity: 0,
      transition: { duration: 0.8, ease: "easeIn" }
    });
    
    // Reset position
    controls.set({ y: -100, rotate: 0, opacity: 0 });
    
    // Rise up animation
    await controls.start({
      y: 0,
      opacity: 1,
      transition: { type: "spring", damping: 12, stiffness: 100 }
    });
  }, [controls, editMode]);

  const onTouchEnd = (e: React.TouchEvent) => {
    // Simple double tap detection
    if (e.timeStamp - (window as any).lastTap < 300) {
      handleDoubleTap();
    }
    (window as any).lastTap = e.timeStamp;
  };

  const glowClass = useMemo(() => {
    const effect = tile.glowEffect || config.globalGlow;
    if (effect === 'none') return '';
    return `glow-${effect}`;
  }, [tile.glowEffect, config.globalGlow]);

  const glowStyle = useMemo(() => {
    const color = tile.glowColor || config.globalGlowColor;
    const size = config.globalGlowSize;
    return {
      '--glow-color': color,
      '--glow-spread': `${size * 4}px`,
      '--glow-blur': `${size * 10}px`,
    } as React.CSSProperties;
  }, [tile.glowColor, config.globalGlowColor, config.globalGlowSize]);

  return (
    <motion.div
      animate={controls}
      onTouchEnd={onTouchEnd}
      className={cn(
        "relative overflow-hidden border transition-all duration-300",
        config.layoutTheme === 'nothing' ? "rounded-sm border-white/20" : "rounded-[28px] border-white/10",
        editMode && "ring-2 ring-blue-500 ring-offset-2 ring-offset-black cursor-move",
        glowClass !== '' && "border-2",
        config.effect3D === 'float-low' && "hover:-translate-y-1",
        config.effect3D === 'float-medium' && "hover:-translate-y-2",
        config.effect3D === 'float-high' && "hover:-translate-y-4",
        "flex flex-col p-4 shadow-lg backdrop-blur-xl"
      )}
      style={{
        gridColumn: `span ${tile.colSpan}`,
        gridRow: `span ${tile.rowSpan}`,
        backgroundColor: tile.color 
          ? `${tile.color}${Math.round((tile.opacity || config.tileOpacity) * 255).toString(16).padStart(2, '0')}` 
          : config.theme === 'dark' 
            ? `rgba(255, 255, 255, ${0.05 * (tile.opacity || config.tileOpacity) * 10})` 
            : `rgba(0, 0, 0, ${0.05 * (tile.opacity || config.tileOpacity) * 10})`,
        ...glowStyle
      }}
    >
      {/* Glow Overlay */}
      <div className={cn("absolute inset-0 pointer-events-none rounded-[inherit]", glowClass)} />

      <div className="flex justify-between items-center mb-2 z-10">
        <div 
          className="flex items-center gap-2 font-semibold text-sm opacity-100"
          style={{ color: config.globalTextColor }}
        >
          {tile.customIcon ? <span>{tile.customIcon}</span> : <TileIcon type={tile.type} />}
          <span>{tile.title}</span>
        </div>
        {editMode && (
          <div className="flex gap-1">
            <button onClick={() => onEdit(tile.id)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <Settings size={14} />
            </button>
            <button onClick={() => onDelete(tile.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 z-10">
        {children}
      </div>

      {/* Background Image if exists */}
      {tile.bgImage && (
        <div 
          className="absolute inset-0 -z-10"
          style={{ 
            backgroundImage: `url(${tile.bgImage})`,
            backgroundSize: tile.bgImageFit || 'cover',
            backgroundPosition: tile.bgImagePosition || 'center',
            backgroundRepeat: 'no-repeat',
            opacity: tile.opacity ?? 0.4
          }}
        />
      )}
    </motion.div>
  );
};

const TileIcon = ({ type }: { type: TileType }) => {
  switch (type) {
    case 'clock': return <Clock size={18} />;
    case 'weather': return <Cloud size={18} />;
    case 'calendar': return <CalendarIcon size={18} />;
    case 'appointments': return <StickyNote size={18} />;
    case 'spotify': return <Music size={18} />;
    case 'youtube': return <Youtube size={18} />;
    case 'amazonmusic': return <Music size={18} />;
    case 'recipe': return <BookOpen size={18} />;
    default: return <LayoutGrid size={18} />;
  }
};

// --- Specific Tiles ---

const ClockTile = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-6xl font-light tracking-tighter tabular-nums">
        {time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-lg opacity-60 font-medium mt-2">
        {time.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
      </div>
    </div>
  );
};

const WeatherTile = ({ city }: { city: string }) => {
  const [weather, setWeather] = useState<any>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`);
        const geoData = await geoRes.json();
        if (!geoData.results?.length) return;
        const { latitude, longitude, name } = geoData.results[0];

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await weatherRes.json();
        setWeather({ ...data, cityName: name });
      } catch (e) {
        console.error(e);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000); // 30 mins
    return () => clearInterval(interval);
  }, [city]);

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <div className="text-4xl font-bold tracking-tighter tabular-nums">
            {time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[10px] opacity-80 font-medium uppercase tracking-wider">
            {time.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}
          </div>
        </div>
        {weather && (
          <div className="text-right">
            <div className="text-3xl font-light">{Math.round(weather.current.temperature_2m)}°</div>
            <div className="text-[10px] opacity-80 font-medium">{weather.cityName}</div>
          </div>
        )}
      </div>

      {weather ? (
        <div className="flex justify-between mt-4 overflow-x-auto pb-2 gap-2">
          {weather.daily.time.slice(1, 6).map((time: string, i: number) => (
            <div key={time} className="flex flex-col items-center bg-white/5 rounded-2xl p-2 min-w-[45px]">
              <div className="text-[9px] opacity-80">{new Date(time).toLocaleDateString('de-DE', { weekday: 'short' })}</div>
              <div className="text-sm my-1">{getWeatherEmoji(weather.daily.weather_code[i+1])}</div>
              <div className="text-[10px] font-semibold">{Math.round(weather.daily.temperature_2m_max[i+1])}°</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center opacity-20 text-xs py-4">Lade Wetter...</div>
      )}
    </div>
  );
};

function getWeatherEmoji(code: number) {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

const CalendarTile = ({ events, onAddEvent }: { events: Record<string, string[]>; onAddEvent: (date: string, text: string) => void }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - startOffset + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const text = prompt(`Termin für den ${day}.${viewDate.getMonth() + 1}.${viewDate.getFullYear()} eingeben:`);
    if (text) {
      onAddEvent(dateStr, text);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="font-semibold text-sm">
          {viewDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
          <div key={d} className="text-[10px] text-center opacity-70 font-bold">{d}</div>
        ))}
        {days.map((day, i) => {
          const isToday = day === today.getDate() && 
                          viewDate.getMonth() === today.getMonth() && 
                          viewDate.getFullYear() === today.getFullYear();
          
          const dateStr = day ? `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` : '';
          const hasEvents = day && events[dateStr] && events[dateStr].length > 0;

          return (
            <div 
              key={i} 
              onClick={() => handleDayClick(day)}
              className={cn(
                "flex flex-col items-center justify-center text-xs rounded-lg aspect-square transition-colors relative cursor-pointer",
                isToday ? "bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/40" : "hover:bg-white/5",
                !day && "opacity-0 pointer-events-none"
              )}
            >
              {day}
              {hasEvents && !isToday && (
                <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />
              )}
              {hasEvents && isToday && (
                <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AppointmentsTile = ({ text, events, onOpenSettings }: { text: string; events: Record<string, string[]>; onOpenSettings: () => void }) => {
  const manualAppointments = text.split('\n').filter(l => l.trim());
  
  // Get upcoming events from calendar
  const todayStr = new Date().toISOString().split('T')[0];
  const calendarAppointments = Object.entries(events)
    .filter(([date]) => date >= todayStr)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, evs]) => {
      const d = new Date(date);
      const dateLabel = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      return evs.map(e => `${dateLabel}: ${e}`);
    });

  const allAppointments = [...calendarAppointments, ...manualAppointments].slice(0, 6);

  return (
    <div 
      className="flex flex-col gap-2 overflow-y-auto pr-1 cursor-pointer group h-full"
      onClick={onOpenSettings}
    >
      {allAppointments.length > 0 ? (
        allAppointments.map((app, i) => (
          <div key={i} className="bg-white/5 p-2 rounded-xl border border-white/5 text-sm group-hover:bg-white/10 transition-colors">
            {app}
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 opacity-60 italic text-sm">
          <Plus size={20} className="mb-2" />
          <span>Termine hinzufügen</span>
        </div>
      )}
    </div>
  );
};

const NoteTile = ({ content, onUpdate }: { content: string; onUpdate: (val: string) => void }) => {
  return (
    <textarea
      value={content || ''}
      onChange={(e) => onUpdate(e.target.value)}
      placeholder="Notiz schreiben..."
      className="w-full h-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:opacity-50"
    />
  );
};

const AppTile = ({ type, url, title }: { type: TileType; url: string; title: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="p-4 bg-white/5 rounded-3xl border border-white/10 shadow-inner">
        <TileIcon type={type} />
      </div>
      <button 
        onClick={() => window.open(url, '_blank')}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
      >
        Öffnen
      </button>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [tiles, setTiles] = useState<TileConfig[]>([]);
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [editMode, setEditMode] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTileId, setEditingTileId] = useState<string | null>(null);
  const [showNav, setShowNav] = useState(true);
  const navTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Kiosk Mode: Auto-hide nav
  useEffect(() => {
    if (!config.isKioskMode) {
      setShowNav(true);
      return;
    }

    const resetTimer = () => {
      setShowNav(true);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => {
        if (!editMode && !isSettingsOpen && !editingTileId) {
          setShowNav(false);
        }
      }, 5000); // Hide after 5s
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, [config.isKioskMode, editMode, isSettingsOpen, editingTileId]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Load state
  useEffect(() => {
    const savedTiles = localStorage.getItem('tablet_dash_tiles');
    const savedConfig = localStorage.getItem('tablet_dash_config');
    
    if (savedTiles) setTiles(JSON.parse(savedTiles));
    else setTiles(DEFAULT_TILES);
    
    if (savedConfig) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) });
  }, []);

  // Save state
  useEffect(() => {
    if (tiles.length > 0) localStorage.setItem('tablet_dash_tiles', JSON.stringify(tiles));
    localStorage.setItem('tablet_dash_config', JSON.stringify(config));
  }, [tiles, config]);

  // Watchdog & Wake Lock
  useEffect(() => {
    let lastTick = Date.now();
    const watchdogInterval = setInterval(() => {
      const now = Date.now();
      // If the interval is delayed by more than 30 seconds (total 60s), reload
      if (now - lastTick > 60000) {
        window.location.reload();
      }
      lastTick = now;
    }, 30000);
    
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {}
    };
    requestWakeLock();

    return () => {
      clearInterval(watchdogInterval);
      if (wakeLock) wakeLock.release();
    };
  }, []);

  const addTile = (type: TileType) => {
    const newTile: TileConfig = {
      id: Date.now().toString(),
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      colSpan: 2,
      rowSpan: 2,
      view: activeView
    };
    setTiles([...tiles, newTile]);
  };

  const deleteTile = (id: string) => {
    setTiles(tiles.filter(t => t.id !== id));
  };

  const updateTile = (id: string, updates: Partial<TileConfig>) => {
    setTiles(tiles.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const currentTiles = useMemo(() => tiles.filter(t => t.view === activeView), [tiles, activeView]);

  return (
    <div 
        className={cn(
          "fixed inset-0 flex flex-col overflow-hidden transition-all duration-700",
          config.theme === 'dark' ? "bg-zinc-950" : "bg-zinc-50",
          config.fontFamily === 'sans' && "font-sans",
          config.fontFamily === 'space' && "font-space",
          config.fontFamily === 'serif' && "font-serif",
          config.fontFamily === 'mono' && "font-mono",
          config.fontFamily === 'outfit' && "font-outfit",
          config.fontFamily === 'montserrat' && "font-montserrat"
        )}
      style={{ 
        backgroundColor: config.dashboardBgColor,
        backgroundImage: config.dashboardBgImage ? `url(${config.dashboardBgImage})` : 'none',
        backgroundSize: config.dashboardBgImageFit || 'cover',
        backgroundPosition: config.dashboardBgImagePosition || 'center',
        backgroundRepeat: 'no-repeat',
        color: config.globalTextColor,
        textShadow: config.theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.5)' : 'none'
      }}
    >
      {/* Main Grid Area */}
      <main className="flex-1 p-6 overflow-hidden">
        <div 
          className="grid grid-cols-6 grid-rows-4 gap-4 h-full"
          style={{ gridAutoRows: '1fr' }}
        >
          <AnimatePresence mode="popLayout">
            {currentTiles.map(tile => (
              <Tile 
                key={tile.id} 
                tile={tile} 
                config={config} 
                editMode={editMode}
                onEdit={setEditingTileId}
                onDelete={deleteTile}
              >
                {renderTileContent(tile, config, updateTile, () => setIsSettingsOpen(true), setConfig)}
              </Tile>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Navigation Bar */}
      <AnimatePresence>
        {showNav && (
          <motion.nav 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="h-20 flex items-center justify-center gap-8 px-8 z-50"
          >
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-2xl">
              <NavButton active={activeView === 'home'} onClick={() => setActiveView('home')} icon={<LayoutGrid size={20} />} label="Home" />
              <NavButton active={activeView === 'media'} onClick={() => setActiveView('media')} icon={<Play size={20} />} label="Media" />
              <NavButton active={activeView === 'tools'} onClick={() => setActiveView('tools')} icon={<Monitor size={20} />} label="Tools" />
              <div className="w-px h-6 bg-white/10 mx-2" />
              <button 
                onClick={() => setEditMode(!editMode)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                  editMode ? "bg-blue-500 text-white" : "hover:bg-white/10"
                )}
              >
                <Zap size={20} />
                <span className="text-sm font-medium">Edit</span>
              </button>
              <button 
                onClick={toggleFullScreen}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
                title="Vollbild"
              >
                <Maximize2 size={20} />
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <Settings size={20} />
              </button>
              {editMode && (
                <div className="flex gap-1 bg-white/5 p-1 rounded-full border border-white/10 overflow-x-auto max-w-[300px] no-scrollbar">
                  <button 
                    onClick={() => addTile('clock')}
                    className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-full transition-all"
                    title="Uhr"
                  >
                    <Clock size={20} />
                  </button>
                  <button 
                    onClick={() => addTile('weather')}
                    className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-full transition-all"
                    title="Wetter"
                  >
                    <Cloud size={20} />
                  </button>
                  <button 
                    onClick={() => addTile('calendar')}
                    className="p-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-full transition-all"
                    title="Kalender"
                  >
                    <CalendarIcon size={20} />
                  </button>
                  <button 
                    onClick={() => addTile('appointments')}
                    className="p-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-full transition-all"
                    title="Termine"
                  >
                    <StickyNote size={20} />
                  </button>
                  <button 
                    onClick={() => addTile('note')}
                    className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-full transition-all"
                    title="Notiz"
                  >
                    <StickyNote size={20} />
                  </button>
                  <button 
                    onClick={() => addTile('spotify')}
                    className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-full transition-all"
                    title="Spotify"
                  >
                    <Music size={20} />
                  </button>
                  <button 
                    onClick={() => addTile('amazonmusic')}
                    className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-full transition-all"
                    title="Amazon Music"
                  >
                    <Play size={20} />
                  </button>
                  <button 
                    onClick={() => addTile('youtube')}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full transition-all"
                    title="YouTube"
                  >
                    <Youtube size={20} />
                  </button>
                  <button 
                    onClick={() => addTile('app')}
                    className="p-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-full transition-all"
                    title="App hinzufügen"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            config={config} 
            onSave={setConfig} 
            onClose={() => setIsSettingsOpen(false)} 
            onResetTiles={() => {
              setTiles(DEFAULT_TILES);
              localStorage.setItem('tablet_dash_tiles', JSON.stringify(DEFAULT_TILES));
            }}
          />
        )}
        {editingTileId && (
          <TileSettingsModal 
            tile={tiles.find(t => t.id === editingTileId)!}
            onSave={(updates) => {
              updateTile(editingTileId, updates);
              setEditingTileId(null);
            }}
            onClose={() => setEditingTileId(null)}
          />
        )}
      </AnimatePresence>

      {/* Global CSS for Glow Effects */}
      <style>{`
        .glow-pulse {
          animation: glow-pulse 3s infinite ease-in-out;
          border-color: var(--glow-color);
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 var(--glow-spread) var(--glow-color); }
          50% { box-shadow: 0 0 var(--glow-blur) var(--glow-color); }
        }
        .glow-static {
          box-shadow: 0 0 var(--glow-spread) var(--glow-color);
          border-color: var(--glow-color);
        }
        .glow-rainbow {
          animation: glow-rainbow 5s infinite linear;
          border-width: 2px;
        }
        @keyframes glow-rainbow {
          0% { border-color: #ff0000; box-shadow: 0 0 15px #ff0000; }
          33% { border-color: #00ff00; box-shadow: 0 0 15px #00ff00; }
          66% { border-color: #0000ff; box-shadow: 0 0 15px #0000ff; }
          100% { border-color: #ff0000; box-shadow: 0 0 15px #ff0000; }
        }
      `}</style>
    </div>
  );
}

function renderTileContent(
  tile: TileConfig, 
  config: UserConfig, 
  onUpdateTile: (id: string, updates: Partial<TileConfig>) => void,
  onOpenSettings: () => void,
  setConfig: React.Dispatch<React.SetStateAction<UserConfig>>
) {
  switch (tile.type) {
    case 'clock': return <ClockTile />;
    case 'weather': return <WeatherTile city={config.city} />;
    case 'calendar': return (
      <CalendarTile 
        events={config.events || {}} 
        onAddEvent={(date, text) => {
          setConfig(prev => {
            const newEvents = { ...prev.events };
            if (!newEvents[date]) newEvents[date] = [];
            newEvents[date] = [...newEvents[date], text];
            return { ...prev, events: newEvents };
          });
        }} 
      />
    );
    case 'appointments': return (
      <AppointmentsTile 
        text={config.appointmentsText} 
        events={config.events || {}}
        onOpenSettings={onOpenSettings} 
      />
    );
    case 'note': return <NoteTile content={tile.content || ''} onUpdate={(val) => onUpdateTile(tile.id, { content: val })} />;
    case 'app': return <AppTile type="app" url={tile.appLink || '#'} title={tile.title} />;
    case 'spotify': return <AppTile type="spotify" url={config.spotifyUrl} title="Spotify" />;
    case 'youtube': return <AppTile type="youtube" url={config.youtubeUrl} title="YouTube" />;
    case 'amazonmusic': return <AppTile type="amazonmusic" url={config.amazonMusicUrl} title="Amazon Music" />;
    case 'recipe': return <AppTile type="recipe" url={config.recipeUrl} title="Rezepte" />;
    default: return <div className="flex items-center justify-center h-full opacity-20"><LayoutGrid size={48} /></div>;
  }
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-2 rounded-full transition-all",
      active ? "bg-white/10 text-white shadow-inner" : "opacity-40 hover:opacity-100"
    )}
  >
    {icon}
    <span className="text-sm font-semibold">{label}</span>
  </button>
);

const SettingsModal = ({ config, onSave, onClose, onResetTiles }: { config: UserConfig; onSave: (c: UserConfig) => void; onClose: () => void; onResetTiles: () => void }) => {
  const [local, setLocal] = useState(config);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyTheme = (themeId: string) => {
    const theme = THEMES[themeId];
    if (theme) {
      setLocal({ ...local, ...theme.config, layoutTheme: themeId });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocal({ ...local, dashboardBgImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-white scrollbar-hide"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="text-blue-500" /> Einstellungen
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X /></button>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">Themes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(THEMES).map(([id, theme]) => (
                <button
                  key={id}
                  onClick={() => applyTheme(id)}
                  className={cn(
                    "p-3 rounded-2xl border transition-all text-xs font-bold text-center",
                    local.layoutTheme === id 
                      ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20" 
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">Allgemein</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">Stadt für Wetter</label>
                <input 
                  type="text" value={local.city} 
                  onChange={e => setLocal({ ...local, city: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">Thema</label>
                <select 
                  value={local.theme} 
                  onChange={e => setLocal({ ...local, theme: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:ring-2 ring-blue-500 outline-none"
                >
                  <option value="light">Hell</option>
                  <option value="dark">Dunkel</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">Apps & Links</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">Spotify URL</label>
                <input 
                  type="text" value={local.spotifyUrl} 
                  onChange={e => setLocal({ ...local, spotifyUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">Amazon Music URL</label>
                <input 
                  type="text" value={local.amazonMusicUrl} 
                  onChange={e => setLocal({ ...local, amazonMusicUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">YouTube URL</label>
                <input 
                  type="text" value={local.youtubeUrl} 
                  onChange={e => setLocal({ ...local, youtubeUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">Termine (Eine Zeile pro Termin)</label>
                <textarea 
                  value={local.appointmentsText} 
                  onChange={e => setLocal({ ...local, appointmentsText: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">Design</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">Kachel-Deckkraft</label>
                <input 
                  type="range" min="0.1" max="1" step="0.1" value={local.tileOpacity} 
                  onChange={e => setLocal({ ...local, tileOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">Schriftart</label>
                <select 
                  value={local.fontFamily} 
                  onChange={e => setLocal({ ...local, fontFamily: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
                >
                  <option value="sans">Inter (Standard)</option>
                  <option value="space">Space Grotesk (Modern)</option>
                  <option value="outfit">Outfit (Clean)</option>
                  <option value="montserrat">Montserrat (Klassisch)</option>
                  <option value="serif">Playfair Display (Serif)</option>
                  <option value="mono">JetBrains Mono (Technisch)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">Schriftfarbe</label>
                <div className="flex gap-2 items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                  <input 
                    type="color" value={local.globalTextColor} 
                    onChange={e => setLocal({ ...local, globalTextColor: e.target.value })}
                    className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                  />
                  <span className="text-xs font-mono uppercase">{local.globalTextColor}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">3D Effekt</label>
                <select 
                  value={local.effect3D} 
                  onChange={e => setLocal({ ...local, effect3D: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
                >
                  <option value="none">Aus</option>
                  <option value="float-low">Leicht</option>
                  <option value="float-medium">Mittel</option>
                  <option value="float-high">Stark</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold opacity-60">Dashboard Hintergrund</label>
                <div className="flex gap-2">
                  <input 
                    type="text" value={local.dashboardBgImage} 
                    onChange={e => setLocal({ ...local, dashboardBgImage: e.target.value })}
                    placeholder="Bild URL oder wählen..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl border border-white/10 transition-all"
                  >
                    <Monitor size={20} />
                  </button>
                  <input 
                    type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" 
                  />
                </div>
                
                {local.dashboardBgImage && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase opacity-40">Anpassung</label>
                      <select 
                        value={local.dashboardBgImageFit || 'cover'} 
                        onChange={e => setLocal({ ...local, dashboardBgImageFit: e.target.value as any })}
                        className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="cover">Ausfüllen (Cover)</option>
                        <option value="contain">Einpassen (Contain)</option>
                        <option value="auto">Original (Auto)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase opacity-40">Position</label>
                      <select 
                        value={local.dashboardBgImagePosition || 'center'} 
                        onChange={e => setLocal({ ...local, dashboardBgImagePosition: e.target.value })}
                        className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="center">Mitte</option>
                        <option value="top">Oben</option>
                        <option value="bottom">Unten</option>
                        <option value="left">Links</option>
                        <option value="right">Rechts</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Kiosk Modus</span>
                  <span className="text-[10px] opacity-40">Navigationsleiste automatisch ausblenden</span>
                </div>
                <button 
                  onClick={() => setLocal({ ...local, isKioskMode: !local.isKioskMode })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    local.isKioskMode ? "bg-blue-500" : "bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    local.isKioskMode ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-12">
          <button 
            onClick={() => { onSave(local); onClose(); }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-3xl transition-all shadow-xl shadow-blue-500/20"
          >
            Speichern
          </button>
          <button 
            onClick={() => {
              if (confirm('Möchtest du alle Kacheln auf Standard zurücksetzen?')) {
                onResetTiles();
              }
            }}
            className="flex-1 bg-orange-500/20 text-orange-400 font-bold py-4 rounded-3xl transition-all"
          >
            Kacheln Reset
          </button>
          <button 
            onClick={() => {
              if (confirm('Möchtest du alle Design-Einstellungen auf Standard zurücksetzen?')) {
                setLocal(DEFAULT_CONFIG);
              }
            }}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold py-4 rounded-3xl transition-all"
          >
            Reset Design
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 font-bold py-4 rounded-3xl transition-all"
          >
            Abbrechen
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TileSettingsModal = ({ tile, onSave, onClose }: { tile: TileConfig; onSave: (u: Partial<TileConfig>) => void; onClose: () => void }) => {
  const [local, setLocal] = useState(tile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocal({ ...local, bgImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl text-white scrollbar-hide"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Kachel anpassen</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold opacity-60">Titel</label>
            <input 
              type="text" value={local.title} 
              onChange={e => setLocal({ ...local, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
            />
          </div>

          {local.type === 'app' && (
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-60">App URL / Deep Link (z.B. instagram://)</label>
              <input 
                type="text" value={local.appLink || ''} 
                onChange={e => setLocal({ ...local, appLink: e.target.value })}
                placeholder="https://... oder app://"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-60">Breite (Spalten)</label>
              <input 
                type="number" min="1" max="6" value={local.colSpan} 
                onChange={e => setLocal({ ...local, colSpan: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-60">Höhe (Zeilen)</label>
              <input 
                type="number" min="1" max="4" value={local.rowSpan} 
                onChange={e => setLocal({ ...local, rowSpan: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold opacity-60">Leucht-Effekt</label>
            <select 
              value={local.glowEffect} 
              onChange={e => setLocal({ ...local, glowEffect: e.target.value as any })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
            >
              <option value="none">Aus</option>
              <option value="pulse">Pulsieren</option>
              <option value="static">Statisch</option>
              <option value="rainbow">Regenbogen</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold opacity-60">Farbe</label>
            <input 
              type="color" value={local.glowColor || '#0071e3'} 
              onChange={e => setLocal({ ...local, glowColor: e.target.value })}
              className="w-full h-12 bg-transparent border-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold opacity-60">Hintergrundbild</label>
            <div className="flex gap-2">
              <input 
                type="text" value={local.bgImage || ''} 
                onChange={e => setLocal({ ...local, bgImage: e.target.value })}
                placeholder="URL oder Bild wählen..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl border border-white/10 transition-all"
                title="Bild vom Tablet wählen"
              >
                <Monitor size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            {local.bgImage && (
              <div className="space-y-4 mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="relative w-full h-24 rounded-xl overflow-hidden border border-white/10">
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      backgroundImage: `url(${local.bgImage})`,
                      backgroundSize: local.bgImageFit || 'cover',
                      backgroundPosition: local.bgImagePosition || 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                  <button 
                    onClick={() => setLocal({ ...local, bgImage: '' })}
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white z-10"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase opacity-40">Anpassung</label>
                    <select 
                      value={local.bgImageFit || 'cover'} 
                      onChange={e => setLocal({ ...local, bgImageFit: e.target.value as any })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="cover">Ausfüllen (Cover)</option>
                      <option value="contain">Einpassen (Contain)</option>
                      <option value="auto">Original (Auto)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase opacity-40">Position</label>
                    <select 
                      value={local.bgImagePosition || 'center'} 
                      onChange={e => setLocal({ ...local, bgImagePosition: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="center">Mitte</option>
                      <option value="top">Oben</option>
                      <option value="bottom">Unten</option>
                      <option value="left">Links</option>
                      <option value="right">Rechts</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold opacity-60">Hintergrund-Deckkraft</label>
              <span className="text-xs font-mono">{Math.round((local.opacity || 0.4) * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.1" 
              value={local.opacity || 0.4} 
              onChange={e => setLocal({ ...local, opacity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => onSave(local)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-2xl transition-all"
          >
            Speichern
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 font-bold py-3 rounded-2xl transition-all"
          >
            Abbrechen
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
