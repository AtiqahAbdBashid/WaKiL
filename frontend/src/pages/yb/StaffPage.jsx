// Staff roster: invite and deactivate. Representative-only; saved through the API.
// Intern expiry is not stored, so the expiry field is not offered.
import { useState } from "react";
import PageTitle from "../../components/ui/PageTitle";
import Sheet from "../../components/ui/Sheet";
import { inputClass, labelClass, primaryButton } from "../../components/ui/styles";
import { useYbAuth } from "../../auth/YbAuthContext";
import { useYbComplaints } from "../../context/YbComplaintsContext";
import { ybApi } from "../../lib/ybApi";

export default function StaffPage() {
  const { isStaffManager, canViewStaff } = useYbAuth();
  const { staff, reload } = useYbComplaints();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Intern");
  const [error, setError] = useState("");

  const run = async (request) => {
    setError("");
    try {
      await request();
      await reload();
    } catch (e) {
      setError(e.message);
    }
  };

  const invite = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    run(async () => {
      await ybApi.inviteStaff({ email: email.trim(), role, name: name.trim() || null });
      setEmail("");
      setName("");
    });
  };

  const toggle = (s) => run(() => ybApi.setStaffActive(s.id, !s.active));

  if (!canViewStaff) return <p className="py-10 text-center text-sm text-muted">Staff roster is visible to Representative only.</p>;

  return (
    <div className="w-full space-y-8">
      <PageTitle title="Staff" subtitle="Representative manages Aides and Interns. Deactivated staff lose access." />

      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}

      <Sheet title={`${staff.filter((s) => s.active).length} active`}>
        <ul className="divide-y divide-line">
          {staff.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5">
              <div>
                <p className="font-bold text-ink">{s.name} · {s.role}</p>
                <p className="text-sm text-ink-soft">{s.email}</p>
                {!s.active && <p className="text-sm font-bold text-brand">Deactivated</p>}
              </div>
              {s.role !== "Representative" && (
                <button onClick={() => toggle(s)} disabled={!isStaffManager} className="text-sm font-bold text-brand underline decoration-2 underline-offset-4 disabled:text-ink-soft">
                  {s.active ? "Deactivate" : "Reactivate"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet title="Invite">
        <form onSubmit={invite} className="grid gap-3 p-4 md:grid-cols-[1fr_2fr_1fr_auto] md:p-5">
          <div>
            <label htmlFor="staff-name" className={labelClass}>Name</label>
            <input id="staff-name" type="text" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" className={inputClass} />
          </div>
          <div>
            <label htmlFor="staff-email" className={labelClass}>Office email</label>
            <input id="staff-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@parlimen.gov.my" className={inputClass} />
          </div>
          <div>
            <label htmlFor="staff-role" className={labelClass}>Role</label>
            <select id="staff-role" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
              <option>Aide</option>
              <option>Intern</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={!isStaffManager} className={primaryButton}>Invite</button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
