# How WaKiL Works / Cara WaKiL Berfungsi

Each section is self-contained.

---

## Overview of the complaint journey

1. The citizen registers, logs in, and has their address verified.
2. WaKiL assigns the citizen to one MP (parliamentary constituency) and one ADUN (state constituency).
3. The citizen opens the chatbot and describes a problem.
4. The chatbot asks short questions to collect: what happened, where, when, and optional evidence.
5. The AI classifies the complaint into a category and sets a priority.
6. The citizen reviews a summary showing category, priority, and who will receive it, and can edit it.
7. After confirmation, WaKiL checks for duplicates and creates a ticket with a unique ticket ID.
8. The wakil rakyat's office reviews the ticket and updates its status.
9. The citizen follows progress on the ticket timeline until it is resolved or rejected.

**Ringkasan:** Daftar dan sahkan alamat, bercakap dengan chatbot, semak ringkasan, sahkan, dapat ID tiket, dan jejak status.

---

## Chatbot interview rules

- The chatbot asks one question at a time.
- It never asks for information the citizen already gave.
- It never asks the citizen how serious the problem is; the AI decides priority.
- If the citizen does not know exactly when it happened, the chatbot asks when they first noticed it.
- Evidence (photo) is optional and never blocks a complaint.
- When all required details are collected, the chatbot summarises and asks the citizen to confirm.
- The chatbot only answers questions about complaints, wakil rakyat, and how WaKiL works.

---

## Required and optional details

**Required:** what happened, location, and when.
**Optional:** evidence such as photos.

---

## How priority is set

The AI suggests Low, Medium, or High from the description.
- **High:** danger to life or health, or many households affected right now.
- **Medium:** ongoing problem affecting daily life.
- **Low:** minor or cosmetic issue.

Priority helps the wakil rakyat's office sort the inbox. It is a suggestion, not a guarantee of response time.

---

## Low confidence and manual review

If the AI is not confident about the category, or its answer is invalid, WaKiL sets the category to **Others** and marks the ticket for **manual review**. The ticket is sent to both the MP and the ADUN so it does not get lost. Staff then re-categorise it before triage.

---

## Duplicate detection

When a complaint is confirmed, WaKiL compares it with open tickets in the same constituency and category. If one is very similar, the new report is linked to it as a possible duplicate and the community-report count increases. The citizen still gets their own ticket ID. A higher count helps the representative see how many residents are affected.

---

## Ticket statuses

| Status | Meaning |
|---|---|
| Pending | Submitted, waiting for review |
| In Progress | Accepted, work is ongoing, updates are logged on the timeline |
| Resolved | Completed, usually with a job-done update (description and photo) |
| Rejected | Not actionable; a reason note is required and shown to the citizen |

---

## What the wakil rakyat's office does

- Sees an inbox grouped by category, sorted by priority and date, with manual-review tickets flagged.
- Opens a ticket to see the AI summary, structured details, duplicate count, evidence, and chat transcript.
- Decides whether it is valid and actionable.
- Rejects with a reason, or moves it to In Progress and logs updates.
- Marks it Resolved and may publish a job-done update on the public performance dashboard.

---

## Dashboards

- **Home dashboard:** shows the citizen's own MP and ADUN with performance cards (jobs done, complaints resolved, response time).
- **Browse:** any wakil rakyat's public dashboard can be viewed, but complaints can only be filed to the citizen's own MP and ADUN.
- **My Complaints:** lists the citizen's tickets, filterable by status, with a timeline for each.

---

## Who can file to whom

Citizens can only file complaints to the MP and ADUN of their own verified constituencies. This is enforced by the system, not only hidden in the screen.

---

## Drafts

If the citizen leaves midway, the chat can be saved as a draft and resumed later, or discarded. No ticket exists until the citizen confirms.

---

## Limits

- WaKiL is not an emergency service. Call 999 for emergencies.
- WaKiL does not give legal advice.
- WaKiL cannot promise outcomes or resolution times.
- The category-to-representative routing is a default suggestion, and the citizen can change it.
