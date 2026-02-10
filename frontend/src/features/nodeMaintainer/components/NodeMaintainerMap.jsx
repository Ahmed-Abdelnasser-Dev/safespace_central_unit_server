/**
 * Node Maintainer Map Component
 * 
 * Displays an interactive map showing all nodes on the road network
 * 
 * @component
 */

import { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAllNodes, selectSelectedNodeId, selectNode } from '../nodesSlice';
import Map, { Marker } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

function NodeMaintainerMap() {
  const mapRef = useRef();
  const dispatch = useDispatch();
  const nodes = useSelector(selectAllNodes);
  const selectedNodeId = useSelector(selectSelectedNodeId);
  const [viewState, setViewState] = useState({
    longitude: -74.0060,
    latitude: 40.7128,
    zoom: 12,
  });

  const handleNodeSelect = (nodeId) => {
    dispatch(selectNode(nodeId));
    const node = nodes.find(n => n.id === nodeId);
    if (node && mapRef.current) {
      mapRef.current.flyTo({
        center: [node.location.long, node.location.lat],
        zoom: 14,
        duration: 1500,
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapLib={import('maplibre-gl')}
        mapStyle={{
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap Contributors',
              maxzoom: 19,
            },
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              paint: {
                'raster-opacity': 1,
              },
            },
          ],
        }}
      >
        {/* Render node markers */}
        {nodes.map(node => (
          <Marker
            key={node.id}
            longitude={node.location.long}
            latitude={node.location.lat}
            onClick={() => handleNodeSelect(node.id)}
          >
            <div
              className={`cursor-pointer transform transition-transform hover:scale-110 ${selectedNodeId === node.id ? 'scale-125' : 'scale-100'
                }`}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  shadow-lg border-2 transition-all
                  ${selectedNodeId === node.id
                    ? 'bg-safe-blue border-white scale-125'
                    : node.status === 'online'
                      ? 'bg-safe-success border-white'
                      : 'bg-safe-danger border-white'
                  }
                `}
              >
                <span className="text-white">
                  {node.id.split('-')[1]}
                </span>
              </div>
            </div>
          </Marker>
        ))}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg text-xs">
        <p className="font-semibold mb-2 text-safe-text-dark">Legend</p>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded-full bg-safe-success" />
          <span className="text-safe-text-gray">Online</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded-full bg-safe-danger" />
          <span className="text-safe-text-gray">Offline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-safe-blue border-2 border-white" />
          <span className="text-safe-text-gray">Selected</span>
        </div>
      </div>
    </div>
  );
}

export default NodeMaintainerMap;
