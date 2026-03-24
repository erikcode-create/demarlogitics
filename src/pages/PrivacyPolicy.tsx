const PrivacyPolicy = () => (
  <div className="max-w-3xl mx-auto px-6 py-12 text-foreground">
    <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
    <p className="text-sm text-muted-foreground mb-8">Last updated: March 23, 2026</p>

    <div className="space-y-6 text-sm leading-relaxed">
      <section>
        <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
        <p>DeMar Logistics ("Company," "we," "us") collects the following information through the DeMar Logistics Driver App ("App"):</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Phone number:</strong> Used to match you with assigned loads in our system.</li>
          <li><strong>GPS location data:</strong> Collected during active load assignments to provide real-time shipment tracking. This includes latitude, longitude, speed, heading, and accuracy.</li>
          <li><strong>Photos and documents:</strong> Bills of Lading, delivery photos, and Proof of Delivery signatures uploaded through the App.</li>
          <li><strong>Device information:</strong> App version and basic device identifiers for troubleshooting.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To match you with your assigned loads and provide load details.</li>
          <li>To share your real-time GPS location with DeMar Logistics dispatchers and authorized shippers for shipment tracking.</li>
          <li>To store and manage delivery documentation (BOL photos, delivery photos, POD signatures).</li>
          <li>To communicate with you about your loads and deliveries.</li>
          <li>To improve the App and our logistics services.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">3. Location Data</h2>
        <p>GPS tracking is only active when you have an assigned load in the App. We do not track your location when you have no active loads. Location data is shared with:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>DeMar Logistics dispatch team for operational coordination.</li>
          <li>Authorized shippers who have contracted with DeMar Logistics for the specific load you are hauling.</li>
        </ul>
        <p className="mt-2">You can stop location sharing at any time by stopping tracking within the App.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">4. Data Storage and Security</h2>
        <p>Your data is stored securely using Supabase cloud infrastructure with row-level security policies. We implement industry-standard security measures to protect your information. Photos and documents are stored in encrypted cloud storage.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">5. Data Sharing</h2>
        <p>We do not sell your personal information. We share data only with:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Authorized shippers for load tracking purposes.</li>
          <li>Service providers who help us operate the App (cloud hosting, database services).</li>
          <li>Law enforcement or regulatory authorities when required by law.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">6. Data Retention</h2>
        <p>We retain your data for as long as necessary to provide our services and comply with legal obligations. Load-related data (documents, tracking history) is retained for the duration required by applicable transportation regulations.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Request access to your personal data.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your data (subject to legal retention requirements).</li>
          <li>Stop using the App at any time by uninstalling it.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">8. Children's Privacy</h2>
        <p>The App is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from minors.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">9. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes through the App. Continued use of the App after changes constitutes acceptance.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">10. Contact Us</h2>
        <p>For privacy-related questions or requests, contact us at:</p>
        <p className="mt-1">DeMar Logistics<br />Phone: (775) 686-4349<br />Email: 3PL@DeMarTransportation.com</p>
      </section>
    </div>
  </div>
);

export default PrivacyPolicy;
