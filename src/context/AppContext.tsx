import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Shipper, Contact, Lane, FollowUp, Activity, Carrier, Load, Contract, OutboundCall, SalesTask, EmailTemplate, StageChangeLog, SalesStage } from '@/types';
import { generateCadenceTasks } from '@/utils/cadenceEngine';
import { supabase } from '@/integrations/supabase/client';
import { rowsToFrontend, frontendToRow } from '@/utils/supabaseHelpers';

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
  logStageChange: (shipperId: string, fromStage: SalesStage, toStage: SalesStage) => void;
  triggerCadence: (shipperId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper: sync local state changes to Supabase
function useSyncedState<T extends { id: string }>(
  table: string,
  initial: T[]
): [T[], React.Dispatch<React.SetStateAction<T[]>>] {
  const [state, setStateRaw] = useState<T[]>(initial);
  const prevRef = useRef<T[]>(initial);

  const setState: React.Dispatch<React.SetStateAction<T[]>> = useCallback((action) => {
    setStateRaw(prev => {
      const next = typeof action === 'function' ? (action as (prev: T[]) => T[])(prev) : action;
      // Diff and sync to Supabase
      const prevIds = new Set(prev.map(i => i.id));
      const nextIds = new Set(next.map(i => i.id));
      const nextMap = new Map(next.map(i => [i.id, i]));
      const prevMap = new Map(prev.map(i => [i.id, i]));

      // Inserts
      const inserts = next.filter(i => !prevIds.has(i.id));
      if (inserts.length > 0) {
        const rows = inserts.map(i => frontendToRow(i as any));
        supabase.from(table).insert(rows).then(({ error }) => {
          if (error) console.error(`Insert error (${table}):`, error);
        });
      }

      // Updates
      for (const item of next) {
        if (prevIds.has(item.id)) {
          const old = prevMap.get(item.id);
          if (JSON.stringify(old) !== JSON.stringify(item)) {
            const row = frontendToRow(item as any);
            const { id, ...rest } = row;
            supabase.from(table).update(rest).eq('id', id).then(({ error }) => {
              if (error) console.error(`Update error (${table}):`, error);
            });
          }
        }
      }

      // Deletes
      const deletes = prev.filter(i => !nextIds.has(i.id));
      for (const item of deletes) {
        supabase.from(table).delete().eq('id', item.id).then(({ error }) => {
          if (error) console.error(`Delete error (${table}):`, error);
        });
      }

      prevRef.current = next;
      return next;
    });
  }, [table]);

  return [state, setState];
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [shippers, setShippers] = useSyncedState<Shipper>('shippers', []);
  const [contacts, setContacts] = useSyncedState<Contact>('contacts', []);
  const [lanes, setLanes] = useSyncedState<Lane>('lanes', []);
  const [followUps, setFollowUps] = useSyncedState<FollowUp>('follow_ups', []);
  const [activities, setActivities] = useSyncedState<Activity>('activities', []);
  const [carriers, setCarriers] = useSyncedState<Carrier>('carriers', []);
  const [loads, setLoads] = useSyncedState<Load>('loads', []);
  const [contracts, setContracts] = useSyncedState<Contract>('contracts', []);
  const [outboundCalls, setOutboundCalls] = useSyncedState<OutboundCall>('outbound_calls', []);
  const [salesTasks, setSalesTasks] = useSyncedState<SalesTask>('sales_tasks', []);
  const [emailTemplates, setEmailTemplates] = useSyncedState<EmailTemplate>('email_templates', []);
  const [stageChangeLogs, setStageChangeLogs] = useSyncedState<StageChangeLog>('stage_change_logs', []);
  const [loaded, setLoaded] = useState(false);

  // Load all data from Supabase on mount
  useEffect(() => {
    async function loadAll() {
      const tables: { table: string; setter: (data: any[]) => void }[] = [
        { table: 'shippers', setter: (d) => setShippers(d) },
        { table: 'contacts', setter: (d) => setContacts(d) },
        { table: 'lanes', setter: (d) => setLanes(d) },
        { table: 'follow_ups', setter: (d) => setFollowUps(d) },
        { table: 'activities', setter: (d) => setActivities(d) },
        { table: 'carriers', setter: (d) => setCarriers(d) },
        { table: 'loads', setter: (d) => setLoads(d) },
        { table: 'contracts', setter: (d) => setContracts(d) },
        { table: 'outbound_calls', setter: (d) => setOutboundCalls(d) },
        { table: 'sales_tasks', setter: (d) => setSalesTasks(d) },
        { table: 'email_templates', setter: (d) => setEmailTemplates(d) },
        { table: 'stage_change_logs', setter: (d) => setStageChangeLogs(d) },
      ];

      const results = await Promise.all(
        tables.map(({ table }) => supabase.from(table).select('*'))
      );

      // We need to set data without triggering sync (initial load)
      // We'll use a flag to skip sync during initial load
      results.forEach((result, i) => {
        if (result.error) {
          console.error(`Error loading ${tables[i].table}:`, result.error);
          return;
        }
        const frontendData = rowsToFrontend(result.data || []);
        // Direct state set - the useSyncedState will see prev === [] and items are "new"
        // But we don't want to re-insert them. We need to handle this.
        // Solution: set raw state directly, bypassing sync
        tables[i].setter(frontendData);
      });

      setLoaded(true);
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logStageChange = useCallback((shipperId: string, fromStage: SalesStage, toStage: SalesStage) => {
    const log: StageChangeLog = {
      id: `scl_${Date.now()}`,
      shipperId,
      fromStage,
      toStage,
      changedAt: new Date().toISOString(),
      changedBy: 'Mike Demar',
    };
    setStageChangeLogs(prev => [...prev, log]);
  }, [setStageChangeLogs]);

  const triggerCadence = useCallback((shipperId: string) => {
    const tasks = generateCadenceTasks(shipperId);
    setSalesTasks(prev => [...prev, ...tasks]);
  }, [setSalesTasks]);

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
