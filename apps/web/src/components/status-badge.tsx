type Tone = 'ok' | 'warn' | 'risk' | 'info' | 'neutral';

const TONES: Record<Tone, string> = {
  ok: 'bg-ok-soft text-ok border-ok/25',
  warn: 'bg-warn-soft text-warn border-warn/25',
  risk: 'bg-risk-soft text-risk border-risk/25',
  info: 'bg-info-soft text-info border-info/25',
  neutral: 'bg-canvas text-muted border-line',
};

const MARKS: Record<Tone, string> = {
  ok: '●', warn: '▲', risk: '■', info: '◆', neutral: '○',
};

/**
 * Colour alone never carries meaning: each tone also has a distinct shape mark
 * and the label text itself.
 */
export function StatusBadge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}
    >
      <span aria-hidden="true" className="text-[0.6em] leading-none">{MARKS[tone]}</span>
      {children}
    </span>
  );
}

export function toneForUserStatus(status: string): Tone {
  switch (status) {
    case 'ACTIVE': return 'ok';
    case 'INVITED': return 'info';
    case 'SUSPENDED': return 'warn';
    case 'DEACTIVATED': return 'risk';
    default: return 'neutral';
  }
}
