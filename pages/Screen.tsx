import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Search, AlertCircle, Wifi, WifiOff, MapPin, X, Monitor, Zap } from 'lucide-react';
import {
  getUserScreens,
  createScreen,
  deleteScreen,
  assignPlaylistToScreen,
  updateScreenStatus,
  ScreenDocument
} from '../services/screenService';
import { getUserPlaylists, PlaylistDocument } from '../services/playlistService';
import websocketService, { WebSocketMessage } from '../services/websocketService';

interface Screen {
  id: string;
  screenId: string;
  name: string;
  location: string;
  resolution: string;
  status: 'online' | 'offline';
  lastSeen: string;
  ipAddress: string;
  playlistId?: string;
  playlistName?: string;
}

const ScheduleScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [realtimeUpdates, setRealtimeUpdates] = useState<string[]>([]);

  const [screens, setScreens] = useState<Screen[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistDocument[]>([]);

  // Create form state
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenLocation, setNewScreenLocation] = useState('');
  const [newScreenResolution, setNewScreenResolution] = useState('1920x1080');
  const [newScreenIP, setNewScreenIP] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');

  // Fetch screens and playlists from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📺 [SCREEN] Fetching screens and playlists from Firebase...');

        // Fetch screens
        const screensData = await getUserScreens(100);
        console.log(`✅ [SCREEN] Fetched ${screensData.length} screens`);

        // Fetch playlists for selection
        const playlistsData = await getUserPlaylists(100);
        console.log(`✅ [SCREEN] Fetched ${playlistsData.length} playlists`);

        setPlaylists(playlistsData);

        // Convert to UI format
        const screenItems: Screen[] = screensData.map(screen => ({
          id: screen.id,
          screenId: screen.screenId,
          name: screen.name,
          location: screen.location,
          resolution: screen.resolution,
          status: screen.status,
          lastSeen: screen.lastSeen.toDate().toISOString(),
          ipAddress: screen.ipAddress,
          playlistId: screen.playlistId,
          playlistName: screen.playlistName,
        }));

        setScreens(screenItems);
      } catch (err) {
        console.error('❌ [SCREEN] Error fetching data:', err);
        setError(`Failed to load screens: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setScreens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // WebSocket connection and real-time updates
  useEffect(() => {
    console.log('🔌 [SCREEN] Setting up WebSocket...');

    // Subscribe to WebSocket messages
    const unsubscribe = websocketService.subscribe((message: WebSocketMessage) => {
      console.log('📨 [SCREEN] WebSocket message:', message);

      // Update connection status
      if (message.type === 'heartbeat') {
        setWsConnected(true);
      }

      // Handle screen status updates
      if (message.type === 'screen_status_update' && message.screenId) {
        setScreens(prevScreens =>
          prevScreens.map(screen => {
            if (screen.screenId === message.screenId || screen.id === message.screenId) {
              const newStatus = message.data?.status || screen.status;

              // Add to realtime updates feed
              setRealtimeUpdates(prev => [
                `${screen.name} is now ${newStatus}`,
                ...prev.slice(0, 4) // Keep last 5 updates
              ]);

              return {
                ...screen,
                status: newStatus,
                lastSeen: new Date().toISOString(),
              };
            }
            return screen;
          })
        );

        // Update Firebase
        if (message.screenId && message.data?.status) {
          updateScreenStatus(message.screenId, message.data.status);
        }
      }

      // Handle screen connected
      if (message.type === 'screen_connected' && message.screenCustomId) {
        setRealtimeUpdates(prev => [
          `Screen ${message.screenCustomId} connected`,
          ...prev.slice(0, 4)
        ]);
      }

      // Handle screen disconnected
      if (message.type === 'screen_disconnected' && message.screenCustomId) {
        setRealtimeUpdates(prev => [
          `Screen ${message.screenCustomId} disconnected`,
          ...prev.slice(0, 4)
        ]);
      }

      // Handle playlist assigned
      if (message.type === 'playlist_assigned' && message.screenId) {
        setScreens(prevScreens =>
          prevScreens.map(screen => {
            if (screen.id === message.screenId) {
              setRealtimeUpdates(prev => [
                `Playlist "${message.data?.playlistName}" assigned to ${screen.name}`,
                ...prev.slice(0, 4)
              ]);

              return {
                ...screen,
                playlistId: message.data?.playlistId,
                playlistName: message.data?.playlistName,
              };
            }
            return screen;
          })
        );
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 [SCREEN] Cleaning up WebSocket subscription');
      unsubscribe();
    };
  }, []);

  const filteredScreens = screens.filter(screen => {
    const matchesSearch = screen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      screen.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || screen.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const onlineCount = screens.filter(s => s.status === 'online').length;
  const offlineCount = screens.filter(s => s.status === 'offline').length;

  const handleCreateScreen = async () => {
    if (!newScreenName.trim()) {
      alert('Please enter a screen name');
      return;
    }
    if (!newScreenLocation.trim()) {
      alert('Please enter a location');
      return;
    }

    // Check for selected playlist
    if (!selectedPlaylistId.trim()) {
      alert('Please select a playlist to assign for immediate deployment.');
      return;
    }

    try {
      console.log('📺 [SCREEN] Creating new screen:', newScreenName);

      const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

      const result = await createScreen(
        newScreenName,
        newScreenLocation,
        newScreenResolution,
        newScreenIP,
        selectedPlaylistId, // Now required to deploy
        selectedPlaylist?.name || undefined
      );

      if (result.success && result.screenId) {
        console.log('✅ [SCREEN] Created successfully:', result.screenId);

        // --- DEPLOYMENT LOGIC START ---
        const createdScreenId = screenItems[screenItems.length - 1]?.screenId || 'scr01'; // Get the generated scrXX ID

        // 1. Send the deployment request via Socket.IO
        websocketService.emitDeploymentRequest(
          createdScreenId, // The ID the Android screen will join (e.g., 'scr01')
          selectedPlaylistId
        );
        console.log(`🚀 [DEPLOY] Triggered deployment request for ${createdScreenId} with Playlist ${selectedPlaylistId}`);
        // --- DEPLOYMENT LOGIC END ---

        // Refresh screens list (remaining logic)
        const screensData = await getUserScreens(100);
        const screenItems: Screen[] = screensData.map(screen => ({
          id: screen.id,
          screenId: screen.screenId, // The auto-generated ID (e.g., scr01)
          name: screen.name,
          location: screen.location,
          resolution: screen.resolution,
          status: screen.status,
          lastSeen: screen.lastSeen.toDate().toISOString(),
          ipAddress: screen.ipAddress,
          playlistId: screen.playlistId,
          playlistName: screen.playlistName,
        }));
        setScreens(screenItems);

        // Reset form and close modal
        setNewScreenName('');
        setNewScreenLocation('');
        setNewScreenResolution('1920x1080');
        setNewScreenIP('');
        setSelectedPlaylistId('');
        setShowCreateModal(false);

        // Notify via WebSocket (existing logic)
        websocketService.notifyScreenCreated(
          result.screenId,
          createdScreenId
        );
      } else {
        console.error('❌ [SCREEN] Failed to create:', result.error);
        setError(result.error || 'Failed to create screen');
      }
    } catch (err) {
      console.error('❌ [SCREEN] Error creating screen:', err);
      setError('Failed to create screen');
    }
  };

  const handleDelete = async (id: string) => {
    const screenName = screens.find(s => s.id === id)?.name || 'this screen';

    if (window.confirm(`Are you sure you want to delete "${screenName}"? This action cannot be undone.`)) {
      try {
        console.log('🗑️ [SCREEN] Deleting screen:', id);
        const result = await deleteScreen(id);

        if (result.success) {
          setScreens(prev => prev.filter(s => s.id !== id));
          console.log('✅ [SCREEN] Deleted successfully');

          // Notify via WebSocket
          websocketService.notifyScreenDeleted(id);
        } else {
          console.error('❌ [SCREEN] Failed to delete:', result.error);
          setError(result.error || 'Failed to delete screen');
        }
      } catch (err) {
        console.error('❌ [SCREEN] Error deleting:', err);
        setError('Failed to delete screen');
      }
    }
  };

  // Simulate screen status change (for testing)
  const handleSimulateStatusChange = (screenId: string, currentStatus: 'online' | 'offline') => {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    websocketService.notifyScreenStatusUpdate(screenId, newStatus);
  };

  const formatLastSeen = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-primary hover:text-primaryLight mb-4 transition-colors font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Display Screens</h1>
              <div className="flex items-center gap-3">
                <p className="text-gray-600">Manage your digital display network</p>
                {wsConnected && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-green-700">Live Updates Active</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
            >
              <Plus size={20} />
              Add Screen
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Screens</p>
                <p className="text-4xl font-bold text-gray-900">{screens.length}</p>
              </div>
              <MapPin size={40} className="text-primary/20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Online</p>
                <p className="text-4xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <Wifi size={40} className="text-green-500/20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Offline</p>
                <p className="text-4xl font-bold text-red-600">{offlineCount}</p>
              </div>
              <WifiOff size={40} className="text-red-500/20" />
            </div>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        {realtimeUpdates.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={20} className="text-blue-600" />
              <h3 className="font-semibold text-blue-900">Live Activity</h3>
            </div>
            <div className="space-y-2">
              {realtimeUpdates.map((update, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-blue-800 animate-fade-in"
                >
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>{update}</span>
                  <span className="text-blue-500 text-xs ml-auto">just now</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex gap-4 mb-8 flex-col md:flex-row items-start md:items-center">
          <div className="flex-1 w-full relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search screens by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-300">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${filterStatus === 'all'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:text-primary'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('online')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${filterStatus === 'online'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:text-green-600'
                }`}
            >
              Online
            </button>
            <button
              onClick={() => setFilterStatus('offline')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${filterStatus === 'offline'
                ? 'bg-red-600 text-white'
                : 'text-gray-600 hover:text-red-600'
                }`}
            >
              Offline
            </button>
          </div>
        </div>

        {/* Screens Display */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading screens...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Error Loading Screens</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
            >
              Retry
            </button>
          </div>
        ) : filteredScreens.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {screens.length === 0 ? 'No Screens Yet' : 'No Match Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {screens.length === 0
                ? 'Add your first display screen to get started'
                : 'Try a different search term or filter'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Screen Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">IP Address</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Resolution</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Current Playlist</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Last Seen</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScreens.map(screen => (
                  <tr key={screen.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{screen.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        {screen.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{screen.ipAddress}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{screen.resolution}</td>
                    <td className="px-6 py-4 text-sm">
                      {screen.playlistName ? (
                        <span className="px-3 py-1 bg-primary/10 text-primary font-semibold rounded-full text-xs">
                          {screen.playlistName}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {screen.status === 'online' ? (
                          <>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold text-green-600">Online</span>
                          </>
                        ) : (
                          <>
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="font-semibold text-red-600">Offline</span>
                          </>
                        )}
                        {/* Test button for simulating status changes */}
                        {import.meta.env.DEV && (
                          <button
                            onClick={() => handleSimulateStatusChange(screen.id, screen.status)}
                            className="ml-2 p-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                            title="Simulate status change (dev only)"
                          >
                            <Zap size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatLastSeen(screen.lastSeen)}
                    </td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primaryLight transition-colors flex items-center gap-2">
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(screen.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Screen Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Monitor size={24} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Add New Screen</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Screen Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Screen Name *
                </label>
                <input
                  type="text"
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  placeholder="e.g., Lobby Display 1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={newScreenLocation}
                  onChange={(e) => setNewScreenLocation(e.target.value)}
                  placeholder="e.g., Main Entrance, Floor 2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Resolution
                </label>
                <select
                  value={newScreenResolution}
                  onChange={(e) => setNewScreenResolution(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="1920x1080">1920x1080 (Full HD)</option>
                  <option value="3840x2160">3840x2160 (4K UHD)</option>
                  <option value="2560x1440">2560x1440 (2K QHD)</option>
                  <option value="1366x768">1366x768 (HD)</option>
                  <option value="1280x720">1280x720 (HD 720p)</option>
                  <option value="1080x1920">1080x1920 (Portrait Full HD)</option>
                  <option value="2160x3840">2160x3840 (Portrait 4K)</option>
                </select>
              </div>

              {/* IP Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  IP Address (Optional)
                </label>
                <input
                  type="text"
                  value={newScreenIP}
                  onChange={(e) => setNewScreenIP(e.target.value)}
                  placeholder="e.g., 192.168.1.100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Playlist Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assign Playlist (Optional)
                </label>
                <select
                  value={selectedPlaylistId}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">No playlist (assign later)</option>
                  {playlists.map(playlist => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name} ({playlist.designReferences.length} items)
                    </option>
                  ))}
                </select>
                {playlists.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No playlists available. Create a playlist first.
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Screen ID will be auto-generated</strong> (e.g., scr01, scr02, etc.)
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateScreen}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
              >
                Create Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleScreen;
