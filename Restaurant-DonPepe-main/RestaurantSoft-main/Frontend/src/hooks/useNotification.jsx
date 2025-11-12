import { useState, useCallback } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback(({ type, title, message, duration }) => {
    setNotification({ type, title, message, duration });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    hideNotification
  };
};
