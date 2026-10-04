import React, { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Film,
  Folder,
  LayoutGrid,
  Moon,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Tag,
  X,
  Zap,
} from "lucide-react";
import {
  api,
  budgetStatus,
  candidates,
  categories,
  dateLabel,
  defaultSettings,
  emptyFilters,
  filterOutcomes,
  outcomes,
  safeUrl,
  sections,
  styles,
} from "./frontend";
import type {
  Catalog,
  CatalogItem,
  Filters,
  Offer,
  Outcome,
  PlanTask,
  Preference,
  ProjectPlan,
  Settings,
} from "./frontend";

type View = "home" | "explore" | "deals" | "plan";
const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");
const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(value);
const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
const top = () =>
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
const routeFromHash = (): View =>
  ["explore", "deals", "plan"].includes(location.hash.slice(1))
    ? (location.hash.slice(1) as View)
    : "home";

function Brand({ home }: { home: () => void }) {
  return (
    <button className="brand" onClick={home} aria-label="Handoff home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      <span>Handoff</span>
    </button>
  );
}
function Preview({ variant }: { variant: Outcome["variant"] }) {
  if (variant === "video")
    return (
      <div className="project-preview preview-video">
        <div className="sun-orb" />
        <div className="preview-copy">
          <small>LESSON 01</small>
          <strong>
            Discipline
            <br />
            changes
            <br />
            everything
          </strong>
        </div>
        <span className="play-dot">Play</span>
      </div>
    );
  if (variant === "ad")
    return (
      <div className="project-preview preview-ad">
        <div className="product-card">
          <small>NATURAL CARE</small>
          <strong>
            Brighter skin,
            <br />
            simpler routine.
          </strong>
        </div>
        <div className="product-bottle" />
        <div className="leaf leaf-a" />
        <div className="leaf leaf-b" />
      </div>
    );
  if (variant === "finance")
    return (
      <div className="project-preview preview-finance">
        <div className="mini-dashboard">
          <div className="mini-row">
            <span>Monthly overview</span>
            <strong>$2,480</strong>
          </div>
          <div className="bars">
            {[35, 52, 44, 70, 82, 100].map((h) => (
              <i key={h} style={{ height: String(h) + "%" }} />
            ))}
          </div>
          <div className="mini-legend">
            <span>Income</span>
            <span>Expenses</span>
            <span>Savings</span>
          </div>
        </div>
      </div>
    );
  if (variant === "trading")
    return (
      <div className="project-preview preview-trading">
        <div className="chart">
          {[32, 44, 28, 58, 52, 76, 69, 83, 60, 92].map((h, i) => (
            <i
              key={i}
              style={{ height: String(h) + "%", left: String(8 + i * 9) + "%" }}
            />
          ))}
          <span className="buy-tag">Buy</span>
          <span className="sell-tag">Sell</span>
          <b />
        </div>
      </div>
    );
  if (variant === "research")
    return (
      <div className="project-preview preview-research">
        <div className="research-ui">
          <aside>
            <span>Research</span>
            <span>Summarize</span>
            <span>Find insights</span>
            <span>Organize</span>
          </aside>
          <section>
            <strong>Research assistant</strong>
            <div className="skeleton wide" />
            <div className="skeleton" />
            <div className="skeleton short" />
          </section>
        </div>
      </div>
    );
  return (
    <div className="project-preview preview-documents">
      <div className="document-ui">
        <div className="file-stack">
          <FileText size={28} />
          <small>Invoice.pdf</small>
        </div>
        <ArrowRight size={22} />
        <div className="extract-table">
          <span>Vendor</span>
          <b>Acme Store</b>
          <span>Total</span>
          <b>$48.20</b>
          <span>Date</span>
          <b>Mar 12</b>
        </div>
      </div>
    </div>
  );
}

function SourceLink({
  url,
  children,
}: {
  url?: string;
  children: React.ReactNode;
}) {
  const href = safeUrl(url);
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {children} <ExternalLink size={13} aria-hidden="true" />
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  ) : (
    <span className="muted">Source not recorded</span>
  );
}
function ProjectCard({
  item,
  onUse,
  preview,
}: {
  item: Outcome;
  onUse: (item: Outcome) => void;
  preview?: ProjectPlan;
}) {
  return (
    <article className="project-card">
      <div aria-hidden="true">
        <Preview variant={item.variant} />
      </div>
      <div className="project-card-body">
        <div className="project-card-title-row">
          <h3>{item.title}</h3>
        </div>
        <p>{item.description}</p>
        <div className="project-meta">
          <strong>
            {preview
              ? money(preview.knownCost) + " known subtotal"
              : "Calculated for your project"}
          </strong>
          <span>{item.difficulty}</span>
        </div>
        {preview && (
          <p className="preview-note">
            {preview.quantity} items ·{" "}
            {budgetStatus(preview) === "within"
              ? "Within preview ceiling"
              : budgetStatus(preview) === "over"
                ? "Above preview ceiling"
                : "Total unconfirmed"}{" "}
            · {preview.unpricedCount} unpriced steps
          </p>
        )}
        <div className="project-card-footer">
          <span className="evidence-badge muted">Illustrative preview</span>
          <button
            className="text-action"
            onClick={() => onUse(item)}
            aria-label={"Customize " + item.title}
          >
            Customize <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
function Header({
  view,
  navigate,
  theme,
  setTheme,
  openSearch,
  hasPlan,
}: {
  view: View;
  navigate: (view: View) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  openSearch: () => void;
  hasPlan: boolean;
}) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="nav-left">
          <Brand home={() => navigate("home")} />
          <nav aria-label="Main navigation">
            <button
              aria-current={view === "home" ? "page" : undefined}
              className={cx(view === "home" && "active")}
              onClick={() => navigate("home")}
            >
              Home
            </button>
            <button
              aria-current={view === "explore" ? "page" : undefined}
              className={cx(view === "explore" && "active")}
              onClick={() => navigate("explore")}
            >
              Explore
            </button>
            <button
              aria-current={view === "deals" ? "page" : undefined}
              className={cx(view === "deals" && "active")}
              onClick={() => navigate("deals")}
            >
              <Tag size={15} /> Free & offers
            </button>
            {hasPlan && (
              <button
                aria-current={view === "plan" ? "page" : undefined}
                className={cx(view === "plan" && "active")}
                onClick={() => navigate("plan")}
              >
                My plan
              </button>
            )}
          </nav>
        </div>
        <button
          className="global-search"
          aria-label="Search outcomes and filters"
          aria-haspopup="dialog"
          onClick={openSearch}
        >
          <Search size={17} />
          <span>Search outcomes, tools or topics</span>
          <kbd>Ctrl/⌘ K</kbd>
        </button>
        <div className="nav-right">
          <button
            className="icon-button mobile-search"
            aria-label="Search outcomes and filters"
            aria-haspopup="dialog"
            onClick={openSearch}
          >
            <Search size={18} />
          </button>
          <button
            className="icon-button"
            aria-label={
              "Switch to " + (theme === "dark" ? "light" : "dark") + " theme"
            }
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
function FilterFields({
  filters,
  setFilters,
  catalog,
  previewsBusy,
  calculate,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  catalog: Catalog | null;
  previewsBusy: boolean;
  calculate: () => void;
}) {
  const id = useId();
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));
  return (
    <div className="filter-fields">
      <div className="filter-selects">
        {(
          [
            ["category", "Category", categories],
            ["section", "Task section", sections],
            ["style", "Output style", styles],
            ["difficulty", "Difficulty", ["Easy", "Medium", "Advanced"]],
          ] as const
        ).map(([key, label, options]) => (
          <label key={key} htmlFor={id + key}>
            <span>{label}</span>
            <select
              id={id + key}
              value={filters[key]}
              onChange={(e) => update(key, e.target.value)}
            >
              <option value="">All</option>
              {options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}
        <label htmlFor={id + "budget"}>
          <span>Preview budget ceiling (USD)</span>
          <input
            id={id + "budget"}
            type="number"
            min="0"
            max="100000"
            step="0.01"
            value={filters.budget}
            placeholder="Any budget"
            onChange={(e) => update("budget", e.target.value)}
          />
        </label>
      </div>
      <div className="filter-flags">
        {(
          [
            ["free", "Free-only route"],
            ["local", "Local route"],
            ["api", "API route"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={filters[key]}
              disabled={!catalog}
              onChange={(e) => update(key, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
      <p className="filter-explanation">
        Route filters use deterministic previews for your settings. Free-only
        requires every task to have confirmed zero incremental cost. Budget
        filtering excludes unconfirmed totals.
      </p>
      <div className="filter-actions">
        <button
          className="secondary"
          onClick={() => setFilters({ ...emptyFilters })}
        >
          Clear filters
        </button>
        {(filters.budget !== "" ||
          filters.free ||
          filters.local ||
          filters.api) && (
          <button
            className="secondary"
            onClick={calculate}
            disabled={
              previewsBusy ||
              !Number.isFinite(Number(filters.budget)) ||
              Number(filters.budget) < 0
            }
          >
            {previewsBusy
              ? "Calculating previews…"
              : "Calculate route previews"}
          </button>
        )}
      </div>
    </div>
  );
}
type DiscoveryProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  catalog: Catalog | null;
  previews: Record<string, ProjectPlan>;
  previewsBusy: boolean;
  previewError: string;
  calculate: () => void;
  useOutcome: (item: Outcome) => void;
};
function FilterModal({
  close,
  navigate,
  ...props
}: DiscoveryProps & { close: () => void; navigate: (view: View) => void }) {
  const dialog = useRef<HTMLElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const results = filterOutcomes(props.filters, props.catalog, props.previews);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    search.current?.focus();
    const keepFocus = (e: FocusEvent) => {
      if (dialog.current && !dialog.current.contains(e.target as Node))
        search.current?.focus();
    };
    document.addEventListener("focusin", keepFocus);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("focusin", keepFocus);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
    if (e.key === "Tab") {
      const nodes = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]',
        ) || [],
      ).filter((n) => n.getClientRects().length > 0);
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        ref={dialog}
        className="filter-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        onKeyDown={onKey}
      >
        <div className="filter-modal-top">
          <h2 id="search-title" className="sr-only">
            Search outcomes and filters
          </h2>
          <div className="filter-search">
            <Search size={18} />
            <label className="sr-only" htmlFor="overlay-search">
              Search outcomes
            </label>
            <input
              id="overlay-search"
              ref={search}
              value={props.filters.query}
              onChange={(e) =>
                props.setFilters((current) => ({
                  ...current,
                  query: e.target.value,
                }))
              }
              placeholder="Search outcomes, tools or topics"
            />
            <kbd>Esc</kbd>
          </div>
          <button
            className="icon-button"
            aria-label="Close search"
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        <div className="filter-layout">
          <aside className="filter-sidebar">
            <button
              onClick={() => {
                close();
                navigate("home");
              }}
            >
              Home <ArrowRight size={15} />
            </button>
            <button
              onClick={() => {
                close();
                navigate("explore");
              }}
            >
              Explore all <ArrowRight size={15} />
            </button>
            <button
              onClick={() => {
                close();
                navigate("deals");
              }}
            >
              Free & offers <Tag size={15} />
            </button>
            <p className="filter-explanation">
              Catalog snapshot: {dateLabel(props.catalog?.generatedAt)}. Source
              checks and evidence appear in each plan.
            </p>
          </aside>
          <div className="filter-content">
            <FilterFields {...props} />
            <p role="status">
              {results.length} matching outcomes
              {props.previewsBusy ? " · calculating previews…" : ""}
            </p>
            {props.previewError && (
              <p className="error" role="alert">
                {props.previewError}
              </p>
            )}
            <div className="search-results">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    close();
                    props.useOutcome(item);
                  }}
                >
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.category} · {item.difficulty} · {item.description}
                    </small>
                  </span>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
            {!results.length && (
              <p className="empty-state">
                No matching outcomes. Clear a filter or calculate previews for
                your budget.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
type HomeProps = {
  goal: string;
  setGoal: (v: string) => void;
  budget: number;
  setBudget: (v: number) => void;
  quantity: number;
  setQuantity: (v: number) => void;
  preference: Preference;
  setPreference: (v: Preference) => void;
  ownedTools: string[];
  toggleOwned: (tool: string) => void;
  buildPlan: () => void;
  isPlanning: boolean;
  useOutcome: (o: Outcome) => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  explore: () => void;
  error: string;
};
function HomeView(p: HomeProps) {
  const change = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    p.setSettings((current) => ({ ...current, [key]: value }));
  return (
    <main tabIndex={-1} id="main" className="page">
      <section className="hero">
        <div className="eyebrow">FROM IDEA TO EXECUTION</div>
        <h1>
          What will you <span>make happen?</span>
        </h1>
        <p>
          Describe the outcome. Find a practical route across tools,
          subscriptions and free options, with costs and sources you can
          inspect.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            p.buildPlan();
          }}
          aria-busy={p.isPlanning}
        >
          <div className="planner-box">
            <label className="sr-only" htmlFor="project-goal">
              Project outcome
            </label>
            <textarea
              id="project-goal"
              required
              minLength={3}
              maxLength={4000}
              value={p.goal}
              onChange={(e) => p.setGoal(e.target.value)}
              placeholder="What do you want to create or build?"
            />
            <div className="planner-controls">
              <label>
                <span>Quantity</span>
                <input
                  type="number"
                  required
                  min={1}
                  max={10000}
                  step={1}
                  value={Number.isNaN(p.quantity) ? "" : p.quantity}
                  onChange={(e) =>
                    p.setQuantity(
                      e.target.value === "" ? NaN : e.target.valueAsNumber,
                    )
                  }
                />
              </label>
              <label>
                <span>Budget (USD)</span>
                <div className="money-input">
                  <b aria-hidden="true">$</b>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100000}
                    step="0.01"
                    value={Number.isNaN(p.budget) ? "" : p.budget}
                    onChange={(e) =>
                      p.setBudget(
                        e.target.value === "" ? NaN : e.target.valueAsNumber,
                      )
                    }
                  />
                </div>
              </label>
              <button
                type="submit"
                className="primary"
                disabled={p.isPlanning || p.goal.trim().length < 3}
              >
                <Sparkles size={17} />
                {p.isPlanning ? "Preparing your plan…" : "Plan my project"}
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
          {p.isPlanning && (
            <p className="planning-status" role="status">
              Comparing catalog routes and calculating project costs…
            </p>
          )}
          {p.error && (
            <p className="error" role="alert">
              {p.error}
            </p>
          )}
          <div className="planning-options">
            <div className="option-group">
              <small>PRIORITY</small>
              <div className="preferences">
                {(
                  [
                    {
                      value: "free",
                      title: "Free first",
                      copy: "Use adequate free and owned routes",
                      Icon: CircleDollarSign,
                    },
                    {
                      value: "value",
                      title: "Best value",
                      copy: "Enough quality, sensible spend",
                      Icon: Zap,
                    },
                    {
                      value: "quality",
                      title: "Quality first",
                      copy: "Upgrade where it matters",
                      Icon: Sparkles,
                    },
                  ] as const
                ).map(({ value, title, copy, Icon }) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={p.preference === value}
                    className={cx(
                      "preference",
                      p.preference === value && "selected",
                    )}
                    onClick={() => p.setPreference(value)}
                  >
                    <Icon size={18} />
                    <span>
                      <strong>{title}</strong>
                      <small>{copy}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="option-group">
              <small>I ALREADY HAVE</small>
              <div className="owned-tools">
                {["ChatGPT Plus", "Claude", "Canva", "CapCut"].map((tool) => (
                  <button
                    type="button"
                    key={tool}
                    aria-pressed={p.ownedTools.includes(tool)}
                    className={p.ownedTools.includes(tool) ? "selected" : ""}
                    onClick={() => p.toggleOwned(tool)}
                  >
                    <span className="check-box" aria-hidden="true">
                      {p.ownedTools.includes(tool) && <Check size={12} />}
                    </span>
                    {tool}
                  </button>
                ))}
              </div>
              <p className="filter-explanation">
                Select only tools you own. Web subscriptions do not include API
                credits.
              </p>
            </div>
          </div>
          <details className="advanced-settings">
            <summary>
              <SlidersHorizontal size={17} /> Advanced project settings
            </summary>
            <div className="settings-grid">
              <label className="privacy-option">
                <input
                  type="checkbox"
                  checked={p.settings.privacy}
                  onChange={(e) => change("privacy", e.target.checked)}
                />
                <span>Keep project data local/private</span>
              </label>
              <label>
                <span>Access mode</span>
                <select
                  value={p.settings.accessMode}
                  onChange={(e) =>
                    change(
                      "accessMode",
                      e.target.value as Settings["accessMode"],
                    )
                  }
                >
                  <option value="any">Any supported mode</option>
                  <option value="api">API only</option>
                  <option value="web">Web only</option>
                  <option value="local">Local only</option>
                </select>
              </label>
              <label>
                <span>Available hardware</span>
                <select
                  value={p.settings.hardware}
                  onChange={(e) =>
                    change("hardware", e.target.value as Settings["hardware"])
                  }
                >
                  <option value="none">None specified</option>
                  <option value="cpu">CPU computer</option>
                  <option value="gpu">GPU computer</option>
                </select>
              </label>
              <label>
                <span>Region</span>
                <input
                  maxLength={80}
                  value={p.settings.region}
                  onChange={(e) => change("region", e.target.value)}
                  placeholder="Country or region, e.g. BD"
                />
              </label>
              <label>
                <span>Video duration per item (seconds)</span>
                <input
                  type="number"
                  required
                  min={1}
                  max={3600}
                  step={1}
                  value={
                    Number.isNaN(p.settings.durationSeconds)
                      ? ""
                      : p.settings.durationSeconds
                  }
                  onChange={(e) =>
                    change(
                      "durationSeconds",
                      e.target.value === "" ? NaN : e.target.valueAsNumber,
                    )
                  }
                />
              </label>
              <label>
                <span>Skill level</span>
                <select
                  value={p.settings.skillLevel}
                  onChange={(e) =>
                    change(
                      "skillLevel",
                      e.target.value as Settings["skillLevel"],
                    )
                  }
                >
                  <option value="basic">Basic — guided steps</option>
                  <option value="technical">
                    Technical — implementation details
                  </option>
                </select>
              </label>
            </div>
            <p className="filter-explanation">
              These settings constrain route eligibility. Local tools may still
              need downloads, compatible hardware and a license check. The
              project description is sent to this app’s planning server.
            </p>
          </details>
        </form>
      </section>
      <section className="discover-section">
        <div className="section-title-row">
          <div>
            <h2>Start from something useful</h2>
            <p>
              Illustrative outcomes. Customize quantity, budget and constraints
              before planning.
            </p>
          </div>
          <button className="text-action" onClick={p.explore}>
            Explore all <ArrowRight size={15} />
          </button>
        </div>
        <div className="project-grid">
          {outcomes.map((item) => (
            <ProjectCard key={item.id} item={item} onUse={p.useOutcome} />
          ))}
        </div>
      </section>
    </main>
  );
}
function ExploreView(p: DiscoveryProps) {
  const results = filterOutcomes(p.filters, p.catalog, p.previews);
  return (
    <main tabIndex={-1} id="main" className="page explore-page">
      <section className="explore-hero">
        <div>
          <div className="eyebrow">EXPLORE OUTCOMES</div>
          <h1>
            Find a useful <span>starting point.</span>
          </h1>
          <p>
            Browse by outcome, task section or output style. Route costs depend
            on your project settings.
          </p>
        </div>
        <div className="browse-taxonomy">
          {(
            [
              {
                label: "Categories",
                key: "category",
                options: categories,
                Icon: Folder,
              },
              {
                label: "Sections",
                key: "section",
                options: sections,
                Icon: LayoutGrid,
              },
              {
                label: "Styles",
                key: "style",
                options: styles,
                Icon: Sparkles,
              },
            ] as const
          ).map(({ label, key, options, Icon }) => (
            <div className="taxonomy-column" key={key}>
              <div className="taxonomy-head">
                <Icon size={17} />
                <strong>{label}</strong>
              </div>
              {options.map((value) => (
                <button
                  key={value}
                  aria-pressed={p.filters[key] === value}
                  className={cx(p.filters[key] === value && "selected")}
                  onClick={() =>
                    p.setFilters((current) => ({
                      ...current,
                      [key]: current[key] === value ? "" : value,
                    }))
                  }
                >
                  <span>{value}</span>
                  {key === "category" && (
                    <small>
                      {outcomes.filter((o) => o.category === value).length}
                    </small>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="discover-section">
        <label className="outcome-search">
          <Search size={18} />
          <span className="sr-only">Search outcomes</span>
          <input
            value={p.filters.query}
            onChange={(e) =>
              p.setFilters((current) => ({ ...current, query: e.target.value }))
            }
            placeholder="Search outcomes, tools or topics"
          />
        </label>
        <FilterFields {...p} />
        <div className="browse-toolbar">
          <p role="status">
            {results.length} matching outcomes
            {p.previewsBusy ? " · calculating previews…" : ""}
          </p>
        </div>
        {p.previewError && (
          <p className="error" role="alert">
            {p.previewError}
          </p>
        )}
        <div className="project-grid">
          {results.map((item) => (
            <ProjectCard
              key={item.id}
              item={item}
              onUse={p.useOutcome}
              preview={p.previews[item.id]}
            />
          ))}
        </div>
        {!results.length && (
          <p className="empty-state">
            No matching outcomes. Try fewer filters. Unconfirmed costs are
            excluded from budget matches.
          </p>
        )}
      </section>
    </main>
  );
}
function CatalogSource({
  item,
  catalog,
}: {
  item: CatalogItem;
  catalog: Catalog | null;
}) {
  const check = catalog?.sourceChecks
    ?.filter((c) => c.source === item.sourceUrl)
    .at(-1);
  return (
    <div className="source-details">
      <SourceLink url={item.sourceUrl}>Official source</SourceLink>
      <small>Catalog record: {dateLabel(item.lastVerified)}</small>
      <small>
        Source check:{" "}
        {item.sourceCheck?.status ||
          check?.status ||
          (check?.ok === true
            ? "Reachable"
            : check?.ok === false
              ? "Failed"
              : "Not recorded")}
        {item.stale ? " · Stale record" : ""}
      </small>
      <small>
        {item.sourceCheck?.note ||
          check?.note ||
          "Source availability does not establish pricing or quality evidence."}
      </small>
    </div>
  );
}
function OffersView({
  catalog,
  offers,
  loading,
  error,
  retry,
  settings,
}: {
  catalog: Catalog | null;
  offers: Offer[];
  loading: boolean;
  error: string;
  retry: () => void;
  settings: Settings;
}) {
  const current = offers.filter(
    (o) =>
      (o.status === "verified" ||
        o.eligible === true ||
        o.status === "eligible") &&
      (!o.expiresAt ||
        (Number.isFinite(Date.parse(o.expiresAt)) &&
          Date.parse(o.expiresAt) > Date.now())),
  );
  const local = (catalog?.items || []).filter(
    (i) => i.access?.local && i.freeTier?.available,
  );
  const list = (value?: string | string[]) =>
    Array.isArray(value) ? value.join(" · ") : value;
  return (
    <main tabIndex={-1} id="main" className="page">
      <section className="hero">
        <div className="eyebrow">FREE ROUTES & CURRENT OFFERS</div>
        <h1>
          Spend less. <span>Still ship.</span>
        </h1>
        <p>
          Offers carry provider conditions. Confirm your account eligibility
          before using a quota; local routes come from the catalog.
        </p>
        <p className="filter-explanation">
          Region: {settings.region || "unspecified"} · Access:{" "}
          {settings.accessMode} · Hardware: {settings.hardware}. Check these
          settings against the provider terms.
        </p>
      </section>
      <section className="discover-section">
        <div className="section-title-row">
          <h2>Current conditional offers</h2>
          <button className="secondary" disabled={loading} onClick={retry}>
            {loading ? "Checking…" : "Check again"}
          </button>
        </div>
        {loading && <p role="status">Loading current offers…</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!loading && !current.length && (
          <p className="empty-state">
            No current offers with fresh source verification. Check the
            catalog’s local options below.
          </p>
        )}
        <div className="offer-grid">
          {current.map((offer) => {
            const item = catalog?.items.find((i) => i.id === offer.toolId);
            const fallback = catalog?.items.find(
              (i) => i.id === offer.fallbackToolId,
            );
            return (
              <article className="side-card offer-card" key={offer.id}>
                <span className="evidence-badge good">
                  Provider terms verified; eligibility must be checked
                </span>
                <h3>
                  {offer.title || offer.name || item?.name || "Catalog offer"}
                </h3>
                <p>
                  {offer.description ||
                    item?.freeTier?.note ||
                    "See source for terms."}
                </p>
                <dl>
                  <dt>Limits</dt>
                  <dd>
                    {list(offer.limits) ||
                      "Not recorded — confirm with provider"}
                  </dd>
                  <dt>Eligibility</dt>
                  <dd>
                    {list(offer.eligibility) ||
                      "Confirm account and region restrictions"}
                  </dd>
                  <dt>Expiry</dt>
                  <dd>
                    {offer.expiresAt
                      ? dateLabel(offer.expiresAt)
                      : "No expiry recorded; provider may change terms"}
                  </dd>
                  <dt>Check</dt>
                  <dd>
                    {offer.check?.status || "Status not recorded"} ·{" "}
                    {dateLabel(
                      offer.check?.checkedAt ||
                        offer.checkedAt ||
                        offer.lastVerified,
                    )}
                  </dd>
                  <dt>Fallback</dt>
                  <dd>
                    {offer.fallback ||
                      fallback?.name ||
                      "Use a suitable catalog route below or recalculate without this offer."}
                  </dd>
                </dl>
                {offer.check?.note && <p>{offer.check.note}</p>}
                <SourceLink url={offer.sourceUrl || item?.sourceUrl}>
                  Offer source and conditions
                </SourceLink>
              </article>
            );
          })}
        </div>
      </section>
      <section className="discover-section">
        <h2>Free local options in the catalog</h2>
        <p className="filter-explanation">
          A local installation does not by itself guarantee offline privacy.
          Check licenses, feature restrictions, hardware and network behavior
          before using sensitive data.
        </p>
        {!local.length && (
          <p className="empty-state">
            No free local route is recorded in the loaded catalog.
          </p>
        )}
        <div className="offer-grid">
          {local.map((item) => (
            <article className="side-card offer-card" key={item.id}>
              <span className="evidence-badge good">
                Catalog lists a free local option
              </span>
              <h3>{item.name}</h3>
              <p>{item.provider}</p>
              <p>
                {item.freeTier?.note || "Free edition conditions not recorded."}
              </p>
              <small>{item.pricing?.scope}</small>
              <p className="filter-explanation">{item.tasks.join(" · ")}</p>
              <CatalogSource item={item} catalog={catalog} />
              <p className="filter-explanation">
                Fallback: recalculate a route with compatible access and
                hardware if this option is unavailable.
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
function TaskEvidence({
  task,
  catalog,
}: {
  task: PlanTask;
  catalog: Catalog | null;
}) {
  const item = catalog?.items.find((i) => i.id === task.toolId);
  const status =
    task.quality?.status || item?.quality?.status || "not-recorded";
  const sourceCheck = catalog?.sourceChecks
    ?.filter((c) => c.source === (task.sourceUrl || item?.sourceUrl))
    .at(-1);
  const evidenceUrl = safeUrl(
    task.quality?.sourceUrl || item?.quality?.sourceUrl,
  );
  return (
    <div className="task-evidence">
      <SourceLink url={task.sourceUrl || item?.sourceUrl}>Source</SourceLink>
      <small>
        Catalog record: {dateLabel(task.lastVerified || item?.lastVerified)}
      </small>
      <small>
        Check:{" "}
        {task.sourceCheck?.status ||
          item?.sourceCheck?.status ||
          sourceCheck?.status ||
          (sourceCheck?.ok === true
            ? "Source reachable"
            : sourceCheck?.ok === false
              ? "Source check failed"
              : "Not recorded")}
      </small>
      <small>{sourceCheck?.note}</small>
      <small>
        Evidence:{" "}
        {status === "tested" && !evidenceUrl
          ? "Test claim lacks linked evidence"
          : status.replace(/-/g, " ")}
      </small>
      {task.quality?.note && <small>{task.quality.note}</small>}
      {evidenceUrl && (
        <SourceLink url={evidenceUrl}>Evidence reference</SourceLink>
      )}
    </div>
  );
}
function PlanView({
  plan,
  back,
  copyHandoff,
  downloadHandoff,
  catalog,
}: {
  plan: ProjectPlan;
  back: () => void;
  copyHandoff: () => void;
  downloadHandoff: () => void;
  catalog: Catalog | null;
}) {
  const [guide, setGuide] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const status = budgetStatus(plan);
  const label =
    status === "within"
      ? "Within budget"
      : status === "over"
        ? "Above budget"
        : "Budget unconfirmed";
  const pct =
    plan.budget > 0
      ? Math.min(100, (plan.knownCost / plan.budget) * 100)
      : plan.knownCost > 0
        ? 100
        : 0;
  const mark = (id: string) =>
    setCompleted((current) => ({ ...current, [id]: !current[id] }));
  return (
    <main tabIndex={-1} id="main" className="page plan-page">
      <button className="back-button" onClick={back}>
        <ArrowLeft size={16} /> Edit project
      </button>
      <section className="plan-header">
        <div>
          <div className="eyebrow">YOUR PLAN</div>
          <h1>{plan.projectName}</h1>
          <p>{plan.goal}</p>
          <div className="plan-tags">
            <span>{plan.kind}</span>
            <span>{plan.quantity} items</span>
            <span>{plan.preference}</span>
          </div>
        </div>
        <div className={cx("spend-card", status)}>
          <div className="spend-head">
            <span>{label}</span>
            <strong>
              {money(plan.knownCost)} / {money(plan.budget)}
            </strong>
          </div>
          <div className="progress" aria-hidden="true">
            <i style={{ width: pct + "%" }} />
          </div>
          <div className="spend-grid">
            <div>
              <small>Known subtotal</small>
              <strong>{money(plan.knownCost)}</strong>
            </div>
            <div>
              <small>
                {status === "over" ? "Over by" : "Ceiling less subtotal"}
              </small>
              <strong>{money(Math.abs(plan.budget - plan.knownCost))}</strong>
            </div>
            <div>
              <small>Unpriced steps</small>
              <strong>{plan.unpricedCount}</strong>
            </div>
          </div>
          <p>
            {status === "unconfirmed"
              ? "The known subtotal does not confirm that the total fits your budget. "
              : ""}
            {plan.costNote}
          </p>
          {plan.costBreakdown != null && (
            <details className="cost-breakdown">
              <summary>Cost breakdown</summary>
              <pre>{JSON.stringify(plan.costBreakdown, null, 2)}</pre>
            </details>
          )}
        </div>
      </section>
      {!!plan.warnings?.length && (
        <div className="plan-warnings" role="status">
          <strong>Before you start</strong>
          <ul>
            {plan.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      <section className="route-card">
        <div>
          <Sparkles size={20} />
          <div>
            <h2>The recommended route</h2>
            <p>
              Follow the default tools below. Expand the guide for instructions
              and validation.
            </p>
          </div>
        </div>
        <button
          className="primary compact"
          aria-expanded={guide}
          aria-controls="detailed-guide"
          onClick={() => setGuide(!guide)}
        >
          {guide ? "Hide guide" : "Guide me"}
          <ArrowRight size={16} />
        </button>
      </section>
      <section className="steps-section">
        <div className="section-title-row">
          <div>
            <h2>Prepare → Make → Check → Publish</h2>
            <p>
              Costs are project estimates. Source checks are separate from
              output testing.
            </p>
          </div>
          <span className="price-checked">
            Snapshot: {dateLabel(plan.priceCheckedAt)}
          </span>
        </div>
        <div className="plan-steps">
          {plan.tasks.map((task, index) => (
            <article className="plan-step" key={task.id}>
              <div className="step-number">{index + 1}</div>
              <div className="step-intro">
                <small>{task.stage}</small>
                <h3>{task.title}</h3>
                <p>{task.purpose}</p>
              </div>
              <div className="step-tool">
                <small>TOOL / MODEL</small>
                <strong>{task.toolName}</strong>
                <span>{task.provider}</span>
                <p>{task.reason}</p>
                {task.extraSpendReason && (
                  <p>Extra spend: {task.extraSpendReason}</p>
                )}
                <TaskEvidence task={task} catalog={catalog} />
              </div>
              <div className="step-output">
                <small>EXPECTED OUTPUT</small>
                <strong>{task.expectedOutput}</strong>
                <span className={"cost-pill " + task.costBasis}>
                  {task.costLabel}
                </span>
                <small>
                  Cost category: {task.costCategory || "Not supplied"}
                </small>
                <small>
                  {task.costBasis === "verified"
                    ? "Stored rate; workload cost is an estimate"
                    : task.costBasis === "owned"
                      ? "Owned access only; API billing is separate"
                      : task.costBasis === "unknown"
                        ? "Confirm before spending"
                        : task.costBasis}
                </small>
              </div>
              <div className="step-alts">
                <small>INFORMATIONAL ALTERNATIVES</small>
                {(task.alternatives || []).length ? (
                  task.alternatives.map((alt) => {
                    const more = alt.type === "upgrade";
                    const less =
                      alt.type === "cheaper" ||
                      (typeof alt.cost === "number" &&
                        typeof task.cost === "number" &&
                        alt.cost < task.cost);
                    return (
                      <div className="alternative" key={alt.toolId}>
                        <span
                          className={cx("alternative-tag", more && "upgrade")}
                        >
                          {less ? "Cheaper" : more ? "Upgrade" : "Alternative"}
                        </span>
                        <strong>{alt.name}</strong>
                        <small>{alt.costLabel}</small>
                        <small>
                          {alt.extraSpendReason ||
                            alt.reason ||
                            (more
                              ? "No task-specific upgrade benefit documented. Keep the default until a measurable improvement justifies the extra spend."
                              : less
                                ? "Lower estimated cost; check suitability and limits before changing the route."
                                : "Cost or benefit difference is unconfirmed.")}
                        </small>
                      </div>
                    );
                  })
                ) : (
                  <span className="no-alt">
                    No eligible alternative supplied
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section id="detailed-guide" className="detailed-guide" hidden={!guide}>
        <h2>Your execution guide</h2>
        <p className="filter-explanation">
          Checkboxes track your progress in this session; they do not assert
          that a tool or output has been tested.
        </p>
        {plan.tasks.map((task) => (
          <article className="guide-task" key={task.id}>
            <label className="guide-title">
              <input
                type="checkbox"
                checked={!!completed[task.id]}
                onChange={() => mark(task.id)}
              />
              <strong>
                {task.stage}: {task.title}
              </strong>
            </label>
            <p>{task.agentInstruction}</p>
            {!!task.assumptions?.length && (
              <div className="task-assumptions">
                <strong>Cost assumptions</strong>
                <ul>
                  {task.assumptions.map((assumption, i) => (
                    <li key={i}>{assumption}</li>
                  ))}
                </ul>
              </div>
            )}
            <strong>Validate before continuing</strong>
            {task.validation?.length ? (
              <div className="validation-list">
                {task.validation.map((value, i) => (
                  <label key={i}>
                    <input
                      type="checkbox"
                      checked={!!completed[task.id + "-" + i]}
                      onChange={() => mark(task.id + "-" + i)}
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="filter-explanation">
                No task validation supplied. Inspect the expected output against
                your project requirements before continuing.
              </p>
            )}
          </article>
        ))}
      </section>
      <section className="handoff-section">
        <div className="handoff-main">
          <div className="section-title-row">
            <div>
              <div className="eyebrow">AGENT HANDOFF</div>
              <h2>Give the next agent what it needs.</h2>
              <p>
                Project context, selected route, constraints and deliverables.
              </p>
            </div>
          </div>
          <pre tabIndex={0} aria-label="Markdown handoff">
            {plan.handoff}
          </pre>
          <div className="handoff-actions">
            <button className="primary" onClick={copyHandoff}>
              <Copy size={16} /> Copy handoff
            </button>
            <button className="secondary" onClick={downloadHandoff}>
              <Download size={16} /> Download .md
            </button>
          </div>
        </div>
        <aside className="plan-sidebar">
          {plan.planner && (
            <div className="side-card">
              <h3>Planner</h3>
              <p>
                {plan.planner.usedModelCall
                  ? "Refined by " + plan.planner.model
                  : "Deterministic router"}
              </p>
              <small>{plan.planner.rule}</small>
            </div>
          )}
          <div className="side-card">
            <h3>Sources</h3>
            {plan.sources?.length ? (
              plan.sources.map((source, i) => (
                <div className="source-details" key={source.url + "-" + i}>
                  <SourceLink url={source.url}>{source.name}</SourceLink>
                  <small>Recorded check: {dateLabel(source.checked)}</small>
                </div>
              ))
            ) : (
              <p>
                No sources supplied. Verify tool availability and costs before
                executing.
              </p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
async function requestPlan(
  body: unknown,
  signal?: AbortSignal,
  preview = false,
) {
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: signal || AbortSignal.timeout(60000),
  };
  const response = await fetch(
    preview ? "/api/plan/preview" : "/api/plan",
    init,
  );
  if (response.status === 404 && !preview)
    return api<{ plan: ProjectPlan }>("/api/plan-v2", init);
  let data: { plan?: ProjectPlan; error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("Planning API unavailable. Please try again.");
  }
  if (!response.ok || !data.plan)
    throw new Error(data.error || "The server could not build a plan.");
  return { plan: data.plan };
}
export default function App() {
  const [view, setView] = useState<View>(routeFromHash);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      return localStorage.getItem("handoff-theme") === "light"
        ? "light"
        : "dark";
    } catch {
      return "dark";
    }
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState(20);
  const [quantity, setQuantity] = useState(1);
  const [preference, setPreference] = useState<Preference>("value");
  const [ownedTools, setOwnedTools] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [planError, setPlanError] = useState("");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersBusy, setOffersBusy] = useState(false);
  const [offersError, setOffersError] = useState("");
  const [offerRevision, setOfferRevision] = useState(0);
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });
  const [previews, setPreviews] = useState<Record<string, ProjectPlan>>({});
  const [previewsBusy, setPreviewsBusy] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const planAbort = useRef<AbortController | null>(null);
  const previewAbort = useRef<AbortController | null>(null);
  const shell = useRef<HTMLDivElement>(null);
  const navigate = (next: View) => {
    location.hash = next;
    setView(next);
    top();
  };
  useEffect(() => {
    const onHash = () => {
      setView(routeFromHash());
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("handoff-theme", theme);
    } catch {
      /* Theme still works when storage is unavailable. */
    }
  }, [theme]);
  useEffect(() => {
    const controller = new AbortController();
    api<Catalog>("/api/catalog", { signal: controller.signal })
      .then((data) => {
        if (!Array.isArray(data.items))
          throw new Error("Catalog has no item list.");
        setCatalog(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setCatalogError(errorText(error));
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(
      () => setNotice(null),
      notice.error ? 12000 : 5000,
    );
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (view !== "deals") return;
    const controller = new AbortController();
    setOffersBusy(true);
    setOffersError("");
    const query = new URLSearchParams({
      region: settings.region,
      accessMode: settings.accessMode,
      hardware: settings.hardware,
      privacy: String(settings.privacy),
      quantity: String(quantity),
      durationSeconds: String(settings.durationSeconds),
      skillLevel: settings.skillLevel,
    });
    api<{ offers: Offer[] }>("/api/offers?" + query, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!Array.isArray(data.offers))
          throw new Error("Offer service did not return an offer list.");
        setOffers(data.offers);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setOffers([]);
          setOffersError(
            "Could not confirm current offers. " + errorText(error),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setOffersBusy(false);
      });
    return () => controller.abort();
  }, [view, settings, quantity, offerRevision]);
  useEffect(() => {
    previewAbort.current?.abort();
    previewAbort.current = null;
    setPreviews({});
    setPreviewsBusy(false);
    setPreviewError("");
  }, [
    settings,
    preference,
    ownedTools,
    budget,
    filters.budget,
    filters.free,
    filters.local,
    filters.api,
  ]);
  useEffect(
    () => () => {
      planAbort.current?.abort();
      previewAbort.current?.abort();
    },
    [],
  );
  const buildPlan = async () => {
    if (planning) return;
    if (
      !goal.trim() ||
      goal.trim().length < 3 ||
      !Number.isFinite(budget) ||
      budget < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      !Number.isInteger(settings.durationSeconds) ||
      settings.durationSeconds < 1
    ) {
      setPlanError(
        "Enter a project outcome, valid budget, quantity and duration.",
      );
      return;
    }
    const controller = new AbortController();
    planAbort.current = controller;
    setPlanning(true);
    setPlanError("");
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const data = await requestPlan(
        {
          goal: goal.trim(),
          budget,
          quantity,
          preference,
          ownedTools,
          ...settings,
        },
        controller.signal,
      );
      if (
        !data.plan ||
        !Array.isArray(data.plan.tasks) ||
        typeof data.plan.handoff !== "string"
      )
        throw new Error("The API returned an incomplete plan.");
      setPlan(data.plan);
      navigate("plan");
    } catch (error) {
      setPlanError(
        controller.signal.aborted
          ? "Planning timed out. Please try again."
          : errorText(error),
      );
    } finally {
      clearTimeout(timer);
      setPlanning(false);
    }
  };
  const calculate = async () => {
    if (previewsBusy) return;
    const controller = new AbortController();
    previewAbort.current = controller;
    setPreviewsBusy(true);
    setPreviewError("");
    setPreviews({});
    const timer = setTimeout(() => controller.abort(), 60000);
    let failures = 0;
    const results: Record<string, ProjectPlan> = {};
    try {
      for (const item of outcomes) {
        if (controller.signal.aborted) break;
        try {
          const { plan: preview } = await requestPlan(
            {
              goal: item.example,
              quantity: item.quantity,
              budget: filters.budget === "" ? budget : Number(filters.budget),
              preference: filters.free ? "free" : preference,
              ownedTools,
              ...settings,
              accessMode: filters.local
                ? "local"
                : filters.api
                  ? "api"
                  : settings.accessMode,
            },
            controller.signal,
            true,
          );
          if (!Array.isArray(preview?.tasks))
            throw new Error("Incomplete preview");
          results[item.id] = preview;
          setPreviews({ ...results });
        } catch {
          failures++;
        }
      }
      if (!controller.signal.aborted && failures)
        setPreviewError(
          failures +
            " preview(s) unavailable. Only confirmed totals are included in budget matches.",
        );
      if (controller.signal.aborted && previewAbort.current === controller)
        setPreviewError("Preview calculation timed out. Try again.");
    } finally {
      clearTimeout(timer);
      if (previewAbort.current === controller) setPreviewsBusy(false);
    }
  };
  const useOutcome = (item: Outcome) => {
    setGoal(item.example);
    setQuantity(item.quantity);
    setPlanError("");
    navigate("home");
    setTimeout(() => document.getElementById("project-goal")?.focus(), 0);
  };
  const toggleOwned = (tool: string) =>
    setOwnedTools((current) =>
      current.includes(tool)
        ? current.filter((value) => value !== tool)
        : [...current, tool],
    );
  const copyHandoff = async () => {
    if (!plan) return;
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(plan.handoff);
      setNotice({ text: "Handoff copied to clipboard.", error: false });
    } catch {
      setNotice({
        text: "Could not copy. Select the Markdown handoff manually or download the .md file.",
        error: true,
      });
    }
  };
  const downloadHandoff = () => {
    if (!plan) return;
    try {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/handoff/export";
      form.style.display = "none";
      for (const [name, value] of Object.entries({
        name: plan.projectName,
        handoff: plan.handoff,
      })) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
      form.remove();
      setNotice({
        text: "Markdown download requested. If your browser blocks downloads, copy the handoff.",
        error: false,
      });
    } catch {
      setNotice({
        text: "Could not request download. Copy the handoff instead.",
        error: true,
      });
    }
  };
  const discovery = {
    filters,
    setFilters,
    catalog,
    previews,
    previewsBusy,
    previewError,
    calculate,
    useOutcome,
  };
  const page =
    view === "plan" && plan ? (
      <PlanView
        key={plan.id}
        plan={plan}
        back={() => navigate("home")}
        copyHandoff={copyHandoff}
        downloadHandoff={downloadHandoff}
        catalog={catalog}
      />
    ) : view === "explore" ? (
      <ExploreView {...discovery} />
    ) : view === "deals" ? (
      <OffersView
        catalog={catalog}
        offers={offers}
        loading={offersBusy}
        error={offersError}
        retry={() => setOfferRevision((v) => v + 1)}
        settings={settings}
      />
    ) : (
      <HomeView
        goal={goal}
        setGoal={setGoal}
        budget={Number.isNaN(budget) ? NaN : budget}
        setBudget={setBudget}
        quantity={quantity}
        setQuantity={setQuantity}
        preference={preference}
        setPreference={setPreference}
        ownedTools={ownedTools}
        toggleOwned={toggleOwned}
        buildPlan={buildPlan}
        isPlanning={planning}
        useOutcome={useOutcome}
        settings={settings}
        setSettings={setSettings}
        explore={() => navigate("explore")}
        error={planError}
      />
    );
  return (
    <>
      <div ref={shell} className="app-shell" inert={searchOpen}>
        <a
          className="skip-link"
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main")?.scrollIntoView();
            document.getElementById("main")?.focus();
          }}
        >
          Skip to content
        </a>
        <Header
          view={view}
          navigate={navigate}
          theme={theme}
          setTheme={setTheme}
          openSearch={() => setSearchOpen(true)}
          hasPlan={!!plan}
        />
        {catalogError && (
          <p className="catalog-error" role="status">
            Catalog unavailable. Search still works for outcomes; catalog access
            filters need data. {catalogError}
          </p>
        )}
        {page}
        <footer className="footer">
          <Brand home={() => navigate("home")} />
          <span>
            Project-aware routing. Catalog records carry sources; unknown prices
            stay unknown.
          </span>
          <button onClick={() => setSearchOpen(true)}>
            <Search size={14} /> Search
          </button>
        </footer>
      </div>
      {notice && (
        <div
          className={cx("toast", notice.error && "toast-error")}
          role={notice.error ? "alert" : "status"}
        >
          <span>{notice.text}</span>
          <button
            aria-label="Dismiss notification"
            className="icon-button"
            onClick={() => setNotice(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {searchOpen && (
        <FilterModal
          {...discovery}
          close={() => setSearchOpen(false)}
          navigate={navigate}
        />
      )}
    </>
  );
}
