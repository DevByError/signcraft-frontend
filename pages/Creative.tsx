import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Search, Grid2x2, List, AlertCircle } from 'lucide-react';

interface Creative {
  id: string;
  name: string;
  thumbnail: string;
  createdDate: string;
  duration: number;
  size: string;
}

const ScheduleCreative: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [creatives, setCreatives] = useState<Creative[]>([
    {
      id: '1',
      name: 'Holiday Campaign 2025',
      thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23FF6B6B" width="400" height="300"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="white" font-weight="bold"%3EHoliday%3C/text%3E%3C/svg%3E',
      createdDate: '2025-12-01',
      duration: 10,
      size: '1920x1080',
    },
    {
      id: '2',
      name: 'Product Launch Promo',
      thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%234ECDC4" width="400" height="300"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="white" font-weight="bold"%3ELaunch%3C/text%3E%3C/svg%3E',
      createdDate: '2025-12-05',
      duration: 8,
      size: '1920x1080',
    },
    {
      id: '3',
      name: 'Spring Sale Announcement',
      thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%2395E1D3" width="400" height="300"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="white" font-weight="bold"%3ESale%3C/text%3E%3C/svg%3E',
      createdDate: '2025-12-08',
      duration: 12,
      size: '1920x1080',
    },
  ]);

  const filteredCreatives = creatives.filter(creative =>
    creative.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setCreatives(prev => prev.filter(c => c.id !== id));
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Creative Library</h1>
              <p className="text-gray-600">Manage your designs and creatives</p>
            </div>
            
            <button
              onClick={() => navigate('/editor')}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
            >
              <Plus size={20} />
              New Creative
            </button>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex gap-4 mb-8 items-center">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search creatives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Grid2x2 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Creatives Display */}
        {filteredCreatives.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {creatives.length === 0 ? 'No Creatives Yet' : 'No Match Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {creatives.length === 0
                ? 'Create your first design to get started'
                : 'Try a different search term'}
            </p>
            {creatives.length === 0 && (
              <button
                onClick={() => navigate('/editor')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
              >
                <Plus size={20} />
                Create First Design
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreatives.map(creative => (
              <div key={creative.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-video bg-gray-200 overflow-hidden">
                  <img
                    src={creative.thumbnail}
                    alt={creative.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{creative.name}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>Resolution: {creative.size}</p>
                    <p>Duration: {creative.duration}s</p>
                    <p>Created: {new Date(creative.createdDate).toLocaleDateString()}</p>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(creative.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Resolution</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreatives.map(creative => (
                  <tr key={creative.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={creative.thumbnail}
                          alt={creative.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <span className="font-semibold text-gray-900">{creative.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{creative.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{creative.duration}s</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(creative.createdDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primaryLight transition-colors flex items-center gap-2">
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(creative.id)}
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

export default ScheduleCreative;
