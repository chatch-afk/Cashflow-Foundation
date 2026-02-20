
import React from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function makeId() {
  if (typeof crypto !== "undefined" && crypto?.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function toNumber(maybe) {
  const n = Number(String(maybe || "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function fmtUSD(n) {
  return Number(n || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function MoneyInput({ value, onChange, placeholder = "0" }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500">$</span>
      <input
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
        className="border rounded-xl px-3 py-2 w-full bg-white"
      />
    </div>
  );
}

function PercentInput({ value, onChange, placeholder = "10" }) {
  return (
    <div className="flex items-center gap-2">
      <input
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.]/g, "");
          const n = Math.min(100, Math.max(0, Number(v || 0)));
          onChange(String(Number.isFinite(n) ? n : 0));
        }}
        className="border rounded-xl px-3 py-2 w-full bg-white"
      />
      <span className="text-slate-500">%</span>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={
        "relative inline-flex h-6 w-11 items-center rounded-full border transition " +
        (checked ? "bg-slate-900 border-slate-900" : "bg-slate-200 border-slate-200")
      }
      aria-pressed={checked}
    >
      <span
        className={
          "inline-block h-4 w-4 transform rounded-full bg-white transition " +
          (checked ? "translate-x-6" : "translate-x-1")
        }
      />
    </button>
  );
}

function monthOptions(startYear = 2026) {
  const out = [];
  for (let m = 1; m <= 12; m++) out.push(`${startYear}-${String(m).padStart(2, "0")}`);
  return out;
}
function monthAdd(yyyymm, add) {
  const [y, m] = String(yyyymm).split("-").map((x) => Number(x));
  const d = new Date(y, (m || 1) - 1, 1);
  d.setMonth(d.getMonth() + add);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthDiff(a, b) {
  const [ay, am] = String(a).split("-").map(Number);
  const [by, bm] = String(b).split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

function StatCard({ label, value, hint, emphasis = "default" }) {
  const valueClass =
    emphasis === "good"
      ? "text-emerald-700"
      : emphasis === "bad"
      ? "text-red-700"
      : "text-slate-900";
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${valueClass}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function defaultState() {
  return {
    currentMonth: "2026-01",
    businessIn: "90000",
    w2In: "10000",
    accounts: {
      familyOffice: { label: "Family Office", institution: "BoA", last4: "3446" },
      giving: { label: "Giving", institution: "BoA", last4: "1289" },
      lifestyle: { label: "Lifestyle", institution: "Chase", last4: "7721" },
      wealth: { label: "Wealth Creation", institution: "Fidelity", last4: "" },
    },
    givingIsDollar: false,
    givingPercent: "10",
    givingDollar: "1000",
    lifestyleMonthly: "20000",
    needs: [
      { id: "1", name: "Taxes", target: "12000", dueMonth: "2026-04", funded: "0", status: "open" },
      { id: "2", name: "Trip", target: "8000", dueMonth: "2026-06", funded: "0", status: "open" },
    ],
    showPaid: false,
    showAccounts: false,
  };
}

function AuthGate({ onAuthed }) {
  const [mode, setMode] = React.useState("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [msg, setMsg] = React.useState("");

  async function handle() {
    setMsg("");
    if (!supabase) return setMsg("Missing Supabase keys (.env.local / Vercel env vars).");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Account created. (Email confirmation is off in dev.)");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthed(data.session);
      }
    } catch (e) {
      setMsg(e.message || "Auth error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6">
        <div className="text-xl font-semibold">Cash Flow Foundation</div>
        <div className="text-sm text-slate-600 mt-1">
          {mode === "signup" ? "Create your account" : "Sign in to your dashboard"}
        </div>

        <div className="mt-4 space-y-3">
          <input
            className="border rounded-xl px-3 py-2 w-full"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="border rounded-xl px-3 py-2 w-full"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          <button
            type="button"
            onClick={handle}
            className="w-full rounded-xl bg-slate-900 text-white px-3 py-2 font-semibold hover:bg-slate-800"
          >
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMsg("");
              setMode((m) => (m === "signin" ? "signup" : "signin"));
            }}
            className="w-full rounded-xl border px-3 py-2 font-semibold hover:bg-slate-50"
          >
            {mode === "signup" ? "I already have an account" : "Create a new account"}
          </button>

          {msg ? (
            <div className="text-sm text-slate-700 bg-slate-50 border rounded-xl p-3">{msg}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saveStatus, setSaveStatus] = React.useState("Saved");
  const [state, setState] = React.useState(defaultState());

  React.useEffect(() => {
    let sub = null;

    async function init() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);

      sub = supabase.auth
        .onAuthStateChange((_event, newSession) => {
          setSession(newSession);
        })
        .data.subscription;

      setLoading(false);
    }

    init();

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (!session || !supabase) return;

    (async () => {
      setSaveStatus("Loading…");
      const userId = session.user.id;

      const { data, error } = await supabase
        .from("cashflow_states")
        .select("state")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        setSaveStatus("Loaded (new)");
        return;
      }

      if (data?.state) {
        setState((prev) => ({ ...prev, ...data.state }));
        setSaveStatus("Loaded");
      } else {
        await supabase.from("cashflow_states").upsert({ user_id: userId, state: defaultState() });
        setSaveStatus("Loaded (new)");
      }
    })();
  }, [session]);

  React.useEffect(() => {
    if (!session || !supabase) return;

    setSaveStatus("Saving…");
    const t = setTimeout(async () => {
      const userId = session.user.id;
      const payload = { user_id: userId, state, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("cashflow_states").upsert(payload);
      setSaveStatus(error ? "Save failed" : "Saved");
    }, 600);

    return () => clearTimeout(t);
  }, [state, session]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setState(defaultState());
  }

  if (loading) return <div className="min-h-screen bg-slate-50 p-6">Loading…</div>;
  if (!session) return <AuthGate onAuthed={setSession} />;

  const {
    currentMonth,
    businessIn,
    w2In,
    accounts,
    givingIsDollar,
    givingPercent,
    givingDollar,
    lifestyleMonthly,
    needs,
    showPaid,
    showAccounts,
  } = state;

  const inflow = toNumber(businessIn) + toNumber(w2In);

  const givingAmount = givingIsDollar
    ? Math.min(toNumber(givingDollar), inflow)
    : (toNumber(givingPercent) / 100) * inflow;

  const emergencyHeldInFO = 1 * toNumber(lifestyleMonthly);
  const lifestyleTargetBalance = 2 * toNumber(lifestyleMonthly);

  const activeNeeds = needs.filter((n) => n.status === "open");
  const paidNeeds = needs.filter((n) => n.status === "paid");

  const totalReservedOpen = activeNeeds.reduce((sum, n) => sum + toNumber(n.funded), 0);
  const totalPaidHistorical = paidNeeds.reduce((sum, n) => sum + toNumber(n.funded), 0);

  const inWindow = (n) => {
    if (!n || n.status !== "open") return false;
    const diff = monthDiff(currentMonth, n.dueMonth);
    return diff >= 0 && diff <= 5;
  };

  const months = monthOptions(2026);
  const windowNeeds = needs.filter(inWindow);

  const remainingTotal = windowNeeds.reduce((sum, n) => {
    const remaining = Math.max(0, toNumber(n.target) - toNumber(n.funded));
    return sum + remaining;
  }, 0);

  const availableAfterRequired = inflow - givingAmount - toNumber(lifestyleMonthly);
  const allocateToNeeds = Math.max(0, Math.min(availableAfterRequired, remainingTotal));
  const excess = availableAfterRequired - allocateToNeeds;

  function patch(p) {
    setState((s) => ({ ...s, ...p }));
  }
  function updateAccount(key, patchObj) {
    setState((s) => ({
      ...s,
      accounts: { ...s.accounts, [key]: { ...s.accounts[key], ...patchObj } },
    }));
  }
  function addNeed() {
    setState((s) => ({
      ...s,
      needs: [
        ...s.needs,
        { id: makeId(), name: "", target: "0", dueMonth: monthAdd(s.currentMonth, 1), funded: "0", status: "open" },
      ],
    }));
  }
  function updateNeed(id, patchObj) {
    setState((s) => ({ ...s, needs: s.needs.map((n) => (n.id === id ? { ...n, ...patchObj } : n)) }));
  }
  function removeNeed(id) {
    setState((s) => ({ ...s, needs: s.needs.filter((n) => n.id !== id) }));
  }
  function markPaid(id) {
    setState((s) => ({
      ...s,
      needs: s.needs.map((n) => (n.id === id ? { ...n, status: "paid", paidMonth: s.currentMonth } : n)),
    }));
  }
  function reopenNeed(id) {
    setState((s) => ({
      ...s,
      needs: s.needs.map((n) => (n.id === id ? { ...n, status: "open", paidMonth: undefined } : n)),
    }));
  }
  function runMonthlyAllocation() {
    const sorted = [...needs].sort((a, b) => monthDiff(a.dueMonth, b.dueMonth));
    let remainingPool = allocateToNeeds;

    const next = sorted.map((n) => {
      if (!inWindow(n)) return n;
      if (remainingPool <= 0) return n;

      const remaining = Math.max(0, toNumber(n.target) - toNumber(n.funded));
      const add = Math.min(remaining, remainingPool);
      remainingPool -= add;

      return { ...n, funded: String(toNumber(n.funded) + add) };
    });

    const byId = new Map(next.map((n) => [n.id, n]));
    setState((s) => ({ ...s, needs: s.needs.map((n) => byId.get(n.id) ?? n) }));
  }
  function rolloverToNextMonth() {
    patch({ currentMonth: monthAdd(currentMonth, 1) });
  }

  // Instruction UX
  const fromFamilyOffice = `Family Office (${accounts.familyOffice.institution || "—"} •••• ${accounts.familyOffice.last4 || "—"})`;
  const toGiving = `Giving (${accounts.giving.institution || "—"} •••• ${accounts.giving.last4 || "—"})`;
  const toLifestyle = `Lifestyle (${accounts.lifestyle.institution || "—"} •••• ${accounts.lifestyle.last4 || "—"})`;
  const toWealth = `Wealth Creation (${accounts.wealth.institution || "—"}${accounts.wealth.last4 ? ` •••• ${accounts.wealth.last4}` : ""})`;

  const transfers = [
    { from: "Family Office", to: toGiving, amount: Math.max(0, givingAmount), purpose: "Charitable giving transfer" },
    { from: "Family Office", to: toLifestyle, amount: toNumber(lifestyleMonthly), purpose: "Lifestyle monthly funding" },
    { from: "Family Office", to: "(Internal) Needs reserve", amount: allocateToNeeds, purpose: "Earmark for upcoming needs (stays in Family Office)" },
    { from: "Family Office", to: toWealth, amount: excess, purpose: "Excess cash to wealth creation" },
  ];

  const actionPlanSteps = [
    `Confirm this month’s inflow: ${fmtUSD(inflow)} (Business + W-2/Other).`,
    `Transfer giving: ${fmtUSD(Math.max(0, givingAmount))} → ${toGiving}.`,
    `Transfer lifestyle: ${fmtUSD(toNumber(lifestyleMonthly))} → ${toLifestyle} (target 2× spend buffer: ${fmtUSD(lifestyleTargetBalance)}).`,
    `Fund upcoming needs: click “Fund needs this month” to allocate ${fmtUSD(allocateToNeeds)} across next-6-month items.`,
    `Transfer excess: ${fmtUSD(excess)} → ${toWealth}.`,
    `Proof of completion: keep screenshots of transfers + bank balances.`,
  ];

  const copyText = [
    `CASH FLOW FOUNDATION — ${currentMonth}`,
    ``,
    `FROM: ${fromFamilyOffice}`,
    ``,
    `THIS MONTH ACTION PLAN`,
    ...actionPlanSteps.map((s, i) => `${i + 1}. ${s}`),
    ``,
    `MONTHLY TRANSFER INSTRUCTIONS`,
    ...transfers.map((t) => `- From ${t.from} → To ${t.to} | Amount ${fmtUSD(t.amount)} | ${t.purpose}`),
  ].join("\n");

  async function copyInstructions() {
    try {
      await navigator.clipboard.writeText(copyText);
      alert("Copied.");
    } catch {
      alert("Copy failed. (Browser blocked clipboard.)");
    }
  }

  function printInstructions() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xl font-semibold">Cash Flow Foundation</div>
              <div className="text-sm text-slate-600">Monthly cash allocation dashboard</div>
              <div className="text-xs text-slate-500 mt-1">
                {session.user.email} · {saveStatus}
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <div className="text-xs font-semibold text-slate-500">Month</div>
              <select
                value={currentMonth}
                onChange={(e) => patch({ currentMonth: e.target.value })}
                className="border rounded-xl px-3 py-2 text-sm bg-white"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <button type="button" onClick={rolloverToNextMonth} className="text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50">
                Next month →
              </button>

              <button type="button" onClick={() => patch({ showAccounts: !showAccounts })} className="text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50">
                {showAccounts ? "Hide" : "Show"} accounts
              </button>

              <button type="button" onClick={signOut} className="text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50">
                Log out
              </button>
            </div>

            <div className="flex items-stretch gap-3">
              <div className="rounded-xl border bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">Inflow</div>
                <div className="mt-1 font-semibold">{fmtUSD(inflow)}</div>
              </div>
              <div className="rounded-xl border bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">Excess</div>
                <div className={"mt-1 font-semibold " + (excess >= 0 ? "text-emerald-700" : "text-red-700")}>
                  {fmtUSD(excess)}
                </div>
              </div>
            </div>
          </div>

          {showAccounts ? (
            <div className="mt-4 rounded-2xl border bg-white p-4">
              <div className="text-sm font-semibold">Linked Accounts</div>
              <div className="text-xs text-slate-500">Setup once … used for transfer instructions</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {Object.keys(accounts).map((k) => (
                  <div key={k} className="rounded-xl border bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{accounts[k].label}</div>
                      <div className="text-xs text-slate-500">Required</div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <input
                        value={accounts[k].institution}
                        onChange={(e) => updateAccount(k, { institution: e.target.value })}
                        placeholder="Bank"
                        className="border rounded-xl px-3 py-2 text-sm col-span-2 bg-white"
                      />
                      <input
                        value={accounts[k].last4}
                        onChange={(e) =>
                          updateAccount(k, { last4: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })
                        }
                        placeholder="Last 4"
                        className="border rounded-xl px-3 py-2 text-sm bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-500">Family Office is savings-only (no debit) … transfers only.</div>
            </div>
          ) : null}
        </div>

        {/* Action Plan */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-lg font-semibold">This Month Action Plan</div>
              <div className="text-xs text-slate-500 mt-1">
                Use this checklist each month. Then keep screenshots as proof of completion.
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button type="button" onClick={copyInstructions} className="text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50">
                Copy
              </button>
              <button type="button" onClick={printInstructions} className="text-sm font-semibold rounded-xl px-3 py-2 bg-slate-900 text-white hover:bg-slate-800">
                Print / PDF
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {actionPlanSteps.map((s, idx) => (
              <div key={idx} className="rounded-xl border bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-500">Step {idx + 1}</div>
                <div className="mt-1 text-sm text-slate-900">{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Emergency minimum" value={fmtUSD(emergencyHeldInFO)} hint="Required balance in Family Office" />
          <StatCard label="Reserved for open needs" value={fmtUSD(totalReservedOpen)} hint="Counts toward Family Office reserve" />
          <StatCard label="Remaining needs (next 6 months)" value={fmtUSD(remainingTotal)} hint="Gap still to fund" />
          <StatCard label="Excess after rules" value={fmtUSD(excess)} hint="Available for wealth creation" emphasis={excess >= 0 ? "good" : "bad"} />
        </div>

        {/* Inputs */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-semibold">Cash In</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-slate-500">Business</div>
                <div className="mt-2">
                  <MoneyInput value={businessIn} onChange={(v) => patch({ businessIn: v })} />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">W-2 / Other</div>
                <div className="mt-2">
                  <MoneyInput value={w2In} onChange={(v) => patch({ w2In: v })} />
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-xl border bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">Total inflow</div>
              <div className="mt-1 text-lg font-semibold">{fmtUSD(inflow)}</div>
              <div className="mt-1 text-xs text-slate-500">All cash lands in Family Office first</div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Giving rule</div>
                <div className="text-xs text-slate-500">Percentage of inflow … or fixed monthly amount</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={"text-xs " + (!givingIsDollar ? "font-semibold text-slate-900" : "text-slate-500")}>%</span>
                <Toggle checked={givingIsDollar} onChange={(v) => patch({ givingIsDollar: v })} />
                <span className={"text-xs " + (givingIsDollar ? "font-semibold text-slate-900" : "text-slate-500")}>$</span>
              </div>
            </div>

            <div className="mt-3">
              {!givingIsDollar ? (
                <PercentInput value={givingPercent} onChange={(v) => patch({ givingPercent: v })} />
              ) : (
                <MoneyInput value={givingDollar} onChange={(v) => patch({ givingDollar: v })} placeholder="1000" />
              )}
            </div>

            <div className="mt-3 rounded-xl border bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">This month … giving transfer</div>
              <div className="mt-1 text-lg font-semibold">{fmtUSD(Math.max(0, givingAmount))}</div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-semibold">Lifestyle rule</div>
            <div className="text-xs text-slate-500 mt-1">Monthly transfer to Lifestyle checking</div>
            <div className="mt-3">
              <MoneyInput value={lifestyleMonthly} onChange={(v) => patch({ lifestyleMonthly: v })} placeholder="20000" />
            </div>
            <div className="mt-2 text-xs text-slate-500">Target Lifestyle balance (2× spend): {fmtUSD(lifestyleTargetBalance)}</div>
          </div>
        </div>

        {/* Needs */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold">Upcoming Cash Needs (Next 6 Months)</div>
              <div className="text-xs text-slate-500 mt-1">Funded balances carry forward … mark Paid to archive and stop rolling.</div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button type="button" onClick={addNeed} className="text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50">
                + Add item
              </button>
              <button type="button" onClick={runMonthlyAllocation} className="text-sm font-semibold rounded-xl px-3 py-2 bg-slate-900 text-white hover:bg-slate-800">
                Fund needs this month
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Need</th>
                  <th className="pb-2">Due</th>
                  <th className="pb-2">Target</th>
                  <th className="pb-2">Already funded</th>
                  <th className="pb-2">Remaining</th>
                  <th className="pb-2 print:hidden">Paid</th>
                  <th className="pb-2 print:hidden" />
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {activeNeeds.map((n) => {
                  const remaining = Math.max(0, toNumber(n.target) - toNumber(n.funded));
                  const isInWindow = inWindow(n);
                  return (
                    <tr key={n.id} className={"border-t " + (isInWindow ? "" : "opacity-50")}>
                      <td className="py-2 pr-2">
                        <input
                          value={n.name}
                          onChange={(e) => updateNeed(n.id, { name: e.target.value })}
                          placeholder="e.g. Taxes, Vehicle, Tuition"
                          className="border rounded-xl px-3 py-2 w-full bg-white"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={n.dueMonth}
                          onChange={(e) => updateNeed(n.id, { dueMonth: e.target.value })}
                          className="border rounded-xl px-3 py-2 bg-white"
                        >
                          {months.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2 w-[170px]">
                        <MoneyInput value={n.target} onChange={(v) => updateNeed(n.id, { target: v })} />
                      </td>
                      <td className="py-2 pr-2 w-[170px]">
                        <MoneyInput value={n.funded} onChange={(v) => updateNeed(n.id, { funded: v })} />
                      </td>
                      <td className="py-2 pr-2 font-semibold">{fmtUSD(remaining)}</td>
                      <td className="py-2 pr-2 print:hidden">
                        <button type="button" onClick={() => markPaid(n.id)} className="text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50">
                          Mark paid
                        </button>
                      </td>
                      <td className="py-2 text-right print:hidden">
                        <button type="button" onClick={() => removeNeed(n.id)} className="text-slate-500 hover:text-slate-900" title="Remove">
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">This month … suggested funding</div>
              <div className="mt-1 text-lg font-semibold">{fmtUSD(allocateToNeeds)}</div>
            </div>
            <div className="rounded-xl border bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">Available after giving + lifestyle</div>
              <div className="mt-1 text-lg font-semibold">{fmtUSD(availableAfterRequired)}</div>
            </div>
            <div className="rounded-xl border bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">Paid (historical only)</div>
              <div className="mt-1 text-lg font-semibold">{fmtUSD(totalPaidHistorical)}</div>
            </div>
          </div>
        </div>

        {/* Transfer Instructions */}
        <div className="rounded-2xl border bg-white p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold">Monthly Transfer Instructions</div>
              <div className="text-xs text-slate-500 mt-1">Run monthly … keep screenshots as proof of completion.</div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button type="button" onClick={copyInstructions} className="text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50">
                Copy
              </button>
              <button type="button" onClick={printInstructions} className="text-sm font-semibold rounded-xl px-3 py-2 bg-slate-900 text-white hover:bg-slate-800">
                Print / PDF
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs text-slate-500">From: {fromFamilyOffice}</div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">From</th>
                  <th className="pb-2">To</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {transfers.map((t, idx) => (
                  <tr key={idx} className={"border-t " + (idx === 3 ? "font-semibold" : "")}>
                    <td className="py-2">{t.from}</td>
                    <td className="py-2">{t.to}</td>
                    <td className={"py-2 " + (idx === 3 ? (t.amount >= 0 ? "text-emerald-700" : "text-red-700") : "")}>
                      {fmtUSD(t.amount)}
                    </td>
                    <td className="py-2">{t.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Tip: Click “Fund needs this month” to update funded balances.
          </div>
        </div>
      </div>
    </div>
  );
}

