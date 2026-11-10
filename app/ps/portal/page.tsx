import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
export const metadata: Metadata = { title: 'Portal', robots: { index: false } };
export default function Portal() { redirect('/ps/sign-in'); }
