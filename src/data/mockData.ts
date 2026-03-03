import { Shipper, Contact, Lane, FollowUp, Activity, Carrier, Load, Contract } from '@/types';

export const mockShippers: Shipper[] = [
  { id: 's1', companyName: 'Midwest Manufacturing Co.', address: '1200 Industrial Blvd', city: 'Chicago', state: 'IL', zip: '60601', phone: '312-555-0100', email: 'shipping@midwestmfg.com', salesStage: 'active', creditLimit: 50000, paymentTerms: 'Net 30', notes: 'High-volume shipper, priority account', createdAt: '2024-01-15' },
  { id: 's2', companyName: 'Pacific Foods Distribution', address: '8900 Harbor Way', city: 'Los Angeles', state: 'CA', zip: '90001', phone: '213-555-0200', email: 'logistics@pacificfoods.com', salesStage: 'active', creditLimit: 75000, paymentTerms: 'Net 15', notes: 'Reefer loads only, strict temp requirements', createdAt: '2024-02-20' },
  { id: 's3', companyName: 'Southern Steel Works', address: '4500 Forge Dr', city: 'Birmingham', state: 'AL', zip: '35201', phone: '205-555-0300', email: 'dispatch@southernsteel.com', salesStage: 'quoted', creditLimit: 30000, paymentTerms: 'Net 30', notes: 'Flatbed specialist, heavy haul', createdAt: '2024-03-10' },
  { id: 's4', companyName: 'Great Plains Agriculture', address: '200 Grain Elevator Rd', city: 'Omaha', state: 'NE', zip: '68101', phone: '402-555-0400', email: 'transport@gpag.com', salesStage: 'prospect', creditLimit: 0, paymentTerms: 'TBD', notes: 'Seasonal volume Q3-Q4', createdAt: '2024-06-01' },
  { id: 's5', companyName: 'Atlantic Pharma Logistics', address: '77 Research Park', city: 'Boston', state: 'MA', zip: '02101', phone: '617-555-0500', email: 'supply@atlanticpharma.com', salesStage: 'lead', creditLimit: 0, paymentTerms: 'TBD', notes: 'Temperature-controlled, high value', createdAt: '2024-08-15' },
];

export const mockContacts: Contact[] = [
  { id: 'c1', shipperId: 's1', firstName: 'James', lastName: 'Wilson', title: 'Shipping Manager', phone: '312-555-0101', email: 'jwilson@midwestmfg.com', isPrimary: true },
  { id: 'c2', shipperId: 's1', firstName: 'Sarah', lastName: 'Chen', title: 'Logistics Coordinator', phone: '312-555-0102', email: 'schen@midwestmfg.com', isPrimary: false },
  { id: 'c3', shipperId: 's2', firstName: 'Maria', lastName: 'Garcia', title: 'VP Operations', phone: '213-555-0201', email: 'mgarcia@pacificfoods.com', isPrimary: true },
  { id: 'c4', shipperId: 's3', firstName: 'Robert', lastName: 'Taylor', title: 'Dispatch Supervisor', phone: '205-555-0301', email: 'rtaylor@southernsteel.com', isPrimary: true },
  { id: 'c5', shipperId: 's4', firstName: 'Linda', lastName: 'Johnson', title: 'Transportation Director', phone: '402-555-0401', email: 'ljohnson@gpag.com', isPrimary: true },
];

export const mockLanes: Lane[] = [
  { id: 'l1', shipperId: 's1', origin: 'Chicago, IL', destination: 'Dallas, TX', rate: 2800, equipmentType: 'dry_van', notes: '3x/week' },
  { id: 'l2', shipperId: 's1', origin: 'Chicago, IL', destination: 'Atlanta, GA', rate: 2200, equipmentType: 'dry_van', notes: '2x/week' },
  { id: 'l3', shipperId: 's2', origin: 'Los Angeles, CA', destination: 'Phoenix, AZ', rate: 1800, equipmentType: 'reefer', notes: 'Temp 34°F' },
  { id: 'l4', shipperId: 's2', origin: 'Los Angeles, CA', destination: 'Denver, CO', rate: 3200, equipmentType: 'reefer', notes: 'Temp 34°F' },
  { id: 'l5', shipperId: 's3', origin: 'Birmingham, AL', destination: 'Houston, TX', rate: 2500, equipmentType: 'flatbed', notes: 'Oversized loads possible' },
];

export const mockFollowUps: FollowUp[] = [
  { id: 'f1', shipperId: 's3', date: '2026-03-05', notes: 'Send revised rate sheet', completed: false },
  { id: 'f2', shipperId: 's4', date: '2026-03-07', notes: 'Follow up on capacity needs for harvest season', completed: false },
  { id: 'f3', shipperId: 's5', date: '2026-03-10', notes: 'Initial discovery call scheduled', completed: false },
  { id: 'f4', shipperId: 's1', date: '2026-02-28', notes: 'Quarterly business review', completed: true },
];

export const mockActivities: Activity[] = [
  { id: 'a1', entityId: 's1', entityType: 'shipper', type: 'call', description: 'Discussed Q1 volume forecast, expecting 15% increase', timestamp: '2026-02-28T14:30:00', user: 'Mike Demar' },
  { id: 'a2', entityId: 's1', entityType: 'shipper', type: 'email', description: 'Sent updated rate confirmation for Chicago-Dallas lane', timestamp: '2026-02-27T09:15:00', user: 'Mike Demar' },
  { id: 'a3', entityId: 's2', entityType: 'shipper', type: 'note', description: 'Customer requesting dedicated reefer capacity for summer', timestamp: '2026-02-26T16:00:00', user: 'Jessica Adams' },
  { id: 'a4', entityId: 's3', entityType: 'shipper', type: 'meeting', description: 'On-site visit to discuss flatbed requirements', timestamp: '2026-02-25T10:00:00', user: 'Mike Demar' },
  { id: 'a5', entityId: 'cr1', entityType: 'carrier', type: 'call', description: 'Confirmed insurance renewal in progress', timestamp: '2026-02-28T11:00:00', user: 'Jessica Adams' },
  { id: 'a6', entityId: 'cr2', entityType: 'carrier', type: 'email', description: 'Requested updated W9 form', timestamp: '2026-02-27T13:45:00', user: 'Mike Demar' },
  { id: 'a7', entityId: 'ld1', entityType: 'load', type: 'note', description: 'Pickup confirmed for 03/03, driver ETA 8:00 AM', timestamp: '2026-03-02T17:00:00', user: 'Jessica Adams' },
];

export const mockCarriers: Carrier[] = [
  { id: 'cr1', companyName: 'Eagle Express Trucking', mcNumber: 'MC-123456', dotNumber: 'DOT-7890123', address: '500 Truck Stop Ln', city: 'Memphis', state: 'TN', zip: '38101', phone: '901-555-1000', email: 'dispatch@eagleexpress.com', equipmentTypes: ['dry_van', 'reefer'], insuranceExpiry: '2026-06-15', insuranceProvider: 'National Indemnity', packetStatus: 'complete', factoringCompany: 'RTS Financial', factoringRemitTo: 'PO Box 12345, Memphis TN', w9Uploaded: true, insuranceCertUploaded: true, carrierPacketUploaded: true, notes: 'Reliable, on-time performance 98%', createdAt: '2024-01-20' },
  { id: 'cr2', companyName: 'Heartland Haulers LLC', mcNumber: 'MC-234567', dotNumber: 'DOT-8901234', address: '1100 Highway 65', city: 'Kansas City', state: 'MO', zip: '64101', phone: '816-555-2000', email: 'ops@heartlandhaulers.com', equipmentTypes: ['dry_van'], insuranceExpiry: '2026-04-01', insuranceProvider: 'Progressive Commercial', packetStatus: 'complete', factoringCompany: '', factoringRemitTo: '', w9Uploaded: true, insuranceCertUploaded: true, carrierPacketUploaded: true, notes: 'Good rates, Midwest focus', createdAt: '2024-03-05' },
  { id: 'cr3', companyName: 'Southwest Flatbed Inc.', mcNumber: 'MC-345678', dotNumber: 'DOT-9012345', address: '2200 Desert Rd', city: 'Phoenix', state: 'AZ', zip: '85001', phone: '602-555-3000', email: 'loads@swflatbed.com', equipmentTypes: ['flatbed', 'step_deck'], insuranceExpiry: '2026-03-15', insuranceProvider: 'Great West Casualty', packetStatus: 'in_progress', factoringCompany: 'Triumph Pay', factoringRemitTo: 'PO Box 67890, Dallas TX', w9Uploaded: true, insuranceCertUploaded: false, carrierPacketUploaded: false, notes: 'Insurance renewal pending - follow up!', createdAt: '2024-05-12' },
  { id: 'cr4', companyName: 'Northern Logistics Group', mcNumber: 'MC-456789', dotNumber: 'DOT-0123456', address: '800 Lake Shore Dr', city: 'Milwaukee', state: 'WI', zip: '53201', phone: '414-555-4000', email: 'freight@northernlog.com', equipmentTypes: ['dry_van', 'reefer', 'flatbed'], insuranceExpiry: '2026-09-30', insuranceProvider: 'Zurich Insurance', packetStatus: 'complete', factoringCompany: '', factoringRemitTo: '', w9Uploaded: true, insuranceCertUploaded: true, carrierPacketUploaded: true, notes: 'Multi-modal capability, preferred carrier', createdAt: '2024-02-14' },
  { id: 'cr5', companyName: 'Lone Star Transport', mcNumber: 'MC-567890', dotNumber: 'DOT-1234567', address: '3300 Cattle Dr', city: 'San Antonio', state: 'TX', zip: '78201', phone: '210-555-5000', email: 'dispatch@lonestar.com', equipmentTypes: ['dry_van', 'conestoga'], insuranceExpiry: '2026-12-01', insuranceProvider: 'Sentry Insurance', packetStatus: 'not_started', factoringCompany: '', factoringRemitTo: '', w9Uploaded: false, insuranceCertUploaded: false, carrierPacketUploaded: false, notes: 'New carrier, needs onboarding', createdAt: '2026-02-20' },
];

export const mockLoads: Load[] = [
  { id: 'ld1', loadNumber: 'DT-2026-001', shipperId: 's1', carrierId: 'cr1', origin: 'Chicago, IL', destination: 'Dallas, TX', pickupDate: '2026-03-03', deliveryDate: '2026-03-05', shipperRate: 2800, carrierRate: 2200, weight: 42000, equipmentType: 'dry_van', status: 'booked', podUploaded: false, invoiceNumber: '', invoiceDate: '', invoiceAmount: 0, paymentStatus: 'pending', notes: 'Standard palletized freight', createdAt: '2026-02-28' },
  { id: 'ld2', loadNumber: 'DT-2026-002', shipperId: 's2', carrierId: 'cr1', origin: 'Los Angeles, CA', destination: 'Phoenix, AZ', pickupDate: '2026-03-02', deliveryDate: '2026-03-03', shipperRate: 1800, carrierRate: 1400, weight: 38000, equipmentType: 'reefer', status: 'in_transit', podUploaded: false, invoiceNumber: '', invoiceDate: '', invoiceAmount: 0, paymentStatus: 'pending', notes: 'Temp 34°F, produce load', createdAt: '2026-02-27' },
  { id: 'ld3', loadNumber: 'DT-2026-003', shipperId: 's1', carrierId: 'cr2', origin: 'Chicago, IL', destination: 'Atlanta, GA', pickupDate: '2026-02-28', deliveryDate: '2026-03-01', shipperRate: 2200, carrierRate: 1750, weight: 44000, equipmentType: 'dry_van', status: 'delivered', podUploaded: true, invoiceNumber: 'INV-003', invoiceDate: '2026-03-01', invoiceAmount: 2200, paymentStatus: 'pending', notes: '', createdAt: '2026-02-25' },
  { id: 'ld4', loadNumber: 'DT-2026-004', shipperId: 's3', carrierId: 'cr3', origin: 'Birmingham, AL', destination: 'Houston, TX', pickupDate: '2026-02-25', deliveryDate: '2026-02-27', shipperRate: 2500, carrierRate: 1900, weight: 48000, equipmentType: 'flatbed', status: 'invoiced', podUploaded: true, invoiceNumber: 'INV-004', invoiceDate: '2026-02-28', invoiceAmount: 2500, paymentStatus: 'pending', notes: 'Steel coils, tarped', createdAt: '2026-02-22' },
  { id: 'ld5', loadNumber: 'DT-2026-005', shipperId: 's2', carrierId: 'cr4', origin: 'Los Angeles, CA', destination: 'Denver, CO', pickupDate: '2026-02-20', deliveryDate: '2026-02-22', shipperRate: 3200, carrierRate: 2500, weight: 36000, equipmentType: 'reefer', status: 'paid', podUploaded: true, invoiceNumber: 'INV-005', invoiceDate: '2026-02-23', invoiceAmount: 3200, paymentStatus: 'paid', notes: '', createdAt: '2026-02-18' },
  { id: 'ld6', loadNumber: 'DT-2026-006', shipperId: 's1', carrierId: null, origin: 'Chicago, IL', destination: 'Nashville, TN', pickupDate: '2026-03-06', deliveryDate: '2026-03-07', shipperRate: 1900, carrierRate: 0, weight: 40000, equipmentType: 'dry_van', status: 'available', podUploaded: false, invoiceNumber: '', invoiceDate: '', invoiceAmount: 0, paymentStatus: 'pending', notes: 'Need carrier assignment', createdAt: '2026-03-01' },
  { id: 'ld7', loadNumber: 'DT-2026-007', shipperId: 's3', carrierId: null, origin: 'Birmingham, AL', destination: 'Memphis, TN', pickupDate: '2026-03-08', deliveryDate: '2026-03-09', shipperRate: 1600, carrierRate: 0, weight: 45000, equipmentType: 'flatbed', status: 'available', podUploaded: false, invoiceNumber: '', invoiceDate: '', invoiceAmount: 0, paymentStatus: 'pending', notes: 'I-beams, oversized permit may be needed', createdAt: '2026-03-02' },
  { id: 'ld8', loadNumber: 'DT-2026-008', shipperId: 's1', carrierId: 'cr2', origin: 'Chicago, IL', destination: 'Dallas, TX', pickupDate: '2026-02-15', deliveryDate: '2026-02-17', shipperRate: 2800, carrierRate: 2150, weight: 41000, equipmentType: 'dry_van', status: 'paid', podUploaded: true, invoiceNumber: 'INV-008', invoiceDate: '2026-02-18', invoiceAmount: 2800, paymentStatus: 'paid', notes: '', createdAt: '2026-02-12' },
];

// Helper to format equipment type for display
export const equipmentTypeLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  conestoga: 'Conestoga',
  power_only: 'Power Only',
};

export const salesStageLabels: Record<string, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  quoted: 'Quoted',
  active: 'Active',
  inactive: 'Inactive',
};

export const loadStatusLabels: Record<string, string> = {
  available: 'Available',
  booked: 'Booked',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  paid: 'Paid',
};

export const packetStatusLabels: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Complete',
  expired: 'Expired',
};

export const paymentStatusLabels: Record<string, string> = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
};

export const contractTypeLabels: Record<string, string> = {
  shipper_agreement: 'Shipper Agreement',
  carrier_agreement: 'Carrier Agreement',
  rate_confirmation: 'Rate Confirmation',
};

export const contractStatusLabels: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  signed: 'Signed',
  expired: 'Expired',
};

export const mockContracts: Contract[] = [
  {
    id: 'ct1', type: 'shipper_agreement', status: 'signed', entityId: 's1', entityType: 'shipper',
    title: 'Shipper Agreement — Midwest Manufacturing Co.',
    terms: 'Standard freight brokerage agreement for dry van shipments. Payment terms Net 30. Credit limit $50,000.',
    signedByName: 'James Wilson', signedAt: '2026-01-20T10:30:00', createdAt: '2026-01-15', expiresAt: '2027-01-15',
  },
  {
    id: 'ct2', type: 'carrier_agreement', status: 'signed', entityId: 'cr1', entityType: 'carrier',
    title: 'Carrier Agreement — Eagle Express Trucking',
    terms: 'Carrier broker agreement. MC-123456, DOT-7890123. Equipment: Dry Van, Reefer. Insurance via National Indemnity, expires 2026-06-15.',
    signedByName: 'Tom Eagle', signedAt: '2026-01-22T14:00:00', createdAt: '2026-01-20', expiresAt: '2027-01-20',
  },
  {
    id: 'ct3', type: 'rate_confirmation', status: 'signed', entityId: 'cr1', entityType: 'carrier', loadId: 'ld1',
    title: 'Rate Confirmation — DT-2026-001',
    terms: 'Rate confirmation for load DT-2026-001. Chicago, IL → Dallas, TX. Carrier rate: $2,200. Pickup: 03/03/2026, Delivery: 03/05/2026.',
    signedByName: 'Tom Eagle', signedAt: '2026-02-28T09:00:00', createdAt: '2026-02-28', expiresAt: '2026-03-05',
  },
  {
    id: 'ct4', type: 'shipper_agreement', status: 'draft', entityId: 's3', entityType: 'shipper',
    title: 'Shipper Agreement — Southern Steel Works',
    terms: '', signedByName: '', signedAt: '', createdAt: '2026-03-01', expiresAt: '2027-03-01',
  },
];
