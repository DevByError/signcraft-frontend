import React, { useState, useEffect, useRef } from 'react';
import PlaylistPreview from './PlaylistPreview';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Search, AlertCircle, Wifi, WifiOff,
  MapPin, X, Monitor, Zap, Play, Radio, Edit2
} from 'lucide-react';

// Services
import {
  getUserScreens,
  createScreen,
  deleteScreen,
  updateScreenStatus,
  ScreenDocument
} from '../services/screenService';
import { getUserPlaylists, getPlaylistById, PlaylistDocument } from '../services/playlistService';
import { getDesignById } from '../services/designService';
import websocketService, { WebSocketMessage } from '../services/websocketService';
import { blobToBase64 } from '../utils/animationHelpers';

interface Screen extends Omit<ScreenDocument, 'lastSeen'> {
  lastSeen: string;
}

const ScheduleScreen: React.FC = () => {
  const navigate = useNavigate();

  // For offscreen playlist preview
  const [offscreenPlaylistId, setOffscreenPlaylistId] = useState<string | null>(null);
  const offscreenPreviewRef = useRef<HTMLDivElement>(null);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [screens, setScreens] = useState<Screen[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistDocument[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [realtimeUpdates, setRealtimeUpdates] = useState<string[]>([]);
  const [connectedSocketClients, setConnectedSocketClients] = useState<any[]>([]);

  // Create form state
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenLocation, setNewScreenLocation] = useState('');
  const [newScreenResolution, setNewScreenResolution] = useState('1920x1080');
  const [newScreenIP, setNewScreenIP] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');

  // 1. Fetch Initial Data from Firebase
  const refreshData = async () => {
    try {
      setLoading(true);
      const [screensData, playlistsData] = await Promise.all([
        getUserScreens(100),
        getUserPlaylists(100)
      ]);

      setPlaylists(playlistsData);
      // Attach playlistName to each screen if playlistId exists
      setScreens(screensData.map(screen => ({
        ...screen,
        lastSeen: screen.lastSeen.toDate().toISOString(),
        playlistName: screen.playlistId ? (playlistsData.find(p => p.id === screen.playlistId)?.name || undefined) : undefined,
      })));
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError('Failed to load screens and playlists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // 2. Handle WebSocket Events
  useEffect(() => {
    if (websocketService.isWsConnected) {
      setWsConnected(true);
    }

    const unsubscribe = websocketService.subscribe((message: WebSocketMessage) => {
      if (message.type === 'heartbeat') setWsConnected(true);

      if (message.type === 'clients-updated') {
        setConnectedSocketClients(message.data || []);
      }

      if (message.type === 'screen_status_update' && message.screenId) {
        setScreens(prev => prev.map(s =>
          (s.screenId === message.screenId || s.id === message.screenId)
            ? { ...s, status: message.data?.status || s.status }
            : s
        ));

        if (message.data?.status) {
          updateScreenStatus(message.screenId, message.data.status);
        }

        setRealtimeUpdates(prev => [
          `Screen ${message.screenId} is now ${message.data?.status}`,
          ...prev.slice(0, 4)
        ]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 3. Podcast Logic (Always export design as video and send base64)
  // Refactored: Only use onCanvasReady callback for export
  // Reverted: Send playlist design JSON to Flutter/Android client
  const handlePodcast = async (screen: Screen) => {
    if (!screen.playlistId) {
      alert("No playlist assigned.");
      return;
    }
    setRealtimeUpdates(prev => [`Preparing playlist JSON for export...`, ...prev.slice(0, 4)]);
    try {
      const playlist = await getPlaylistById(screen.playlistId);
      if (!playlist) {
        setRealtimeUpdates(prev => [
          '❌ Playlist not found for export.',
          ...prev.slice(0, 4)
        ]);
        alert('Playlist not found.');
        return;
      }
      // Fetch all designs referenced in the playlist
      const designRefs = playlist.designReferences || [];
      const fullDesigns = [];
      for (const ref of designRefs) {
        const design = await getDesignById(ref.designId);
        if (design) {
          fullDesigns.push({
            ...ref,
            designJSON: design.designJSON,
            metadata: {
              ...design.metadata,
              canvasWidth: design.metadata?.canvasWidth ?? 1280,
              canvasHeight: design.metadata?.canvasHeight ?? 720,
              canvasColor: design.metadata?.canvasColor ?? '#ffffff'
            }
          });
        }
      }
      // Compose new playlist object with full designs
      const playlistWithDesigns = {
        ...playlist,
        designReferences: fullDesigns,
      };
      const payload: any = {
        type: 'playlist-json',
        content: JSON.stringify(playlistWithDesigns),
        encoding: 'json',
        fileName: `${playlist.name || 'playlist'}.json`,
        name: playlist.name || "Playlist JSON"
      };
      websocketService.emitDeploymentRequest(screen.screenId, payload as any);
      setRealtimeUpdates(prev => [`🚀 Playlist JSON exported and shared to ${screen.name}`, ...prev.slice(0, 4)]);
    } catch (err) {
      setRealtimeUpdates(prev => [
        '❌ Playlist JSON export failed.',
        ...prev.slice(0, 4)
      ]);
      console.error("❌ Playlist JSON export failed:", err);
      alert("Playlist JSON export failed. Check browser console (F12).");
    }
  };
  {/* Offscreen hidden playlist preview for video export */ }
  {
    null // No hidden preview needed for JSON export
  }

  // 4. Global Broadcast
  const handleBroadcastAll = () => {
    const mediaPayload = {
      type: 'youtube',
      content: "https://youtu.be/aqz-KE-bpKQ",
      width: 1280,
      height: 720,
      name: "Global Announcement"
    };
    websocketService.broadcastToAll(mediaPayload);
    setRealtimeUpdates(prev => [`📡 Global broadcast sent`, ...prev.slice(0, 4)]);
  };

  // 5. Create Screen Logic
  const handleCreateScreen = async () => {
    if (!newScreenName.trim() || !newScreenLocation.trim()) {
      alert('Please fill in required fields');
      return;
    }

    const result = await createScreen(
      newScreenName,
      newScreenLocation,
      newScreenResolution,
      newScreenIP,
      selectedPlaylistId || undefined
    );

    if (result.success) {
      setShowCreateModal(false);
      refreshData();
      setNewScreenName('');
      setNewScreenLocation('');
    } else {
      alert(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Delete this screen?`)) {
      const result = await deleteScreen(id);
      if (result.success) refreshData();
    }
  };

  const formatLastSeen = (date: string) => {
    const diffMins = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const filteredScreens = screens.filter(screen => {
    const matchesSearch = screen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      screen.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || screen.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const onlineCount = screens.filter(s => s.status === 'online').length;
  const offlineCount = screens.filter(s => s.status === 'offline').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-primary hover:text-primaryLight mb-4 font-semibold">
            <ArrowLeft size={20} /> Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Display Screens</h1>
              <div className="flex items-center gap-3">
                <p className="text-gray-600">Manage your digital display network</p>
                {wsConnected && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-green-700">Socket Live</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBroadcastAll}
                className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-bold shadow-lg"
              >
                <Radio size={20} className="animate-pulse" />
                Broadcast to All
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
              >
                <Plus size={20} />
                Add Screen
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
            <p className="text-gray-600 text-sm font-semibold">Total Screens</p>
            <p className="text-4xl font-bold text-gray-900">{screens.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-semibold">Online</p>
            <p className="text-4xl font-bold text-green-600">{onlineCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-semibold">Offline</p>
            <p className="text-4xl font-bold text-red-600">{offlineCount}</p>
          </div>
        </div>

        {realtimeUpdates.length > 0 && (
          <div className="bg-blue-900 text-white rounded-xl p-4 mb-8 shadow-inner overflow-hidden relative">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-sm tracking-wider uppercase">Live System Feed</span>
            </div>
            <div className="space-y-1">
              {realtimeUpdates.map((u, i) => (
                <div key={i} className="text-sm opacity-90 animate-fade-in flex items-center gap-2">
                  <span className="text-blue-400 font-mono text-xs">[{new Date().toLocaleTimeString()}]</span>
                  {u}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-8 flex-col md:flex-row items-start md:items-center">
          <div className="flex-1 w-full relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            {['all', 'online', 'offline'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-6 py-2 rounded-lg font-bold capitalize transition-all ${filterStatus === status ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Screen Info</th>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Device ID</th>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Playlist</th>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Last Seen</th>
                <th className="px-6 py-5 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredScreens.map(screen => {
                const isPhysicallyConnected = connectedSocketClients.some(c => c.screenId === screen.screenId);

                return (
                  <tr key={screen.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900">{screen.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {screen.location}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-primary font-bold">
                        {screen.screenId}
                      </code>
                    </td>
                    <td className="px-6 py-5">
                      {screen.playlistName ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-lg text-xs border border-blue-200">
                          {screen.playlistName}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">No Playlist</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${isPhysicallyConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span className={`text-sm font-bold ${isPhysicallyConnected ? 'text-green-600' : 'text-gray-400'}`}>
                          {isPhysicallyConnected ? 'LIVE' : 'OFFLINE'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-500">
                      {formatLastSeen(screen.lastSeen)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handlePodcast(screen)}
                          disabled={!isPhysicallyConnected}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${isPhysicallyConnected
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                          <Play size={14} fill="currentColor" /> Podcast
                        </button>
                        <button onClick={() => handleDelete(screen.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl">
                  <Monitor size={24} className="text-primary" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Configure Screen</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Screen Name *</label>
                <input type="text" value={newScreenName} onChange={(e) => setNewScreenName(e.target.value)} placeholder="e.g., Entrance Kiosk" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Physical Location *</label>
                <input type="text" value={newScreenLocation} onChange={(e) => setNewScreenLocation(e.target.value)} placeholder="e.g., Main Hallway" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Initial Playlist</label>
                <select value={selectedPlaylistId} onChange={(e) => setSelectedPlaylistId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary">
                  <option value="">None (Setup Later)</option>
                  {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t flex gap-3 justify-end">
              <button onClick={() => setShowCreateModal(false)} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={handleCreateScreen} className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform">Save Screen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleScreen;