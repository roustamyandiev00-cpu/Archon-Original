-- Harden team membership RPCs: not callable by anonymous clients.
revoke execute on function public.team_add_member(bigint, text, text) from anon;
revoke execute on function public.team_list_members(bigint) from anon;
revoke execute on function public.team_update_member(bigint, bigint, text, boolean) from anon;
