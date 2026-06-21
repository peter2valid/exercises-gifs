/* eslint-disable react/no-unescaped-entities */
import { Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — GymApp',
};

export default function TermsPage() {
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

        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-2">Last updated: June 16, 2025</p>
        <p className="text-white/30 text-xs mb-10">
          These terms are governed by Kenyan law and are drafted to be compatible with international consumer
          protection laws including EU Consumer Rights Directive, US state laws, Australian Consumer Law,
          UK Consumer Rights Act, and equivalent frameworks worldwide.
        </p>

        <div className="space-y-8 text-white/70 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-base mb-3">1. Acceptance of terms</h2>
            <p>By creating an account, accessing, or using GymApp, you agree to be bound by these Terms of Service and our <Link href="/privacy" className="text-white/90 underline underline-offset-2">Privacy Policy</Link>. If you do not agree, do not use the service.</p>
            <p className="mt-2">These terms apply globally to all users regardless of location, unless specific local laws in your jurisdiction override them — in which case those laws apply to the extent required.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">2. The service</h2>
            <p>GymApp provides gym management and workout tracking tools including membership management, check-in tracking, workout logging, trainer programs, QR-based access, and billing management.</p>
            <p className="mt-2">We may modify, suspend, or discontinue features with reasonable notice. For paid subscribers, we will provide at least 30 days' notice before removing a core paid feature, and offer a prorated refund if the feature was material to your subscription.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">3. Eligibility</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>You must be at least 16 years old (or 13 in the USA, with parental consent).</li>
              <li>You must provide accurate, truthful information when creating your account.</li>
              <li>You must have the legal capacity to enter into a binding contract in your jurisdiction.</li>
              <li>Corporate users represent that they are authorised to bind the entity to these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">4. Your account</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>You are responsible for all activity under your account.</li>
              <li>Keep your password secure. Do not share credentials.</li>
              <li>Notify us immediately at <a href="mailto:peternjorogeirungu76@gmail.com" className="text-white/90 underline underline-offset-2">peternjorogeirungu76@gmail.com</a> if you suspect unauthorised access.</li>
              <li>You may not create multiple accounts to circumvent suspension or access restrictions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">5. Gym owners and administrators</h2>
            <p>If you register a gym on GymApp, you take on responsibilities as an independent data controller for your members' data. You must:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Obtain lawful consent or have a valid legal basis to collect and process member data.</li>
              <li>Comply with applicable data protection laws in your country and the countries of your members.</li>
              <li>Inform your members that their data is managed through GymApp and link them to this Privacy Policy.</li>
              <li>Not use GymApp to collect sensitive health data without appropriate member consent.</li>
              <li>Promptly remove member data when they exercise their right to erasure.</li>
            </ul>
            <p className="mt-3">GymApp processes member data on behalf of gym owners as a data processor (under GDPR) or service provider (under CCPA). Our Data Processing Agreement is available on request.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">6. Subscriptions and billing</h2>
            <ul className="space-y-2">
              <li className="flex gap-2"><span className="text-white shrink-0">Billing:</span><span>Payments are processed by Paystack and subject to their terms.</span></li>
              <li className="flex gap-2"><span className="text-white shrink-0">Renewal:</span><span>Subscriptions renew automatically at the end of each billing period unless cancelled before the renewal date.</span></li>
              <li className="flex gap-2"><span className="text-white shrink-0">Cancellation:</span><span>You may cancel at any time. Access continues until the end of the current billing period.</span></li>
              <li className="flex gap-2"><span className="text-white shrink-0">Refunds:</span><span>Contact us within 7 days of a charge if you believe it was made in error. We handle refunds on a case-by-case basis.</span></li>
              <li className="flex gap-2"><span className="text-white shrink-0">EU/UK users:</span><span>You have a 14-day statutory cooling-off right on digital services. This right is waived once you begin actively using paid features.</span></li>
              <li className="flex gap-2"><span className="text-white shrink-0">Price changes:</span><span>We will give 30 days' notice of price increases. Continued use after the notice period constitutes acceptance.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">7. Acceptable use</h2>
            <p className="mb-2">You must not use GymApp to:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Violate any applicable law or regulation.</li>
              <li>Access or attempt to access another user's account or data without authorisation.</li>
              <li>Reverse-engineer, scrape, or abuse the platform's APIs or infrastructure.</li>
              <li>Upload malicious code, viruses, or content designed to disrupt the service.</li>
              <li>Harass, impersonate, or harm other users.</li>
              <li>Use the service for any commercial purpose not expressly permitted.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">8. Intellectual property</h2>
            <p>GymApp and its content (code, design, branding, copy) are owned by us and protected by intellectual property laws. You retain ownership of your personal workout data. By using the service, you grant us a limited licence to store and process your data solely to provide the service to you.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">9. Disclaimer of warranties</h2>
            <p>GymApp is provided "as is" and "as available." We do not warrant that the service will be uninterrupted, error-free, or meet all your requirements. To the extent permitted by local law, we disclaim all implied warranties of merchantability and fitness for a particular purpose.</p>
            <p className="mt-2">Some jurisdictions (including EU member states, UK, and Australia) do not allow the exclusion of certain implied warranties. In those jurisdictions, our disclaimers apply to the maximum extent permitted by law, and your statutory rights remain unaffected.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">10. Limitation of liability</h2>
            <p>To the maximum extent permitted by applicable law, our total liability for any claim arising out of or relating to GymApp is limited to the greater of (a) the amount you paid us in the 3 months preceding the claim, or (b) USD $50.</p>
            <p className="mt-2">We are not liable for indirect, incidental, consequential, or punitive damages, including loss of data, business interruption, or lost profits.</p>
            <p className="mt-2 text-white/40 text-xs">Nothing in these terms excludes liability for death or personal injury caused by negligence, fraud, or any liability that cannot be excluded under applicable consumer protection law in your jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">11. Termination</h2>
            <p>We may suspend or terminate your account if you:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Violate these terms.</li>
              <li>Engage in fraudulent activity.</li>
              <li>Create security or legal risks for GymApp or its users.</li>
            </ul>
            <p className="mt-3">Where possible we will give you advance notice and an opportunity to respond. You may delete your account at any time by emailing <a href="mailto:peternjorogeirungu76@gmail.com" className="text-white/90 underline underline-offset-2">peternjorogeirungu76@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">12. Governing law and disputes</h2>
            <p>These terms are governed by the laws of Kenya.</p>
            <p className="mt-2">We prefer to resolve disputes informally — email us first. If that fails, disputes shall be submitted to binding arbitration under Kenyan law, except where prohibited by local consumer protection law.</p>
            <p className="mt-2 text-white/40 text-xs">EU and UK consumers retain the right to bring claims before courts in their country of residence and to use their jurisdiction's alternative dispute resolution bodies, regardless of any arbitration clause.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">13. Changes to these terms</h2>
            <p>We may update these terms. For material changes, we will provide at least 14 days' notice by email or in-app notification. If you do not accept the new terms, you may close your account before the effective date. Continued use after the effective date constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">14. Contact</h2>
            <p>For any questions about these terms or to exercise any rights, contact us at <a href="mailto:peternjorogeirungu76@gmail.com" className="text-white/90 underline underline-offset-2">peternjorogeirungu76@gmail.com</a>. We aim to respond within 5 business days.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <Link href="/privacy" className="text-white/30 text-xs hover:text-white/60 transition-colors underline underline-offset-2">Privacy Policy</Link>
          <span className="text-white/20 mx-3">·</span>
          <Link href="/auth" className="text-white/30 text-xs hover:text-white/60 transition-colors">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
