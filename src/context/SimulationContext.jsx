import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_SIMULATION } from '../constants/simulationDefaults.js';
import { getHourlyData } from '../utils/energyCalculations.js';

const STORAGE_KEY = 'modugrid:sim';

const SimulationContext = createContext(null);

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SIMULATION;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SIMULATION, ...parsed, hardwareConnected: false };
  } catch {
    return DEFAULT_SIMULATION;
  }
}

export function SimulationProvider({ children }) {
  const initial = loadInitial();
  const [panelCapacity, setPanelCapacity] = useState(initial.panelCapacity);
  const [batteryCapacity, setBatteryCapacity] = useState(initial.batteryCapacity);
  const [blockCount, setBlockCount] = useState(initial.blockCount);
  const [apartmentCount, setApartmentCount] = useState(initial.apartmentCount);
  const [selectedMonth, setSelectedMonth] = useState(initial.selectedMonth);
  const [selectedApartment, setSelectedApartment] = useState(initial.selectedApartment);
  const hardwareConnected = DEFAULT_SIMULATION.hardwareConnected;

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          panelCapacity,
          batteryCapacity,
          blockCount,
          apartmentCount,
          selectedMonth,
          selectedApartment,
        })
      );
    } catch {
      // storage quota / private mode — sessiz geç
    }
  }, [
    panelCapacity,
    batteryCapacity,
    blockCount,
    apartmentCount,
    selectedMonth,
    selectedApartment,
  ]);

  useEffect(() => {
    function onStorage(e) {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue);
        if (typeof next.panelCapacity === 'number') setPanelCapacity(next.panelCapacity);
        if (typeof next.batteryCapacity === 'number') setBatteryCapacity(next.batteryCapacity);
        if (typeof next.blockCount === 'number') setBlockCount(next.blockCount);
        if (typeof next.apartmentCount === 'number') setApartmentCount(next.apartmentCount);
        if (typeof next.selectedMonth === 'number') setSelectedMonth(next.selectedMonth);
        if (typeof next.selectedApartment === 'string') setSelectedApartment(next.selectedApartment);
      } catch {
        // ignore
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const reset = useCallback(() => {
    setPanelCapacity(DEFAULT_SIMULATION.panelCapacity);
    setBatteryCapacity(DEFAULT_SIMULATION.batteryCapacity);
    setBlockCount(DEFAULT_SIMULATION.blockCount);
    setApartmentCount(DEFAULT_SIMULATION.apartmentCount);
    setSelectedMonth(DEFAULT_SIMULATION.selectedMonth);
    setSelectedApartment(DEFAULT_SIMULATION.selectedApartment);
  }, []);

  const hourlyData = useMemo(
    () => getHourlyData(panelCapacity, apartmentCount, batteryCapacity, selectedMonth),
    [panelCapacity, apartmentCount, batteryCapacity, selectedMonth]
  );

  const value = useMemo(
    () => ({
      panelCapacity,
      setPanelCapacity,
      batteryCapacity,
      setBatteryCapacity,
      blockCount,
      setBlockCount,
      apartmentCount,
      setApartmentCount,
      selectedMonth,
      setSelectedMonth,
      selectedApartment,
      setSelectedApartment,
      hardwareConnected,
      hourlyData,
      reset,
    }),
    [
      panelCapacity,
      batteryCapacity,
      blockCount,
      apartmentCount,
      selectedMonth,
      selectedApartment,
      hardwareConnected,
      hourlyData,
      reset,
    ]
  );

  return (
    <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return ctx;
}
