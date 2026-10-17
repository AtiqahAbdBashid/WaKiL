-- WaKiL schema, derived from docs/Wakil_ERDiagram_Mermaid.drawio.
-- Primary keys are all UUID.

BEGIN;

CREATE TABLE constituencies (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar(100) NOT NULL,
    geojson_ref varchar(100)
);

CREATE TABLE service_centers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            varchar(150) NOT NULL,
    address         text,
    constituency_id  uuid NOT NULL UNIQUE REFERENCES constituencies (id)
);

-- One identity table for both profiles. Staff rows carry a role and a service
-- center (many staff per center); citizen rows carry neither. password_hash is null for OAuth logins.
CREATE TABLE users (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_center_id uuid REFERENCES service_centers (id),
    email             varchar(255) NOT NULL UNIQUE,
    name              varchar(100),
    password_hash     text,
    profile           varchar(10) NOT NULL CHECK (profile IN ('citizen', 'staff')),
    role              varchar(20) CHECK (role IN ('Representative', 'Aide', 'Intern')),
    is_active         boolean NOT NULL DEFAULT true,
    CONSTRAINT users_staff_fields CHECK (
        (profile = 'staff'   AND role IS NOT NULL AND service_center_id IS NOT NULL) OR
        (profile = 'citizen' AND role IS NULL     AND service_center_id IS NULL)
    )
);

-- Rejects rows whose user_id is set to a non-staff user.
CREATE FUNCTION require_staff_author() RETURNS trigger AS $$
BEGIN
    IF NEW.user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id AND profile = 'staff') THEN
        RAISE EXCEPTION 'user_id must reference a staff user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- user_id is the owning staff member; null while the group is unclaimed.
CREATE TABLE case_groups (
    id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users (id),
    title   varchar(200) NOT NULL
);

CREATE TRIGGER case_groups_staff_only
    BEFORE INSERT OR UPDATE OF user_id ON case_groups
    FOR EACH ROW EXECUTE FUNCTION require_staff_author();

CREATE TABLE categories (
    id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL UNIQUE
);

-- A conversation between a user and the AI assistant.
CREATE TABLE chat_sessions (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users (id),
    title      varchar(200) NOT NULL DEFAULT 'New Conversation',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- chat_session_id is unique: a conversation produces at most one complaint. Deleting
-- the chat keeps the complaint. latitude and longitude are set together or both null.
CREATE TABLE complaints (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users (id),
    category_id     uuid NOT NULL REFERENCES categories (id),
    case_group_id   uuid REFERENCES case_groups (id),
    chat_session_id uuid UNIQUE REFERENCES chat_sessions (id) ON DELETE SET NULL,
    title           varchar(200) NOT NULL,
    body            text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    status          varchar(20) NOT NULL DEFAULT 'Pending'
                    CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
    rep_attention   boolean NOT NULL DEFAULT false,
    attachment      text,
    latitude        double precision,
    longitude       double precision,
    CONSTRAINT complaints_coords CHECK (
        (latitude IS NULL) = (longitude IS NULL)
        AND (latitude IS NULL OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
    )
);

CREATE TABLE complaint_updates (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id uuid NOT NULL REFERENCES complaints (id) ON DELETE CASCADE,
    user_id      uuid NOT NULL REFERENCES users (id),
    body         text NOT NULL,
    attachment   text,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER complaint_updates_staff_only
    BEFORE INSERT OR UPDATE OF user_id ON complaint_updates
    FOR EACH ROW EXECUTE FUNCTION require_staff_author();

CREATE TABLE chat_messages (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES chat_sessions (id) ON DELETE CASCADE,
    sender     varchar(20) NOT NULL,
    body       text NOT NULL,
    image_url  text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaints_user       ON complaints (user_id);
CREATE INDEX idx_complaints_category   ON complaints (category_id);
CREATE INDEX idx_complaints_group      ON complaints (case_group_id);
CREATE INDEX idx_case_groups_user      ON case_groups (user_id);
CREATE INDEX idx_updates_complaint     ON complaint_updates (complaint_id);
CREATE INDEX idx_messages_session      ON chat_messages (session_id);
CREATE INDEX idx_sessions_user         ON chat_sessions (user_id);

COMMIT;
