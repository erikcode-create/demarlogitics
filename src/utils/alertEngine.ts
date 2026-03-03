import { Carrier, FollowUp, Load } from '@/types';
import { differenceInDays, parseISO, isToday, isPast } from 'date-fns';

export type AlertType = 'insurance' | 'documents' | 'followup' | 'ar_aging';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  entityId: string;
  entityType: 'carrier' | 'shipper' | 'load';
  date: string;
}

export function generateAlerts(
  carriers: Carrier[],
  followUps: FollowUp[],
  loads: Load[],
  today: Date = new Date()
): Alert[] {
  const alerts: Alert[] = [];

  // 1. Insurance Expiring
  carriers.forEach((carrier) => {
    if (!carrier.insuranceExpiry) return;
    const expiry = parseISO(carrier.insuranceExpiry);
    const daysUntil = differenceInDays(expiry, today);

    if (daysUntil < 0) {
      alerts.push({
        id: `ins-exp-${carrier.id}`,
        type: 'insurance',
        severity: 'critical',
        title: 'Insurance Expired',
        message: `${carrier.companyName} insurance expired ${Math.abs(daysUntil)} days ago.`,
        entityId: carrier.id,
        entityType: 'carrier',
        date: carrier.insuranceExpiry,
      });
    } else if (daysUntil <= 30) {
      alerts.push({
        id: `ins-warn-${carrier.id}`,
        type: 'insurance',
        severity: 'warning',
        title: 'Insurance Expiring Soon',
        message: `${carrier.companyName} insurance expires in ${daysUntil} days.`,
        entityId: carrier.id,
        entityType: 'carrier',
        date: carrier.insuranceExpiry,
      });
    }
  });

  // 2. Missing Documents
  carriers.forEach((carrier) => {
    const missing: string[] = [];
    if (!carrier.w9Uploaded) missing.push('W9');
    if (!carrier.insuranceCertUploaded) missing.push('Insurance Certificate');
    if (!carrier.carrierPacketUploaded) missing.push('Carrier Packet');

    if (missing.length > 0) {
      alerts.push({
        id: `doc-${carrier.id}`,
        type: 'documents',
        severity: missing.length >= 2 ? 'warning' : 'info',
        title: 'Missing Documents',
        message: `${carrier.companyName} is missing: ${missing.join(', ')}.`,
        entityId: carrier.id,
        entityType: 'carrier',
        date: today.toISOString().split('T')[0],
      });
    }
  });

  // 3. Follow-up Reminders
  followUps.forEach((fu) => {
    if (fu.completed) return;
    const fuDate = parseISO(fu.date);
    if (isPast(fuDate) || isToday(fuDate)) {
      const daysOverdue = differenceInDays(today, fuDate);
      alerts.push({
        id: `fu-${fu.id}`,
        type: 'followup',
        severity: daysOverdue > 3 ? 'warning' : 'info',
        title: 'Follow-up Due',
        message: `${fu.notes}${daysOverdue > 0 ? ` (${daysOverdue} days overdue)` : ' (due today)'}`,
        entityId: fu.shipperId,
        entityType: 'shipper',
        date: fu.date,
      });
    }
  });

  // 4. AR Aging
  loads.forEach((load) => {
    if (load.status !== 'invoiced' || !load.invoiceDate) return;
    const invDate = parseISO(load.invoiceDate);
    const daysOld = differenceInDays(today, invDate);

    if (daysOld >= 45) {
      alerts.push({
        id: `ar-crit-${load.id}`,
        type: 'ar_aging',
        severity: 'critical',
        title: 'Invoice Severely Past Due',
        message: `${load.loadNumber} invoice is ${daysOld} days old ($${load.invoiceAmount.toLocaleString()}).`,
        entityId: load.id,
        entityType: 'load',
        date: load.invoiceDate,
      });
    } else if (daysOld >= 30) {
      alerts.push({
        id: `ar-warn-${load.id}`,
        type: 'ar_aging',
        severity: 'warning',
        title: 'Invoice Aging',
        message: `${load.loadNumber} invoice is ${daysOld} days old ($${load.invoiceAmount.toLocaleString()}).`,
        entityId: load.id,
        entityType: 'load',
        date: load.invoiceDate,
      });
    }
  });

  // Sort: critical first, then warning, then info
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}
