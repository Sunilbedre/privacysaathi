'use client';
import { useEffect, useState } from 'react';

export default function DaysLeft({ date }: { date: string }) {
  const [d, setD] = useState<number | null>(null);
  useEffect(() => { setD(Math.max(0, Math.ceil((new Date(date + 'T00:00:00+05:30').getTime() - Date.now()) / 86_400_000))); }, [date]);
  return <>{d === null ? '186' : d}</>;
}
