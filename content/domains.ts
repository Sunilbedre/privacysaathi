// Generated from prototype/bedre-prototype.html by scripts/generate-content.mjs. Edit freely after Phase 0.
import type { Domain } from './types';

export const domains: Domain[] = [
  {
    "id": "ai",
    "slug": "ai-and-intelligence",
    "name": "AI & Intelligence",
    "icon": "sparkles",
    "summary": "Practical AI that is grounded in your data, governed, and wired into the systems your teams already use.",
    "readiness": "delivered",
    "challenges": [
      "Pilots that never reach production",
      "Answers that are not grounded in company knowledge",
      "No clear policy for data, risk and human approval"
    ],
    "architecture": [
      "Your data and documents",
      "Retrieval and guardrails",
      "Model and approved tools",
      "Apps, CRM and channels"
    ],
    "stack": [
      "OpenAI API",
      "pgvector",
      "Python / TypeScript",
      "n8n",
      "Redis queues",
      "OpenTelemetry"
    ],
    "useCases": [
      "Support assistant that cites policy documents",
      "Lead scoring that routes to the right salesperson",
      "Invoice and form extraction into finance tools"
    ],
    "governance": [
      "Per-tenant retrieval and tool allowlists",
      "Prompt-injection defences and rate limits",
      "Human approval for commercial or operational actions"
    ],
    "gradient": [
      "#7A4DFF",
      "#4C6FFF"
    ],
    "iconPath": "<rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"2\"/><path d=\"M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3\"/><path d=\"M12 9.6l.8 1.6 1.6.8-1.6.8-.8 1.6-.8-1.6-1.6-.8 1.6-.8z\"/>"
  },
  {
    "id": "cloud",
    "slug": "cloud-and-infrastructure",
    "name": "Cloud & Infrastructure",
    "icon": "cloud",
    "summary": "Architecture, migration and managed operations across AWS, Azure, Google Cloud and Bedre-managed hosting.",
    "readiness": "delivered",
    "challenges": [
      "Hosting that is slow, unmonitored or over-priced",
      "Migrations that risk downtime and data loss",
      "No tested backup or recovery plan"
    ],
    "architecture": [
      "Source environment",
      "Landing zone and network",
      "Workloads and data",
      "Monitoring and backups"
    ],
    "stack": [
      "AWS / Azure / GCP",
      "Docker",
      "GitHub Actions",
      "Terraform",
      "Nginx / Linux",
      "Prometheus / Grafana"
    ],
    "useCases": [
      "Move a business site and mail from shared hosting to a managed VPS",
      "Set up staging and production with promotion gates",
      "Quarterly cost review with right-sizing actions"
    ],
    "governance": [
      "Least-privilege access and secrets manager",
      "Restore tests on a schedule",
      "Staging and production isolated"
    ],
    "gradient": [
      "#D6336C",
      "#8E2DE2"
    ],
    "iconPath": "<path d=\"M7 18a4 4 0 010-8 5.5 5.5 0 0110.6 1.2A3.4 3.4 0 0117 18H7z\"/>"
  },
  {
    "id": "sec",
    "slug": "cybersecurity-and-identity",
    "name": "Cybersecurity & Identity",
    "icon": "shield-check",
    "summary": "Security assessment, identity and monitoring, delivered with vetted partners where specialist depth is needed.",
    "readiness": "via-partner",
    "challenges": [
      "Unknown exposure across sites, servers and mailboxes",
      "Shared passwords and no MFA",
      "Slow, manual response to incidents"
    ],
    "architecture": [
      "Assets and identities",
      "Controls and policies",
      "Detection and logging",
      "Response and reporting"
    ],
    "stack": [
      "OIDC / SAML",
      "WAF",
      "Wazuh / SIEM (partner)",
      "Nessus / OpenVAS",
      "Cloudflare",
      "Vault"
    ],
    "useCases": [
      "MFA rollout across email and admin panels",
      "Baseline vulnerability scan with a prioritised fix list",
      "Hardening of VPS and WordPress estates"
    ],
    "governance": [
      "Findings reported with evidence and severity",
      "Partner credentials shown only when verified",
      "Data handling aligned to client contracts"
    ],
    "gradient": [
      "#1F6FFF",
      "#18C8F0"
    ],
    "iconPath": "<path d=\"M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z\"/><path d=\"M9 12l2 2 4-4\"/>"
  },
  {
    "id": "eng",
    "slug": "digital-engineering",
    "name": "Digital Engineering",
    "icon": "code-2",
    "summary": "Websites, web apps, mobile apps and SaaS platforms, designed and built as maintainable products.",
    "readiness": "delivered",
    "challenges": [
      "Slow, hard-to-update websites",
      "Legacy applications that block new features",
      "Disconnected tools and manual data entry"
    ],
    "architecture": [
      "Experience layer",
      "Application and APIs",
      "Data and integrations",
      "CI/CD and observability"
    ],
    "stack": [
      "Next.js / React",
      "TypeScript",
      "NestJS / Node",
      "PostgreSQL",
      "Tailwind CSS",
      "Playwright"
    ],
    "useCases": [
      "Multi-page corporate website with CMS and enquiry routing",
      "Customer portal with role-based access",
      "Storefront integrated with inventory and billing"
    ],
    "governance": [
      "WCAG 2.2 AA targets",
      "Automated tests before every release",
      "Dependency scanning in CI"
    ],
    "gradient": [
      "#4338CA",
      "#7C5CFF"
    ],
    "iconPath": "<path d=\"M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14\"/>"
  },
  {
    "id": "ent",
    "slug": "enterprise-applications",
    "name": "Enterprise Applications",
    "icon": "building-2",
    "summary": "ERP, CRM, HRMS and custom business applications that replace spreadsheets and email threads.",
    "readiness": "delivered",
    "challenges": [
      "Leads, orders and invoices live in different tools",
      "Approvals happen over chat and email",
      "No single view of customers or inventory"
    ],
    "architecture": [
      "Source systems",
      "Integration layer",
      "Business application",
      "Reports and dashboards"
    ],
    "stack": [
      "Odoo / Zoho",
      "PostgreSQL",
      "REST / webhooks",
      "n8n",
      "Metabase",
      "NestJS"
    ],
    "useCases": [
      "Lead-to-invoice flow across CRM and billing",
      "Leave, attendance and payroll inputs in one HRMS",
      "Purchase approval with audit trail"
    ],
    "governance": [
      "Role-based access and audit events",
      "Data migration with reconciliation reports",
      "Vendor lock-in reviewed up front"
    ]
  },
  {
    "id": "work",
    "slug": "digital-workplace",
    "name": "Digital Workplace",
    "icon": "users",
    "summary": "Email, collaboration and device management on Google Workspace, Microsoft 365 or Zoho.",
    "readiness": "delivered",
    "challenges": [
      "Mail on unreliable shared hosting",
      "Licences bought and tracked by hand",
      "Teams not using the tools they pay for"
    ],
    "architecture": [
      "Domain and DNS",
      "Tenant and identity",
      "Mail, files, meetings",
      "Devices and policies"
    ],
    "stack": [
      "Google Workspace",
      "Microsoft 365",
      "Zoho",
      "SPF / DKIM / DMARC",
      "MDM",
      "SSO"
    ],
    "useCases": [
      "Zero-downtime mailbox migration with DNS cutover plan",
      "Standard onboarding and offboarding checklists",
      "Licence reporting and renewals"
    ],
    "governance": [
      "MFA enforced on all admins",
      "Mail authentication configured and monitored",
      "Offboarding removes access the same day"
    ]
  },
  {
    "id": "auto",
    "slug": "automation-and-integration",
    "name": "Automation & Integration",
    "icon": "workflow",
    "summary": "Workflows that connect your tools, move data and message customers without manual steps.",
    "readiness": "delivered",
    "challenges": [
      "Teams copy data between tools every day",
      "Leads go cold waiting for a reply",
      "Reports are assembled by hand"
    ],
    "architecture": [
      "Trigger",
      "Workflow engine",
      "Connected apps",
      "Logs and alerts"
    ],
    "stack": [
      "n8n",
      "Webhooks",
      "WhatsApp Business API",
      "BullMQ",
      "Google Sheets / CRM APIs",
      "Slack / email"
    ],
    "useCases": [
      "Enquiry to CRM to WhatsApp reply in under a minute",
      "Weekly performance report assembled and emailed",
      "Invoice reminders with escalation rules"
    ],
    "governance": [
      "Every run logged and replayable",
      "Failures alert a named owner",
      "Consent captured before messaging customers"
    ],
    "gradient": [
      "#0E9F8E",
      "#2BD4B4"
    ],
    "iconPath": "<path d=\"M13 2L4 14h7l-1 8 9-12h-7l1-8z\"/>"
  },
  {
    "id": "growth",
    "slug": "digital-growth",
    "name": "Digital Growth",
    "icon": "trending-up",
    "summary": "Search, paid media, analytics and content that turn traffic into qualified enquiries.",
    "readiness": "delivered",
    "challenges": [
      "Traffic that does not convert",
      "Ad spend with no clear return",
      "No visibility in AI answers and search summaries"
    ],
    "architecture": [
      "Audience and intent",
      "Content and campaigns",
      "Site and tracking",
      "Reporting and optimisation"
    ],
    "stack": [
      "GA4 / Search Console",
      "Google Ads / Meta Ads",
      "Tag Manager",
      "Looker Studio",
      "Schema markup",
      "CRM integration"
    ],
    "useCases": [
      "Local SEO and Google Business Profile programme",
      "Lead-generation campaigns with weekly reporting",
      "Content plan built around questions buyers ask AI tools"
    ],
    "governance": [
      "Tracking consent honoured",
      "Reporting from source data, not screenshots",
      "Claims in content reviewed before publishing"
    ],
    "gradient": [
      "#F0641E",
      "#FFB347"
    ],
    "iconPath": "<path d=\"M3 17l6-6 4 4 8-8\"/><path d=\"M15 7h6v6\"/>"
  },
  {
    "id": "edu",
    "slug": "education-technology",
    "name": "Education Technology",
    "icon": "graduation-cap",
    "summary": "Digital transformation for schools, colleges and training providers, including the Lurnzo learning platform.",
    "readiness": "delivered",
    "challenges": [
      "Admissions and records handled on paper",
      "Online learning that students drop out of",
      "Staff without time to learn new tools"
    ],
    "architecture": [
      "Student and staff identity",
      "Learning platform",
      "Assessment and records",
      "Reports for management"
    ],
    "stack": [
      "Lurnzo",
      "Moodle / custom LMS",
      "Google Workspace for Education",
      "PostgreSQL",
      "Certificates API",
      "Analytics"
    ],
    "useCases": [
      "Course catalogue with enrolment and payments",
      "Online exams with certificates",
      "Parent and student portal"
    ],
    "governance": [
      "Student data minimised and access-scoped",
      "Parental consent where required",
      "Backups tested before each term"
    ]
  },
  {
    "id": "ind",
    "slug": "industries",
    "name": "Industries",
    "icon": "factory",
    "summary": "Workflows and applications shaped by how each sector actually works.",
    "readiness": "delivered",
    "challenges": [
      "Generic software that ignores sector rules",
      "Slow enquiry follow-up",
      "Compliance and record-keeping overhead"
    ],
    "architecture": [
      "Customer touchpoint",
      "Industry workflow",
      "Back-office systems",
      "Compliance and reporting"
    ],
    "stack": [
      "Next.js",
      "CRM / ERP",
      "Payment gateways",
      "WhatsApp API",
      "Analytics",
      "Document storage"
    ],
    "useCases": [
      "Product catalogue with enquiry cart for manufacturers",
      "Booking and itinerary flows for travel",
      "Site-visit and lead pipeline for real estate"
    ],
    "governance": [
      "Sector regulations reviewed per engagement",
      "Client data kept in client-owned accounts",
      "Content approved by the client before launch"
    ]
  },
  {
    "id": "prod",
    "slug": "products-and-solutions-hub",
    "name": "Products & Solutions Hub",
    "icon": "boxes",
    "summary": "Bedre-owned platforms and solution bundles. Each shows a readiness label so expectations stay accurate.",
    "readiness": "in-build",
    "challenges": [
      "Too many separate vendors and logins",
      "Unclear what is live and what is planned",
      "Integrations that break between tools"
    ],
    "architecture": [
      "Shared identity",
      "Product modules",
      "Integration hub",
      "Customer workspace"
    ],
    "stack": [
      "NestJS",
      "Next.js",
      "PostgreSQL",
      "Redis",
      "OIDC",
      "Webhooks"
    ],
    "useCases": [
      "One login across workspace and learning platform",
      "Bundle: website, hosting, mail and monitoring",
      "Integration catalogue for CRM and billing"
    ],
    "governance": [
      "Readiness label on every product",
      "Roadmaps shared, not promised as delivered",
      "Tenant isolation tested"
    ]
  },
  {
    "id": "cons",
    "slug": "consulting",
    "name": "Consulting",
    "icon": "compass",
    "summary": "Advisory, roadmaps and assessments to decide what to build, buy or retire.",
    "readiness": "delivered",
    "challenges": [
      "Unclear priorities across IT spend",
      "Vendor sprawl with overlapping tools",
      "No roadmap the leadership team agrees on"
    ],
    "architecture": [
      "Discovery",
      "Assessment",
      "Roadmap",
      "Governance and review"
    ],
    "stack": [
      "Assessment framework",
      "Architecture diagrams",
      "Cost models",
      "Risk register",
      "Roadmap canvas",
      "KPI scorecards"
    ],
    "useCases": [
      "90-day technology roadmap",
      "Vendor consolidation with savings estimate",
      "Managed IT with monthly service review"
    ],
    "governance": [
      "Recommendations documented with assumptions",
      "Conflicts of interest disclosed",
      "Outcomes tracked against agreed KPIs"
    ]
  }
];

export const domainById = (id: string) => domains.find(d => d.id === id);

