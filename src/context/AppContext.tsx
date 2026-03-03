import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Shipper, Contact, Lane, FollowUp, Activity, Carrier, Load, Contract, OutboundCall, SalesTask, EmailTemplate, StageChangeLog, SalesStage } from '@/types';
import { mockShippers, mockContacts, mockLanes, mockFollowUps, mockActivities, mockCarriers, mockLoads, mockContracts, mockEmailTemplates } from '@/data/mockData';
import { generateCadenceTasks } from '@/utils/cadenceEngine';

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

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [shippers, setShippers] = useState<Shipper[]>(mockShippers);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [lanes, setLanes] = useState<Lane[]>(mockLanes);
  const [followUps, setFollowUps] = useState<FollowUp[]>(mockFollowUps);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [carriers, setCarriers] = useState<Carrier[]>(mockCarriers);
  const [loads, setLoads] = useState<Load[]>(mockLoads);
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [outboundCalls, setOutboundCalls] = useState<OutboundCall[]>([]);
  const [salesTasks, setSalesTasks] = useState<SalesTask[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [stageChangeLogs, setStageChangeLogs] = useState<StageChangeLog[]>([]);

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
  }, []);

  const triggerCadence = useCallback((shipperId: string) => {
    const tasks = generateCadenceTasks(shipperId);
    setSalesTasks(prev => [...prev, ...tasks]);
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
