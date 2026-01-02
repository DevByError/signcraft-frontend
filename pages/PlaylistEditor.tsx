import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Clock, GripVertical, Save, Image as ImageIcon, Search, RefreshCw } from 'lucide-react';
import { 
  getPlaylistById, 
  updatePlaylist, 
  addDesignToPlaylist, 
  removeDesignFromPlaylist,
  getPlaylistDetailsFromBackend,
  savePlaylistToBackend,
  syncPlaylistItemsToBackend
} from '../services/playlistService';
import authService from '../services/authService';
import { listDesignLocals, StoredDesign } from '../services/localDesignStore';
import { getAllDesigns, convertBackendToLocal } from '../services/designService';
import type { PlaylistDocument, PlaylistDesignReference } from '../services/playlistService';

interface DesignInPlaylist extends PlaylistDesignReference {
  designData?: StoredDesign;
}

const PlaylistEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [playlist, setPlaylist] = useState<PlaylistDocument | null>(null);
  const [availableDesigns, setAvailableDesigns] = useState<StoredDesign[]>([]);
  const [selectedDesigns, setSelectedDesigns] = useState<DesignInPlaylist[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');

  // Function to fetch designs
  const fetchDesigns = async () => {
    let designs: StoredDesign[] = [];
    
    // Get current user ID
    const currentUser = authService.getUser();
    const currentUserId = currentUser?.id;
    
    // Try backend first
    console.log('🎨 [PLAYLIST_EDITOR] Fetching designs from backend...');
    const backendDesignsResponse = await getAllDesigns();
    
    if (backendDesignsResponse.success && backendDesignsResponse.data) {
      console.log(`✅ [PLAYLIST_EDITOR] Loaded ${backendDesignsResponse.data.length} designs from backend`);
      // Filter by current user
      const convertedDesigns = backendDesignsResponse.data.map(convertBackendToLocal);
      designs = convertedDesigns.filter(d => (d as any).userId === currentUserId || !(d as any).userId);
    } else {
      console.log('⚠️ [PLAYLIST_EDITOR] Backend designs unavailable, using localStorage...');
    }
    
    // Merge with localStorage designs
    const localDesigns = await listDesignLocals();
    const localDesignIds = new Set(designs.map(d => d.id));
    // Filter local designs and exclude already fetched designs
    const uniqueLocalDesigns = localDesigns.filter(d => 
      !localDesignIds.has(d.id)
    );
    designs = [...designs, ...uniqueLocalDesigns];
    
    console.log(`📦 [PLAYLIST_EDITOR] Total designs available for user: ${designs.length}`);
    return designs;
  };

  // Fetch playlist and designs from backend with fallback
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let playlistDoc: any = null;

        // Try backend first
        if (id) {
          console.log('📋 [PLAYLIST_EDITOR] Attempting to load from backend...');
          const backendResponse = await getPlaylistDetailsFromBackend(id);
          
          if (backendResponse.success && backendResponse.data) {
            console.log('✅ [PLAYLIST_EDITOR] Loaded from backend');
            playlistDoc = backendResponse.data;
            setIsOnlineMode(true);
            
            // Convert backend format to local format
            const convertedPlaylist: PlaylistDocument = {
              id: playlistDoc.id,
              userId: playlistDoc.userId || authService.getUser()?.id || 'guest-user-123',
              userEmail: playlistDoc.userEmail || authService.getUser()?.email || 'guest@signcraft.com',
              name: playlistDoc.name,
              description: playlistDoc.description || '',
              designReferences: (playlistDoc.tblplaylistitems || []).map((item: any) => ({
                designId: item.designId,
                duration: item.duration,
                order: item.slno
              })),
              totalDuration: 0,
              isPublic: false,
              createdAt: playlistDoc.createdAt || new Date().toISOString(),
              updatedAt: playlistDoc.updatedAt || new Date().toISOString()
            };
            playlistDoc = convertedPlaylist;
          } else {
            // Fallback to localStorage
            console.log('⚠️ [PLAYLIST_EDITOR] Backend unavailable, using localStorage...');
            console.error('❌ [PLAYLIST_EDITOR] Backend error:', backendResponse.msg);
            playlistDoc = await getPlaylistById(id);
            setIsOnlineMode(false);
            // Only show error if we couldn't load from backend AND localStorage
            if (!playlistDoc) {
              setError(`Failed to load playlist: ${backendResponse.msg || 'Unknown error'}`);
            }
          }

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
        const designs = await fetchDesigns();
        setAvailableDesigns(designs);

        // Load current playlist designs with their data
        if (playlistDoc && playlistDoc.designReferences && playlistDoc.designReferences.length > 0) {
          const designsInPlaylist: DesignInPlaylist[] = playlistDoc.designReferences.map((ref: PlaylistDesignReference) => {
            const designData = designs.find(d => d.id === ref.designId);
            return {
              ...ref,
              designData
            };
          });
          setSelectedDesigns(designsInPlaylist);
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
    const matchesSearch = (design.metadata.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    return !isAlreadySelected && matchesSearch;
  });

  const handleRefreshDesigns = async () => {
    try {
      setRefreshing(true);
      const designs = await fetchDesigns();
      setAvailableDesigns(designs);
      console.log('✅ [PLAYLIST_EDITOR] Designs refreshed');
    } catch (err) {
      console.error('❌ [PLAYLIST_EDITOR] Error refreshing designs:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddDesign = (design: StoredDesign) => {
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

      let backendSuccess = false;

      // Try backend first if online
      if (isOnlineMode) {
        try {
          // Save playlist name/description
          const nameResult = await savePlaylistToBackend({
            id,
            name: playlistName,
            description: playlistDescription,
            userID: authService.getUser()?.id || 'guest-user-123'
          });
          
          if (nameResult.success) {
            console.log('✅ [PLAYLIST_EDITOR] Playlist name saved to backend');
            
            // Sync playlist items
            const items = selectedDesigns.map(({ designId, duration, order }) => ({
              designId,
              slno: order,
              duration
            }));
            
            const itemsResult = await syncPlaylistItemsToBackend(id, items, authService.getUser()?.id || 'guest-user-123');
            
            if (itemsResult.success) {
              console.log('✅ [PLAYLIST_EDITOR] Playlist items synced to backend');
              backendSuccess = true;
            } else {
              console.warn('⚠️ [PLAYLIST_EDITOR] Backend items sync failed:', itemsResult.msg);
            }
          } else {
            console.warn('⚠️ [PLAYLIST_EDITOR] Backend save failed:', nameResult.msg);
          }
        } catch (backendErr) {
          console.error('❌ [PLAYLIST_EDITOR] Backend error:', backendErr);
        }
      }

      // Always save to localStorage as well for offline support
      const localResult = await updatePlaylist(id, {
        name: playlistName,
        description: playlistDescription,
        designReferences
      });

      if (localResult.success || backendSuccess) {
        console.log('✅ [PLAYLIST_EDITOR] Playlist saved successfully');
        setError(null);
        // Show brief success message then navigate
        setTimeout(() => {
          navigate('/playlist');
        }, 500);
      } else {
        setError(localResult.error || 'Failed to save playlist');
        console.error('❌ [PLAYLIST_EDITOR] Save failed:', localResult.error);
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
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Edit Playlist</h1>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 ${isOnlineMode ? 'bg-green-500' : 'bg-yellow-500'} rounded-full animate-pulse`}></div>
                <span className="text-gray-600">{isOnlineMode ? 'Online mode' : 'Offline mode'}</span>
              </div>
            </div>
            
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Available Designs</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefreshDesigns}
                    disabled={refreshing}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-all disabled:opacity-50"
                    title="Refresh designs"
                  >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${isOnlineMode ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {isOnlineMode ? '🟢 Backend' : '🟡 Local'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {availableDesigns.length} total
                  </span>
                </div>
              </div>
              
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
                  <div className="text-center py-8">
                    {availableDesigns.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-gray-500">No designs available</p>
                        <p className="text-sm text-gray-400">Create designs in the Editor first</p>
                        <button
                          onClick={() => navigate('/editor')}
                          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors"
                        >
                          Go to Editor
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-500">No designs found matching your search</p>
                    )}
                  </div>
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
