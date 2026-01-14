import React, { useEffect, useRef } from 'react';
import {
    CloudSun, Clock, ImageIcon, FileText, MousePointer2
} from 'lucide-react';
import { LiveClock, LiveTimer, LiveSlideshow, LiveRSS } from './LiveWidgets'; // Ensure path is correct
// If you don't have types/canvas, you can use 'any' or define interface here
import { CanvasElement } from '../types/canvas';

// ==========================================
// 1. HELPERS (Moved from Preview)
// ==========================================

export const getAnimationClass = (animation?: string) => {
    if (!animation) return '';
    const animationMap: Record<string, string> = {
        'Shake Zoom': 'animate-shake-zoom', 'Whip Slide': 'animate-whip-slide', 'Old TV': 'animate-old-tv', 'Chroma Wave': 'animate-chroma-wave',
        'Brush': 'animate-brush', 'Ink': 'animate-ink', 'Digital': 'animate-digital', 'Spray Paint': 'animate-spray-paint', 'Sketch': 'animate-sketch', 'Gradient': 'animate-gradient',
        'Rise': 'animate-rise', 'Pan': 'animate-pan', 'Fade': 'animate-fade', 'Pop': 'animate-pop', 'Wipe': 'animate-wipe', 'Blur': 'animate-blur',
        'Succession': 'animate-succession', 'Breathe': 'animate-breathe', 'Baseline': 'animate-baseline', 'Drift': 'animate-drift', 'Tectonic': 'animate-tectonic',
        'Tumble': 'animate-tumble', 'Neon': 'animate-neon', 'Scrapbook': 'animate-scrapbook', 'Stomp': 'animate-stomp',
        'Rotate': 'animate-rotate-effect', 'Flicker': 'animate-flicker', 'Pulse': 'animate-pulse-effect', 'Wiggle': 'animate-wiggle-effect',
    };
    return animationMap[animation] || '';
};

export const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/, /youtube\.com\/embed\/([^&\s]+)/, /^([a-zA-Z0-9_-]{11})$/];
    const match = patterns.reduce<RegExpMatchArray | null>((acc, pattern) => acc || url.match(pattern), null);
    return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=0&loop=1` : null;
};

// ==========================================
// 2. SYNCED VIDEO COMPONENT
// ==========================================
export const SyncedPreviewVideo = ({
    src,
    currentTime,
    isPlaying,
    startTime,
    duration,
    inPoint = 0,
    style,
    className
}: any) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        // Calculate relative time
        const relativeTimeMs = currentTime - startTime + inPoint;
        const relativeTimeSec = relativeTimeMs / 1000;
        const isInsideClip = relativeTimeMs >= 0 && relativeTimeMs < duration;

        if (isInsideClip) {
            if (Math.abs(video.currentTime - relativeTimeSec) > 0.15) {
                video.currentTime = relativeTimeSec;
            }
            if (isPlaying) {
                if (video.paused) video.play().catch(() => { });
            } else {
                video.pause();
            }
            video.style.opacity = '1';
        } else {
            video.pause();
            if (relativeTimeMs < 0) video.currentTime = inPoint / 1000;
        }
    }, [currentTime, isPlaying, startTime, duration, inPoint, src]);

    return (
        <video
            ref={videoRef}
            src={src}
            className={className}
            style={style}
            muted={false}
            playsInline
        />
    );
};

// ==========================================
// 3. MAIN RENDERER COMPONENT
// ==========================================

interface ElementRendererProps {
    element: any; // Using 'any' to ensure compatibility with both files, or use CanvasElement
    currentTime: number;
    isPlaying: boolean;
    scale?: number;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({ element: activeElement, currentTime, isPlaying }) => {

    if (!activeElement) return null;

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${activeElement.x}px`,
        top: `${activeElement.y}px`,
        width: `${activeElement.width}px`,
        height: `${activeElement.height}px`,
        opacity: activeElement.opacity,
        transform: `rotate(${activeElement.rotation}deg)`,
        zIndex: activeElement.zIndex,
        borderRadius: activeElement.borderRadius ? `${activeElement.borderRadius}px` : undefined,
        overflow: 'hidden',
        // We assume the parent handles the 'willChange' optimization if needed
    };

    const animClass = getAnimationClass(activeElement.animation);

    switch (activeElement.type) {
        // 1. Text & Basic
        case 'text':
        case 'label':
            return (
                <div key={activeElement.id} className={animClass} style={{
                    ...style,
                    color: activeElement.color,
                    backgroundColor: activeElement.backgroundColor,
                    fontSize: activeElement.fontSize,
                    fontWeight: activeElement.textStyle?.bold ? 'bold' : 'normal',
                    fontStyle: activeElement.textStyle?.italic ? 'italic' : 'normal',
                    textDecoration: activeElement.textStyle?.underline ? 'underline' : 'none',
                    fontFamily: activeElement.textStyle?.fontFamily || 'Arial',
                    textAlign: activeElement.textStyle?.textAlign || 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                    {activeElement.content}
                </div>
            );

        // 2. Images
        case 'image':
        case 'gif':
        case 'web_image':
            return (
                <img key={activeElement.id} src={activeElement.content} className={animClass} style={{ ...style, objectFit: activeElement.widgetSettings?.fitMode || 'cover' }} alt="" />
            );

        // 3. Videos (Timeline Synced)
        case 'video':
        case 'web_video':
            if (activeElement._syncData) {
                return (
                    <SyncedPreviewVideo
                        key={activeElement.id}
                        src={activeElement.content}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        startTime={activeElement._syncData.startTime}
                        duration={activeElement._syncData.duration}
                        inPoint={activeElement._syncData.inPoint}
                        className={animClass}
                        style={{ ...style, objectFit: 'cover' }}
                    />
                );
            }
            return <video key={activeElement.id} src={activeElement.content} className={animClass} style={{ ...style, objectFit: 'cover' }} muted loop autoPlay playsInline />;

        case 'youtube':
            const ytUrl = getYouTubeEmbedUrl(activeElement.content);
            return ytUrl ? (
                <iframe key={activeElement.id} src={ytUrl} className={animClass} style={{ ...style, border: 'none' }} allow="autoplay; encrypted-media" />
            ) : <div style={{ ...style, background: 'black' }} />;

        // 4. Shapes (SVG) - EXTENDED LIST
        case 'rect': return <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.fillColor, border: `${activeElement.strokeWidth}px solid ${activeElement.strokeColor}` }} />;
        case 'circle': return <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.fillColor, borderRadius: '50%', border: `${activeElement.strokeWidth}px solid ${activeElement.strokeColor}` }} />;
        case 'line': return <div key={activeElement.id} style={{ ...style, backgroundColor: activeElement.fillColor, height: '4px' }} className={animClass} />;

        // SVG Shapes
        case 'triangle': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 90,85 10,85" fill={activeElement.fillColor} stroke={activeElement.strokeColor} strokeWidth={activeElement.strokeWidth} /></svg>;
        case 'diamond': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 90,50 50,90 10,50" fill={activeElement.fillColor} stroke={activeElement.strokeColor} strokeWidth={activeElement.strokeWidth} /></svg>;
        case 'pentagon': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 90,35 75,85 25,85 10,35" fill={activeElement.fillColor} stroke={activeElement.strokeColor} strokeWidth={activeElement.strokeWidth} /></svg>;
        case 'hexagon': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill={activeElement.fillColor} stroke={activeElement.strokeColor} strokeWidth={activeElement.strokeWidth} /></svg>;
        case 'octagon': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" fill={activeElement.fillColor} stroke={activeElement.strokeColor} strokeWidth={activeElement.strokeWidth} /></svg>;
        case 'trapezoid': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="25,20 75,20 85,80 15,80" fill={activeElement.fillColor} stroke={activeElement.strokeColor} strokeWidth={activeElement.strokeWidth} /></svg>;
        case 'star': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="50,10 61,40 91,40 67,60 78,90 50,70 22,90 33,60 9,40 39,40" fill={activeElement.fillColor} stroke={activeElement.strokeColor} strokeWidth={activeElement.strokeWidth} /></svg>;
        case 'heart': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><path d="M50,85 C25,70 10,55 10,40 C10,25 20,15 30,15 C40,15 50,25 50,25 C50,25 60,15 70,15 C80,15 90,25 90,40 C90,55 75,70 50,85 Z" fill={activeElement.fillColor} stroke={activeElement.strokeColor} strokeWidth={activeElement.strokeWidth} /></svg>;
        case 'crescent': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><path d="M 50 20 A 30 30 0 0 1 50 80 A 24 24 0 0 0 50 26 A 24 24 0 0 0 50 20 Z" fill={activeElement.fillColor} stroke={activeElement.strokeColor} strokeWidth={activeElement.strokeWidth} /></svg>;
        case 'cross': return <svg key={activeElement.id} viewBox="0 0 100 100" style={style} className={animClass}><polygon points="40,10 60,10 60,40 90,40 90,60 60,60 60,90 40,90 40,60 10,60 10,40 40,40" fill={activeElement.fillColor} stroke={activeElement.strokeColor} strokeWidth={activeElement.strokeWidth} /></svg>;

        // 5. Widgets
        case 'ticker':
            return (
                <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.backgroundColor || '#1e293b', color: activeElement.color || '#fff', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <div className="animate-marquee px-4" style={{ fontSize: activeElement.fontSize }}>{activeElement.content}</div>
                </div>
            );

        case 'weather':
            return (
                <div key={activeElement.id} className={animClass} style={{ ...style, background: 'linear-gradient(to bottom right, #38bdf8, #3b82f6)', color: 'white', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <CloudSun size={48} className="mb-2" />
                    <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{activeElement.widgetSettings?.temperature || '72'}°{activeElement.widgetSettings?.temperatureUnit || 'F'}</div>
                    <div style={{ fontSize: '1.2em' }}>{activeElement.widgetSettings?.condition || 'Sunny'}</div>
                    <div style={{ opacity: 0.8 }}>{activeElement.widgetSettings?.location || 'New York, NY'}</div>
                </div>
            );

        case 'clock':
            return (
                <div key={activeElement.id} className={animClass} style={style}>
                    <LiveClock element={activeElement as any} />
                </div>
            );

        case 'timer':
            return (
                <div key={activeElement.id} className={animClass} style={style}>
                    <LiveTimer element={activeElement as any} />
                </div>
            );

        case 'calendar':
            const dateStr = activeElement.widgetSettings?.selectedDate || new Date().toISOString().split('T')[0];
            const displayDate = new Date(dateStr);
            const currentDate = new Date();
            const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
            const firstDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();

            return (
                <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: 'white', padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                        {displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', flex: 1, fontSize: '12px' }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div key={i} style={{ textAlign: 'center', fontWeight: 'bold', color: '#4b5563' }}>{day}</div>
                        ))}
                        {Array.from({ length: firstDay }, () => null).map((_, i) => (
                            <div key={`empty-${i}`} style={{ textAlign: 'center', padding: '4px' }}></div>
                        ))}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const isSelected = displayDate.getDate() === day &&
                                displayDate.getMonth() === currentDate.getMonth() &&
                                displayDate.getFullYear() === currentDate.getFullYear();
                            return (
                                <div
                                    key={day}
                                    style={{
                                        textAlign: 'center',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        backgroundColor: isSelected ? '#22c55e' : 'transparent',
                                        color: isSelected ? 'white' : '#374151',
                                        fontWeight: isSelected ? 'bold' : 'normal'
                                    }}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );

        case 'slideshow':
            return <LiveSlideshow key={activeElement.id} element={activeElement as any} className={animClass} style={style} />;

        case 'rss':
            return <LiveRSS key={activeElement.id} element={activeElement as any} className={animClass} style={style} />;

        case 'embed':
        case 'html':
        case 'sub_creative':
            return activeElement.type === 'html' ? (
                <div key={activeElement.id} className={animClass} style={{ ...style, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: activeElement.content }} />
            ) : (
                <iframe
                    key={activeElement.id}
                    src={activeElement.type === 'sub_creative' ? activeElement.content : undefined}
                    srcDoc={activeElement.type === 'embed' ? activeElement.content : undefined}
                    className={animClass}
                    style={{ ...style, border: 'none' }}
                    title="Embed"
                />
            );

        default:
            return <div key={activeElement.id} className={animClass} style={{ ...style, backgroundColor: activeElement.fillColor || activeElement.backgroundColor || '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeElement.content}</div>;
    }
};