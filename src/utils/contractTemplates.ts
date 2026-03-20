import { Shipper, Carrier, Load } from '@/types';

export function generateShipperAgreement(shipper: Shipper): string {
  return `FREIGHT BROKERAGE AGREEMENT — SHIPPER

PARTIES:
This Agreement is entered into between DEMAR Logistics ("Broker") and ${shipper.companyName} ("Shipper"), located at ${shipper.address}, ${shipper.city}, ${shipper.state} ${shipper.zip}.

SCOPE OF SERVICES:
Broker agrees to arrange for the transportation of Shipper's freight via motor carriers authorized by the FMCSA. Broker shall exercise reasonable diligence in selecting carriers.

PAYMENT TERMS:
• Payment Terms: ${shipper.paymentTerms}
• Invoices are due per agreed terms from date of delivery
• Late payments subject to 1.5% monthly interest

SHIPPER OBLIGATIONS:
• Provide accurate descriptions of freight including weight, dimensions, and hazmat classification
• Ensure freight is properly packaged and labeled
• Provide timely loading/unloading (2 hours free time)

LIABILITY:
• Broker liability limited to arranging transportation services
• Cargo claims governed by 49 U.S.C. §14706 (Carmack Amendment)
• Maximum cargo liability: $100,000 per shipment unless otherwise agreed

TERM:
This agreement is effective for one (1) year from the date of signing and auto-renews unless terminated with 30 days written notice.

CONTACT: ${shipper.phone} | ${shipper.email}`;
}

export function generateCarrierAgreement(carrier: Carrier): string {
  const equipment = carrier.equipmentTypes.map(e => e.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');

  return `CARRIER-BROKER TRANSPORTATION AGREEMENT

PARTIES:
This Agreement is entered into between DEMAR Logistics ("Broker") and ${carrier.companyName} ("Carrier"), located at ${carrier.address}, ${carrier.city}, ${carrier.state} ${carrier.zip}.

CARRIER AUTHORITY:
• MC Number: ${carrier.mcNumber}
• DOT Number: ${carrier.dotNumber}
• Equipment Types: ${equipment}

INSURANCE REQUIREMENTS:
• Insurance Provider: ${carrier.insuranceProvider}
• Insurance Expiry: ${carrier.insuranceExpiry}
• Minimum auto liability: $1,000,000
• Minimum cargo insurance: $100,000
• Workers compensation as required by law

CARRIER OBLIGATIONS:
• Maintain all required FMCSA operating authority
• Provide proof of insurance upon request
• Transport freight in a safe, timely manner
• Not broker, re-broker, or assign loads without written consent
• Provide proof of delivery within 48 hours

PAYMENT:
• Carrier shall be paid within 30 days of receipt of signed POD and invoice
${carrier.factoringCompany ? `• Factoring Company: ${carrier.factoringCompany}\n• Remit To: ${carrier.factoringRemitTo}` : '• Payment direct to carrier'}

TERM:
This agreement is effective for one (1) year from signing and auto-renews unless terminated with 30 days written notice.

CONTACT: ${carrier.phone} | ${carrier.email}`;
}

export function generateRateConfirmation(load: Load, shipper: Shipper, carrier: Carrier): string {
  return `RATE CONFIRMATION / LOAD TENDER

LOAD NUMBER: ${load.loadNumber}

BROKER: DEMAR Logistics

SHIPPER: ${shipper.companyName}
${shipper.address}, ${shipper.city}, ${shipper.state} ${shipper.zip}

CARRIER: ${carrier.companyName}
MC#: ${carrier.mcNumber} | DOT#: ${carrier.dotNumber}

SHIPMENT DETAILS:
• Origin: ${load.origin}
• Destination: ${load.destination}
• Pickup Date: ${load.pickupDate}
• Delivery Date: ${load.deliveryDate}
• Equipment: ${load.equipmentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
• Weight: ${load.weight.toLocaleString()} lbs

RATE:
• Carrier Rate: $${load.carrierRate.toLocaleString()}
• All-inclusive (fuel surcharge included unless otherwise noted)

PAYMENT TERMS:
• Payment within 30 days of receipt of signed POD and invoice
${carrier.factoringCompany ? `• Factor to: ${carrier.factoringCompany} — ${carrier.factoringRemitTo}` : '• Pay direct to carrier'}

SPECIAL INSTRUCTIONS:
${load.notes || 'None'}

By signing below, Carrier agrees to transport the above shipment under the terms of the existing Carrier-Broker Agreement and this Rate Confirmation.`;
}
