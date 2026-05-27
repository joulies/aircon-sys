import React, { useState, useEffect, useRef } from 'react';
import Dialog from './Dialog';
import { setDialogCallback } from '../utils/alertDialog';
import '../styles/dialog.css';

function DialogContainer() {
  const [dialogs, setDialogs] = useState([]);
  const dialogsRef = useRef(dialogs);

  useEffect(() => {
    dialogsRef.current = dialogs;
  }, [dialogs]);

  useEffect(() => {
    setDialogCallback((message, title) => {
      const id = Date.now() + Math.random();
      setDialogs(prev => [...prev, { id, message, title }]);

      setTimeout(() => {
        setDialogs(prev => prev.filter(d => d.id !== id));
      }, 3000);
    });
  }, []);

  const handleClose = (id) => {
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
          onClose={() => handleClose(dialog.id)}
        />
      ))}
    </>
  );
}

export default DialogContainer;
