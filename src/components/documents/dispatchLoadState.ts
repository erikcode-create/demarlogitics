import type { Load } from '@/types';

export function applyDispatchToLoads(
  loads: Load[],
  loadId: string,
  driverPhone: string,
  driverName: string,
  dispatchedAt: string
): Load[] {
  return loads.map((load) => (
    load.id === loadId
      ? {
          ...load,
          status: 'dispatched',
          driverPhone,
          driverName: driverName || undefined,
          dispatchedAt,
        }
      : load
  ));
}
