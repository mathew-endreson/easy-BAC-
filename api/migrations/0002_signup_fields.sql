-- Adds the fields collected by the redesigned sign-up form (Figma: BluxTech
-- Agency Website Template, node 345:400): first/last name instead of a
-- single free-text name, an Algerian phone number, and a wilaya. display_name
-- is kept (derived as "first_name last_name" at registration) since it's
-- already used throughout the app (teacher dashboard header, audit log, etc).

ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN phone_number TEXT;
ALTER TABLE users ADD COLUMN wilaya TEXT;
