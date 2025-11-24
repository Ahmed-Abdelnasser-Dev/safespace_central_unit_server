import { useEffect } from 'react';
import Button from './Button.jsx';

/**
 * Global Modal container with backdrop.
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {React.ReactNode} props.children
 * @param {string} [props.size] - width sizing (md | lg)
 */
function Modal({ open, onClose, children, size = 'lg' }) {
  useEffect(() => {
    function esc(e) { if (e.key === 'Escape') onClose?.(); }
    if (open) window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { md: 'max-w-2xl', lg: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} mx-4 animate-slideUp`}>{children}</div>
    </div>
  );
}

Modal.Footer = function ModalFooter({ children }) {
  return <div className="flex items-center justify-end gap-3 px-8 py-5 bg-safe-bg/40 border-t border-safe-border rounded-b-xl">{children}</div>;
};

Modal.CloseButton = function ModalCloseButton({ onClick }) {
  return <Button variant="ghost" size="sm" onClick={onClick}>Close</Button>; };

export default Modal;
