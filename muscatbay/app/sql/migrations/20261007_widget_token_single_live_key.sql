-- Widget keys: one live key per device label, even under concurrent calls.
--
-- create_widget_token revokes the caller's previous key for the label before
-- issuing a new one, but calls that overlapped (the app's page asked two or
-- three times as it opened) each ran their revoke before any sibling had
-- committed, leaving several live keys. A per-user, per-label transaction
-- lock serialises the calls. The page-side cause is fixed in
-- components/providers/widget-pairing.tsx.

create or replace function public.create_widget_token(p_label text)
returns text
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
    v_label text := btrim(coalesce(p_label, ''));
    v_token text;
begin
    if v_user is null then
        raise exception 'Sign in before connecting the widget.' using errcode = '42501';
    end if;
    if not public.widget_owner_can_read_water(v_user) then
        raise exception 'This account cannot read water data.' using errcode = '42501';
    end if;
    if char_length(v_label) not between 1 and 60 then
        raise exception 'Widget label must be 1 to 60 characters.' using errcode = '22023';
    end if;

    -- One pairing at a time per device label: a second call waits here until
    -- the first commits, then revokes the key the first one issued.
    perform pg_advisory_xact_lock(
        hashtextextended('widget_token:' || v_user::text || ':' || v_label, 0)
    );

    update public.widget_tokens
       set revoked_at = now()
     where user_id = v_user and label = v_label and revoked_at is null;

    v_token := encode(extensions.gen_random_bytes(32), 'hex');
    insert into public.widget_tokens (user_id, token_hash, label)
    values (v_user, encode(extensions.digest(v_token, 'sha256'), 'hex'), v_label);
    return v_token;
end;
$$;

revoke all on function public.create_widget_token(text) from public, anon;
grant execute on function public.create_widget_token(text) to authenticated;
