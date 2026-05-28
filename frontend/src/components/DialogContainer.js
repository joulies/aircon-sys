import React, { useState, useEffect } from 'react';
import Dialog from './Dialog';
import { setDialogCallback, setConfirmCallback } from '../utils/alertDialog';
import '../styles/dialog.css';

function DialogContainer() {
  const [dialogs, setDialogs] = useState([]);

  useEffect(() => {
    setDialogCallback((message, title) => {
      const id = Date.now() + Math.random();
      setDialogs(prev => [...prev, { id, message, title, isConfirm: false }]);

      setTimeout(() => {
        setDialogs(prev => prev.filter(d => d.id !== id));
      }, 3000);
    });

    setConfirmCallback((message, title, onConfirm, onCancel) => {
      const id = Date.now() + Math.random();
      setDialogs(prev => [...prev, {
        id,
        message,
        title,
        isConfirm: true,
        onConfirm,
        onCancel
      }]);
    });
  }, []);

  const handleClose = (id, confirmed = false) => {
    const dialog = dialogs.find(d => d.id === id);
    if (confirmed && dialog?.onConfirm) {
      dialog.onConfirm();
    } else if (!confirmed && dialog?.onCancel) {
      dialog.onCancel();
    }
    setDialogs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <>
      {dialogs.map(dialog => (
        <Dialog
          key={dialog.id}
          isOpen={true}
          message={dialog.message}
          title={dialog.title}
          isConfirm={dialog.isConfirm}
          onClose={() => handleClose(dialog.id, false)}
          onConfirm={() => handleClose(dialog.id, true)}
        />
      ))}
    </>
  );
}

export default DialogContainer;
