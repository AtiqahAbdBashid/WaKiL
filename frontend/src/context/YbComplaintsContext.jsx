// Shared mock triage state so Assigned Complaints and Complaint Pool see the same data.
// Claim path: staff open a case group with >=1 pool complaint; Aide/Intern claim
// via the group. Representative never becomes an assignee.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ybComplaints } from "../data/ybSample";
import { ybCaseGroups as initialGroups, ybStaff } from "../data/ybStaff";

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

  // Per-complaint release with optional propagation. Single transfer detaches
  // to a new case group owned by the transferee.
  const releaseComplaint = useCallback(
    (id, { mode, nextId, reason, repeatInGroup }, user) => {
      const target = complaints.find((x) => x.id === id);
      if (!target) return { ok: false, message: "Complaint not found." };
      if (!isOpenComplaint(target))
        return { ok: false, message: "Only open complaints can be released." };

      const targetGroup = target.case_group_id
        ? caseGroups.find((g) => g.id === target.case_group_id) || null
        : null;

      const isRepresentative = user.role === "Representative";
      const isOwner = !!target.assigneeId && target.assigneeId === user.id;

      if (mode === "transfer") {
        const next = ybStaff.find((s) => s.id === nextId && s.active);
        if (!next || next.role === "Representative")
          return { ok: false, message: "Pick an active Aide or Intern." };
        if (!isOwner && !isRepresentative)
          return { ok: false, message: `Only ${target.assigneeId ? "the owner" : "Representative"} can release.` };

        if (repeatInGroup && targetGroup) {
          // Move all open members together; stay in group, move owner.
          const members = complaints.filter(
            (m) => m.case_group_id === targetGroup.id && isOpenComplaint(m)
          );
          if (members.length === 0)
            return { ok: false, message: "No open members to transfer." };
          setCaseGroups((prev) =>
            prev.map((g) => (g.id === targetGroup.id ? { ...g, owner_staff_id: next.id } : g))
          );
          for (const m of members) {
            touch(
              m.id,
              { assigneeId: next.id },
              {
                by: user.id,
                at: today(),
                action: "reassign",
                detail: `${user.name} transferred ${targetGroup.title} to ${next.name} (shared across case group)`,
              }
            );
          }
          return {
            ok: true,
            count: members.length,
            groupId: targetGroup.id,
            message: `${targetGroup.title} transferred to ${next.name} · ${members.length} complaint${members.length === 1 ? "" : "s"}.`,
          };
        }

        // Single detach: open new case group for transferee, detach target.
        const groupId = `cg-${Date.now()}`;
        const newGroup = {
          id: groupId,
          title: target.title,
          category: target.category,
          status: "Open",
          owner_staff_id: next.id,
        };
        setCaseGroups((prev) => [...prev, newGroup]);
        touch(
          target.id,
          {
            assigneeId: next.id,
            case_group_id: groupId,
            case_group_confirmed: true,
          },
          {
            by: user.id,
            at: today(),
            action: "group-assign",
            detail: `${user.name} moved ${target.title} to new case group ${newGroup.title}`,
          }
        );
        touch(
          target.id,
          { assigneeId: next.id },
          {
            by: user.id,
            at: today(),
            action: "reassign",
            detail: `${user.name} transferred to ${next.name} via new case group ${newGroup.title}`,
          }
        );

        // Close old group when no open members remain (all ended or detached).
        if (targetGroup) {
          const remainingOpen = complaints.filter(
            (m) =>
              m.case_group_id === targetGroup.id &&
              m.id !== target.id &&
              isOpenComplaint(m)
          );
          if (remainingOpen.length === 0) {
            setCaseGroups((prev) =>
              prev.map((g) => (g.id === targetGroup.id ? { ...g, status: "Closed" } : g))
            );
          }
          // Owner unchanged per rule.
        }

        return {
          ok: true,
          count: 1,
          groupId: groupId,
          message: `Complaint ${target.ref_no ?? target.id} transferred to ${next.name} in a new case group.`,
        };
      }

      if (mode === "end") {
        if (user.role !== "Representative")
          return { ok: false, message: "Only Representative can end the flow." };
        if (!reason) return { ok: false, message: "Pick a decline reason." };
        if (!isOwner && !isRepresentative)
          return { ok: false, message: `Only ${target.assigneeId ? "the owner" : "Representative"} can release.` };

        if (repeatInGroup && targetGroup) {
          const openMembers = complaints.filter(
            (m) => m.case_group_id === targetGroup.id && isOpenComplaint(m)
          );
          if (openMembers.length === 0)
            return { ok: false, message: "No open members to decline." };
          for (const m of openMembers) {
            touch(
              m.id,
              { status: "Declined" },
              { by: user.id, at: today(), action: "decline", detail: `Flow ended: ${reason}` }
            );
          }
          // Every open member declined, so all members are ended now.
          setCaseGroups((prev) =>
            prev.map((g) => (g.id === targetGroup.id ? { ...g, status: "Closed" } : g))
          );
          return {
            ok: true,
            count: openMembers.length,
            groupId: targetGroup.id,
            message: `${targetGroup.title} closed · ${openMembers.length} open complaint${openMembers.length === 1 ? "" : "s"} declined.`,
          };
        }

        // End single.
        touch(
          target.id,
          { status: "Declined" },
          { by: user.id, at: today(), action: "decline", detail: `Flow ended: ${reason}` }
        );
        if (targetGroup) {
          const remainingOpen = complaints.filter(
            (m) => m.case_group_id === targetGroup.id && m.id !== target.id && isOpenComplaint(m)
          );
          if (remainingOpen.length === 0) {
            setCaseGroups((prev) =>
              prev.map((g) => (g.id === targetGroup.id ? { ...g, status: "Closed" } : g))
            );
          }
        }
        return {
          ok: true,
          count: 1,
          groupId: targetGroup?.id ?? null,
          message: `Complaint ${target.ref_no ?? target.id} declined.`,
        };
      }

      return { ok: false, message: "Invalid release mode." };
    },
    [caseGroups, complaints, touch]
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
    (id, { detail, attachmentName, repeatInGroup }, user) => {
      const target = complaints.find((x) => x.id === id);
      const entryFor = (suffix) => ({
        by: user.id,
        at: today(),
        action: "update",
        detail: suffix ? `${detail} (${suffix})` : detail,
        ...(attachmentName ? { attachmentName } : {}),
      });
      if (repeatInGroup && target?.case_group_id) {
        const members = complaints.filter(
          (m) => m.case_group_id === target.case_group_id && isOpenComplaint(m)
        );
        for (const m of members) {
          touch(
            m.id,
            { updatedAt: today() },
            entryFor(members.length > 1 ? `shared across case group` : null)
          );
        }
        return { count: members.length, groupId: target.case_group_id };
      }
      touch(id, { updatedAt: today() }, entryFor(null));
      return { count: 1, groupId: null };
    },
    [complaints, touch]
  );

  const value = useMemo(
    () => ({
      complaints,
      caseGroups,
      groupMembers,
      touch,
       releaseComplaint,
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
      releaseComplaint,
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
