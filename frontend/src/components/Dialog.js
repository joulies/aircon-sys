import React from 'react';
import '../styles/dialog.css';

function Dialog({ isOpen, message, onClose, onConfirm, title = 'Success', isConfirm = false }) {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <div className="dialog-header">
          <h2>{title}</h2>
        </div>
        <div className="dialog-content">
          <p>{message}</p>
        </div>
        <div className="dialog-footer">
          {isConfirm ? (
            <>
              <button className="dialog-button cancel" onClick={onClose}>
                Cancel
              </button>
              <button className="dialog-button" onClick={onConfirm}>
                OK
              </button>
            </>
          ) : (
            <button className="dialog-button" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dialog;
