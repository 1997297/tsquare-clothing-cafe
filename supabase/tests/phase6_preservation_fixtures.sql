-- Disposable native runner only, BEFORE expansion. Mirrors reported live counts.
insert into public.orders(id,order_reference,customer_id,style_id,style_code,style_name,measurements_snapshot,total_amount,total_amount_minor)
 values('f6930000-0000-0000-0000-000000000001','PHASE6-PRESERVE-ORDER','f3000000-0000-0000-0000-000000000001','preserve','PRESERVE','Original legitimate-shaped order','{}',100,10000);
insert into public.payments(order_id,customer_id,amount,amount_minor,type,provider,provider_reference,internal_reference,status,paid_at)
 values('f6930000-0000-0000-0000-000000000001','f3000000-0000-0000-0000-000000000001',25,2500,'deposit','manual_transfer','PHASE6-PRESERVE-TRANSFER','PHASE6-PRESERVE-PAYMENT','successful',now());
insert into public.appointments(id,customer_id,type,preferred_date,preferred_time,notes) values
 ('f6900000-0000-0000-0000-000000000001','f3000000-0000-0000-0000-000000000001','style-consultation','2027-01-05','morning','Preserve original intent'),
 ('f6900000-0000-0000-0000-000000000002','f3000000-0000-0000-0000-000000000001','first-fitting','2027-01-06','afternoon',null),
 ('f6900000-0000-0000-0000-000000000003','f3000000-0000-0000-0000-000000000002','pickup','2027-01-07','evening',null);
insert into public.concierge_requests(id,reference_code,customer_id,category,subject,message,related_request_id,related_order_id)
 values('f6910000-0000-0000-0000-000000000001','LEGACY-CONCIERGE','f3000000-0000-0000-0000-000000000001','general_enquiry','Preserve subject','Initial message','TCC-REQ-000014','unresolvable-old-label');
insert into public.concierge_messages(id,request_id,sender_type,sender_id,sender_name,message,created_at) values
 ('f6920000-0000-0000-0000-000000000001','f6910000-0000-0000-0000-000000000001','customer','f3000000-0000-0000-0000-000000000001','Legacy client','Initial message','2026-01-01 10:00:00+00'),
 ('f6920000-0000-0000-0000-000000000002','f6910000-0000-0000-0000-000000000001','concierge','f3000000-0000-0000-0000-000000000002','Legacy internal name','Original staff reply','2026-01-01 10:00:00+00'),
 ('f6920000-0000-0000-0000-000000000003','f6910000-0000-0000-0000-000000000001','customer','f3000000-0000-0000-0000-000000000001','Legacy client','Original follow-up','2026-01-01 11:00:00+00');
