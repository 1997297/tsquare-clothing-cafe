-- Synthetic pre-expansion data, only loaded into the disposable native cluster.
insert into auth.users(id,email,raw_user_meta_data) values
 ('f3000000-0000-0000-0000-000000000001','phase3-preserve1@example.invalid','{}'),
 ('f3000000-0000-0000-0000-000000000002','phase3-preserve2@example.invalid','{}');
insert into public.bespoke_requests(request_reference,customer_id,style_name,style_image,status,contact_info,admin_notes)
values
 ('TCC-REQ-000014','f3000000-0000-0000-0000-000000000001','Preserved legacy request','/images/preserved-fit.jpg','submitted','{}','PRIVATE EXISTING NOTE'),
 ('TCC-REQ-000019','f3000000-0000-0000-0000-000000000002','Preserved second request',null,'submitted','{}',null);
