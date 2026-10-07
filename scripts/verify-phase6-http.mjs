// Opt-in remote QA verification. Authoring/syntax checks do not execute main.
import { readFile, writeFile, rename, realpath } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

let stage = 'configuration', passes = 0, save, run;
const check = (condition) => { if (!condition) throw new Error('verification_failed'); };
const pass = (label) => { passes++; console.log(`PASS ${label}`); };
const uuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const accessDenied = (error) => error && ['42501', 'PGRST202'].includes(error.code);
const businessDenied = (error, pattern) => error && error.code === 'P0001' && pattern.test(error.message);

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node scripts/verify-phase6-http.mjs --manifest <QA.json> [--contract]');
    return;
  }
  const at = args.indexOf('--manifest');
  check(at >= 0 && args[at + 1] && !args[at + 1].startsWith('--'));
  const contract = args.includes('--contract');
  check(args.length === (contract ? 3 : 2) && args.filter(x => x === '--manifest').length === 1);
  check(args.every((x, i) => i === at || i === at + 1 || x === '--contract'));
  const manifestPath = await realpath(resolve(args[at + 1]));
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  check(typeof manifest.tag === 'string' && /^tcc-phase6-[A-Za-z0-9._-]{1,100}$/.test(manifest.tag));
  const roles = ['client', 'other', 'admin', 'ceo'];
  const users = manifest.users;
  for (const role of roles) {
    const u = users?.[role];
    check(u && uuid(u.id) && typeof u.email === 'string' && u.email.length > 3 && typeof u.password === 'string' && u.password.length > 0);
  }
  check(new Set(roles.map(r => users[r].id.toLowerCase())).size === 4);
  check(new Set(roles.map(r => users[r].email.toLowerCase())).size === 4);
  check(manifest.records === undefined || (manifest.records && typeof manifest.records === 'object' && !Array.isArray(manifest.records)));
  // Resolve installed packages AND environment from the invoking application cwd.
  const require = createRequire(join(process.cwd(), 'package.json'));
  require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  check(url && publicKey && serviceKey && publicKey !== serviceKey && new URL(url).protocol === 'https:');
  let requests = 0;
  const deadline = Date.now() + 6 * 60_000;
  const boundedFetch = async (input, init = {}) => {
    check(++requests <= 200 && Date.now() < deadline);
    const signal = init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(12_000)]) : AbortSignal.timeout(12_000);
    // Credentials must never be redirected to another origin.
    check(new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url).origin === new URL(url).origin);
    return fetch(input, { ...init, signal, redirect: 'error' });
  };
  const make = key => createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: boundedFetch },
  });
  const service = make(serviceKey), anonymous = make(publicKey), clients = {};
  stage = 'QA identity preflight';
  // Every identity is verified before sign-in creates sessions or any business write.
  for (const role of roles) {
    const result = await service.auth.admin.getUserById(users[role].id);
    const actual = result.data?.user;
    check(!result.error && actual?.id === users[role].id && actual.email === users[role].email
      && actual.user_metadata?.tcc_phase6_verification === manifest.tag);
  }
  pass('four exact QA identities and verification tags');
  manifest.records ??= {};
  manifest.records.phase6HttpRuns ??= [];
  check(Array.isArray(manifest.records.phase6HttpRuns));
  run = { id: randomUUID(), mode: contract ? 'contract' : 'expansion', startedAt: new Date().toISOString(), status: 'running', fixtures: {}, operations: [], attemptedRawFixtures: [] };
  manifest.records.phase6HttpRuns.push(run);
  save = async () => {
    const temporary = join(dirname(manifestPath), `.tcc-phase6-${run.id}.tmp`);
    await writeFile(temporary, JSON.stringify(manifest, null, 2) + '\n', { mode: 0o600 });
    await rename(temporary, manifestPath);
  };
  await save();
  stage = 'QA session authentication';
  for (const role of roles) {
    clients[role] = make(publicKey);
    const result = await clients[role].auth.signInWithPassword({ email: users[role].email, password: users[role].password });
    check(!result.error && result.data.user?.id === users[role].id);
  }
  pass('four authenticated QA sessions');
  const { client, other, admin, ceo } = clients;
  const ok = async (pending) => { const r = await pending; check(!r.error && r.data !== null); return r.data; };
  stage = 'QA staff membership preflight';
  for (const role of ['admin', 'ceo']) {
    const membership = await ok(clients[role].from('staff_accounts').select('user_id,role,status').eq('user_id', users[role].id).single());
    check(membership.user_id === users[role].id && membership.role === role && membership.status === 'active');
  }
  pass('exact active QA Admin and CEO memberships');
  const rpc = (actor, name, params) => actor.rpc(name, params);
  // Persist all intents before dispatch, including failure probes. No tokens are stored.
  const intent = async (name, params) => {
    const value = { ...params, p_operation_key: randomUUID() };
    run.operations.push({ name, params: value }); await save(); return value;
  };
  const capture = async (data) => {
    if (!data) return;
    if (Array.isArray(data)) { check(data.length <= 20); for (const row of data) await capture(row); return; }
    const ids = {};
    for (const key of ['appointment', 'conversation', 'message', 'change_request']) if (uuid(data[key]?.id)) ids[key] = data[key].id;
    if (uuid(data.note_id)) ids.note_id = data.note_id;
    if (uuid(data.id)) ids.legacy_or_raw_id = data.id;
    if (Object.keys(ids).length) { (run.returnedIds ??= []).push(ids); await save(); }
  };
  const writeRpc = async (actor, name, params) => {
    run.operations.push({ name, dispatchedParams: params }); await save();
    const result = await rpc(actor, name, params);
    await capture(result.data); // Also retain unexpected successful failure-probe results.
    return result;
  };
  const denied = async (label, pending, predicate = accessDenied) => {
    stage = label;
    const result = await pending; await capture(result.data);
    check(predicate(result.error)); pass(label);
  };
  const dateParts = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(Date.now() + 7 * 86400_000));
  const datePart = type => dateParts.find(part => part.type === type).value;
  const preferredDate = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;
  const appointmentParams = () => ({ p_type: 'style-consultation', p_preferred_date: preferredDate, p_preferred_time: 'morning', p_order_id: null, p_bespoke_request_id: null, p_note: manifest.tag });
  stage = 'create and persist own appointments';
  for (const [role, actor] of [['client', client], ['other', other]]) {
    const params = await intent('create_atelier_appointment', appointmentParams());
    const data = await ok(writeRpc(actor, 'create_atelier_appointment', params));
    check(uuid(data.appointment?.id)); run.fixtures[`${role}AppointmentId`] = data.appointment.id; await save();
    check(data.appointment.status === 'requested' && data.appointment.scheduled_start_at === null);
    check(isDeepStrictEqual(await ok(writeRpc(actor, 'create_atelier_appointment', params)), data));
  }
  pass('requested appointment creation and exact replay');
  const appointmentId = run.fixtures.clientAppointmentId;
  const otherAppointmentId = run.fixtures.otherAppointmentId;
  const detail = (actor = client) => ok(rpc(actor, 'get_atelier_appointment_detail', { p_appointment_id: appointmentId }));
  const a0 = await detail();
  await denied('other client appointment isolation', rpc(other, 'get_atelier_appointment_detail', { p_appointment_id: appointmentId }), e => businessDenied(e, /^not_found$/));
  await denied('anonymous appointment denial', rpc(anonymous, 'get_atelier_appointment_detail', { p_appointment_id: appointmentId }));
  await denied('anonymous appointment creation denial', writeRpc(anonymous, 'create_atelier_appointment', await intent('create_atelier_appointment', appointmentParams())));
  for (const action of ['confirm', 'complete']) {
    const params = await intent('manage_atelier_appointment', { p_appointment_id: appointmentId, p_action: action, p_schedule_date: null, p_schedule_time: null, p_duration_minutes: null, p_reason: null, p_staff_note: null, p_expected_version: a0.appointment.lock_version });
    await denied(`client ${action} denial`, writeRpc(client, 'manage_atelier_appointment', params), e => businessDenied(e, /unauthorized|forbidden|staff/i));
    check(isDeepStrictEqual(await detail(), a0));
  }
  const privateNote = `private QA note ${run.id}`;
  stage = 'staff private note';
  const noteParams = await intent('add_atelier_appointment_note', { p_appointment_id: appointmentId, p_note: privateNote });
  const note = await ok(writeRpc(admin, 'add_atelier_appointment_note', noteParams));
  run.fixtures.noteId = note.note_id; await save();
  check(isDeepStrictEqual(await ok(writeRpc(admin, 'add_atelier_appointment_note', noteParams)), note));
  check((await detail(admin)).staff_notes.some(n => n.id === note.note_id));
  const safe = (value) => {
    const text = JSON.stringify(value);
    for (const secret of [privateNote, users.admin.id, users.ceo.id, users.admin.email, users.ceo.email]) check(!text.includes(secret));
    const walk = obj => {
      if (!obj || typeof obj !== 'object') return;
      for (const [key, value] of Object.entries(obj)) {
        check(!['staff_notes', 'staff_actors', 'staff_senders', 'sender_id', 'actor_id'].includes(key)); walk(value);
      }
    };
    walk(value);
  };
  safe(await detail()); pass('staff note replay and client-safe appointment projection');
  stage = 'pending client cancellation and staff review';
  const changeParams = await intent('request_atelier_appointment_change', { p_appointment_id: appointmentId, p_change_type: 'cancellation', p_proposed_date: null, p_proposed_time: null, p_reason: manifest.tag, p_expected_version: (await detail()).appointment.lock_version });
  const change = await ok(writeRpc(client, 'request_atelier_appointment_change', changeParams));
  check(uuid(change.change_request?.id)); run.fixtures.changeId = change.change_request.id; await save();
  check(change.change_request.status === 'pending_review' && change.appointment.status === 'requested');
  check(isDeepStrictEqual(await ok(writeRpc(client, 'request_atelier_appointment_change', changeParams)), change));
  await denied('other client change replay denied', writeRpc(other, 'request_atelier_appointment_change', changeParams), e => businessDenied(e, /^not_found$/));
  const reviewParams = await intent('review_atelier_appointment_change', { p_change_request_id: run.fixtures.changeId, p_decision: 'decline', p_schedule_date: null, p_schedule_time: null, p_duration_minutes: null, p_reason: manifest.tag, p_staff_note: null, p_expected_appointment_version: change.appointment.lock_version, p_expected_change_version: change.change_request.lock_version });
  await denied('client change review denial', writeRpc(client, 'review_atelier_appointment_change', reviewParams), e => businessDenied(e, /unauthorized|forbidden|staff/i));
  stage = 'staff declines pending change';
  const reviewed = await ok(writeRpc(ceo, 'review_atelier_appointment_change', reviewParams));
  check(reviewed.change_request.status === 'declined' && reviewed.appointment.status === 'requested');
  safe(reviewed);
  check(isDeepStrictEqual(await ok(writeRpc(ceo, 'review_atelier_appointment_change', reviewParams)), reviewed));
  pass('pending cancellation, owner reauthorization and staff review replay');
  const conciergeParams = { p_category: 'general_enquiry', p_subject: `${manifest.tag} HTTP QA`, p_message: `${manifest.tag} initial QA message`, p_order_id: null, p_bespoke_request_id: null, p_appointment_id: appointmentId };
  await denied('unowned concierge context denial', writeRpc(client, 'create_atelier_concierge_request', await intent('create_atelier_concierge_request', { ...conciergeParams, p_appointment_id: otherAppointmentId })), e => businessDenied(e, /context|not_found/i));
  await denied('invalid concierge input denial', writeRpc(client, 'create_atelier_concierge_request', await intent('create_atelier_concierge_request', { ...conciergeParams, p_category: 'invalid' })), e => businessDenied(e, /^invalid_category$/));
  stage = 'create and persist own concierge thread';
  const createParams = await intent('create_atelier_concierge_request', conciergeParams);
  const created = await ok(writeRpc(client, 'create_atelier_concierge_request', createParams));
  check(uuid(created.conversation?.id) && uuid(created.message?.id));
  run.fixtures.threadId = created.conversation.id; run.fixtures.messageIds = [created.message.id]; await save();
  const threadId = run.fixtures.threadId;
  check(created.conversation.client_read_seq === 0 && created.conversation.staff_read_seq === 0);
  safe(created);
  check(isDeepStrictEqual(await ok(writeRpc(client, 'create_atelier_concierge_request', createParams)), created));
  pass('thread creation, zero cursors and exact replay');
  const thread = (actor = client, after = 0, limit = 20) => ok(rpc(actor, 'get_atelier_concierge_thread', { p_request_id: threadId, p_after_seq: after, p_limit: limit }));
  const read = (actor, seq) => ok(rpc(actor, 'mark_atelier_concierge_read', { p_request_id: threadId, p_observed_message_seq: seq }));
  await denied('other client thread isolation', rpc(other, 'get_atelier_concierge_thread', { p_request_id: threadId, p_after_seq: 0, p_limit: 2 }), e => businessDenied(e, /^not_found$/));
  await denied('anonymous thread denial', rpc(anonymous, 'get_atelier_concierge_thread', { p_request_id: threadId, p_after_seq: 0, p_limit: 2 }));
  await denied('other client cursor denial', rpc(other, 'mark_atelier_concierge_read', { p_request_id: threadId, p_observed_message_seq: 1 }), e => businessDenied(e, /^not_found$/));
  const t0 = await thread();
  await denied('anonymous reply denial', writeRpc(anonymous, 'send_atelier_concierge_message', await intent('send_atelier_concierge_message', { p_request_id: threadId, p_message: manifest.tag })));
  await denied('caller-selected staff read side denied', rpc(client, 'mark_atelier_concierge_read', { p_request_id: threadId, p_observed_message_seq: 1, p_side: 'staff' }), e => e?.code === 'PGRST202');
  check(isDeepStrictEqual(await thread(), t0));
  const rawRow = (table, id, fields) => ok(client.from(table).select(fields).eq('id', id).single());
  const rawDenied = async (label, table, id, fields, mutation, observer = client) => {
    stage = label;
    const before = await ok(observer.from(table).select(fields).eq('id', id).single());
    const result = await mutation.select('id');
    await capture(Array.isArray(result.data) ? result.data[0] : result.data);
    const after = await ok(observer.from(table).select(fields).eq('id', id).single());
    check(isDeepStrictEqual(before, after));
    const guarded = businessDenied(result.error, /^immutable_atelier_record$/);
    check(accessDenied(result.error) || guarded || (!result.error && Array.isArray(result.data) && result.data.length === 0));
    pass(`${label} (${guarded ? 'immutable guard rejected' : result.error ? 'permission rejected' : 'RLS blocked, row unchanged'})`);
  };
  await rawDenied('raw customer ownership spoof', 'appointments', appointmentId, 'id,customer_id,status,lock_version', client.from('appointments').update({ customer_id: users.other.id }).eq('id', appointmentId));
  await rawDenied('raw appointment delete', 'appointments', appointmentId, 'id,customer_id,status,lock_version', client.from('appointments').delete().eq('id', appointmentId));
  await rawDenied('raw concierge staff cursor spoof', 'concierge_requests', threadId, 'id,client_read_seq,staff_read_seq,last_message_seq', client.from('concierge_requests').update({ staff_read_seq: 1 }).eq('id', threadId));
  const forgedId = randomUUID();
  run.attemptedRawFixtures.push({ table: 'concierge_messages', id: forgedId, request_id: threadId }); await save();
  await denied('raw staff sender impersonation denied', client.from('concierge_messages').insert({ id: forgedId, request_id: threadId, sender_type: 'concierge', sender_id: users.admin.id, sender_name: 'QA forged staff', message: manifest.tag }).select('id'));
  check(isDeepStrictEqual(await thread(), t0));
  const rawAppointmentId = randomUUID();
  run.attemptedRawFixtures.push({ table: 'appointments', id: rawAppointmentId }); await save();
  await denied('raw appointment creation ownership spoof denied', client.from('appointments').insert({ id: rawAppointmentId, customer_id: users.other.id, type: 'style-consultation', preferred_time: 'morning', status: 'requested' }).select('id'));
  check((await ok(other.from('appointments').select('id').eq('id', rawAppointmentId))).length === 0);
  let messageCount = 1;
  const send = async (actor, text) => {
    check(++messageCount < 20);
    const params = await intent('send_atelier_concierge_message', { p_request_id: threadId, p_message: `${manifest.tag} ${text}` });
    const data = await ok(writeRpc(actor, 'send_atelier_concierge_message', params));
    check(uuid(data.message?.id)); run.fixtures.messageIds.push(data.message.id); await save();
    check(data.message.sender_type === (actor === client ? 'customer' : 'concierge'));
    check(data.message.sender_name === (actor === client ? 'Client' : 'TCC Concierge'));
    return { data, params };
  };
  stage = 'staff reply and replay';
  const reply = await send(admin, 'admin reply');
  safe(reply.data);
  check(reply.data.message.sender_type === 'concierge' && reply.data.message.sender_name === 'TCC Concierge');
  check(isDeepStrictEqual(await ok(writeRpc(admin, 'send_atelier_concierge_message', reply.params)), reply.data));
  await denied('operation key intent conflict', writeRpc(admin, 'send_atelier_concierge_message', { ...reply.params, p_message: `${manifest.tag} changed intent` }), e => businessDenied(e, /idempotency|operation_key|conflict/i));
  check((await thread()).conversation.last_message_seq === 2); pass('reply safe label, exact replay and unchanged sequence');
  const firstMessageId = created.message.id;
  await rawDenied('immutable message update', 'concierge_messages', firstMessageId, 'id,message,message_seq,sender_type', admin.from('concierge_messages').update({ message: 'QA mutation' }).eq('id', firstMessageId));
  await rawDenied('immutable message delete', 'concierge_messages', firstMessageId, 'id,message,message_seq,sender_type', admin.from('concierge_messages').delete().eq('id', firstMessageId));
  await rawDenied('raw service message update guarded', 'concierge_messages', firstMessageId, 'id,message,message_seq,sender_type', service.from('concierge_messages').update({ message: 'QA mutation' }).eq('id', firstMessageId));
  stage = 'snapshot client read with subsequent arrival';
  const observed = (await thread()).observed_message_seq;
  await send(ceo, 'arrival after client snapshot');
  const clientRead = await read(client, observed);
  check(clientRead.side === 'client' && clientRead.read_seq === observed && clientRead.unread_messages === 1);
  check((await thread()).conversation.staff_read_seq === 0);
  pass('client snapshot acknowledgement leaves N+1 unread');
  stage = 'shared TCC snapshot and monotonic cursor';
  const staffSnapshot = (await thread(admin)).observed_message_seq;
  await send(client, 'arrival after TCC snapshot');
  const staffRead = await read(admin, staffSnapshot);
  check(staffRead.side === 'staff' && staffRead.read_seq === staffSnapshot && staffRead.unread_messages === 1);
  const shared = await read(ceo, 1);
  check(shared.side === 'staff' && shared.read_seq === staffSnapshot && shared.unread_messages === 1);
  // Both requests run concurrently over HTTP; either serialization order must converge.
  const last = (await thread()).conversation.last_message_seq;
  await Promise.all([read(admin, last), read(ceo, staffSnapshot)]);
  check((await thread()).conversation.staff_read_seq === last);
  check((await thread()).conversation.client_read_seq === observed);
  pass('read by TCC shared Admin/CEO cursor monotonic under concurrent acknowledgements');
  stage = 'bounded message pagination';
  let after = 0; const seen = [];
  for (let page = 0; page < 10; page++) {
    const value = await thread(client, after, 2); safe(value);
    check(value.messages.length <= 2);
    for (const m of value.messages) { check(m.message_seq > after); seen.push(m.id); after = m.message_seq; }
    check(value.observed_message_seq === after);
    if (!value.has_more) break;
    check(value.messages.length === 2 && page < 9);
  }
  check(new Set(seen).size === messageCount && isDeepStrictEqual(seen, run.fixtures.messageIds));
  pass('small-page pagination without duplicates or omissions');
  await denied('invalid pagination denial', rpc(client, 'get_atelier_concierge_thread', { p_request_id: threadId, p_after_seq: 0, p_limit: 0 }), e => businessDenied(e, /^invalid_pagination$/));
  const beforeInvalidRead = await thread();
  await denied('future read sequence denial', rpc(client, 'mark_atelier_concierge_read', { p_request_id: threadId, p_observed_message_seq: last + 1 }), e => businessDenied(e, /^invalid_read_sequence$/));
  check(isDeepStrictEqual(await thread(), beforeInvalidRead));
  const statusParams = async status => intent('set_atelier_concierge_status', { p_request_id: threadId, p_status: status, p_expected_version: (await thread()).conversation.lock_version });
  const beforeStatus = await thread();
  await denied('client closure denial', writeRpc(client, 'set_atelier_concierge_status', await statusParams('closed')), e => businessDenied(e, /unauthorized|forbidden|staff/i));
  check(isDeepStrictEqual(await thread(), beforeStatus));
  stage = 'staff closure and reopening';
  const closeParams = await statusParams('closed');
  const closed = await ok(writeRpc(admin, 'set_atelier_concierge_status', closeParams));
  check(closed.conversation.status === 'closed');
  check(isDeepStrictEqual(await ok(writeRpc(admin, 'set_atelier_concierge_status', closeParams)), closed));
  const closedSnapshot = await thread();
  await denied('closed thread reply denial', writeRpc(client, 'send_atelier_concierge_message', await intent('send_atelier_concierge_message', { p_request_id: threadId, p_message: `${manifest.tag} denied closed reply` })), e => businessDenied(e, /^conversation_closed$/));
  check(isDeepStrictEqual(await thread(), closedSnapshot));
  stage = 'CEO reopens thread';
  check((await ok(writeRpc(ceo, 'set_atelier_concierge_status', await statusParams('open')))).conversation.status === 'open');
  await send(client, 'reply after reopen'); safe(await thread());
  pass('staff closure, exact replay, denied arrival and CEO reopening');
  const beforeRoleProbes = await thread(), beforeAppointmentProbes = await detail();
  stage = 'new RPC service-key restrictions';
  for (const [name, params] of [
    ['get_atelier_appointment_detail', { p_appointment_id: appointmentId }],
    ['get_atelier_concierge_thread', { p_request_id: threadId, p_after_seq: 0, p_limit: 2 }],
    ['mark_atelier_concierge_read', { p_request_id: threadId, p_observed_message_seq: 1 }],
    ['create_atelier_appointment', await intent('create_atelier_appointment', appointmentParams())],
    ['create_atelier_concierge_request', await intent('create_atelier_concierge_request', conciergeParams)],
    ['send_atelier_concierge_message', await intent('send_atelier_concierge_message', { p_request_id: threadId, p_message: manifest.tag })],
    ['add_atelier_appointment_note', await intent('add_atelier_appointment_note', { p_appointment_id: appointmentId, p_note: manifest.tag })],
    ['set_atelier_concierge_status', await statusParams('closed')],
    ['request_atelier_appointment_change', changeParams],
    ['review_atelier_appointment_change', reviewParams],
    ['manage_atelier_appointment', await intent('manage_atelier_appointment', { p_appointment_id: appointmentId, p_action: 'complete', p_schedule_date: null, p_schedule_time: null, p_duration_minutes: null, p_reason: null, p_staff_note: null, p_expected_version: (await detail()).appointment.lock_version })],
  ]) await denied(`service key denied: ${name}`, writeRpc(service, name, params));
  const legacy = [
    ['request_appointment_change', { p_customer_id: users.client.id, p_appointment_id: otherAppointmentId, p_change_type: 'cancellation', p_proposed_date: null, p_proposed_time: null, p_reason: manifest.tag }, /Appointment not found/],
    ['create_customer_concierge_request', { p_customer_id: users.client.id, p_payload: { category: 'general_enquiry', subject: manifest.tag, message: manifest.tag, related_appointment_id: otherAppointmentId } }, /Related appointment not found/],
    ['add_customer_concierge_message', { p_customer_id: users.other.id, p_request_id: threadId, p_message: manifest.tag }, /Concierge conversation is unavailable/],
  ];
  for (const [name, params, pattern] of legacy) await denied(`${contract ? 'retired denied' : 'legacy reachable, wrong-owner QA input rejected'}: ${name}`, writeRpc(service, name, params), contract ? accessDenied : e => businessDenied(e, pattern));
  stage = 'raw sender projection';
  const sender = await client.from('concierge_messages').select('sender_id,sender_name').eq('id', reply.data.message.id);
  if (contract) { check(accessDenied(sender.error)); pass('contract raw sender identity columns denied'); }
  else { check(!sender.error && sender.data.length === 1 && sender.data[0].sender_id === null && sender.data[0].sender_name === 'TCC Concierge'); pass('expansion own new raw staff message uses safe label (legacy SELECT still permitted)'); }
  stage = 'final own fixture integrity';
  const finalThread = await thread(); safe(finalThread); safe(await detail());
  check(isDeepStrictEqual(finalThread, beforeRoleProbes) && isDeepStrictEqual(await detail(), beforeAppointmentProbes));
  check(finalThread.messages.length === messageCount && finalThread.conversation.status === 'open');
  check((await rawRow('appointments', appointmentId, 'id,customer_id,status')).status === 'requested');
  check((await ok(client.from('concierge_messages').select('id').eq('id', forgedId))).length === 0);
  pass('own fixture integrity and safe final projections');
  run.status = 'passed'; run.passes = passes; run.requests = requests; run.completedAt = new Date().toISOString(); await save();
  console.log(`PASS total=${passes}; mode=${contract ? 'contract' : 'expansion'}; fixtures retained for parent cleanup`);
}

try { await main(); }
catch {
  // Deliberately never emit error.message, SDK response, stack, identifiers or payloads.
  if (run && save) { run.status = 'failed'; run.failedCheck = stage; run.passes = passes; try { await save(); } catch {} }
  console.error(`FAIL ${stage}; passed=${passes}; inspect retained QA manifest privately`);
  process.exitCode = 1;
}
