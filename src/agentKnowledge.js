const links = {
  services: { label: 'Explore services', href: '#services' },
  process: { label: 'See how it works', href: '#approach' },
  start: { label: 'Start a conversation', action: 'request' },
  login: { label: 'Open client sign in', action: 'login' },
  contact: { label: 'Email the Monata team', href: 'mailto:hello@monataglobal.com' },
};

const departments = {
  virtual: {
    title: 'Virtual assistance', href: '#services',
    keywords: ['virtual assistant','virtual assistance','admin','calendar','inbox','executive assistant','travel research','data entry','ecommerce','e-commerce','research','operations'],
    text: 'Virtual Assistance is for founders, professionals and small teams. Example work includes Admin Essentials (calendar, inbox triage, documents and routine follow-ups), Executive Operations (travel research, meeting prep and task coordination), E-commerce Operations (product listings, order follow-up and inventory updates), and Research and Records (online research, contact lists, spreadsheet cleanup and document organization). The team agrees hours, tools and approval limits with you. Purchases and sensitive account changes remain yours to approve.'
  },
  development: {
    title: 'Digital development', href: '#services',
    keywords: ['development','developer','website','web site','app','application','software','online store','shop','e-commerce website','ecommerce website','e-commerce site','ecommerce site','ecommerce store','online shop','store website','integration','automation','maintenance','bug','mvp'],
    text: 'Digital Development can scope a Website Launch, Online Store, Web Application or MVP, Integrations and Automation, or ongoing Maintenance and Improvement. Work may include discovery, responsive design and build, agreed integrations, QA, release and technical handover. Each build needs a written scope that makes deliverables, code and domain ownership, acceptance criteria, change requests and post-launch support clear.'
  },
  social: {
    title: 'Social media', href: '#services',
    keywords: ['social media','instagram','tiktok','facebook','linkedin','content','posts','community management','moderation','social','graphic design','brand voice','content calendar'],
    text: 'Social Media offers can include Channel Foundation (profile audit, setup, voice guide and calendar), a Content Engine (an agreed monthly mix of copy, graphics, short video and scheduled posts), Community Management (monitoring, approved replies, moderation and escalation), and Campaign Content. The scope sets channels, formats, volume, revisions, approvals and moderation hours. Paid campaign strategy belongs to Digital Marketing.'
  },
  marketing: {
    title: 'Digital marketing', href: '#services',
    keywords: ['digital marketing','marketing','seo','search engine','ads','advertising','paid campaign','email campaign','email marketing','lead generation','get more leads','attract customers','grow sales','analytics','conversion'],
    text: 'Digital Marketing can scope an SEO Foundation, Paid Campaign Management, Email Lifecycle work, Lead Generation, or Measurement and Conversion Improvement. The team agrees goals and measurement before launch. Client advertising spend is separate from Monata fees and stays in the client’s ad account. Search rankings, sales and returns are not guaranteed.'
  },
  support: {
    title: 'Customer support', href: '#services',
    keywords: ['customer support','customer service','customer care','call center','call centre','helpdesk','help desk','live chat','voice support','email support','technical support','cx','retention','onboarding','back office'],
    text: 'Customer Support offers can include Support Setup (channels, helpdesk queues, scripts and escalation paths), Omnichannel Care (agreed voice, email, chat or messaging queues), Sales and Customer Lifecycle (inbound enquiries, onboarding, renewals and retention), Technical Triage, Back-office Processing, and CX Quality and Insights. Coverage hours, channels, languages and response targets are agreed only after capacity is confirmed. There is no blanket 24/7 promise.'
  }
};

const normalized = (value) => value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
const includesAny = (question, terms) => terms.some((term) => ` ${question} `.includes(` ${normalized(term)} `));

export function getAgentReply(input) {
  const q = normalized(input);
  if (!q) return { text: 'I didn’t catch that. Ask me about our services, getting started or finding something on the site.' };
  if (/^(hi|hello|hey|good morning|good afternoon|habari)(\b|$)/.test(q)) return {
    text: 'Hello! I’m the Monata Agent. I can show you what we do, help you find a section or explain how to get started. What are you looking for?',
    suggestions: ['What services do you offer?', 'How do I get started?', 'Where can I see my projects?']
  };
  if (/^(thanks?|thank you( so much)?|thanks a lot|thanks a bunch|thx|many thanks|much appreciated|i appreciate (it|you)|i am grateful|that helps|very helpful|cheers)$/.test(q)) return {
    text: 'You’re very welcome! I’m glad I could help. Is there anything else you’d like to know about Monata or one of our services?',
    suggestions: ['Compare Monata’s services', 'How do I get started?', 'Contact the team']
  };
  if (/^(no|nope|no thanks|no thank you|nothing else|nothing more|that s all|that is all|i m good|i m all set|all set|all good|no more questions|not right now|not today|not at the moment|maybe later|i don t need anything else|unless you tell me otherwise|unless you tell me something else)$/.test(q) || q.startsWith('unless you tell')) return {
    text: 'Understood. I won’t keep asking. If you need help later, just send me a message or choose a Monata service.',
    link: links.services
  };
  const comparisonQuestion = includesAny(q, ['special about','different from','different to','stand out','why choose','why should i choose','what makes','unique','better than','other companies','other company','compared with','compared to','compare']) && !includesAny(q, ['price','pricing','cost','how much']);
  if (comparisonQuestion) {
    const service = Object.values(departments).find((item) => includesAny(q, item.keywords));
    const distinctions = {
      'Virtual assistance': 'For Virtual Assistance, Monata can bring admin, executive operations, e-commerce support and research together, while agreeing tools, hours and approval limits with you. Purchases and sensitive account changes stay under your approval.',
      'Digital development': 'For Digital Development, Monata scopes the build around your workflow and puts deliverables, ownership, acceptance criteria, change requests and handover into the plan, so you know what is being delivered and who owns it.',
      'Social media': 'For Social Media, Monata can connect channel strategy, a practical content calendar, creation and community care. The scope spells out channels, formats, volume, approvals and moderation hours; paid campaign strategy is handled separately by Digital Marketing.',
      'Digital marketing': 'For Digital Marketing, Monata agrees goals and measurement before launch, keeps ad spend in your own account, and reports against the agreed work. That means clear accountability without pretending to guarantee rankings or sales.',
      'Customer support': 'For Customer Support, Monata can help set up support workflows and cover agreed channels, from customer enquiries and technical triage to back-office work and CX insights. Hours, languages and response targets are confirmed against team capacity.'
    };
    if (service) return { text: `A fair question. I can’t claim that no other company offers similar services. ${distinctions[service.title]} The right comparison is the written scope, team fit, communication, ownership and price.`, link: { label: `Explore ${service.title}`, href: service.href }, secondary: links.start };
    return { text: 'A fair question. I can’t verify that Monata is better than every other provider or claim that our services are unique. What Monata commits to is a clear written scope, agreed deliverables and timelines, a named coordinator, and approval boundaries that keep you in control. Our Nairobi-based team brings Virtual Assistance, Digital Development, Social Media, Digital Marketing and Customer Support together, so related work can be coordinated. Compare providers on the people assigned, exact deliverables, communication, ownership, capacity and total cost.', link: links.services, secondary: links.start };
  }
  if (includesAny(q, ['price','pricing','cost','how much','rate','fee','budget','package'])) return {
    text: 'Pricing depends on the service, workload, channels, timeline and deliverables. We don’t publish one price for every project. After learning what you need, the team provides a written quote that explains scope, price basis, timeline and what is included. There’s no fixed price promise in this chat.',
    link: links.start
  };
  if (includesAny(q, ['opening hours','business hours','working hours','when are you open','office hours','time zone','timezone','available on weekends','weekend availability'])) return {
    text: 'Monata is based in Nairobi, Kenya. Service hours and time-zone coverage depend on the team and the written scope for your work. Tell us which service you need and when you need coverage, and we will confirm availability before work begins.', link: links.start
  };
  if (includesAny(q, ['where are you based','where is monata','location','address','in kenya','in nairobi','country','work remotely','work worldwide','international clients'])) return {
    text: 'Monata Global Services is based in Nairobi, Kenya and works with clients in other locations. The team confirms time zones, working hours and any location-specific requirements during the first conversation.', link: links.contact
  };
  if (includesAny(q, ['how long','timeline','how soon','turnaround','delivery date','deadline','start date','when can you start'])) return {
    text: 'Timing depends on the service, scope, team capacity and how quickly required information and approvals are available. Monata confirms milestones and target dates in the written quote or project plan before work starts.', link: links.start
  };
  if (includesAny(q, ['language','languages','speak french','speak english','swahili'])) return {
    text: 'Language coverage depends on the assigned team and service. Tell us the languages your customers need, and Monata will confirm available coverage before including it in your scope.', link: links.start
  };
  if (includesAny(q, ['privacy','confidential','confidentiality','data protection','personal data','security','secure','passwords','access to my account'])) return {
    text: 'Monata agrees the tools, access and approval limits needed for each engagement. Share only the access required for the work, keep sensitive credentials in approved secure tools, and ask the team about confidentiality or data-handling requirements before sharing personal or customer information.', link: links.contact
  };
  if (includesAny(q, ['payment method','pay online','credit card','card payment','bank transfer','refund','deposit','payment terms'])) return {
    text: 'Online payment collection is not configured in this website. Payment methods, any deposit and payment dates should be confirmed directly with Monata and written into your quote or invoice terms.', link: links.contact
  };
  if (includesAny(q, ['revision','revisions','change request','scope change','extra work','add features','ownership','source code','who owns','website hosting','domain'])) return {
    text: 'Each engagement should state deliverables, review rounds, acceptance criteria, change requests and ownership or handover details. For digital work, make sure source-code, domain, hosting and post-launch support arrangements are written into the scope before approval.', link: links.start
  };
  if (includesAny(q, ['quote','quotation','proposal','estimate','service request'])) return {
    text: 'Start by telling Monata what you want to achieve, your preferred timing and any requirements or constraints. The team can review the request and prepare a written scope, deliverables, timeline and quote. In the client workspace, sent quotes can be reviewed and accepted or declined.', link: links.start
  };
  if (includesAny(q, ['dashboard','client portal','workspace','track my project','project progress','task','my tasks','file','upload','message','conversation','notification','ticket','call','my invoices','my messages','support ticket'])) return {
    text: 'Sign in to your Monata workspace. Depending on your account role, it can show projects, tasks, service requests, support tickets, messages, quotes, invoices, notifications and files connected to your work. If you cannot see an item, ask your coordinator to check that it is linked to your account.', link: links.login, suggestions: ['How do I get started?', 'How do I contact my team?']
  };
  if (includesAny(q, ['contact','email address','phone number','talk to a person','human','speak to someone','reach the team'])) return {
    text: 'You can reach the Monata team at hello@monataglobal.com, or start a service request here and share what you need. A team member can confirm details this local assistant does not know.', link: links.contact, secondary: links.start
  };
  if (includesAny(q, ['how are you','what is your name','your name','are you a bot','are you human','who made you'])) return {
    text: 'I am Monata Agent, the website’s built-in guide. I use Monata’s local service and platform information, so I can help you find the right next step. I am not a human and I do not use an external AI service.', suggestions: ['What services do you offer?', 'How do I get started?']
  };
  if (includesAny(q, ['what do you do','what you do','what does monata do','what does your company do','what does this company do','what can monata do','what can your company do','what kind of work','what kind of services','what services do you','tell me what you do','tell me about your services','explain your services','what do you specialize in','what do you offer','what services do you offer','what are your services','what is your company'])) return {
    text: 'Monata helps businesses get important work done through five services:\n\n• Virtual Assistance: day-to-day admin, calendar and inbox support, research, e-commerce operations and follow-ups.\n• Digital Development: websites, online stores, apps, integrations, automation and ongoing maintenance.\n• Social Media: channel planning, content calendars, post creation and community management.\n• Digital Marketing: SEO, paid campaigns, email, lead generation and performance measurement.\n• Customer Support: helpdesk setup, customer enquiries, technical triage, back-office work and service quality.\n\nWe start by understanding what you need, then agree the work, deliverables, timeline and price with you. A coordinator helps keep the work clear and connected. Which area are you interested in?',
    link: links.services, secondary: links.start, suggestions: ['Virtual assistance', 'Build a website or app', 'Help with marketing', 'Customer support']
  };
  if (includesAny(q, ['help my business','help with my business','help grow my business','support my business','for my business','my company needs help','business needs help','grow my business','help my company'])) return getAgentReply('what do you do');
  if (includesAny(q, ['not sure which service','which service should i choose','help me choose a service','what service do i need','i don t know what i need','where should i start','help me decide'])) return {
    text: 'Start with the outcome you want. If you need help keeping daily work organized, look at Virtual Assistance. If you need a website, app or automation, look at Digital Development. For content and online communities, look at Social Media; for leads and measurable campaigns, Digital Marketing; and for customer enquiries or helpdesk operations, Customer Support. If your need crosses teams, tell us the whole picture and we can discuss a coordinated scope.',
    link: links.services, secondary: links.start, suggestions: ['Organize my day-to-day work', 'Build a website or app', 'Reach more customers', 'Support my customers']
  };
  if (includesAny(q, ['combine services','multiple services','more than one service','several services','all services','one team for','different departments','cross team','cross-team'])) return {
    text: 'You can ask about more than one service in the same conversation. Monata has teams for Virtual Assistance, Digital Development, Social Media, Digital Marketing and Customer Support, and related work may be coordinated under an agreed scope. The team will confirm which people, timing and responsibilities are available before promising a combined plan.',
    link: links.start, secondary: links.services
  };
  if (includesAny(q, ['prepare for a consultation','what should i prepare','what information do you need','before our meeting','before i contact','what do you need from me','how to prepare'])) return {
    text: 'A useful starting point is: the result you want, what is happening today, who the work is for, any tools or channels involved, your preferred timing, an approximate budget if you have one, and how you will judge success. You do not need a perfect brief; Monata can help clarify the scope together.',
    link: links.start
  };
  if (includesAny(q, ['values','what do you believe','company values','your values','how do you work with clients','how do you treat clients'])) return {
    text: 'Monata describes its values as Integrity, Clarity, Care and Craft: being honest about scope and capacity, setting clear expectations, treating people and information with respect, and paying attention to dependable delivery. In practice, that means agreeing the work and approval boundaries with you rather than making unsupported promises.',
    link: { label: 'About Monata', href: '#about-us' }, secondary: links.process
  };
  if (includesAny(q, ['updates','progress updates','how will you communicate','communication','who is my contact','point of contact','coordinator'])) return {
    text: 'Monata’s process calls for a named coordinator, clear expectations and progress updates. The exact update rhythm and communication channels should be agreed for your project during kickoff and written into the working plan.',
    link: links.process
  };
  if (includesAny(q, ['review my work','approve the work','quality check','quality assurance','test the website','testing','feedback on deliverables'])) return {
    text: 'The review process depends on the service, but the scope should define deliverables, acceptance criteria, review points and how requested changes are handled. Digital development work may include QA and a staging review before release. Ask for these checkpoints to be written into your quote or project plan.',
    link: links.start
  };
  if (includesAny(q, ['hire you','hire monata','work with monata','become a client','start working together','how do i start','get started'])) return {
    text: 'To get started, tell us what outcome you want, which service seems relevant, your preferred timing and any constraints. Monata can clarify the requirements, prepare a written scope and quote, and confirm capacity. Work begins after you approve the agreed plan.',
    link: links.start, secondary: links.process
  };
  if (includesAny(q, ['industries','industry','what businesses','small business','startup','start-up','founder','who do you work with','ideal client'])) return {
    text: 'Monata’s service information speaks to founders, professionals and small teams, and the services can support a range of business needs. I do not have a verified list of industries or client case studies to name. Tell us about your business and goal, and the team can confirm whether it is a fit.',
    link: links.start
  };
  if (includesAny(q, ['process','how it work','journey','onboard','what happen','next step','after i submit','after request'])) return {
    text: 'We start with a conversation, then qualify your goals and needs. Monata prepares a written scope, deliverables, timeline and quote for your approval. Once you are ready, the team sets up a kickoff with a named coordinator, shares progress, reviews the work with you and agrees next steps.', link: links.process, secondary: links.start
  };
  if (includesAny(q, ['guarantee','guaranteed','24/7','24 hours','always available','response time','results','sales guarantee','rankings'])) return {
    text: 'Coverage, response targets, turnaround and results depend on the agreed scope and confirmed team capacity. Monata confirms service details in writing before work begins; search rankings, sales and a specific return are not guaranteed.', link: links.start
  };
  const serviceMatches = Object.values(departments)
    .map((item) => ({ item, matches: item.keywords.filter((keyword) => includesAny(q, [keyword])) }))
    .filter(({ matches }) => matches.length)
    .sort((a, b) => Math.max(...b.matches.map((keyword) => normalized(keyword).length)) - Math.max(...a.matches.map((keyword) => normalized(keyword).length)));
  if (serviceMatches.length > 1) return {
    text: `It sounds like your need may involve ${serviceMatches.map(({ item }) => item.title).join(' and ')}. Those teams can discuss a coordinated plan, but the exact responsibilities, timing and capacity need to be agreed for your project. Tell Monata the outcome you want and what you already have in place, and the team can help shape the scope.`,
    link: links.start, secondary: links.services
  };
  const serviceMatch = serviceMatches[0];
  if (serviceMatch) return { text: serviceMatch.item.text, link: { label: `Find ${serviceMatch.item.title}`, href: serviceMatch.item.href }, secondary: links.start };
  if (includesAny(q, ['service','services','what do you do','offer','help with','department','team'])) return {
    text: 'Monata has five service teams: Virtual Assistance, Digital Development, Social Media, Digital Marketing and Customer Support. Each card on the “What we do” section explains the work. If you tell me what you need help with, I can point you to the closest fit.',
    link: links.services, secondary: links.start
  };
  if (includesAny(q, ['where','find','navigate','section','how do i get','how can i','start','begin','work with','hire','request','contact','talk to'])) return {
    text: 'Start with “What we do” to choose a service, or use “Let’s talk” to tell us what you need. We’ll learn about your goals, agree a written scope and quote, then introduce your coordinator and delivery team.',
    link: links.services, secondary: links.start
  };
  if (includesAny(q, ['process','how it work','journey','onboard','what happen','next step'])) return {
    text: 'We start with a conversation, then qualify your goals and needs. Monata prepares a written scope, deliverables, timeline and quote for your approval. Once you’re ready, we set up a kickoff with a named coordinator, share progress, review the work with you and agree next steps.',
    link: links.process, secondary: links.start
  };
  if (includesAny(q, ['project','progress','workspace','dashboard','client portal','my work','track'])) return {
    text: 'Sign in using “Client login” in the header. Your client workspace shows the projects and service requests currently connected to your account. If you haven’t created an account yet, start a request and we’ll guide you through registration.',
    link: links.login, secondary: links.start
  };
  if (includesAny(q, ['account','register','sign up','signup','sign in','login','log in','password','department'])) return {
    text: 'Use “Client login” in the header to sign in, or start a service request to create a client account. During registration you choose one department for your account. That department stays assigned to the account; contact the team if your needs span multiple departments.',
    link: links.login, secondary: links.start
  };
  if (includesAny(q, ['invoice','payment','pay','billing'])) return {
    text: 'The backend can keep invoice records and billing status, but online payment collection is not configured in this platform. For an invoice or payment question, contact the Monata team directly.',
    link: links.contact
  };
  if (includesAny(q, ['message','chat with my team','conversation','notification','file','upload','task','ticket','call'])) return {
    text: 'The backend supports team messages, notifications, tasks, tickets, calls and private files. Those tools are not currently shown in this frontend workspace, so I can’t direct you to them here. Your coordinator can help, or you can contact the team.',
    link: links.contact
  };
  if (includesAny(q, ['guarantee','guaranteed','24/7','24 hours','always available','languages','response time','turnaround'])) return {
    text: 'Coverage, languages, response targets and turnaround depend on the agreed scope and the delivery team’s confirmed capacity. Monata confirms those details in writing before work begins; this chat can’t promise a specific schedule or result.',
    link: links.start
  };
  if (includesAny(q, ['who are you','monata','about','company','location','where are you'])) return {
    text: 'Monata Global Services is a Nairobi-based services team working with clients everywhere. We bring virtual assistance, development, social media, digital marketing and customer support together with a named coordinator and a clear scope.',
    link: { label: 'How we work', href: '#approach' }, secondary: links.contact
  };
  return {
    text: 'I’m not certain about that, and I don’t want to guess. I can help with Monata’s five service teams, getting started, the client workspace and how our process works. For anything more specific, the Monata team can give you a reliable answer.',
    suggestions: ['Explore services', 'How do I get started?', 'Contact the team'], link: links.contact, unanswered: true
  };
}
