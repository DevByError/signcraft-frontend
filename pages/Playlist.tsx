import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Search, PlayCircle, AlertCircle, Copy } from 'lucide-react';
import { getAllDesigns } from '../services/designService';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);

  // Fetch designs from Firebase
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching all designs from Firebase...');
        
        const designs = await getAllDesigns(50);
        console.log('Fetched designs:', designs);
        
        if (!designs || designs.length === 0) {
          console.log('No designs found');
          setPlaylists([]);
          setLoading(false);
          return;
        }
        
        // Convert designs to playlist format
        const playlistsFromDesigns: PlaylistItem[] = designs.map(design => {
          console.log('Processing design:', design.metadata.title);
          return {
            id: design.id,
            name: design.metadata.title,
            itemCount: design.designJSON.elements.length,
            totalDuration: design.designJSON.elements.length * 5, // Default 5 seconds per element
            lastModified: design.metadata.updatedAt,
            description: design.metadata.description || 'No description',
          };
        });
        
        console.log('Converted playlists:', playlistsFromDesigns);
        setPlaylists(playlistsFromDesigns);
      } catch (err) {
        console.error('Error fetching designs:', err);
        setError(`Failed to load designs from Firebase: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigns();
  }, []);

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    
    const playlist: PlaylistItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlaylistName,
      itemCount: 0,
      totalDuration: 0,
      lastModified: new Date().toISOString().split('T')[0],
      description: '',
    };
    
    setPlaylists(prev => [...prev, playlist]);
    setNewPlaylistName('');
    setShowCreateForm(false);
  };

  const handleDelete = (id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  };

  const handleDuplicate = (playlist: PlaylistItem) => {
    const duplicated: PlaylistItem = {
      ...playlist,
      id: Math.random().toString(36).substr(2, 9),
      name: `${playlist.name} (Copy)`,
      lastModified: new Date().toISOString().split('T')[0],
    };
    setPlaylists(prev => [...prev, duplicated]);
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
              <p className="text-gray-600">Organize your content into playlists for scheduling</p>
            </div>
            
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
            >
              <Plus size={20} />
              New Playlist
            </button>
          </div>
        </div>

        {/* Create Playlist Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-primary/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Playlist</h3>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleCreatePlaylist}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPlaylistName('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
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
              {playlists.length === 0 ? 'No Designs Yet' : 'No Match Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {playlists.length === 0
                ? 'Create your first design to organize your content'
                : 'Try a different search term'}
            </p>
            {playlists.length === 0 && (
              <button
                onClick={() => navigate('/editor')}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
              >
                Create First Design
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
                      onClick={() => navigate(`/preview/${playlist.id}`)}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors text-sm font-semibold"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => navigate(`/modify/${playlist.id}`)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                      title="Modify Design"
                    >
                      <Edit2 size={18} />
                      <span className="text-xs font-semibold hidden sm:inline">Modify</span>
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
