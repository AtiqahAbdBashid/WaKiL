"""YB-portal mock package (in-memory, clearly labelled).

Owns the staff API for the YB portal. Stays separate from citizen
intake persistence (SQLAlchemy/Mongo). Route code uses store functions
only, so a later persistence decision replaces the store without
touching triage rules.
"""
