import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Search, PlayCircle, AlertCircle, Copy } from 'lucide-react';

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
  
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([
    {
      id: '1',
      name: 'Morning Rotation',
      itemCount: 5,
      totalDuration: 300,
      lastModified: '2025-12-10',
      description: 'Daily morning broadcast schedule',
    },
    {
      id: '2',
      name: 'Lunch Time Special',
      itemCount: 3,
      totalDuration: 180,
      lastModified: '2025-12-09',
      description: 'Promotional content for lunch hours',
    },
    {
      id: '3',
      name: 'Evening News',
      itemCount: 7,
      totalDuration: 420,
      lastModified: '2025-12-08',
      description: 'Evening broadcast with news and updates',
    },
  ]);

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
            onClick={() => navigate('/schedule')}
            className="flex items-center gap-2 text-primary hover:text-primaryLight mb-4 transition-colors font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Schedule
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
        {filteredPlaylists.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {playlists.length === 0 ? 'No Playlists Yet' : 'No Match Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {playlists.length === 0
                ? 'Create your first playlist to organize your content'
                : 'Try a different search term'}
            </p>
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
                    <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors text-sm font-semibold">
                      Open
                    </button>
                    <button
                      onClick={() => handleDuplicate(playlist)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
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
