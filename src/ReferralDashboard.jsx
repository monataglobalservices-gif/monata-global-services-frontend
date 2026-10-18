import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Copy, LogOut, RefreshCw, Share2, Users, Wallet } from 'lucide-react';

const date = (value) => value ? new Date(value).toLocaleDateString() : '—';
const money = (value, currency = 'USD') => value == null ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value));

export default function ReferralDashboard({ user, api, logout }) {
  const [data, setData] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [signature, setSignature] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const referralCode = user.referralCode || data?.referralCode || data?.code || '';
  const referralUrl = `${window.location.origin}/?ref=${encodeURIComponent(referralCode)}`;

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
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api('/referrals/agreement/sign', { method: 'POST', body: JSON.stringify({ signature }) });
      setSignature(''); setNotice('Referral agreement signed.'); await refresh();
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  const referrals = data?.referrals || data?.clients || [];
  const contracts = data?.contracts || [];
  const commissions = data?.commissions || [];

  return <section className="dashboard referral-dashboard"><div className="dashboard-shell">
    <aside className="dashboard-sidebar"><a href="/" className="dash-brand"><img className="brand-logo-image dash-brand-logo" src="/monata-logo.jpg" alt=""/><span>MONATA<small>REFERRAL PARTNER</small></span></a>
      <div className="dash-user"><span className="dash-user-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</span><span><b>{user.firstName} {user.lastName}</b><small>Referral partner</small></span></div>
      <div className="referrer-side-note"><Users size={17}/><span>Share your link. Earn 10% when a referred client's contract is fully paid.</span></div>
      <button className="dash-signout" onClick={logout}><LogOut size={16}/> Sign out</button>
    </aside>
    <div className="dashboard-content"><div className="dash-topline"><span>MONATA / REFERRER WORKSPACE</span><button className="dash-refresh" onClick={refresh}><RefreshCw size={12}/> Refresh</button></div>
      <header className="dash-welcome"><div><span className="about-kicker">REFERRAL PARTNER</span><h1>Good to have you,<br/><em>{user.firstName}.</em></h1><p>Track the people you introduce and the commission earned from fully paid contracts.</p></div></header>
      {error && <div className="dash-error">{error}</div>}{notice && <div className="referrer-notice">{notice}</div>}
      <div className="referral-link-card"><div><span className="about-kicker">YOUR PERSONAL REFERRAL LINK</span><h2>{referralCode || 'Loading your code…'}</h2><p>New clients who register through this link will be attributed to you.</p><code>{referralUrl}</code></div><div className="referral-actions"><button className="button button-dark" onClick={shareLink}><Share2 size={15}/> Share link</button><button className="dash-action secondary" onClick={copyLink}><Copy size={14}/> Copy link</button></div></div>
      <div className="dash-stat-grid"><article className="dash-stat"><span>People referred</span><b>{data?.referralCount ?? referrals.length}</b></article><article className="dash-stat"><span>Secured contracts</span><b>{data?.securedContractCount ?? contracts.filter(x => x.status === 'SECURED' || x.status === 'SIGNED').length}</b></article><article className="dash-stat"><span>Commission earned</span><b>{money(data?.earnedCommission ?? data?.commissionEarned ?? 0, data?.currency || 'USD')}</b></article><article className="dash-stat"><span>Awaiting full payment</span><b>{money(data?.pendingCommission ?? 0, data?.currency || 'USD')}</b></article></div>
      <div className="referrer-grid"><section className="dash-panel"><div className="dash-panel-heading"><div><span className="about-kicker">YOUR NETWORK</span><h2>Referred clients</h2></div><span className="dash-count">{referrals.length}</span></div>{referrals.length ? referrals.map((item,index)=><article className="dash-record" key={item.id || index}><span className="dash-record-mark">{(item.firstName || item.client?.firstName || 'C')[0]}</span><div className="dash-record-main"><div className="dash-record-line"><h3>{item.firstName || item.client?.firstName} {item.lastName || item.client?.lastName}</h3><span className="dash-status">{item.status || 'Referred'}</span></div><p>Joined {date(item.createdAt || item.referredAt)}{item.email ? ` · ${item.email}` : ''}</p></div></article>) : <div className="dash-empty">People who register with your code will appear here.</div>}</section>
        <section className="dash-panel"><div className="dash-panel-heading"><div><span className="about-kicker">EARNINGS</span><h2>Contract commissions</h2></div><Wallet size={17}/></div>{contracts.length ? contracts.map((item,index)=><article className="dash-record" key={item.id || index}><span className="dash-record-mark">₵</span><div className="dash-record-main"><div className="dash-record-line"><h3>{item.title || item.client?.firstName + ' contract' || 'Client contract'}</h3><span className="dash-status">{item.status}</span></div><p>{item.client?.firstName || item.clientName || 'Referred client'} · {money(item.commissionAmount ?? item.amount * .1, item.currency)} commission · {item.fullyPaidAt ? `Paid ${date(item.fullyPaidAt)}` : 'Earned after full payment'}</p></div></article>) : commissions.length ? commissions.map((item,index)=><article className="dash-record" key={item.id || index}><span className="dash-record-mark">₵</span><div className="dash-record-main"><div className="dash-record-line"><h3>{item.contract?.title || 'Contract commission'}</h3><span className="dash-status">{item.status}</span></div><p>{money(item.amount,item.currency)} · {date(item.createdAt)}</p></div></article>) : <div className="dash-empty">A 10% commission is recorded after a referred client's secured contract is fully paid.</div>}</section></div>
      <section className="dash-panel referral-agreement"><div className="dash-panel-heading"><div><span className="about-kicker">REFERRAL TERMS</span><h2>Commission agreement</h2></div><span className="dash-status">{agreement?.signedAt ? `Signed ${date(agreement.signedAt)}` : 'Signature required'}</span></div>{agreement?.terms && <p className="agreement-copy">{agreement.terms}</p>}{!agreement?.signedAt && <form className="dash-ticket-form" onSubmit={signAgreement}><p>Please review the agreement terms above, then type your full legal name to sign electronically.</p><label>Full legal name<input required minLength="2" value={signature} onChange={e=>setSignature(e.target.value)} placeholder="Your full legal name"/></label><button className="dash-action" disabled={busy || !agreement?.terms}>{busy ? 'Signing…' : 'Sign referral agreement'}</button></form>}</section>
    </div>
  </div></section>;
}
