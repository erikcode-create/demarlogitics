import { describe, expect, it } from 'vitest';

import { applyDispatchToLoads } from './dispatchLoadState';
import type { Load } from '@/types';
import { normalizePhone } from '@/utils/phone';

describe('applyDispatchToLoads', () => {
  it('keeps the dispatched driver assignment in local load state', () => {
    const loads = [
      {
        id: 'load-1',
        loadNumber: '703273',
        shipperId: 'shipper-1',
        origin: 'Portland, OR',
        destination: 'Boise, ID',
        pickupDate: '2026-04-15',
        deliveryDate: '2026-04-16',
        shipperRate: 0,
        carrierRate: 2200,
        weight: 42000,
        equipmentType: 'dry_van',
        status: 'booked',
        podUploaded: false,
        invoiceNumber: '',
        invoiceDate: '',
        invoiceAmount: 0,
        paymentStatus: 'pending',
        referenceNumber: '',
        notes: '',
        createdAt: '2026-04-18T00:00:00.000Z',
        driverPhone: '1112223333',
        driverName: 'Apple Reviewer',
      },
    ] satisfies Load[];

    const next = applyDispatchToLoads(
      loads,
      'load-1',
      '9283002384',
      '',
      '2026-04-18T19:55:00.000Z'
    );

    expect(next).toEqual([
      expect.objectContaining({
        id: 'load-1',
        status: 'dispatched',
        driverPhone: '9283002384',
        driverName: undefined,
        dispatchedAt: '2026-04-18T19:55:00.000Z',
      }),
    ]);
  });
});

describe('normalizePhone', () => {
  it('strips punctuation from phone numbers', () => {
    expect(normalizePhone('(928) 300-2384')).toBe('9283002384');
  });

  it('drops a leading US country code', () => {
    expect(normalizePhone('+1 (928) 300-2384')).toBe('9283002384');
  });
});
