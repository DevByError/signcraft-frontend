
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { CanvasElement } from '../types/canvas';

interface WidgetProps {
  element: CanvasElement;
}

export const LiveClock: React.FC<WidgetProps> = ({ element }) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    const format = element.widgetSettings?.timeFormat || '12';
    const timezone = element.widgetSettings?.timezone;
    
    // Basic options
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit', // Always showing seconds for live feel for now, or could use showSeconds setting
        hour12: format !== '24'
    };

    if (timezone) {
        try {
            // Check if timezone is valid
            Intl.DateTimeFormat(undefined, { timeZone: timezone });
            options.timeZone = timezone;
        } catch (e) {
            console.warn('Invalid timezone:', timezone);
        }
    }

    return time.toLocaleTimeString([], options);
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{
        backgroundColor: element.backgroundColor || '#1e293b',
        color: element.color || '#f1f5f9',
      }}
    >
      <Clock className="opacity-50" size={Math.min(element.fontSize || 24, 32)} />
      <div
        className="font-bold font-mono"
        style={{ fontSize: element.fontSize || 24 }}
      >
        {formatTime()}
      </div>
      {/* Optional Date display if we want to add later */}
      {/* <div className="text-xs opacity-75">{time.toLocaleDateString()}</div> */}
    </div>
  );
};

export const LiveTimer: React.FC<WidgetProps> = ({ element }) => {
  const [display, setDisplay] = useState('00:00:00');
  
  // Timer Settings
  const timerType = element.widgetSettings?.timerType || 'countdown';
  const countdownTo = element.widgetSettings?.countdownTo;
  
  useEffect(() => {
    // If countdown and no target, show dashes
    if (timerType === 'countdown' && !countdownTo) {
        setDisplay('--:--:--');
        return;
    }

    const updateTimer = () => {
        const now = new Date();
        let diffMs = 0;

        if (timerType === 'countdown' && countdownTo) {
            const target = new Date(countdownTo);
            diffMs = target.getTime() - now.getTime();
            if (diffMs < 0) diffMs = 0;
        } else if (timerType === 'countup' || timerType === 'stopwatch') {
            // For countup, ideally we need a startTime.
            // If stored in element, use it. If not, maybe use element.uploadedAt or just session start?
            // For now, let's look for a specialized start time prop or default to session
            // A clearer behavior for "Count Up" in signage is usually "Time since X".
            // If no X is provided, maybe it's just a visual demo.
            // Let's rely on 'countdownTo' property being used as 'countFrom' if type is countup?
            // That's a common pattern to reuse the date picker.
            if (countdownTo) {
                const start = new Date(countdownTo);
                diffMs = now.getTime() - start.getTime();
                if (diffMs < 0) diffMs = 0;
            } else {
                 // Fallback: just show 0 if no start time set
                 diffMs = 0;
            }
        }

        // Format
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (n: number) => n.toString().padStart(2, '0');
        setDisplay(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer(); // Initial call
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [timerType, countdownTo]);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{
        backgroundColor: element.backgroundColor || '#dc2626',
        color: element.color || '#ffffff',
      }}
    >
      <Clock className="opacity-75" size={Math.min(element.fontSize || 24, 32)} />
      <div
        className="font-bold font-mono"
        style={{ fontSize: element.fontSize || 32 }}
      >
        {display}
      </div>
      {(timerType === 'countdown' && !countdownTo) && (
        <div className="text-xs opacity-75">Set target time</div>
      )}
    </div>
  );
};

export const LiveSlideshow: React.FC<WidgetProps & { style?: React.CSSProperties, className?: string }> = ({ element, style, className }) => {
  const [index, setIndex] = useState(0);
  const images = element.content ? element.content.split(',') : [];
  const duration = (element.widgetSettings?.slideDuration || 5) * 1000;

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length);
    }, duration);
    return () => clearInterval(interval);
  }, [images.length, duration]);

  if (!images.length) return <div style={style} className={`${className} bg-gray-200 flex items-center justify-center`}>No Images</div>;

  return (
    <img
      src={images[index]}
      alt="Slideshow"
      className={className}
      style={{
        ...style,
        objectFit: (element.widgetSettings?.fitMode as any) || 'cover'
      }}
    />
  );
};

export const LiveRSS: React.FC<WidgetProps & { style?: React.CSSProperties, className?: string }> = ({ element, style, className }) => {
    // Mock items
    const items = [
        "SignCraft: Design Digital Signage Anywhere",
        "News: Market Hits Record Highs",
        "Weather: Storm Warning in Effect for West Coast",
        "Sports: Championship Finals Tonight at 8 PM"
    ];

    const isScrolling = element.widgetSettings?.displayMode === 'scroll';
    const speedMap: Record<string, number> = { 'slow': 30, 'medium': 20, 'fast': 10 };
    const speed = speedMap[element.widgetSettings?.scrollSpeed || 'medium'] || 20;

    return (
        <div className={className} style={{ ...style, backgroundColor: element.backgroundColor || '#fff', overflow: 'hidden', whiteSpace: 'nowrap' }}>
             {isScrolling ? (
                 <div style={{
                     display: 'inline-block',
                     animation: `marquee ${speed}s linear infinite`,
                     paddingLeft: '100%'
                 }}>
                     {items.map((item, i) => (
                         <span key={i} className="mx-8 text-lg font-medium inline-block">• {item}</span>
                     ))}
                 </div>
             ) : (
                <div className="p-4 overflow-y-auto w-full h-full">
                    <h3 className="font-bold border-b mb-2 sticky top-0 bg-[#fff]">RSS Feed</h3>
                    <div className="space-y-2">
                         {items.map((item, i) => <p key={i} className="text-sm border-b pb-1">{item}</p>)}
                    </div>
                </div>
             )}
             <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
             `}</style>
        </div>
    );
};
