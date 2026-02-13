/**
 * Road Configuration Tab Screen
 *
 * Configure lanes, lane status, and road speed limits
 *
 * @component
 */

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSelectedNode,
  updateNodeRoadRules,
  updateLaneStatus,
  addLane,
  removeLane,
  updateNode,
} from "../nodesSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faArrowRight,
  faArrowLeft,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import SectionHeader from "../components/layout/SectionHeader";
import SectionLabel from "../components/forms/SectionLabel";
import PrimaryButton from "../components/forms/PrimaryButton";
import ListItem from "../components/lists/ListItem";
import RoadStatusDisplay from "../components/sections/RoadStatusDisplay";
import { typography, fontFamily } from "../styles/typography";
import Modal from "../../../components/ui/Modal.jsx";
import Card from "../../../components/ui/Card.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";

function RoadConfigTab() {
  const dispatch = useDispatch();
  const node = useSelector(selectSelectedNode);
  const [speedLimit, setSpeedLimit] = useState(
    node?.roadRules?.speedLimit || 120,
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isAddLaneOpen, setIsAddLaneOpen] = useState(false);
  const [laneToDelete, setLaneToDelete] = useState(null);
  const [newLaneName, setNewLaneName] = useState("");
  const [newLaneType, setNewLaneType] = useState("");
  const [newLaneStatus, setNewLaneStatus] = useState("open");

  if (!node)
    return <div className="p-[16px] text-[#6a7282]">Select a node</div>;

  const laneStatusOptions = [
    {
      value: "open",
      label: "Open",
      icon: faCircleCheck,
      color: "#22c55e",
      bg: "#e8f5e9",
    },
    {
      value: "blocked",
      label: "Blocked",
      icon: faCircleXmark,
      color: "#d63e4d",
      bg: "#fee2e2",
    },
    {
      value: "right",
      label: "Right",
      icon: faArrowRight,
      color: "#247cff",
      bg: "#e3f2fd",
    },
    {
      value: "left",
      label: "Left",
      icon: faArrowLeft,
      color: "#247cff",
      bg: "#e3f2fd",
    },
  ];

  const handleSpeedLimitChange = (value) => {
    setSpeedLimit(value);
    setHasChanges(true);
  };

  const handleLaneStatusChange = (laneId, newStatus) => {
    dispatch(
      updateLaneStatus({
        nodeId: node.id,
        laneId,
        status: newStatus,
      }),
    );
    setHasChanges(true);
  };

  const getNextLaneId = () =>
    lanes.length > 0 ? Math.max(...lanes.map((l) => l.id)) + 1 : 1;

  const handleOpenAddLane = () => {
    const nextId = getNextLaneId();
    setNewLaneName(`Lane ${nextId}`);
    setNewLaneType("Custom Lane");
    setNewLaneStatus("open");
    setIsAddLaneOpen(true);
  };

  const handleConfirmAddLane = () => {
    const nextId = getNextLaneId();
    const trimmedName = newLaneName.trim();
    const trimmedType = newLaneType.trim();

    dispatch(
      addLane({
        nodeId: node.id,
        lane: {
          id: nextId,
          name: trimmedName || `Lane ${nextId}`,
          type: trimmedType || "Custom Lane",
          status: newLaneStatus,
        },
      }),
    );
    setHasChanges(true);
    setIsAddLaneOpen(false);
  };

  const handleOpenDeleteLane = (lane) => {
    setLaneToDelete(lane);
  };

  const handleConfirmDeleteLane = () => {
    if (!laneToDelete) return;
    dispatch(
      removeLane({
        nodeId: node.id,
        laneId: laneToDelete.id,
      }),
    );
    setHasChanges(true);
    setLaneToDelete(null);
  };

  const handleSaveConfig = () => {
    dispatch(
      updateNode({
        nodeId: node.id,
        updates: {
          roadRules: { ...node.roadRules, speedLimit },
        },
      }),
    );
    setHasChanges(false);
  };

  // Check if lanes exist
  const lanes = node?.roadRules?.lanes || [];

  return (
    <div className="p-[12px] sm:p-[14px] md:p-[16px] lg:p-[18px] xl:p-[20px] space-y-[14px] sm:space-y-[16px] md:space-y-[18px] lg:space-y-[20px] h-full overflow-y-auto">
      {/* Node Display Output */}
      <div className="space-y-[8px] sm:space-y-[10px] md:space-y-[12px]">
        <h4
          className="font-bold text-[#101828]"
          style={{
            fontSize: "clamp(14px, 1.5vw, 18px)",
            fontFamily,
          }}
        >
          Node Display Output
        </h4>
        <RoadStatusDisplay
          roadName={node.location?.address || node.name}
          speedLimit={speedLimit}
          lanes={lanes}
          laneStatusOptions={laneStatusOptions}
        />
      </div>

      {/* Divider & Section Title */}
      <SectionHeader title="Lane Configuration" showDivider={true} />

      {/* Lane Configuration */}
      <div className="space-y-[8px] sm:space-y-[10px] md:space-y-[12px] mt-[12px] sm:mt-[14px] lg:mt-[16px]">
        <div className="flex justify-between items-center">
          <span></span>
          <Button
            variant="ghost"
            onClick={handleOpenAddLane}
            className="!text-[#247cff] hover:!bg-blue-50"
          >
            + Add Lane
          </Button>
        </div>

        <div className="space-y-[6px] sm:space-y-[7px] md:space-y-[8px]">
          {lanes.length > 0 ? (
            lanes.map((lane) => (
              <ListItem
                key={lane.id}
                title={lane.name}
                subtitle={lane.type}
                actions={[
                  ...laneStatusOptions.map((status) => ({
                    label: status.label,
                    icon: (
                      <FontAwesomeIcon
                        icon={status.icon}
                        style={{ width: "12px", height: "12px" }}
                      />
                    ),
                    onClick: () =>
                      handleLaneStatusChange(lane.id, status.value),
                    variant:
                      lane.status === status.value ? "primary" : "default",
                  })),
                  {
                    label: "Remove",
                    icon: (
                      <FontAwesomeIcon
                        icon={faTrash}
                        style={{ width: "12px", height: "12px" }}
                      />
                    ),
                    onClick: () => handleOpenDeleteLane(lane),
                    variant: "danger",
                  },
                ]}
              />
            ))
          ) : (
            <div className="p-[10px] sm:p-[12px] md:p-[14px] bg-[#f7f8f9] border border-[#e5e7eb] rounded-[6px] sm:rounded-[7px] md:rounded-[8px] text-center">
              <p
                className="text-[#6a7282] text-center"
                style={{ fontSize: "clamp(13px, 1.2vw, 16px)", fontFamily }}
              >
                No lanes configured
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Speed Limit Configuration */}
      <div className="space-y-[8px] sm:space-y-[10px] md:space-y-[12px]">
        <SectionHeader title="Speed Limit Configuration" showDivider={true} />
        <div className="p-[10px] sm:p-[12px] md:p-[14px] bg-[#f7f8f9] rounded-[6px] sm:rounded-[7px] md:rounded-[8px] border border-[#e5e7eb]">
          <div className="flex items-center justify-between mb-[10px] sm:mb-[12px] md:mb-[14px]">
            <span
              className="font-medium text-[#101828]"
              style={{ fontSize: "clamp(12px, 1.2vw, 13px)", fontFamily }}
            >
              Speed Limit (km/h)
            </span>
            <span
              className="font-bold text-[#247cff]"
              style={{ fontSize: "clamp(16px, 2vw, 20px)", fontFamily }}
            >
              {speedLimit} km/h
            </span>
          </div>
          <input
            type="range"
            min="30"
            max="180"
            step="5"
            value={speedLimit}
            onChange={(e) => handleSpeedLimitChange(parseInt(e.target.value))}
            className="w-full h-2 bg-[#e5e7eb] rounded-lg appearance-none cursor-pointer accent-[#247cff]"
          />
          <div
            className="flex justify-between text-[#6a7282] mt-[8px] sm:mt-[10px]"
            style={{ fontSize: "clamp(11px, 1vw, 12px)", fontFamily }}
          >
            <span>30</span>
            <span>60</span>
            <span>90</span>
            <span>120</span>
            <span>150</span>
            <span>180</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <PrimaryButton
        onClick={handleSaveConfig}
        disabled={!hasChanges}
        icon="floppy-disk"
        text="Save Road Configuration"
      />

      {/* Add Lane Modal */}
      <Modal
        open={isAddLaneOpen}
        onClose={() => setIsAddLaneOpen(false)}
        size="md"
      >
        <Card className="bg-white rounded-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-[#e5e7eb]">
            <h3
              className="text-[#101828] font-bold"
              style={{ ...typography.heading2, fontFamily }}
            >
              Add New Lane
            </h3>
            <p
              className="text-[#6a7282] mt-2"
              style={{ ...typography.bodySmall, fontFamily }}
            >
              Define lane name, type, and status.
            </p>
          </div>

          <div className="px-8 py-6 space-y-6">
            <div>
              <label
                className="text-[#101828] font-semibold block mb-2"
                style={{ ...typography.label, fontFamily }}
              >
                Lane Name
              </label>
              <Input
                value={newLaneName}
                onChange={(e) => setNewLaneName(e.target.value)}
                placeholder="Lane 4"
              />
            </div>

            <div>
              <label
                className="text-[#101828] font-semibold block mb-2"
                style={{ ...typography.label, fontFamily }}
              >
                Lane Type
              </label>
              <Input
                value={newLaneType}
                onChange={(e) => setNewLaneType(e.target.value)}
                placeholder="Custom Lane"
              />
            </div>

            <div>
              <label
                className="text-[#101828] font-semibold block mb-3"
                style={{ ...typography.label, fontFamily }}
              >
                Lane Status
              </label>
              <div className="flex flex-wrap gap-3">
                {laneStatusOptions.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setNewLaneStatus(status.value)}
                    className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                      newLaneStatus === status.value
                        ? "border-[#247cff] bg-[#247cff]/10 text-[#247cff]"
                        : "border-[#e5e7eb] text-[#6a7282] hover:bg-[#f7f8f9]"
                    }`}
                    style={{ ...typography.bodySmall, fontFamily }}
                  >
                    <FontAwesomeIcon
                      icon={status.icon}
                      style={{
                        width: "14px",
                        height: "14px",
                        color: status.color,
                      }}
                    />
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Modal.Footer>
            <Button variant="ghost" onClick={() => setIsAddLaneOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmAddLane}>
              Add Lane
            </Button>
          </Modal.Footer>
        </Card>
      </Modal>

      {/* Delete Lane Modal */}
      <Modal
        open={!!laneToDelete}
        onClose={() => setLaneToDelete(null)}
        size="md"
      >
        <Card className="bg-white rounded-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-[#e5e7eb]">
            <h3
              className="text-[#101828] font-bold"
              style={{ ...typography.heading2, fontFamily }}
            >
              Delete Lane
            </h3>
            <p
              className="text-[#6a7282] mt-2"
              style={{ ...typography.bodySmall, fontFamily }}
            >
              This action cannot be undone.
            </p>
          </div>

          <div className="px-8 py-6">
            <p
              className="text-[#101828]"
              style={{ ...typography.body, fontFamily }}
            >
              Are you sure you want to delete{" "}
              <strong>{laneToDelete?.name}</strong>?
            </p>
          </div>

          <Modal.Footer>
            <Button variant="ghost" onClick={() => setLaneToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDeleteLane}>
              Delete
            </Button>
          </Modal.Footer>
        </Card>
      </Modal>
    </div>
  );
}

export default RoadConfigTab;
