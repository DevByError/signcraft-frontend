import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Zap, Layers, Monitor } from 'lucide-react';

const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (location.pathname.includes('/schedule/creative')) return 'creative';
    if (location.pathname.includes('/schedule/playlist')) return 'playlist';
    if (location.pathname.includes('/schedule/screen')) return 'screen';
    return 'overview';
  };

  const activeTab = getActiveTab();

  const tabs = [
    {
      id: 'creative',
      label: 'Creative',
      icon: Zap,
      description: 'Manage your designs and creatives',
      path: '/schedule/creative',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'playlist',
      label: 'Playlist',
      icon: Layers,
      description: 'Organize content into playlists',
      path: '/schedule/playlist',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'screen',
      label: 'Screen',
      icon: Monitor,
      description: 'Manage your display network',
      path: '/schedule/screen',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-primary hover:text-primaryLight mb-6 transition-colors font-semibold text-lg"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>

          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-3">Schedule Management</h1>
            <p className="text-gray-600 text-xl">
              Manage your digital signage displays, organize content, and create schedules
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={`relative p-8 rounded-2xl transition-all transform hover:scale-105 cursor-pointer group ${
                  isActive
                    ? 'ring-2 ring-primary shadow-2xl'
                    : 'shadow-lg hover:shadow-xl'
                }`}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tab.color} rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity`}></div>

                {/* Content */}
                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tab.color} flex items-center justify-center mb-4 mx-auto`}>
                    <Icon size={32} className="text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tab.label}</h3>
                  <p className="text-gray-600">{tab.description}</p>

                  {isActive && (
                    <div className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold inline-block">
                      Active
                    </div>
                  )}
                </div>

                {/* Border Accent */}
                <div
                  className={`absolute inset-0 rounded-2xl border-2 transition-all ${
                    isActive
                      ? `border-primary`
                      : `border-transparent group-hover:border-primary/30`
                  }`}
                ></div>
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-semibold mb-2">Total Creatives</p>
                  <p className="text-4xl font-bold text-gray-900">12</p>
                  <p className="text-sm text-gray-500 mt-2">Designs ready to deploy</p>
                </div>
                <Zap size={48} className="text-blue-500/20" />
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-semibold mb-2">Active Playlists</p>
                  <p className="text-4xl font-bold text-gray-900">3</p>
                  <p className="text-sm text-gray-500 mt-2">Organized content streams</p>
                </div>
                <Layers size={48} className="text-purple-500/20" />
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-semibold mb-2">Display Screens</p>
                  <p className="text-4xl font-bold text-gray-900">5</p>
                  <p className="text-sm text-gray-500 mt-2">Online and ready</p>
                </div>
                <Monitor size={48} className="text-orange-500/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Zap size={24} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Creative</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Upload and manage your design files. Create beautiful displays with our editor or import your own assets.
            </p>
            <button
              onClick={() => handleTabClick('/schedule/creative')}
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Manage Creatives →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Layers size={24} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Playlist</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Group your creatives into playlists for organized content delivery. Create rotations and sequences.
            </p>
            <button
              onClick={() => handleTabClick('/schedule/playlist')}
              className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              Manage Playlists →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Monitor size={24} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Screen</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Monitor and manage your physical display devices. Track online status and current playback.
            </p>
            <button
              onClick={() => handleTabClick('/schedule/screen')}
              className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
            >
              Manage Screens →
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-gradient-to-r from-primary to-primaryLight rounded-2xl shadow-xl p-12 text-white">
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
    </div>
  );
};

export default Schedule;
