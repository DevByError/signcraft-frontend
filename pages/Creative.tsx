import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Search, Grid2x2, List, AlertCircle, RefreshCw } from 'lucide-react';
// Import service functions
import { getAllDesigns, deleteDesign } from '../services/designService';
import Swal from 'sweetalert2';

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
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch creatives from backend
  const fetchCreatives = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setLoading(true);
      setError(null);


      const response = await getAllDesigns();

      const designsArray = Array.isArray(response.data) ? response.data : [];

      if (!response.success && designsArray.length === 0) {
        console.error('[CREATIVE] Failed to load designs:', response.msg);
        setError('Failed to load designs.');
      }

      // Convert backend designs to Creative objects
      const convertedCreatives: Creative[] = designsArray.slice(0, 100).map((design: any) => {

        // --- 1. SAFE PARSING ---
        // Sequelize sometimes returns JSON fields as strings. Parse them if needed.
        let parsedCanvas = design.canvasData;
        let parsedTimeline = design.timelineData;

        if (typeof parsedCanvas === 'string') {
          try { parsedCanvas = JSON.parse(parsedCanvas); } catch (e) { parsedCanvas = []; }
        }
        if (typeof parsedTimeline === 'string') {
          try { parsedTimeline = JSON.parse(parsedTimeline); } catch (e) { parsedTimeline = {}; }
        }

        // --- 2. CALCULATE RESOLUTION ---
        // Priority: 1. videoSize column, 2. metadata inside canvas, 3. Default 1920x1080
        let sizeString = "1920x1080"; // Default

        if (design.videoSize && design.videoSize !== "NULL") {
          sizeString = design.videoSize;
        } else if (parsedCanvas && !Array.isArray(parsedCanvas) && parsedCanvas.width) {
          // If canvasData was saved as an object { width, height, elements }
          sizeString = `${parsedCanvas.width}x${parsedCanvas.height}`;
        }

        // --- 3. CALCULATE DURATION ---
        // Priority: 1. timelineData.totalDuration, 2. Default 5s
        let durationSec = 5;

        if (parsedTimeline && parsedTimeline.totalDuration) {
          // Database stores milliseconds (e.g. 15000), convert to seconds (15)
          durationSec = Math.round(Number(parsedTimeline.totalDuration) / 1000);
        } else if (parsedTimeline && parsedTimeline.tracks) {
          // Fallback: Calculate from tracks if totalDuration is missing
          // (Find the end time of the last item)
          let maxTime = 5000;
          parsedTimeline.tracks.forEach((t: any) => {
            t.items?.forEach((i: any) => {
              const end = (i.startTime || 0) + (i.duration || 0);
              if (end > maxTime) maxTime = end;
            });
          });
          durationSec = Math.round(maxTime / 1000);
        }

        // --- 4. THUMBNAIL LOGIC ---
        const numElements = Array.isArray(parsedCanvas) ? parsedCanvas.length : (parsedCanvas?.elements?.length || 0);
        const colors = ['#4ECDC4', '#FF6B6B', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'];
        const charCode = design.id && typeof design.id === 'string' ? design.id.charCodeAt(0) : 0;
        const colorIndex = charCode % colors.length;
        const thumbnailColor = colors[colorIndex];

        return {
          id: design.id,
          name: design.title || 'Untitled Design',
          thumbnail: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='${thumbnailColor}' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='white' font-weight='bold'%3E${encodeURIComponent(design.title || 'Untitled')}%3C/text%3E%3Ctext x='50%25' y='70%25' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='white' opacity='0.8'%3E${numElements} elements%3C/text%3E%3C/svg%3E`,
          createdDate: design.createdAt || new Date().toISOString(),
          duration: durationSec, // Uses real timeline duration
          size: sizeString,      // Uses safe resolution logic
        };
      });

      setCreatives(convertedCreatives);
      setLastUpdated(new Date());

    } catch (err: any) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      console.error('[CREATIVE] Error loading designs:', err);
      setError(`Failed to load creatives: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Delete creative
  const handleDelete = async (designId: string) => {
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
      // Use service function
      const response = await deleteDesign(designId);

      if (response.success) {
        Swal.fire(
          'Deleted!',
          'Your design has been deleted.',
          'success'
        );
        setCreatives(prev => prev.filter(c => c.id !== designId));
      } else {
        Swal.fire(
          'Error!',
          'Failed to delete design: ' + response.msg,
          'error'
        );
      }
    } catch (err: any) {
      // Ignore 401/403 (Global Modal handles it)
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        return;
      }

      console.error('Error deleting design:', err);
      Swal.fire(
        'Error!',
        'Error deleting design: ' + (err.response?.data?.msg || err.message),
        'error'
      );
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/editor/${id}`); // Changed to /editor/ID as per your routing
  };

  useEffect(() => {
    fetchCreatives();
  }, []);

  const filteredCreatives = creatives.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <p className="text-gray-600">
                Manage your designs and creatives
                {lastUpdated && (
                  <span className="text-sm text-gray-500 ml-2">
                    • Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => fetchCreatives(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => navigate('/editor')}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold"
              >
                <Plus size={20} />
                New Creative
              </button>
            </div>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex gap-4 mb-6 items-center">
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
              className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}`}
            >
              <Grid2x2 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Creatives Display */}
        {!loading && filteredCreatives.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {creatives.length === 0 ? 'No Creatives Yet' : 'No Match Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {creatives.length === 0 ? 'Create your first design to get started' : 'Try a different search term'}
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
                  <img src={creative.thumbnail} alt={creative.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{creative.name}</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>Resolution: {creative.size}</p>
                    <p>Duration: {creative.duration}s</p>
                    <p>Created: {new Date(creative.createdDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(creative.id)}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors text-sm font-semibold flex items-center justify-center gap-2">
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
                        <img src={creative.thumbnail} alt={creative.name} className="w-12 h-12 rounded object-cover" />
                        <span className="font-semibold text-gray-900">{creative.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{creative.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{creative.duration}s</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(creative.createdDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button onClick={() => handleEdit(creative.id)} className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primaryLight transition-colors flex items-center gap-2">
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button onClick={() => handleDelete(creative.id)} className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors">
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
