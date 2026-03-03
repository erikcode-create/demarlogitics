export type SalesStage = 'lead' | 'prospect' | 'quoted' | 'active' | 'inactive';
export type CarrierPacketStatus = 'not_started' | 'in_progress' | 'complete' | 'expired';
export type LoadStatus = 'available' | 'booked' | 'in_transit' | 'delivered' | 'invoiced' | 'paid';
export type EquipmentType = 'dry_van' | 'reefer' | 'flatbed' | 'step_deck' | 'conestoga' | 'power_only';
export type ActivityType = 'call' | 'email' | 'note' | 'meeting';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface Shipper {
  id: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  salesStage: SalesStage;
  creditLimit: number;
  paymentTerms: string;
  notes: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  shipperId: string;
  firstName: string;
  lastName: string;
  title: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

export interface Lane {
  id: string;
  shipperId: string;
  origin: string;
  destination: string;
  rate: number;
  equipmentType: EquipmentType;
  notes: string;
}

export interface FollowUp {
  id: string;
  shipperId: string;
  date: string;
  notes: string;
  completed: boolean;
}

export interface Activity {
  id: string;
  entityId: string;
  entityType: 'shipper' | 'carrier' | 'load';
  type: ActivityType;
  description: string;
  timestamp: string;
  user: string;
}

export interface Carrier {
  id: string;
  companyName: string;
  mcNumber: string;
  dotNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  equipmentTypes: EquipmentType[];
  insuranceExpiry: string;
  insuranceProvider: string;
  packetStatus: CarrierPacketStatus;
  factoringCompany: string;
  factoringRemitTo: string;
  w9Uploaded: boolean;
  insuranceCertUploaded: boolean;
  carrierPacketUploaded: boolean;
  notes: string;
  createdAt: string;
}

export interface Load {
  id: string;
  loadNumber: string;
  shipperId: string;
  carrierId: string | null;
  origin: string;
  destination: string;
  pickupDate: string;
  deliveryDate: string;
  shipperRate: number;
  carrierRate: number;
  weight: number;
  equipmentType: EquipmentType;
  status: LoadStatus;
  podUploaded: boolean;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
  paymentStatus: PaymentStatus;
  notes: string;
  createdAt: string;
}
