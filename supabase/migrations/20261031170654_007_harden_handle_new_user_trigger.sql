/*
# Harden the handle_new_user trigger function

## Why
The database security linter flagged `public.handle_new_user()` for two reasons:
1. Its `search_path` is mutable, which is a known Postgres security footgun for
   `SECURITY DEFINER` functions.
2. It is callable as an RPC by the `anon` and `authenticated` roles through the
   Data API, even though it is an internal trigger that should never be invoked
   directly by any client.

## Changes
1. Recreate `public.handle_new_user()` with `set search_path = public, pg_temp`
   so it resolves names only against the trusted `public` schema.
2. `REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;`
   so no client role can call it as an RPC. The trigger still fires because
   triggers run with the owner's privileges, not the caller's.

## Notes
- No table data is changed.
- The trigger `on_auth_user_created` continues to fire unchanged; only the
  function definition and its execute grants are affected.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
