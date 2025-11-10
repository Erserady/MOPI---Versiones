import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook personalizado para sincronización de datos con polling
 * @param {Function} fetchFunction - Función que obtiene los datos del backend
 * @param {number} interval - Intervalo de polling en milisegundos (default: 5000)
 * @param {boolean} autoStart - Si debe iniciar automáticamente (default: true)
 * @returns {Object} - { data, loading, error, refetch, startPolling, stopPolling }
 */
export function useDataSync(fetchFunction, interval = 5000, autoStart = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(autoStart);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchFunction();
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Error al cargar datos');
        console.error('Error en useDataSync:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFunction]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPolling) {
      // Cargar datos inmediatamente
      fetchData();

      // Configurar polling
      intervalRef.current = setInterval(() => {
        fetchData();
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isPolling, interval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
    isPolling,
  };
}

/**
 * Hook simplificado para cargar datos una sola vez
 * @param {Function} fetchFunction - Función que obtiene los datos
 * @returns {Object} - { data, loading, error, refetch }
 */
export function useFetchData(fetchFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFunction();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al cargar datos');
      console.error('Error en useFetchData:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
