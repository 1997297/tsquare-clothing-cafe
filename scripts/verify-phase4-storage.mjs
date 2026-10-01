// Invoked only by verify-phase4-db.mjs against its disposable loopback database.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

export async function verifyPhase4Storage(observer, createClient) {
  const customer = randomUUID(), other = randomUUID(), staff = randomUUID();
  for (const id of [customer, other, staff]) await observer.query('insert into auth.users(id,email) values($1,$2)', [id, `${id}@example.invalid`]);
  await observer.query("insert into public.staff_accounts(user_id,role,status) values($1,'admin','active')", [staff]);
  const fit = (await observer.query(`select f.id,
    (select fabric_id from public.catalogue_fit_fabrics where fit_id=f.id limit 1) as fabric,
    (select colour_id from public.catalogue_fit_colours where fit_id=f.id limit 1) as colour,
    (select id from public.catalogue_fit_images where fit_id=f.id order by is_primary desc,sort_order,id limit 1) as image
    from public.catalogue_fits f where status='published' order by id limit 1`)).rows[0];
  const submitter = createClient(), writer = createClient();
  await submitter.connect(); await writer.connect();
  const writerPid = (await writer.query('select pg_backend_pid() as id')).rows[0].id;
  const role = async (connection, id) => {
    await connection.query("begin; set local role authenticated; set local lock_timeout='10s'");
    await connection.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
  };
  try {
    for (const bucket of ['bespoke-references', 'catalogue-media']) {
      for (const action of ['update', 'delete']) {
        const path = `${bucket === 'bespoke-references' ? customer : fit.id}/phase4-${randomUUID()}.png`;
        await observer.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values($1,$2,$3,'{\"mimetype\":\"image/png\",\"size\":128,\"marker\":\"original\"}')", [bucket,path,bucket === 'bespoke-references' ? customer : staff]);
        if (bucket === 'catalogue-media') await observer.query('update public.catalogue_fit_images set image_path=null,storage_object_path=$1 where id=$2', [path, fit.image]);
        const payload = bucket === 'bespoke-references'
          ? { is_idea_path:true, style_name:'Media retention test', contact_info:{}, reference_images:[{path}] }
          : { style_id:fit.id, fabric:{id:fit.fabric}, colour:{id:fit.colour}, contact_info:{} };
        await role(submitter,customer);
        await submitter.query('select public.submit_bespoke_request($1::jsonb,$2::uuid)', [payload,randomUUID()]);
        await role(writer,bucket === 'bespoke-references' ? customer : staff);
        let settled = false;
        const pending = writer.query(action === 'update'
          ? "update storage.objects set metadata=metadata||'{\"marker\":\"changed\"}' where bucket_id=$1 and name=$2"
          : 'delete from storage.objects where bucket_id=$1 and name=$2', [bucket,path])
          .then(result => { settled=true; return { result }; }, error => { settled=true; return { error }; });
        let waiting = false;
        for (let i=0;i<100 && !settled;i++) {
          const state = (await observer.query('select wait_event_type from pg_stat_activity where pid=$1',[writerPid])).rows[0];
          if (state?.wait_event_type === 'Lock') { waiting=true; break; }
          await delay(20);
        }
        assert.equal(waiting,true,`${bucket} ${action} must serialize with submission`);
        await submitter.query('commit');
        const outcome = await pending;
        if (outcome.error) throw outcome.error;
        assert.equal(outcome.result.rowCount,0,`${bucket} ${action} must not modify a newly captured object`);
        await writer.query('commit');
        const preserved = (await observer.query('select metadata from storage.objects where bucket_id=$1 and name=$2',[bucket,path])).rows[0];
        assert.equal(preserved?.metadata.marker,'original');
        if (bucket === 'catalogue-media') {
          await observer.query("update public.catalogue_fits set status='archived' where id=$1",[fit.id]);
          await role(writer,customer);
          assert.equal((await writer.query('select name from storage.objects where bucket_id=$1 and name=$2',[bucket,path])).rowCount,1);
          await writer.query('rollback');
          await role(writer,other);
          assert.equal((await writer.query('select name from storage.objects where bucket_id=$1 and name=$2',[bucket,path])).rowCount,0);
          await writer.query('rollback');
          await observer.query("update public.catalogue_fits set status='published' where id=$1",[fit.id]);
        }
        console.log(`Passed concurrent ${bucket} ${action}: retained original object, RLS isolation intact`);
      }
    }
  } finally {
    await submitter.query('rollback'); await writer.query('rollback');
    await submitter.end(); await writer.end();
  }
}
