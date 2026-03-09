import { SalesTask, OutboundCall, SalesStage, StageChangeLog } from '@/types';
import { addDays, format, differenceInDays, isAfter } from 'date-fns';

const cadenceSchedule: { day: number; type: 'call' | 'email' | 'linkedin_reminder'; title: string; templateId?: string }[] = [
  { day: 1, type: 'call', title: 'Day 1: Initial Call' },
  { day: 1, type: 'email', title: 'Day 1: Intro – Regional West Coast Capacity', templateId: 'tpl1' },
  { day: 3, type: 'call', title: 'Day 3: Follow-Up Call' },
  { day: 5, type: 'email', title: 'Day 5: Lane Question', templateId: 'tpl2' },
  { day: 7, type: 'linkedin_reminder', title: 'Day 7: LinkedIn Reminder' },
  { day: 10, type: 'email', title: 'Day 10: Backup Capacity Value Email', templateId: 'tpl3' },
  { day: 14, type: 'email', title: 'Day 14: Close the Loop', templateId: 'tpl4' },
];

export function generateCadenceTasks(shipperId: string, startDate: Date = new Date()): SalesTask[] {
  return cadenceSchedule.map((item, i) => ({
    id: crypto.randomUUID(),
    shipperId,
    type: item.type,
    title: item.title,
    description: `Auto-generated cadence task for Day ${item.day}`,
    dueDate: format(addDays(startDate, item.day), 'yyyy-MM-dd'),
    completed: false,
    completedAt: '',
    templateId: item.templateId,
    cadenceDay: item.day,
    createdAt: new Date().toISOString(),
  }));
}

export interface AutomationResult {
  stageChanges: { shipperId: string; newStage: SalesStage }[];
  newTasks: SalesTask[];
  alerts: { shipperId: string; message: string; severity: 'warning' | 'critical' }[];
}

export function evaluateAutomationRules(
  outboundCalls: OutboundCall[],
  salesTasks: SalesTask[],
  shippers: { id: string; salesStage: SalesStage; companyName: string }[],
  stageChangeLogs: StageChangeLog[],
  contracts: { entityId: string; status: string; createdAt: string }[]
): AutomationResult {
  const result: AutomationResult = { stageChanges: [], newTasks: [], alerts: [] };
  const now = new Date();

  for (const shipper of shippers) {
    // Rule 1: If latest call outcome = spoke_quote_requested and stage != quoting
    const shipperCalls = outboundCalls.filter(c => c.shipperId === shipper.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (shipperCalls.length > 0 && shipperCalls[0].callOutcome === 'spoke_quote_requested' && shipper.salesStage !== 'quoting') {
      result.stageChanges.push({ shipperId: shipper.id, newStage: 'quoting' });
      result.newTasks.push({
        id: crypto.randomUUID(),
        shipperId: shipper.id,
        type: 'call',
        title: '24-Hour Quote Follow-Up',
        description: `Follow up on quote request from ${shipper.companyName}`,
        dueDate: format(addDays(now, 1), 'yyyy-MM-dd'),
        completed: false,
        completedAt: '',
        createdAt: now.toISOString(),
      });
    }

    // Rule 2: Active → recurring 14-day follow-up
    if (shipper.salesStage === 'active') {
      const existingFutureTasks = salesTasks.filter(t => t.shipperId === shipper.id && !t.completed && isAfter(new Date(t.dueDate), now));
      if (existingFutureTasks.length === 0) {
        result.newTasks.push({
          id: crypto.randomUUID(),
          shipperId: shipper.id,
          type: 'call',
          title: 'Relationship Follow-Up',
          description: `Recurring 14-day check-in with ${shipper.companyName}`,
          dueDate: format(addDays(now, 14), 'yyyy-MM-dd'),
          completed: false,
          completedAt: '',
          createdAt: now.toISOString(),
        });
      }
    }

    // Rule 3: No activity in 30 days for Active → alert
    if (shipper.salesStage === 'active') {
      const lastCall = shipperCalls[0];
      const lastActivity = lastCall ? new Date(lastCall.createdAt) : null;
      if (!lastActivity || differenceInDays(now, lastActivity) > 30) {
        result.alerts.push({
          shipperId: shipper.id,
          message: `Account At Risk: ${shipper.companyName} — no activity in 30+ days`,
          severity: 'warning',
        });
      }
    }

    // Rule 5: Contract sent but not signed in 5 days
    if (shipper.salesStage === 'contract_sent') {
      const sentContracts = contracts.filter(c => c.entityId === shipper.id && c.status === 'sent');
      for (const c of sentContracts) {
        if (differenceInDays(now, new Date(c.createdAt)) >= 5) {
          result.newTasks.push({
            id: `st_contract_${shipper.id}_${Date.now()}`,
            shipperId: shipper.id,
            type: 'call',
            title: 'Contract Follow-Up Reminder',
            description: `Contract sent to ${shipper.companyName} 5+ days ago — not yet signed`,
            dueDate: format(now, 'yyyy-MM-dd'),
            completed: false,
            completedAt: '',
            createdAt: now.toISOString(),
          });
        }
      }
    }
  }

  return result;
}

export const callOutcomeLabels: Record<string, string> = {
  no_answer: 'No Answer',
  left_voicemail: 'Left Voicemail',
  gatekeeper: 'Gatekeeper',
  spoke_not_interested: 'Spoke – Not Interested',
  spoke_send_info: 'Spoke – Send Info',
  spoke_quote_requested: 'Spoke – Quote Requested',
};

export const nextStepLabels: Record<string, string> = {
  follow_up_call: 'Follow-Up Call',
  send_email: 'Send Email',
  quote_lane: 'Quote Lane',
  schedule_meeting: 'Schedule Meeting',
  close: 'Close',
};
