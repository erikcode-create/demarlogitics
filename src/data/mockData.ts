import { Shipper, Contact, Lane, FollowUp, Activity, Carrier, Load, Contract, EmailTemplate, SalesStage, LoadStatus, EquipmentType, PaymentStatus, CarrierPacketStatus, ContractType, ContractStatus, LoadDocumentType, LoadEventType, InvoiceStatus } from '@/types';

export const mockShippers: Shipper[] = [];
export const mockContacts: Contact[] = [];
export const mockLanes: Lane[] = [];
export const mockFollowUps: FollowUp[] = [];
export const mockActivities: Activity[] = [];
export const mockCarriers: Carrier[] = [];
export const mockLoads: Load[] = [];
export const mockContracts: Contract[] = [];
export const mockEmailTemplates: EmailTemplate[] = [];

export const salesStageLabels: Record<SalesStage, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  contacted: 'Contacted',
  engaged: 'Engaged',
  lane_discussed: 'Lane Discussed',
  quoting: 'Quoting',
  quoted: 'Quoted',
  contract_sent: 'Contract Sent',
  active: 'Active',
  dormant: 'Dormant',
  inactive: 'Inactive',
  closed_lost: 'Closed / Lost',
};

export const loadStatusLabels: Record<LoadStatus, string> = {
  available: 'Available',
  booked: 'Booked',
  dispatched: 'Dispatched',
  rate_con_signed: 'Rate Con Signed',
  at_pickup: 'At Pickup',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  at_delivery: 'At Delivery',
  delivered: 'Delivered',
  pod_submitted: 'POD Submitted',
  invoiced: 'Invoiced',
  paid: 'Paid',
};

export const loadStatusOrder: LoadStatus[] = [
  'available', 'booked', 'dispatched', 'rate_con_signed', 'at_pickup',
  'picked_up', 'in_transit', 'at_delivery', 'delivered', 'pod_submitted',
  'invoiced', 'paid',
];

export const loadDocumentTypeLabels: Record<LoadDocumentType, string> = {
  rate_con_signed: 'Signed Rate Confirmation',
  bol_photo: 'Bill of Lading Photo',
  delivery_photo: 'Delivery Photo',
  pod_signature: 'Proof of Delivery Signature',
};

export const loadEventTypeLabels: Record<LoadEventType, string> = {
  status_change: 'Status Change',
  document_uploaded: 'Document Uploaded',
  note: 'Note',
};

export const equipmentTypeLabels: Record<EquipmentType, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  conestoga: 'Conestoga',
  power_only: 'Power Only',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
};

export const packetStatusLabels: Record<CarrierPacketStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Complete',
  expired: 'Expired',
};

export const contractTypeLabels: Record<ContractType, string> = {
  shipper_agreement: 'Shipper Agreement',
  carrier_agreement: 'Carrier Agreement',
  rate_confirmation: 'Rate Confirmation',
};

export const contractStatusLabels: Record<ContractStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  signed: 'Signed',
  expired: 'Expired',
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
};
