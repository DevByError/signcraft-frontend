import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Clock, Edit, Folder, Zap, Layers, Monitor } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllDesigns } from '../services/designService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching designs for dashboard...');

        const designsData = await getAllDesigns(6); // Show last 6 designs
        setDesigns(designsData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNewDesign = () => {
    navigate('/editor');
  };

  const handleEditDesign = (designId: string) => {
    navigate(`/modify/${designId}`);
  };

  const handlePreviewDesign = (creativeId: string) => {
    navigate(`/preview/${creativeId}`);
  };

  return (
    <div className="bg-ivory min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-primary">Dashboard</h1>
            <p className="text-gray-600 text-sm mt-2">
              Welcome back, <span className="font-semibold">{user?.name}</span>! Manage your digital signage content and schedule.
            </p>
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
          <div className="mb-12 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <div>
              <p className="text-red-800 font-medium">Error loading dashboard</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Designs</p>
                <p className="text-3xl font-bold text-primary mt-2">
                  {loading ? '-' : designs.length}
                </p>
              </div>
              <Folder className="text-primary opacity-30" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Screens</p>
                <p className="text-3xl font-bold text-primary mt-2">3 / 10</p>
              </div>
              <Monitor className="text-primary opacity-30" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Playlists</p>
                <p className="text-3xl font-bold text-primary mt-2">3</p>
              </div>
              <Layers className="text-primary opacity-30" size={32} />
            </div>
          </div>

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
            <Link 
              to="/templates"
              className="text-primary hover:text-primaryLight font-medium transition-colors underline text-sm"
            >
              Browse Templates →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : designs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Folder className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium mb-4">No designs yet</p>
              <button
                onClick={handleNewDesign}
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primaryLight transition-colors font-medium"
              >
                <Plus size={18} />
                Create Your First Design
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.map((design) => (
                <div 
                  key={design.id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div 
                    className="h-40 bg-gray-200 relative overflow-hidden cursor-pointer"
                    onClick={() => handleEditDesign(design.id)}
                  >
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primaryLight/20">
                      <Layers className="text-primary/50" size={40} />
                    </div>
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/30 transition-all flex items-center justify-center">
                      <Edit className="text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" size={36} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-primary truncate text-lg">{design.metadata.title}</h3>
                    {design.metadata.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mt-1">{design.metadata.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-3">
                      <Clock size={14} />
                      <span>Updated {new Date(design.metadata.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEditDesign(design.id)}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primaryLight transition-colors text-sm font-medium"
                        title="Modify Design"
                      >
                        Modify
                      </button>
                      <button
                        onClick={() => handlePreviewDesign(design.id)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-primary rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Management Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-8">Schedule Management</h2>
          
          {/* Schedule Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Zap size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Creative</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Upload and manage your design files. Create beautiful displays with our editor or import your own assets.
              </p>
              <p className="text-3xl font-bold text-blue-600 mb-4">12</p>
              <button 
                onClick={() => navigate('/creative')}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Manage Creatives →
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Layers size={24} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Playlist</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Group your creatives into playlists for organized content delivery. Create rotations and sequences.
              </p>
              <p className="text-3xl font-bold text-purple-600 mb-4">3</p>
              <button 
                onClick={() => navigate('/playlist')}
                className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                Manage Playlists →
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Monitor size={24} className="text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Screen</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Monitor and manage your physical display devices. Track online status and current playback.
              </p>
              <p className="text-3xl font-bold text-orange-600 mb-4">5</p>
              <button 
                onClick={() => navigate('/screen')}
                className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
              >
                Manage Screens →
              </button>
            </div>
          </div>

          {/* Process Section */}
          <div className="bg-gradient-to-r from-primary to-primaryLight rounded-2xl shadow-xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-6">Complete Schedule Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-white/20">
                    <span className="text-lg font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Upload or Create</h3>
                    <p className="text-white/90">
                      Use our powerful editor to create designs or upload your existing creatives
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-white/20">
                    <span className="text-lg font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Organize into Playlists</h3>
                    <p className="text-white/90">
                      Group your content into logical playlists for easy management and deployment
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-white/20">
                    <span className="text-lg font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Manage Your Screens</h3>
                    <p className="text-white/90">
                      Monitor your display network and manage device connections and status
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-white/20">
                    <span className="text-lg font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Schedule & Deploy</h3>
                    <p className="text-white/90">
                      Set dates, times, and target specific screens for your content campaigns
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-primaryLight rounded-lg shadow-md p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to grow?</h2>
          <p className="mb-6 text-white/90">Upgrade your plan to manage more screens and designs</p>
          <button className="bg-vanilla text-primary hover:bg-yellow-100 px-6 py-2 rounded-lg font-bold transition-colors">
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;