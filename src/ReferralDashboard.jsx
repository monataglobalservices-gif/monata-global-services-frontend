import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, FileText, LogOut, Printer, RefreshCw, Share2, Users, Wallet } from 'lucide-react';
import { DEFAULT_REFERRAL_AGREEMENT } from './referralAgreement';

const date = (value) => value ? new Date(value).toLocaleDateString() : '—';
const money = (value, currency = 'USD') => value == null ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value));

export default function ReferralDashboard({ user, api, logout }) {
  const [data, setData] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [signature, setSignature] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloadingEvidence, setDownloadingEvidence] = useState(false);
  const [page, setPage] = useState('Overview');
  const referralCode = user.referralCode || data?.referralCode || data?.code || '';
  const referralUrl = window.location.origin + '/?ref=' + encodeURIComponent(referralCode);

  async function refresh() {
    setError('');
    try {
      const [summary, terms] = await Promise.all([api('/referrals/me'), api('/referrals/agreement')]);
      setData(summary || {});
      setAgreement(terms || null);
    } catch (failure) { setError(failure.message); }
  }
  useEffect(() => { refresh(); }, [user.id]);

  async function copyLink() {
    try { await navigator.clipboard.writeText(referralUrl); setNotice('Referral link copied.'); }
    catch { setNotice(referralUrl); }
  }
  async function shareLink() {
    try {
      if (navigator.share) await navigator.share({ title: 'Monata Global Services', text: 'Create your Monata account using my referral link.', url: referralUrl });
      else await copyLink();
      await api('/analytics/link-share', { method: 'POST', body: JSON.stringify({ url: referralUrl, channel: 'native-share' }) }).catch(() => {});
      setNotice('Thanks for sharing your referral link.');
    } catch (failure) { if (failure.name !== 'AbortError') setError(failure.message); }
  }
  async function signAgreement(event) {
    event.preventDefault();
    if (!accepted || !signature.trim() || !agreement?.terms) return;
    setBusy(true);
    setError('');
    try {
      await api('/referrals/agreement/sign', { method: 'POST', body: JSON.stringify({ signature: signature.trim(), accepted: true }) });
      setSignature('');
      setAccepted(false);
      setNotice('Referral agreement signed.');
      await refresh();
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }

  async function downloadEvidence() {
    const evidenceUrl = agreement?.signature?.evidenceUrl;
    if (!evidenceUrl) return;
    setDownloadingEvidence(true);
    try {
      const token = localStorage.getItem('monata-token');
      const apiBase = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://monata-global-services-backend.onrender.com/api')).replace(/\/$/, '');
      const response = await fetch(`${apiBase}${evidenceUrl.replace(/^\/api/, '')}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Could not download the signed agreement receipt. Please refresh your session and try again.');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `referral-agreement-v${agreement.version}-receipt.txt`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (failure) { setError(failure.message); }
    finally { setDownloadingEvidence(false); }
  }

  const referrals = data?.referrals || data?.clients || [];
  const contracts = data?.contracts || [];
  const commissions = data?.commissions || [];
  const agreementText = agreement?.terms || DEFAULT_REFERRAL_AGREEMENT;
  const navItems = ['Overview', 'My referrals', 'Contracts & commissions', 'Agreement'];
  const statCards = <div className="dash-stat-grid">
    <article className="dash-stat"><span>People referred</span><b>{data?.referralCount ?? referrals.length}</b></article>
    <article className="dash-stat"><span>Secured contracts</span><b>{data?.securedContractCount ?? contracts.filter((item) => ['SECURED', 'SIGNED'].includes(item.status)).length}</b></article>
    <article className="dash-stat"><span>Commission earned</span><b>{money(data?.earnedCommission ?? data?.commissionEarned ?? 0, data?.currency || 'USD')}</b></article>
    <article className="dash-stat"><span>Awaiting full payment</span><b>{money(data?.pendingCommission ?? 0, data?.currency || 'USD')}</b></article>
  </div>;

  const referralsPanel = <section className="dash-panel">
    <div className="dash-panel-heading"><div><span className="about-kicker">YOUR NETWORK</span><h2>Referred clients</h2></div><span className="dash-count">{referrals.length}</span></div>
    {referrals.length ? referrals.map((item, index) => <article className="dash-record" key={item.id || index}>
      <span className="dash-record-mark">{(item.firstName || item.client?.firstName || 'C')[0]}</span>
      <div className="dash-record-main"><div className="dash-record-line"><h3>{item.firstName || item.client?.firstName} {item.lastName || item.client?.lastName}</h3><span className="dash-status">{item.status || 'Referred'}</span></div>
        <p>Joined {date(item.createdAt || item.referredAt)}{item.email ? ' · ' + item.email : ''}</p>
      </div>
    </article>) : <div className="dash-empty">People who register with your code will appear here.</div>}
  </section>;

  const commissionsPanel = <section className="dash-panel">
    <div className="dash-panel-heading"><div><span className="about-kicker">EARNINGS</span><h2>Contract commissions</h2></div><Wallet size={17}/></div>
    {contracts.length ? contracts.map((item, index) => <article className="dash-record" key={item.id || index}>
      <span className="dash-record-mark">%</span><div className="dash-record-main">
        <div className="dash-record-line"><h3>{item.title || (item.client?.firstName ? item.client.firstName + "'s contract" : 'Client contract')}</h3><span className="dash-status">{item.status}</span></div>
        <p>{item.client?.firstName || item.clientName || 'Referred client'} · {money(item.commissionAmount ?? (item.amount ? item.amount * 0.1 : null), item.currency)} commission · {item.fullyPaidAt ? 'Paid ' + date(item.fullyPaidAt) : 'Earned after full payment'}</p>
      </div>
    </article>) : commissions.length ? commissions.map((item, index) => <article className="dash-record" key={item.id || index}>
      <span className="dash-record-mark">%</span><div className="dash-record-main"><div className="dash-record-line"><h3>{item.contract?.title || 'Contract commission'}</h3><span className="dash-status">{item.status}</span></div><p>{money(item.amount, item.currency)} · {date(item.createdAt)}</p></div>
    </article>) : <div className="dash-empty">A 10% commission is recorded after a referred client's secured contract is fully paid.</div>}
  </section>;

  const pageDescription = {
    Overview: 'Your referrals and commission activity at a glance.',
    'My referrals': 'People who joined Monata through your personal referral code.',
    'Contracts & commissions': 'Track contracts and commissions earned after full payment.',
    Agreement: 'Review the partnership terms and open the full agreement to sign.',
    'Agreement document': 'Read the complete partnership agreement before signing.'
  };

  return <section className="dashboard referral-dashboard"><div className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <a href="/" className="dash-brand"><img className="brand-logo-image dash-brand-logo" src="/monata-logo.jpg" alt=""/><span>MONATA<small>REFERRAL PARTNER</small></span></a>
      <div className="dash-user"><span className="dash-user-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</span><span><b>{user.firstName} {user.lastName}</b><small>Referral partner</small></span></div>
      <nav className="dash-nav referrer-nav" aria-label="Referrer dashboard sections">{navItems.map((item) => <button key={item} className={page === item || (page === 'Agreement document' && item === 'Agreement') ? 'active' : ''} onClick={() => setPage(item)}><span>·</span>{item}</button>)}</nav>
      <div className="referrer-side-note"><Users size={17}/><span>Earn 10% when a referred client's contract is fully paid.</span></div>
      <button className="dash-signout" onClick={logout}><LogOut size={16}/> Sign out</button>
    </aside>
    <div className="dashboard-content">
      <div className="dash-topline"><span>MONATA / REFERRER WORKSPACE / {page.toUpperCase()}</span><button className="dash-refresh" onClick={refresh}><RefreshCw size={12}/> Refresh</button></div>
      <header className="dash-welcome"><div><span className="about-kicker">REFERRAL PARTNER</span><h1>{page === 'Overview' ? <>Good to have you,<br/><em>{user.firstName}.</em></> : page}</h1><p>{pageDescription[page]}</p></div></header>
      {error && <div className="dash-error">{error}</div>}{notice && <div className="referrer-notice">{notice}</div>}
      {page === 'Agreement document' && <div className="agreement-document-inline"><div className="agreement-document-toolbar"><button className="dash-action secondary" onClick={() => setPage('Agreement')}><ArrowLeft size={15}/> Back to Agreement</button><button className="dash-action secondary" onClick={() => window.print()}><Printer size={15}/> Print agreement</button></div><article className="agreement-document"><header><span className="about-kicker">MONATA GLOBAL SERVICES</span><h1>Referral Partnership Agreement</h1><p>Version {agreement?.version ?? '—'} · Read the complete agreement below. The effective date is the date the parties sign.</p></header><div className="agreement-document-copy">{agreementText.split('\n\n').map((paragraph, index) => { const heading = paragraph.match(/^(\d+\.\s+[^:\n]+:?)\n?([\s\S]*)$/); return heading ? <section key={index}><h2>{heading[1]}</h2><p>{heading[2]}</p></section> : <p key={index}>{paragraph}</p>; })}</div><section className="agreement-signature"><div className="dash-panel-heading"><div><span className="about-kicker">ELECTRONIC SIGNATURE</span><h2>{agreement?.signedAt ? 'Agreement signed' : 'Sign this agreement'}</h2></div><span className="dash-status">{agreement?.signedAt ? 'Signed ' + date(agreement.signedAt) : agreement?.terms ? 'Ready for signature' : 'Awaiting published terms'}</span></div>{agreement?.signedAt ? <><p>Version {agreement.version} was signed on {new Date(agreement.signedAt).toLocaleString()} by {agreement.signature?.typedLegalName || user.firstName + ' ' + user.lastName}.</p><button className="dash-action secondary" disabled={downloadingEvidence || !agreement.signature?.evidenceUrl} onClick={downloadEvidence}>{downloadingEvidence ? 'Preparing receipt…' : 'Download signed agreement receipt'}</button></> : <>{!agreement?.terms && <p className="dash-empty">The administrator must publish the agreement terms before it can be signed. This displayed template is for review.</p>}<form className="dash-ticket-form" onSubmit={signAgreement}><label className="agreement-accept"><input type="checkbox" required checked={accepted} onChange={(event) => setAccepted(event.target.checked)}/> I have read and agree to the Referral Partnership Agreement above.</label><label>Full legal name<input required minLength="2" value={signature} onChange={(event) => setSignature(event.target.value)} placeholder="Type your full legal name"/></label><button className="button button-dark" disabled={busy || !accepted || !agreement?.terms}>{busy ? 'Signing…' : 'Sign partnership agreement'} <ArrowRight size={15}/></button></form></>}</section></article></div>}
      {page === 'Overview' && <>{statCards}<div className="referral-link-card"><div><span className="about-kicker">YOUR PERSONAL REFERRAL LINK</span><h2>{referralCode || 'Loading your code…'}</h2><p>New clients who register through this link will be attributed to you.</p><code>{referralUrl}</code></div><div className="referral-actions"><button className="button button-dark" onClick={shareLink}><Share2 size={15}/> Share link</button><button className="dash-action secondary" onClick={copyLink}><Copy size={14}/> Copy link</button></div></div><div className="referrer-grid"><div>{referralsPanel}</div><div>{commissionsPanel}</div></div></>}
      {page === 'My referrals' && referralsPanel}
      {page === 'Contracts & commissions' && <>{statCards}{commissionsPanel}</>}
      {page === 'Agreement' && <section className="dash-panel referral-agreement"><div className="dash-panel-heading"><div><span className="about-kicker">REFERRAL TERMS</span><h2>Referral partnership agreement</h2></div><span className="dash-status">{agreement?.signedAt ? 'Signed ' + date(agreement.signedAt) : agreement?.terms ? 'Ready to read and sign' : 'Terms not published'}</span></div><p className="agreement-copy">The agreement explains referral eligibility, the 10% commission, when commission is earned and paid, each party's responsibilities, and how the arrangement may end.</p><button className="button button-dark agreement-open-button" onClick={() => setPage('Agreement document')}><FileText size={16}/> Read the full agreement <ArrowRight size={15}/></button></section>}
    </div>
  </div></section>;
}
