"use client";

import { BookOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { acceptsDiaryReply, buildDiaryReading, diaryOrigin, type DiaryReadingInput } from '@/lib/client/diary-transfer';

export function SaveToDiaryButton({ reading, sourceDetails, disabled = false, english = false }: {
  reading: Omit<DiaryReadingInput, 'occurredAt' | 'timezone'>;
  sourceDetails: () => { occurredAt: string; spreadLabel: string };
  disabled?: boolean;
  english?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const dispose = useRef<(() => void) | null>(null);
  useEffect(() => () => dispose.current?.(), []);

  async function transfer() {
    if (busy || disabled) return;
    setNotice('');
    let origin: string;
    try { origin = diaryOrigin(process.env.NEXT_PUBLIC_DIARY_ORIGIN, process.env.NODE_ENV === 'development'); }
    catch { setNotice(english ? 'The Diary connection is unavailable.' : 'A conexão com o Diário está indisponível.'); return; }
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
    // Open during the click gesture, before hashing, so mobile browsers can allow it.
    const target = window.open(`${origin}/importar/#pdu=${nonce}`, '_blank');
    if (!target) { setNotice(english ? 'Allow a new tab to open the Diary, then try again.' : 'Permita abrir uma nova aba para acessar o Diário e tente novamente.'); return; }
    dispose.current?.();
    setBusy(true);
    let snapshot: Awaited<ReturnType<typeof buildDiaryReading>> | null = null;
    let ready = false;
    const send = () => { if (snapshot && ready) target.postMessage({type:'du:pdu-reading',nonce,reading:snapshot}, origin); };
    let finished = false;
    const finish = (message: string) => {
      if (finished) return;
      finished = true;
      cleanup();
      setBusy(false);
      setNotice(message);
    };
    const listener = (event: MessageEvent) => {
      if (acceptsDiaryReply(event,target,origin,nonce,'du:pdu-ready')) { ready = true; send(); }
      if (acceptsDiaryReply(event,target,origin,nonce,'du:pdu-received')) finish(english ? 'Reading sent. Review and confirm it in the Diary tab.' : 'Leitura enviada. Confira e confirme na aba do Diário.');
    };
    const timer = window.setTimeout(() => finish(english ? 'The Diary did not receive the reading. Return here and try again.' : 'O Diário não recebeu a leitura. Volte a esta aba e tente novamente.'), 30_000);
    const cleanup = () => { finished = true; window.clearTimeout(timer); window.removeEventListener('message',listener); snapshot = null; };
    dispose.current = cleanup;
    window.addEventListener('message',listener);
    try {
      snapshot = await buildDiaryReading({...reading, ...sourceDetails(), timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'});
      if (!finished) send();
    } catch {
      finish(english ? 'This reading could not be prepared. Its original remains here.' : 'Não foi possível preparar essa leitura. O original continua aqui.');
    }
  }

  return <div className="basis-full pt-2">
    <button type="button" onClick={() => void transfer()} disabled={disabled || busy}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#f4d58d]/60 bg-[#f4d58d]/10 px-4 py-2 text-sm font-semibold text-[#fff3df] transition-colors hover:bg-[#f4d58d]/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4d58d] disabled:opacity-45">
      <BookOpen size={16} aria-hidden="true" />{busy ? (english ? 'Connecting to the Diary…' : 'Conectando ao Diário…') : english ? 'Keep in my Diary' : 'Guardar no Diário'}
    </button>
    <p className="mt-2 max-w-lg text-xs leading-6 text-[#cfc4b9]">{english ? 'Review this reading in your independent Diary account and revisit it over time.' : 'Confira esta leitura na sua conta independente do Diário e acompanhe o que ela desperta com o tempo.'}</p>
    <p className="mt-1 max-w-lg text-sm leading-6 text-[#f4d58d]" role="status">{notice}</p>
  </div>;
}
