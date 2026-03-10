export type SalesStage = 'prospect' | 'contacted' | 'engaged' | 'lane_discussed' | 'quoting' | 'contract_sent' | 'active' | 'dormant' | 'closed_lost' | 'lead' | 'quoted' | 'inactive';
export type CarrierPacketStatus = 'not_started' | 'in_progress' | 'complete' | 'expired';
export type LoadStatus = 'available' | 'booked' | 'in_transit' | 'delivered' | 'invoiced' | 'paid';
export type EquipmentType = 'dry_van' | 'reefer' | 'flatbed' | 'step_deck' | 'conestoga' | 'power_only';
export type ActivityType = 'call' | 'email' | 'note' | 'meeting';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';
export type ContractType = 'shipper_agreement' | 'carrier_agreement' | 'rate_confirmation';
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'expired';

export type CallOutcome = 'no_answer' | 'left_voicemail' | 'gatekeeper' | 'spoke_not_interested' | 'spoke_send_info' | 'spoke_quote_requested';
export type TaskNextStep = 'follow_up_call' | 'send_email' | 'quote_lane' | 'schedule_meeting' | 'close';
export type CadenceTaskType = 'call' | 'email' | 'linkedin_reminder';

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
  shippingManagerName?: string;
  directPhone?: string;
  estimatedMonthlyLoads?: number;
  lastContactDate?: string;
  nextFollowUp?: string;
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
  referenceNumber: string;
  notes: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  type: ContractType;
  status: ContractStatus;
  entityId: string;
  entityType: 'shipper' | 'carrier';
  loadId?: string;
  title: string;
  terms: string;
  signedByName: string;
  signedAt: string;
  createdAt: string;
  expiresAt: string;
}

export interface OutboundCall {
  id: string;
  shipperId: string;
  contactName: string;
  contactTitle: string;
  directPhone: string;
  email: string;
  callAttemptNumber: number;
  callDate: string;
  callOutcome: CallOutcome;
  painPoint: string;
  notes: string;
  nextStep: TaskNextStep;
  nextFollowUpDate: string;
  assignedSalesRep: string;
  createdAt: string;
}

export interface SalesTask {
  id: string;
  shipperId: string;
  type: CadenceTaskType;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt: string;
  templateId?: string;
  cadenceDay?: number;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

export interface StageChangeLog {
  id: string;
  shipperId: string;
  fromStage: SalesStage;
  toStage: SalesStage;
  changedAt: string;
  changedBy: string;
}
