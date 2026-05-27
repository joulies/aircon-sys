import React, { createContext, useState, useCallback } from 'react';

export const DialogContext = createContext();

export function DialogProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);

  const showDialog = useCallback((message, title = 'Message', duration = null) => {
    const id = Date.now();
    setDialogs(prev => [...prev, { id, message, title }]);

    if (duration) {
      setTimeout(() => {
        setDialogs(prev => prev.filter(d => d.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const closeDialog = useCallback((id) => {
    setDialogs(prev => prev.filter(d => d.id !== id));
  }, []);

  return (
    <DialogContext.Provider value={{ showDialog, closeDialog }}>
      {children}
    </DialogContext.Provider>
  );
}
