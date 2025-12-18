import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Search, PlayCircle, AlertCircle, Copy, Clock, Image } from 'lucide-react';
import { getUserDesigns } from '../services/designService';
import { 
  getUserPlaylists, 
  createPlaylist, 
  deletePlaylist, 
  duplicatePlaylist,
  PlaylistDocument 
} from '../services/playlistService';

interface PlaylistItem {
  id: string;
  name: string;
  itemCount: number;
  totalDuration: number;
  lastModified: string;
  description: string;
}

const SchedulePlaylist: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [availableDesignCount, setAvailableDesignCount] = useState(0);

  // Fetch playlists from Firebase (NOT designs!)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📋 [PLAYLIST] Fetching playlists from Firebase...');
        
        // Fetch user's playlists from 'playlists' collection
        const playlistsData = await getUserPlaylists(100);
        console.log(`✅ [PLAYLIST] Fetched ${playlistsData.length} playlists`);
        
        // Fetch available designs count for display
        const designs = await getUserDesigns(1000);
        setAvailableDesignCount(designs.length);
        console.log(`✅ [PLAYLIST] Found ${designs.length} available designs`);
        
        // Convert to UI format
        const playlistItems: PlaylistItem[] = playlistsData.map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          itemCount: playlist.designReferences.length,
          totalDuration: playlist.totalDuration,
          lastModified: playlist.updatedAt.toDate().toLocaleDateString(),
          description: playlist.description || 'No description',
        }));
        
        setPlaylists(playlistItems);
      } catch (err) {
        console.error('❌ [PLAYLIST] Error fetching data:', err);
        setError(`Failed to load playlists: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      alert('Please enter a playlist name');
      return;
    }
    
    try {
      console.log('📋 [PLAYLIST] Creating new playlist:', newPlaylistName);
      
      const result = await createPlaylist(
        newPlaylistName,
        newPlaylistDescription,
        [], // Start with empty playlist - user will add designs in editor
        false
      );
      
      if (result.success && result.playlistId) {
        console.log('✅ [PLAYLIST] Created successfully:', result.playlistId);
        
        // Navigate to playlist editor to add designs
        navigate(`/playlist/edit/${result.playlistId}`);
      } else {
        console.error('❌ [PLAYLIST] Failed to create:', result.error);
        setError(result.error || 'Failed to create playlist');
      }
    } catch (err) {
      console.error('❌ [PLAYLIST] Error creating playlist:', err);
      setError('Failed to create playlist');
    }
  };

  const handleDelete = async (id: string) => {
    const playlistName = playlists.find(p => p.id === id)?.name || 'this playlist';
    
    if (window.confirm(`Are you sure you want to delete "${playlistName}"? This action cannot be undone.`)) {
      try {
        console.log('🗑️ [PLAYLIST] Deleting playlist:', id);
        const result = await deletePlaylist(id);
        
        if (result.success) {
          setPlaylists(prev => prev.filter(p => p.id !== id));
          console.log('✅ [PLAYLIST] Deleted successfully');
        } else {
          console.error('❌ [PLAYLIST] Failed to delete:', result.error);
          setError(result.error || 'Failed to delete playlist');
        }
      } catch (err) {
        console.error('❌ [PLAYLIST] Error deleting:', err);
        setError('Failed to delete playlist');
      }
    }
  };

  const handleDuplicate = async (playlist: PlaylistItem) => {
    try {
      console.log('📋 [PLAYLIST] Duplicating playlist:', playlist.id);
      const result = await duplicatePlaylist(playlist.id);
      
      if (result.success && result.playlistId) {
        // Add duplicated playlist to local state
        const duplicated: PlaylistItem = {
          ...playlist,
          id: result.playlistId,
          name: `${playlist.name} (Copy)`,
          lastModified: new Date().toLocaleDateString(),
        };
        
        setPlaylists(prev => [duplicated, ...prev]);
        console.log('✅ [PLAYLIST] Duplicated successfully');
      } else {
        console.error('❌ [PLAYLIST] Failed to duplicate:', result.error);
        setError(result.error || 'Failed to duplicate playlist');
      }
    } catch (err) {
      console.error('❌ [PLAYLIST] Error duplicating:', err);
      setError('Failed to duplicate playlist');
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/playlist/edit/${id}`);
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Playlists</h1>
              <p className="text-gray-600">
                Create slideshows from your designs • {availableDesignCount} designs available
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
            >
              <Plus size={20} />
              New Slideshow
            </button>
          </div>
        </div>

        {/* Info Banner */}
        {!loading && playlists.length === 0 && !showCreateForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-800 font-medium">Create Your Slideshow</p>
                <p className="text-blue-700 text-sm mt-1">
                  Playlists are slideshows of your designs. Create a playlist, select which designs to include, 
                  set how long each design displays, and arrange them in your preferred order.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create Playlist Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-primary/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Slideshow</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slideshow Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Morning Announcements, Product Showcase"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleCreatePlaylist()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Describe this slideshow..."
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create & Add Designs
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
              <p className="text-sm text-gray-600">
                💡 After creating, you'll select designs to build your slideshow sequence.
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats Bar */}
        {!loading && !error && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-600">Total Playlists</p>
                  <p className="text-2xl font-bold text-primary">{playlists.length}</p>
                </div>
                <div className="h-10 w-px bg-gray-300"></div>
                <div>
                  <p className="text-sm text-gray-600">Available Designs</p>
                  <p className="text-2xl font-bold text-gray-900">{availableDesignCount}</p>
                </div>
                {searchTerm && (
                  <>
                    <div className="h-10 w-px bg-gray-300"></div>
                    <div>
                      <p className="text-sm text-gray-600">Search Results</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredPlaylists.length}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Playlists Collection</span>
              </div>
            </div>
          </div>
        )}

        {/* Playlists Display */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Loading Designs</h3>
            <p className="text-gray-600">Fetching your designs from Firebase...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center border-2 border-red-200">
            <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Error Loading Designs</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
            >
              Retry
            </button>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {playlists.length === 0 ? 'No Playlists Yet' : 'No Match Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {playlists.length === 0
                ? 'Create your first slideshow to organize your designs'
                : 'Try a different search term'}
            </p>
            {playlists.length === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
              >
                Create First Playlist
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map(playlist => (
              <div key={playlist.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-primary to-primaryLight p-6">
                  <div className="flex items-start justify-between mb-4">
                    <PlayCircle size={40} className="text-white" />
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">{playlist.itemCount}</p>
                      <p className="text-white/80 text-sm">items</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{playlist.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{playlist.description || 'No description'}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                    <p>Duration: <span className="font-semibold text-gray-900">{Math.floor(playlist.totalDuration / 60)}m {playlist.totalDuration % 60}s</span></p>
                    <p>Modified: <span className="font-semibold text-gray-900">{new Date(playlist.lastModified).toLocaleDateString()}</span></p>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/playlist/preview/${playlist.id}`)}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <PlayCircle size={18} />
                      Preview
                    </button>
                    <button
                      onClick={() => handleEdit(playlist.id)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                      title="Edit Slideshow"
                    >
                      <Edit2 size={18} />
                      <span className="text-xs font-semibold hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(playlist)}
                      className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(playlist.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePlaylist;
