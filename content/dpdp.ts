/**
 * Copy for the DPDP landing page (/dpdp). Written from public summaries of the Digital Personal Data Protection Act, 2023 and the
 * DPDP Rules, 2025 (see `dpdpSources`). General information only, not legal advice. No claim of certification, legal status or
 * guaranteed compliance. Owner and legal counsel to review wording and dates before launch.
 */
export const dpdpDeadline = '2027-05-13'; // approx. 18 months after the Rules were published (14 Nov 2025). Confirm in the Gazette.

export const dpdpWhat = [
  ['What it is', 'India’s data protection law. It sets rules for how any organisation collects, uses, stores and shares the personal data of people in India.'],
  ['Who it applies to', 'Any business that handles personal data of individuals in India: customers, employees, leads and users. This includes small businesses and companies outside India that serve people in India.'],
  ['Why it matters now', 'The detailed Rules were notified in November 2025. Most duties start about 18 months later, so the time to map your data and fix your systems is now.'],
] as const;

export const dpdpTimeline = [
  { when: 'Aug 2023', title: 'The Act becomes law', body: 'The Digital Personal Data Protection Act, 2023 receives the President’s assent.' },
  { when: 'Nov 2025', title: 'The Rules are notified', body: 'The DPDP Rules, 2025 are notified on 13 November and published on 14 November. Some enabling provisions start at once.' },
  { when: 'Around Nov 2026', title: 'Consent managers', body: 'The rules for registering consent managers start about 12 months after publication.' },
  { when: 'Around May 2027', title: 'Main duties apply', body: 'Notice, consent, security safeguards, breach reporting, children’s data and data principal rights start about 18 months after publication.' },
] as const;

export const dpdpPenalties = [
  ['Up to ₹250 crore', 'Failing to keep reasonable security safeguards to prevent a personal data breach.'],
  ['Up to ₹200 crore', 'Failing to notify the Data Protection Board and affected people of a breach, or breaching duties on children’s data.'],
  ['Up to ₹150 crore', 'Failing to meet the additional duties of a Significant Data Fiduciary.'],
] as const;

/** What the law asks of a business. `serviceId` points at the Bedre service that usually helps with it. */
export const dpdpDuties: { title: string; body: string; serviceId?: string }[] = [
  { title: 'Clear notice', body: 'Tell people, in plain language, what data you collect, why, and how to withdraw consent or complain.', serviceId: 's-cons-technology-advisory' },
  { title: 'Valid consent', body: 'Ask for consent that is free, specific, informed and clear, and make it as easy to withdraw as to give.', serviceId: 's-ent-custom-business-applications' },
  { title: 'Collect only what you need', body: 'Use personal data only for the purpose you stated, and keep it only as long as that purpose needs.', serviceId: 's-ent-enterprise-data-integration' },
  { title: 'Reasonable security', body: 'Protect data with safeguards such as encryption, access control, logging and backups, so a breach is prevented or contained.', serviceId: 's-sec-security-consulting' },
  { title: 'Breach response', body: 'Tell the Data Protection Board and affected people about a breach, and send a detailed report to the Board within 72 hours.', serviceId: 's-sec-security-monitoring' },
  { title: 'Children’s data', body: 'Get verifiable parental consent for anyone under 18, and avoid tracking or targeted advertising aimed at children.', serviceId: 's-ent-custom-business-applications' },
  { title: 'People’s rights', body: 'Let people see a summary of their data, correct it, have it erased, nominate someone, and complain to you first.', serviceId: 's-ent-workflow-digitization' },
  { title: 'Logs and erasure', body: 'Keep traffic data and processing logs for at least one year, then erase data you no longer need.', serviceId: 's-cloud-backup-and-disaster-recovery' },
];

export const dpdpSteps = [
  ['Map your data', 'Find where personal data enters, where it lives and who can reach it: website forms, CRM, email, spreadsheets, apps and vendors.'],
  ['Check the gaps', 'Compare what you do today with what the Act and Rules ask for, and rank the gaps by risk.'],
  ['Fix notices and consent', 'Update forms, notices and consent records so each choice is clear, recorded and easy to withdraw.'],
  ['Strengthen security', 'Add access control, multi-factor login, encryption, backups and logging where the review shows gaps.'],
  ['Plan for a breach', 'Write a response plan, test it, and set up the monitoring and logs you would need to report one.'],
  ['Train and keep it running', 'Brief your team, set up ways to handle people’s requests, and review regularly as the Rules settle.'],
] as const;

/** Yes/no self-check. Each "yes" scores one point. */
export const dpdpChecks = [
  'We know where personal data enters our business and where it is stored.',
  'Our forms and apps show a clear notice before collecting personal data.',
  'We record who gave consent, when, and for what.',
  'People can withdraw consent as easily as they gave it.',
  'We only keep personal data for as long as we need it.',
  'Access to personal data is limited, and key systems use multi-factor login.',
  'Personal data is encrypted and backed up, and we keep access logs.',
  'We have a written plan for a data breach, including who to tell and when.',
  'We have a way to handle requests to see, correct or erase someone’s data.',
  'We check how our vendors and tools handle the personal data we give them.',
] as const;

export const dpdpFaqs: { q: string; a: string }[] = [
  { q: 'Does the DPDP Act apply to a small business?', a: 'Yes. The Act applies to any organisation that handles personal data of people in India, whatever its size. Some duties are heavier for large or high-risk organisations, called Significant Data Fiduciaries.' },
  { q: 'Does it apply to a company outside India?', a: 'It can. The Act covers processing outside India when it relates to offering goods or services to people in India.' },
  { q: 'What counts as personal data?', a: 'Any data about an identifiable person: name, phone number, email, address, account details, location and similar. It covers digital data, and paper records that are later digitised.' },
  { q: 'When do I have to be ready?', a: 'Most duties for businesses start about 18 months after the Rules were published in November 2025, which is around May 2027. Confirm the exact dates with your legal adviser.' },
  { q: 'What is a data fiduciary?', a: 'The organisation that decides why and how personal data is processed. That is usually you, the business. Vendors that process data for you are called data processors.' },
  { q: 'Can personal data be sent outside India?', a: 'Generally yes, except to countries the government restricts. Check the current notifications and your sector rules, which can be stricter.' },
  { q: 'What does Bedre actually do?', a: 'We help with the technical and operational side: data mapping, forms and consent flows, security controls, logging, backups and breach readiness. We are not a law firm, so we do not give legal advice or certify compliance. Your legal adviser confirms what the law requires.' },
];

export const dpdpSources = [
  ['EY: DPDP Rules, 2025', 'https://www.ey.com/en_in/insights/cybersecurity/transforming-data-privacy-digital-personal-data-protection-rules-2025'],
  ['JSA Prism: DPDP Rules, November 2025', 'https://www.jsalaw.com/wp-content/uploads/2025/11/JSA-Prism-InfoTech-November-2025-DPDP-Rules.Final_.pdf'],
  ['Mondaq: DPDP Rules 2025 highlights', 'https://www.mondaq.com/india/privacy-protection/1707558/digital-personal-data-protection-rules-2025-highlights'],
  ['Grant Thornton: phased obligations', 'https://www.grantthornton.in/insights/articles/dpdp-act-businesses-should-prepare-now-for-phased-obligations/'],
  ['EY: DPDP Act, 2023 explained', 'https://www.ey.com/en_in/insights/cybersecurity/decoding-the-digital-personal-data-protection-act-2023'],
] as const;
