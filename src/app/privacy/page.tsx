import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — iVa & Evergreen Preschool",
  description:
    "How the iVa app and Evergreen Preschool & Daycare collect, use, and protect personal information.",
};

const UPDATED = "23 August 2026";
const CONTACT_EMAIL = "info@evergreenpreschool.com";
const CONTACT_PHONE = "7411574504";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-gray-800">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: {UPDATED}</p>

      <p className="mt-6 leading-relaxed">
        This Privacy Policy explains how Evergreen Preschool &amp; Daycare and
        Intelliverify (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collect, use, and
        protect personal information when you use the <strong>iVa</strong> mobile
        app and our school web portal (together, the &ldquo;Service&rdquo;). The
        Service is provided to enrolled families and school staff to support
        communication, learning updates, fee payments, and school transport.
        The mobile app is distributed as <strong>iVa</strong> and{" "}
        <strong>IVA Edu</strong>.
      </p>

      <Section title="1. Who the Service is for">
        iVa is intended for use by <strong>adults</strong> — parents, guardians,
        and school staff. It is not directed at children. We do process
        information about children (such as attendance, photos, and progress
        notes) <em>on behalf of the school</em> and at the direction of the
        enrolling parent or guardian.
      </Section>

      <Section title="2. Information we collect">
        <ul className="mt-2 list-disc space-y-2 pl-6">
          <li>
            <strong>Account &amp; contact information</strong> — name, phone
            number, email, and your relationship to the child, used to create and
            secure your account.
          </li>
          <li>
            <strong>Child information</strong> — child name, date of birth,
            class/section, attendance, homework status, fee/payment status, and
            teacher progress notes, entered by school staff or parents.
          </li>
          <li>
            <strong>Medical information</strong> — blood group, allergies,
            medical conditions, and emergency contacts, provided by the
            parent/guardian so the school can care for the child safely.
          </li>
          <li>
            <strong>Pickup authorization</strong> — the names, relationship, and
            phone numbers of persons a parent authorizes to collect the child.
          </li>
          <li>
            <strong>Documents</strong> — enrolment and verification documents
            uploaded by the parent/guardian or school.
          </li>
          <li>
            <strong>Photos &amp; videos</strong> — classroom and activity photos
            and short videos (&ldquo;reels&rdquo;) uploaded by teachers, and any
            images you choose to upload.
          </li>
          <li>
            <strong>Face recognition data (biometric information)</strong> — to
            help staff tag children in school photos, the app uses on-device
            face-detection technology. A numerical representation
            (&ldquo;face template&rdquo;) of a face is generated{" "}
            <strong>on the device</strong> only to match faces during tagging; it
            is processed in memory and is <strong>not stored on our servers,
            sold, or shared</strong>. Only the resulting tag — the child&rsquo;s
            name and the position of the face box in the photo — is saved, so a
            parent sees photos relevant to their own child. This feature is used
            only within the school&rsquo;s account and never for advertising, and,
            where required by law, relies on the consent obtained from the
            parent/guardian by the school.
          </li>
          <li>
            <strong>Location</strong> — when a driver or helper shares the school
            bus position, the app collects the device&rsquo;s GPS location{" "}
            <strong>only while the app is in use</strong>, so parents can see the
            bus on the route. We do not track location in the background.
          </li>
          <li>
            <strong>Push notification tokens</strong> — a device identifier used
            to deliver announcements and alerts.
          </li>
          <li>
            <strong>Payment information</strong> — the mobile app{" "}
            <strong>displays</strong> fee amounts, due dates, payment status, and
            the payment mode recorded by the school (cash, UPI, or bank); it does
            not itself take card or bank details. Where online fee payment is
            offered through our web portal, it is handled by our third-party
            payment provider (Razorpay); we receive a record of the transaction
            (amount, status, receipt) but do not store full card or bank details
            on our servers.
          </li>
        </ul>
      </Section>

      <Section title="3. How we use information">
        <ul className="mt-2 list-disc space-y-2 pl-6">
          <li>To provide school updates, homework, photos, and announcements.</li>
          <li>
            To detect and tag faces in school photos so parents see photos
            relevant to their own child.
          </li>
          <li>To process and record fee payments and issue receipts.</li>
          <li>To show live school-bus location to authorised parents.</li>
          <li>To send notifications you have opted into.</li>
          <li>To secure accounts, prevent misuse, and operate the Service.</li>
        </ul>
        <p className="mt-3">
          We do <strong>not</strong> sell your personal information, and we do{" "}
          <strong>not</strong> use it for third-party advertising. iVa contains no
          ads.
        </p>
      </Section>

      <Section title="4. Sharing">
        We share information only as needed to run the Service: with your
        child&rsquo;s school, with service providers who host or process data on
        our behalf (such as our cloud host and payment provider), and where
        required by law. Photos and child information are visible only to that
        child&rsquo;s authorised parents/guardians and the school&rsquo;s staff.
      </Section>

      <Section title="5. Data security &amp; retention">
        All data is encrypted in transit (HTTPS/TLS). Access is restricted by
        role-based login. We retain information for as long as the child is
        enrolled and as required for legal and accounting purposes, after which it
        is deleted or anonymised.
      </Section>

      <Section title="6. Your choices &amp; data deletion">
        You may request access to, correction of, or deletion of your personal
        information by contacting us using the details below. When you request
        account deletion, we remove your account and associated personal data,
        except records we must keep for legal or accounting reasons. You can also
        turn off push notifications and location sharing from your device
        settings at any time.
      </Section>

      <Section title="7. Permissions the app requests">
        <ul className="mt-2 list-disc space-y-2 pl-6">
          <li>
            <strong>Location (while in use)</strong> — to share/show the school
            bus position.
          </li>
          <li>
            <strong>Photos / media</strong> — to view and upload class photos.
          </li>
          <li>
            <strong>Notifications</strong> — to deliver school announcements and
            alerts.
          </li>
        </ul>
      </Section>

      <Section title="8. Changes to this policy">
        We may update this policy from time to time. The &ldquo;Last
        updated&rdquo; date above reflects the latest revision.
      </Section>

      <Section title="9. Contact us">
        <p>
          Evergreen Preschool &amp; Daycare
          <br />
          1427, 13th Cross Road, Ananthnagar Phase 2, Electronic City, Bengaluru
          – 560100
          <br />
          Email:{" "}
          <a className="text-emerald-700 underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          <br />
          Phone / WhatsApp:{" "}
          <a className="text-emerald-700 underline" href={`tel:${CONTACT_PHONE}`}>
            {CONTACT_PHONE}
          </a>
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <div className="mt-2 leading-relaxed">{children}</div>
    </section>
  );
}
