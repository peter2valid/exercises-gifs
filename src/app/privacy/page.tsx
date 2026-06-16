import { Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — GymApp',
};

export default function PrivacyPage() {
  return (
    <div className="dashboard-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-[14px] bg-white text-black flex items-center justify-center shadow-lg">
            <Zap size={20} fill="currentColor" />
          </div>
          <Link href="/auth" className="text-white/40 text-sm hover:text-white transition-colors">← Back</Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-2">Last updated: June 16, 2025</p>
        <p className="text-white/30 text-xs mb-10">
          This policy applies globally and is designed to comply with the Kenya Data Protection Act 2019, EU/UK GDPR,
          California CCPA/CPRA, Brazil LGPD, South Africa POPIA, Canada PIPEDA, Singapore/Thailand PDPA,
          Nigeria NDPA 2023, and other applicable privacy laws worldwide.
        </p>

        <div className="space-y-8 text-white/70 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-base mb-3">1. Who we are (Data Controller)</h2>
            <p>GymApp is operated from Kenya. We are the data controller and data processor for all personal data collected through this platform.</p>
            <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
              <p><span className="text-white/50">Controller:</span> GymApp</p>
              <p><span className="text-white/50">Country:</span> Kenya</p>
              <p><span className="text-white/50">Contact:</span> <a href="mailto:peternjorogeirungu76@gmail.com" className="text-white/80 underline underline-offset-2">peternjorogeirungu76@gmail.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">2. What data we collect</h2>
            <div className="space-y-3">
              <div>
                <p className="text-white font-medium mb-1">Account data</p>
                <p>Email address, hashed password (never stored in plain text), display name if provided.</p>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Gym & membership data</p>
                <p>Gym associations, membership tier, check-in timestamps, staff or trainer role assignments.</p>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Workout data</p>
                <p>Exercises, sets, reps, and session history you choose to log.</p>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Billing data</p>
                <p>Subscription status and Paystack payment reference IDs. We never store full card numbers — payments are handled entirely by Paystack.</p>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Device data</p>
                <p>A random device ID generated on your device for offline sync. We do not collect location, hardware identifiers, or sensor data.</p>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Usage data</p>
                <p>Basic usage logs (page views, errors) for service reliability. No behavioural profiling or cross-site tracking.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">3. Legal basis for processing</h2>
            <p className="mb-3">We rely on the following lawful bases (required under GDPR, Kenya DPA, LGPD, POPIA, and equivalent laws):</p>
            <ul className="space-y-2">
              <li className="flex gap-2"><span className="text-white shrink-0">Contract</span><span>— processing your account data, sync, and gym membership to deliver the service you signed up for.</span></li>
              <li className="flex gap-2"><span className="text-white shrink-0">Consent</span><span>— email marketing or optional analytics, where you have explicitly opted in.</span></li>
              <li className="flex gap-2"><span className="text-white shrink-0">Legitimate interest</span><span>— fraud prevention, security monitoring, and service improvement.</span></li>
              <li className="flex gap-2"><span className="text-white shrink-0">Legal obligation</span><span>— retaining transaction records as required by applicable law.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">4. Who we share your data with</h2>
            <ul className="space-y-3">
              <li>
                <p className="text-white font-medium">Supabase (USA)</p>
                <p>Our database and authentication provider. Data is stored on servers in their cloud. Supabase is SOC 2 Type II certified. Transfers are covered by Standard Contractual Clauses (SCCs) for EU/UK users.</p>
              </li>
              <li>
                <p className="text-white font-medium">Paystack (Nigeria/USA)</p>
                <p>Processes payments. Subject to their own privacy policy. We only share the minimum data required to complete a transaction.</p>
              </li>
              <li>
                <p className="text-white font-medium">Gym owners and admins</p>
                <p>If you join a gym through GymApp, that gym's admin can see your name, email, and check-in history for their gym only.</p>
              </li>
            </ul>
            <p className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">We do not sell, rent, or trade your personal data to any third party. Ever.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">5. International data transfers</h2>
            <p>Your data may be stored and processed outside your country. When transferring data internationally we use:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>EU Standard Contractual Clauses (SCCs) for transfers involving EEA data</li>
              <li>UK International Data Transfer Agreements (IDTAs) for UK data</li>
              <li>We rely on Supabase's data processing agreements which cover these requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">6. How long we keep your data</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Account data — retained while your account is active.</li>
              <li>Workout data — retained until you delete it or close your account.</li>
              <li>Billing records — retained for 7 years as required by Kenyan tax law.</li>
              <li>Deleted accounts — personal data removed within 30 days of deletion request.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">7. Your rights</h2>
            <p className="mb-3">Depending on your country, you have some or all of the following rights:</p>
            <div className="space-y-2">
              {[
                ['Access', 'Request a copy of all personal data we hold about you.'],
                ['Rectification', 'Correct inaccurate or incomplete data.'],
                ['Erasure / Right to be forgotten', 'Request deletion of your account and data.'],
                ['Data portability', 'Receive your data in a machine-readable format (JSON/CSV).'],
                ['Objection', 'Object to processing based on legitimate interest.'],
                ['Restriction', 'Request we limit processing while a dispute is resolved.'],
                ['Withdraw consent', 'Where processing is consent-based, withdraw it at any time.'],
                ['Non-discrimination (CCPA)', 'California residents will not be denied service for exercising privacy rights.'],
                ['Lodge a complaint', 'You may complain to your local data protection authority.'],
              ].map(([right, desc]) => (
                <div key={right} className="flex gap-2">
                  <span className="text-white shrink-0">{right}:</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
            <p className="mt-4">To exercise any right, email <a href="mailto:peternjorogeirungu76@gmail.com" className="text-white/90 underline underline-offset-2">peternjorogeirungu76@gmail.com</a>. We will respond within 30 days (or 45 days for complex requests).</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">8. Cookies</h2>
            <p>We use only essential session cookies required for authentication. We do not use advertising cookies or third-party tracking pixels. You can disable cookies in your browser settings, but the app will not function without session cookies.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">9. Children's data</h2>
            <p>GymApp is not directed at children under 16 (or 13 in the USA). We do not knowingly collect data from children. If you believe a child has created an account, contact us immediately and we will delete it.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">10. Security</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Passwords hashed with bcrypt — never stored in plain text.</li>
              <li>All data transmitted over HTTPS/TLS.</li>
              <li>Row Level Security (RLS) enforced at the database layer — users can only access their own data.</li>
              <li>Supabase is SOC 2 Type II certified.</li>
              <li>We review security practices regularly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">11. Data breach notification</h2>
            <p>In the event of a data breach that affects your personal data, we will notify you and relevant regulators within 72 hours of becoming aware, as required by GDPR and equivalent laws.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">12. California residents (CCPA/CPRA)</h2>
            <p>California residents have additional rights under the CCPA/CPRA:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Right to know what personal information is collected and how it is used.</li>
              <li>Right to delete personal information.</li>
              <li>Right to opt out of the sale or sharing of personal information — <strong className="text-white">we do not sell or share your data.</strong></li>
              <li>Right to correct inaccurate personal information.</li>
              <li>Right to limit use of sensitive personal information.</li>
            </ul>
            <p className="mt-2">To submit a CCPA request, email <a href="mailto:peternjorogeirungu76@gmail.com" className="text-white/90 underline underline-offset-2">peternjorogeirungu76@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">13. Changes to this policy</h2>
            <p>We may update this policy. For material changes, we will notify you by email or in-app notice at least 14 days before the change takes effect. Continued use after that date constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">14. Applicable regulators</h2>
            <p className="mb-2">Depending on your location, you may have the right to complain to your local data protection authority, including:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Kenya — Office of the Data Protection Commissioner (ODPC)</li>
              <li>EU/EEA — your local EU supervisory authority</li>
              <li>UK — Information Commissioner's Office (ICO)</li>
              <li>South Africa — Information Regulator</li>
              <li>Nigeria — Nigeria Data Protection Commission (NDPC)</li>
              <li>Brazil — Autoridade Nacional de Proteção de Dados (ANPD)</li>
              <li>Canada — Office of the Privacy Commissioner of Canada</li>
            </ul>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <Link href="/terms" className="text-white/30 text-xs hover:text-white/60 transition-colors underline underline-offset-2">Terms of Service</Link>
          <span className="text-white/20 mx-3">·</span>
          <Link href="/auth" className="text-white/30 text-xs hover:text-white/60 transition-colors">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
