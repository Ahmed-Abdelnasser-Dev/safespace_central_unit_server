/**
 * Polygon Editor Dialog
 * 
 * Modal dialog for drawing lane polygons on camera feed
 * 
 * @component
 */

import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateNodePolygons } from '../nodesSlice';
import { useNodeVideoFeed } from '../../../hooks/useNodeVideoFeed';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../../components/ui/Button.jsx';

function PolygonEditorDialog({ node, polygon, onClose }) {
  const dispatch = useDispatch();
  const canvasRef = useRef();
  const { currentFrame, lastSnapshot } = useNodeVideoFeed();
  const normalizePoints = (pts) => (pts || []).map((p) => {
    if (typeof p?.x === 'number' && typeof p?.y === 'number') return p;
    if (Array.isArray(p) && p.length >= 2) return { x: p[0], y: p[1] };
    return null;
  }).filter(Boolean);

  const [points, setPoints] = useState(normalizePoints(polygon?.points));
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonName, setPolygonName] = useState(polygon?.name || 'Lane Polygon');
  const [toolMode, setToolMode] = useState('draw'); // draw | edit
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartPointsRef = useRef(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [videoAspect, setVideoAspect] = useState({ width: 16, height: 9 });
  const videoSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    if (currentFrame?.frameData) {
      img.src = `data:image/jpeg;base64,${currentFrame.frameData}`;
    } else if (lastSnapshot?.snapshotPath) {
      img.src = `${baseUrl}${lastSnapshot.snapshotPath}`;
    } else {
      img.src = 'https://images.unsplash.com/photo-1489496900549-f21edf41dd20?w=800&h=450&fit=crop';
    }
    
    img.onload = () => {
      if (img.width > 0 && img.height > 0) {
        const isVideoFrame = Boolean(currentFrame?.frameData);
        if (isVideoFrame || videoSizeRef.current.width === 0) {
          videoSizeRef.current = { width: img.width, height: img.height };
          setVideoAspect({ width: img.width, height: img.height });
        }
      }

      const targetWidth = videoSizeRef.current.width || img.width;
      const targetHeight = videoSizeRef.current.height || img.height;

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      drawPolygon(ctx);
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
      drawPolygon(ctx);
    };
  }, [points, currentFrame, lastSnapshot]);

  const drawPolygon = (ctx) => {

    if (points.length === 0) return;

    // Draw lines between points
    ctx.strokeStyle = 'rgb(59, 130, 246)';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    if (points.length > 2) {
      ctx.closePath();
      ctx.fill();
    }
    ctx.stroke();

    // Draw points
    ctx.fillStyle = 'rgb(59, 130, 246)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    points.forEach((p, idx) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = idx === selectedPointIndex ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)';
      ctx.fill();
      ctx.stroke();
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (toolMode !== 'draw') return;

    setUndoStack((prev) => [...prev, points]);
    setRedoStack([]);
    setPoints([...points, { x, y }]);
  };

  const findNearestPoint = (x, y, radius = 10) => {
    let nearestIndex = null;
    let nearestDist = Infinity;

    points.forEach((p, idx) => {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius && dist < nearestDist) {
        nearestIndex = idx;
        nearestDist = dist;
      }
    });

    return nearestIndex;
  };

  const handleMouseDown = (e) => {
    if (toolMode !== 'edit') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const idx = findNearestPoint(x, y);
    if (idx === null) return;

    setSelectedPointIndex(idx);
    setIsDragging(true);
    dragStartPointsRef.current = points;
    dragOffsetRef.current = {
      x: points[idx].x - x,
      y: points[idx].y - y,
    };
  };

  const handleMouseMove = (e) => {
    if (toolMode !== 'edit' || !isDragging || selectedPointIndex === null) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const nextPoints = [...points];
    nextPoints[selectedPointIndex] = {
      x: Math.max(0, Math.min(canvas.width, x + dragOffsetRef.current.x)),
      y: Math.max(0, Math.min(canvas.height, y + dragOffsetRef.current.y)),
    };

    setPoints(nextPoints);
  };

  const handleMouseUp = () => {
    if (toolMode !== 'edit') return;
    setIsDragging(false);
    if (dragStartPointsRef.current) {
      const startPoints = dragStartPointsRef.current;
      const changed = startPoints.some((p, idx) => p.x !== points[idx]?.x || p.y !== points[idx]?.y);
      if (changed) {
        setUndoStack((prev) => [...prev, startPoints]);
        setRedoStack([]);
      }
    }
    dragStartPointsRef.current = null;
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack((prev) => [...prev, points]);
    setPoints(previous);
    setSelectedPointIndex(null);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack((prev) => [...prev, points]);
    setPoints(next);
    setSelectedPointIndex(null);
  };

  const handleClear = () => {
    if (points.length === 0) return;
    setUndoStack((prev) => [...prev, points]);
    setRedoStack([]);
    setPoints([]);
    setSelectedPointIndex(null);
  };

  const handleSave = () => {
    if (points.length < 3) {
      alert('Polygon must have at least 3 points');
      return;
    }

    const canvas = canvasRef.current;
    const newPolygon = {
      id: polygon?.id || `poly-${Date.now()}`,
      name: polygonName,
      laneNumber: polygon?.laneNumber, // Preserve lane association
      type: 'lane',
      points,
      baseWidth: canvas?.width || 0,
      baseHeight: canvas?.height || 0,
      isEmpty: false, // Mark as defined
    };

    const updatedPolygons = polygon?.id
      ? node.lanePolygons.map((p) => (p.id === polygon.id ? newPolygon : p))
      : [...(node.lanePolygons || []), newPolygon];

    dispatch(updateNodePolygons({
      nodeId: node.id,
      lanePolygons: updatedPolygons,
    }));

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

          {/* Canvas + Tool Sidebar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-[64px] bg-[#f7f8f9] border border-[#e5e7eb] rounded-lg p-2 flex flex-col gap-2 items-center">
              <Button
                variant={toolMode === 'draw' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setToolMode('draw');
                  setSelectedPointIndex(null);
                }}
                title="Add point"
                aria-label="Add point"
              >
                <FontAwesomeIcon icon="plus" />
              </Button>
              <Button
                variant={toolMode === 'edit' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setToolMode('edit')}
                title="Move points"
                aria-label="Move points"
              >
                <FontAwesomeIcon icon="arrows-up-down-left-right" />
              </Button>
              <div className="w-full h-px bg-[#e5e7eb]" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                title="Undo"
                aria-label="Undo"
              >
                <FontAwesomeIcon icon="rotate-left" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title="Redo"
                aria-label="Redo"
              >
                <FontAwesomeIcon icon="rotate-right" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={points.length === 0}
                title="Clear points"
                aria-label="Clear points"
              >
                <FontAwesomeIcon icon="broom" />
              </Button>
              <div className="w-full h-px bg-[#e5e7eb]" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedPointIndex === null) return;
                  setUndoStack((prev) => [...prev, points]);
                  setRedoStack([]);
                  const nextPoints = points.filter((_, idx) => idx !== selectedPointIndex);
                  setPoints(nextPoints);
                  setSelectedPointIndex(null);
                }}
                disabled={selectedPointIndex === null}
                title="Delete selected point"
                aria-label="Delete selected point"
              >
                <FontAwesomeIcon icon="trash" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPointIndex(null)}
                title="Clear selection"
                aria-label="Clear selection"
              >
                <FontAwesomeIcon icon="circle-xmark" />
              </Button>
            </div>

            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={toolMode === 'edit' ? 'location-dot' : 'pen'} className="text-safe-blue text-sm" />
                <label className="text-sm font-medium text-safe-text-dark">
                  {toolMode === 'edit' ? 'Drag points to move them' : `Click to draw polygon points (${points.length})`}
                </label>
              </div>
              <div
                className="relative w-full border-2 border-dashed border-safe-border rounded-lg bg-black"
                style={{ aspectRatio: `${videoAspect.width} / ${videoAspect.height}` }}
              >
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className={`absolute inset-0 w-full h-full rounded-lg ${toolMode === 'edit' ? 'cursor-move' : 'cursor-crosshair'}`}
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-medium mb-1">How to draw:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Click on the image to add polygon points</li>
              <li>Switch to Move Points to reposition points</li>
              <li>Minimum 3 points required to create a polygon</li>
              <li>Use Undo to remove the last point</li>
              <li>Use Clear to start over</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-safe-border bg-safe-bg">
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
