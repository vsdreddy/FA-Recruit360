import { useState } from 'react';
import { Download } from 'lucide-react';
import UiIcon from './UiIcon';
import { matchesProcessStep } from './CandidateSteps';
import { stages, type Candidate } from './data';

type Group = { label: string; count: number; risk: number; days: number; progress: number };

const summarize = (label: string, rows: Candidate[]): Group => ({
  label,
  count: rows.length,
  risk: rows.filter(c => c.status === 'At Risk').length,
  days: rows.length ? Math.round((rows.reduce((n, c) => n + c.days, 0) / rows.length) * 10) / 10 : 0,
  progress: rows.length ? Math.round(rows.reduce((n, c) => n + c.progress, 0) / rows.length) : 0,
});

function GroupTable({ title, first, groups, total }: { title: string; first: string; groups: Group[]; total: number }) {
  return (
    <section className="section rp-section">
      <div className="section-heading"><h3><UiIcon label={title} size={17} />{title}</h3></div>
      <div className="table-scroll">
        <table className="rp-table">
          <caption className="sr">{title}</caption>
          <thead><tr><th>{first}</th><th className="r">Candidates</th><th>Share</th><th className="r">At risk</th><th className="r">Avg days in stage</th><th className="r">Avg progress</th></tr></thead>
          <tbody>
            {groups.map(g => (
              <tr key={g.label}>
                <th scope="row">{g.label}</th>
                <td className="r">{g.count}</td>
                <td><div className="rp-share"><i style={{ width: `${total ? (g.count / total) * 100 : 0}%` }} /><span>{total ? Math.round((g.count / total) * 100) : 0}%</span></div></td>
                <td className={'r' + (g.risk ? ' red' : '')}>{g.risk}</td>
                <td className="r">{g.days}</td>
                <td className="r">{g.progress}%</td>
              </tr>
            ))}
            {!groups.length && <tr><td colSpan={6} className="empty">No candidates for this selection.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ReportsPage({ candidates, notify }: { candidates: Candidate[]; notify: (s: string) => void }) {
  const [division, setDivision] = useState('All');
  const rows = candidates.filter(c => division === 'All' || c.division === division);
  const byStage = stages.map(s => summarize(s, rows.filter(c => matchesProcessStep(c, s))));
  const byDivision = ['WBS', 'PCG', 'Other'].map(d => summarize(d, rows.filter(c => c.division === d)));
  const firms = [...new Set(rows.map(c => c.firm))].map(f => summarize(f, rows.filter(c => c.firm === f))).sort((a, b) => b.count - a.count);

  const exportCsv = () => {
    const lines = [['Section', 'Group', 'Candidates', 'At risk', 'Avg days in stage', 'Avg progress %']];
    for (const [name, groups] of [['Stage', byStage], ['Division', byDivision], ['Current firm', firms]] as const)
      for (const g of groups) lines.push([name, g.label, g.count, g.risk, g.days, g.progress].map(String));
    const blob = new Blob([lines.map(l => l.map(v => `"${v.replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'recruit360-report.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    notify('Mock report exported as CSV');
  };

  return (
    <>
      <div className="workspace-title">
        <h1><UiIcon label="Reports & Analytics" size={23} />Reports & Analytics</h1>
        <p>Pipeline distribution and risk by stage, division and current firm. Mock snapshot, Nov 15, 2024.</p>
      </div>
      <div className="table-controls rp-controls">
        <label className="rp-select">Division
          <select aria-label="Report division" value={division} onChange={e => setDivision(e.target.value)}>
            {['All', 'WBS', 'PCG', 'Other'].map(d => <option key={d}>{d}</option>)}
          </select>
        </label>
        <span className="rp-count" role="status"><b>{rows.length}</b> candidates in report</span>
        <button className="secondary" onClick={exportCsv}><Download size={15} />Export CSV</button>
      </div>
      <GroupTable title="By stage" first="Stage" groups={byStage} total={rows.length} />
      <GroupTable title="By division" first="Division" groups={byDivision} total={rows.length} />
      <GroupTable title="By current firm" first="Current firm" groups={firms} total={rows.length} />
    </>
  );
}
