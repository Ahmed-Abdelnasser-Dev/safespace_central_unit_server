/**
 * Polygon Editor Dialog
 * 
 * Modal dialog for drawing lane polygons on camera feed
 * 
 * @component
 */

import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addLanePolygon, updateLanePolygon } from '../nodesSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../../components/ui/Button.jsx';

function PolygonEditorDialog({ node, polygon, onClose }) {
  const dispatch = useDispatch();
  const canvasRef = useRef();
  const [points, setPoints] = useState(polygon?.points || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonName, setPolygonName] = useState(polygon?.name || `Lane ${node.lanePolygons.length + 1}`);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Use a placeholder image with a highway scene
    img.src = 'https://images.unsplash.com/photo-1489496900549-f21edf41dd20?w=800&h=450&fit=crop';
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      drawPolygon(ctx, img);
    };

    img.onerror = () => {
      // Fallback: draw a solid color
      canvas.width = 800;
      canvas.height = 450;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Click to draw polygon points', canvas.width / 2, canvas.height / 2);
      drawPolygon(ctx, { width: canvas.width, height: canvas.height });
    };
  }, [points]);

  const drawPolygon = (ctx, img) => {
    ctx.drawImage(img, 0, 0);

    if (points.length === 0) return;

    // Scale points to canvas
    const scaledPoints = points.map(p => ({
      x: (p[1] + 74) * 100,
      y: (p[0] - 40) * 100,
    }));

    // Draw lines between points
    ctx.strokeStyle = 'rgb(59, 130, 246)';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    scaledPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    if (scaledPoints.length > 2) {
      ctx.closePath();
      ctx.fill();
    }
    ctx.stroke();

    // Draw points
    ctx.fillStyle = 'rgb(59, 130, 246)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    scaledPoints.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert canvas coordinates back to lat/long (simplified)
    const lat = (y / 100) + 40;
    const long = (x / 100) - 74;

    setPoints([...points, [lat, long]]);
  };

  const handleUndo = () => {
    setPoints(points.slice(0, -1));
  };

  const handleClear = () => {
    setPoints([]);
  };

  const handleSave = () => {
    if (points.length < 3) {
      alert('Polygon must have at least 3 points');
      return;
    }

    const newPolygon = {
      id: polygon?.id || `poly-${Date.now()}`,
      name: polygonName,
      type: 'lane',
      points,
    };

    if (polygon) {
      dispatch(updateLanePolygon({
        nodeId: node.id,
        polygonId: polygon.id,
        polygon: newPolygon,
      }));
    } else {
      dispatch(addLanePolygon({
        nodeId: node.id,
        polygon: newPolygon,
      }));
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-safe-border">
          <h2 className="text-lg font-semibold text-safe-text-dark">
            Polygon Editor - {node.id}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-safe-bg rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon="xmark" className="text-lg text-safe-text-gray" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Polygon Name Input */}
          <div>
            <label className="text-sm font-medium text-safe-text-dark mb-1 block">
              Polygon Name
            </label>
            <input
              type="text"
              value={polygonName}
              onChange={(e) => setPolygonName(e.target.value)}
              className="w-full px-3 py-2 border border-safe-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safe-blue/20"
            />
          </div>

          {/* Canvas */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <FontAwesomeIcon icon="pen" className="text-safe-blue text-sm" />
              <label className="text-sm font-medium text-safe-text-dark">
                Click to draw polygon points ({points.length})
              </label>
            </div>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full border-2 border-dashed border-safe-border rounded-lg cursor-crosshair bg-black"
            />
          </div>

          {/* Instructions */}
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-medium mb-1">How to draw:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Click on the image to add polygon points</li>
              <li>Minimum 3 points required to create a polygon</li>
              <li>Use Undo to remove the last point</li>
              <li>Use Clear to start over</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-safe-border bg-safe-bg">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={points.length === 0}
            >
              <FontAwesomeIcon icon="rotate-left" className="mr-1" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={points.length === 0}
            >
              <FontAwesomeIcon icon="trash" className="mr-1" />
              Clear
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={points.length < 3}
            >
              <FontAwesomeIcon icon="floppy-disk" className="mr-1" />
              Save Polygon
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PolygonEditorDialog;
