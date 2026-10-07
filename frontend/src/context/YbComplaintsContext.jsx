// Shared mock triage state so Assigned Complaints and Complaint Pool see the same data.
// Claim path: staff open a case group with >=1 pool complaint; Aide/Intern claim
// via the group. Representative never becomes an assignee.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ybComplaints } from "../data/ybSample";
import { staffName, ybCaseGroups as initialGroups } from "../data/ybStaff";

const YbComplaintsContext = createContext(null);

const today = () => new Date().toISOString().slice(0, 10);

export const isOpenComplaint = (c) => c.status === "Pending" || c.status === "In Progress";

export function YbComplaintsProvider({ children }) {
  const [complaints, setComplaints] = useState(ybComplaints);
  const [caseGroups, setCaseGroups] = useState(initialGroups);

  const touch = useCallback((id, patch, entry) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch, history: [...(c.history ?? []), entry] } : c))
    );
  }, []);

  const groupMembers = useCallback(
    (groupId) =>
      complaints
        .filter((c) => c.case_group_id === groupId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [complaints]
  );

  const release = useCallback(
    (id, user) => {
      touch(
        id,
        { assigneeId: null },
        { by: user.id, at: today(), action: "release", detail: `${user.name} released to pool` }
      );
    },
    [touch]
  );

  const reassign = useCallback(
    (id, nextId, user) => {
      touch(
        id,
        { assigneeId: nextId || null },
        {
          by: user.id,
          at: today(),
          action: "reassign",
          detail: `${user.name} assigned to ${nextId ? staffName(nextId) : "pool"}`,
        }
      );
    },
    [touch]
  );

  const changeStatus = useCallback(
    (id, next, user) => {
      const c = complaints.find((x) => x.id === id);
      if (!c) return;
      touch(
        id,
        { status: next },
        { by: user.id, at: today(), action: "status", detail: `${c.status} → ${next}` }
      );
    },
    [complaints, touch]
  );

  const confirmMember = useCallback(
    (id, user) => {
      const c = complaints.find((x) => x.id === id);
      if (!c || !c.case_group_id || !isOpenComplaint(c)) return false;
      touch(
        id,
        { case_group_confirmed: true },
        { by: user.id, at: today(), action: "group-confirm", detail: `${user.name} confirmed membership` }
      );
      return true;
    },
    [complaints, touch]
  );

  const confirmGroup = useCallback(
    (groupId, user) => {
      const members = complaints.filter(
        (c) => c.case_group_id === groupId && !c.case_group_confirmed && isOpenComplaint(c)
      );
      for (const m of members) {
        touch(
          m.id,
          { case_group_confirmed: true },
          { by: user.id, at: today(), action: "group-confirm", detail: `${user.name} confirmed membership` }
        );
      }
      return members.length;
    },
    [complaints, touch]
  );

  // Group claim: only non-Representative staff become assignees.
  const claimAll = useCallback(
    (groupId, user) => {
      if (user.role === "Representative") return 0;
      const members = complaints.filter(
        (c) => c.case_group_id === groupId && !c.assigneeId && isOpenComplaint(c)
      );
      for (const m of members) {
        touch(
          m.id,
          { assigneeId: user.id },
          { by: user.id, at: today(), action: "claim", detail: `${user.name} claimed via case group` }
        );
      }
      return members.length;
    },
    [complaints, touch]
  );

  // Open a case group from pool selection. Representative opens it unassigned;
  // Aide/Intern claim the selected complaints through the new group.
  const createGroupWithSelection = useCallback(
    (ids, { title, category }, user) => {
      const unique = [...new Set(ids)];
      const eligible = unique.filter((id) => {
        const c = complaints.find((x) => x.id === id);
        return c && !c.assigneeId && !c.case_group_id && isOpenComplaint(c);
      });
      if (eligible.length === 0)
        return { ok: false, message: "Select at least one open pool complaint." };
      if (!title.trim()) return { ok: false, message: "Give the case group a title." };
      const groupId = `cg-${Date.now()}`;
      const group = {
        id: groupId,
        title: title.trim(),
        category,
        status: "Open",
        owner_staff_id: user.id,
      };
      setCaseGroups((prev) => [...prev, group]);
      const claims = user.role !== "Representative";
      setComplaints((prev) =>
        prev.map((c) => {
          if (!eligible.includes(c.id)) return c;
          const history = [
            ...(c.history ?? []),
            { by: user.id, at: today(), action: "group-assign", detail: `${user.name} opened ${group.title}` },
          ];
          if (claims)
            history.push({ by: user.id, at: today(), action: "claim", detail: `${user.name} claimed via ${group.title}` });
          return {
            ...c,
            case_group_id: groupId,
            case_group_confirmed: claims,
            ...(claims ? { assigneeId: user.id } : {}),
            history,
          };
        })
      );
      return {
        ok: true,
        groupId,
        claimed: claims ? eligible.length : 0,
        message: claims
          ? `${eligible.length} complaint${eligible.length === 1 ? "" : "s"} claimed under ${group.title}.`
          : `${group.title} opened with ${eligible.length} complaint${eligible.length === 1 ? "" : "s"}. Representative does not claim.`,
      };
    },
    [complaints]
  );

  const addUpdate = useCallback(
    (id, { detail, attachmentName }, user) => {
      touch(
        id,
        { updatedAt: today() },
        { by: user.id, at: today(), action: "update", detail, ...(attachmentName ? { attachmentName } : {}) }
      );
    },
    [touch]
  );

  const value = useMemo(
    () => ({
      complaints,
      caseGroups,
      groupMembers,
      touch,
      release,
      reassign,
      changeStatus,
      confirmMember,
      confirmGroup,
      claimAll,
      createGroupWithSelection,
      addUpdate,
    }),
    [
      complaints,
      caseGroups,
      groupMembers,
      touch,
      release,
      reassign,
      changeStatus,
      confirmMember,
      confirmGroup,
      claimAll,
      createGroupWithSelection,
      addUpdate,
    ]
  );

  return <YbComplaintsContext.Provider value={value}>{children}</YbComplaintsContext.Provider>;
}

export function useYbComplaints() {
  const ctx = useContext(YbComplaintsContext);
  if (!ctx) throw new Error("useYbComplaints must be used inside YbComplaintsProvider");
  return ctx;
}
