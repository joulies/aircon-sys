import React, { useState, useEffect, useRef } from 'react';
import '../styles/toast.css';

function ToastNotification() {
  const [toasts, setToasts] = useState([]);
  const toastsRef = useRef(toasts);

  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  useEffect(() => {
    window.showToast = (message, type = 'info', duration = 4000) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);

      if (duration) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
      }

      return id;
    };

    return () => {
      delete window.showToast;
    };
  }, []);

  const closeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => closeToast(toast.id)}
        >
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={(e) => {
            e.stopPropagation();
            closeToast(toast.id);
          }}>×</button>
        </div>
      ))}
    </div>
  );
}

export default ToastNotification;
