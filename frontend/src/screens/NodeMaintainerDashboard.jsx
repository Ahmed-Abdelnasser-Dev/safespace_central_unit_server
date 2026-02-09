/**
 * Node Maintainer Dashboard - Responsive Design
 * 
 * Adaptive layout that scales across all screen sizes:
 * - Sidebar: fixed width with scroll
 * - Left section (map + nodes list): 35% on 1080p, 40% on 1440p+
 * - Right section (node details): responsive flex
 * - All spacing and font sizes scale proportionally
 * 
 * @component
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSelectedNode, selectCurrentTab, setCurrentTab } from '../features/nodeMaintainer/nodesSlice';
import NodeMaintainerSidebar from '../features/nodeMaintainer/components/NodeMaintainerSidebar.jsx';
import NodeMaintainerHeader from '../features/nodeMaintainer/components/NodeMaintainerHeader.jsx';
import NetworkMapCard from '../features/nodeMaintainer/components/cards/NetworkMapCard.jsx';
import NodesListCard from '../features/nodeMaintainer/components/NodesList.jsx';
import OverviewTab from '../features/nodeMaintainer/screens/OverviewTab.jsx';
import RoadConfigTab from '../features/nodeMaintainer/screens/RoadConfigTab.jsx';
import NodeConfigTab from '../features/nodeMaintainer/screens/NodeConfigTab.jsx';
import HealthTab from '../features/nodeMaintainer/screens/HealthTab.jsx';
import PolygonsTab from '../features/nodeMaintainer/screens/PolygonsTab.jsx';
import PolygonEditorDialog from '../features/nodeMaintainer/components/PolygonEditorDialog.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function NodeMaintainerDashboard() {
  const dispatch = useDispatch();
  const selectedNode = useSelector(selectSelectedNode);
  const currentTab = useSelector(selectCurrentTab);
  const [showPolygonEditor, setShowPolygonEditor] = useState(false);
  const [editingPolygon, setEditingPolygon] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'eye' },
    { id: 'roadConfig', label: 'Road Configuration', icon: 'road' },
    { id: 'nodeConfig', label: 'Node Configuration', icon: 'gear' },
    { id: 'health', label: 'Health', icon: 'heart-pulse' },
    { id: 'polygons', label: 'Polygons', icon: 'map' },
  ];

  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewTab />;
      case 'roadConfig':
        return <RoadConfigTab />;
      case 'nodeConfig':
        return <NodeConfigTab />;
      case 'health':
        return <HealthTab />;
      case 'polygons':
        return <PolygonsTab onEditPolygon={(poly) => {
          setEditingPolygon(poly);
          setShowPolygonEditor(true);
        }} onAddPolygon={() => {
          setEditingPolygon(null);
          setShowPolygonEditor(true);
        }} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="flex h-screen w-full overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(143.67381513661007deg, rgb(249, 250, 251) 0%, rgb(243, 244, 246) 100%)'
      }}
    >
      {/* Sidebar */}
      <NodeMaintainerSidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <NodeMaintainerHeader />

        {/* Content Area - Responsive Layout */}
        <div className="flex gap-[12px] lg:gap-[16px] xl:gap-[20px] px-[12px] lg:px-[16px] xl:px-[20px] py-[12px] lg:py-[16px] xl:py-[20px] overflow-hidden flex-1 h-full">
          {/* Left Section: Map and Nodes List */}
          {/* 35% on 1080p (lg), 38% on 1440p (xl), 40% on 2xl+ */}
          <div 
            className="w-[35%] lg:w-[38%] xl:w-[40%] 2xl:w-[42%] flex flex-col gap-[8px] lg:gap-[12px] xl:gap-[16px] overflow-hidden"
          >
            <div className="h-1/2 overflow-hidden">
              <NetworkMapCard />
            </div>
            <div className="h-1/2 overflow-hidden">
              <NodesListCard />
            </div>
          </div>

          {/* Right Section: Node Details Panel */}
          {selectedNode && (
            <div className="flex-1 flex flex-col gap-[12px] lg:gap-[16px] xl:gap-[20px] overflow-hidden min-w-0">
              {/* Node Header with Status */}
              <div className="bg-white border border-[#e5e7eb] rounded-[8px] lg:rounded-[10px] xl:rounded-[13.684px] px-[14px] lg:px-[16px] xl:px-[20px] py-[12px] lg:py-[14px] xl:py-[15px] shadow-sm flex-shrink-0">
                <div className="flex items-center justify-between mb-[8px] lg:mb-[10px]">
                  <div className="flex items-center gap-[6px] lg:gap-[8px] min-w-0 flex-wrap">
                    <div 
                      className="rounded-full flex-shrink-0" 
                      style={{ 
                        width: '8px', 
                        height: '8px',
                        backgroundColor: selectedNode.status === 'online' ? '#4caf50' : '#d63e4d'
                      }} 
                    />
                    <h2 
                      className="font-bold text-[#101828] truncate"
                      style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', fontFamily: 'Arimo, sans-serif' }}
                    >
                      {selectedNode.id}
                    </h2>
                    <span 
                      className={`px-[10px] lg:px-[12px] py-[3px] lg:py-4px] rounded-[4px] lg:rounded-[6px] font-medium flex-shrink-0 ${
                        selectedNode.status === 'online'
                          ? 'bg-[#e8f5e9] text-[#4caf50]'
                          : 'bg-[#fce4ec] text-[#d63e4d]'
                      }`}
                      style={{ fontSize: 'clamp(10px, 1.2vw, 11px)', fontFamily: 'Arimo, sans-serif' }}
                    >
                      {selectedNode.status}
                    </span>
                  </div>
                </div>

                <p 
                  className="text-[#6a7282] mb-[12px] lg:mb-[14px] xl:mb-[15px] font-normal truncate"
                  style={{ fontSize: 'clamp(11px, 1.1vw, 12px)', fontFamily: 'Arimo, sans-serif' }}
                >
                  {selectedNode.location.address}
                </p>

                {/* Tabs - Horizontal scroll on smaller screens */}
                <div className="flex gap-[6px] lg:gap-[8px] overflow-x-auto -mx-[14px] lg:-mx-[16px] xl:-mx-[20px] px-[14px] lg:px-[16px] xl:px-[20px] pb-[4px]">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => dispatch(setCurrentTab(tab.id))}
                      className={`px-[12px] lg:px-[14px] py-[6px] lg:py-[8px] rounded-[6px] lg:rounded-[8px] flex items-center gap-[4px] lg:gap-[6px] whitespace-nowrap font-medium transition-all duration-200 flex-shrink-0 ${
                        currentTab === tab.id
                          ? 'bg-[#247cff] text-white shadow-sm'
                          : 'bg-[#f7f8f9] text-[#6a7282] hover:bg-[#e8e9ea]'
                      }`}
                      style={{ fontSize: 'clamp(10px, 1vw, 11px)', fontFamily: 'Arimo, sans-serif' }}
                    >
                      <FontAwesomeIcon icon={tab.icon} style={{ width: '10px', height: '10px' }} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 bg-white border border-[#e5e7eb] rounded-[8px] lg:rounded-[10px] xl:rounded-[13.684px] overflow-y-auto shadow-sm min-h-0">
                {renderTabContent()}
              </div>
            </div>
          )}

          {/* Placeholder when no node is selected */}
          {!selectedNode && (
            <div className="flex-1 flex items-center justify-center bg-white/50 border border-[#e5e7eb] rounded-[8px] lg:rounded-[10px] xl:rounded-[13.684px]">
              <div className="text-center px-[20px]">
                <FontAwesomeIcon 
                  icon="circle-info" 
                  className="text-[#99a1af] mb-[12px]" 
                  style={{ width: 'clamp(32px, 5vw, 48px)', height: 'clamp(32px, 5vw, 48px)' }}
                />
                <p 
                  className="text-[#6a7282]"
                  style={{ fontSize: 'clamp(12px, 1.2vw, 14px)', fontFamily: 'Arimo, sans-serif' }}
                >
                  Select a node from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Polygon Editor Dialog */}
      {showPolygonEditor && (
        <PolygonEditorDialog
          node={selectedNode}
          polygon={editingPolygon}
          onClose={() => {
            setShowPolygonEditor(false);
            setEditingPolygon(null);
          }}
        />
      )}
    </div>
  );
}
