import React, { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Check, CircleDollarSign, Download, FileText, Handshake, LogOut, MessageCircle, Paperclip, RefreshCw, Send, Trash2, Users, X } from 'lucide-react';
import { DEFAULT_REFERRAL_AGREEMENT } from './referralAgreement';
const API = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://monata-global-services-backend.onrender.com/api')).replace(/\/$/, '');

const DEPARTMENTS = ['VIRTUAL_ASSISTANCE', 'DEVELOPMENT', 'SOCIAL_MEDIA', 'DIGITAL_MARKETING', 'CUSTOMER_SUPPORT'];
const pretty = (value = '') => String(value).replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const isoDate = (value) => value ? new Date(value).toISOString() : undefined;

function AdminReferralWorkspace({ value, page = 'Overview', onNavigate }) {
  const partners = value?.referrers || value?.data?.referrers || [];
  const contracts = value?.contracts || value?.data?.contracts || [];
  const clientCount = partners.reduce((total, partner) => total + (partner.referrals?.length || 0), 0);
  const fullyPaidCount = contracts.filter((contract) => contract.fullyPaidAt).length;
  const initials = (person) => `${person?.firstName?.[0] || ''}${person?.lastName?.[0] || ''}`.toUpperCase() || 'R';
  return <section className="dash-panel referral-admin-overview">
    <header className="ref-admin-heading"><div><span className="about-kicker">PARTNER PROGRAM</span><h2>Referral overview</h2><p>Manage partner relationships, attributed clients, and contract progress.</p></div><span className="ref-admin-heading-icon"><Handshake size={21}/></span></header>
    <div className="ref-admin-stats">
      <article><span><Users size={15}/> Active partners</span><b>{partners.filter((partner) => partner.isActive !== false).length}</b><small>Referral accounts</small></article>
      <article><span><Users size={15}/> Referred clients</span><b>{clientCount}</b><small>Accounts attributed to partners</small></article>
      <article><span><FileText size={15}/> Contracts</span><b>{contracts.length}</b><small>Created from referrals</small></article>
      <article><span><BadgeCheck size={15}/> Fully paid</span><b>{fullyPaidCount}</b><small>Eligible for commission</small></article>
    </div>
    {page === 'Overview' && <div className="ref-admin-shortcuts"><button onClick={() => onNavigate('Referrers')}><span className="ref-shortcut-icon"><Users size={17}/></span><span><b>Referrers</b><small>Review partner accounts and attributed clients</small></span><strong>{partners.length}</strong><ArrowRight size={16}/></button><button onClick={() => onNavigate('Contracts')}><span className="ref-shortcut-icon"><FileText size={17}/></span><span><b>Contracts</b><small>Review status and commission eligibility</small></span><strong>{contracts.length}</strong><ArrowRight size={16}/></button><button onClick={() => onNavigate('Agreements')}><span className="ref-shortcut-icon"><BadgeCheck size={17}/></span><span><b>Agreements</b><small>Manage versions, signatures, and receipts</small></span><ArrowRight size={16}/></button><button onClick={() => onNavigate('Program settings')}><span className="ref-shortcut-icon"><CircleDollarSign size={17}/></span><span><b>Program settings</b><small>Set the partner commission rate</small></span><ArrowRight size={16}/></button></div>}
    {page === 'Referrers' && <><div className="ref-admin-section-head"><div><span className="about-kicker">PARTNER DIRECTORY</span><h3>Referrers</h3></div><span className="ref-admin-count">{partners.length} {partners.length === 1 ? 'partner' : 'partners'}</span></div>
    {partners.length ? <div className="ref-partner-list">{partners.map((partner) => <article className="ref-partner-card" key={partner.id}>
      <span className="ref-partner-avatar">{initials(partner)}</span><div className="ref-partner-info"><div className="ref-partner-title"><h4>{partner.firstName} {partner.lastName}</h4><span className={`ref-active-pill ${partner.isActive === false ? 'inactive' : ''}`}><i/>{partner.isActive === false ? 'Inactive' : 'Active'}</span></div><p>{partner.email}</p><div className="ref-partner-meta"><span>Referral code <b>{partner.referralCode || '—'}</b></span><span><Users size={13}/>{partner.referrals?.length || 0} clients</span><span>Joined {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : '—'}</span></div></div>
    </article>)}</div> : <div className="ref-admin-empty"><Users size={22}/><b>No referral partners yet</b><span>Referrer accounts will appear here when they are created.</span></div>}</>}
    {page === 'Contracts' && <><div className="ref-admin-section-head ref-contract-heading"><div><span className="about-kicker">ATTRIBUTED BUSINESS</span><h3>Referral contracts</h3></div><span className="ref-admin-count">{contracts.length} {contracts.length === 1 ? 'contract' : 'contracts'}</span></div>
    {contracts.length ? <div className="ref-contract-list">{contracts.map((contract) => {
      const state = contract.fullyPaidAt ? 'Fully paid' : contract.clientSignedAt ? 'Awaiting payment' : 'Awaiting signature';
      return <article className="ref-contract-card" key={contract.id}><span className={`ref-contract-icon ${contract.fullyPaidAt ? 'complete' : ''}`}><CircleDollarSign size={19}/></span><div className="ref-contract-main"><div className="ref-contract-title"><div><h4>{contract.title || `${contract.client?.firstName || 'Client'} contract`}</h4><p>{contract.client?.firstName} {contract.client?.lastName} <span>·</span> referred by {contract.referrer?.firstName} {contract.referrer?.lastName}</p></div><span className={`ref-contract-state ${contract.fullyPaidAt ? 'complete' : ''}`}>{state}</span></div><div className="ref-contract-meta"><span>Contract value <b>{contract.currency || 'USD'} {Number(contract.amount || 0).toLocaleString()}</b></span><span>Commission <b>{contract.commissionAmount == null ? 'Pending' : `${contract.currency || 'USD'} ${Number(contract.commissionAmount).toLocaleString()}`}</b></span><span>{contract.fullyPaidAt ? `Paid ${new Date(contract.fullyPaidAt).toLocaleDateString()}` : contract.clientSignedAt ? `Signed ${new Date(contract.clientSignedAt).toLocaleDateString()}` : 'Not signed yet'}</span></div></div></article>;
    })}</div> : <div className="ref-admin-empty compact"><FileText size={20}/><b>No attributed contracts yet</b><span>Contracts connected to referral partners will be listed here.</span></div>}</>}
  </section>;
}

function AdminReferralsPages({ data, api, refresh, onError, working, setWorking }) {
  const [page, setPage] = useState('Overview');
  const pages = [
    { name: 'Overview', icon: Handshake },
    { name: 'Referrers', icon: Users, count: (data.referrals?.referrers || []).length },
    { name: 'Contracts', icon: FileText, count: (data.referrals?.contracts || []).length },
    { name: 'Agreements', icon: BadgeCheck },
    { name: 'Program settings', icon: CircleDollarSign },
  ];
  const settings = data.referralSettings || {};
  const terms = settings.agreementTerms || settings.terms || DEFAULT_REFERRAL_AGREEMENT;
  const saveSettings = async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    setWorking('referral-settings'); onError('');
    try { await api('/admin/referral-settings', { method: 'PUT', body: JSON.stringify({ commissionRate: Number(form.get('commissionRate')), agreementTerms: terms }) }); await refresh(); }
    catch (failure) { onError(failure.message); }
    finally { setWorking(''); }
  };
  const pageDescription = {
    Overview: 'A quick view of your partner program and direct access to each area.',
    Referrers: 'Review each partner account, referral code, and attributed client count.',
    Contracts: 'Follow referred customer contracts and payment milestones.',
    Agreements: 'Publish agreement versions and review their signatures and evidence receipts.',
    'Program settings': 'Set the commission rate used to calculate earned partner commission.',
  };
  return <div className="admin-referral-workspace">
    <nav className="ref-admin-subnav" aria-label="Referral administration pages">{pages.map(({ name, icon: Icon, count }) => <button key={name} className={page === name ? 'active' : ''} onClick={() => setPage(name)}><Icon size={15}/><span>{name}</span>{count != null && <small>{count}</small>}</button>)}</nav>
    <div className="ref-admin-page-heading"><div><span className="about-kicker">REFERRAL PROGRAM / {page.toUpperCase()}</span><h2>{page}</h2><p>{pageDescription[page]}</p></div>{page !== 'Overview' && <button className="dash-action secondary" onClick={() => setPage('Overview')}><ArrowRight className="ref-back-arrow" size={14}/> Overview</button>}</div>
    {page === 'Agreements' ? data.agreementHistory?._error ? <section className="dash-panel"><div className="dash-error">{data.agreementHistory._error}</div></section> : <AdminAgreementHistory value={data.agreementHistory} api={api} refresh={refresh} onError={onError} working={working} setWorking={setWorking}/> : null}
    {page === 'Overview' || page === 'Referrers' || page === 'Contracts' ? data.referrals?._error ? <section className="dash-panel"><div className="dash-error">{data.referrals._error}</div></section> : <AdminReferralWorkspace value={data.referrals} page={page} onNavigate={setPage}/> : null}
    {page === 'Program settings' && <section className="dash-panel referral-settings-page"><header className="ref-admin-heading"><div><span className="about-kicker">COMMISSION POLICY</span><h2>Partner commission rate</h2><p>Commission is earned after the referred customer signs and fully pays their contract.</p></div><span className="ref-admin-heading-icon"><CircleDollarSign size={21}/></span></header><form className="referral-settings-form" onSubmit={saveSettings}><label htmlFor="admin-referral-rate">Commission rate</label><div className="ref-rate-input"><input id="admin-referral-rate" name="commissionRate" type="number" min="0" max="100" step="0.1" defaultValue={settings.commissionRate ?? settings.rate ?? 10}/><span>%</span></div><p>This rate is applied to each qualifying contract when an administrator confirms full payment.</p><button className="dash-action" disabled={working === 'referral-settings'}>{working === 'referral-settings' ? 'Saving…' : 'Save commission rate'}</button></form><div className="ref-settings-note"><BadgeCheck size={16}/><span>Agreement wording is managed separately on the Agreements page. Published agreement versions remain preserved for the signing record.</span></div></section>}
  </div>;
}

function AdminAgreementHistory({ value, api, refresh, onError, working, setWorking }) {
  const versions = Array.isArray(value) ? value : [];
  const latestPublished = versions.find((item) => item.status === 'PUBLISHED');
  const draft = versions.find((item) => item.status === 'DRAFT');
  const [draftText, setDraftText] = useState('');
  useEffect(() => { setDraftText(draft?.fullText || ''); }, [draft?.id, draft?.fullText]);
  const createDraft = async () => {
    setWorking('agreement-draft'); onError('');
    try {
      await api('/admin/referral-agreements', { method: 'POST', body: JSON.stringify({ text: latestPublished?.fullText || DEFAULT_REFERRAL_AGREEMENT }) });
      await refresh();
    } catch (failure) { onError(failure.message); }
    finally { setWorking(''); }
  };
  const saveDraft = async (event) => {
    event.preventDefault(); if (!draft) return;
    setWorking(draft.id); onError('');
    try { await api(`/admin/referral-agreements/${draft.id}`, { method: 'PUT', body: JSON.stringify({ text: draftText }) }); await refresh(); }
    catch (failure) { onError(failure.message); }
    finally { setWorking(''); }
  };
  const publishDraft = async () => {
    if (!draft || !window.confirm(`Publish agreement version ${draft.version}? Referrers will need to sign this new version.`)) return;
    setWorking(draft.id); onError('');
    try { await api(`/admin/referral-agreements/${draft.id}`, { method: 'PUT', body: JSON.stringify({ text: draftText }) }); await api(`/admin/referral-agreements/${draft.id}/publish`, { method: 'POST' }); await refresh(); }
    catch (failure) { onError(failure.message); }
    finally { setWorking(''); }
  };
  const downloadReceipt = async (signature, version) => {
    try {
      const token = localStorage.getItem('monata-token');
      const response = await fetch(`${API}${signature.evidenceUrl.replace(/^\/api/, '')}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error('Could not download the agreement receipt. Please sign in again.');
      const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `referral-agreement-v${version.version}-${signature.id}-receipt.txt`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) { onError(failure.message); }
  };
  return <section className="dash-panel referral-agreement-admin">
    <header className="ref-admin-heading"><div><span className="about-kicker">AGREEMENT CONTROL</span><h2>Versions and signatures</h2><p>Each published version is preserved with its signers and evidence receipts.</p></div><span className="ref-admin-heading-icon"><FileText size={20}/></span></header>
    <div className="ref-agreement-callout"><span><BadgeCheck size={17}/></span><p>Publishing new terms creates a new version. Referrers must accept the current version before they can participate in commission-bearing contracts.</p></div>
    {draft ? <form className="ref-agreement-editor" onSubmit={saveDraft}><div className="ref-draft-head"><div><span className="about-kicker">UNPUBLISHED DRAFT</span><h3>Version {draft.version}</h3></div><span className="ref-version-badge draft">Draft</span></div><label htmlFor={`ref-agreement-draft-${draft.id}`}>Agreement wording</label><textarea id={`ref-agreement-draft-${draft.id}`} required minLength="20" rows="12" value={draftText} onChange={(event) => setDraftText(event.target.value)}/><div className="ref-draft-actions"><span>Review the full wording before publishing. Published terms cannot be edited.</span><div><button type="submit" className="dash-action secondary" disabled={working === draft.id}>{working === draft.id ? 'Saving…' : 'Save draft'}</button><button type="button" className="dash-action" disabled={working === draft.id || draftText.trim().length < 20} onClick={publishDraft}>{working === draft.id ? 'Publishing…' : 'Publish version'}</button></div></div></form> : <div className="ref-new-version"><span><b>{latestPublished ? `Current version: ${latestPublished.version}` : 'No version published yet'}</b><small>{latestPublished?.publishedAt ? `Published ${new Date(latestPublished.publishedAt).toLocaleString()}` : 'Create and publish a version before referrers can sign.'}</small></span><button className="dash-action" disabled={working === 'agreement-draft'} onClick={createDraft}>{working === 'agreement-draft' ? 'Preparing…' : 'Create a new version'}</button></div>}
    <div className="ref-admin-section-head"><div><span className="about-kicker">RECORD OF AGREEMENT</span><h3>Version history</h3></div><span className="ref-admin-count">{versions.length} {versions.length === 1 ? 'version' : 'versions'}</span></div>
    {versions.length ? <div className="ref-version-list">{versions.map((version) => <article className="ref-version-card" key={version.id}><div className="ref-version-top"><span className="ref-version-number">v{version.version}</span><div className="ref-version-label"><h4>Partnership agreement · Version {version.version}</h4><p>{version.status === 'PUBLISHED' ? `Published ${version.publishedAt ? new Date(version.publishedAt).toLocaleString() : ''}${version.publishedBy ? ` by ${version.publishedBy.firstName} ${version.publishedBy.lastName}` : ''}` : `Created ${new Date(version.createdAt).toLocaleDateString()}`}</p></div><span className={`ref-version-badge ${version.status.toLowerCase()}`}>{version.status}</span></div><details className="ref-version-details"><summary><FileText size={14}/> View exact agreement text <span>SHA-256 {version.textSha256}</span></summary><pre>{version.fullText}</pre></details><div className="ref-signatures-heading"><b>Signatures</b><span>{version.signatures?.length || 0}</span></div>{version.signatures?.length ? version.signatures.map((signature) => <div className="ref-signature-row" key={signature.id}><span className="ref-signer-avatar">{`${signature.referrer?.firstName?.[0] || ''}${signature.referrer?.lastName?.[0] || ''}`.toUpperCase() || 'R'}</span><div className="ref-signer-info"><b>{signature.referrer?.firstName} {signature.referrer?.lastName}</b><small>{signature.referrer?.email} · Signed as {signature.typedLegalName}</small><small>{new Date(signature.signedAt).toLocaleString()} · Evidence SHA-256 {signature.evidenceSha256}</small></div><button className="dash-action secondary ref-download-button" onClick={() => downloadReceipt(signature, version)}><Download size={14}/> Receipt</button></div>) : <p className="ref-no-signatures">No referrers have signed this version yet.</p>}</article>)}</div> : <div className="ref-admin-empty"><FileText size={22}/><b>No agreement versions saved</b><span>Create a version to make partnership terms available for signature.</span></div>}
  </section>;
}

export default function Dashboard({ user, api, logout, onRequest }) {
  const admin = user.role === 'ADMIN';
  const agent = user.role === 'AGENT';
  const tabs = admin
    ? ['Overview', 'Requests', 'Projects', 'Tasks', 'Support', 'Messages', 'Files', 'Clients & team', 'Referrals', 'Contracts', 'Site analytics', 'Trash', 'Catalog', 'Quotes & invoices', 'Monata Agent report', 'Reports', 'Activity', 'Notifications']
    : agent
      ? ['Overview', 'My work', 'Requests', 'Support', 'Files', 'Messages', 'Quotes', 'Availability', 'Notifications']
      : ['Overview', 'Projects', 'Tasks', 'Requests', 'Support', 'Files', 'Messages', 'Quotes', 'Invoices', 'Notifications'];
  const specs = admin
    ? { stats: '/admin/stats', services: '/services', files: '/files', messages: '/messages', agentReports: '/admin/agent-reports', requests: '/service-requests', projects: '/projects', tasks: '/tasks', tickets: '/tickets', users: '/users?pageSize=100', trash: '/users/trash', agents: '/assistants?pageSize=100', quotes: '/quotes', invoices: '/invoices', reports: '/admin/reports/performance', audit: '/admin/audit-logs?pageSize=100', notifications: '/notifications', referrals: '/admin/referrals', agreementHistory: '/admin/referral-agreements', siteAnalytics: '/admin/site-analytics', referralSettings: '/admin/referral-settings' }
    : agent
      ? { projects: '/projects', tasks: '/tasks', requests: '/service-requests', tickets: '/tickets', files: '/files', quotes: '/quotes', messages: '/messages', calls: '/calls', notifications: '/notifications', agents: '/assistants' }
      : { projects: '/projects', tasks: '/tasks', requests: '/service-requests', tickets: '/tickets', files: '/files', messages: '/messages', agents: '/assistants?pageSize=100', quotes: '/quotes', invoices: '/invoices', contracts: '/contracts', notifications: '/notifications' };
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');
  const [positionDrafts, setPositionDrafts] = useState({});
  const [formKind, setFormKind] = useState('');
  const [ticketForm, setTicketForm] = useState({ title: '', category: 'General', description: '' });
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [thread, setThread] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [newPartnerId, setNewPartnerId] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [servicePackages, setServicePackages] = useState([]);
  const [uploadTaskId, setUploadTaskId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [availability, setAvailability] = useState('AVAILABLE');
  const [profileBio, setProfileBio] = useState('');
  const [agentReportFilter, setAgentReportFilter] = useState('OPEN');
  const [agentAnswers, setAgentAnswers] = useState({});
  const [agentAliases, setAgentAliases] = useState({});
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [agreementDraftText, setAgreementDraftText] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    const entries = await Promise.all(Object.entries(specs).map(async ([key, path]) => {
      try { return [key, await api(path)]; }
      catch (failure) { return [key, { _error: failure.message }]; }
    }));
    setData(Object.fromEntries(entries));
    setLoading(false);
  };
  useEffect(() => { refresh(); }, [user.id]);

  useEffect(() => {
    if (tab !== 'Messages') return undefined;
    let active = true;
    const syncMessages = async () => {
      try {
        const result = await api('/messages');
        if (active) setData((current) => ({ ...current, messages: result }));
        if (active && conversation) {
          const updated = await api(`/messages/${conversation.id}`);
          if (active) setThread(updated || []);
        }
      } catch { /* Keep the current conversation visible during brief network interruptions. */ }
    };
    const timer = window.setInterval(syncMessages, 2500);
    return () => { active = false; window.clearInterval(timer); };
  }, [tab, conversation?.id, user.id]);

  const list = (key) => {
    const value = data[key];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.data?.data)) return value.data.data;
    if (key === 'notifications' && Array.isArray(value?.notifications)) return value.notifications;
    return [];
  };
  const users = list('users');
  const clients = users.filter((item) => item.role === 'CLIENT' && item.isActive !== false);
  const agentProfiles = list('agents');
  const agents = agentProfiles.map((profile) => profile.user || profile).filter((item) => item.id && item.role === 'AGENT');
  const ownProfile = agentProfiles.find((profile) => profile.userId === user.id) || {};
  const knownClients = [...new Map([...clients, ...list('requests').map((item) => item.client), ...list('projects').map((item) => item.client), ...list('tasks').map((item) => item.client)].filter((item) => item?.id).map((item) => [item.id, item])).values()];
  const stats = data.stats || {};
  const notifications = data.notifications || {};

  useEffect(() => {
    if (ownProfile.availability) setAvailability(ownProfile.availability);
    if (ownProfile.bio) setProfileBio(ownProfile.bio);
  }, [ownProfile.id, ownProfile.availability, ownProfile.bio]);

  const mutate = async (id, path, body, method) => {
    setWorking(String(id));
    setError('');
    try {
      const verb = method || (path.endsWith('/respond') || path.endsWith('/assign') || path.endsWith('/send') || path.endsWith('/review') ? 'POST' : 'PUT');
      await api(path, { method: verb, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
      await refresh();
    } catch (failure) { setError(failure.message); }
    finally { setWorking(''); }
  };

  const createTicket = async (event) => {
    event.preventDefault();
    setWorking('new-ticket');
    setError('');
    try {
      await api('/tickets', { method: 'POST', body: JSON.stringify({ ...ticketForm, priority: 'MEDIUM' }) });
      setTicketForm({ title: '', category: 'General', description: '' });
      setShowTicketForm(false);
      await refresh();
    } catch (failure) { setError(failure.message); }
    finally { setWorking(''); }
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget).entries());
    setWorking('create');
    setError('');
    try {
      let path;
      let body;
      if (formKind === 'user') {
        path = '/users';
        body = { ...fields, role: fields.role, phone: fields.phone || undefined };
      } else if (formKind === 'project') {
        path = '/projects';
        body = { ...fields, coordinatorId: agent ? user.id : (fields.coordinatorId || undefined), budget: fields.budget ? Number(fields.budget) : undefined, deadline: fields.deadline ? isoDate(fields.deadline) : undefined, tags: [] };
      } else if (formKind === 'task') {
        path = '/tasks';
        body = { ...fields, clientId: fields.clientId || undefined, projectId: fields.projectId || undefined, assigneeId: agent ? user.id : (fields.assigneeId || undefined), priority: fields.priority || 'MEDIUM', deadline: fields.deadline ? isoDate(fields.deadline) : undefined };
      } else if (formKind === 'quote') {
        const request = list('requests').find((item) => item.id === fields.serviceRequestId);
        if (!request) throw new Error('Choose a service request for this quote.');
        path = '/quotes';
        body = { clientId: request.clientId, serviceRequestId: request.id, title: fields.title, scope: fields.scope, deliverables: fields.deliverables.split('\n').map((item) => item.trim()).filter(Boolean), exclusions: [], amount: Number(fields.amount), currency: fields.currency || 'USD', validUntil: isoDate(fields.validUntil), terms: fields.terms || undefined };
      } else {
        path = '/invoices';
        body = { clientId: fields.clientId, description: fields.description, amount: Number(fields.amount), currency: fields.currency || 'USD', dueDate: fields.dueDate ? isoDate(fields.dueDate) : undefined };
      }
      await api(path, { method: 'POST', body: JSON.stringify(body) });
      setFormKind('');
      await refresh();
    } catch (failure) { setError(failure.message); }
    finally { setWorking(''); }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setWorking('profile');
    setError('');
    try {
      await api('/assistants/profile/me', { method: 'PUT', body: JSON.stringify({ availability, bio: profileBio }) });
      await refresh();
    } catch (failure) { setError(failure.message); }
    finally { setWorking(''); }
  };

  const saveAgentAnswer = async (event, report) => {
    event.preventDefault();
    setWorking(report.id);
    setError('');
    try {
      await api(`/admin/agent-reports/${report.id}`, { method: 'PUT', body: JSON.stringify({ answer: agentAnswers[report.id] ?? report.answer ?? '', aliases: agentAliases[report.id] ?? (report.aliases || []).join(', ') }) });
      await refresh();
    } catch (failure) { setError(failure.message); }
    finally { setWorking(''); }
  };

  const openThread = async (partner) => {
    setConversation(partner);
    setThread([]);
    try { setThread(await api(`/messages/${partner.id}`) || []); }
    catch (failure) { setError(failure.message); }
  };
  const startConversation = async (event) => {
    event.preventDefault();
    const partner = [...agents, ...users].find((item) => String(item.id) === String(newPartnerId));
    if (!partner) return;
    await openThread(partner);
    setNewPartnerId('');
  };
  const sendMessage = async (event) => {
    event.preventDefault();
    if (!conversation || !messageText.trim()) return;
    setWorking('message');
    try {
      await api('/messages', { method: 'POST', body: JSON.stringify({ receiverId: conversation.id, content: messageText.trim() }) });
      setMessageText('');
      setThread(await api(`/messages/${conversation.id}`) || []);
      await refresh();
    } catch (failure) { setError(failure.message); }
    finally { setWorking(''); }
  };

  const addService = async () => {
    const name = window.prompt('Service name');
    if (!name?.trim()) return;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const department = window.prompt(`Department key (${DEPARTMENTS.join(', ')})`, DEPARTMENTS[0]);
    if (!DEPARTMENTS.includes(department)) { setError('Choose a valid department key.'); return; }
    const shortDescription = window.prompt('Short service description (at least 5 characters)');
    if (!shortDescription?.trim()) return;
    setWorking('catalog');
    try {
      await api('/services', { method: 'POST', body: JSON.stringify({ name: name.trim(), slug, department, shortDescription: shortDescription.trim(), description: shortDescription.trim(), benefits: [], iconName: 'sparkles', category: pretty(department), sortOrder: list('services').length + 1 }) });
      await refresh();
    } catch (failure) { setError(failure.message); }
    finally { setWorking(''); }
  };

  const managePackages = async (service) => {
    if (selectedService?.id === service.id) { setSelectedService(null); return; }
    setSelectedService(service);
    try { setServicePackages(await api(`/services/${service.id}/packages`) || []); }
    catch (failure) { setError(failure.message); }
  };

  const addPackage = async (service) => {
    const name = window.prompt(`Package name for ${service.name}`);
    if (!name?.trim()) return;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const summary = window.prompt('Package summary (at least 5 characters)');
    if (!summary?.trim()) return;
    setWorking('catalog');
    try {
      await api(`/services/${service.id}/packages`, { method: 'POST', body: JSON.stringify({ name: name.trim(), slug, summary: summary.trim(), pricingModel: 'CUSTOM' }) });
      setSelectedService(service);
      setServicePackages(await api(`/services/${service.id}/packages`) || []);
    } catch (failure) { setError(failure.message); }
    finally { setWorking(''); }
  };

  const downloadFile = async (file) => {
    try {
      const response = await fetch(`${API}/files/${file.id}/download`, { headers: { Authorization: `Bearer ${localStorage.getItem('monata-token')}` } });
      if (!response.ok) throw new Error('Could not download this file. Check that you still have access.');
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = file.originalName || 'download';
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (failure) { setError(failure.message); }
  };

  const editPackageSummary = async (item) => {
    const summary = window.prompt('Package summary', item.summary);
    if (!summary?.trim() || summary === item.summary) return;
    await mutate(item.id, `/services/packages/${item.id}`, { summary: summary.trim() }, 'PUT');
    if (selectedService) setServicePackages(await api(`/services/${selectedService.id}/packages`).catch(() => []));
  };

  const upload = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!uploadFile) return;
    setWorking('upload');
    setError('');
    try {
      const body = new FormData();
      body.append('file', uploadFile);
      if (uploadTaskId) body.append('taskId', uploadTaskId);
      await api('/files', { method: 'POST', body });
      await refresh();
      setUploadFile(null);
      form.reset();
    } catch (failure) { setError(failure.message); }
    finally { setWorking(''); }
  };

  const addMilestone = async (project) => {
    const title = window.prompt(`Milestone title for ${project.title}`);
    if (!title?.trim()) return;
    try {
      await api(`/projects/${project.id}/milestones`, { method: 'POST', body: JSON.stringify({ title: title.trim(), description: '', sortOrder: project.milestones?.length || 0 }) });
      await refresh();
    } catch (failure) { setError(failure.message); }
  };

  const request = list('requests');
  const projects = list('projects');
  const tasks = list('tasks');
  const tickets = list('tickets');
  const quotes = list('quotes');
  const invoices = list('invoices');
  const messages = list('messages');
  const cards = admin
    ? [['Active users', stats.totalUsers], ['Clients', stats.totalClients], ['Agents', stats.totalAgents], ['Projects', stats.totalProjects], ['Open tickets', stats.openTickets], ['Requests to review', stats.pendingRequests]]
    : agent
      ? [['My projects', projects.length], ['Assigned tasks', tasks.length], ['Open requests', request.filter((item) => !['COMPLETED', 'REJECTED'].includes(item.status)).length], ['Support tickets', tickets.length], ['Unread alerts', notifications.unreadCount || 0]]
      : [['Projects', projects.length], ['Tasks', tasks.length], ['Requests', request.length], ['Open support', tickets.filter((item) => !['RESOLVED', 'CLOSED'].includes(item.status)).length], ['Unread alerts', notifications.unreadCount || 0]];
  const clientOpenProjects = projects.filter((item) => !['COMPLETED', 'CANCELLED'].includes(item.status));
  const clientOpenTasks = tasks.filter((item) => !['DONE', 'COMPLETED', 'CANCELLED'].includes(item.status));
  const clientUpcomingTasks = [...clientOpenTasks]
    .filter((item) => item.deadline && new Date(item.deadline) >= new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);
  const clientNeedsAttention = [
    ...quotes.filter((item) => item.status === 'SENT').map((item) => ({ ...item, title: item.title || 'Quote awaiting your review', _kind: 'quote' })),
    ...projects.flatMap((project) => (project.milestones || [])
      .filter((milestone) => milestone.status === 'CLIENT_REVIEW')
      .map((milestone) => ({ ...milestone, title: milestone.title || 'Milestone ready for review', projectTitle: project.title, _kind: 'milestone' }))),
    ...list('invoices').filter((item) => item.status === 'OVERDUE').map((item) => ({ ...item, _kind: 'invoice' })),
  ].slice(0, 3);
  const clientRecentUpdates = [
    ...list('notifications').map((item) => ({ ...item, _kind: 'notification' })),
    ...request.map((item) => ({ ...item, _kind: 'request' })),
  ].sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0)).slice(0, 4);
  const goTo = (nextTab) => setTab(nextTab);
  const sectionMap = admin
    ? { Requests: ['requests'], Projects: ['projects'], Tasks: ['tasks'], Support: ['tickets'], Messages: ['messages'], 'Clients & team': ['users', 'agents'], Referrals: ['referrals', 'referralSettings', 'agreementHistory'], Contracts: ['contracts'], 'Site analytics': ['siteAnalytics'], Trash: ['trash'], Catalog: ['services'], 'Quotes & invoices': ['quotes', 'invoices'], 'Monata Agent report': ['agentReports'], Reports: ['reports'], Activity: ['audit'] }
    : agent
      ? { 'My work': ['tasks', 'projects'], Requests: ['requests'], Support: ['tickets'], Messages: ['messages'], Quotes: ['quotes'], Availability: ['profile', 'calls'] }
      : { Projects: ['projects'], Tasks: ['tasks'], Requests: ['requests'], Support: ['tickets'], Messages: ['messages'], Quotes: ['quotes'], Invoices: ['invoices'], Contracts: ['contracts'] };
  const visibleKeys = tab === 'Overview'
    ? (admin ? ['requests', 'projects', 'tasks', 'tickets', 'notifications'] : agent ? ['tasks', 'requests', 'projects', 'notifications'] : [])
    : tab === 'Messages' ? []
    : tab === 'Notifications' ? ['notifications'] : sectionMap[tab] || [];
  const titleFor = (key) => ({ requests: 'Service requests', tickets: 'Support tickets', audit: 'Recent activity', agents: 'Agents', users: 'Clients and team', trash: 'Trashed users', agentReports: 'Monata Agent report', referrals: 'Referral activity', referralSettings: 'Referral program terms', siteAnalytics: 'Website activity' }[key] || pretty(key));
  const getItems = (key) => {
    if (key === 'notifications') return notifications.notifications || [];
    if (key === 'reports') return list('reports');
    if (key === 'audit') return list('audit');
    if (key === 'contracts' && admin) return data.referrals?.contracts || data.referrals?.data?.contracts || [];
    return list(key);
  };
  const action = (key, item) => {
    if (key === 'contracts' && user.role === 'CLIENT' && !item.signedAt) return <button className="dash-action" onClick={async () => { const signature = window.prompt('Type your full legal name to sign this contract.'); if (signature?.trim()) await mutate(item.id, `/contracts/${item.id}/sign`, { signature: signature.trim() }, 'POST'); }}>Review and sign contract</button>;
    if (key === 'contracts' && admin && !item.fullyPaidAt && item.commissionStatus !== 'EARNED') return <button className="dash-action" disabled={working === item.id} onClick={() => { if (window.confirm('Confirm that the full contract amount has been collected? This records the referral commission.')) mutate(item.id, `/admin/referral-contracts/${item.id}/paid`, {}, 'POST'); }}>Confirm full payment</button>;
    if (key === 'notifications' && !item.isRead) return <button className="dash-action" disabled={working === item.id} onClick={() => mutate(item.id, `/notifications/${item.id}/read`, {}, 'PUT')}>Mark read</button>;
    if (key === 'quotes' && user.role === 'CLIENT' && item.status === 'SENT') return <span className="dash-buttons"><button className="dash-action" disabled={working === item.id} onClick={() => mutate(item.id, `/quotes/${item.id}/respond`, { status: 'ACCEPTED' })}>Accept</button><button className="dash-action secondary" disabled={working === item.id} onClick={() => mutate(item.id, `/quotes/${item.id}/respond`, { status: 'DECLINED' })}>Decline</button></span>;
    if (key === 'quotes' && (admin || agent) && item.status === 'DRAFT') return <button className="dash-action" disabled={working === item.id} onClick={() => mutate(item.id, `/quotes/${item.id}/send`, {})}>Send quote</button>;
    if (key === 'tasks' && (agent || admin)) return <span>{item.status !== 'DONE' && <button className="dash-action" disabled={working === item.id} onClick={() => mutate(item.id, `/tasks/${item.id}`, { status: item.status === 'TODO' ? 'IN_PROGRESS' : 'DONE' }, 'PUT')}>{item.status === 'TODO' ? 'Start task' : 'Complete task'}</button>}{admin && <button className="dash-action secondary" disabled={working === item.id} onClick={() => mutate(item.id, `/tasks/${item.id}`, undefined, 'DELETE')}>Delete task</button>}</span>;
    if (key === 'requests' && admin) return <div className="dash-inline-actions">{item.status === 'PENDING' && <button className="dash-action" disabled={working === item.id} onClick={() => mutate(item.id, `/service-requests/${item.id}`, { status: 'REVIEWING' }, 'PUT')}>Review</button>}{!['COMPLETED', 'REJECTED'].includes(item.status) && <select aria-label="Assign agent" defaultValue="" onChange={(event) => event.target.value && mutate(item.id, `/service-requests/${item.id}/assign`, { agentId: event.target.value })}><option value="">Assign agent</option>{agents.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}</select>}</div>;
    if (key === 'tickets' && admin && !['RESOLVED', 'CLOSED'].includes(item.status)) return <select aria-label="Assign ticket" defaultValue={item.assigneeId || ''} onChange={(event) => event.target.value && mutate(item.id, `/tickets/${item.id}/assign`, { agentId: event.target.value })}><option value="">Assign agent</option>{agents.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}</select>;
    if (key === 'tickets' && agent && !['RESOLVED', 'CLOSED'].includes(item.status)) return <button className="dash-action" disabled={working === item.id} onClick={() => mutate(item.id, `/tickets/${item.id}`, { status: item.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED' }, 'PUT')}>{item.status === 'OPEN' ? 'Start responding' : 'Resolve ticket'}</button>;
    if (key === 'invoices' && admin) return <select aria-label="Update invoice status" value={item.status} onChange={(event) => mutate(item.id, `/invoices/${item.id}`, { status: event.target.value }, 'PUT')}><option>DRAFT</option><option>SENT</option><option>PAID</option><option>OVERDUE</option><option>CANCELLED</option></select>;
    if (key === 'projects' && (admin || agent)) return <span className="dash-buttons">{admin && <select aria-label="Update project status" value={item.status} onChange={(event) => mutate(item.id, `/projects/${item.id}`, { status: event.target.value }, 'PUT')}><option>PLANNING</option><option>ACTIVE</option><option>ON_HOLD</option><option>COMPLETED</option><option>CANCELLED</option></select>}<button className="dash-action secondary" onClick={() => addMilestone(item)}>Add milestone</button>{admin && <button className="dash-action secondary" disabled={working === item.id} onClick={() => mutate(item.id, `/projects/${item.id}`, undefined, 'DELETE')}>Delete project</button>}</span>;
    if (key === 'users' && admin && item.id !== user.id && item.role !== 'ADMIN') {
      const draft = positionDrafts[item.id] || { role: item.role, department: item.department || DEPARTMENTS[0] };
      return <div className="dash-inline-actions"><select aria-label={`Role for ${item.email}`} value={draft.role} onChange={(event) => setPositionDrafts((items) => ({ ...items, [item.id]: { ...draft, role: event.target.value } }))}><option value="CLIENT">Client</option><option value="AGENT">Agent</option><option value="REFERRER">Referrer</option></select><select aria-label={`Department for ${item.email}`} value={draft.department} onChange={(event) => setPositionDrafts((items) => ({ ...items, [item.id]: { ...draft, department: event.target.value } }))}>{DEPARTMENTS.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select><button className="dash-action" disabled={working === item.id} onClick={() => mutate(item.id, `/users/${item.id}/position`, draft, 'PATCH')}>Save position</button><button className="dash-action secondary" disabled={working === item.id} onClick={() => { if (window.confirm(`Move ${item.firstName} ${item.lastName} to Trash?`)) mutate(item.id, `/users/${item.id}`, undefined, 'DELETE'); }}>Move to Trash</button></div>;
    }
    if (key === 'trash' && admin) return <div className="dash-inline-actions"><button className="dash-action" disabled={working === item.id} onClick={() => mutate(item.id, `/users/${item.id}/restore`, {}, 'POST')}>Restore</button><button className="dash-action secondary" disabled={working === item.id} onClick={() => { if (window.confirm(`Permanently delete ${item.firstName} ${item.lastName}? This cannot be undone.`)) mutate(item.id, `/users/${item.id}/permanent`, undefined, 'DELETE'); }}>Delete permanently</button></div>;
    return null;
  };

  const renderRecord = (key, item, index) => {
    const title = item.title || item.service?.name || item.name || item.number || item.originalName || (key === 'reports' && item.agent ? `${item.agent.firstName} ${item.agent.lastName}` : '') || item.action || item.type || item.eventType || item.page || item.path || item.id || 'Record';
    const description = item.description || item.notes || item.content || item.scope || item.summary || item.email || item.service?.name || (item.client ? `${item.client.firstName} ${item.client.lastName}` : '') || (item.referrer ? `${item.referrer.firstName} ${item.referrer.lastName}` : '') || (item.region || item.country || item.source || item.channel ? [item.region,item.country,item.source,item.channel].filter(Boolean).join(' · ') : '') || (item.agent ? item.agent.email : '') || item.project?.title || (key === 'audit' ? `${item.entityType || 'Record'} ${item.entityId || ''} · ${item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : ''}` : '') || item.department?.replaceAll('_', ' ') || '';
    const status = item.status || item.availability || item.role || item.priority;
    return <article className="dash-record" key={item.id || `${key}-${index}`}><span className="dash-record-mark">{String(index + 1).padStart(2, '0')}</span><div className="dash-record-main"><div className="dash-record-line"><h3>{title}</h3>{status && <span className={`dash-status status-${String(status).toLowerCase().replaceAll('_', '-')}`}>{pretty(status)}</span>}</div><p>{description || (item.agent ? `${item.agent.firstName} ${item.agent.lastName}` : 'No additional details provided.')}</p>{key === 'contracts' && <><small className="dash-meta">Contract amount: {item.currency || 'USD'} {item.amount ?? '—'} · {item.signedAt ? `Signed ${new Date(item.signedAt).toLocaleString()}` : 'Awaiting your signature'}{item.fullyPaidAt ? ` · Fully paid ${new Date(item.fullyPaidAt).toLocaleDateString()}` : ''}</small>{item.terms && <div className="agreement-copy">{item.terms}</div>}</>}{item.createdAt || item.visitedAt || item.sharedAt ? <small className="dash-meta">{new Date(item.createdAt || item.visitedAt || item.sharedAt).toLocaleString()}</small> : null}{key === 'siteAnalytics' && admin && item.id && <button className="dash-action secondary dash-analytics-delete" disabled={working === item.id} onClick={() => { if (window.confirm('Delete this analytics record? This cannot be undone.')) mutate(item.id, `/admin/site-analytics/${item.id}`, undefined, 'DELETE'); }}><Trash2 size={13}/>{working === item.id ? 'Deleting…' : 'Delete record'}</button>}{key === 'reports' && item.taskStats ? <small className="dash-meta">{item.taskStats.completed} completed · {item.taskStats.inProgress} in progress · {item.taskStats.todo} to do</small> : null}{item.milestones?.length ? <div className="dash-milestones"><small className="dash-meta">{item.progress || 0}% complete · {item.milestones.length} milestones</small>{item.milestones.map((milestone) => <div className="dash-milestone" key={milestone.id}><span><b>{milestone.title}</b><small>{pretty(milestone.status)}{milestone.dueDate ? ` · Due ${new Date(milestone.dueDate).toLocaleDateString()}` : ''}</small>{milestone.description && <small>{milestone.description}</small>}</span>{user.role === 'CLIENT' && milestone.status === 'CLIENT_REVIEW' && <span><button className="dash-action" onClick={() => mutate(milestone.id, `/projects/milestones/${milestone.id}/review`, { status: 'APPROVED' })}>Approve</button><button className="dash-action secondary" onClick={() => { const reviewNotes = window.prompt('What changes are needed?'); if (reviewNotes !== null) mutate(milestone.id, `/projects/milestones/${milestone.id}/review`, { status: 'CHANGE_REQUESTED', reviewNotes }); }}>Request changes</button></span>}</div>)}</div> : null}{action(key, item)}</div></article>;
  };

  const filesPanel = <section className="dash-panel"><div className="dash-panel-heading"><div><span className="about-kicker">FILES</span><h2>Shared files</h2></div><span className="dash-count">{list('files').length}</span></div><p>Upload, download, and manage files you own or can access through your tasks.</p><form className="dash-ticket-form" onSubmit={upload}><label>Task (optional)<select value={uploadTaskId} onChange={(event) => setUploadTaskId(event.target.value)}><option value="">Not attached to a task</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><label>Choose file<input type="file" required onChange={(event) => setUploadFile(event.target.files?.[0] || null)}/></label><button className="dash-action" disabled={working === 'upload' || !uploadFile}><Paperclip size={14}/> {working === 'upload' ? 'Uploading…' : 'Upload file'}</button></form>{list('files').length ? list('files').map((file) => <article className="dash-record" key={file.id}><Paperclip size={16}/><div className="dash-record-main"><div className="dash-record-line"><h3>{file.originalName}</h3><small className="dash-meta">{new Date(file.createdAt).toLocaleString()}</small></div><p>{Math.ceil(file.size / 1024)} KB{file.task?.title ? ` · ${file.task.title}` : ''} · Uploaded by {file.uploadedBy?.firstName || 'you'} {file.uploadedBy?.lastName || ''}</p><button className="dash-action" onClick={() => downloadFile(file)}>Download</button>{(admin || file.uploadedById === user.id) && <button className="dash-action secondary" onClick={() => mutate(file.id, `/files/${file.id}`, undefined, 'DELETE')}>Delete</button>}</div></article>) : <div className="dash-empty">No files have been shared yet.</div>}</section>;

  const toolbar = admin ? ({ 'Clients & team': ['user', 'Add account'], Projects: ['project', 'New project'], Tasks: ['task', 'New task'], 'Quotes & invoices': ['quote', 'Create quote'] }[tab]) : agent ? ({ 'My work': ['project', 'New project'], Quotes: ['quote', 'Create quote'] }[tab]) : null;
  const formTitle = { user: 'Create account', project: 'Create project', task: 'Create task', quote: 'Create quote', invoice: 'Create invoice' }[formKind];

  return <section className="dashboard" id="workspace"><div className="dashboard-shell"><aside className="dashboard-sidebar"><a href="#home" className="dash-brand"><img className="brand-logo-image dash-brand-logo" src="/monata-logo.jpg" alt=""/><span>MONATA<small>GLOBAL SERVICES</small></span></a><div className="dash-user"><span className="dash-user-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</span><span><b>{user.firstName} {user.lastName}</b><small>{pretty(user.role)} · {pretty(user.department || '')}</small></span></div><nav className="dash-nav" aria-label="Workspace sections">{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}><span>·</span>{item}</button>)}</nav><button className="dash-signout" onClick={logout}><LogOut size={16}/> Sign out</button></aside><div className="dashboard-content"><div className="dash-topline"><span>MONATA / {pretty(user.role)} WORKSPACE</span><button className="dash-refresh" onClick={refresh}><RefreshCw size={12}/> Refresh</button></div><header className="dash-welcome"><div><span className="about-kicker">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span><h1>{tab === 'Overview' ? <>Good to have you,<br/><em>{user.firstName}.</em></> : tab}</h1><p>{admin ? 'A clear view of the work, people and decisions across Monata.' : agent ? 'Your assignments, client work and team conversations in one place.' : 'A calm place to follow your projects and stay close to your team.'}</p></div>{user.role === 'CLIENT' && <button className="button button-dark" onClick={onRequest}>New service request <ArrowRight size={15}/></button>}</header>{error && <div className="dash-error">{error}</div>}{loading && <div className="dash-loading">Updating your workspace…</div>}
    {tab === 'Overview' && <div className="dash-stat-grid">{cards.map(([label, value]) => <article className="dash-stat" key={label}><span>{label}</span><b>{value ?? '—'}</b></article>)}</div>}
    {tab === 'Overview' && user.role === 'CLIENT' && <div className="client-overview">
      <section className="client-next-step">
        <div><span className="about-kicker">YOUR WORKSPACE</span><h2>{clientNeedsAttention.length ? 'A few things need your attention' : 'You’re all caught up'}</h2><p>{clientNeedsAttention.length ? 'Review these items to keep your work moving.' : 'Your projects and requests are on track. You can check back here for new updates.'}</p></div>
        <button className="button button-dark" onClick={() => onRequest?.()}>Start a request <ArrowRight size={15}/></button>
      </section>
      <div className="client-overview-grid">
        <section className="dash-panel client-focus-panel"><div className="dash-panel-heading"><div><span className="about-kicker">NEXT STEPS</span><h2>Needs your attention</h2></div><span className="dash-count">{clientNeedsAttention.length}</span></div>
          {clientNeedsAttention.length ? clientNeedsAttention.map((item, index) => <article className="dash-record" key={`${item._kind}-${item.id || index}`}><span className="dash-record-mark">{item._kind === 'quote' ? '$' : item._kind === 'milestone' ? '✓' : '!'}</span><div className="dash-record-main"><div className="dash-record-line"><h3>{item.title}</h3><span className="dash-status status-pending">{item._kind === 'milestone' ? 'Review' : pretty(item.status || 'Action needed')}</span></div><p>{item._kind === 'milestone' ? `${item.projectTitle} is ready for your review.` : item._kind === 'quote' ? 'A quote is ready for you to accept or decline.' : item.description || 'This invoice is overdue.'}</p><button className="dash-action" onClick={() => goTo(item._kind === 'quote' ? 'Quotes' : item._kind === 'invoice' ? 'Invoices' : 'Projects')}>Review item <ArrowRight size={12}/></button></div></article>) : <div className="dash-empty">No pending approvals or overdue items.</div>}
        </section>
        <section className="dash-panel"><div className="dash-panel-heading"><div><span className="about-kicker">COMING UP</span><h2>Upcoming tasks</h2></div><button className="dash-text-action" onClick={() => goTo('Tasks')}>All tasks <ArrowRight size={13}/></button></div>
          {clientUpcomingTasks.length ? clientUpcomingTasks.map((item, index) => <article className="dash-record" key={item.id}><span className="dash-record-mark">{String(index + 1).padStart(2, '0')}</span><div className="dash-record-main"><div className="dash-record-line"><h3>{item.title}</h3><span className="dash-status">{pretty(item.status)}</span></div><p>{item.project?.title || item.description || 'Task in progress'}</p><small className="dash-meta">Due {new Date(item.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></div></article>) : <div className="dash-empty">No upcoming task deadlines. Your team will add them as work is planned.</div>}
        </section>
        <section className="dash-panel"><div className="dash-panel-heading"><div><span className="about-kicker">PROJECTS</span><h2>Active work</h2></div><button className="dash-text-action" onClick={() => goTo('Projects')}>All projects <ArrowRight size={13}/></button></div>
          {clientOpenProjects.length ? clientOpenProjects.slice(0, 3).map((item, index) => renderRecord('projects', item, index)) : <div className="dash-empty">No active projects yet. Your accepted request will appear here.</div>}
        </section>
        <section className="dash-panel"><div className="dash-panel-heading"><div><span className="about-kicker">RECENT</span><h2>Latest updates</h2></div><button className="dash-text-action" onClick={() => goTo('Notifications')}>Notifications <ArrowRight size={13}/></button></div>
          {clientRecentUpdates.length ? clientRecentUpdates.map((item, index) => <article className="dash-record" key={`${item._kind}-${item.id || index}`}><span className="dash-record-mark">{item._kind === 'notification' ? '•' : '↗'}</span><div className="dash-record-main"><div className="dash-record-line"><h3>{item.title || item.message || item.service?.name || 'Service request'}</h3>{item.status && <span className="dash-status">{pretty(item.status)}</span>}</div><p>{item.message || item.description || item.notes || 'Your service request is being tracked here.'}</p>{(item.createdAt || item.updatedAt) && <small className="dash-meta">{new Date(item.createdAt || item.updatedAt).toLocaleDateString()}</small>}</div></article>) : <div className="dash-empty">Updates from your team will appear here.</div>}
        </section>
      </div>
      <section className="client-quick-links"><span className="about-kicker">QUICK LINKS</span><button onClick={() => goTo('Requests')}>Service requests <ArrowRight size={13}/></button><button onClick={() => goTo('Messages')}>Messages <ArrowRight size={13}/></button><button onClick={() => goTo('Invoices')}>Invoices <ArrowRight size={13}/></button><button onClick={() => goTo('Support')}>Get support <ArrowRight size={13}/></button></section>
    </div>}
    {tab === 'Availability' && <section className="dash-panel"><h2>Your agent profile</h2><p>{ownProfile.bio || 'Keep your profile and availability up to date for work assignments.'}</p><form className="dash-ticket-form" onSubmit={saveProfile}><label>Availability<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="AVAILABLE">Available</option><option value="BUSY">Busy</option><option value="OFFLINE">Offline</option></select></label><label>Profile summary<textarea maxLength="5000" value={profileBio} onChange={(event) => setProfileBio(event.target.value)} rows="3"/></label><button className="dash-action" disabled={working === 'profile'}>Save profile</button></form><p>{ownProfile.completedTasks || 0} completed tasks · Rating {ownProfile.rating ?? '—'} · {list('calls').length} calls recorded</p></section>}
    {tab === 'Files' && filesPanel}
    {tab === 'Messages' && <section className="dash-panel dash-messages"><div className="dash-panel-heading"><div><span className="about-kicker">LIVE CONVERSATIONS</span><h2>Messages</h2></div><span className="dash-live"><i/> Live</span></div><div className="dash-message-layout"><nav className="dash-conversations" aria-label="Conversations">{user.role === 'CLIENT' && <form className="dash-start-conversation" onSubmit={startConversation}><select aria-label="Choose a team member" value={newPartnerId} onChange={(event) => setNewPartnerId(event.target.value)} required><option value="">Start a conversation…</option>{agents.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}{item.department ? ` · ${pretty(item.department)}` : ''}</option>)}</select><button disabled={!newPartnerId} aria-label="Start conversation"><MessageCircle size={15}/></button></form>}{messages.length ? messages.map((item) => <button key={item.partner?.id} className={conversation?.id === item.partner?.id ? 'active' : ''} onClick={() => item.partner && openThread(item.partner)}><b>{item.partner?.firstName} {item.partner?.lastName}</b><small>{item.lastMessage?.content || 'Open conversation'}</small></button>) : <p className="dash-empty">No conversations yet. Choose a team member above to send your first message.</p>}</nav><div className="dash-thread">{conversation ? <><div className="dash-thread-head"><span><b>{conversation.firstName} {conversation.lastName}</b><small>Messages update automatically</small></span><button className="dash-action secondary" onClick={() => setConversation(null)}>Close</button></div><div className="dash-thread-list" aria-live="polite">{thread.map((message) => <article className={`dash-message ${message.senderId === user.id ? 'mine' : ''}`} key={message.id}><small>{message.sender?.firstName || (message.senderId === user.id ? 'You' : conversation.firstName)} · {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small><p>{message.content}</p></article>)}</div><form className="dash-message-compose" onSubmit={sendMessage}><input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Write a message…" maxLength="10000" required/><button disabled={working === 'message'} aria-label="Send message"><Send size={15}/></button></form></> : <div className="dash-empty dash-thread-placeholder"><MessageCircle size={24}/><b>Your conversations</b><span>Open a conversation to read and reply. New messages appear here automatically.</span></div>}</div></div></section>}
    {admin && tab === 'Referrals' ? <AdminReferralsPages data={data} api={api} refresh={refresh} onError={setError} working={working} setWorking={setWorking}/> : <div className="dash-panels">{visibleKeys.map((key) => {
      const value = data[key];
      if (value?._error) return <section className="dash-panel" key={key}><h2>{titleFor(key)}</h2><div className="dash-empty">{value._error}</div></section>;
      const records = getItems(key);
      if (key === 'referrals') {
        return <AdminReferralWorkspace value={value}/>;
        const referrers = value?.referrers || value?.data?.referrers || [];
        const referralContracts = value?.contracts || value?.data?.contracts || [];
        return <section className="dash-panel" key={key}><div className="dash-panel-heading"><div><span className="about-kicker">PARTNER PROGRAM</span><h2>Referrers and attributed contracts</h2></div><span className="dash-count">{referrers.length}</span></div>{referrers.length ? referrers.map((item) => <article className="dash-record" key={item.id}><span className="dash-record-mark">{item.referralCode || item.code || 'R'}</span><div className="dash-record-main"><div className="dash-record-line"><h3>{item.user?.firstName || item.firstName} {item.user?.lastName || item.lastName}</h3><span className="dash-status">{item.user?.email || item.email}</span></div><p>{item.referralsCount ?? item.referrals?.length ?? 0} referred clients · {item.commissionEarned ?? 0} commission earned</p></div></article>) : <div className="dash-empty">No referrers are registered yet.</div>}{referralContracts.length > 0 && <><h3>Attributed contracts</h3>{referralContracts.map((item) => <article className="dash-record" key={item.id}><span className="dash-record-mark">{item.currency || '$'}</span><div className="dash-record-main"><div className="dash-record-line"><h3>{item.title || item.client?.firstName || 'Contract'}</h3><span className="dash-status">{pretty(item.status || 'PENDING')}</span></div><p>Referrer: {item.referrer?.firstName || item.referrerName || '—'} · {item.client?.email || item.client?.firstName || 'Client'} · {item.amount ?? '—'} {item.currency || ''} · {item.fullyPaidAt ? `Fully paid ${new Date(item.fullyPaidAt).toLocaleDateString()}` : 'Awaiting full payment'}</p></div></article>)}</>}</section>;
      }
      if (key === 'agreementHistory') {
        return <AdminAgreementHistory value={value} api={api} refresh={refresh} onError={setError} working={working} setWorking={setWorking}/>;
        const versions = Array.isArray(value) ? value : [];
        const latestPublished = versions.find((item) => item.status === 'PUBLISHED');
        const draft = versions.find((item) => item.status === 'DRAFT');
        return <section className="dash-panel" key={key}><div className="dash-panel-heading"><div><span className="about-kicker">IMMUTABLE SIGNATURE HISTORY</span><h2>Agreement versions and signed receipts</h2></div><span className="dash-count">{versions.length}</span></div><p>Published versions and their signatures remain available for audit. Publishing a new version requires referrers to sign that version.</p>{!draft && <button className="dash-action" disabled={working === 'agreement-draft'} onClick={async () => { setWorking('agreement-draft'); setError(''); try { const text = latestPublished?.fullText || DEFAULT_REFERRAL_AGREEMENT; const created = await api('/admin/referral-agreements', { method: 'POST', body: JSON.stringify({ text }) }); setAgreementDraftText(created?.fullText || text); await refresh(); } catch (failure) { setError(failure.message); } finally { setWorking(''); } }}>{working === 'agreement-draft' ? 'Creating…' : 'Create next draft version'}</button>}{draft && <form className="dash-ticket-form" onSubmit={async (event) => { event.preventDefault(); setWorking(draft.id); setError(''); try { await api(`/admin/referral-agreements/${draft.id}`, { method: 'PUT', body: JSON.stringify({ text: agreementDraftText || draft.fullText }) }); await api(`/admin/referral-agreements/${draft.id}/publish`, { method: 'POST' }); setAgreementDraftText(''); await refresh(); } catch (failure) { setError(failure.message); } finally { setWorking(''); } }}><label>Draft version {draft.version} terms<textarea required minLength="20" rows="12" value={agreementDraftText || draft.fullText} onChange={(event) => setAgreementDraftText(event.target.value)}/></label><button className="dash-action" disabled={working === draft.id}>{working === draft.id ? 'Publishing…' : 'Save and publish version'}</button></form>}{versions.map((version) => <article className="dash-record" key={version.id}><span className="dash-record-mark">v{version.version}</span><div className="dash-record-main"><div className="dash-record-line"><h3>Version {version.version}</h3><span className="dash-status">{version.status}</span></div><p>SHA-256 {version.textSha256} · Published {version.publishedAt ? new Date(version.publishedAt).toLocaleString() : 'not published'}{version.publishedBy ? ` by ${version.publishedBy.firstName} ${version.publishedBy.lastName}` : ''}</p>{(version.signatures || []).length ? version.signatures.map((signature) => <div className="dash-milestone" key={signature.id}><span><b>{signature.referrer?.firstName} {signature.referrer?.lastName} — {signature.typedLegalName}</b><small>{signature.referrer?.email} · Signed {new Date(signature.signedAt).toLocaleString()} · Receipt SHA-256 {signature.evidenceSha256}</small></span><button className="dash-action secondary" onClick={async () => { try { const token = localStorage.getItem('monata-token'); const base = API.replace(/\/$/, ''); const response = await fetch(`${base}${signature.evidenceUrl.replace(/^\/api/, '')}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }); if (!response.ok) throw new Error('Could not download the agreement receipt. Please sign in again.'); const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `referral-agreement-v${version.version}-${signature.id}-receipt.txt`; anchor.click(); URL.revokeObjectURL(url); } catch (failure) { setError(failure.message); } }}>Download receipt</button></div>) : <p>No signatures recorded for this version.</p>}</div></article>)}</section>;
      }
      if (key === 'siteAnalytics') {
        const outerReport = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const report = outerReport.report || outerReport.analytics || outerReport.data || outerReport;
        const asList = (...candidates) => candidates.find(Array.isArray) || [];
        const pageViews = asList(report.byPage, report.pageViews, report.pages, report.topPages, report.pageViewBreakdown);
        const shares = asList(report.linkShares, report.shares, report.shareEvents);
        const regions = asList(report.byCountry, report.regions, report.countries, report.locations);
        const recent = asList(report.recentEvents, report.recent, report.events, report.activity);
        const summary = report.summary && typeof report.summary === 'object' ? report.summary : report;
        const pageViewCount = pageViews.reduce((sum, item) => sum + Number(item.views ?? item.count ?? item.total ?? 0), 0);
        const shareCount = shares.reduce((sum, item) => sum + Number(item.count ?? item.total ?? 1), 0);
        const metrics = [['Page views', summary.totalPageViews ?? summary.pageViewCount ?? (typeof summary.pageViews === 'number' ? summary.pageViews : undefined) ?? summary.views ?? pageViewCount], ['Link shares', summary.totalShares ?? summary.shareCount ?? (typeof summary.linkShares === 'number' ? summary.linkShares : undefined) ?? (typeof summary.shares === 'number' ? summary.shares : undefined) ?? shareCount], ['Regions', summary.regionCount ?? regions.length]];
        const countOf = (item) => Number(item.views ?? item.count ?? item.visits ?? item.total ?? 0);
        const maxPageViews = Math.max(1, ...pageViews.map(countOf));
        const activity = recent.length ? recent : [...pageViews, ...shares];
        return <section className="dash-site-analytics" key={key}><div className="dash-site-summary-card"><div className="dash-panel-heading"><div><span className="about-kicker">VISITOR INSIGHTS</span><h2>Website activity</h2></div><button className="dash-action secondary" onClick={() => refresh()}><RefreshCw size={13}/> Refresh report</button></div><p>Visits are grouped by page and approximate region. Anonymous visitor identifiers are pseudonymous.</p><div className="dash-stat-grid">{metrics.map(([label,count])=><article className="dash-stat" key={label}><span>{label}</span><b>{Number(count || 0).toLocaleString()}</b></article>)}</div></div><div className="dash-site-content-card"><div className="dash-site-breakdowns"><section className="dash-site-breakdown"><h3>Popular pages</h3>{pageViews.length ? pageViews.map((item,index)=><article className="dash-site-row" key={item.path || item.page || item.value || index}><div className="dash-site-row-label"><b>{item.path || item.page || item.url || item.value || 'Page'}</b><span>{countOf(item).toLocaleString()} views</span></div><div className="dash-site-bar"><i style={{width:`${Math.max(3, countOf(item) / maxPageViews * 100)}%`}}/></div></article>) : <div className="dash-empty">No page breakdown is available yet.</div>}</section><section className="dash-site-breakdown"><h3>Regions</h3>{regions.length ? regions.map((item,index)=><article className="dash-site-region" key={item.region || item.country || item.countryCode || item.value || index}><span>{item.region || item.country || item.countryCode || item.name || item.value || 'Unknown region'}</span><b>{countOf(item).toLocaleString()}</b></article>) : <div className="dash-empty">No regional data is available yet.</div>}</section></div><section className="dash-site-recent"><h3>Recent visits and shares</h3><div className="dash-site-recent-list">{activity.length ? activity.slice(0,20).map((item,index)=>renderRecord('siteAnalytics',item,index)) : <div className="dash-empty">No recent visit or share activity yet.</div>}</div></section></div></section>;
      }
      if (key === 'referralSettings') {
        const settings = value || {};
        return <section className="dash-panel" key={key}><div className="dash-panel-heading"><div><span className="about-kicker">PROGRAM CONTROLS</span><h2>Referral commission</h2></div></div><p>Commission applies to the collected contract value after the customer has signed and paid the full amount. Agreement wording and publication are managed in the version history panel.</p><form className="dash-ticket-form" onSubmit={async (event)=>{event.preventDefault();const formData=new FormData(event.currentTarget);await mutate('referral-settings','/admin/referral-settings',{commissionRate:Number(formData.get('commissionRate')),agreementTerms:settings.agreementTerms || settings.terms || DEFAULT_REFERRAL_AGREEMENT},'PUT');}}><label>Commission rate (%)<input name="commissionRate" type="number" min="0" max="100" step="0.1" defaultValue={settings.commissionRate ?? settings.rate ?? 10}/></label><button className="dash-action">Save commission rate</button></form></section>;
      }
      if (key === 'contracts' && admin) {
        const knownContractClients = list('users').filter((item) => item.role === 'CLIENT');
        return <section className="dash-panel" key={key}><div className="dash-panel-heading"><div><span className="about-kicker">AGREEMENTS</span><h2>Customer contracts</h2></div><button className="dash-action" onClick={() => setContractFormOpen((open) => !open)}>{contractFormOpen ? 'Cancel' : 'Draft contract'}</button></div>{contractFormOpen && <form className="dash-ticket-form" onSubmit={async (event) => { event.preventDefault(); const formData = new FormData(event.currentTarget); await mutate('new-contract','/admin/referral-contracts',{clientId:formData.get('clientId'),title:formData.get('title'),termsText:formData.get('termsText'),amount:Number(formData.get('amount')),currency:formData.get('currency')},'POST'); setContractFormOpen(false); }}><label>Customer<select name="clientId" required><option value="">Choose customer</option>{knownContractClients.map((item)=><option key={item.id} value={item.id}>{item.firstName} {item.lastName} · {item.email}</option>)}</select></label><label>Contract title<input name="title" required maxLength="200"/></label><label>Contract terms and deliverables<textarea name="termsText" required minLength="20" maxLength="20000" rows="5"/></label><label>Full contract amount<input name="amount" type="number" min="0.01" step="0.01" required/></label><label>Currency<input name="currency" defaultValue="USD" maxLength="3" required/></label><button className="dash-action" disabled={working === 'new-contract'}>{working === 'new-contract' ? 'Creating…' : 'Create and send for signature'}</button></form>}{records.length ? records.map((item,index)=><article className="dash-record" key={item.id}><span className="dash-record-mark">{String(index+1).padStart(2,'0')}</span><div className="dash-record-main"><div className="dash-record-line"><h3>{item.title || 'Customer contract'}</h3><span className="dash-status">{pretty(item.commissionStatus || (item.clientSignedAt ? 'SIGNED' : 'DRAFT'))}</span></div><p>{item.client ? `${item.client.firstName} ${item.client.lastName}` : 'Customer'} · {item.currency || 'USD'} {item.amount ?? '—'}{item.signature ? ` · Signed by ${item.signature}` : ''}{item.signedAt ? ` · ${new Date(item.signedAt).toLocaleString()}` : ' · Awaiting signature'}{item.fullyPaidAt ? ` · Fully paid ${new Date(item.fullyPaidAt).toLocaleDateString()}` : ''}</p>{item.termsText && <p>{item.termsText}</p>}{action('contracts',item)}</div></article>) : <div className="dash-empty">Customer contracts will appear here.</div>}</section>;
      }
      if (key === 'agentReports') {
        const visibleReports = agentReportFilter === 'ALL' ? records : records.filter((item) => item.status === agentReportFilter);
        return <section className="dash-panel dash-agent-reports" key={key}>
          <div className="dash-panel-heading"><div><span className="about-kicker">CHATBOT KNOWLEDGE</span><h2>Monata Agent report</h2></div><label className="dash-report-filter">Show<select value={agentReportFilter} onChange={(event) => setAgentReportFilter(event.target.value)}><option value="OPEN">Needs an answer</option><option value="ANSWERED">Answered</option><option value="DISMISSED">Dismissed</option><option value="ALL">All questions</option></select></label></div>
          <p>Questions the agent could not answer are saved here without a user account or chat identity. Add a reviewed answer and optional alternate phrasings; the agent can then reuse that answer in future conversations.</p>
          {visibleReports.length ? visibleReports.map((report) => <article className="dash-record dash-agent-report" key={report.id}><span className="dash-record-mark">?</span><div className="dash-record-main"><div className="dash-record-line"><h3>{report.question}</h3><span className={`dash-status status-${report.status.toLowerCase()}`}>{pretty(report.status)}</span></div><p>Asked {report.askedCount} {report.askedCount === 1 ? 'time' : 'times'} · First {new Date(report.firstAskedAt).toLocaleDateString()} · Last {new Date(report.lastAskedAt).toLocaleString()}{report.answeredBy ? ` · Answered by ${report.answeredBy.firstName} ${report.answeredBy.lastName}` : ''}</p>{report.status !== 'DISMISSED' && <form className="dash-ticket-form" onSubmit={(event) => saveAgentAnswer(event, report)}><label>Agent answer<textarea required minLength="2" maxLength="10000" rows="4" value={agentAnswers[report.id] ?? report.answer ?? ''} onChange={(event) => setAgentAnswers((items) => ({ ...items, [report.id]: event.target.value }))} placeholder="Write a clear, accurate answer the agent can reuse"/></label><label>Alternate question phrasings (comma separated)<input maxLength="2000" value={agentAliases[report.id] ?? (report.aliases || []).join(', ')} onChange={(event) => setAgentAliases((items) => ({ ...items, [report.id]: event.target.value }))} placeholder="Different ways someone may ask the same question"/></label><div className="dash-inline-actions"><button className="dash-action" disabled={working === report.id}>{working === report.id ? 'Saving…' : report.status === 'ANSWERED' ? 'Update answer' : 'Save answer and teach agent'}</button>{report.status === 'OPEN' && <button type="button" className="dash-action secondary" disabled={working === report.id} onClick={() => mutate(report.id, `/admin/agent-reports/${report.id}`, { status: 'DISMISSED' }, 'PUT')}>Dismiss</button>}</div></form>}{report.status === 'DISMISSED' && <p>This question was dismissed and will not be used as an answer.</p>}</div></article>) : <div className="dash-empty">No {agentReportFilter === 'ALL' ? '' : `${agentReportFilter.toLowerCase()} `}questions yet. When Monata Agent cannot answer, it will add the question here.</div>}
        </section>;
      }
      if (key === 'services') return <section className="dash-panel" key={key}><div className="dash-panel-heading"><div><span className="about-kicker">CATALOG</span><h2>Services and packages</h2></div><button className="dash-action" disabled={working === 'catalog'} onClick={addService}>Add service</button></div>{records.length ? records.map((service) => <article className="dash-record" key={service.id}><span className="dash-record-mark">S</span><div className="dash-record-main"><div className="dash-record-line"><h3>{service.name}</h3><span className="dash-status">{pretty(service.department)}</span></div><p>{service.shortDescription}</p><div className="dash-inline-actions"><button className="dash-action secondary" onClick={() => managePackages(service)}>{selectedService?.id === service.id ? 'Hide packages' : 'Manage packages'}</button><button className="dash-action secondary" onClick={() => mutate(service.id, `/services/${service.id}`, undefined, 'DELETE')}>Deactivate</button><button className="dash-action" disabled={working === 'catalog'} onClick={() => addPackage(service)}>Add package</button></div>{selectedService?.id === service.id && <div className="dash-milestones">{servicePackages.length ? servicePackages.map((item) => <div className="dash-milestone" key={item.id}><span><b>{item.name}</b><small>{item.summary} · {item.pricingModel === 'CUSTOM' ? 'Custom quote' : `${item.currency} ${item.price}`}</small></span><span><button className="dash-action secondary" onClick={() => editPackageSummary(item)}>Edit summary</button><button className="dash-action secondary" onClick={async () => { await mutate(item.id, `/services/packages/${item.id}`, undefined, 'DELETE'); setServicePackages(await api(`/services/${service.id}/packages`).catch(() => [])); }}>Deactivate</button></span></div>) : <p className="dash-empty">No active packages yet.</p>}</div>}</div></article>) : <div className="dash-empty">No active services.</div>}</section>;
      const canCreate = (admin && ['Projects', 'Tasks', 'Clients & team', 'Quotes & invoices'].includes(tab)) || (agent && ['My work', 'Quotes'].includes(tab)) || (admin && tab === 'Invoices');
      return <section className="dash-panel" key={key}><div className="dash-panel-heading"><div><span className="about-kicker">{key.replaceAll('_', ' ').toUpperCase()}</span><h2>{titleFor(key)}</h2></div><span className="dash-head-actions">{key === 'tickets' && user.role === 'CLIENT' && <button className="dash-action secondary" onClick={() => setShowTicketForm((value) => !value)}>{showTicketForm ? 'Cancel' : 'New ticket'}</button>}{key === 'notifications' && notifications.unreadCount > 0 && <button className="dash-action secondary" onClick={() => mutate('all', '/notifications/read-all', undefined, 'PUT')}>Mark all read</button>}<span className="dash-count">{key === 'notifications' ? notifications.unreadCount || 0 : records.length}</span></span></div>{toolbar && canCreate && ['users', 'projects', 'tasks', 'quotes'].includes(key) && <button className="dash-action" onClick={() => setFormKind(toolbar[0])}>{toolbar[1]}</button>}{admin && key === 'invoices' && <button className="dash-action" onClick={() => setFormKind('invoice')}>Create invoice</button>}{key === 'tickets' && showTicketForm && user.role === 'CLIENT' && <form className="dash-ticket-form" onSubmit={createTicket}><label>Subject<input required maxLength="200" value={ticketForm.title} onChange={(event) => setTicketForm({ ...ticketForm, title: event.target.value })}/></label><label>Category<input required maxLength="100" value={ticketForm.category} onChange={(event) => setTicketForm({ ...ticketForm, category: event.target.value })}/></label><label>Details<textarea required minLength="10" maxLength="10000" value={ticketForm.description} onChange={(event) => setTicketForm({ ...ticketForm, description: event.target.value })} rows="3"/></label><button className="dash-action" disabled={working === 'new-ticket'}>Submit support ticket</button></form>}{records.length ? records.map((item, index) => renderRecord(key, item, index)) : <div className="dash-empty">Nothing here yet. Updates will appear as your work gets underway.</div>}</section>;
    })}</div>}
  </div></div>
  {formKind && <div className="modal-backdrop" onClick={() => setFormKind('')}><div className="modal dash-create-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setFormKind('')} aria-label="Close"><X size={19}/></button><div className="modal-eyebrow">MONATA WORKSPACE</div><h2>{formTitle}</h2><form onSubmit={submitCreate}>
    {formKind === 'user' && <><label>First name<input name="firstName" required/></label><label>Last name<input name="lastName" required/></label><label>Email<input name="email" type="email" required/></label><label>Temporary password<input name="password" type="password" minLength="12" required/></label><label>Role<select name="role"><option value="CLIENT">Client</option><option value="AGENT">Agent</option><option value="REFERRER">Referrer</option></select></label><label>Department<select name="department">{DEPARTMENTS.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></label><label>Phone (optional)<input name="phone"/></label></>}
    {formKind === 'project' && <><label>Project title<input name="title" required maxLength="200"/></label><label>Description<textarea name="description" maxLength="10000"/></label><label>Client<select name="clientId" required><option value="">Choose client</option>{(admin ? clients : knownClients).map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} · {item.email || ''}</option>)}</select></label>{admin && <label>Coordinator<select name="coordinatorId"><option value="">Unassigned</option>{agents.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}</select></label>}<label>Deadline<input name="deadline" type="datetime-local"/></label><label>Budget (optional)<input name="budget" type="number" min="1" step="0.01"/></label></>}
    {formKind === 'task' && <><label>Task title<input name="title" required maxLength="200"/></label><label>Description<textarea name="description" required maxLength="10000"/></label><label>Project (optional)<select name="projectId"><option value="">No project</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Client<select name="clientId" required><option value="">Choose client</option>{(admin ? clients : knownClients).map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}</select></label>{admin && <label>Assignee<select name="assigneeId"><option value="">Unassigned</option>{agents.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}</select></label>}<label>Priority<select name="priority"><option>MEDIUM</option><option>LOW</option><option>HIGH</option><option>URGENT</option></select></label><label>Deadline<input name="deadline" type="datetime-local"/></label></>}
    {formKind === 'quote' && <><label>Service request<select name="serviceRequestId" required><option value="">Choose request</option>{request.map((item) => <option key={item.id} value={item.id}>{item.service?.name || item.title || 'Request'} · {item.client?.firstName} {item.client?.lastName}</option>)}</select></label><label>Quote title<input name="title" required maxLength="200"/></label><label>Scope<textarea name="scope" minLength="10" required maxLength="10000"/></label><label>Deliverables (one per line)<textarea name="deliverables"/></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required/></label><label>Currency<input name="currency" defaultValue="USD" maxLength="3" required/></label><label>Valid until<input name="validUntil" type="datetime-local" required/></label><label>Terms (optional)<textarea name="terms"/></label></>}
    {formKind === 'invoice' && <><label>Client<select name="clientId" required><option value="">Choose client</option>{clients.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} · {item.email}</option>)}</select></label><label>Description<input name="description" required maxLength="1000"/></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required/></label><label>Currency<input name="currency" defaultValue="USD" maxLength="3" required/></label><label>Due date<input name="dueDate" type="datetime-local"/></label></>}
    <button className="button button-dark modal-submit" disabled={working === 'create'}>{working === 'create' ? 'Saving…' : 'Save'} <Check size={15}/></button>
  </form></div></div>}
  </section>;
}
