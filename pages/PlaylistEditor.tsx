
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Search, Clock, ImageIcon, Trash2, Edit, Plus } from 'lucide-react';
import {
  getPlaylistDetailsFromBackend,
  savePlaylistToBackend,
  syncPlaylistItemsToBackend
} from '../services/playlistService';
import { getAllDesigns, convertBackendToLocal } from '../services/designService';
import authService from '../services/authService';
import Swal from 'sweetalert2';

const PlaylistEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [availableDesigns, setAvailableDesigns] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // 1. Fetch User's Designs
        const designsRes = await getAllDesigns();
        const designs = designsRes.success ? designsRes.data?.map(convertBackendToLocal) || [] : [];
        setAvailableDesigns(designs);

        // 2. Fetch Playlist Data
        if (id) {
          const plRes = await getPlaylistDetailsFromBackend(id);
          if (plRes.success && plRes.data) {
            const pl = plRes.data;
            setPlaylistName(pl.name);
            setDescription(pl.description || '');

            const items = (pl.tblplaylistitems || []).map((item: any) => {
              const d = designs.find(des => des.id === item.designId);
              return {
                designId: item.designId,
                // Backend stores seconds, we use seconds internally
                duration: item.duration || 60,
                slno: item.slno,
                designData: d
              };
            });
            setSelectedItems(items.sort((a: any, b: any) => a.slno - b.slno));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const handleAddDesign = (design: any) => {
    // Default new item to 1 minute (60 seconds)
    setSelectedItems(prev => [...prev, {
      designId: design.id,
      duration: 60,
      slno: prev.length,
      designData: design
    }]);
  };

  const handleRemove = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    if ((index === 0 && direction === -1) || (index === selectedItems.length - 1 && direction === 1)) return;
    const newItems = [...selectedItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + direction];
    newItems[index + direction] = temp;
    setSelectedItems(newItems);
  };

  const handleDurationChange = (index: number, minutes: string) => {
    const val = parseFloat(minutes);
    if (isNaN(val) || val < 0.1) return; // Minimum limit

    const newItems = [...selectedItems];
    // Convert minutes to seconds for storage
    newItems[index] = { ...newItems[index], duration: Math.floor(val * 60) };
    setSelectedItems(newItems);
  };

  const handleModify = (designId: string) => {
    window.open(`/#/editor/${designId}`, '_blank');
  };

  const handlePreviewItem = (designId: string) => {
    window.open(`/#/preview/${designId}`, '_blank');
  };

  const handleSave = async () => {
    if (!id || !playlistName) return;
    setSaving(true);

    try {
      const user = authService.getUser();

      // 1. Update Name/Desc
      await savePlaylistToBackend({
        id,
        name: playlistName,
        description,
        userID: user?.id
      });

      // 2. Sync Items (Send duration in seconds)
      const itemsToSync = selectedItems.map((item, idx) => ({
        designId: item.designId,
        slno: idx,
        duration: item.duration
      }));

      await syncPlaylistItemsToBackend(id, itemsToSync, user?.id);

      await Swal.fire({
        icon: 'success',
        title: 'Playlist Saved',
        text: 'Your playlist has been successfully updated.',
        timer: 1500,
        showConfirmButton: false
      });

      navigate('/playlist');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'An error occurred while saving the playlist.',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredDesigns = availableDesigns.filter(d =>
    d.metadata.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/playlist')} className="hover:bg-gray-100 p-2 rounded-full transition"><ArrowLeft /></button>
          <div>
            <input
              value={playlistName}
              onChange={e => setPlaylistName(e.target.value)}
              className="text-xl font-bold border-none focus:ring-0 p-0 placeholder-gray-300"
              placeholder="Playlist Name"
            />
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="text-sm text-gray-500 border-none focus:ring-0 p-0 w-full placeholder-gray-300"
              placeholder="Add description..."
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save Playlist'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Available Designs */}
        <div className="w-1/3 border-r bg-white flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                className="w-full pl-10 p-2 bg-gray-100 rounded-lg border-transparent focus:bg-white focus:border-blue-500 transition-all"
                placeholder="Search Designs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredDesigns.map(d => (
              <div key={d.id} onClick={() => handleAddDesign(d)} className="group flex items-center gap-3 p-3 border rounded-xl hover:border-blue-500 hover:shadow-md cursor-pointer transition-all bg-white">
                <div className="w-16 h-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                  <ImageIcon size={20} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.metadata.title}</div>
                  <div className="text-xs text-gray-500">{d.metadata.canvasWidth}x{d.metadata.canvasHeight}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={18} className="text-blue-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Sequence */}
        <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-gray-700">Playback Sequence</h2>
              <span className="text-sm text-gray-500">{selectedItems.length} Items</span>
            </div>

            {selectedItems.length === 0 ? (
              <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                Select designs from the left to build your playlist
              </div>
            ) : (
              selectedItems.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 group border border-transparent hover:border-blue-200 transition-all">

                  {/* Order Controls */}
                  <div className="flex flex-col gap-1 text-gray-300">
                    <button onClick={() => handleMove(idx, -1)} className="hover:text-blue-600 transition-colors">▲</button>
                    <button onClick={() => handleMove(idx, 1)} className="hover:text-blue-600 transition-colors">▼</button>
                  </div>

                  {/* Index Badge */}
                  <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>

                  {/* Design Info */}
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{item.designData?.metadata.title}</div>
                    <div className="text-xs text-gray-400">Design Duration: {Math.round((item.designData?.designJSON?.timeline?.totalDuration || 10000) / 1000)}s</div>
                  </div>

                  {/* DURATION INPUT (The Core Change) */}
                  <div className="flex items-center gap-3 bg-blue-50 p-2 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-600" />
                      <span className="text-xs font-bold text-blue-700 uppercase">Duration:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className="w-16 bg-white border border-blue-200 rounded px-2 py-1 text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
                        value={item.duration ? (item.duration / 60).toFixed(1) : ''}
                        onChange={(e) => handleDurationChange(idx, e.target.value)}
                      />
                      <span className="text-xs text-gray-500 font-medium">Min</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {/* ✅ OLD STYLE ACTION BUTTONS */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleModify(item.designId)}
                      className="bg-[#1e293b] text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      Modify
                    </button>
                    <button
                      onClick={() => handlePreviewItem(item.designId)}
                      className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Preview
                    </button>
                  </div>

                  {/* Divider & Delete */}
                  <div className="w-px h-8 bg-gray-200 mx-2"></div>

                  <button
                    onClick={() => handleRemove(idx)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-2"
                    title="Remove from playlist"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="w-px h-8 bg-gray-200 mx-2"></div>

                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistEditor;