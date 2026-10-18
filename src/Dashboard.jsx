import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, LogOut, MessageCircle, Paperclip, RefreshCw, Send, X } from 'lucide-react';
const API = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://monata-global-services-backend.onrender.com/api')).replace(/\/$/, '');

const DEPARTMENTS = ['VIRTUAL_ASSISTANCE', 'DEVELOPMENT', 'SOCIAL_MEDIA', 'DIGITAL_MARKETING', 'CUSTOMER_SUPPORT'];
const pretty = (value = '') => String(value).replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const isoDate = (value) => value ? new Date(value).toISOString() : undefined;

export default function Dashboard({ user, api, logout, onRequest }) {
  const admin = user.role === 'ADMIN';
  const agent = user.role === 'AGENT';
  const tabs = admin
    ? ['Overview', 'Requests', 'Projects', 'Tasks', 'Support', 'Messages', 'Files', 'Clients & team', 'Referrals', 'Contracts', 'Site analytics', 'Trash', 'Catalog', 'Quotes & invoices', 'Monata Agent report', 'Reports', 'Activity', 'Notifications']
    : agent
      ? ['Overview', 'My work', 'Requests', 'Support', 'Files', 'Messages', 'Quotes', 'Availability', 'Notifications']
      : ['Overview', 'Projects', 'Tasks', 'Requests', 'Support', 'Files', 'Messages', 'Quotes', 'Invoices', 'Notifications'];
  const specs = admin
    ? { stats: '/admin/stats', services: '/services', files: '/files', messages: '/messages', agentReports: '/admin/agent-reports', requests: '/service-requests', projects: '/projects', tasks: '/tasks', tickets: '/tickets', users: '/users?pageSize=100', trash: '/users/trash', agents: '/assistants?pageSize=100', quotes: '/quotes', invoices: '/invoices', reports: '/admin/reports/performance', audit: '/admin/audit-logs?pageSize=100', notifications: '/notifications', referrals: '/admin/referrals', contracts: '/admin/contracts', siteAnalytics: '/admin/site-analytics', referralSettings: '/admin/referral-settings' }
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
    ? { Requests: ['requests'], Projects: ['projects'], Tasks: ['tasks'], Support: ['tickets'], Messages: ['messages'], 'Clients & team': ['users', 'agents'], Referrals: ['referrals', 'referralSettings'], Contracts: ['contracts'], 'Site analytics': ['siteAnalytics'], Trash: ['trash'], Catalog: ['services'], 'Quotes & invoices': ['quotes', 'invoices'], 'Monata Agent report': ['agentReports'], Reports: ['reports'], Activity: ['audit'] }
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
    return list(key);
  };
  const action = (key, item) => {
    if (key === 'contracts' && user.role === 'CLIENT' && !item.signedAt) return <button className="dash-action" onClick={async () => { const signature = window.prompt('Type your full legal name to sign this contract.'); if (signature?.trim()) await mutate(item.id, `/contracts/${item.id}/sign`, { signature: signature.trim() }, 'POST'); }}>Review and sign contract</button>;
    if (key === 'contracts' && admin && !item.fullyPaidAt && item.status !== 'PAID') return <button className="dash-action" disabled={working === item.id} onClick={() => { if (window.confirm('Confirm that the full contract amount has been collected? This records the referral commission.')) mutate(item.id, `/admin/contracts/${item.id}/payment`, { fullyPaid: true }, 'POST'); }}>Confirm full payment</button>;
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
    const title = item.title || item.service?.name || item.name || item.number || item.originalName || (key === 'reports' && item.agent ? `${item.agent.firstName} ${item.agent.lastName}` : '') || item.action || item.type || item.page || item.path || item.id || 'Record';
    const description = item.description || item.notes || item.content || item.scope || item.summary || item.email || item.service?.name || (item.client ? `${item.client.firstName} ${item.client.lastName}` : '') || (item.referrer ? `${item.referrer.firstName} ${item.referrer.lastName}` : '') || (item.region || item.country || item.source || item.channel ? [item.region,item.country,item.source,item.channel].filter(Boolean).join(' · ') : '') || (item.agent ? item.agent.email : '') || item.project?.title || (key === 'audit' ? `${item.entityType || 'Record'} ${item.entityId || ''} · ${item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : ''}` : '') || item.department?.replaceAll('_', ' ') || '';
    const status = item.status || item.availability || item.role || item.priority;
    return <article className="dash-record" key={item.id || `${key}-${index}`}><span className="dash-record-mark">{String(index + 1).padStart(2, '0')}</span><div className="dash-record-main"><div className="dash-record-line"><h3>{title}</h3>{status && <span className={`dash-status status-${String(status).toLowerCase().replaceAll('_', '-')}`}>{pretty(status)}</span>}</div><p>{description || (item.agent ? `${item.agent.firstName} ${item.agent.lastName}` : 'No additional details provided.')}</p>{key === 'contracts' && <><small className="dash-meta">Contract amount: {item.currency || 'USD'} {item.amount ?? '—'} · {item.signedAt ? `Signed ${new Date(item.signedAt).toLocaleString()}` : 'Awaiting your signature'}{item.fullyPaidAt ? ` · Fully paid ${new Date(item.fullyPaidAt).toLocaleDateString()}` : ''}</small>{item.terms && <div className="agreement-copy">{item.terms}</div>}</>}{item.createdAt || item.visitedAt || item.sharedAt ? <small className="dash-meta">{new Date(item.createdAt || item.visitedAt || item.sharedAt).toLocaleString()}</small> : null}{key === 'reports' && item.taskStats ? <small className="dash-meta">{item.taskStats.completed} completed · {item.taskStats.inProgress} in progress · {item.taskStats.todo} to do</small> : null}{item.milestones?.length ? <div className="dash-milestones"><small className="dash-meta">{item.progress || 0}% complete · {item.milestones.length} milestones</small>{item.milestones.map((milestone) => <div className="dash-milestone" key={milestone.id}><span><b>{milestone.title}</b><small>{pretty(milestone.status)}{milestone.dueDate ? ` · Due ${new Date(milestone.dueDate).toLocaleDateString()}` : ''}</small>{milestone.description && <small>{milestone.description}</small>}</span>{user.role === 'CLIENT' && milestone.status === 'CLIENT_REVIEW' && <span><button className="dash-action" onClick={() => mutate(milestone.id, `/projects/milestones/${milestone.id}/review`, { status: 'APPROVED' })}>Approve</button><button className="dash-action secondary" onClick={() => { const reviewNotes = window.prompt('What changes are needed?'); if (reviewNotes !== null) mutate(milestone.id, `/projects/milestones/${milestone.id}/review`, { status: 'CHANGE_REQUESTED', reviewNotes }); }}>Request changes</button></span>}</div>)}</div> : null}{action(key, item)}</div></article>;
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
    <div className="dash-panels">{visibleKeys.map((key) => {
      const value = data[key];
      if (value?._error) return <section className="dash-panel" key={key}><h2>{titleFor(key)}</h2><div className="dash-empty">{value._error}</div></section>;
      const records = getItems(key);
      if (key === 'siteAnalytics') {
        const report = value || {};
        const pageViews = report.pageViews || report.pages || [];
        const shares = report.linkShares || report.shares || [];
        const regions = report.regions || report.countries || [];
        const recent = report.recentEvents || report.recent || [];
        const metrics = [['Page views', report.totalPageViews ?? report.pageViewCount ?? pageViews.reduce((sum, item) => sum + (item.views || item.count || 0), 0)], ['Link shares', report.totalShares ?? report.shareCount ?? shares.reduce((sum, item) => sum + (item.count || 0), 0)], ['Regions', report.regionCount ?? regions.length]];
        return <section className="dash-panel" key={key}><div className="dash-panel-heading"><div><span className="about-kicker">VISITOR INSIGHTS</span><h2>Website activity</h2></div><button className="dash-action secondary" onClick={() => refresh()}>Refresh report</button></div><p>Visits are grouped by page and approximate region. Anonymous visitor identifiers are pseudonymous.</p><div className="dash-stat-grid">{metrics.map(([label,count])=><article className="dash-stat" key={label}><span>{label}</span><b>{count}</b></article>)}</div><div className="referrer-grid"><div><h3>Popular pages</h3>{pageViews.length ? pageViews.map((item,index)=><article className="dash-record" key={item.path || item.page || index}><span className="dash-record-mark">{item.views || item.count || 0}</span><div className="dash-record-main"><h3>{item.path || item.page || item.url}</h3><p>{item.region || item.country || ''}</p></div></article>) : <div className="dash-empty">No page breakdown is available yet.</div>}</div><div><h3>Regions</h3>{regions.length ? regions.map((item,index)=><article className="dash-record" key={item.region || item.country || index}><span className="dash-record-mark">{item.count || item.visits || 0}</span><div className="dash-record-main"><h3>{item.region || item.country || item.name}</h3></div></article>) : <div className="dash-empty">No regional data is available yet.</div>}</div></div><h3>Recent visits and shares</h3>{recent.length ? recent.slice(0,20).map((item,index)=>renderRecord('siteAnalytics',item,index)) : [...pageViews,...shares].slice(0,20).map((item,index)=>renderRecord('siteAnalytics',item,index))}</section>;
      }
      if (key === 'referralSettings') {
        const settings = value || {};
        return <section className="dash-panel" key={key}><div className="dash-panel-heading"><div><span className="about-kicker">PROGRAM CONTROLS</span><h2>Referral terms and access</h2></div></div><p>Commission applies to the collected contract value after the customer has signed and paid the full amount.</p><form className="dash-ticket-form" onSubmit={async (event)=>{event.preventDefault();const formData=new FormData(event.currentTarget);await mutate('referral-settings','/admin/referral-settings',{commissionRate:Number(formData.get('commissionRate')),agreementTerms:formData.get('agreementTerms')},'PUT');}}><label>Commission rate (%)<input name="commissionRate" type="number" min="0" max="100" step="0.1" defaultValue={settings.commissionRate ?? settings.rate ?? 10}/></label><label>Referrer agreement terms<textarea name="agreementTerms" required minLength="20" rows="6" defaultValue={settings.agreementTerms || settings.terms || ''} placeholder="Enter the versioned agreement terms referrers must accept."/></label><button className="dash-action">Save referral terms</button></form></section>;
      }
      if (key === 'contracts' && admin) {
        const knownContractClients = list('users').filter((item) => item.role === 'CLIENT');
        return <section className="dash-panel" key={key}><div className="dash-panel-heading"><div><span className="about-kicker">AGREEMENTS</span><h2>Customer contracts</h2></div><button className="dash-action" onClick={() => setContractFormOpen((open) => !open)}>{contractFormOpen ? 'Cancel' : 'Draft contract'}</button></div>{contractFormOpen && <form className="dash-ticket-form" onSubmit={async (event) => { event.preventDefault(); const formData = new FormData(event.currentTarget); await mutate('new-contract','/admin/contracts',{clientId:formData.get('clientId'),title:formData.get('title'),scope:formData.get('scope'),amount:Number(formData.get('amount')),currency:formData.get('currency'),terms:formData.get('terms')},'POST'); setContractFormOpen(false); }}><label>Customer<select name="clientId" required><option value="">Choose customer</option>{knownContractClients.map((item)=><option key={item.id} value={item.id}>{item.firstName} {item.lastName} · {item.email}</option>)}</select></label><label>Contract title<input name="title" required maxLength="200"/></label><label>Scope and deliverables<textarea name="scope" required minLength="10" maxLength="10000" rows="4"/></label><label>Full contract amount<input name="amount" type="number" min="0.01" step="0.01" required/></label><label>Currency<input name="currency" defaultValue="USD" maxLength="3" required/></label><label>Terms<textarea name="terms" rows="4"/></label><button className="dash-action" disabled={working === 'new-contract'}>{working === 'new-contract' ? 'Creating…' : 'Create and send for signature'}</button></form>}{records.length ? records.map((item,index)=><article className="dash-record" key={item.id}><span className="dash-record-mark">{String(index+1).padStart(2,'0')}</span><div className="dash-record-main"><div className="dash-record-line"><h3>{item.title || 'Customer contract'}</h3><span className="dash-status">{pretty(item.status || 'DRAFT')}</span></div><p>{item.client ? `${item.client.firstName} ${item.client.lastName}` : 'Customer'} · {item.currency || 'USD'} {item.amount ?? '—'}{item.signature ? ` · Signed by ${item.signature}` : ''}{item.signedAt ? ` · ${new Date(item.signedAt).toLocaleString()}` : ' · Awaiting signature'}{item.fullyPaidAt ? ` · Fully paid ${new Date(item.fullyPaidAt).toLocaleDateString()}` : ''}</p>{item.scope && <p>{item.scope}</p>}{action('contracts',item)}</div></article>) : <div className="dash-empty">Customer contracts will appear here.</div>}</section>;
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
    })}</div>
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
