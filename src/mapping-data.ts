// Illustrative mock data and deterministic matching rules for the Account mappings demo.
// Nothing here describes real Wells Fargo products, fees, rates, or eligibility policy.

export type Assessment = 'Matched' | 'Action needed' | 'Unknown' | 'Not supported';
export type MappingStatus = 'Ready' | 'Review' | 'Blocked' | 'Unmapped' | 'Approved';
export type RegKey = 'individual' | 'joint' | 'trad-ira' | 'roth-ira' | 'trust';
export type CapKey =
  | 'holdings' | 'fees' | 'sweep' | 'margin' | 'options' | 'online'
  | 'beneficiary' | 'advisory' | 'checks' | 'estatements' | 'trustee' | 'proprietary' | 'distributions';
type CapValue = 'yes' | 'enroll' | 'no';

export const STATUSES: MappingStatus[] = ['Ready', 'Review', 'Blocked', 'Unmapped', 'Approved'];
export const REG_LABEL: Record<RegKey, string> = {
  individual: 'Individual brokerage',
  joint: 'Joint WROS',
  'trad-ira': 'Traditional IRA',
  'roth-ira': 'Roth IRA',
  trust: 'Revocable trust',
};

/** A requirement captured from the source account that the proposed configuration must satisfy. */
export type Need = {
  cap: CapKey;
  feature: string;
  source: string;
  required: boolean;
  action: string;
  /** Source evidence for this item is missing, so it cannot be assessed as matched. */
  evidenceMissing?: string;
};
export type Evidence = { item: string; state: 'Received' | 'Missing' | 'Unverified' };
export type Account = {
  id: string;
  household: string;
  custodian: string;
  last4: string;
  reg: RegKey;
  value: number;
  needs: Need[];
  evidence: Evidence[];
  mapped: boolean;
  /** Capabilities a reviewer has marked resolved (mock). Never set by auto-match. */
  resolved: CapKey[];
  approvedNote?: string;
};

type Config = { name: string; caps: Partial<Record<CapKey, { v: CapValue; text: string }>> };
const y = (text: string) => ({ v: 'yes' as const, text });
const e = (text: string) => ({ v: 'enroll' as const, text });
const n = (text: string) => ({ v: 'no' as const, text });

/** Illustrative destination catalog. A capability absent from a config is "Unknown" by design. */
export const CATALOG: Record<RegKey, Config> = {
  individual: {
    name: 'Individual brokerage · Config A',
    caps: {
      holdings: y('Listed equities and ETFs accepted'),
      online: y('Online access available'),
      estatements: y('Electronic delivery available'),
      advisory: y('Advisory service model selectable'),
      beneficiary: y('Transfer-on-death designation available'),
      checks: e('Cash-services enrollment required'),
      margin: e('Separate margin approval required'),
      options: e('New options approval required'),
    },
  },
  joint: {
    name: 'Joint WROS brokerage · Config B',
    caps: {
      holdings: y('Listed equities and ETFs accepted'),
      online: y('Online access available for both owners'),
      estatements: y('Electronic delivery available'),
      advisory: y('Advisory service model selectable'),
      checks: e('Cash-services enrollment required'),
      margin: e('Separate margin approval required'),
    },
  },
  'trad-ira': {
    name: 'Traditional IRA · Config C',
    caps: {
      holdings: y('Listed equities and ETFs accepted'),
      online: y('Online access available'),
      estatements: y('Electronic delivery available'),
      advisory: y('Advisory service model selectable'),
      beneficiary: y('Beneficiary form required at opening'),
      distributions: y('Distribution setup available after opening'),
      margin: n('Margin not offered on retirement registrations'),
    },
  },
  'roth-ira': {
    name: 'Roth IRA · Config D',
    caps: {
      holdings: y('Listed equities and ETFs accepted'),
      online: y('Online access available'),
      estatements: y('Electronic delivery available'),
      advisory: y('Advisory service model selectable'),
      beneficiary: y('Beneficiary form required at opening'),
      margin: n('Margin not offered on retirement registrations'),
    },
  },
  trust: {
    name: 'Revocable trust brokerage · Config E',
    caps: {
      holdings: y('Listed equities and ETFs accepted'),
      online: y('Online access available'),
      estatements: y('Electronic delivery available'),
      trustee: e('Trust documents and trustee authority review required'),
      proprietary: n('Source-only proprietary funds not accepted'),
      margin: n('Margin not offered on trust registrations'),
    },
  },
};

export type Row = {
  cap: CapKey | 'registration';
  feature: string;
  source: string;
  target: string;
  assess: Assessment;
  note?: string;
  action?: string;
  blocking?: boolean;
};
export type Evaluation = {
  rows: Row[];
  matched: number;
  total: number;
  status: 'Ready' | 'Review' | 'Blocked';
  open: Row[];
  reason: string;
};

const NOT_DOCUMENTED = 'Not documented in the demo catalog';

export function evaluate(a: Account): Evaluation {
  const cfg = CATALOG[a.reg];
  const rows: Row[] = [
    { cap: 'registration', feature: 'Registration', source: REG_LABEL[a.reg], target: REG_LABEL[a.reg] + ' · same owners', assess: 'Matched' },
  ];
  for (const need of a.needs) {
    const cap = cfg.caps[need.cap];
    const confirmed = a.resolved.includes(need.cap) && cap?.v !== 'no';
    let assess: Assessment = !cap ? 'Unknown' : cap.v === 'yes' ? 'Matched' : cap.v === 'enroll' ? 'Action needed' : 'Not supported';
    let note: string | undefined;
    if (need.evidenceMissing && assess === 'Matched' && !confirmed) {
      assess = 'Unknown';
      note = need.evidenceMissing;
    }
    if (confirmed && assess !== 'Matched') {
      assess = 'Matched';
      note = 'Reviewer-confirmed (mock)';
    }
    rows.push({
      cap: need.cap, feature: need.feature, source: need.source, target: cap?.text ?? NOT_DOCUMENTED,
      assess, note, action: need.action, blocking: need.required && assess === 'Not supported',
    });
  }
  const open = rows.filter(r => r.assess !== 'Matched');
  const matched = rows.length - open.length;
  const status = rows.some(r => r.blocking) ? 'Blocked' : open.length ? 'Review' : 'Ready';
  const count = (k: Assessment) => open.filter(r => r.assess === k).length;
  const gaps = [
    [count('Not supported'), 'not supported'],
    [count('Action needed'), 'need action'],
    [count('Unknown'), 'unknown (left unmatched)'],
  ].filter(([c]) => c).map(([c, t]) => `${c} ${t}`);
  const reason =
    `${REG_LABEL[a.reg]} registration maps to ${cfg.name} (illustrative). ` +
    (open.length ? `${matched} of ${rows.length} requirements match; gaps: ${gaps.join(', ')}.` : 'Every captured requirement matches the demo catalog.') +
    ' Human review is required before approval.';
  return { rows, matched, total: rows.length, status, open, reason };
}

export function statusOf(a: Account): MappingStatus {
  if (a.approvedNote) return 'Approved';
  return a.mapped ? evaluate(a).status : 'Unmapped';
}

/** Deterministic auto-match: maps unmapped accounts only; approved accounts and reviewer resolutions are untouched. */
export function autoMatch(all: Account[]): { next: Account[]; changes: string[] } {
  const changes: string[] = [];
  const next = all.map(a => {
    if (a.approvedNote || a.mapped) return a;
    const m = { ...a, mapped: true };
    const ev = evaluate(m);
    changes.push(
      `${a.household} ····${a.last4} → ${CATALOG[a.reg].name}: ${ev.matched}/${ev.total} matched, ${ev.status}. ` +
        (ev.open.length ? 'Open: ' + ev.open.map(r => r.feature.toLowerCase()).join(', ') + '.' : 'No gaps found.'),
    );
    return m;
  });
  return { next, changes };
}

const need = (cap: CapKey, feature: string, source: string, action: string, required = false, evidenceMissing?: string): Need =>
  ({ cap, feature, source, action, required, evidenceMissing });

const HOLD = 'Confirm positions against the destination eligibility list';
const ONLINE = 'Invite owner to online access';
const CASH = 'Enroll in cash services at opening';
const OPTS = 'Submit new options application';
const BENE = 'Collect new beneficiary form';

export const mappingSeed: Account[] = [
  {
    id: 'a1', household: 'Anderson household', custodian: 'Merrill', last4: '4821', reg: 'joint', value: 820000, mapped: true, resolved: [],
    needs: [
      need('holdings', 'Holdings eligibility', 'Listed stocks and ETFs', HOLD),
      need('estatements', 'Electronic statements', 'Enabled', 'Re-enroll in electronic delivery'),
      need('online', 'Online access', 'Both owners active', 'Invite both owners to online access'),
      need('checks', 'Cash services (checks / debit)', 'Active checking privileges', CASH),
      need('fees', 'Fee schedule', 'Household fee waiver on file', 'Obtain a written fee schedule; do not assume the waiver carries over'),
    ],
    evidence: [
      { item: 'Latest account statement', state: 'Received' },
      { item: 'Joint owner authorization', state: 'Received' },
      { item: 'Fee waiver letter', state: 'Unverified' },
    ],
  },
  {
    id: 'a2', household: 'Anderson household', custodian: 'Schwab', last4: '1934', reg: 'trad-ira', value: 460000, mapped: true, resolved: [],
    needs: [
      need('holdings', 'Holdings eligibility', 'Stocks and ETFs', HOLD),
      need('beneficiary', 'Beneficiary requirements', 'Primary and contingent on file', BENE),
      need('distributions', 'Distribution support', 'Systematic withdrawals', 'Set up distributions after opening'),
      need('online', 'Online access', 'Enabled', ONLINE),
    ],
    evidence: [
      { item: 'Latest account statement', state: 'Received' },
      { item: 'IRA custodial agreement', state: 'Received' },
      { item: 'Beneficiary designation', state: 'Received' },
    ],
  },
  {
    id: 'a3', household: 'Patel household', custodian: 'Fidelity', last4: '7710', reg: 'individual', value: 310000, mapped: true, resolved: [],
    needs: [
      need('holdings', 'Holdings eligibility', 'Listed stocks', HOLD),
      need('online', 'Online access', 'Enabled', ONLINE),
      need('sweep', 'Cash sweep', 'Sweep vehicle active; yield not provided', 'Request sweep disclosure for the destination'),
      need('options', 'Options permissions', 'Level 2 approved at source', OPTS),
      need('beneficiary', 'Beneficiary requirements', 'TOD on file', 'Re-register TOD designation'),
    ],
    evidence: [
      { item: 'Latest account statement', state: 'Received' },
      { item: 'Options approval record', state: 'Missing' },
      { item: 'Sweep disclosure', state: 'Missing' },
    ],
  },
  {
    id: 'a4', household: 'Chen family trust', custodian: 'Pershing', last4: '6502', reg: 'trust', value: 1250000, mapped: true, resolved: [],
    needs: [
      need('holdings', 'Holdings eligibility', 'Equities and ETFs', HOLD),
      need('trustee', 'Trustee authority', 'Amendment not provided', 'Obtain executed trust amendment and trustee certification', true, 'Trust amendment not in evidence'),
      need('proprietary', 'Proprietary holding', 'Source-only fund (~12% of value)', 'Liquidate, transfer out, or request an exception review', true),
      need('margin', 'Margin', 'Active margin loan', 'Pay down or relocate the margin balance'),
    ],
    evidence: [
      { item: 'Latest account statement', state: 'Received' },
      { item: 'Certification of trust', state: 'Unverified' },
      { item: 'Trust amendment', state: 'Missing' },
    ],
  },
  {
    id: 'a5', household: 'Williams household', custodian: 'Schwab', last4: '2048', reg: 'roth-ira', value: 185000, mapped: true, resolved: [],
    needs: [
      need('holdings', 'Holdings eligibility', 'ETFs', HOLD),
      need('beneficiary', 'Beneficiary requirements', 'Primary on file', BENE),
      need('online', 'Online access', 'Enabled', ONLINE),
    ],
    evidence: [
      { item: 'Latest account statement', state: 'Received' },
      { item: 'Roth IRA agreement', state: 'Received' },
    ],
  },
  {
    id: 'a6', household: 'Garcia household', custodian: 'E*TRADE', last4: '3982', reg: 'individual', value: 225000, mapped: false, resolved: [],
    needs: [
      need('holdings', 'Holdings eligibility', 'Listed stocks', HOLD),
      need('online', 'Online access', 'Enabled', ONLINE),
      need('checks', 'Cash services (checks / debit)', 'Checks requested', CASH),
      need('options', 'Options permissions', 'Covered calls', OPTS),
    ],
    evidence: [{ item: 'Latest account statement', state: 'Received' }],
  },
];
