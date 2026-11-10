// Generated from prototype/bedre-prototype.html by scripts/generate-content.mjs. Edit freely after Phase 0.

export type Readiness = 'delivered' | 'via-partner' | 'in-build' | 'planned';
export type DomainId = 'ai' | 'cloud' | 'sec' | 'eng' | 'ent' | 'work' | 'auto' | 'growth' | 'edu' | 'ind' | 'prod' | 'cons';

export interface Domain {
  id: DomainId;
  slug: string;            // route: /services/[slug]
  name: string;
  icon: string;            // lucide icon name
  summary: string;
  /** UNVERIFIED guess from prototype. Do not display until owner confirms. */
  readiness: Readiness;
  challenges: string[];
  architecture: string[];  // layered flow, top to bottom
  stack: string[];
  useCases: string[];
  governance: string[];
  /** gradient for icon tile, only the six primary domains have one */
  gradient?: [string, string];
  iconPath?: string;       // inner SVG markup (24x24 viewBox)
}

export interface Service {
  id: string;              // prototype id, e.g. s-ai-custom-ai-agents
  slug: string;            // route: /services/[domain]/[slug]
  name: string;
  domain: DomainId;
  /** when set, the prototype linked this item to another page instead of a service page */
  redirectTo?: string;
}

export interface Challenge { prompt: string; serviceIds: string[] }
export interface Stage { name: string; description: string; deliverables: string[]; gradient: [string, string]; icon: string; iconPath: string }
export interface Solution { name: string; summary: string; audience: string; gradient: [string, string]; iconPath: string }
export interface Product { name: string; vendor: string; summary: string; bestFor: string; gradient: [string, string]; iconPath: string }
export interface CaseStudy { client: string; sector: string; scope: string; summary: string; tags: string[]; art: string; palette: number; approved: false }
export interface Article { title: string; category: string; type: string; excerpt: string; art: string; palette: number; published: null; author: null }
export interface Industry { name: string; slug: string; blurb: string; gradient: [string, string]; iconPath: string }
export interface Partner { name: string; logo: string; width: number; height: number; confirmed: false }
export interface Faq { q: string; a: string }

