import { Load } from '@/types';

export function isVisibleLoad(load: Load) {
  return !load.deletedAt;
}
