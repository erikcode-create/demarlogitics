import { Load } from '@/types';

export function isArchivedLoad(load: Load) {
  return Boolean(load.archivedAt ?? load.deletedAt);
}

export function isVisibleLoad(load: Load) {
  return !isArchivedLoad(load);
}
