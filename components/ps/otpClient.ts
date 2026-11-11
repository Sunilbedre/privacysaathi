/** Mobile verification calls for the chat (the forms use the useOtp hook instead). */
export const otpRequired = () => fetch('/api/ps/otp', { cache: 'no-store' }).then((r) => r.json()).then((j) => !!j.required).catch(() => false);

export async function otpSend(phone: string): Promise<{ ok: true; challenge: string } | { ok: false; error: string }> {
  const r = await fetch('/api/ps/otp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'send', phone }) }).catch(() => null);
  const j = r ? await r.json().catch(() => ({})) : {};
  return r?.ok ? { ok: true, challenge: j.challenge } : { ok: false, error: j.error ?? 'Could not send the code. Please try again.' };
}

export async function otpVerify(phone: string, challenge: string, code: string): Promise<{ ok: true; token: string } | { ok: false; error: string; expired: boolean }> {
  const r = await fetch('/api/ps/otp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'verify', phone, challenge, code }) }).catch(() => null);
  const j = r ? await r.json().catch(() => ({})) : {};
  return r?.ok ? { ok: true, token: j.token } : { ok: false, error: j.error ?? 'Could not check the code. Please try again.', expired: !!j.expired };
}
