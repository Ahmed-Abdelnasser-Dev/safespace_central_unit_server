/**
 * Network Map Card - Pixel Perfect Figma Design
 * 
 * Displays the network map with node markers and legend
 * 
 * @component
 */

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectNode, selectAllNodes, selectSelectedNodeId } from '../../nodesSlice';
import Map, { Marker } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function NetworkMapCard() {
  const dispatch = useDispatch();
  const nodes = useSelector(selectAllNodes);
  const selectedNodeId = useSelector(selectSelectedNodeId);

  // Calculate status counts
  const counts = nodes.reduce((acc, node) => {
    if (node.status === 'online') acc.online++;
    else if (node.status === 'offline') acc.offline++;
    else acc.warning++;
    return acc;
  }, { online: 0, warning: 0, offline: 0 });

  const handleMarkerClick = (nodeId) => {
    dispatch(selectNode(nodeId));
  };

  return (
    <div 
      className="bg-white border border-[#e5e7eb] rounded-[8px] sm:rounded-[10px] lg:rounded-[13.684px] shadow-sm overflow-hidden flex flex-col flex-1 w-full h-full"
    >
      {/* Header */}
      <div className="border-b border-[#e5e7eb] flex items-center justify-between px-[12px] sm:px-[14px] md:px-[16px] h-[40px] sm:h-[44px] md:h-[48px] bg-gradient-to-r from-[#f7f8f9] to-white flex-shrink-0">
        <h3 
          className="font-bold text-[#101828]"
          style={{ fontSize: 'clamp(12px, 1.3vw, 13px)', lineHeight: '18.642px', fontFamily: 'Arimo, sans-serif' }}
        >
          Network Map
        </h3>
        
        {/* Legend */}
        <div className="flex items-center gap-[8px] sm:gap-[10px] md:gap-[12px]">
          {/* Green nodes */}
          <div className="flex items-center gap-[4px] sm:gap-[6px]">
            <div className="w-[6px] h-[6px] sm:w-[7px] sm:h-[7px] rounded-full bg-[#4caf50] flex-shrink-0" />
            <span 
              className="text-[#6a7282] font-medium"
              style={{ fontSize: 'clamp(9px, 1vw, 9.114px)', lineHeight: '13.671px', fontFamily: 'Arimo, sans-serif' }}
            >
              Online ({counts.online})
            </span>
          </div>

          {/* Orange nodes */}
          <div className="flex items-center gap-[4px] sm:gap-[6px]">
            <div className="w-[6px] h-[6px] sm:w-[7px] sm:h-[7px] rounded-full bg-[#ff9800] flex-shrink-0" />
            <span 
              className="text-[#6a7282] font-medium"
              style={{ fontSize: 'clamp(9px, 1vw, 9.114px)', lineHeight: '13.671px', fontFamily: 'Arimo, sans-serif' }}
            >
              Warning ({counts.warning})
            </span>
          </div>

          {/* Red nodes */}
          <div className="flex items-center gap-[4px] sm:gap-[6px]">
            <div className="w-[6px] h-[6px] sm:w-[7px] sm:h-[7px] rounded-full bg-[#d63e4d] flex-shrink-0" />
            <span 
              className="text-[#6a7282] font-medium"
              style={{ fontSize: 'clamp(9px, 1vw, 9.114px)', lineHeight: '13.671px', fontFamily: 'Arimo, sans-serif' }}
            >
              Offline ({counts.offline})
            </span>
          </div>
        </div>
      </div>

      {/* Map View - WITH PROPER HEIGHT */}
      <div className="p-[8px] sm:p-[10px] md:p-[12px] flex-1 relative w-full min-h-0">
        <Map
          mapLib={import('maplibre-gl')}
          initialViewState={{
            longitude: nodes[0]?.location.longitude || -74.0060,
            latitude: nodes[0]?.location.latitude || 40.7128,
            zoom: 11
          }}
          style={{ width: '100%', height: '100%', borderRadius: '6px', display: 'block' }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        >
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const statusColor = node.status === 'online' ? '#4caf50' : 
                               node.status === 'offline' ? '#e83e3e' : '#ffd333';

            return (
              <Marker
                key={node.id}
                longitude={node.location.longitude}
                latitude={node.location.latitude}
                anchor="center"
                onClick={() => handleMarkerClick(node.id)}
              >
                <div className="relative cursor-pointer">
                  {/* Outer Ring (pulse effect on selected) */}
                  <div 
                    className={`absolute rounded-full ${isSelected ? 'animate-ping' : ''}`}
                    style={{
                      width: '26.368px',
                      height: '26.368px',
                      backgroundColor: statusColor,
                      opacity: 0.4,
                      left: '-8.21px',
                      top: '-8.21px'
                    }}
                  />
                  {/* Inner Dot */}
                  <div 
                    className="rounded-full border-[1.364px] border-white"
                    style={{
                      width: '14.912px',
                      height: '14.912px',
                      backgroundColor: statusColor,
                      marginLeft: '-2.49px',
                      marginTop: '-2.49px'
                    }}
                  />
                </div>
              </Marker>
            );
          })}
        </Map>
      </div>
    </div>
  );
}
