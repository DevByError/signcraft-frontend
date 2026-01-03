import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Clock, Edit, Folder, Zap, Layers, Monitor, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllDesigns, convertBackendToLocal } from '../services/designService';
import { getAllPlaylists } from '../services/playlistService';
import { getAllScreens } from '../services/screenService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [designs, setDesigns] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDesigns: 0,
    totalPlaylists: 0,
    totalScreens: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Run fetches in parallel
        const [designsRes, playlistsRes, screensRes] = await Promise.allSettled([
          getAllDesigns(),
          getAllPlaylists(),
          getAllScreens()
        ]);

        // 1. Handle Designs
        if (designsRes.status === 'fulfilled' && designsRes.value?.success) {
          const backendDesigns = designsRes.value.data?.map(convertBackendToLocal) || [];
          setDesigns(backendDesigns.slice(0, 6));
          setStats(prev => ({ ...prev, totalDesigns: backendDesigns.length }));
        }

        // 2. Handle Playlists (Fixed Logic)
        if (playlistsRes.status === 'fulfilled') {
          const res = playlistsRes.value;
          let count = 0;

          // Debugging log to see what the backend actually returns
          // console.log("Playlist Response:", res);

          if (res.success) {
            // Check if 'data' is the array, or if it's nested inside 'data.playlists'
            if (Array.isArray(res.data)) {
              count = res.data.length;
            } else if (res.data && Array.isArray(res.data.playlists)) {
              count = res.data.playlists.length;
            } else if (res.data && Array.isArray(res.data.tblplaylists)) {
              count = res.data.tblplaylists.length;
            }
          }

          setStats(prev => ({ ...prev, totalPlaylists: count }));
        }

        // 3. Handle Screens
        if (screensRes.status === 'fulfilled') {
          const res = screensRes.value;
          let count = 0;
          if (res.success && Array.isArray(res.data)) {
            count = res.data.length;
          }
          setStats(prev => ({ ...prev, totalScreens: count }));
        }

      } catch (err) {
        console.error('❌ [DASHBOARD] Error fetching data:', err);
        setError('Partial load failure. Some data may not be available.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleNewDesign = () => navigate('/editor');
  const handleEditDesign = (id: string) => navigate(`/editor/${id}`);
  const handlePreviewDesign = (id: string) => window.open(`/#/preview/${id}`, '_blank');

  // Helper to get user initial
  const getUserInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="bg-ivory min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div className="flex items-center gap-4">
            {/* Dynamic Avatar */}


            <div>
              <h1 className="text-4xl font-bold text-primary">Dashboard</h1>
              <p className="text-gray-600 text-sm mt-1">
                Welcome back, <span className="font-semibold">{user?.name}</span>!
              </p>
            </div>
          </div>

          <button
            onClick={handleNewDesign}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primaryLight transition-colors shadow-md font-medium"
          >
            <Plus size={20} />
            New Design
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-12 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

          {/* Designs Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Designs</p>
                <p className="text-3xl font-bold text-primary mt-2">
                  {loading ? '...' : stats.totalDesigns}
                </p>
              </div>
              <Folder className="text-primary opacity-30" size={32} />
            </div>
          </div>

          {/* Screens Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Screens</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {loading ? '...' : stats.totalScreens}
                </p>
              </div>
              <Monitor className="text-orange-600 opacity-30" size={32} />
            </div>
          </div>

          {/* Playlists Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Playlists</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {loading ? '...' : stats.totalPlaylists}
                </p>
              </div>
              <Layers className="text-purple-600 opacity-30" size={32} />
            </div>
          </div>

          {/* Plan Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Subscription</p>
                <p className="text-lg font-bold text-green-600 mt-2">Pro Plan</p>
              </div>
              <Zap className="text-green-600 opacity-30" size={32} />
            </div>
          </div>
        </div>

        {/* Recent Designs Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Recent Designs</h2>
            <Link to="/creative" className="text-primary hover:text-primaryLight font-medium transition-colors underline text-sm">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 h-64 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : designs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Folder className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium mb-4">No designs yet</p>
              <button onClick={handleNewDesign} className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primaryLight transition-colors font-medium">
                <Plus size={18} /> Create Your First Design
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.map((design) => (
                <div key={design.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                  <div className="h-40 bg-gray-200 relative overflow-hidden cursor-pointer" onClick={() => handleEditDesign(design.id)}>
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primaryLight/20">
                      <Layers className="text-primary/50" size={40} />
                    </div>
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/30 transition-all flex items-center justify-center">
                      <Edit className="text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" size={36} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-primary truncate text-lg">{design.metadata.title}</h3>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-3">
                      <Clock size={14} />
                      <span>Updated {new Date(design.metadata.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleEditDesign(design.id)} className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primaryLight transition-colors text-sm font-medium">
                        Modify
                      </button>
                      <button onClick={() => handlePreviewDesign(design.id)} className="flex-1 px-4 py-2 bg-gray-100 text-primary rounded hover:bg-gray-200 transition-colors text-sm font-medium">
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions (Management Links) */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-8">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Creative Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/creative')}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Zap size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Creative</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-4">{loading ? '-' : stats.totalDesigns}</p>
              <div className="text-blue-600 font-semibold hover:text-blue-700 transition-colors flex items-center gap-1">
                Manage Creatives <ArrowLeft className="rotate-180" size={16} />
              </div>
            </div>

            {/* Playlist Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/playlist')}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Layers size={24} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Playlist</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-4">{loading ? '-' : stats.totalPlaylists}</p>
              <div className="text-purple-600 font-semibold hover:text-purple-700 transition-colors flex items-center gap-1">
                Manage Playlists <ArrowLeft className="rotate-180" size={16} />
              </div>
            </div>

            {/* Screen Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/screen')}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Monitor size={24} className="text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Screen</h3>
              </div>
              <p className="text-3xl font-bold text-orange-600 mb-4">{loading ? '-' : stats.totalScreens}</p>
              <div className="text-orange-600 font-semibold hover:text-orange-700 transition-colors flex items-center gap-1">
                Manage Screens <ArrowLeft className="rotate-180" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ RESTORED: Complete Schedule Management Section */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12 text-white">
          <h2 className="text-3xl font-bold mb-8">Complete Schedule Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-start gap-4 mb-8">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-white/20 border border-white/30">
                  <span className="text-lg font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Upload or Create</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Use our powerful editor to create designs or upload your existing creatives.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-white/20 border border-white/30">
                  <span className="text-lg font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Organize into Playlists</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Group your content into logical playlists for easy management and deployment.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-4 mb-8">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-white/20 border border-white/30">
                  <span className="text-lg font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Manage Your Screens</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Monitor your display network and manage device connections and status.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-white/20 border border-white/30">
                  <span className="text-lg font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Schedule & Deploy</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Set dates, times, and target specific screens for your content campaigns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;