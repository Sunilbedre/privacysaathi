import { dpdpDeadline, dpdpDuties, dpdpPenalties, dpdpWhat } from '@/content/dpdp';

/** The DPDP chat script: what Saathi says, what the visitor can pick, and the short notes that teach as it goes. Pure data, no UI. */
export type Chip = [value: string, label: string];
export type Flow = 'check' | 'expert' | 'learn';

export const INDUSTRIES: Chip[] = [['retail', 'Retail / e-commerce'], ['education', 'Education'], ['healthcare', 'Healthcare'], ['fintech', 'Fintech / finance'], ['manufacturing', 'Manufacturing'], ['realestate', 'Real estate'], ['hospitality', 'Hospitality'], ['professional', 'Professional services'], ['saas', 'SaaS / IT'], ['agency', 'Agency'], ['other', 'Other']];
export const SIZES: Chip[] = [['1-10', '1 to 10'], ['11-50', '11 to 50'], ['51-200', '51 to 200'], ['201-1000', '201 to 1,000'], ['1000+', 'More than 1,000']];
export const DATA: Chip[] = [['contact', 'Names, emails, phones'], ['payment', 'Payment / bank details'], ['ids', 'ID numbers (Aadhaar, PAN)'], ['health', 'Health information'], ['location', 'Location / device data'], ['staff', 'Employee records'], ['children', 'Children’s data (under 18)']];
export const RECORDS: Chip[] = [['under1k', 'Under 1,000'], ['1k-100k', '1,000 to 1 lakh'], ['100k+', 'Over 1 lakh'], ['unsure', 'Not sure']];
export const STORAGE: Chip[] = [['india', 'In India'], ['abroad', 'Outside India'], ['unknown', 'Not sure']];
export const YN: Chip[] = [['yes', 'Yes'], ['no', 'No']];
export const YPN: Chip[] = [['yes', 'Yes'], ['partly', 'Partly'], ['no', 'No']];
export const YNU: Chip[] = [['no', 'No'], ['yes', 'Yes'], ['unsure', 'Not sure']];
export const TOPICS: Chip[] = [['Readiness check and report', 'Review my readiness'], ['Fix gaps found', 'Fix the gaps'], ['Privacy notice and consent', 'Notice and consent'], ['Breach response plan', 'Breach plan'], ['Security safeguards', 'Security safeguards'], ['Something else', 'Something else']];
export const TIMES: Chip[] = [['Morning', 'Morning'], ['Afternoon', 'Afternoon'], ['Evening', 'Evening'], ['Any time', 'Any time']];
export const LEARN: Chip[] = [['what', 'What is the DPDP Act?'], ['who', 'Does it apply to me?'], ['deadline', 'The deadline'], ['fines', 'Fines'], ['consent', 'Notice and consent'], ['breach', 'Data breaches'], ['children', 'Children’s data'], ['rights', 'People’s rights']];

/** Ordered questions of the readiness check, used for the progress bar. */
export const CHECK_STEPS = ['biz', 'hasSite', 'industry', 'size', 'data', 'records', 'storage', 'hasPolicy', 'consentRecords', 'breachPlan', 'requestOwner', 'training', 'vendors', 'name', 'phone', 'email', 'consent'] as const;

/** One short teaching line after certain answers. Plain statements taken from the Act's duties, no legal advice. */
export const NOTE: Record<string, Record<string, string>> = {
  hasPolicy: { no: 'A clear written notice is the first thing the Act asks for (Section 5). It is also the easiest gap to close.' },
  consentRecords: { no: 'Consent has to be provable. Keeping a record of who agreed, when and to what is a core duty (Section 6).', partly: 'Partial records are common. The Act expects you to be able to show consent for every person.' },
  breachPlan: { no: 'A breach must be reported to the Data Protection Board and affected people, with a detailed report within 72 hours. Having a plan before it happens matters.', partly: 'A partial plan helps, but the 72-hour report to the Board is the part most teams are not ready for.' },
  vendors: { yes: 'You stay responsible for personal data your vendors handle for you, so vendor contracts and checks matter.' },
  requestOwner: { no: 'People can ask to see, correct or erase their data, and complain to you first. Someone should own that.' },
  data: { children: 'Children’s data needs verifiable parental consent (Section 9). It sits in a high penalty tier, so we will look closely at it.', health: 'Health data is sensitive in practice. Strong safeguards and clear consent matter most here.' },
};

export const days = () => Math.max(0, Math.ceil((Date.parse(dpdpDeadline + 'T00:00:00+05:30') - Date.now()) / 86400000));

const duty = (i: number) => `${dpdpDuties[i].title}: ${dpdpDuties[i].body}`;
/** Answers to "Understand the DPDP Act", built from the same text as the DPDP page. */
export function learnAnswer(k: string): string[] {
  switch (k) {
    case 'what': return [dpdpWhat[0][1], dpdpWhat[2][1]];
    case 'who': return [dpdpWhat[1][1], 'If you handle customer, lead, user or employee data in India, it very likely applies to you.'];
    case 'deadline': return [`Most duties apply around 13 May 2027. That is about ${days()} days from today, so there is not much time to map data and fix systems.`, 'Dates come from published summaries of the Act and Rules. Confirm with your legal adviser.'];
    case 'fines': return ['The Act allows these maximum penalties:', ...dpdpPenalties.map(([a, b]) => `${a}: ${b}`), 'Actual penalties are decided by the Data Protection Board.'];
    case 'consent': return [duty(0), duty(1)];
    case 'breach': return [duty(4), 'The penalty for not reporting a breach can reach ₹200 crore.'];
    case 'children': return [duty(5)];
    case 'rights': return [duty(6)];
    default: return ['I can explain the basics, the deadline, fines and each duty. Pick a topic below.'];
  }
}

export const FIRST = (n: string) => n.trim().split(/\s+/)[0] || 'there';
