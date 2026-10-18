import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, GitCompareArrows } from 'lucide-react';
import type { Candidate } from './data';
import { CATALOG, REG_LABEL, STATUSES, evaluate, loadAccounts, statusOf, type MappingStatus } from './mapping-data';

const money = (n: number) => '$' + n.toLocaleString('en-US');

/** Accounts tab on the candidate page: every account this candidate uploaded, with live mapping status. */
export default function AccountsTab({ c }: { c: Candidate }) {
  // Reads the same saved state as the Account mappings page, so approvals and auto-match results show up here.
  const accounts = useMemo(() => loadAccounts(c.id), [c.id]);
  const total = accounts.reduce((s, a) => s + a.value, 0);
  const counts = Object.fromEntries(STATUSES.map(s => [s, accounts.filter(a => statusOf(a) === s).length])) as Record<MappingStatus, number>;
  const base = `/candidates/${c.id}/accounts`;

  return (
    <section className="section am-tab">
      <div className="section-heading">
        <h3><FileText size={17} aria-hidden />Accounts uploaded by {c.name}</h3>
        <Link className="am-tab-cta" to={base}><GitCompareArrows size={14} aria-hidden />Open account mappings<ArrowRight size={14} aria-hidden /></Link>
      </div>
      <p className="am-tab-summary" role="status">
        <b>{accounts.length}</b> accounts · <b>{money(total)}</b> total value
        <span className="am-tab-counts">
          {STATUSES.filter(s => counts[s] > 0).map(s => <span key={s} className={'am-status am-s-' + s.toLowerCase()}>{s} {counts[s]}</span>)}
        </span>
      </p>
      <div className="am-grid-wrap">
        <table className="am-grid am-grid-tab">
          <thead><tr>
            <th>Household / client</th><th>Source custodian</th><th>Account #</th><th>Registration</th>
            <th className="r">Value</th><th>Uploaded</th><th className="c">Matched</th><th>Mapping status</th><th><span className="sr">Review</span></th>
          </tr></thead>
          <tbody>
            {accounts.map(a => {
              const s = statusOf(a), ev = evaluate(a);
              return (
                <tr key={a.id}>
                  <td><Link className="am-name am-link" to={`${base}?open=${a.id}`}>{a.household}</Link></td>
                  <td>{a.custodian}</td>
                  <td className="am-mono">····{a.last4}</td>
                  <td>{REG_LABEL[a.reg]}</td>
                  <td className="r">{money(a.value)}</td>
                  <td data-label="Uploaded">{a.uploadedOn}<small className="am-file">{a.uploadFile}</small></td>
                  <td className="c am-mono" data-label="Matched">{a.mapped ? `${ev.matched}/${ev.total}` : '—'}</td>
                  <td><span className={'am-status am-s-' + s.toLowerCase()}>{s}</span>{a.mapped && <small className="am-file">{CATALOG[a.reg].name}</small>}</td>
                  <td className="r"><Link className="am-btn am-sm" aria-label={`Review ${a.household} ····${a.last4}`} to={`${base}?open=${a.id}`}>Review</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="am-foot">Mock data. Destination configurations are illustrative; reviewing an account opens the comparison on the Account mappings page.</p>
    </section>
  );
}
