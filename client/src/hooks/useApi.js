import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiError } from '../utils/format.js';

export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [state, setState] = useState({
    data: null,
    loading: enabled,
    error: null,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    fetcherRef
      .current()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (active) setState({ data: null, loading: false, error: getApiError(error) });
      });

    return () => {
      active = false;
    };
    // The caller controls refetching through the dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, version, ...deps]);

  const refetch = useCallback(() => setVersion((current) => current + 1), []);
  const setData = useCallback(
    (updater) => {
      setState((current) => ({
        ...current,
        data: typeof updater === 'function' ? updater(current.data) : updater,
      }));
    },
    []
  );

  return { ...state, refetch, setData };
}
