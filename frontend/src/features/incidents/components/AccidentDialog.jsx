import { useState, useMemo } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Tag from '../../../components/ui/Tag.jsx';
import ActionCard from './ActionCard.jsx';
import { confirmAccident, rejectAccident } from '../services/incidentDecisionService.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * AccidentDialog – Displays incoming accident details & suggested actions.
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {function} props.onConfirm - receives selected actions array
 * @param {object} props.incident - incident data
 */
function AccidentDialog({ open, onClose, incident, onDecision }) {
  const [selected, setSelected] = useState(['reduce-speed', 'block-routes', 'call-emergency']);

  const actions = useMemo(() => ([
    { id: 'reduce-speed', title: 'Reduce Speed Limit', description: 'Set speed limit to 40 km/h in surrounding area' },
    { id: 'block-routes', title: 'Block Affected Routes', description: 'Close lanes 2 and 3 to traffic' },
    { id: 'call-emergency', title: 'Call Emergency Services', description: 'Dispatch ambulance and fire department' }
  ]), []);

  const toggle = id => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleConfirm = async () => {
    try {
      const incidentId = incident?.incidentId || '';
      const nodeId = incident?.nodeId || 0;
      const res = await confirmAccident(incidentId, nodeId, selected);
      onDecision?.(res.decision);
    } catch (e) {
      console.error('Confirm error', e);
    } finally {
      onClose?.();
    }
  };

  const handleCancel = async () => {
    try {
      const incidentId = incident?.incidentId || '';
      const nodeId = incident?.nodeId || 0;
      const res = await rejectAccident(incidentId, nodeId);
      onDecision?.(res.decision);
    } catch (e) {
      console.error('Reject error', e);
    } finally {
      onClose?.();
    }
  };

  const timeString = incident?.timestamp ? new Date(incident.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-safe-danger to-safe-danger/90 text-white px-8 py-6 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-lg bg-white/25 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-sm">
            <FontAwesomeIcon icon="exclamation-triangle" className="text-xl drop-shadow" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 tracking-tight">New Accident Detected</h2>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded bg-white/25 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wide shadow-sm">Critical Severity</span>
              <span className="text-sm opacity-95 font-medium">{timeString}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-7 flex gap-8">
          {/* Left: Image & meta */}
            <div className="w-[420px] flex flex-col gap-6">
              <div className="rounded-lg overflow-hidden bg-gradient-to-br from-safe-gray-light/10 to-safe-gray-light/20 border border-safe-border h-[280px] flex items-center justify-center shadow-inner">
                {incident?.imageUrl ? (
                  incident?.mediaType === 'video' ? (
                    <video 
                      src={incident.imageUrl} 
                      className="object-cover w-full h-full"
                      controls
                      autoPlay
                      muted
                      onError={(e) => {
                        console.error('Video load error:', incident.imageUrl);
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="flex flex-col items-center gap-2"><svg class="text-safe-text-gray/40 text-2xl w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg><span class="text-xs text-safe-text-gray font-medium">Video failed to load</span></div>';
                      }}
                    />
                  ) : (
                    <img 
                      src={incident.imageUrl} 
                      alt="Accident frame" 
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        console.error('Image load error:', incident.imageUrl);
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="flex flex-col items-center gap-2"><svg class="text-safe-text-gray/40 text-2xl w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg><span class="text-xs text-safe-text-gray font-medium">Image failed to load</span></div>';
                      }}
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FontAwesomeIcon icon="exclamation-triangle" className="text-safe-text-gray/40 text-2xl" />
                    <span className="text-xs text-safe-text-gray font-medium">No media available</span>
                  </div>
                )}
              </div>
              <div className="space-y-5">
                <div className="bg-safe-bg/50 rounded-lg p-4 border border-safe-border/50">
                  <div className="flex items-center gap-2 text-[11px] text-safe-text-gray/80 mb-2.5 uppercase tracking-wider">
                    <div className="w-5 h-5 rounded bg-safe-blue-btn/10 flex items-center justify-center">
                      <FontAwesomeIcon icon="map-pin" className="text-safe-blue-btn text-xs" />
                    </div>
                    <span className="font-bold">Location</span>
                  </div>
                  <p className="text-base font-bold text-safe-text-dark">{incident?.locationName || 'Highway A1, Exit 23B'}</p>
                  <p className="text-sm text-safe-text-gray mt-1.5 font-medium">{incident?.latitude?.toFixed?.(4) || '40.7128'}° N, {incident?.longitude?.toFixed?.(4) || '74.0060'}° W</p>
                </div>
                <div className="bg-safe-bg/50 rounded-lg p-4 border border-safe-border/50">
                  <div className="flex items-center gap-2 text-[11px] text-safe-text-gray/80 mb-2.5 uppercase tracking-wider">
                    <div className="w-5 h-5 rounded bg-safe-danger/10 flex items-center justify-center">
                      <FontAwesomeIcon icon="gauge-high" className="text-safe-danger text-xs" />
                    </div>
                    <span className="font-bold">Affected Lanes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(incident?.lanes || ['Lane 2', 'Emergency Lane', 'Lane 3']).map(l => (
                      <Tag key={l} variant="danger">{l}</Tag>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          {/* Right: Suggested actions */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-safe-text-dark">AI Suggested Actions</h3>
                <p className="text-sm text-safe-text-gray mt-1.5 font-medium">Review and select actions to execute immediately</p>
              </div>
              <span className="px-3 py-1.5 rounded-md bg-safe-blue-btn/15 text-safe-blue-btn text-xs font-bold border border-safe-blue-btn/20">{selected.length} Selected</span>
            </div>
            <div className="flex flex-col gap-3.5">
              {actions.map(a => (
                <ActionCard
                  key={a.id}
                  title={a.title}
                  description={a.description}
                  selected={selected.includes(a.id)}
                  onToggle={() => toggle(a.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm}>Confirm Actions</Button>
        </Modal.Footer>
      </Card>
    </Modal>
  );
}

export default AccidentDialog;
