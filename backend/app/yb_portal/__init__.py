"""YB-portal mock package (in-memory, clearly labelled).

Owns the staff API for the YB portal. Stays separate from citizen
intake persistence (SQLAlchemy/Mongo). Route code uses store functions
only, so a later persistence decision replaces the store without
touching triage rules.

ERD v3 merge targets (docs/Wakil_ERDiagram_Mermaid_3.md): staff becomes
USER rows, the aduan pool becomes COMPLAINT rows, embedded history
becomes COMPLAINT_UPDATE rows, groups become CASE_GROUP rows, the office
becomes SERVICE_CENTER, KAWASAN becomes CONSTITUENCY.
"""
