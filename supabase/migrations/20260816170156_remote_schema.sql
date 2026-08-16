-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE TABLE public.contact_submissions (
  id                      uuid                     DEFAULT gen_random_uuid() NOT NULL,
  name                    text                     NOT NULL,
  email                   text                     NOT NULL,
  subject                 text                     DEFAULT ''::text NOT NULL,
  message                 text                     NOT NULL,
  notification_status     text                     DEFAULT 'pending'::text NOT NULL,
  notification_message_id text,
  created_at              timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.contact_submissions
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.contact_submissions
  ADD CONSTRAINT contact_submissions_email_length CHECK (char_length(email) >= 1 AND char_length(email) <= 100);

ALTER TABLE public.contact_submissions
  ADD CONSTRAINT contact_submissions_message_length CHECK (char_length(message) >= 10 AND char_length(message) <= 1000);

ALTER TABLE public.contact_submissions
  ADD CONSTRAINT contact_submissions_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 40);

ALTER TABLE public.contact_submissions
  ADD CONSTRAINT contact_submissions_notification_status CHECK (notification_status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text]));

ALTER TABLE public.contact_submissions
  ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);

ALTER TABLE public.contact_submissions
  ADD CONSTRAINT contact_submissions_subject_length CHECK (char_length(subject) <= 80);

GRANT ALL ON public.contact_submissions TO anon;

GRANT ALL ON public.contact_submissions TO authenticated;

GRANT ALL ON public.contact_submissions TO service_role;
