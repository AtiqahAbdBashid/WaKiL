// Shared office data (complaints, case groups, staff, kawasan) loaded from the API so
// Assigned Complaints and Complaint Pool see the same rows.
// En-bloc only: assignment lives on the case group's owner; pool means no case_group_id.
// Actions apply to local state at once, are saved through the API, then everything reloads.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useYbAuth } from "../auth/YbAuthContext";
import { ybApi } from "../lib/ybApi";

const YbComplaintsContext = createContext(null);

// Full ISO-8601 timestamp, same convention as the backend writer and seeds.
const nowIso = () => new Date().toISOString();

// Open means Pending or In Progress; Resolved is the sole terminal status.
export const isOpenComplaint = (c) => c.status === "Pending" || c.status === "In Progress";

export function YbComplaintsProvider({ children }) {
  const { user: sessionUser } = useYbAuth();
  const [complaints, setComplaints] = useState([]);
  const [caseGroups, setCaseGroups] = useState([]);
  const [staff, setStaff] = useState([]);
  const [kawasan, setKawasan] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);

  const reload = useCallback(
    () =>
      Promise.all([
        ybApi.aduan(),
        ybApi.caseGroups(),
        ybApi.staff(),
        ybApi.kawasan(),
        ybApi.categories(),
      ])
        .then(([aduan, groups, people, area, cats]) => {
          setComplaints(aduan);
          setCaseGroups(groups);
          setStaff(people);
          setKawasan(area);
          setCategories(cats);
          setSyncError(null);
        })
        .catch((e) => setSyncError(e.message))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    if (sessionUser?.id) reload();
  }, [sessionUser?.id, reload]);

  const refreshComplaints = useCallback(() => {
    ybApi.aduan()
      .then((latestComplaints) => {
        setComplaints(latestComplaints);
        setSyncError(null);
      })
      .catch((error) => setSyncError(error.message));
  }, []);

  useEffect(() => {
    if (!sessionUser?.id) return undefined;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshComplaints();
    };
    const timer = window.setInterval(refreshWhenVisible, 30_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [sessionUser?.id, refreshComplaints]);

  const persist = useCallback(
    (request) =>
      request
        .catch((e) => setSyncError(e.message))
        .finally(reload),
    [reload]
  );

  const staffName = useCallback(
    (id) => staff.find((s) => s.id === id)?.name ?? "Unassigned",
    [staff]
  );

  const touch = useCallback((id, patch, entry) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch, history: [...(c.history ?? []), entry] } : c))
    );
  }, []);

  const groupMembers = useCallback(
    (groupId) =>
      complaints
        .filter((c) => c.case_group_id === groupId)
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
    [complaints]
  );

  // Single assignee derivation: the group's owner. Null means pool (no case group).
  const groupOwnerOf = useCallback(
    (complaint) => {
      if (!complaint?.case_group_id) return null;
      return caseGroups.find((g) => g.id === complaint.case_group_id)?.owner_staff_id ?? null;
    },
    [caseGroups]
  );

  // Resolve-only release. Cross-owner movement uses the pull helpers below:
  // dest must be open and owned by the caller (or Representative).
  const releaseComplaint = useCallback(
    (id, { mode, reason, repeatInGroup }, user) => {
      const target = complaints.find((x) => x.id === id);
      if (!target) return { ok: false, message: "Complaint not found." };
      if (!isOpenComplaint(target))
        return { ok: false, message: "Only open complaints can be released." };

      const targetGroup = target.case_group_id
        ? caseGroups.find((g) => g.id === target.case_group_id) || null
        : null;
      const ownerId = targetGroup?.owner_staff_id ?? null;

      const isRepresentative = user.role === "Representative";
      const isOwner = !!ownerId && ownerId === user.id;

      if (mode === "end") {
        if (user.role !== "Representative")
          return { ok: false, message: "Only Representative can end the flow." };
        if (!reason) return { ok: false, message: "Pick a resolve reason." };
        if (!isOwner && !isRepresentative)
          return { ok: false, message: `Only ${ownerId ? "the owner" : "Representative"} can release.` };

        if (repeatInGroup && targetGroup) {
          const openMembers = complaints.filter(
            (m) => m.case_group_id === targetGroup.id && isOpenComplaint(m)
          );
          if (openMembers.length === 0)
            return { ok: false, message: "No open members to resolve." };
          for (const m of openMembers) {
            touch(
              m.id,
              { status: "Resolved", needsRepresentativeAttention: false },
              { by: user.id, at: nowIso(), action: "resolve", detail: `Flow ended: ${reason}` }
            );
          }
          persist(ybApi.resolveAduan(id, { reason, repeatInGroup: true }));
          // Every open member resolved, so all members are ended now.
          setCaseGroups((prev) =>
            prev.map((g) => (g.id === targetGroup.id ? { ...g, status: "Closed" } : g))
          );
          return {
            ok: true,
            count: openMembers.length,
            groupId: targetGroup.id,
            message: `${targetGroup.title} closed · ${openMembers.length} open complaint${openMembers.length === 1 ? "" : "s"} resolved.`,
          };
        }

        // End single.
        persist(ybApi.resolveAduan(id, { reason, repeatInGroup: false }));
        touch(
          target.id,
          { status: "Resolved", needsRepresentativeAttention: false },
          { by: user.id, at: nowIso(), action: "resolve", detail: `Flow ended: ${reason}` }
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
          message: `Complaint ${target.ref_no ?? target.id} resolved.`,
        };
      }

      return { ok: false, message: "Invalid release mode." };
    },
    [caseGroups, complaints, touch, persist]
  );

  // Representative review flag. Only claimed In Progress complaints can be
  // flagged; pool Pending stays unflaggable until claimed en-bloc.
  const setAttention = useCallback(
    (id, value, user) => {
      const target = complaints.find((x) => x.id === id);
      if (!target) return { ok: false, message: "Complaint not found." };
      if (!isOpenComplaint(target))
        return { ok: false, message: "Only open complaints can be flagged." };
      if (target.status !== "In Progress")
        return { ok: false, message: "Only claimed In Progress complaints can be flagged." };
      const ownerId = target.case_group_id
        ? caseGroups.find((g) => g.id === target.case_group_id)?.owner_staff_id ?? null
        : null;
      const isOwner = !!ownerId && ownerId === user.id;
      const isRepresentative = user.role === "Representative";
      if (value) {
        if (!isOwner || isRepresentative)
          return { ok: false, message: "Only the assigned Aide or Intern can flag for Representative review." };
      } else if (!isOwner && !isRepresentative) {
        return { ok: false, message: "Only the owner or Representative can clear the flag." };
      }
      persist(ybApi.patchAduan(id, { needsRepresentativeAttention: value }));
      touch(
        id,
        { needsRepresentativeAttention: value },
        {
          by: user.id,
          at: nowIso(),
          action: value ? "flag" : "unflag",
          detail: value
            ? `${user.name} flagged for Representative review`
            : `${user.name} cleared Representative flag`,
        }
      );
      return { ok: true };
    },
    [caseGroups, complaints, touch, persist]
  );

  // Open a case group from pool selection. Joining is final: every member
  // moves to In Progress under the group owner.
  const createGroupWithSelection = useCallback(
    (ids, { title, category, ownerStaffId }, user) => {
      const unique = [...new Set(ids)];
      const eligible = unique.filter((id) => {
        const c = complaints.find((x) => x.id === id);
        return c && !c.case_group_id && isOpenComplaint(c);
      });
      if (eligible.length === 0)
        return { ok: false, message: "Select at least one open pool complaint." };
      if (!title.trim()) return { ok: false, message: "Give the case group a title." };
      const isRepresentative = user.role === "Representative";
      let ownerId = user.id;
      let ownerName = user.name;
      if (isRepresentative) {
        const assignee = staff.find(
          (s) => s.id === ownerStaffId && s.active && (s.role === "Aide" || s.role === "Intern")
        );
        if (!assignee)
          return { ok: false, message: "Pick an Aide or Intern to assign this group to." };
        ownerId = assignee.id;
        ownerName = assignee.name;
      }
      persist(ybApi.createCaseGroup({ title: title.trim(), category, complaintIds: eligible, ownerStaffId }));
      const groupId = `pending-${Date.now()}`;
      const group = {
        id: groupId,
        title: title.trim(),
        category,
        status: "Open",
        owner_staff_id: ownerId,
      };
      setCaseGroups((prev) => [...prev, group]);
      setComplaints((prev) =>
        prev.map((c) => {
          if (!eligible.includes(c.id)) return c;
          const history = [
            ...(c.history ?? []),
            {
              by: user.id,
              at: nowIso(),
              action: "group-assign",
              detail: isRepresentative
                ? `${user.name} opened ${group.title} for ${ownerName}`
                : `${user.name} opened ${group.title}`,
            },
            {
              by: user.id,
              at: nowIso(),
              action: "claim",
              detail: isRepresentative
                ? `${ownerName} assigned via ${group.title}`
                : `${user.name} claimed via ${group.title}`,
            },
          ];
          return {
            ...c,
            case_group_id: groupId,
            status: "In Progress",
            history,
          };
        })
      );
      return {
        ok: true,
        groupId,
        claimed: eligible.length,
        message: isRepresentative
          ? `${eligible.length} complaint${eligible.length === 1 ? "" : "s"} assigned to ${ownerName} under ${group.title}.`
          : `${eligible.length} complaint${eligible.length === 1 ? "" : "s"} claimed under ${group.title}.`,
      };
    },
    [complaints, staff, persist]
  );

  // Move a complaint into an existing open case group. Pull model: dest must
  // be open and owned by the caller (or Representative).
  const moveToExistingGroup = useCallback(
    (id, destGroupId, user) => {
      const target = complaints.find((x) => x.id === id);
      if (!target) return { ok: false, message: "Complaint not found." };
      if (!isOpenComplaint(target))
        return { ok: false, message: "Only open complaints can be moved." };

      const dest = caseGroups.find((g) => g.id === destGroupId) || null;
      if (!dest) return { ok: false, message: "Pick a case group." };
      if (dest.status !== "Open")
        return { ok: false, message: "That case group is closed." };
      if (target.case_group_id === dest.id)
        return { ok: false, message: "Complaint is already in that case group." };

      const isRepresentative = user.role === "Representative";
      if (dest.owner_staff_id !== user.id && !isRepresentative)
        return { ok: false, message: "Only the group owner or Representative can add to it." };

      const sourceGroup = target.case_group_id
        ? caseGroups.find((g) => g.id === target.case_group_id) || null
        : null;

      persist(ybApi.patchAduan(target.id, { case_group_id: dest.id }));
      touch(
        target.id,
        {
          case_group_id: dest.id,
          status: "In Progress",
        },
        {
          by: user.id,
          at: nowIso(),
          action: "group-assign",
          detail: sourceGroup
            ? `${user.name} moved ${target.title} from ${sourceGroup.title} to ${dest.title}`
            : `${user.name} added ${target.title} to ${dest.title}`,
        }
      );
      touch(
        target.id,
        {},
        {
          by: user.id,
          at: nowIso(),
          action: sourceGroup ? "reassign" : "claim",
          detail: sourceGroup
            ? `${user.name} transferred to ${dest.title}`
            : `${user.name} claimed via ${dest.title}`,
        }
      );

      // Close old group when no open members remain (all ended or detached).
      if (sourceGroup) {
        const remainingOpen = complaints.filter(
          (m) =>
            m.case_group_id === sourceGroup.id &&
            m.id !== target.id &&
            isOpenComplaint(m)
        );
        if (remainingOpen.length === 0) {
          setCaseGroups((prev) =>
            prev.map((g) => (g.id === sourceGroup.id ? { ...g, status: "Closed" } : g))
          );
        }
      }

      return {
        ok: true,
        count: 1,
        groupId: dest.id,
        message: sourceGroup
          ? `Complaint ${target.ref_no ?? target.id} moved from ${sourceGroup.title} to ${dest.title}.`
          : `Complaint ${target.ref_no ?? target.id} added to ${dest.title}.`,
      };
    },
    [caseGroups, complaints, touch, persist]
  );

  // Pull a whole case group into another open group the caller owns.
  // Moves every open member; source ownership not required (pull model).
  const moveGroupToGroup = useCallback(
    (sourceGroupId, destGroupId, user) => {
      const source = caseGroups.find((g) => g.id === sourceGroupId) || null;
      const dest = caseGroups.find((g) => g.id === destGroupId) || null;
      if (!source) return { ok: false, message: "Source case group not found." };
      if (!dest) return { ok: false, message: "Pick a case group." };
      if (source.id === dest.id)
        return { ok: false, message: "Source and destination are the same group." };
      if (source.status !== "Open" || dest.status !== "Open")
        return { ok: false, message: "Both case groups must be open." };

      const isRepresentative = user.role === "Representative";
      if (dest.owner_staff_id !== user.id && !isRepresentative)
        return { ok: false, message: "Only the group owner or Representative can add to it." };

      const members = complaints.filter(
        (m) => m.case_group_id === source.id && isOpenComplaint(m)
      );
      if (members.length === 0)
        return { ok: false, message: "No open members to pull." };

      persist(ybApi.pullGroup(source.id, dest.id));
      for (const m of members) {
        touch(
          m.id,
          {
            case_group_id: dest.id,
            status: "In Progress",
          },
          {
            by: user.id,
            at: nowIso(),
            action: "group-assign",
            detail: `${user.name} pulled ${m.title} from ${source.title} to ${dest.title} as part of group pull`,
          }
        );
      }
      setCaseGroups((prev) =>
        prev.map((g) => (g.id === source.id ? { ...g, status: "Closed" } : g))
      );

      return {
        ok: true,
        count: members.length,
        groupId: dest.id,
        message: `${members.length} complaint${members.length === 1 ? "" : "s"} pulled from ${source.title} to ${dest.title}.`,
      };
    },
    [caseGroups, complaints, touch, persist]
  );

  // Updates append a history entry; repeatInGroup shares one update across every
  // open member of the complaint's case group.
  const addUpdate = useCallback(
    (id, { detail, attachmentName, repeatInGroup }, user) => {
      const target = complaints.find((x) => x.id === id);
      persist(ybApi.addUpdate(id, { detail, attachmentName, repeatInGroup }));
      const entryFor = (suffix) => ({
        by: user.id,
        at: nowIso(),
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
            { updatedAt: nowIso() },
            entryFor(members.length > 1 ? `shared across case group` : null)
          );
        }
        return { count: members.length, groupId: target.case_group_id };
      }
      touch(id, { updatedAt: nowIso() }, entryFor(null));
      return { count: 1, groupId: null };
    },
    [complaints, touch, persist]
  );

  const value = useMemo(
    () => ({
      complaints,
      caseGroups,
      staff,
      staffName,
      kawasan,
      categories,
      loading,
      syncError,
      reload,
      groupMembers,
      groupOwnerOf,
      touch,
      releaseComplaint,
      createGroupWithSelection,
      moveToExistingGroup,
      moveGroupToGroup,
      addUpdate,
      setAttention,
    }),
    [
      complaints,
      caseGroups,
      staff,
      staffName,
      kawasan,
      categories,
      loading,
      syncError,
      reload,
      groupMembers,
      groupOwnerOf,
      touch,
      releaseComplaint,
      createGroupWithSelection,
      moveToExistingGroup,
      moveGroupToGroup,
      addUpdate,
      setAttention,
    ]
  );

  return <YbComplaintsContext.Provider value={value}>{children}</YbComplaintsContext.Provider>;
}

export function useYbComplaints() {
  const ctx = useContext(YbComplaintsContext);
  if (!ctx) throw new Error("useYbComplaints must be used inside YbComplaintsProvider");
  return ctx;
}
