import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BadgeCheck, Ban, Check, CircleCheck, CircleDashed, CircleHelp, CircleX, FileText, GitCompareArrows, Info,
  ListChecks, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Sparkles, TriangleAlert, X,
} from 'lucide-react';
import type { Candidate } from './data';
import {
  CATALOG, REG_LABEL, STATUSES, accountsFor, autoMatch, evaluate, loadAccounts, saveAccounts, statusOf,
  type Account, type Assessment, type CapKey, type MappingStatus, type RegKey,
} from './mapping-data';
import './account-mappings.css';

const money = (n: number) => '$' + n.toLocaleString('en-US');
const STATUS_ICON: Record<MappingStatus, typeof Check> = {
  Ready: CircleCheck, Review: TriangleAlert, Blocked: Ban, Unmapped: CircleDashed, Approved: BadgeCheck,
};
const ASSESS_ICON: Record<Assessment, typeof Check> = {
  Matched: CircleCheck, 'Action needed': TriangleAlert, Unknown: CircleHelp, 'Not supported': CircleX,
};
const ASSESS_CLASS: Record<Assessment, string> = {
  Matched: 'ok', 'Action needed': 'warn', Unknown: 'unk', 'Not supported': 'bad',
};

function StatusPill({ status }: { status: MappingStatus }) {
  const Icon = STATUS_ICON[status];
  return <span className={'am-status am-s-' + status.toLowerCase()}><Icon size={13} aria-hidden />{status}</span>;
}
function AssessPill({ a }: { a: Assessment }) {
  const Icon = ASSESS_ICON[a];
  return <span className={'am-assess am-a-' + ASSESS_CLASS[a]}><Icon size={14} aria-hidden />{a}</span>;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Centered modal: dimmed backdrop, focus trap, Escape / backdrop / X close, focus restored to the opener. */
function Modal({ titleId, onClose, children }: { titleId: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    box.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, []);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab' || !box.current) return;
    const items = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !box.current.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  return (
    <div className="am-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={onKey}>
      <div ref={box} className="am-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>{children}</div>
    </div>
  );
}

function Comparison({ account, update, close }: { account: Account; update: (fn: (a: Account) => Account, msg: string) => void; close: () => void }) {
  const titleId = useId();
  const [tab, setTab] = useState<'benefits' | 'evidence'>('benefits');
  const [note, setNote] = useState('');
  const ev = useMemo(() => evaluate(account), [account]);
  const status = statusOf(account);
  const mapped = account.mapped;
  const dest = mapped ? CATALOG[account.reg].name : 'Not yet matched';
  const openActions = ev.open.filter(r => r.cap !== 'registration');
  const actionRows = ev.rows.filter(r => r.cap !== 'registration' && (r.assess !== 'Matched' || account.resolved.includes(r.cap as CapKey)));
  const checks = [
    { ok: mapped, label: 'Account has been mapped by auto-match' },
    { ok: mapped && !ev.rows.some(r => r.blocking), label: 'No required feature is unsupported' },
    { ok: mapped && ev.open.length === 0, label: 'All gaps resolved: no action-needed or unknown items remain' },
    { ok: note.trim().length > 0, label: 'Reviewer note entered' },
  ];
  const canApprove = !account.approvedNote && checks.every(c => c.ok);
  const toggle = (cap: CapKey) => update(a => ({ ...a, resolved: a.resolved.includes(cap) ? a.resolved.filter(c => c !== cap) : [...a.resolved, cap] }), '');
  const missing = [
    ...account.evidence.filter(e => e.state !== 'Received').map(e => `${e.item} (${e.state.toLowerCase()})`),
    ...account.needs.filter(n => n.evidenceMissing && !account.resolved.includes(n.cap)).map(n => n.evidenceMissing!),
  ];
  return (
    <Modal titleId={titleId} onClose={close}>
      <div className="am-mh">
        <div>
          <h2 id={titleId}>Account comparison</h2>
          <p className="am-mh-sub"><b>{account.household}</b> · ····{account.last4} · {account.custodian}</p>
        </div>
        <button className="am-x" aria-label="Close account comparison" onClick={close}><X size={18} /></button>
      </div>
      <div className="am-body">
        <dl className="am-facts">
          <div><dt>Source</dt><dd>{account.custodian} · {REG_LABEL[account.reg]} · {money(account.value)}</dd></div>
          <div><dt>Proposed destination <i>illustrative</i></dt><dd>{dest}</dd></div>
          <div><dt>Status</dt><dd><StatusPill status={status} /> {mapped && <span className="am-muted">{ev.matched}/{ev.total} matched</span>}</dd></div>
        </dl>
        <div className="am-why"><Sparkles size={15} aria-hidden /><div><b>Why this match</b> {mapped ? ev.reason : 'Not evaluated yet. Run auto-match from the grid to propose a destination configuration based on registration and required capabilities.'}</div></div>
        <div className="am-tabs" role="tablist" aria-label="Comparison sections">
          <button role="tab" aria-selected={tab === 'benefits'} data-autofocus onClick={() => setTab('benefits')}><GitCompareArrows size={14} />Benefits comparison</button>
          <button role="tab" aria-selected={tab === 'evidence'} onClick={() => setTab('evidence')}><ListChecks size={14} />Evidence &amp; review{openActions.length > 0 && <span className="am-count">{openActions.length}</span>}</button>
        </div>
        {tab === 'benefits' ? (
          <div role="tabpanel" aria-label="Benefits comparison">
            {mapped ? (
              <div className="am-scroll"><table className="am-cmp">
                <thead><tr><th>Feature / requirement</th><th>Source account</th><th>Proposed Wells Fargo configuration</th><th>Assessment</th></tr></thead>
                <tbody>{ev.rows.map(r => (
                  <tr key={r.cap}><th scope="row">{r.feature}</th><td>{r.source}</td><td>{r.target}</td>
                    <td><AssessPill a={r.assess} />{r.note && <small>{r.note}</small>}</td></tr>
                ))}</tbody>
              </table></div>
            ) : <p className="am-empty"><CircleDashed size={16} />No comparison yet. This account has not been auto-matched.</p>}
            <p className="am-foot"><Info size={13} />Destination configurations and assessments are illustrative, not verified Wells Fargo products or policies. Items the demo catalog does not document stay Unknown and are never counted as matched.</p>
          </div>
        ) : (
          <div role="tabpanel" aria-label="Evidence and review" className="am-ev">
            <section>
              <h3>Source evidence</h3>
              <ul className="am-list">{account.evidence.map(e => (
                <li key={e.item}><FileText size={14} aria-hidden />{e.item}<span className={'am-ev-' + e.state.toLowerCase()}>{e.state}</span></li>
              ))}</ul>
              <h3>Missing information</h3>
              {missing.length ? <ul className="am-list">{missing.map(m => <li key={m}><TriangleAlert size={14} aria-hidden />{m}</li>)}</ul> : <p className="am-muted">None outstanding.</p>}
            </section>
            <section>
              <h3>Outstanding actions</h3>
              {!mapped ? <p className="am-muted">Run auto-match to generate actions.</p> : actionRows.length === 0 ? <p className="am-muted">No open actions.</p> : (
                <ul className="am-actions">{actionRows.map(r => {
                  const done = account.resolved.includes(r.cap as CapKey);
                  const unsupported = r.assess === 'Not supported';
                  return (
                    <li key={r.cap}>
                      <label>
                        <input type="checkbox" disabled={unsupported || !!account.approvedNote} checked={done} onChange={() => toggle(r.cap as CapKey)} />
                        <span><b>{r.feature}</b> <AssessPill a={r.assess} /><br />{unsupported ? 'Cannot be resolved by review. ' : done ? 'Confirmed by reviewer (mock). ' : ''}{r.action}</span>
                      </label>
                    </li>
                  );
                })}</ul>
              )}
              </section>
            <section className="am-review">
              <h3>Reviewer notes &amp; approval</h3>
              {account.approvedNote ? (
                <div className="am-approved"><BadgeCheck size={16} /><div><b>Mock approval recorded</b><br />{account.approvedNote}<br />
                  <button className="am-link" onClick={() => update(a => ({ ...a, approvedNote: undefined }), `Approval withdrawn for ${account.household} ····${account.last4}.`)}>Withdraw approval</button></div></div>
              ) : (<>
                <label className="am-lbl" htmlFor={titleId + 'n'}>Review note (required)</label>
                <textarea id={titleId + 'n'} value={note} onChange={e => setNote(e.target.value)} placeholder="Record what you reviewed and why the mapping is acceptable…" />
                <ul className="am-checks" aria-label="Approval checks">{checks.map(c => (
                  <li key={c.label} className={c.ok ? 'ok' : ''}>{c.ok ? <Check size={14} aria-hidden /> : <CircleDashed size={14} aria-hidden />}{c.label}</li>
                ))}</ul>
                <button className="am-btn am-primary" disabled={!canApprove} onClick={() => { update(a => ({ ...a, approvedNote: note.trim() }), `Mapping approved (mock) for ${account.household} ····${account.last4}. Account opening and transfer authorization are separate steps.`); close(); }}>
                  <BadgeCheck size={15} />Approve mapping (mock)
                </button>
              </>)}
            </section>
          </div>
        )}
      </div>
      <div className="am-mf"><span>Mock comparison · no transfers or account openings are initiated</span><button className="am-btn" onClick={close}>Close</button></div>
    </Modal>
  );
}

export default function MappingWorkspace({ c, trail }: { c: Candidate; trail: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts(c.id));
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<MappingStatus | 'All'>('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [custodian, setCustodian] = useState('All');
  const [reg, setReg] = useState<RegKey | 'All'>('All');
  const [gapsOnly, setGapsOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(() => {
    const wanted = new URLSearchParams(window.location.search).get('open');
    return accounts.some(a => a.id === wanted) ? wanted : null;
  });
  const [banner, setBanner] = useState<{ title: string; lines: string[] } | null>(null);
  const [changed, setChanged] = useState<string[]>([]);
  useEffect(() => saveAccounts(c.id, accounts), [accounts, c.id]);

  const custodians = [...new Set(accounts.map(a => a.custodian))];
  const q = query.trim().toLowerCase();
  const cohort = accounts.filter(a =>
    (!q || [a.household, a.custodian, a.last4, REG_LABEL[a.reg], a.mapped ? CATALOG[a.reg].name : ''].join(' ').toLowerCase().includes(q)) &&
    (custodian === 'All' || a.custodian === custodian) && (reg === 'All' || a.reg === reg) &&
    (!gapsOnly || ['Review', 'Blocked'].includes(statusOf(a))));
  const counts = Object.fromEntries(['All', ...STATUSES].map(s => [s, cohort.filter(a => s === 'All' || statusOf(a) === s).length])) as Record<string, number>;
  const visible = cohort.filter(a => status === 'All' || statusOf(a) === status);
  const total = visible.reduce((s, a) => s + a.value, 0);
  const advanced = (custodian !== 'All' ? 1 : 0) + (reg !== 'All' ? 1 : 0) + (gapsOnly ? 1 : 0);
  const open = accounts.find(a => a.id === openId) ?? null;

  const run = () => {
    const { next, changes } = autoMatch(accounts);
    setAccounts(next);
    setChanged(next.filter((a, i) => a !== accounts[i]).map(a => a.id));
    setBanner(changes.length
      ? { title: `Auto-match suggested ${changes.length} mapping${changes.length > 1 ? 's' : ''}. Human review is required before approval.`, lines: changes }
      : { title: 'Auto-match found nothing new. Mapped and approved accounts were left unchanged.', lines: [] });
  };
  const update = useCallback((fn: (a: Account) => Account, msg: string) => {
    setAccounts(all => all.map(a => (a.id === openId ? fn(a) : a)));
    if (msg) setBanner({ title: msg, lines: [] });
  }, [openId]);
  const reset = () => {
    setAccounts(accountsFor(c.id)); setBanner({ title: 'Mapping demo reset to its starting data.', lines: [] });
    setChanged([]); setStatus('All'); setQuery(''); setCustodian('All'); setReg('All'); setGapsOnly(false);
  };
  const openAccount = (a: Account) => setOpenId(a.id);

  return (
    <div className="am-page">
      {trail}
      <div className="am-title">
        <div>
          <h1>Account mappings</h1>
          <p>{c.name} · CND-2024-{c.id}</p>
        </div>
        <span className="am-mock"><ShieldCheck size={13} aria-hidden />Mock data · illustrative configurations · no live transfers</span>
      </div>

      <div className="am-chips" role="group" aria-label="Filter by mapping status">
        {(['All', ...STATUSES] as const).map(s => (
          <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)}>{s}<b>{counts[s]}</b></button>
        ))}
      </div>

      <div className="am-toolbar">
        <label className="am-search"><Search size={15} aria-hidden />
          <input aria-label="Search mapped accounts" placeholder="Search household, custodian, account, or registration" value={query} onChange={e => setQuery(e.target.value)} />
          {query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}
        </label>
        <button className="am-btn" aria-expanded={filtersOpen} aria-controls="am-adv" onClick={() => setFiltersOpen(v => !v)}>
          <SlidersHorizontal size={14} />Filters{advanced > 0 && <span className="am-count">{advanced}</span>}
        </button>
        <button className="am-btn am-primary" onClick={run}><Sparkles size={14} />Run auto-match</button>
      </div>
      {filtersOpen && (
        <div id="am-adv" className="am-adv">
          <label>Source custodian<select value={custodian} onChange={e => setCustodian(e.target.value)}><option>All</option>{custodians.map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Registration<select value={reg} onChange={e => setReg(e.target.value as RegKey | 'All')}><option value="All">All</option>{(Object.keys(REG_LABEL) as RegKey[]).map(k => <option key={k} value={k}>{REG_LABEL[k]}</option>)}</select></label>
          <label className="am-check"><input type="checkbox" checked={gapsOnly} onChange={e => setGapsOnly(e.target.checked)} />Only accounts with gaps (Review / Blocked)</label>
          <button className="am-link" onClick={() => { setCustodian('All'); setReg('All'); setGapsOnly(false); }}>Clear filters</button>
        </div>
      )}
      {banner && (
        <div className="am-banner" role="status">
          <Sparkles size={15} aria-hidden />
          <div><b>{banner.title}</b>{banner.lines.length > 0 && <ul>{banner.lines.map(l => <li key={l}>{l}</li>)}</ul>}</div>
          <button aria-label="Dismiss message" onClick={() => setBanner(null)}><X size={14} /></button>
        </div>
      )}

      <div className="am-grid-wrap">
        <table className="am-grid">
          <thead><tr>
            <th>Household / client</th><th>Source custodian</th><th>Account #</th><th>Registration</th>
            <th className="r">Value</th><th>Proposed Wells Fargo configuration <i>(illustrative)</i></th>
            <th className="c">Matched</th><th>Status</th><th><span className="sr">Review</span></th>
          </tr></thead>
          <tbody>
            {visible.map(a => {
              const s = statusOf(a), ev = evaluate(a);
              return (
                <tr key={a.id} className={changed.includes(a.id) ? 'am-new' : ''}>
                  <td><button className="am-link am-name" onClick={() => openAccount(a)}>{a.household}</button></td>
                  <td>{a.custodian}</td>
                  <td className="am-mono">····{a.last4}</td>
                  <td>{REG_LABEL[a.reg]}</td>
                  <td className="r">{money(a.value)}</td>
                  <td data-label="Proposed">{a.mapped ? CATALOG[a.reg].name : <span className="am-muted">Not yet matched</span>}</td>
                  <td className="c am-mono" data-label="Matched">{a.mapped ? <span className={ev.matched === ev.total ? 'am-full' : ''}>{ev.matched}/{ev.total}</span> : '—'}</td>
                  <td><StatusPill status={s} /></td>
                  <td className="r"><button className="am-btn am-sm" aria-label={`Review account ${a.last4}`} onClick={() => openAccount(a)}>Review</button></td>
                </tr>
              );
            })}
            {!visible.length && <tr><td colSpan={9} className="am-none">No accounts match the current search and filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="am-bar" role="status">
        <span><b>{visible.length}</b> of {accounts.length} accounts</span>
        <span>Total value <b>{money(total)}</b></span>
        <button className="am-link" onClick={reset}><RotateCcw size={12} />Reset demo</button>
      </div>

      {open && <Comparison account={open} update={update} close={() => setOpenId(null)} />}
    </div>
  );
}
