// Generated from prototype/bedre-prototype.html by scripts/generate-content.mjs. Edit freely after Phase 0.
import type { Faq } from './types';

export const brand = {
  name: 'Bedre Web Technologies',
  legal: 'Bedre Web Technologies Pvt. Ltd.',
  base: 'JP Nagar, Bengaluru',
  regions: [
  "India",
  "Australia",
  "UAE",
  "UK",
  "US"
],
  idea: 'Heartificial Intelligence: intelligence with a heart.',
} as const;

/** Hero slides from the prototype. NOTE: CLAUDE.md says headline "A technology journey, handled."; prototype ships variants A-D. Owner to decide. */
export const heroSlides = [
  {
    "kicker": "Bedre Web Technologies",
    "headline": "Technology, intelligently connected.",
    "body": "AI, cloud, cybersecurity, digital engineering and managed services from one team that stays with you after launch.",
    "primary": {
      "label": "Book a consultation",
      "route": "contact"
    },
    "secondary": {
      "label": "Explore solutions",
      "route": "solutions"
    },
    "art": [
      "layers",
      0
    ]
  },
  {
    "kicker": "BEDRE AI",
    "headline": "Describe the problem. Get a plan.",
    "body": "Our advisor maps your challenge to services, prepares a brief and hands over to a consultant.",
    "primary": {
      "label": "Try the advisor",
      "route": "advisor"
    },
    "secondary": {
      "label": "How it works",
      "route": "advisor"
    },
    "art": [
      "neural",
      1
    ]
  },
  {
    "kicker": "Technology assessment",
    "headline": "Where does your technology stand today?",
    "body": "Six questions, two minutes. See your maturity profile and where to start.",
    "primary": {
      "label": "Take the assessment",
      "route": "assess"
    },
    "secondary": {
      "label": "Talk to us",
      "route": "contact"
    },
    "art": [
      "compass",
      2
    ]
  }
];

export const principles = [
  {
    "title": "Facts first",
    "body": "Advice comes from the services we deliver. We say plainly when something is still in build or goes through a partner."
  },
  {
    "title": "People stay in the loop",
    "body": "The AI advisor prepares a brief. A consultant makes the commitment, the quote and the call."
  },
  {
    "title": "Plain language",
    "body": "You get scope, timeline and cost in words you can forward to your board without translating them."
  },
  {
    "title": "We stay after launch",
    "body": "Monitoring, backups, support and improvement are part of the plan from the first meeting."
  }
];
/** DRAFTED by the assistant in the prototype. Owner review required. */
export const growthStory = [
  {
    "title": "Web development and design",
    "body": "Where Bedre started: websites, brand and the craft of making them work for the business behind them."
  },
  {
    "title": "Digital marketing and SEO",
    "body": "Search, ads and reporting for clients who wanted growth after launch, not just a site."
  },
  {
    "title": "Own products",
    "body": "CRM and lead management, learning platforms and ad-reporting tools built from client problems."
  },
  {
    "title": "One platform",
    "body": "BEDRE WEB, AI, ONE and BedrePanel bring the public site, advisor, workspace and infrastructure together."
  }
];

export const homeFaqs: Faq[] = [
  {
    "q": "Do you work with small businesses?",
    "a": "Yes. Most clients are small and mid-size companies across India, Australia, the UAE, the UK and the US."
  },
  {
    "q": "Can I get a price from the AI advisor?",
    "a": "No. Prices come from a consultant after scoping, so the number is one you can rely on."
  },
  {
    "q": "Who owns the work?",
    "a": "You do. Code, content and accounts are handed over at the end of the engagement."
  },
  {
    "q": "What happens after launch?",
    "a": "You can move to a managed plan with monitoring, backups and support, or take it in house."
  }
];

export const serviceFaqs: Faq[] = [
  {
    "q": "How long does a typical engagement take?",
    "a": "It depends on scope. The Assess stage produces a timeline you can review before committing."
  },
  {
    "q": "Who owns the accounts and data?",
    "a": "You do. Domains, cloud accounts and data stay in your name wherever possible."
  },
  {
    "q": "Can this connect to tools we already use?",
    "a": "Usually yes. The Architect stage lists connectors and any limits."
  }
];

export const industryWorkflows: Record<string,string> = {
  "Education": "Admissions, LMS, student portal, fee reminders",
  "Healthcare": "Appointment booking, records access, reminders",
  "Manufacturing": "Product catalogue, RFQ, dealer portal",
  "Retail": "Storefront, inventory sync, WhatsApp orders",
  "Real": "Project microsites, site-visit scheduling, lead scoring",
  "Travel": "Itinerary builder, enquiry to booking, payments"
};

