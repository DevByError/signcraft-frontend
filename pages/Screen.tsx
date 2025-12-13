import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Search, AlertCircle, Wifi, WifiOff, MapPin } from 'lucide-react';

interface Screen {
  id: string;
  name: string;
  location: string;
  resolution: string;
  status: 'online' | 'offline';
  lastSeen: string;
  ipAddress: string;
  currentPlaylist?: string;
}

const ScheduleScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
  
  const [screens, setScreens] = useState<Screen[]>([
    {
      id: '1',
      name: 'Lobby Display 1',
      location: 'Main Entrance',
      resolution: '1920x1080',
      status: 'online',
      lastSeen: new Date().toISOString(),
      ipAddress: '192.168.1.101',
      currentPlaylist: 'Morning Rotation',
    },
    {
      id: '2',
      name: 'Conference Room A',
      location: 'Floor 2',
      resolution: '1920x1080',
      status: 'online',
      lastSeen: new Date().toISOString(),
      ipAddress: '192.168.1.102',
      currentPlaylist: 'Lunch Time Special',
    },
    {
      id: '3',
      name: 'Cafeteria Screen',
      location: 'Cafeteria',
      resolution: '3840x2160',
      status: 'offline',
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      ipAddress: '192.168.1.103',
    },
    {
      id: '4',
      name: 'Meeting Room B',
      location: 'Floor 3',
      resolution: '1920x1080',
      status: 'online',
      lastSeen: new Date().toISOString(),
      ipAddress: '192.168.1.104',
      currentPlaylist: 'Evening News',
    },
    {
      id: '5',
      name: 'Elevator Display',
      location: 'Elevator Lobby',
      resolution: '1920x1080',
      status: 'offline',
      lastSeen: new Date(Date.now() - 7200000).toISOString(),
      ipAddress: '192.168.1.105',
    },
  ]);

  const filteredScreens = screens.filter(screen => {
    const matchesSearch = screen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         screen.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || screen.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const onlineCount = screens.filter(s => s.status === 'online').length;
  const offlineCount = screens.filter(s => s.status === 'offline').length;

  const handleDelete = (id: string) => {
    setScreens(prev => prev.filter(s => s.id !== id));
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
              <p className="text-gray-600">Manage your digital display network</p>
            </div>
            
            <button
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
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('online')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                filterStatus === 'online'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setFilterStatus('offline')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                filterStatus === 'offline'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              Offline
            </button>
          </div>
        </div>

        {/* Screens Display */}
        {filteredScreens.length === 0 ? (
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
                      {screen.currentPlaylist ? (
                        <span className="px-3 py-1 bg-primary/10 text-primary font-semibold rounded-full text-xs">
                          {screen.currentPlaylist}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {screen.status === 'online' ? (
                          <>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="font-semibold text-green-600">Online</span>
                          </>
                        ) : (
                          <>
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="font-semibold text-red-600">Offline</span>
                          </>
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
    </div>
  );
};

export default ScheduleScreen;
