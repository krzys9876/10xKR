-------------------------
-- poprawka do users (bez tego nie dałoby się założyć automatycznie użytkownika - trigger nie wypełnia tych pól)
ALTER TABLE public.users ALTER COLUMN last_name drop not NULL;
-------------------------
select * from users;

-- aktualizacja danych
update users set first_name='Alicja',last_name='Adamska' where id='72490bf8-e902-4b26-9885-47aa9cce7f1c';
update users set first_name='Bartosz',last_name='Bednarski' where id='0d9ebd77-2e55-4f99-b166-a6f78ef7bd07';
update users set first_name='Cezary',last_name='Czerski' where id='5bba6859-2dac-48af-8f34-874d5be84909';
-- aktualizacja struktury
update users set manager_id='72490bf8-e902-4b26-9885-47aa9cce7f1c'
where id in ('0d9ebd77-2e55-4f99-b166-a6f78ef7bd07','5bba6859-2dac-48af-8f34-874d5be84909');