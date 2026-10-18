import { inputClass } from "../../ui/styles";

const groupLabel = (g) =>
  `${g.title} · ${g.memberCount} complaint${g.memberCount === 1 ? "" : "s"} · ${g.ownerName ?? "Unassigned"}`;

// Dropdown of case groups the viewer can move complaints into.
export default function GroupSelect({ id, value, onChange, groups }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      <option value="">Pick group…</option>
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {groupLabel(g)}
        </option>
      ))}
    </select>
  );
}
