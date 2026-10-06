// Mock staff roster: invite, deactivate, expiry flag. Wakil-only in real backend.
import { useState } from "react";
import PageTitle from "../../components/ui/PageTitle";
import SampleNote from "../../components/ui/SampleNote";
import Sheet from "../../components/ui/Sheet";
import { inputClass, labelClass, primaryButton } from "../../components/ui/styles";
import { ybStaff as initial } from "../../data/ybStaff";
import { useYbAuth } from "../../auth/YbAuthContext";

const isExpired = (s) => !!s.expiresAt && new Date(s.expiresAt) < new Date();

export default function StaffPage() {
  const { isStaffManager, canViewStaff } = useYbAuth();
  const [staff, setStaff] = useState(initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Intern");
  const [expiry, setExpiry] = useState("");

  const invite = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStaff((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, name: email.split("@")[0], role, email, active: true, expiresAt: expiry || null, initials: email.slice(0, 2).toUpperCase() },
    ]);
    setEmail("");
    setExpiry("");
  };

  const toggle = (id) => setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));

  if (!canViewStaff) return <p className="py-10 text-center text-sm text-muted">Staff roster is visible to Wakil only. Switch mock session to YB Khairul.</p>;

  return (
    <div className="w-full space-y-8">
      <PageTitle title="Staff" subtitle="Aide permanent, Intern temporary with expiry. Wakil manages." />
      <SampleNote label="Note:">Mock roster, not saved. Expired + deactivated auto-lose access.</SampleNote>

      <Sheet title={`${staff.filter((s) => s.active && !isExpired(s)).length} active`}>
        <ul className="divide-y divide-line">
          {staff.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5">
              <div>
                <p className="font-bold text-ink">{s.name} · {s.role}</p>
                <p className="text-sm text-ink-soft">{s.email}{s.expiresAt ? ` · ends ${s.expiresAt}` : ""}</p>
                {!s.active && <p className="text-sm font-bold text-brand">Deactivated</p>}
                {isExpired(s) && <p className="text-sm font-bold text-brand">Expired</p>}
              </div>
              <button onClick={() => toggle(s.id)} disabled={!isStaffManager} className="text-sm font-bold text-brand underline decoration-2 underline-offset-4 disabled:text-ink-soft">
                {s.active ? "Deactivate" : "Reactivate"}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet title="Invite">
        <form onSubmit={invite} className="grid gap-3 p-4 md:grid-cols-[2fr_1fr_1fr_auto] md:p-5">
          <div>
            <label htmlFor="staff-email" className={labelClass}>Google email</label>
            <input id="staff-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" className={inputClass} />
          </div>
          <div>
            <label htmlFor="staff-role" className={labelClass}>Role</label>
            <select id="staff-role" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
              <option>Aide</option>
              <option>Intern</option>
            </select>
          </div>
          <div>
            <label htmlFor="staff-expiry" className={labelClass}>Expiry (Intern)</label>
            <input id="staff-expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={inputClass} />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={!isStaffManager} className={primaryButton}>Invite</button>
          </div>
        </form>
        {!isStaffManager && <p className="px-4 pb-4 text-sm text-ink-soft md:px-5">Only Wakil can invite in real backend.</p>}
      </Sheet>
    </div>
  );
}
