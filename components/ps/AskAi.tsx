'use client';
import { usePathname } from 'next/navigation';
import { Asterisk, MessageSquare, Search, Sparkles, Zap } from 'lucide-react';
import { usePsBase } from './PsCtx';
import { track } from './PsTrack';

/** "Ask AI about Privacy Saathi": opens the visitor's favourite AI assistant with a ready-made question. Sits above the footer on public pages. */
const PROMPT = 'Give me an instant, balanced overview of Privacy Saathi (privacysaathi.in), the DPDP Act and cyber security readiness scanner by Bedre Web Technologies in Bengaluru. Explain what it does, how the free read-only website scan works, who it is for, what the report includes and what its limits are. Use only public information and mention your sources.';
const q = encodeURIComponent(PROMPT);
const TOOLS: { id: string; name: string; href: string; Icon: typeof Search }[] = [
  { id: 'chatgpt', name: 'ChatGPT', href: `https://chatgpt.com/?q=${q}`, Icon: MessageSquare },
  { id: 'perplexity', name: 'Perplexity', href: `https://www.perplexity.ai/search?q=${q}`, Icon: Search },
  { id: 'claude', name: 'Claude', href: `https://claude.ai/new?q=${q}`, Icon: Asterisk },
  { id: 'google', name: 'Google AI', href: `https://www.google.com/search?udm=50&q=${q}`, Icon: Sparkles },
  { id: 'grok', name: 'Grok', href: `https://grok.com/?q=${q}`, Icon: Zap },
];
const HIDE = /^\/(report|thanks|portal|sign-in)(\/|$)/;

export default function AskAi() {
  const base = usePsBase(), path = usePathname() ?? '';
  const rel = path.startsWith(base) ? path.slice(base.length) || '/' : path;
  if (HIDE.test(rel)) return null;
  return (
    <section className="ps-askai" aria-labelledby="askai-h">
      <div className="ps-wrap">
        <div className="ps-askai-card">
          <div className="ps-askai-l">
            <span className="ps-askai-pill"><Sparkles size={14} aria-hidden /> Ask AI about Privacy Saathi</span>
            <h2 id="askai-h">Get an instant AI-generated overview</h2>
            <p>Open your favourite AI assistant with a ready-made question about Privacy Saathi.</p>
          </div>
          <div className="ps-askai-r" role="group" aria-label="Open an AI assistant">
            {TOOLS.map(({ id, name, href, Icon }) => (
              <a key={id} className="ps-askai-b" href={href} target="_blank" rel="noopener noreferrer" onClick={() => track('ask_ai', { tool: id })}><Icon size={17} aria-hidden /> {name}</a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
