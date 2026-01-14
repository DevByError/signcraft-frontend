
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, PlayCircle, Clock, RefreshCw } from 'lucide-react';
import {
  getPlaylistsFromBackend,
  savePlaylistToBackend,
  deletePlaylistFromBackend
} from '../services/playlistService';
import authService from '../services/authService';
import Swal from 'sweetalert2';
import { useAuth } from '@/contexts/AuthContext';

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

  // 1. Get User
  const { user } = useAuth();


  // DEBUG: Check the console to see exactly what 'role' equals
  // console.log("Current User Role:", (user as any)?.role);

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await getPlaylistsFromBackend();

      if (response.success && response.data) {
        const items = response.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          itemCount: p.itemCount || 0,
          totalDuration: p.totalDuration || 0,
          lastModified: p.updatedAt
        }));
        setPlaylists(items);
      } else {
        setError(response.msg || 'Failed to load playlists');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      const res = await savePlaylistToBackend({
        name: newPlaylistName,
        description: newPlaylistDescription,
        userID: user?.id
      });

      if (res.success && res.data) {
        navigate(`/playlist/edit/${res.data.id}`);
      } else {
        Swal.fire('Error', 'Failed to create: ' + res.msg, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deletePlaylistFromBackend(id);
      if (res.success) {
        Swal.fire('Deleted!', 'Playlist has been deleted.', 'success');
        setPlaylists(prev => prev.filter(p => p.id !== id));
      } else {
        Swal.fire('Error', 'Failed to delete.', 'error');
      }
    } catch (err) { console.error(err); }
  };

  const filtered = playlists.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft size={20} /> Back to Dashboard
          </button>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Playlists</h1>
              <p className="text-gray-500 mt-1">Manage your slideshows and schedules</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => fetchData(true)} className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-all">
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              {(user as any)?.role?.toLowerCase() !== 'admin' && (
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2 px-6 py-3 bg-[#1e293b] text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                  <Plus size={20} /> New Playlist
                </button>
              )}
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-100 animate-slideDown">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Create New Playlist</h3>
            <div className="space-y-4">
              <input
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                placeholder="Playlist Name"
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                autoFocus
              />
              <input
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                placeholder="Description (Optional)"
                value={newPlaylistDescription}
                onChange={e => setNewPlaylistDescription(e.target.value)}
              />
              <div className="flex gap-3 pt-2">
                <button onClick={handleCreate} disabled={!newPlaylistName.trim()} className="px-6 py-2.5 bg-[#1e293b] text-white rounded-lg hover:bg-slate-800 font-medium transition-all disabled:opacity-50">Create</button>
                <button onClick={() => setShowCreateForm(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {!loading && filtered.length === 0 && !showCreateForm && (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlayCircle className="text-blue-500" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Playlists Yet</h3>
            <p className="text-gray-500 mt-1">Create your first playlist to start scheduling content.</p>
            {(user as any)?.role?.toLowerCase() !== 'admin' && (
              <button onClick={() => setShowCreateForm(true)} className="mt-6 text-blue-600 font-medium hover:underline">
                Create one now
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <PlayCircle className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{p.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">{p.itemCount} Items</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[2.5em]">
                    {p.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-6 pb-6 border-b border-gray-100">
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-blue-100 text-blue-600 font-medium">
                      <Clock size={12} />
                      {formatDuration(p.totalDuration)}
                    </span>
                    <span>{new Date(p.lastModified).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">

                    {/* ✅ FIXED CHECK: Case-Insensitive Check for Admin */}
                    {/* If Role is NOT "admin" (in any case), SHOW the button */}
                    {(user as any)?.role?.toLowerCase() !== 'admin' && (
                      <button
                        onClick={() => navigate(`/playlist/edit/${p.id}`)}
                        className="flex-1 bg-[#1e293b] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                      >
                        Modify
                      </button>
                    )}

                    <button
                      onClick={() => window.open(`/#/playlist/preview/${p.id}`, '_blank')}
                      className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      Preview
                    </button>

                    {(user as any)?.role?.toLowerCase() !== 'admin' && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Playlist"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
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