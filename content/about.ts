import type { Faq } from './types';

export const aboutSeo = {
  title: 'About Bedre Web Technologies | Engineering Digital Possibilities',
  description:
    'Bedre Web Technologies Pvt. Ltd. is a Bengaluru technology partner for digital engineering, AI, cloud, security, automation and consulting — serving clients in India, Australia, the UAE, the UK and the US.',
  positioning:
    'A technology partner that stays after launch — combining strategic consulting, digital engineering, cloud, AI, and human accountability to help businesses build for the long term.',
} as const;

export const aboutHero = {
  kicker: 'Who we are • What we believe • Where we are going',
  headline: 'Engineering Digital Possibilities. Empowering Business Growth.',
  headlineLines: ['Engineering Digital Possibilities.', 'Empowering Business Growth.'] as const,
  lead: 'From the first digital idea to a fully connected business, we build technology that moves you forward and keep it running after launch.',
  body: [
    'At Bedre Web Technologies Pvt. Ltd., we believe technology should do more than fix today’s problems. It should open up opportunities, simplify operations, protect what matters and lay a foundation for steady growth.',
    'We began as a web development and hosting company. Today we are a multidisciplinary technology partner: digital engineering, AI, cloud, cybersecurity, automation, digital growth and consulting.',
    'We combine engineering skill, clear thinking and human understanding, so what we build does more than work: it makes a difference.',
  ],
  philosophy: 'Our philosophy: Heartificial Intelligence — Intelligence with a Heart.',
  primaryCta: { label: 'Let’s Build Together', href: '/contact' },
  secondaryCta: { label: 'Explore Our Expertise', href: '/services' },
} as const;

export const aboutWho = {
  kicker: 'Who we are',
  title: 'Your Vision. Our Engineering. Shared Success.',
  subtitle: 'More than a technology provider',
  paragraphs: [
    'Every ambitious business reaches a point where technology becomes essential to its next stage of growth.',
    'Some need a first professional digital presence. Others need to connect separate systems, automate repetitive work, modernise infrastructure, bring in AI, or build a new digital product.',
    'We exist to make that journey clearer.',
    'At Bedre, consulting, engineering, implementation and ongoing operations sit under one accountable partner. You do not have to coordinate several vendors. We help you decide well and build systems that work together.',
    'We do not judge our work by what we launch. We judge it by the value it keeps delivering afterwards.',
  ],
  glance: [
    { label: 'Company', value: 'Bedre Web Technologies Pvt. Ltd.' },
    { label: 'Based in', value: 'JP Nagar, Bengaluru, India' },
    { label: 'Journey began', value: '2014' },
    { label: 'Incorporated', value: '2018' },
    { label: 'Service domains', value: '10' },
    { label: 'Markets served', value: 'India · Middle East · Australia · UAE · UK · US' },
  ],
} as const;

export const aboutStory = {
  kicker: 'Our story',
  title: 'Built from Curiosity. Grown Through Trust.',
  subtitle: 'The journey that shaped us',
  paragraphs: [
    'Great technology companies do not begin with a long list of services. They begin with a problem worth solving.',
    'Our journey started in 2014 with a simple observation: businesses were going digital, but many still ran on manual processes, disconnected tools and had little dependable technical guidance.',
    'What began as an initiative to deliver web development, hosting, and digital services gradually evolved into something much larger.',
    'As our clients grew, so did their needs: better visibility, stronger infrastructure, smarter applications, automated operations, reliable communication, and a partner who understood their business beyond a single project.',
    'We grew alongside them.',
    'Today Bedre brings experience across several technology disciplines, with a growing focus on automation, cloud, enterprise platforms and AI-powered business solutions.',
    'For us, growing is not about adding services. It is about widening what is possible for the businesses that trust us.',
  ],
} as const;

export const aboutEvolution: { period: string; title: string; body: string }[] = [
  {
    period: '2014',
    title: 'The Beginning',
    body: 'Our journey began under the name Quincy Solutions, exploring opportunities in web technologies and digital business services.',
  },
  {
    period: '2015',
    title: 'Business Conception',
    body: 'A clearer service vision emerged around web development, hosting, digital infrastructure and technology solutions.',
  },
  {
    period: '2016',
    title: 'Bedre Solutions',
    body: 'The Bedre Solutions identity took shape, strengthening the foundation for broader technology services.',
  },
  {
    period: '2018',
    title: 'Corporate Incorporation',
    body: 'Bedre Web Technologies Pvt. Ltd. was incorporated, marking an important milestone in our professional journey.',
  },
  {
    period: '2019',
    title: 'Startup India Recognition',
    body: 'A new chapter with Startup India recognition and continued expansion of our technology capabilities.',
  },
  {
    period: '2020–2023',
    title: 'Beyond Web Development',
    body: 'Our capabilities expanded across digital marketing, cloud services, custom applications, business systems and managed technology.',
  },
  {
    period: '2024–2026',
    title: 'Intelligence and Automation',
    body: 'Growing investment in AI solutions, intelligent workflows, SaaS concepts, education technology and centralized infrastructure management.',
  },
  {
    period: 'The Future',
    title: 'Connected Digital Ecosystems',
    body: 'Our direction is toward integrated platforms, AI-enabled operations, secure cloud environments and long-term technology partnerships.',
  },
];

export const aboutMissionVision = {
  kicker: 'Mission, vision and purpose',
  mission: {
    title: 'Our mission',
    body: 'To empower businesses with dependable, intelligent, and scalable technology solutions that simplify operations, strengthen digital capabilities, and enable sustainable growth.',
  },
  vision: {
    title: 'Our vision',
    body: 'To become a globally trusted technology and digital transformation partner, recognized for combining engineering excellence, practical innovation, responsible AI, and enduring client relationships.',
  },
  purpose: {
    title: 'Our purpose',
    body: 'To make advanced technology accessible, understandable, and valuable — ensuring every business, regardless of its size, can confidently build its digital future.',
  },
} as const;

export const aboutHeartificial = {
  kicker: 'Heartificial Intelligence',
  title: 'Intelligence with a Heart.',
  subtitle: 'Where human understanding meets intelligent technology',
  paragraphs: [
    'Artificial intelligence is changing how the world works. But we believe the most valuable intelligence is not simply the fastest or most advanced — it is the intelligence that understands human needs.',
    'Heartificial Intelligence represents our commitment to combining advanced technology with empathy, responsibility, transparency, and meaningful human oversight.',
    'It influences how we design digital experiences, automate business processes, advise our clients, and build intelligent systems.',
    'We believe the future belongs to organizations that use technology to amplify human capability, not replace human judgment.',
  ],
  closing: 'Technology provides the intelligence. People provide the purpose. Together, they create meaningful progress.',
} as const;

export const aboutDifference: { title: string; body: string }[] = [
  {
    title: 'Strategy Before Technology',
    body: 'We begin by understanding your business objectives before recommending platforms, tools or infrastructure.',
  },
  {
    title: 'Connected Thinking',
    body: 'We consider how your website, CRM, cloud, marketing, automation and data should work together.',
  },
  {
    title: 'Your Data. Your Control.',
    body: 'We prioritize access ownership, documentation, portability and transparent handling of business-critical data.',
  },
  {
    title: 'Investment-Conscious Engineering',
    body: 'We recommend solutions that balance business value, implementation cost and long-term sustainability.',
  },
  {
    title: 'Human Accountability',
    body: 'AI and automation support our work, while responsible professionals remain involved in decisions and delivery.',
  },
  {
    title: 'Long-Term Partnership',
    body: 'Our engagement does not have to end at deployment. We plan for support, optimization and future improvements.',
  },
];

export const aboutCapabilities = {
  kicker: 'Expertise',
  title: 'Expertise Across Your Entire Digital Ecosystem.',
  subtitle: 'One technology partner • Multiple disciplines',
  lead: 'Modern businesses need more than isolated technology solutions. They need systems that communicate, infrastructure that scales, applications that evolve, and intelligence that supports better decisions. Our capabilities span ten complementary domains.',
} as const;

export const aboutOutcomes: { problem: string; approach: string; outcome: string }[] = [
  {
    problem: 'Our business processes are too manual.',
    approach: 'We map repetitive activities, identify integration opportunities, and design workflows that reduce unnecessary manual work.',
    outcome: 'More consistent operations and less repetitive effort.',
  },
  {
    problem: 'Our systems do not communicate.',
    approach: 'We assess existing applications, data structures and integration possibilities before designing a connected architecture.',
    outcome: 'Better information flow and fewer disconnected processes.',
  },
  {
    problem: 'We need to use AI but do not know where to start.',
    approach: 'We identify practical use cases, assess data readiness, evaluate risks and create a phased AI adoption roadmap.',
    outcome: 'A clearer path toward responsible AI implementation.',
  },
  {
    problem: 'Our technology costs keep increasing.',
    approach: 'We review architecture, hosting, licensing and operational dependencies to identify realistic optimization opportunities.',
    outcome: 'Greater cost visibility and better-informed investment decisions.',
  },
  {
    problem: 'We rely on too many technology vendors.',
    approach: 'We establish a coordinated technology plan, clearer ownership and centralized visibility across systems and providers.',
    outcome: 'Reduced coordination complexity and stronger accountability.',
  },
];

export const aboutMethodology = {
  kicker: 'Our working methodology',
  title: 'A Clear Process. A Confident Journey.',
  lead: 'We believe successful technology projects require transparency, shared expectations, measurable outcomes and disciplined execution.',
  stageBlurbs: [
    'Understand your business goals, challenges, stakeholders and opportunities.',
    'Evaluate existing systems, infrastructure, data, security and operational requirements.',
    'Develop the technical blueprint, implementation roadmap, integrations and project scope.',
    'Build, configure, integrate and test solutions through structured development milestones.',
    'Review performance, usability, reliability and opportunities for continuous improvement.',
    'Provide agreed support, monitoring, maintenance and future technology guidance.',
  ],
} as const;

export const aboutEngineering = {
  kicker: 'Engineering mindset',
  title: 'Built for Today. Architected for Tomorrow.',
  intro:
    'We approach every technology engagement with a long-term engineering mindset. Our goal is not to create unnecessary complexity. It is to design the right architecture for the business, with appropriate consideration for maintainability, security, performance, integration and future expansion.',
  detail:
    'Whether developing a business website, implementing an AI assistant, or designing a multi-user SaaS application, we focus on building technology that can evolve as requirements change.',
  pillars: [
    { title: 'Scalability by design', body: 'Architecture aligned with actual business needs and realistic growth.' },
    { title: 'Security from the foundation', body: 'Access control, protection, monitoring and responsible data handling.' },
    { title: 'Interoperability', body: 'APIs and integrations that reduce unnecessary system isolation.' },
    { title: 'Maintainability', body: 'Clear structure, documentation and manageable technology choices.' },
    { title: 'Operational visibility', body: 'Reporting, monitoring and defined responsibilities.' },
    { title: 'Continuous evolution', body: 'Systems designed to accommodate future improvements.' },
  ],
} as const;

export const aboutVenturesNote =
  'Product availability and development status vary. A consultant can confirm the current status of each solution.';

export const aboutVentureExtras: { name: string; summary: string }[] = [
  {
    name: 'ProLance Tech',
    summary: 'A venture focused on streamlined micro-service delivery and technology-enabled business services.',
  },
  {
    name: 'Bedre Solutions',
    summary: 'Digital foundations and supporting technology services for businesses establishing and maintaining their online presence.',
  },
];

export const aboutEcosystem: { category: string; items: string }[] = [
  {
    category: 'Cloud & Infrastructure',
    items: 'Amazon Web Services, Microsoft Azure, Google Cloud, Linux, Docker, cPanel and Plesk.',
  },
  {
    category: 'Digital Engineering',
    items: 'WordPress, WooCommerce, PHP, Laravel, Next.js, React, Node.js and MySQL.',
  },
  {
    category: 'Workplace, AI & Integrations',
    items: 'Microsoft 365, Google Workspace, OpenAI, Gemini, REST APIs and WhatsApp Business Platform.',
  },
];

export const aboutEcosystemNote =
  'We do not believe one platform is right for every business. Our responsibility is to understand the requirements, explain the trade-offs, and recommend a suitable technology direction.';

export const aboutIndustries = {
  kicker: 'Industry experience',
  title: 'Different Industries. One Commitment.',
  body: 'Our experience spans businesses with different operational needs, customer journeys, compliance considerations and growth ambitions.',
  list: [
    'Education and learning',
    'Healthcare and wellness',
    'Manufacturing and industrial',
    'Real estate and construction',
    'Retail and e-commerce',
    'Logistics and transportation',
    'Recycling and sustainability',
    'Professional services',
    'Hospitality and tourism',
    'Startups and technology',
  ],
  closing:
    'We recognize that every industry has its own workflows, challenges and expectations. Rather than applying a fixed solution everywhere, we adapt our technology approach to the realities of each business.',
} as const;

export const aboutGlobal = {
  kicker: 'Global perspective',
  title: 'Built in Bengaluru. Connected to the World.',
  lead: 'Our roots are in JP Nagar, Bengaluru — a city recognized for technology, entrepreneurship and engineering talent.',
  body: 'From this foundation, we work with clients across India and international markets, supporting digital initiatives through remote collaboration, structured project management and agreed communication practices.',
  closing: 'Our location defines where we began, not the boundaries of what we can build.',
} as const;

export const aboutLeadership = {
  kicker: 'Leadership',
  title: 'Technology Leadership Grounded in Execution.',
  name: 'Dr. Sunil Bedre',
  role: 'Founder & Director, Bedre Web Technologies Pvt. Ltd.',
  bio: [
    'From hands-on web development and design to project management, business leadership and technology consulting, Dr. Sunil Bedre’s professional journey reflects a belief that effective technology leadership requires both technical understanding and business perspective.',
    'His approach emphasizes practical decision-making, sustainable investment, client data ownership, operational efficiency and long-term digital strategy.',
    'As Founder and Director, he guides the company’s direction and remains involved in technology planning, solution strategy and key client relationships.',
  ],
  quote:
    'The right technology decision is not always the most expensive or most complicated. It is the one that helps a business move forward with confidence, clarity, and control.',
} as const;

export const aboutValues: { title: string; body: string }[] = [
  {
    title: 'Integrity in Every Decision',
    body: 'We value clear communication, honest recommendations and transparency in the way we work.',
  },
  {
    title: 'Ownership and Accountability',
    body: 'We take responsibility for our commitments and maintain clarity around deliverables, expectations and support.',
  },
  {
    title: 'Innovation with Purpose',
    body: 'We explore new technology when it can create meaningful value, not simply because it is new.',
  },
  {
    title: 'Respect for Business Data',
    body: 'We believe clients should understand and retain appropriate control over their systems, information and digital assets.',
  },
  {
    title: 'Learning Never Stops',
    body: 'Technology evolves continuously, and so must our skills, methods and thinking.',
  },
  {
    title: 'Relationships Beyond Transactions',
    body: 'We aim to build trust through consistent delivery, thoughtful guidance and long-term collaboration.',
  },
];

export const aboutClientExperience = {
  kicker: 'Client experience',
  title: 'Trust Is Built Through Delivery.',
  paragraphs: [
    'Every project represents more than a technical requirement. It represents someone’s investment, business ambition, operational challenge or growth opportunity.',
    'We value the confidence our clients place in us and work to earn that trust through understanding, communication, execution and continued engagement.',
    'Our approach emphasizes transparent scopes, realistic expectations, agreed milestones, clear communication and accountable support.',
    'Because successful technology partnerships are built one commitment at a time.',
  ],
  testimonialNote:
    'Approved client testimonials with names, companies and project outcomes can be added here when available. We do not publish fabricated testimonials or performance metrics.',
} as const;

export const aboutFuture = {
  kicker: 'Our future',
  title: 'Building the Next Generation of Intelligent Businesses.',
  paragraphs: [
    'The next chapter of digital transformation will be shaped by artificial intelligence, connected business systems, secure infrastructure and increasingly autonomous workflows.',
    'Our ambition is to help businesses prepare for that future without losing sight of what matters today.',
    'We envision a world where organizations can manage their digital operations through connected platforms, make better decisions with trusted information, automate repetitive activities responsibly, and expand without unnecessary technological complexity.',
    'As we continue to develop our capabilities, partnerships and products, our direction remains clear: create technology ecosystems that give businesses greater visibility, independence, efficiency and control.',
    'The future is not just digital. It is intelligent, connected, responsible and human.',
  ],
} as const;

export const aboutFinalCta = {
  kicker: 'Your next chapter starts here',
  title: 'Let’s Build Something That Lasts.',
  paragraphs: [
    'Whether you are starting a business, modernizing existing systems, exploring AI, or planning your next stage of growth, the right technology journey begins with the right conversation.',
    'Tell us where you are today and what you want to achieve. We will help you understand the possibilities, priorities and practical next steps.',
    'One conversation. A clearer direction. A technology partner for the journey ahead.',
  ],
  primaryCta: { label: 'Talk to Our Team', href: '/contact' },
  secondaryCta: { label: 'Explore BEDRE AI', href: '/advisor' },
} as const;

export const aboutFaqs: Faq[] = [
  {
    q: 'What does Bedre Web Technologies do?',
    a: 'Bedre is a technology partner delivering websites, software, AI solutions, cloud and hosting, security-related services, enterprise applications, workplace tools, automation, digital marketing and consulting.',
  },
  {
    q: 'Where is Bedre Web Technologies based?',
    a: 'Our team is based in JP Nagar, Bengaluru, Karnataka, India.',
  },
  {
    q: 'Which countries does Bedre work with?',
    a: 'We serve clients in India, the Middle East, Australia, the United Arab Emirates, the United Kingdom and the United States.',
  },
  {
    q: 'How did Bedre start?',
    a: 'Our journey began in 2014 with web and digital services. The company was incorporated as Bedre Web Technologies Pvt. Ltd. in 2018.',
  },
  {
    q: 'How do I start a project?',
    a: 'Contact our team with your goals and current challenges. We begin with discovery, assess requirements and define an appropriate scope and plan.',
  },
  {
    q: 'Does Bedre provide support after launch?',
    a: 'Yes. We offer ongoing monitoring, maintenance and support where these are included in the agreed engagement.',
  },
];
