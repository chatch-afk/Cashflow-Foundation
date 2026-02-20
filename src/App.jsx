import React from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Cashflow Foundation V2 (Supabase Auth + per-user saved state)
 * - Login required
 * - Home menu after login
 * - Working Capital (first) + Cash Flow (second)
 * - Transfer checkboxes tracked per-month
 * - State saved per-user in Supabase table: cashflow_states (user_id, state jsonb, updated_at)
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ---------- helpers ----------
function makeId() {
  if (typeof crypto !== "undefined" && crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function toNumber(maybe) {
  const n = Number(String(maybe ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function fmtUSD(n) {
  return Number(n || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
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

// ---------- UI atoms ----------
function isEmptyValue(v) {
  return String(v ?? "").trim() === "";
}

function MoneyInput({ value, onChange, placeholder = "0", required = false }) {
  const highlight = required && isEmptyValue(value) ? "border-amber-400 bg-amber-50" : "";
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500">$</span>
      <input
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
        className={`border rounded-xl px-3 py-2 w-full bg-white ${highlight}`}
      />
    </div>
  );
}

function PercentInput({ value, onChange, placeholder = "10", required = false }) {
  const highlight = required && isEmptyValue(value) ? "border-amber-400 bg-amber-50" : "";
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
        className={`border rounded-xl px-3 py-2 w-full bg-white ${highlight}`}
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

function Check({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-2 select-none cursor-pointer">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300"
        aria-label={label}
      />
      <span className={"text-xs font-semibold " + (checked ? "text-emerald-700" : "text-slate-500")}>
        {checked ? "Done" : "Do"}
      </span>
    </label>
  );
}

function StatCard({ label, value, hint, emphasis = "default" }) {
  const valueClass =
    emphasis === "good" ? "text-emerald-700" : emphasis === "bad" ? "text-red-700" : "text-slate-900";
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${valueClass}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function ToolCard({ title, subtitle, bullets, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-3xl border bg-white p-6 hover:bg-slate-50 transition shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
        </div>
        <div className="shrink-0 rounded-2xl border bg-slate-900 text-white px-4 py-2 text-sm font-semibold">
          Open →
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {bullets.map((b, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-300" />
            <span>{b}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function TransferTable({ title, subtitle, rows, doneMap, onToggle, onMarkAll }) {
  const total = rows.length;
  const doneCount = rows.reduce((acc, r) => acc + (doneMap?.[r.key] ? 1 : 0), 0);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle ? <div className="text-xs text-slate-500 mt-1">{subtitle}</div> : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500">
            {doneCount}/{total} done
          </div>
          <button
            type="button"
            onClick={onMarkAll}
            className="text-xs font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50"
          >
            Mark all done
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2">Step</th>
              <th className="pb-2">Instruction</th>
              <th className="pb-2 text-right">Amount</th>
              <th className="pb-2 text-right">Done</th>
            </tr>
          </thead>
          <tbody className="text-slate-800">
            {rows.map((r) => (
              <tr key={r.key} className="border-t">
                <td className="py-3 pr-2 font-semibold whitespace-nowrap">{r.stepLabel}</td>
                <td className={"py-3 pr-2 " + (doneMap?.[r.key] ? "text-slate-500 line-through" : "")}>{r.title}</td>
                <td
                  className={
                    "py-3 pr-2 text-right font-semibold whitespace-nowrap " +
                    (r.emphasis === "good" ? "text-emerald-700" : r.emphasis === "bad" ? "text-red-700" : "")
                  }
                >
                  {r.amount}
                </td>
                <td className="py-3 text-right">
                  <Check checked={!!doneMap?.[r.key]} onChange={(v) => onToggle(r.key, v)} label={`Mark ${r.stepLabel} done`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- app state ----------
function defaultState() {
  return {
    month: "2026-02",
    activeTool: "home",
    suggestedBusinessIn: 0,

    // Done checkboxes per-month
    // { [month]: { workingCapital: {key:boolean}, cashflow: {key:boolean} } }
    transferDone: {},

    workingCapital: {
      operatingExpenses: "",
      inventoryCost: "",
      daysPerMonth: "",
      avgCollectionDays: "",
      businessChecking: "",
      reserveAccountBalance: "",
      bufferDays: "",
      reserveDays: "",
    },

    cashflow: {
      businessIn: "",
      w2In: "",
      givingIsDollar: true,
      givingPercent: "",
      givingDollar: "",
      lifestyleMonthly: "",
      needs: [
        { id: "1", name: "Taxes", target: "12000", dueMonth: "2026-04", funded: "0", status: "open" },
        { id: "2", name: "Trip", target: "8000", dueMonth: "2026-06", funded: "0", status: "open" },
      ],
    },
  };
}

// ---------- Auth ----------
function AuthGate() {
  const [mode, setMode] = React.useState("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [msg, setMsg] = React.useState("");

  async function handle() {
    setMsg("");
    if (!supabase) return setMsg("Missing Supabase keys (.env.local).");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Account created. If email confirmation is enabled, check your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setMsg(e.message || "Auth error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6">
        <div className="text-xl font-semibold">Cash Flow Foundation</div>
        <div className="text-sm text-slate-600 mt-1">{mode === "signup" ? "Create your account" : "Sign in to your dashboard"}</div>

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

          {msg ? <div className="text-sm text-slate-700 bg-slate-50 border rounded-xl p-3">{msg}</div> : null}
        </div>
      </div>
    </div>
  );
}

// ---------- layout ----------
function TopBar({ email, saveStatus, month, setMonth, activeTool, setActiveTool, onLogout }) {
  const months = monthOptions(2026);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xl font-semibold">Cash Flow Foundation</div>
          <div className="text-sm text-slate-600">Simple monthly money moves</div>
          <div className="text-xs text-slate-500 mt-1">{email} · {saveStatus}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTool("home")}
            className={
              "text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50 " +
              (activeTool === "home" ? "bg-slate-50" : "bg-white")
            }
          >
            Home
          </button>

          {/* Working Capital first */}
          <button
            type="button"
            onClick={() => setActiveTool("workingCapital")}
            className={
              "text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50 " +
              (activeTool === "workingCapital" ? "bg-slate-50" : "bg-white")
            }
          >
            Working Capital
          </button>
          <button
            type="button"
            onClick={() => setActiveTool("cashflow")}
            className={
              "text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50 " +
              (activeTool === "cashflow" ? "bg-slate-50" : "bg-white")
            }
          >
            Cash Flow
          </button>

          <div className="w-px h-7 bg-slate-200 mx-1" />

          <div className="text-xs font-semibold text-slate-500">Month</div>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button type="button" onClick={() => setMonth((m) => monthAdd(m, 1))} className="text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50">
            Next month →
          </button>

          <div className="w-px h-7 bg-slate-200 mx-1" />

          <button type="button" onClick={onLogout} className="text-sm font-semibold rounded-xl border px-3 py-2 hover:bg-slate-50">
            Log out
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">This month’s instructions</div>
        <div className="mt-1">1) Working Capital … 2) Cash Flow … 3) Check off transfers as you do them.</div>
      </div>
    </div>
  );
}

function HomeChooser({ onPick }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolCard
        title="Working Capital"
        subtitle="Keep a 45-day buffer … move excess cash with confidence"
        bullets={["Calculate 45-day working capital goal", "Compare to today’s balances", "Generate step-by-step move instructions"]}
        onClick={() => onPick("workingCapital")}
      />
      <ToolCard
        title="Cash Flow Foundation"
        subtitle="Monthly cash allocation dashboard"
        bullets={["Set inflow … giving … lifestyle", "Track big upcoming cash needs (6 months)", "Suggested funding + transfer checklist"]}
        onClick={() => onPick("cashflow")}
      />
    </div>
  );
}

// ---------- Tools ----------
function WorkingCapitalTool({ month, wc, setWc, onSuggestBusinessIn, doneMap, onToggleDone, onMarkAllDone }) {
  const monthlySpend = toNumber(wc.operatingExpenses) + toNumber(wc.inventoryCost);
  const perDay = toNumber(wc.daysPerMonth) > 0 ? monthlySpend / toNumber(wc.daysPerMonth) : 0;

  const wcGoal = perDay * toNumber(wc.bufferDays);
  const reserveGoal = perDay * toNumber(wc.reserveDays);

  const businessBalance = toNumber(wc.businessChecking);
  const reserveBalance = toNumber(wc.reserveAccountBalance);

  const businessShortOrExcess = businessBalance - wcGoal;
  const availableFromBusiness = Math.max(0, businessShortOrExcess);

  const reserveShort = Math.max(0, reserveGoal - reserveBalance);
  const moveToReserve = Math.min(availableFromBusiness, reserveShort);

  const moveToFamilyOffice = Math.max(0, availableFromBusiness - moveToReserve);

  React.useEffect(() => {
    onSuggestBusinessIn(moveToFamilyOffice > 0 ? moveToFamilyOffice : 0);
  }, [moveToFamilyOffice, onSuggestBusinessIn]);

  const businessDelta = businessShortOrExcess;
  const reserveDelta = reserveBalance - reserveGoal;

  const businessAction =
    businessDelta < 0
      ? `Add ${fmtUSD(Math.abs(businessDelta))} to Business Checking to reach your buffer.`
      : moveToReserve > 0
      ? `Move ${fmtUSD(moveToReserve)} from Business Checking → Business Reserve.`
      : moveToFamilyOffice > 0
      ? `Move ${fmtUSD(moveToFamilyOffice)} from Business Checking → Family Office.`
      : "Business Checking is fully funded.";

  const reserveAction =
    reserveDelta < 0
      ? `Business Reserve needs ${fmtUSD(Math.abs(reserveDelta))} to reach target.`
      : moveToFamilyOffice > 0
      ? `After topping off reserve, ${fmtUSD(moveToFamilyOffice)} flows to Family Office.`
      : "Business Reserve is fully funded.";

  const transferRows = [
    {
      key: "wc_reserve",
      stepLabel: "1",
      title: moveToReserve > 0 ? `Move ${fmtUSD(moveToReserve)} from Business Checking → Business Reserve` : "No move needed",
      amount: fmtUSD(Math.max(0, moveToReserve)),
      emphasis: moveToReserve > 0 ? "good" : "default",
    },
    {
      key: "wc_familyOffice",
      stepLabel: "2",
      title: moveToFamilyOffice > 0 ? `Move ${fmtUSD(moveToFamilyOffice)} from Business Checking → Family Office` : "No excess available",
      amount: fmtUSD(Math.max(0, moveToFamilyOffice)),
      emphasis: moveToFamilyOffice > 0 ? "good" : "default",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-lg font-semibold">Working Capital</div>
            <div className="text-xs text-slate-500 mt-1">Set your buffer … enter balances … get step-by-step move instructions.</div>
          </div>
          <div className="text-xs text-slate-500">Month: {month}</div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-semibold">Inputs</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">Operating expenses / month</div>
                <div className="mt-2">
                  <MoneyInput value={wc.operatingExpenses} onChange={(v) => setWc((s) => ({ ...s, operatingExpenses: v }))} placeholder="55000" required />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Inventory cost / month</div>
                <div className="mt-2">
                  <MoneyInput value={wc.inventoryCost} onChange={(v) => setWc((s) => ({ ...s, inventoryCost: v }))} placeholder="0" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Days / month</div>
                  <input
                    value={wc.daysPerMonth}
                    onChange={(e) => setWc((s) => ({ ...s, daysPerMonth: e.target.value.replace(/[^0-9]/g, "") }))}
                    className={
                      "mt-2 border rounded-xl px-3 py-2 w-full bg-white " +
                      (isEmptyValue(wc.daysPerMonth) ? "border-amber-400 bg-amber-50" : "")
                    }
                    placeholder="30"
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Avg collection days</div>
                  <input
                    value={wc.avgCollectionDays}
                    onChange={(e) => setWc((s) => ({ ...s, avgCollectionDays: e.target.value.replace(/[^0-9]/g, "") }))}
                    className={
                      "mt-2 border rounded-xl px-3 py-2 w-full bg-white " +
                      (isEmptyValue(wc.avgCollectionDays) ? "border-amber-400 bg-amber-50" : "")
                    }
                    placeholder="1"
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {toNumber(wc.avgCollectionDays) <= 1 ? "Collections are fast (≈1 day)." : `Collections average ≈${toNumber(wc.avgCollectionDays)} days.`}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-semibold">Targets</div>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Buffer days (business)</div>
                  <input
                    value={wc.bufferDays}
                    onChange={(e) => setWc((s) => ({ ...s, bufferDays: e.target.value.replace(/[^0-9]/g, "") }))}
                    className={
                      "mt-2 border rounded-xl px-3 py-2 w-full bg-white " +
                      (isEmptyValue(wc.bufferDays) ? "border-amber-400 bg-amber-50" : "")
                    }
                    placeholder="45"
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Reserve days (personal)</div>
                  <input
                    value={wc.reserveDays}
                    onChange={(e) => setWc((s) => ({ ...s, reserveDays: e.target.value.replace(/[^0-9]/g, "") }))}
                    className={
                      "mt-2 border rounded-xl px-3 py-2 w-full bg-white " +
                      (isEmptyValue(wc.reserveDays) ? "border-amber-400 bg-amber-50" : "")
                    }
                    placeholder="45"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-xl border bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500">Working capital per day</div>
                  <div className="mt-1 text-lg font-semibold">{fmtUSD(perDay)}</div>
                </div>
                <div className="rounded-xl border bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500">Working Capital Goal</div>
                  <div className="mt-1 text-lg font-semibold">{fmtUSD(wcGoal)}</div>
                </div>
                <div className="rounded-xl border bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500">Business Reserve Goal</div>
                  <div className="mt-1 text-lg font-semibold">{fmtUSD(reserveGoal)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-semibold">Today’s Balances</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">Business Checking balance</div>
                <div className="mt-2">
                  <MoneyInput value={wc.businessChecking} onChange={(v) => setWc((s) => ({ ...s, businessChecking: v }))} placeholder="0" required />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Business Reserve (Personal Account) balance</div>
                <div className="mt-2">
                  <MoneyInput value={wc.reserveAccountBalance} onChange={(v) => setWc((s) => ({ ...s, reserveAccountBalance: v }))} placeholder="0" required />
                </div>
              </div>

              <div className="mt-2 rounded-xl border bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-500">Business delta vs goal</div>
                <div className={"mt-1 text-lg font-semibold " + (businessDelta >= 0 ? "text-emerald-700" : "text-red-700")}>
                  {fmtUSD(businessDelta)}
                </div>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-500">Business Reserve delta vs goal</div>
                <div className={"mt-1 text-lg font-semibold " + (reserveDelta >= 0 ? "text-emerald-700" : "text-red-700")}>
                  {fmtUSD(reserveDelta)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold">Instructions</div>
            <div className="text-xs text-slate-500 mt-1">Follow the waterfall. You only move money when buffers are satisfied.</div>
          </div>
          <div className="text-xs text-slate-500">Tip: If you’re short, you don’t move money.</div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="text-sm font-semibold">Business Checking</div>
            <div className="text-xs text-slate-500 mt-1">Goal: {fmtUSD(wcGoal)}</div>
            <div className="mt-3 text-sm text-slate-800">{businessAction}</div>
            <div className="mt-3">
              <div className="text-xs text-slate-500">Excess available from Business Checking</div>
              <div className={"mt-1 text-lg font-semibold " + (businessDelta >= 0 ? "text-emerald-700" : "text-red-700")}>
                {businessDelta >= 0 ? fmtUSD(businessDelta) : fmtUSD(0)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="text-sm font-semibold">Business Reserve (Personal Account)</div>
            <div className="text-xs text-slate-500 mt-1">Goal: {fmtUSD(reserveGoal)}</div>
            <div className="mt-3 text-sm text-slate-800">{reserveAction}</div>
            <div className="mt-3">
              <div className="text-xs text-slate-500">Reserve delta</div>
              <div className={"mt-1 text-lg font-semibold " + (reserveDelta >= 0 ? "text-emerald-700" : "text-red-700")}>
                {reserveDelta >= 0 ? fmtUSD(reserveDelta) : fmtUSD(0)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <TransferTable
            title="Transfer Instructions"
            subtitle="Check off each transfer as you complete it at the bank."
            rows={transferRows}
            doneMap={doneMap}
            onToggle={onToggleDone}
            onMarkAll={onMarkAllDone}
          />

          <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
            <div className="text-sm font-semibold">Cash Flow Impact</div>
            <div className="text-xs text-slate-500 mt-1">This number flows into Cash Flow as “Business Cash In”.</div>
            <div className="mt-2 text-lg font-semibold">{fmtUSD(Math.max(0, moveToFamilyOffice))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CashflowTool({ month, cf, setCf, suggestedBusinessIn, doneMap, onToggleDone, onMarkAllDone }) {
  // Prefill from Working Capital (user can override after)
  React.useEffect(() => {
    if (Number.isFinite(suggestedBusinessIn) && suggestedBusinessIn >= 0) {
      setCf((s) => ({ ...s, businessIn: String(Math.round(suggestedBusinessIn)) }));
    }
  }, [suggestedBusinessIn, setCf]);

  const inflow = toNumber(cf.businessIn) + toNumber(cf.w2In);

  const givingAmount = cf.givingIsDollar
    ? Math.min(toNumber(cf.givingDollar), inflow)
    : (toNumber(cf.givingPercent) / 100) * inflow;

  const emergencyHeldInFO = 1 * toNumber(cf.lifestyleMonthly);
  const lifestyleTargetBalance = 2 * toNumber(cf.lifestyleMonthly);

  const inWindow = (n) => {
    if (!n || n.status !== "open") return false;
    const diff = monthDiff(month, n.dueMonth);
    return diff >= 0 && diff <= 5;
  };

  const activeNeeds = cf.needs.filter((n) => n.status === "open");
  const windowNeeds = cf.needs.filter(inWindow);

  const totalReservedOpen = activeNeeds.reduce((sum, n) => sum + toNumber(n.funded), 0);

  const remainingTotal = windowNeeds.reduce((sum, n) => {
    const remaining = Math.max(0, toNumber(n.target) - toNumber(n.funded));
    return sum + remaining;
  }, 0);

  const availableAfterRequired = inflow - givingAmount - toNumber(cf.lifestyleMonthly);
  const allocateToNeeds = Math.max(0, Math.min(availableAfterRequired, remainingTotal));
  const excess = availableAfterRequired - allocateToNeeds;

  function addNeed() {
    setCf((s) => ({
      ...s,
      needs: [...s.needs, { id: makeId(), name: "", target: "0", dueMonth: monthAdd(month, 1), funded: "0", status: "open" }],
    }));
  }

  function updateNeed(id, patch) {
    setCf((s) => ({ ...s, needs: s.needs.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  }

  function removeNeed(id) {
    setCf((s) => ({ ...s, needs: s.needs.filter((n) => n.id !== id) }));
  }

  function runMonthlyAllocation() {
    const sorted = [...cf.needs].sort((a, b) => monthDiff(a.dueMonth, b.dueMonth));
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
    setCf((s) => ({ ...s, needs: s.needs.map((n) => byId.get(n.id) ?? n) }));
  }

  const months = monthOptions(2026);

  const transferRows = [
    { key: "cf_giving", stepLabel: "1", title: "Family Office → Giving", amount: fmtUSD(Math.max(0, givingAmount)) },
    { key: "cf_lifestyle", stepLabel: "2", title: "Family Office → Lifestyle", amount: fmtUSD(toNumber(cf.lifestyleMonthly)) },
    { key: "cf_needs", stepLabel: "3", title: "Family Office → Needs reserve (set aside; stays in FO)", amount: fmtUSD(allocateToNeeds) },
    { key: "cf_wealth", stepLabel: "4", title: "Family Office → Wealth Creation", amount: fmtUSD(excess), emphasis: excess >= 0 ? "good" : "bad" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Emergency minimum" value={fmtUSD(emergencyHeldInFO)} hint="Required balance in Family Office" />
        <StatCard label="Reserved for open needs" value={fmtUSD(totalReservedOpen)} hint="Counts toward Family Office reserve" />
        <StatCard label="Remaining needs (next 6 months)" value={fmtUSD(remainingTotal)} hint="Gap still to fund" />
        <StatCard label="Excess after rules" value={fmtUSD(excess)} hint="Available for wealth creation" emphasis={excess >= 0 ? "good" : "bad"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm font-semibold">Cash In</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-500">Business</div>
                <div className="text-[11px] text-emerald-700 font-semibold">Suggested from Working Capital</div>
              </div>
              <div className="mt-2">
                <MoneyInput value={cf.businessIn} onChange={(v) => setCf((s) => ({ ...s, businessIn: v }))} required />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">W-2 / Other</div>
              <div className="mt-2">
                <MoneyInput value={cf.w2In} onChange={(v) => setCf((s) => ({ ...s, w2In: v }))} required />
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
              <span className={"text-xs " + (!cf.givingIsDollar ? "font-semibold text-slate-900" : "text-slate-500")}>%</span>
              <Toggle checked={cf.givingIsDollar} onChange={(v) => setCf((s) => ({ ...s, givingIsDollar: v }))} />
              <span className={"text-xs " + (cf.givingIsDollar ? "font-semibold text-slate-900" : "text-slate-500")}>$</span>
            </div>
          </div>

          <div className="mt-3">
            {!cf.givingIsDollar ? (
              <PercentInput value={cf.givingPercent} onChange={(v) => setCf((s) => ({ ...s, givingPercent: v }))} required />
            ) : (
              <MoneyInput value={cf.givingDollar} onChange={(v) => setCf((s) => ({ ...s, givingDollar: v }))} placeholder="1000" required />
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
            <MoneyInput value={cf.lifestyleMonthly} onChange={(v) => setCf((s) => ({ ...s, lifestyleMonthly: v }))} placeholder="15000" required />
          </div>
          <div className="mt-2 text-xs text-slate-500">Target Lifestyle balance (2× spend): {fmtUSD(lifestyleTargetBalance)}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold">Upcoming Cash Needs (Next 6 Months)</div>
            <div className="text-xs text-slate-500 mt-1">Funded balances carry forward … click “Fund needs this month” for suggested allocation.</div>
          </div>
          <div className="flex items-center gap-2">
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
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {activeNeeds.map((n) => {
                const remaining = Math.max(0, toNumber(n.target) - toNumber(n.funded));
                const dim = inWindow(n) ? "" : "opacity-50";
                return (
                  <tr key={n.id} className={"border-t " + dim}>
                    <td className="py-2 pr-2">
                      <input
                        value={n.name}
                        onChange={(e) => updateNeed(n.id, { name: e.target.value })}
                        placeholder="e.g. Taxes, Vehicle, Tuition"
                        className={
                          "border rounded-xl px-3 py-2 w-full bg-white " +
                          (isEmptyValue(n.name) ? "border-amber-400 bg-amber-50" : "")
                        }
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
                      <MoneyInput value={n.target} onChange={(v) => updateNeed(n.id, { target: v })} required />
                    </td>
                    <td className="py-2 pr-2 w-[170px]">
                      <MoneyInput value={n.funded} onChange={(v) => updateNeed(n.id, { funded: v })} />
                    </td>
                    <td className="py-2 pr-2 font-semibold">{fmtUSD(remaining)}</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => removeNeed(n.id)} className="text-slate-500 hover:text-slate-900" title="Remove">
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}

              {activeNeeds.length === 0 ? (
                <tr className="border-t">
                  <td className="py-6 text-sm text-slate-500" colSpan={6}>
                    No active needs. Add an item if you expect a &gt;$5k cash need in the next six months.
                  </td>
                </tr>
              ) : null}
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
            <div className="text-xs font-semibold text-slate-500">Excess to Wealth Creation</div>
            <div className={"mt-1 text-lg font-semibold " + (excess >= 0 ? "text-emerald-700" : "text-red-700")}>
              {fmtUSD(excess)}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <TransferTable
            title="Transfer Instructions"
            subtitle="Check off each step when you complete the transfer at the bank."
            rows={transferRows}
            doneMap={doneMap}
            onToggle={onToggleDone}
            onMarkAll={onMarkAllDone}
          />
        </div>
      </div>
    </div>
  );
}

// ---------- Tests ----------
function TestHarness() {
  React.useEffect(() => {
    console.assert(monthAdd("2026-01", 1) === "2026-02", "monthAdd +1 failed");
    console.assert(monthAdd("2026-12", 1) === "2027-01", "monthAdd year rollover failed");
    console.assert(monthDiff("2026-01", "2026-06") === 5, "monthDiff failed");

    // Waterfall example:
    // WC goal = 82,500 and Reserve goal = 82,500
    // Business checking = 125,000 => excess 42,500
    // Reserve balance = 75,000 => short 7,500
    // Move to reserve 7,500; move to family office 35,000
    const wcGoal = 82500;
    const reserveGoal = 82500;
    const businessBal = 125000;
    const reserveBal = 75000;
    const available = Math.max(0, businessBal - wcGoal);
    const reserveShort = Math.max(0, reserveGoal - reserveBal);
    const moveToReserve = Math.min(available, reserveShort);
    const moveToFO = Math.max(0, available - moveToReserve);
    console.assert(moveToReserve === 7500, "waterfall moveToReserve failed");
    console.assert(moveToFO === 35000, "waterfall moveToFamilyOffice failed");
  }, []);
  return null;
}

// ---------- App ----------
export default function App() {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saveStatus, setSaveStatus] = React.useState("Saved");
  const [state, setState] = React.useState(defaultState());

  // init session + listener
  React.useEffect(() => {
    let sub = null;

    async function init() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);

      sub = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      }).data.subscription;

      setLoading(false);
    }

    init();
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  // load user state
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
        // merge so you can safely add new defaults later
        setState((prev) => ({ ...prev, ...data.state }));
        setSaveStatus("Loaded");
      } else {
        await supabase.from("cashflow_states").upsert({ user_id: userId, state: defaultState() });
        setSaveStatus("Loaded (new)");
      }
    })();
  }, [session]);

  // save user state (debounced)
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
  if (!session) return <AuthGate />;

  // ---- state helpers ----
  const month = state.month;
  const activeTool = state.activeTool;

  function setMonth(next) {
    setState((s) => ({ ...s, month: typeof next === "function" ? next(s.month) : next }));
  }

  function setActiveTool(next) {
    setState((s) => ({ ...s, activeTool: next }));
  }

  function getDone(tool) {
    return state.transferDone?.[month]?.[tool] || {};
  }

  function toggleDone(tool, key, val) {
    setState((prev) => {
      const m = prev.transferDone?.[month] || {};
      const t = m?.[tool] || {};
      return {
        ...prev,
        transferDone: {
          ...(prev.transferDone || {}),
          [month]: {
            ...m,
            [tool]: { ...t, [key]: val },
          },
        },
      };
    });
  }

  function markAllDone(tool, rows) {
    setState((prev) => {
      const m = prev.transferDone?.[month] || {};
      const t = m?.[tool] || {};
      const nextTool = { ...t };
      rows.forEach((r) => (nextTool[r.key] = true));
      return {
        ...prev,
        transferDone: {
          ...(prev.transferDone || {}),
          [month]: {
            ...m,
            [tool]: nextTool,
          },
        },
      };
    });
  }

  const email = session.user.email || "Signed in";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <TopBar
          email={email}
          saveStatus={saveStatus}
          month={month}
          setMonth={setMonth}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onLogout={signOut}
        />

        {activeTool === "home" ? (
          <div className="rounded-3xl border bg-white p-6">
            <div className="text-2xl font-semibold">What are we working on today?</div>
            <div className="text-sm text-slate-600 mt-1">Do Working Capital first … then Cash Flow … done in ~10 minutes.</div>
            <div className="mt-6">
              <HomeChooser onPick={setActiveTool} />
            </div>
          </div>
        ) : null}

        {activeTool === "workingCapital" ? (
          <WorkingCapitalTool
            month={month}
            wc={state.workingCapital}
            setWc={(fn) => setState((s) => ({ ...s, workingCapital: typeof fn === "function" ? fn(s.workingCapital) : fn }))}
            onSuggestBusinessIn={(amount) => setState((s) => ({ ...s, suggestedBusinessIn: amount }))}
            doneMap={getDone("workingCapital")}
            onToggleDone={(key, val) => toggleDone("workingCapital", key, val)}
            onMarkAllDone={() =>
              markAllDone("workingCapital", [
                { key: "wc_reserve" },
                { key: "wc_familyOffice" },
              ])
            }
          />
        ) : null}

        {activeTool === "cashflow" ? (
          <CashflowTool
            month={month}
            cf={state.cashflow}
            setCf={(fn) => setState((s) => ({ ...s, cashflow: typeof fn === "function" ? fn(s.cashflow) : fn }))}
            suggestedBusinessIn={state.suggestedBusinessIn}
            doneMap={getDone("cashflow")}
            onToggleDone={(key, val) => toggleDone("cashflow", key, val)}
            onMarkAllDone={() =>
              markAllDone("cashflow", [
                { key: "cf_giving" },
                { key: "cf_lifestyle" },
                { key: "cf_needs" },
                { key: "cf_wealth" },
              ])
            }
          />
        ) : null}

        <div className="text-xs text-slate-500 text-center pt-2">V2 … behind login … per-user saved state …</div>
      </div>

      <TestHarness />
    </div>
  );
}
