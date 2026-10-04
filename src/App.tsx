
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, CircleDollarSign,
  Code2, Copy, Download, ExternalLink, FileText, Film, Folder, Globe2, Image as ImageIcon,
  LayoutGrid, List, Moon, Search, ShieldCheck, SlidersHorizontal, Sparkles, Sun, Tag, X, Zap
} from 'lucide-react';

type Preference = 'free' | 'value' | 'quality';
type View = 'home' | 'explore' | 'deals' | 'plan';

type PlanTask = {
  id: string; stage: string; title: string; purpose: string; expectedOutput: string;
  toolId: string; toolName: string; provider: string; cost: number | null; costLabel: string;
  costBasis: 'verified' | 'estimated' | 'owned' | 'free' | 'unknown';
  reason: string; quality: { status: string; note: string }; sourceUrl?: string; lastVerified?: string;
  alternatives: Array<{ toolId: string; name: string; provider: string; cost: number | null; costLabel: string; basis: string }>;
  agentInstruction: string;
};

type ProjectPlan = {
  id: string; projectName: string; goal: string; kind: string; quantity: number; budget: number;
  preference: Preference; ownedTools: string[]; summary: string; knownCost: number; budgetRemaining: number;
  unpricedCount: number; costNote: string; priceCheckedAt: string; tasks: PlanTask[];
  sources: Array<{ name: string; url: string; checked?: string }>; handoff: string;
  planner: { model: string; usedModelCall: boolean; rule: string };
};

type Template = {
  id: string; title: string; description: string; category: string; cost: string;
  evidence: 'Community tested' | 'Tutor reviewed' | 'Not tested';
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  variant: 'video' | 'ad' | 'finance' | 'trading' | 'research' | 'documents';
  example: string; quantity: number; budget: number;
};

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

const templates: Template[] = [
  { id:'faceless', title:'Create faceless videos', description:'Scripts, visuals, captions and publish-ready short videos.', category:'Content', cost:'From ~$7 / batch', evidence:'Community tested', difficulty:'Easy', variant:'video', example:'I want to create 10 faceless educational videos for YouTube Shorts.', quantity:10, budget:20 },
  { id:'shop-ads', title:'Make ads for my shop', description:'Product visuals, ad copy and export variants for social campaigns.', category:'Shopping', cost:'From ~$0.35 / 10 images', evidence:'Tutor reviewed', difficulty:'Easy', variant:'ad', example:'I need 10 product ad images for my online skincare shop.', quantity:10, budget:5 },
  { id:'finance', title:'Build a finance tracker', description:'A simple personal finance web app with charts and categories.', category:'Tools & apps', cost:'From ~$1 + hosting', evidence:'Community tested', difficulty:'Medium', variant:'finance', example:'Build me a personal finance tracker web app with income, expenses and monthly charts.', quantity:1, budget:20 },
  { id:'trading', title:'Create a trading indicator', description:'Turn trading rules into an indicator, validation checklist and plan.', category:'Finance', cost:'From ~$2 / project', evidence:'Not tested', difficulty:'Advanced', variant:'trading', example:'I want to build a TradingView indicator from my entry, stop loss and take profit rules.', quantity:1, budget:15 },
  { id:'research', title:'Build a research assistant', description:'An evidence-first workflow to compare papers and answer with sources.', category:'Research', cost:'From ~$1 / project', evidence:'Tutor reviewed', difficulty:'Medium', variant:'research', example:'Build a research assistant that can compare papers and return cited answers.', quantity:1, budget:15 },
  { id:'documents', title:'Extract information from documents', description:'Convert invoices, receipts or reports into structured data.', category:'Automation', cost:'From ~$1 / 100 pages', evidence:'Community tested', difficulty:'Medium', variant:'documents', example:'Extract vendor, date, total and line items from invoices into structured JSON.', quantity:100, budget:10 }
];

const categoryItems = [['Content','48'],['Tools & apps','36'],['Education','28'],['Finance','22'],['Shopping','18'],['Research','16']];
const sectionItems = ['Home','Plan','Guide','Explore','Pricing','How it works','Showcase'];
const styleItems = ['Dark','Minimal','Editorial','Clean','Photography','Local/private'];
const ownedToolOptions = ['ChatGPT Plus','Claude','Canva','CapCut'];

function Brand() {
  return <button className="brand" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
    <span className="brand-mark"><span /><span /></span><span>Handoff</span>
  </button>;
}

function EvidenceBadge({ value }: { value: Template['evidence'] }) {
  const tone = value === 'Community tested' ? 'good' : value === 'Tutor reviewed' ? 'warm' : 'muted';
  return <span className={cx('evidence-badge', tone)}>
    {value === 'Not tested' ? <Sparkles size={13}/> : <ShieldCheck size={13}/>} {value}
  </span>;
}

function Preview({ variant }: { variant: Template['variant'] }) {
  if (variant === 'video') return <div className="project-preview preview-video"><div className="sun-orb"/><div className="preview-copy"><small>LESSON 01</small><strong>Discipline<br/>changes<br/>everything</strong></div><span className="play-dot">▶</span></div>;
  if (variant === 'ad') return <div className="project-preview preview-ad"><div className="product-card"><small>NATURAL CARE</small><strong>Brighter skin,<br/>simpler routine.</strong></div><div className="product-bottle"/><div className="leaf leaf-a"/><div className="leaf leaf-b"/></div>;
  if (variant === 'finance') return <div className="project-preview preview-finance"><div className="mini-dashboard"><div className="mini-row"><span>Monthly overview</span><strong>$2,480</strong></div><div className="bars">{[35,52,44,70,82,100].map((h) => <i key={h} style={{height:String(h)+'%'}}/>)}</div><div className="mini-legend"><span>Income</span><span>Expenses</span><span>Savings</span></div></div></div>;
  if (variant === 'trading') return <div className="project-preview preview-trading"><div className="chart">{[32,44,28,58,52,76,69,83,60,92].map((h,i) => <i key={i} style={{height:String(h)+'%',left:String(8+i*9)+'%'}}/>)}<span className="buy-tag">Buy</span><span className="sell-tag">Sell</span><b/></div></div>;
  if (variant === 'research') return <div className="project-preview preview-research"><div className="research-ui"><aside><span>Research</span><span>Summarize</span><span>Find insights</span><span>Organize</span></aside><section><strong>Research assistant</strong><div className="skeleton wide"/><div className="skeleton"/><div className="skeleton short"/></section></div></div>;
  return <div className="project-preview preview-documents"><div className="document-ui"><div className="file-stack"><FileText size={28}/><small>Invoice.pdf</small></div><ArrowRight size={22}/><div className="extract-table"><span>Vendor</span><b>Acme Store</b><span>Total</span><b>$48.20</b><span>Date</span><b>Mar 12</b></div></div></div>;
}

function ProjectCard({ item, onUse }: { item: Template; onUse: (item:Template) => void }) {
  return <article className="project-card">
    <Preview variant={item.variant}/>
    <div className="project-card-body">
      <div className="project-card-title-row"><h3>{item.title}</h3><button className="icon-button" aria-label="Save"><Tag size={16}/></button></div>
      <p>{item.description}</p>
      <div className="project-meta"><strong>{item.cost}</strong><span>{item.difficulty}</span></div>
      <div className="project-card-footer"><EvidenceBadge value={item.evidence}/><button className="text-action" onClick={() => onUse(item)}>Use this plan <ArrowRight size={14}/></button></div>
    </div>
  </article>;
}

function Header({ view, setView, theme, setTheme, openFilter }: { view:View; setView:(v:View)=>void; theme:'dark'|'light'; setTheme:(v:'dark'|'light')=>void; openFilter:()=>void }) {
  return <header className="topbar"><div className="topbar-inner">
    <div className="nav-left"><Brand/><nav><button className={view==='explore'?'active':''} onClick={() => setView('explore')}>Explore</button><button className={view==='deals'?'active':''} onClick={() => setView('deals')}><Tag size={15}/> Free & deals</button></nav></div>
    <button className="global-search" onClick={openFilter}><Search size={17}/><span>Search plans, tools, topics or use cases…</span><kbd>⌘ K</kbd></button>
    <div className="nav-right"><button className="language"><Globe2 size={16}/> English / বাংলা <ChevronDown size={14}/></button><button className="icon-button" onClick={() => setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button><span className="avatar">A</span></div>
  </div></header>;
}

function FilterModal({ close, checkedAt }: { close:()=>void; checkedAt?:string }) {
  return <div className="modal-backdrop" onMouseDown={close}><section className="filter-modal" onMouseDown={(e)=>e.stopPropagation()}>
    <div className="filter-modal-top"><div className="filter-search"><Search size={18}/><input autoFocus placeholder="Search projects, categories, sections or styles…"/><kbd>⌘ K</kbd></div><div className="view-toggle"><button className="selected"><LayoutGrid size={17}/></button><button><List size={17}/></button></div><button className="icon-button" onClick={close}><X size={20}/></button></div>
    <div className="filter-layout">
      <aside className="filter-sidebar"><button className="selected"><Zap size={16}/> Trending</button><button><Folder size={16}/> Categories</button><button><LayoutGrid size={16}/> Sections</button><button><Sparkles size={16}/> Styles</button></aside>
      <div className="filter-content">
        <h4>Quick picks</h4>
        <div className="quick-picks">{[['AI',Sparkles],['Marketing',Tag],['Development',Code2],['Finance',CircleDollarSign],['Education',BookOpen],['Content',Film]].map(([label,Icon]:any) => <button key={label}><Icon size={19}/><span>{label}</span></button>)}</div>
        <div className="filter-heading"><h4>Categories</h4><button>View all <ArrowRight size={14}/></button></div>
        <div className="category-tiles">{categoryItems.map(([label,count],idx)=><button key={label}><span className={'tile-visual tile-'+idx}>{idx%2?<Code2 size={22}/>:<ImageIcon size={22}/>}</span><strong>{label}</strong><small>{count} plans</small></button>)}</div>
        <h4>Sections</h4><div className="pill-row">{sectionItems.map((label)=><button key={label} className={label==='Explore'?'selected':''}>{label}</button>)}</div>
        <h4>Styles</h4><div className="pill-row">{styleItems.map((label)=><button key={label}>{label}</button>)}</div>
        <div className="catalog-status"><CheckCircle2 size={14}/> Catalog snapshot checked {checkedAt?new Date(checkedAt).toLocaleString():'recently'}</div>
      </div>
    </div>
  </section></div>;
}

function HomeView(props:any) {
  const {goal,setGoal,budget,setBudget,quantity,setQuantity,preference,setPreference,ownedTools,toggleOwned,buildPlan,isPlanning,useTemplate}=props;
  return <main className="page">
    <section className="hero">
      <div className="eyebrow">FROM IDEA TO EXECUTION</div>
      <h1>What will you <span>make happen?</span></h1>
      <p>Describe the outcome. Handoff finds a practical route across models, tools, subscriptions and free options — then gives you the exact handoff to execute it.</p>
      <div className="mode-switch"><button className="selected"><Film size={18}/> Create content</button><button><Code2 size={18}/> Build a tool or app</button></div>
      <div className="planner-box">
        <textarea value={goal} onChange={(e)=>setGoal(e.target.value)} placeholder="I want to create faceless educational videos."/>
        <div className="planner-controls">
          <label><span>Quantity</span><input type="number" min={1} value={quantity} onChange={(e)=>setQuantity(Math.max(1,Number(e.target.value||1)))}/></label>
          <label><span>Budget</span><div className="money-input"><b>$</b><input type="number" min={0} value={budget} onChange={(e)=>setBudget(Math.max(0,Number(e.target.value||0)))}/></div></label>
          <button className="primary" onClick={buildPlan} disabled={isPlanning||goal.trim().length<3}><Sparkles size={17}/> {isPlanning?'Preparing your plan…':'Plan my project'} <ArrowRight size={17}/></button>
        </div>
      </div>
      <div className="planning-options">
        <div className="option-group"><small>PRIORITY</small><div className="preferences">
          {[['free','Free first','Spend as little as possible',CircleDollarSign],['value','Best value','Enough quality, no waste',Zap],['quality','Quality first','Upgrade where it matters',Sparkles]].map(([value,title,copy,Icon]:any)=><button key={value} className={cx('preference',preference===value&&'selected')} onClick={()=>setPreference(value)}><Icon size={18}/><span><strong>{title}</strong><small>{copy}</small></span></button>)}
        </div></div>
        <div className="option-group"><small>I ALREADY HAVE</small><div className="owned-tools">{ownedToolOptions.map((tool)=><button key={tool} className={ownedTools.includes(tool)?'selected':''} onClick={()=>toggleOwned(tool)}><span className="check-box">{ownedTools.includes(tool)&&<Check size={12}/>}</span>{tool}</button>)}</div></div>
      </div>
    </section>
    <section className="discover-section"><div className="section-title-row"><div><h2>Start from something useful</h2><p>Real outcomes, clear units, and evidence labels. Pick one and customize it.</p></div><button className="text-action">Explore all <ArrowRight size={15}/></button></div><div className="project-grid">{templates.map((item)=><ProjectCard key={item.id} item={item} onUse={useTemplate}/>)}</div></section>
  </main>;
}

function ExploreView({useTemplate,dealsOnly,openFilter}:{useTemplate:(t:Template)=>void;dealsOnly:boolean;openFilter:()=>void}) {
  const list=dealsOnly?templates.filter((t)=>t.cost.includes('~$0')||t.cost.includes('From ~$1')):templates;
  return <main className="page explore-page">
    <section className="explore-hero">
      <div><div className="eyebrow">{dealsOnly?'FREE ROUTES & CURRENT VALUE':'EXPLORE PROJECTS'}</div><h1>{dealsOnly?'Spend less.':'Find a useful '} <span>{dealsOnly?'Still ship.':'starting point.'}</span></h1><p>{dealsOnly?'Routes that use free tiers, owned subscriptions, local software or low-cost models first.':'Browse by outcome. Model and tool choices come after your budget and constraints are known.'}</p></div>
      <div className="browse-taxonomy">
        <div className="taxonomy-column"><div className="taxonomy-head"><Folder size={17}/><strong>Categories</strong></div>{categoryItems.map(([label,count])=><button key={label}><span>{label}</span><small>{count}</small></button>)}</div>
        <div className="taxonomy-column"><div className="taxonomy-head"><LayoutGrid size={17}/><strong>Sections</strong></div>{sectionItems.slice(0,6).map((label)=><button key={label}><span>{label}</span></button>)}</div>
        <div className="taxonomy-column"><div className="taxonomy-head"><Sparkles size={17}/><strong>Styles</strong></div>{styleItems.map((label)=><button key={label}><span>{label}</span></button>)}</div>
      </div>
    </section>
    <section className="discover-section"><div className="browse-toolbar"><div className="tabs"><button className="active">Latest</button><button>Most useful</button><button>Lowest cost</button></div><button className="filter-button" onClick={openFilter}><SlidersHorizontal size={16}/> Filter</button></div><div className="project-grid">{list.map((item)=><ProjectCard key={item.id} item={item} onUse={useTemplate}/>)}</div></section>
  </main>;
}

function PlanView({plan,back,copyHandoff,downloadHandoff}:{plan:ProjectPlan;back:()=>void;copyHandoff:()=>void;downloadHandoff:()=>void}) {
  const pct=plan.budget>0?Math.min(100,Math.round(plan.knownCost/plan.budget*100)):100;
  return <main className="page plan-page">
    <button className="back-button" onClick={back}><ArrowLeft size={16}/> Back to project</button>
    <section className="plan-header"><div><div className="eyebrow">YOUR PLAN</div><h1>{plan.projectName}</h1><p>{plan.summary}</p><div className="plan-tags"><span>{plan.kind}</span><span>{plan.quantity} {plan.quantity===1?'deliverable':'items'}</span><span>{plan.preference}</span></div></div><div className="spend-card"><div className="spend-head"><span>Estimated known spend</span><strong>{'$'+plan.knownCost.toFixed(2)+' / $'+plan.budget.toFixed(2)}</strong></div><div className="progress"><i style={{width:String(pct)+'%'}}/></div><div className="spend-grid"><div><small>Known cost</small><strong>{'$'+plan.knownCost.toFixed(2)}</strong></div><div><small>Remaining</small><strong>{'$'+plan.budgetRemaining.toFixed(2)}</strong></div><div><small>Needs re-check</small><strong>{plan.unpricedCount}</strong></div></div><p>{plan.costNote}</p></div></section>
    <section className="route-card"><div><Sparkles size={20}/><div><h2>The recommended route</h2><p>One clear default. Cheaper and higher-quality alternatives stay nearby, not in your way.</p></div></div><button className="primary compact">Guide me <ArrowRight size={16}/></button></section>
    <section className="steps-section"><div className="section-title-row"><div><h2>Prepare → Make → Check → Publish</h2><p>Every step explains the tool, output and why it was selected.</p></div><span className="price-checked"><CheckCircle2 size={14}/> Catalog {new Date(plan.priceCheckedAt).toLocaleDateString()}</span></div><div className="plan-steps">
      {plan.tasks.map((task,index)=><article className="plan-step" key={task.id}>
        <div className="step-number">{index+1}</div>
        <div className="step-intro"><small>{task.stage}</small><h3>{task.title}</h3><p>{task.purpose}</p></div>
        <div className="step-tool"><small>TOOL / MODEL</small><strong>{task.toolName}</strong><span>{task.provider}</span><p>{task.reason}</p></div>
        <div className="step-output"><small>EXPECTED OUTPUT</small><strong>{task.expectedOutput}</strong><span className={'cost-pill '+task.costBasis}>{task.costLabel}</span></div>
        <div className="step-alts"><small>ALTERNATIVES</small>{task.alternatives.length?task.alternatives.slice(0,2).map((alt)=><button key={alt.toolId}><span>{alt.name}</span><small>{alt.costLabel}</small></button>):<span className="no-alt">No better route in current shortlist</span>}</div>
      </article>)}
    </div></section>
    <section className="handoff-section"><div className="handoff-main"><div className="section-title-row"><div><div className="eyebrow">AGENT HANDOFF</div><h2>Give the next agent exactly what it needs.</h2><p>Project context, selected route, constraints and deliverables — without the discovery clutter.</p></div></div><pre>{plan.handoff}</pre><div className="handoff-actions"><button className="primary" onClick={copyHandoff}><Copy size={16}/> Copy handoff</button><button className="secondary" onClick={downloadHandoff}><Download size={16}/> Download .md</button></div></div><aside className="plan-sidebar"><div className="side-card"><h3>Planner</h3><p>{plan.planner.usedModelCall?'Refined by '+plan.planner.model:'Deterministic budget router'}</p><small>{plan.planner.rule}</small></div><div className="side-card"><h3>Sources</h3>{plan.sources.map((source)=><a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span>{source.name}</span><ExternalLink size={13}/></a>)}</div><div className="side-card"><h3>Quality evidence</h3>{plan.tasks.map((task)=><div className="quality-row" key={task.id}><CheckCircle2 size={15}/><span><strong>{task.toolName}</strong><small>{task.quality.note}</small></span></div>)}</div></aside></section>
  </main>;
}

export default function App() {
  const [view,setView]=useState<View>('home');
  const [theme,setTheme]=useState<'dark'|'light'>(()=>(localStorage.getItem('handoff-theme') as 'dark'|'light')||'dark');
  const [filterOpen,setFilterOpen]=useState(false);
  const [goal,setGoal]=useState('I want to create faceless educational videos.');
  const [budget,setBudget]=useState(25);
  const [quantity,setQuantity]=useState(10);
  const [preference,setPreference]=useState<Preference>('value');
  const [ownedTools,setOwnedTools]=useState<string[]>(['ChatGPT Plus','Canva']);
  const [isPlanning,setIsPlanning]=useState(false);
  const [plan,setPlan]=useState<ProjectPlan|null>(null);
  const [catalogCheckedAt,setCatalogCheckedAt]=useState<string>();

  useEffect(()=>{ document.documentElement.dataset.theme=theme; localStorage.setItem('handoff-theme',theme); },[theme]);
  useEffect(()=>{ fetch('/api/catalog').then((r)=>r.ok?r.json():null).then((d)=>d&&d.generatedAt&&setCatalogCheckedAt(d.generatedAt)).catch(()=>undefined); },[]);
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setFilterOpen(true);} if(e.key==='Escape')setFilterOpen(false); }; window.addEventListener('keydown',onKey); return()=>window.removeEventListener('keydown',onKey); },[]);

  const toggleOwned=(tool:string)=>setOwnedTools((current)=>current.includes(tool)?current.filter((x)=>x!==tool):current.concat(tool));
  const buildPlan=async()=>{ setIsPlanning(true); try { const response=await fetch('/api/plan-v2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal,budget,quantity,preference,ownedTools})}); const data=await response.json(); if(!response.ok||!data.plan)throw new Error(data.error||'Could not build plan'); setPlan(data.plan); setView('plan'); window.scrollTo({top:0,behavior:'smooth'}); } catch(error){ console.error(error); alert(error instanceof Error?error.message:'Could not build plan'); } finally { setIsPlanning(false); } };
  const useTemplate=(item:Template)=>{ setGoal(item.example);setQuantity(item.quantity);setBudget(item.budget);setView('home');setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),20); };
  const copyHandoff=async()=>{ if(plan)await navigator.clipboard.writeText(plan.handoff); };
  const downloadHandoff=()=>{ if(!plan)return; const blob=new Blob([plan.handoff],{type:'text/markdown;charset=utf-8'}); const url=URL.createObjectURL(blob); const anchor=document.createElement('a'); anchor.href=url; anchor.download=(plan.projectName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'handoff')+'.md'; anchor.click(); URL.revokeObjectURL(url); };

  const page=useMemo(()=>{
    if(view==='plan'&&plan)return <PlanView plan={plan} back={()=>setView('home')} copyHandoff={copyHandoff} downloadHandoff={downloadHandoff}/>;
    if(view==='explore')return <ExploreView useTemplate={useTemplate} dealsOnly={false} openFilter={()=>setFilterOpen(true)}/>;
    if(view==='deals')return <ExploreView useTemplate={useTemplate} dealsOnly={true} openFilter={()=>setFilterOpen(true)}/>;
    return <HomeView goal={goal} setGoal={setGoal} budget={budget} setBudget={setBudget} quantity={quantity} setQuantity={setQuantity} preference={preference} setPreference={setPreference} ownedTools={ownedTools} toggleOwned={toggleOwned} buildPlan={buildPlan} isPlanning={isPlanning} useTemplate={useTemplate}/>;
  },[view,plan,goal,budget,quantity,preference,ownedTools,isPlanning]);

  return <div className="app-shell"><Header view={view} setView={setView} theme={theme} setTheme={setTheme} openFilter={()=>setFilterOpen(true)}/>{page}<footer className="footer"><Brand/><span>Project-aware AI routing. Prices come from the catalog, not model memory.</span><button onClick={()=>setFilterOpen(true)}><Search size={14}/> Search</button></footer>{filterOpen&&<FilterModal close={()=>setFilterOpen(false)} checkedAt={catalogCheckedAt}/>}</div>;
}
