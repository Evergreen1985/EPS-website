import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete Your Account & Data — IVA Edu",
  description:
    "How to request deletion of your IVA Edu account and associated personal data.",
};

const UPDATED = "23 August 2026";
const CONTACT_EMAIL = "developer@intelliverify.ai";
const CONTACT_PHONE = "7411574504";

export default function DeleteAccountPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-gray-800">
      <h1 className="text-3xl font-bold text-gray-900">
        Delete your account &amp; data
      </h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: {UPDATED}</p>

      <p className="mt-6 leading-relaxed">
        This page explains how to request deletion of your{" "}
        <strong>IVA Edu</strong> account (parent, teacher, admin or owner) and
        the personal data associated with it. IVA Edu is operated by{" "}
        <strong>Intelliverify</strong> for{" "}
        <strong>Evergreen Preschool &amp; Daycare</strong>.
      </p>

      <Section title="How to request deletion">
        <p>
          Send a deletion request by either of the methods below. Because school
          records contain a child&rsquo;s information, we verify every request
          before deleting.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong>Email</strong>{" "}
            <a className="text-emerald-700 underline" href={`mailto:${CONTACT_EMAIL}?subject=Delete%20my%20IVA%20Edu%20account`}>
              {CONTACT_EMAIL}
            </a>{" "}
            with the subject &ldquo;Delete my IVA Edu account&rdquo;, or
          </li>
          <li>
            <strong>Call / WhatsApp</strong> the school office at{" "}
            <a className="text-emerald-700 underline" href={`tel:${CONTACT_PHONE}`}>
              {CONTACT_PHONE}
            </a>
            , or ask at the front desk in person.
          </li>
        </ul>
        <p className="mt-3">
          Please include, so we can verify and locate your account:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>The parent&rsquo;s registered <strong>phone number</strong> (or, for staff, the <strong>username</strong>)</li>
          <li>The <strong>child&rsquo;s name</strong> (for parent accounts)</li>
        </ul>
      </Section>

      <Section title="What gets deleted">
        <p>On a verified request, we delete the personal data linked to the account, including:</p>
        <ul className="mt-2 list-disc space-y-2 pl-6">
          <li>Account and login details (name, phone/username, password)</li>
          <li>Child profile and enrolment details</li>
          <li>Photos, videos and face tags associated with the child</li>
          <li>Attendance, homework and fee records</li>
          <li>Medical information and emergency contacts</li>
          <li>Pickup authorizations and uploaded documents</li>
          <li>Community chat messages and reactions you posted</li>
          <li>Push-notification tokens</li>
        </ul>
      </Section>

      <Section title="Deleting only some of your data (without closing your account)">
        <p>
          You do not have to delete your whole account to remove specific
          information. You may ask us to delete <strong>particular data</strong>{" "}
          &mdash; for example a specific photo or video, a document, medical
          details, a pickup contact, or a community message &mdash; while keeping
          your account active. Use the same contact methods above and tell us
          exactly which information you would like removed. We will action
          verified requests within 30 days, subject to the retention note below.
        </p>
      </Section>

      <Section title="What may be retained">
        <p>
          We may retain a limited set of records where the law or legitimate
          accounting/regulatory obligations require it (for example, invoices and
          fee-payment records). Such records are kept only for the period
          required and are then deleted or anonymised. Retained records are not
          used for any other purpose.
        </p>
      </Section>

      <Section title="How long it takes">
        <p>
          We aim to process verified deletion requests within{" "}
          <strong>30 days</strong>. We will confirm by email or phone once your
          account and associated data have been deleted.
        </p>
      </Section>

      <Section title="Contact">
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
        <p className="mt-4 text-sm text-gray-500">
          See also our{" "}
          <a className="text-emerald-700 underline" href="/privacy">
            Privacy Policy
          </a>
          .
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
