import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CITIES } from '../utils/constants.js';

const LocationContext = createContext(null);
const STORAGE_KEY = 'cravio_city';

function initialCity() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return CITIES.find((city) => city.name === saved) || CITIES[0];
  } catch {
    return CITIES[0];
  }
}

export function LocationProvider({ children }) {
  const [city, setCityState] = useState(initialCity);

  const setCity = useCallback((cityName) => {
    const next = CITIES.find((item) => item.name === cityName) || CITIES[0];
    setCityState(next);
    window.localStorage.setItem(STORAGE_KEY, next.name);
  }, []);

  const value = useMemo(
    () => ({ city, setCity, cities: CITIES }),
    [city, setCity]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
