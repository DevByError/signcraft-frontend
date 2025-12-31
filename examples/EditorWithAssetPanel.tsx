import React, { useEffect, useRef } from 'react';
import AssetManagerPanel from '../components/AssetManagerPanel';
import { registerCanvasDropTarget } from '../utils/assetHelpers';

const EditorWithAssetPanel: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    return registerCanvasDropTarget(canvasRef.current, (assetId) => {
      console.log('Insert asset into canvas:', assetId);
      // TODO: Call your element creation logic linking assetId
    });
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      <div className="col-span-1">
        <AssetManagerPanel onInsertAsset={(asset) => console.log('Insert asset', asset.id)} />
      </div>
      <div className="col-span-3">
        <div ref={canvasRef} className="h-[600px] bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
          <div className="text-gray-500">Drop assets here</div>
        </div>
      </div>
    </div>
  );
};

export default EditorWithAssetPanel;
