import { useEffect } from 'react';
import { useVehicleStore } from '@stores/vehicleStore';

/**
 * Araçları otomatik olarak yükler ve vehicleStore'u expose eder.
 * Component mount'ta fetchVehicles() çağrılır.
 */
export function useVehicles() {
  const store = useVehicleStore();

  useEffect(() => {
    store.fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
