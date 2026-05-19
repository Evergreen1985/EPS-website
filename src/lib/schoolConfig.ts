export interface SchoolConfig {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  domain: string;

  contact: {
    phone: string;
    email: string;
    whatsappPhone: string;
  };

  address: {
    full: string;
    short: string;
    city: string;
    state: string;
    pincode: string;
    mapEmbedUrl: string;
    googleReviewsUrl: string;
  };

  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    darkColor: string;
    lightBg: string;
    fontHeading: string;
    fontBody: string;
  };

  branding: {
    logoUrl: string;
    logoWhiteUrl: string;
    faviconUrl: string;
  };

  social: {
    facebook: string;
    instagram: string;
    youtube: string;
    twitter: string;
  };

  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };

  hero: {
    heading: string;
    subheading: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: Array<{ value: string; label: string }>;
  };

  about: {
    heading: string;
    story: string;
    mission: string;
    vision: string;
    values: Array<{ icon: string; title: string; description: string }>;
    team: Array<{ name: string; role: string; bio: string; initials: string }>;
    facilities: Array<{ title: string; description: string }>;
  };

  rating: {
    score: string;
    count: string;
  };

  ai: {
    schoolContext: string;
    city: string;
    country: string;
    curriculumFocus: string;
  };

  auth: {
    passwordPrefix: string;
  };

  faq: Array<{ q: string; a: string }>;

  features: {
    transport: boolean;
    aiTools: boolean;
    feePayment: boolean;
    medicalRecords: boolean;
    payroll: boolean;
    ptmScheduler: boolean;
    blog: boolean;
    referral: boolean;
    gallery: boolean;
    community: boolean;
  };
}
