const TermsAndConditions = () => (
  <div className="max-w-3xl mx-auto px-6 py-12 text-foreground">
    <h1 className="text-3xl font-bold mb-2">Terms and Conditions</h1>
    <p className="text-sm text-muted-foreground mb-8">Last updated: March 23, 2026</p>

    <div className="space-y-6 text-sm leading-relaxed">
      <section>
        <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
        <p>By downloading, installing, or using the DeMar Logistics Driver App ("App"), you agree to be bound by these Terms and Conditions. If you do not agree, do not use the App.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">2. Description of Service</h2>
        <p>The App is provided by DeMar Logistics ("Company") to facilitate communication between drivers and the Company for freight logistics operations, including load tracking, document uploads, GPS location sharing, and delivery confirmation.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">3. User Responsibilities</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>You must provide accurate information, including your phone number, when registering.</li>
          <li>You are responsible for maintaining the confidentiality of your device and account.</li>
          <li>You agree to use the App only for its intended purpose of freight logistics operations.</li>
          <li>You must comply with all applicable laws and regulations while using the App, including traffic and transportation laws.</li>
          <li>Do not use the App while actively driving. Pull over to a safe location before interacting with the App.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">4. GPS and Location Data</h2>
        <p>The App collects GPS location data to provide real-time tracking of shipments. By using the App, you consent to the collection and transmission of your location data to DeMar Logistics and authorized shippers during active load assignments. Location tracking is only active when you have an assigned load.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">5. Photos and Documents</h2>
        <p>Photos and documents uploaded through the App (including Bills of Lading, delivery photos, and Proof of Delivery) become part of the shipment record. You grant DeMar Logistics a non-exclusive license to use, store, and share these documents as necessary for logistics operations.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">6. Intellectual Property</h2>
        <p>The App, including its design, code, and content, is the property of DeMar Logistics. You may not copy, modify, distribute, or reverse engineer any part of the App.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">7. Limitation of Liability</h2>
        <p>DeMar Logistics provides the App "as is" without warranties of any kind. The Company is not liable for any damages arising from use of the App, including but not limited to data loss, service interruptions, or GPS inaccuracies.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">8. Termination</h2>
        <p>DeMar Logistics reserves the right to suspend or terminate your access to the App at any time, with or without cause. You may stop using the App at any time by uninstalling it from your device.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">9. Changes to Terms</h2>
        <p>DeMar Logistics may update these Terms at any time. Continued use of the App after changes constitutes acceptance of the updated Terms.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">10. Contact</h2>
        <p>For questions about these Terms, contact us at:</p>
        <p className="mt-1">DeMar Logistics<br />Phone: (775) 686-4349<br />Email: 3PL@DeMarTransportation.com</p>
      </section>
    </div>
  </div>
);

export default TermsAndConditions;
