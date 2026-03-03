import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Shipper, Contact, Lane, FollowUp, Activity, Carrier, Load } from '@/types';
import { mockShippers, mockContacts, mockLanes, mockFollowUps, mockActivities, mockCarriers, mockLoads } from '@/data/mockData';

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

  return (
    <AppContext.Provider value={{
      shippers, setShippers,
      contacts, setContacts,
      lanes, setLanes,
      followUps, setFollowUps,
      activities, setActivities,
      carriers, setCarriers,
      loads, setLoads,
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
