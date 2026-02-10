/**
 * Overview Tab
 *
 * Comprehensive dashboard showing:
 * - Live camera feed (16:9 aspect ratio)
 * - Health metrics (CPU, Temperature, Network, Storage)
 * - Road status (lanes and speed limit)
 * - Node information (install date, heartbeat, IP, coordinates)
 *
 * @component
 */

import React from "react";
import { useSelector } from "react-redux";
import { selectSelectedNode } from "../nodesSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrochip,
  faTemperatureHalf,
  faWifi,
  faDatabase,
  faCircleCheck,
  faCircleXmark,
  faArrowRight,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import MetricCard from "../components/cards/MetricCard";
import SectionHeader from "../components/layout/SectionHeader";
import InfoRow from "../components/ui/InfoRow";
import ListItem from "../components/lists/ListItem";
import RoadStatusDisplay from "../components/sections/RoadStatusDisplay";
import LineChart from "../components/charts/LineChart";
import { typography, fontFamily } from "../styles/typography";

export default function OverviewTab() {
  const node = useSelector(selectSelectedNode);

  if (!node) return null;

  // Placeholder camera feed image - replace with actual video stream
  const cameraFeedPlaceholder =
    "https://images.unsplash.com/photo-1516639479238-57bbea3c81dd?w=1920&h=1080&fit=crop";

  // Sample lane data
  const lanes = node?.roadRules?.lanes || [];
  const speedLimit = node?.roadRules?.speedLimit || 120;

  // Mock data for charts
  const cpuData = Array.from({ length: 5 }, () => Math.floor(Math.random() * 50) + 20);
  const tempData = Array.from({ length: 5 }, () => Math.floor(Math.random() * 30) + 30);

  const laneStatusIcons = {
    open: { icon: faCircleCheck, color: "#22c55e", bg: "#e8f5e9", label: "Open" },
    blocked: { icon: faCircleXmark, color: "#d63e4d", bg: "#fee2e2", label: "Blocked" },
    right: { icon: faArrowRight, color: "#247cff", bg: "#e3f2fd", label: "Right" },
    left: { icon: faArrowLeft, color: "#247cff", bg: "#e3f2fd", label: "Left" },
  };

  // Convert laneStatusIcons object to array format for RoadStatusDisplay
  const laneStatusOptions = Object.entries(laneStatusIcons).map(([value, data]) => ({
    value,
    ...data
  }));

  return (
    <div className="p-[12px] sm:p-[14px] md:p-[16px] lg:p-[18px] xl:p-[20px] space-y-[14px] sm:space-y-[16px] md:space-y-[18px] lg:space-y-[20px] h-full overflow-y-auto">
      {/* ===== SECTION 1: CAMERA FEED ===== */}
      <div className="space-y-[8px] sm:space-y-[10px] md:space-y-[12px]">
        <h4
          className="font-bold text-[#101828]"
          style={{
            fontSize: 'clamp(14px, 1.5vw, 18px)',
            fontFamily,
          }}
        >
          Live Camera Feed
        </h4>

        <div
          className="relative bg-[#1a1a1a] rounded-[6px] sm:rounded-[7px] md:rounded-[8px] overflow-hidden w-full"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Camera Feed Image/Video */}
          <img
            src={cameraFeedPlaceholder}
            alt="Live camera feed"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* LIVE Badge */}
          <div
            className="absolute bg-[#fb2c36] rounded-[3px] flex items-center gap-[6px] px-[8px] py-[4px] shadow-md"
            style={{ top: "12px", left: "12px" }}
          >
            <div
              className="bg-white rounded-full opacity-60 animate-pulse"
              style={{ width: "4px", height: "4px" }}
            />
            <span
              className="text-white font-bold"
              style={{
                ...typography.labelSmall,
                fontFamily,
              }}
            >
              LIVE
            </span>
          </div>

          {/* Resolution Info */}
          <div
            className="absolute bg-black bg-opacity-80 rounded-[3px] px-[8px] py-[4px] shadow-md"
            style={{ bottom: "12px", left: "12px" }}
          >
            <span
              className="text-white font-normal"
              style={{
                ...typography.caption,
                fontFamily,
              }}
            >
              1920×1080 @ 30 FPS
            </span>
          </div>
        </div>
      </div>

      {/* ===== SECTION 2: HEALTH METRICS ===== */}
      <SectionHeader title="Health Metrics" showDivider={true} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[8px] sm:gap-[10px] md:gap-[12px] lg:gap-[14px]">
        <MetricCard
          label="CPU"
          value={node.health.cpu}
          unit="%"
          icon={faMicrochip}
          color="#3b82f6"
        />
        <MetricCard
          label="Temperature"
          value={node.health.temperature}
          unit="°C"
          icon={faTemperatureHalf}
          color="#f97316"
        />
        <MetricCard
          label="Network"
          value={node.health.network}
          unit="%"
          icon={faWifi}
          color="#22c55e"
        />
        <MetricCard
          label="Storage"
          value={node.health.storage}
          unit="%"
          icon={faDatabase}
          color="#a78bfa"
        />
      </div>

      {/* ===== SECTION 3: ROAD STATUS ===== */}
      <SectionHeader title="Road Status" showDivider={true} />

      <RoadStatusDisplay
        roadName={node.location?.address || node.name}
        speedLimit={speedLimit}
        lanes={lanes}
        laneStatusOptions={laneStatusOptions}
      />

      {/* ===== SECTION 4: NODE INFORMATION ===== */}
      <SectionHeader title="Node Information" showDivider={true} />

      <div className="bg-[#f7f8f9] rounded-[6px] sm:rounded-[7px] md:rounded-[8px] p-[12px] sm:p-[14px] md:p-[16px] border border-[#e5e7eb] space-y-[8px] sm:space-y-[10px] md:space-y-[12px]">
        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          <InfoRow label="Install Date" value="2024-01-15" />
        </div>

        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          <InfoRow label="Last Heartbeat" value="2 mins ago" />
        </div>

        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          <InfoRow label="IP Address" value={node.nodeSpecs.ipAddress} />
        </div>

        <InfoRow 
          label="Coordinates" 
          value={`${node.location.latitude?.toFixed(4)}, ${node.location.longitude?.toFixed(4)}`} 
        />
      </div>
    </div>
  );
}
