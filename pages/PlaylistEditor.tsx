import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Clock, GripVertical, Save, Image as ImageIcon, Search } from 'lucide-react';
import { getPlaylistById, updatePlaylist, addDesignToPlaylist, removeDesignFromPlaylist } from '../services/playlistService';
import { getUserDesigns } from '../services/designService';
import type { PlaylistDocument, PlaylistDesignReference } from '../services/playlistService';
import type { FirestoreDesignDocument } from '../services/designService';

interface DesignInPlaylist extends PlaylistDesignReference {
  designData?: FirestoreDesignDocument;
}

const PlaylistEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [playlist, setPlaylist] = useState<PlaylistDocument | null>(null);
  const [availableDesigns, setAvailableDesigns] = useState<FirestoreDesignDocument[]>([]);
  const [selectedDesigns, setSelectedDesigns] = useState<DesignInPlaylist[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');

  // Fetch playlist and designs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch playlist
        if (id) {
          const playlistDoc = await getPlaylistById(id);
          if (playlistDoc) {
            setPlaylist(playlistDoc);
            setPlaylistName(playlistDoc.name);
            setPlaylistDescription(playlistDoc.description || '');
          } else {
            setError('Playlist not found');
            return;
          }
        }

        // Fetch all available designs
        const designs = await getUserDesigns(100);
        setAvailableDesigns(designs);

        // Load current playlist designs with their data
        if (id) {
          const playlistDoc = await getPlaylistById(id);
          if (playlistDoc && playlistDoc.designReferences.length > 0) {
            const designsInPlaylist: DesignInPlaylist[] = playlistDoc.designReferences.map(ref => {
              const designData = designs.find(d => d.id === ref.designId);
              return {
                ...ref,
                designData
              };
            });
            setSelectedDesigns(designsInPlaylist);
          }
        }

        console.log('✅ [PLAYLIST_EDITOR] Loaded playlist and designs');
      } catch (err) {
        console.error('❌ [PLAYLIST_EDITOR] Error loading data:', err);
        setError(`Failed to load playlist: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Filter designs that aren't already in the playlist
  const filteredAvailableDesigns = availableDesigns.filter(design => {
    const isAlreadySelected = selectedDesigns.some(sd => sd.designId === design.id);
    const matchesSearch = design.metadata.title.toLowerCase().includes(searchTerm.toLowerCase());
    return !isAlreadySelected && matchesSearch;
  });

  const handleAddDesign = (design: FirestoreDesignDocument) => {
    // Get duration from design timeline, fallback to 5 seconds
    const timelineDuration = design.designJSON?.timeline?.totalDuration || 5000;
    const durationInSeconds = timelineDuration / 1000;
    
    const newDesign: DesignInPlaylist = {
      designId: design.id,
      duration: durationInSeconds,
      order: selectedDesigns.length,
      designData: design
    };
    setSelectedDesigns(prev => [...prev, newDesign]);
  };

  const handleRemoveDesign = (designId: string) => {
    setSelectedDesigns(prev => {
      const filtered = prev.filter(d => d.designId !== designId);
      // Reorder remaining designs
      return filtered.map((d, index) => ({ ...d, order: index }));
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSelectedDesigns(prev => {
      const newList = [...prev];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      return newList.map((d, i) => ({ ...d, order: i }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedDesigns.length - 1) return;
    setSelectedDesigns(prev => {
      const newList = [...prev];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      return newList.map((d, i) => ({ ...d, order: i }));
    });
  };

  const handleSave = async () => {
    if (!id) return;
    
    try {
      setSaving(true);
      setError(null);

      // Prepare design references (without designData)
      const designReferences: PlaylistDesignReference[] = selectedDesigns.map(({ designId, duration, order }) => ({
        designId,
        duration,
        order
      }));

      const result = await updatePlaylist(id, {
        name: playlistName,
        description: playlistDescription,
        designReferences
      });

      if (result.success) {
        console.log('✅ [PLAYLIST_EDITOR] Playlist saved successfully');
        navigate('/playlist');
      } else {
        setError(result.error || 'Failed to save playlist');
      }
    } catch (err) {
      console.error('❌ [PLAYLIST_EDITOR] Error saving playlist:', err);
      setError(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const totalDuration = selectedDesigns.reduce((sum, d) => sum + d.duration, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading playlist editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/playlist')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Playlists
          </button>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Edit Playlist</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Morning Announcements"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Optional description"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-gray-600">Designs:</span>
                <span className="ml-2 font-semibold text-gray-900">{selectedDesigns.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Duration:</span>
                <span className="ml-2 font-semibold text-gray-900">{totalDuration}s</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Designs */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Available Designs</h2>
              
              <div className="mb-4">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search designs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAvailableDesigns.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {searchTerm ? 'No designs found matching your search' : 'No available designs'}
                  </p>
                ) : (
                  filteredAvailableDesigns.map(design => (
                    <div
                      key={design.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                      onClick={() => handleAddDesign(design)}
                    >
                      <ImageIcon size={24} className="text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{design.metadata.title}</p>
                        <p className="text-sm text-gray-500">
                          {design.metadata.canvasWidth}×{design.metadata.canvasHeight}
                        </p>
                      </div>
                      <Plus size={20} className="text-primary" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Selected Designs (Playlist) */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Playlist Sequence</h2>
              
              {selectedDesigns.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No designs added yet</p>
                  <p className="text-sm text-gray-400">Click on designs from the left to add them</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  {selectedDesigns.map((design, index) => (
                    <div
                      key={design.designId}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selectedDesigns.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▼
                        </button>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {design.designData?.metadata.title || 'Unknown Design'}
                        </p>
                        <p className="text-sm text-gray-500">Order: {index + 1}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
                        <Clock size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">
                          {design.duration.toFixed(1)}s
                        </span>
                        <span className="text-xs text-blue-500">(Timeline)</span>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveDesign(design.designId)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving || selectedDesigns.length === 0 || !playlistName.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Playlist'}
              </button>
              
              {selectedDesigns.length === 0 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Add at least one design to save
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistEditor;
