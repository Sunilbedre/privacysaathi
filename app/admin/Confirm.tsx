'use client';
import type { ReactNode } from 'react';

/** A submit button that asks "are you sure?" first. Used for deleting leads. */
export function ConfirmButton({ message, className, children, name, value }: { message: string; className?: string; children: ReactNode; name?: string; value?: string }) {
  return <button type="submit" name={name} value={value} className={className} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>{children}</button>;
}

/** Tick box in the table header that ticks or unticks every lead on the page. */
export function SelectAll() {
  return <input type="checkbox" aria-label="Select all leads on this page" onChange={(e) => { e.currentTarget.closest('form')?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((c) => { c.checked = e.currentTarget.checked; }); }} />;
}
