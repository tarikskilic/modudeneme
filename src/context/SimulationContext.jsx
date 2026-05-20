import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_SIMULATION,
  getInvestmentCosts,
  SLIDER_RANGES,
} from '../constants/simulationDefaults.js';
import { getHourlyData } from '../utils/energyCalculations.js';

const STORAGE_KEY = 'modugrid:sim';

const SimulationContext = createContext(null);

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SIMULATION;
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULT_SIMULATION, ...parsed, hardwareConnected: false };
    const { min, max, step } = SLIDER_RANGES.batteryCapacity;
    if (typeof merged.batteryCapacity === 'number') {
      // Eski simülasyon hedefi (500 kWh) → proje BESS hedefi (45 kWh)
      if (merged.batteryCapacity >= 250) {
        merged.batteryCapacity = DEFAULT_SIMULATION.batteryCapacity;
      } else {
        const snapped =
          Math.round((merged.batteryCapacity - min) / step) * step + min;
        merged.batteryCapacity = Math.min(max, Math.max(min, snapped));
      }
    }
    return merged;
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
  const [costScenario, setCostScenario] = useState(
    initial.costScenario ?? DEFAULT_SIMULATION.costScenario
  );
  const hardwareConnected = DEFAULT_SIMULATION.hardwareConnected;

  const investmentCosts = useMemo(
    () => getInvestmentCosts(costScenario),
    [costScenario]
  );

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
          costScenario,
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
    costScenario,
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
        if (typeof next.costScenario === 'string') setCostScenario(next.costScenario);
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
    setCostScenario(DEFAULT_SIMULATION.costScenario);
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
      costScenario,
      setCostScenario,
      investmentCosts,
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
      costScenario,
      investmentCosts,
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
