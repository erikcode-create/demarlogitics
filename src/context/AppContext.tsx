import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Shipper, Contact, Lane, FollowUp, Activity, Carrier, Load, Contract, OutboundCall, SalesTask, EmailTemplate, StageChangeLog, SalesStage } from '@/types';
import { generateCadenceTasks } from '@/utils/cadenceEngine';
import { supabase } from '@/integrations/supabase/client';
import { rowsToFrontend, frontendToRow } from '@/utils/supabaseHelpers';
import { toast } from 'sonner';

interface AppContextType {
  shippers: Shipper[];
  setShippers: React.Dispatch<React.SetStateAction<Shipper[]>>;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  lanes: Lane[];
  setLanes: React.Dispatch<React.SetStateAction<Lane[]>>;
  followUps: FollowUp[];
  setFollowUps: React.Dispatch<React.SetStateAction<FollowUp[]>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  carriers: Carrier[];
  setCarriers: React.Dispatch<React.SetStateAction<Carrier[]>>;
  loads: Load[];
  setLoads: React.Dispatch<React.SetStateAction<Load[]>>;
  contracts: Contract[];
  setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
  outboundCalls: OutboundCall[];
  setOutboundCalls: React.Dispatch<React.SetStateAction<OutboundCall[]>>;
  salesTasks: SalesTask[];
  setSalesTasks: React.Dispatch<React.SetStateAction<SalesTask[]>>;
  emailTemplates: EmailTemplate[];
  setEmailTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
  stageChangeLogs: StageChangeLog[];
  setStageChangeLogs: React.Dispatch<React.SetStateAction<StageChangeLog[]>>;
  logStageChange: (shipperId: string, fromStage: SalesStage, toStage: SalesStage, changedBy?: string) => void;
  triggerCadence: (shipperId: string) => void;
  deleteRecord: (table: string, id: string) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const db = {
  from: (table: string) => supabase.from(table as any),
};

function syncToSupabase<T extends { id: string }>(
  table: string,
  prev: T[],
  next: T[]
) {
  const prevIds = new Set(prev.map(i => i.id));
  const prevMap = new Map(prev.map(i => [i.id, i]));

  // Inserts
  const inserts = next.filter(i => !prevIds.has(i.id));
  if (inserts.length > 0) {
    const rows = inserts.map(i => frontendToRow(i as any));
    db.from(table).insert(rows).then(({ error }: any) => {
      if (error) {
        console.error(`Insert error (${table}):`, error);
        toast.error(`Failed to save ${table.replace(/_/g, ' ')}`);
      }
    });
  }

  // Updates
  for (const item of next) {
    if (prevIds.has(item.id)) {
      const old = prevMap.get(item.id);
      if (JSON.stringify(old) !== JSON.stringify(item)) {
        const row = frontendToRow(item as any);
        const { id, ...rest } = row;
        db.from(table).update(rest).eq('id', id).then(({ error }: any) => {
          if (error) {
            console.error(`Update error (${table}):`, error);
            toast.error(`Failed to update ${table.replace(/_/g, ' ')}`);
          }
        });
      }
    }
  }

  // NOTE: Deletes are handled explicitly via deleteFromSupabase to prevent
  // accidental data loss during HMR / page refreshes
}

function deleteFromSupabase(table: string, id: string) {
  db.from(table).delete().eq('id', id).then(({ error }: any) => {
    if (error) {
      console.error(`Delete error (${table}):`, error);
      toast.error(`Failed to delete ${table.replace(/_/g, ' ')}`);
    }
  });
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [shippers, setShippersRaw] = useState<Shipper[]>([]);
  const [contacts, setContactsRaw] = useState<Contact[]>([]);
  const [lanes, setLanesRaw] = useState<Lane[]>([]);
  const [followUps, setFollowUpsRaw] = useState<FollowUp[]>([]);
  const [activities, setActivitiesRaw] = useState<Activity[]>([]);
  const [carriers, setCarriersRaw] = useState<Carrier[]>([]);
  const [loads, setLoadsRaw] = useState<Load[]>([]);
  const [contracts, setContractsRaw] = useState<Contract[]>([]);
  const [outboundCalls, setOutboundCallsRaw] = useState<OutboundCall[]>([]);
  const [salesTasks, setSalesTasksRaw] = useState<SalesTask[]>([]);
  const [emailTemplates, setEmailTemplatesRaw] = useState<EmailTemplate[]>([]);
  const [stageChangeLogs, setStageChangeLogsRaw] = useState<StageChangeLog[]>([]);

  const [loading, setLoading] = useState(true);
  const readyRef = useRef(false);

  // Create synced setters
  const makeSynced = <T extends { id: string }>(
    table: string,
    rawSetter: React.Dispatch<React.SetStateAction<T[]>>
  ): React.Dispatch<React.SetStateAction<T[]>> => {
    return (action: React.SetStateAction<T[]>) => {
      rawSetter(prev => {
        const next = typeof action === 'function' ? (action as (p: T[]) => T[])(prev) : action;
        if (readyRef.current) {
          syncToSupabase(table, prev, next);
        }
        return next;
      });
    };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setShippers = useCallback(makeSynced<Shipper>('shippers', setShippersRaw), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setContacts = useCallback(makeSynced<Contact>('contacts', setContactsRaw), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setLanes = useCallback(makeSynced<Lane>('lanes', setLanesRaw), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setFollowUps = useCallback(makeSynced<FollowUp>('follow_ups', setFollowUpsRaw), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setActivities = useCallback(makeSynced<Activity>('activities', setActivitiesRaw), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setCarriers = useCallback(makeSynced<Carrier>('carriers', setCarriersRaw), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setLoads = useCallback(makeSynced<Load>('loads', setLoadsRaw), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setContracts = useCallback(makeSynced<Contract>('contracts', setContractsRaw), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setOutboundCalls = useCallback(makeSynced<OutboundCall>('outbound_calls', setOutboundCallsRaw), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setSalesTasks = useCallback(makeSynced<SalesTask>('sales_tasks', setSalesTasksRaw), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setEmailTemplates = useCallback(makeSynced<EmailTemplate>('email_templates', setEmailTemplatesRaw), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setStageChangeLogs = useCallback(makeSynced<StageChangeLog>('stage_change_logs', setStageChangeLogsRaw), []);

  // Load all data from Supabase on mount
  useEffect(() => {
    async function loadAll() {
      const tableConfigs: { table: string; setter: React.Dispatch<React.SetStateAction<any[]>> }[] = [
        { table: 'shippers', setter: setShippersRaw },
        { table: 'contacts', setter: setContactsRaw },
        { table: 'lanes', setter: setLanesRaw },
        { table: 'follow_ups', setter: setFollowUpsRaw },
        { table: 'activities', setter: setActivitiesRaw },
        { table: 'carriers', setter: setCarriersRaw },
        { table: 'loads', setter: setLoadsRaw },
        { table: 'contracts', setter: setContractsRaw },
        { table: 'outbound_calls', setter: setOutboundCallsRaw },
        { table: 'sales_tasks', setter: setSalesTasksRaw },
        { table: 'email_templates', setter: setEmailTemplatesRaw },
        { table: 'stage_change_logs', setter: setStageChangeLogsRaw },
      ];

      const results = await Promise.all(
        tableConfigs.map(({ table }) => db.from(table).select('*'))
      );

      results.forEach((result: any, i) => {
        if (result.error) {
          console.error(`Error loading ${tableConfigs[i].table}:`, result.error);
          return;
        }
        const frontendData = rowsToFrontend(result.data || []);
        tableConfigs[i].setter(frontendData);
      });

      // Enable sync after initial load
      readyRef.current = true;
    }
    loadAll();
  }, []);

  const logStageChange = useCallback((shipperId: string, fromStage: SalesStage, toStage: SalesStage, changedBy?: string) => {
    const log: StageChangeLog = {
      id: crypto.randomUUID(),
      shipperId,
      fromStage,
      toStage,
      changedAt: new Date().toISOString(),
      changedBy: changedBy || 'Unknown',
    };
    setStageChangeLogs(prev => [...prev, log]);
  }, [setStageChangeLogs]);

  const triggerCadence = useCallback((shipperId: string) => {
    const tasks = generateCadenceTasks(shipperId);
    setSalesTasks(prev => [...prev, ...tasks]);
  }, [setSalesTasks]);

  const deleteRecord = useCallback((table: string, id: string) => {
    deleteFromSupabase(table, id);
  }, []);

  return (
    <AppContext.Provider value={{
      shippers, setShippers,
      contacts, setContacts,
      lanes, setLanes,
      followUps, setFollowUps,
      activities, setActivities,
      carriers, setCarriers,
      loads, setLoads,
      contracts, setContracts,
      outboundCalls, setOutboundCalls,
      salesTasks, setSalesTasks,
      emailTemplates, setEmailTemplates,
      stageChangeLogs, setStageChangeLogs,
      logStageChange,
      triggerCadence,
      deleteRecord,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
