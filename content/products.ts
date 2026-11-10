// Generated from prototype/bedre-prototype.html by scripts/generate-content.mjs. Edit freely after Phase 0.
import type { Product } from './types';

/** Platforms Bedre resells. CTA: Get a quote. Partner status UNCONFIRMED. */
export const products: Product[] = [
  {
    "name": "Google Cloud",
    "vendor": "Google",
    "summary": "Servers, databases, analytics and AI services that scale with you.",
    "bestFor": "Hosting, migration, data and AI projects",
    "gradient": [
      "#1F6FFF",
      "#18C8F0"
    ],
    "iconPath": "<path d=\"M7 18a4 4 0 010-8 5.5 5.5 0 0110.6 1.2A3.4 3.4 0 0117 18H7z\"/>"
  },
  {
    "name": "Google Workspace",
    "vendor": "Google",
    "summary": "Business email on your own domain, with Drive, Docs, Meet and Calendar.",
    "bestFor": "Teams moving off free email or shared drives",
    "gradient": [
      "#0E9F8E",
      "#2BD4B4"
    ],
    "iconPath": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M3 7l9 6 9-6\"/>"
  },
  {
    "name": "Microsoft 365",
    "vendor": "Microsoft",
    "summary": "Word, Excel, Outlook and Teams, with security and device management.",
    "bestFor": "Offices that work in Excel, Outlook and Teams",
    "gradient": [
      "#F0641E",
      "#FFB347"
    ],
    "iconPath": "<rect x=\"4\" y=\"4\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"13\" y=\"4\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"4\" y=\"13\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"13\" y=\"13\" width=\"7\" height=\"7\" rx=\"1\"/>"
  },
  {
    "name": "ChatGPT for business",
    "vendor": "OpenAI",
    "summary": "An AI assistant for writing, research and analysis, with team controls.",
    "bestFor": "Teams that want one shared AI workspace",
    "gradient": [
      "#7A4DFF",
      "#4C6FFF"
    ],
    "iconPath": "<path d=\"M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z\"/><path d=\"M12 8.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z\"/>"
  },
  {
    "name": "Claude for business",
    "vendor": "Anthropic",
    "summary": "An AI assistant for long documents, coding and careful analysis.",
    "bestFor": "Teams that work with large documents and code",
    "gradient": [
      "#D6336C",
      "#FF7AA8"
    ],
    "iconPath": "<path d=\"M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4\"/>"
  }
];

/** Bedre-run platforms from the About page / ecosystem layers. Readiness labels UNVERIFIED. */
export const ventures = [
  {
    "name": "BEDRE ONE",
    "summary": "A unified client workspace concept for projects, support, subscriptions, billing and documents.",
    "readiness": "in-build",
    "serviceId": "s-prod-bedre-one"
  },
  {
    "name": "BedrePanel",
    "summary": "A centralized management platform for servers, hosting, DNS, SSL, backups and related operations.",
    "readiness": "planned",
    "serviceId": "s-prod-bedrepanel"
  },
  {
    "name": "Lurnzo",
    "summary": "A learning ecosystem focused on courses, digital education, skills and learning experiences.",
    "readiness": "in-build",
    "serviceId": "s-edu-lurnzo-learning-platform"
  },
  {
    "name": "CiteXBoard",
    "summary": "A platform concept to help businesses understand and improve visibility in AI-generated search experiences.",
    "readiness": "planned",
    "serviceId": "s-prod-citexboard"
  }
] as const;

export const ecosystemLayers = [
  {
    "name": "BEDRE WEB",
    "tagline": "The public front door",
    "summary": "Content, catalogue, assessments and enquiries.",
    "link": "home"
  },
  {
    "name": "BEDRE AI",
    "tagline": "The consultation layer",
    "summary": "Grounded Q&A, requirements capture and human handoff.",
    "link": "advisor"
  },
  {
    "name": "BEDRE ONE",
    "tagline": "The customer workspace",
    "summary": "Projects, subscriptions, support, billing, documents.",
    "link": "s-prod-bedre-one"
  },
  {
    "name": "BedrePanel",
    "tagline": "The infrastructure layer",
    "summary": "Servers, DNS, SSL, backups and mail on a separate control plane.",
    "link": "s-prod-bedrepanel"
  }
] as const;

