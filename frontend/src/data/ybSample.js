// YB portal constants and formatting helpers. Complaint data comes from the API.

export const ybStatuses = ["Pending", "In Progress", "Resolved"];

// Fixed resolve reasons for ending a case group flow. Verbatim from the
// Representative's office wording, do not paraphrase.
export const END_FLOW_REASONS = [
  "Outside Constituency Jurisdiction: This complaint concerns an area outside the YB's constituency",
  "Insufficient Information: The information provided is not sufficient for the service centre to investigate or take action",
  "Duplicate Complaint: A duplicate complaint from the same Citizen has already been submitted and is currently being handled",
  "Already Resolved: The issue has already been resolved or corrective action has been completed",
  "Not Under YB's Authority: This matter falls outside of the responsibility of the elected Representative's authority",
  "Incorrect Category: The complaint was submitted under an inappropriate category and cannot be processed as submitted",
  "No Evidence / Supporting Documents: Additional evidence such as photographs, documents, or other supporting information is required",
  "Unverifiable Information: The details provided could not be verified by the service centre",
  "Invalid Complaint: The submission does not contain a clear or actionable complaint",
  "Personal / Private Dispute: The matter concerns a private dispute that should be resolved through the appropriate legal or personal channels",
  "Legal Matter: The issue is currently subject to legal proceedings or requires intervention through the appropriate legal authority",
  "Emergency / Wrong Channel: The matter requires immediate assistance and should be reported directly to the relevant emergency or enforcement agency",
  "Outside Service Scope: The request does not fall within the services or assistance provided by the YB's service centre",
  "Unable to Locate Issue: The reported issue could not be located or identified based on the information provided",
  "Complainant Unreachable: The service centre was unable to contact the complainant to obtain the required information",
];

export const formatRef = (id) => {
  const s = String(id);
  return /^[0-9a-f]{8}-/i.test(s) ? s.slice(0, 6).toUpperCase() : s.padStart(4, "0");
};

// Prefer the real reference number (e.g. "2026-0001"); fall back to padded id.
// Accepts a complaint object or a raw id so existing call sites can migrate.
export const formatDisplayRef = (cOrId) => {
  if (cOrId && typeof cOrId === "object") return cOrId.ref_no ?? formatRef(cOrId.id);
  return formatRef(cOrId);
};

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });

// Seeds are full ISO-8601 timestamps; writers emit the same. Readers must not
// append "T00:00:00Z" to a value that already carries a time: date-only input
// parses as UTC midnight, anything else parses as-is.
export const parseStamp = (v) =>
  Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? `${v}T00:00:00Z` : v);

export const formatDateTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kuala_Lumpur",
  });
};
