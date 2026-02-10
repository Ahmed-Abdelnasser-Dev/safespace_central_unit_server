/**
 * Polygons Tab Screen
 * 
 * Displays and manages lane polygons
 * 
 * @component
 */

import { useSelector } from 'react-redux';
import { selectSelectedNode } from '../nodesSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ListItem from '../components/lists/ListItem';
import EmptyState from '../components/lists/EmptyState';
import { typography, fontFamily } from '../styles/typography';

function PolygonsTab({ onAddPolygon, onEditPolygon, onDeletePolygon }) {
  const node = useSelector(selectSelectedNode);

  if (!node) return <div>Select a node</div>;

  return (
    <div className="p-[20px] space-y-[20px]">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#101828]" style={{ ...typography.heading2, fontFamily }}>
          Lane Polygons ({node.lanePolygons?.length || 0})
        </h3>
        <button
          onClick={onAddPolygon}
          className="px-[14px] py-[10px] bg-[#247cff] text-white rounded-[8px] font-bold transition-all duration-200 hover:bg-[#1a5dcc] shadow-sm flex items-center gap-[8px]"
          style={{ ...typography.label, fontFamily }}
        >
          <FontAwesomeIcon icon="plus" style={{ width: '12px', height: '12px' }} />
          Add Polygon
        </button>
      </div>

      <div className="space-y-[8px]">
        {!node.lanePolygons || node.lanePolygons.length === 0 ? (
          <EmptyState
            icon="map"
            title="No polygons defined yet"
            message="Create the first polygon to get started"
          />
        ) : (
          node.lanePolygons.map((polygon) => (
            <ListItem
              key={polygon.id}
              title={polygon.name}
              subtitle={`${polygon.points?.length || 0} points`}
              actions={[
                {
                  label: 'Edit',
                  icon: <FontAwesomeIcon icon="pen" style={{ width: '12px', height: '12px' }} />,
                  onClick: () => onEditPolygon(polygon),
                  variant: 'default'
                },
                {
                  label: 'Delete',
                  icon: <FontAwesomeIcon icon="trash" style={{ width: '12px', height: '12px' }} />,
                  onClick: () => onDeletePolygon?.(polygon),
                  variant: 'danger'
                }
              ]}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default PolygonsTab;
