alter table "public"."cards" enable row level security;

create policy "Users can delete their own cards"
on "public"."cards"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own cards"
on "public"."cards"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own cards"
on "public"."cards"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own cards"
on "public"."cards"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));



