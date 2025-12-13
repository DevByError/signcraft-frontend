import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const mockDesigns = [
    { id: '1', name: 'Main Lobby Screen', lastModified: '2 hours ago', thumbnail: 'https://picsum.photos/300/200?random=20' },
    { id: '2', name: 'Cafeteria Menu', lastModified: '1 day ago', thumbnail: 'https://picsum.photos/300/200?random=21' },
    { id: '3', name: 'Welcome Sign', lastModified: '3 days ago', thumbnail: 'https://picsum.photos/300/200?random=22' },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="bg-ivory min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">Manage your digital signage content.</p>
          </div>
          <button
            onClick={() => navigate('/editor')}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primaryLight transition-colors shadow-sm"
          >
            <Plus size={18} />
            New Design
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Stats Card */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-white p-6 rounded-lg shadow-sm mb-4 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-primary">Subscription Status</h3>
                        <p className="text-sm text-green-600 font-semibold mt-1">Active - Pro Plan</p>
                    </div>
                    <div className="text-right">
                         <p className="text-2xl font-bold text-primary">3 / 10</p>
                         <p className="text-xs text-gray-500">Screens Used</p>
                    </div>
                </div>
            </div>

          {mockDesigns.map((design) => (
            <div key={design.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-200 relative group cursor-pointer" onClick={() => navigate('/editor')}>
                <img src={design.thumbnail} alt={design.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <Edit className="text-white drop-shadow-md" size={32} />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-primary truncate">{design.name}</h3>
                <div className="flex items-center gap-1 text-gray-500 text-xs mt-2">
                  <Clock size={12} />
                  <span>Edited {design.lastModified}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;