import React, { useMemo, useRef } from 'react';
import { useAssetsStore } from '../stores/assetsStore';
import type { Asset, AssetType } from '../types/assets';
import { Upload, Grid3X3, List, Search, Images, Trash2, Copy, Pencil, FileJson, Link as LinkIcon } from 'lucide-react';

interface Props {
  onInsertAsset?: (asset: Asset) => void; // Canvas-side handler
}

const typeLabel: Record<AssetType, string> = {
  image: 'Image', video: 'Video', audio: 'Audio', icon: 'Icon', svg: 'SVG', font: 'Font', template: 'Template'
};

export const AssetManagerPanel: React.FC<Props> = ({ onInsertAsset }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const {
    assets, viewMode, filter,
    addFiles, addUrl, renameAsset, duplicateAsset, deleteAsset,
    setViewMode, setFilter, exportJSON, importJSON
  } = useAssetsStore();

  const items = useMemo(() => {
    let list = Object.values(assets);
    if (filter.type) list = list.filter(a => a.type === filter.type);
    if (filter.folderId) list = list.filter(a => a.folderId === filter.folderId);
    if (filter.search) list = list.filter(a => (a.name || '').toLowerCase().includes(filter.search!.toLowerCase()));
    list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return list;
  }, [assets, filter]);

  const onDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files: File[] = [];
    const dt = e.dataTransfer;
    if (dt.items) {
      for (const item of Array.from(dt.items)) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    } else {
      for (const file of Array.from(dt.files)) files.push(file);
    }
    if (files.length) await addFiles(files);
  };

  const onDragStartAsset = (asset: Asset, e: React.DragEvent) => {
    e.dataTransfer.setData('application/asset', JSON.stringify({ assetId: asset.id, type: asset.type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleInsert = (asset: Asset) => {
    if (onInsertAsset) onInsertAsset(asset);
  };

  const handleUploadClick = () => inputRef.current?.click();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) await addFiles(files);
    e.target.value = '';
  };

  const handlePasteUrl = () => {
    const url = window.prompt('Paste data: URL or blob: URL');
    if (url) addUrl(url);
  };

  const handleExportJSON = () => {
    const data = exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try { 
      importJSON(JSON.parse(text)); 
    } catch { 
      alert('Invalid JSON'); 
    }
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Images className="text-primary" size={20} />
          <h3 className="font-semibold">Assets</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleUploadClick} className="px-3 py-1.5 bg-primary text-white rounded-md flex items-center gap-1 text-sm">
            <Upload size={16} /> Upload
          </button>
          <button onClick={handlePasteUrl} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md flex items-center gap-1 text-sm">
            <LinkIcon size={16} /> Paste URL
          </button>
          <input ref={inputRef} type="file" multiple hidden onChange={handleFileChange} />
          <button onClick={handleExportJSON} className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md flex items-center gap-1 text-sm" title="Export JSON">
            <FileJson size={16} /> Export
          </button>
          <label className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md flex items-center gap-1 text-sm cursor-pointer" title="Import JSON">
            <FileJson size={16} /> Import
            <input ref={importInputRef} type="file" accept="application/json" hidden onChange={handleImportJSON} />
          </label>
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode==='grid'?'bg-gray-200':''}`} title="Grid view"><Grid3X3 size={16}/></button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode==='list'?'bg-gray-200':''}`} title="List view"><List size={16}/></button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search assets..."
              value={filter.search || ''}
              onChange={e => setFilter({ search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <select
            value={filter.type || ''}
            onChange={e => setFilter({ type: (e.target.value || undefined) as AssetType })}
            className="px-2 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Types</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="svg">SVG</option>
            <option value="icon">Icon</option>
          </select>
        </div>

        <div
          className="rounded-lg border-2 border-dashed border-gray-300 p-4 mb-4 text-center text-gray-600"
          onDragOver={e => e.preventDefault()}
          onDrop={onDropFiles}
        >
          Drag and drop files here to import
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map(a => (
              <div key={a.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                <div
                  className="bg-gray-50 h-28 flex items-center justify-center cursor-grab"
                  draggable
                  onDragStart={e => onDragStartAsset(a, e)}
                  onDoubleClick={() => handleInsert(a)}
                >
                  {a.type === 'image' || a.type === 'svg' || a.type === 'icon' ? (
                    <img src={a.src} alt={a.name} className="max-h-24 object-contain" loading="lazy" />
                  ) : a.type === 'video' ? (
                    <video src={a.src} className="max-h-24" preload="metadata" />
                  ) : a.type === 'audio' ? (
                    <div className="text-gray-500 text-sm">Audio</div>
                  ) : (
                    <div className="text-gray-500 text-sm">{typeLabel[a.type]}</div>
                  )}
                </div>
                <div className="p-2 text-xs">
                  <div className="font-medium truncate" title={a.name}>{a.name}</div>
                  <div className="text-gray-500 flex justify-between mt-1">
                    <span>{typeLabel[a.type]}</span>
                    <span>{(a.size/1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => {
                      const name = prompt('Rename asset', a.name);
                      if (name) renameAsset(a.id, name);
                    }}><Pencil size={14}/></button>
                    <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => duplicateAsset(a.id)}><Copy size={14}/></button>
                    <button className="px-2 py-1 bg-red-100 text-red-700 rounded" onClick={() => {
                      const res = deleteAsset(a.id);
                      if (!res.success) alert(`Asset used ${res.usageCount} times in designs`);
                    }}><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y border border-gray-200 rounded-lg">
            {items.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2">
                <div
                  className="w-16 h-12 bg-gray-50 flex items-center justify-center cursor-grab"
                  draggable
                  onDragStart={e => onDragStartAsset(a, e)}
                  onDoubleClick={() => handleInsert(a)}
                >
                  {a.type === 'image' || a.type === 'svg' || a.type === 'icon' ? (
                    <img src={a.src} alt={a.name} className="max-h-10 object-contain" loading="lazy" />
                  ) : a.type === 'video' ? (
                    <video src={a.src} className="max-h-10" preload="metadata" />
                  ) : (
                    <div className="text-gray-500 text-xs">{typeLabel[a.type]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{a.name}</div>
                  <div className="text-gray-500 text-xs">{typeLabel[a.type]} • {(a.size/1024).toFixed(1)} KB</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => {
                    const name = prompt('Rename asset', a.name);
                    if (name) renameAsset(a.id, name);
                  }}><Pencil size={14}/></button>
                  <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => duplicateAsset(a.id)}><Copy size={14}/></button>
                  <button className="px-2 py-1 bg-red-100 text-red-700 rounded" onClick={() => {
                    const res = deleteAsset(a.id);
                    if (!res.success) alert(`Asset used ${res.usageCount} times in designs`);
                  }}><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No assets yet. Upload files or paste URLs.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetManagerPanel;
