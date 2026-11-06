import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
async function app() {
 const rows=new Map(); const messages=[]; let failure=false; let recordFailure=false;
 const modules={
  'node:crypto':{createHash},
  '@/lib/product/catalog':{productCards:[{title:'Gratuito'},{productKey:'caminho_3_cartas',title:'Caminho de 3 Cartas'}],pricingPlans:[]},
  '@/lib/email/brevo-api':{sendBrevoEmail:async m=>{if(failure)throw Error('network timeout');messages.push(m);return 'provider-message-1';}},
  '@/lib/supabase/server':{getSupabaseAdmin:()=>({rpc:async(_name,p)=>{const r=rows.get(p.p_key);if(r)return {data:r.status==='accepted'?'accepted':'busy'};rows.set(p.p_key,{status:'sending'});return{data:'claimed'};},from:()=>({update:value=>({eq:async(_key,id)=>{if(recordFailure)return{error:{message:'database unavailable'}};Object.assign(rows.get(id),value);return{error:null};}})})})}
 };
 const source=await readFile(new URL('../src/lib/stripe/owner-notifications.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:n=>modules[n],process:{env:{PDU_OWNER_NOTIFICATION_EMAIL:'owner@example.invalid'}},Date,Intl,console});
 return {...exports,rows,messages,fail:()=>failure=true,failRecord:()=>recordFailure=true};
}
const event=(type,object)=>({id:'evt_unit',type,livemode:true,created:1793964000,data:{object}});
const charge={id:'ch_unit',payment_intent:'pi_unit',paid:true,status:'succeeded',amount:1290,currency:'brl',metadata:{product_key:'caminho_3_cartas'},created:1793964000};
test('successful payments deduplicate Charge, Checkout, async Checkout and webhook retries',async()=>{
 const a=await app();const c=event('charge.succeeded',charge);
 await a.notifyOwnerOfStripeEvent(c);
 await a.notifyOwnerOfStripeEvent(c);
 const checkout={id:'cs_unit',mode:'payment',payment_intent:'pi_unit',payment_status:'paid',amount_total:1290,currency:'brl',metadata:charge.metadata,created:charge.created};
 await a.notifyOwnerOfStripeEvent(event('checkout.session.completed',checkout));
 await a.notifyOwnerOfStripeEvent(event('checkout.session.async_payment_succeeded',checkout));
 assert.equal(a.messages.length,1);assert.equal(a.messages[0].to,'owner@example.invalid');
 assert.match(a.messages[0].textContent,/Caminho de 3 Cartas/);assert.match(a.messages[0].subject,/12,90/);
 assert.ok(a.messages[0].headers.IdempotencyKey);assert.equal(a.rows.get('payment:pi_unit').status,'accepted');
});
test('unpaid checkouts, failed charges and test mode never notify; paid recurring Charges do',async()=>{
 const a=await app();
 assert.equal(a.paymentOwnerNotice({...event('charge.succeeded',charge),livemode:false}),null);
 assert.equal(a.paymentOwnerNotice(event('checkout.session.completed',{payment_status:'unpaid'})),null);
 assert.equal(a.paymentOwnerNotice(event('charge.succeeded',{...charge,paid:false})),null);
 assert.equal(a.paymentOwnerNotice(event('checkout.session.completed',{mode:'subscription',payment_status:'paid',amount_total:2000})),null);
 await a.notifyOwnerOfStripeEvent(event('charge.succeeded',{...charge,metadata:{},description:'Subscription update'}));assert.equal(a.messages.length,1);
});
test('free purchases and payout paid/failed are distinct from sale notifications',async()=>{
 const a=await app();await a.notifyOwnerOfStripeEvent(event('checkout.session.completed',{id:'cs_free',mode:'payment',payment_status:'no_payment_required',amount_total:0,currency:'brl',created:charge.created}));
 const payout={id:'po_unit',amount:1200,currency:'brl'};
 await a.notifyOwnerOfStripeEvent(event('payout.paid',payout));await a.notifyOwnerOfStripeEvent(event('payout.paid',payout));await a.notifyOwnerOfStripeEvent(event('payout.failed',payout));
 assert.equal(a.messages.length,3);assert.match(a.messages[1].subject,/Depósito/);assert.match(a.messages[1].subject,/12,00/);assert.doesNotMatch(a.messages[1].textContent,/Produto:|Gratuito/);
});
test('ambiguous provider failure or lost database acknowledgement cannot appear delivered or trigger immediate duplicate',async()=>{
 const a=await app();a.fail();await assert.rejects(a.notifyOwnerOfStripeEvent(event('charge.succeeded',charge)),/timeout/);
 assert.equal(a.rows.get('payment:pi_unit').status,'sending');await assert.rejects(a.notifyOwnerOfStripeEvent(event('charge.succeeded',charge)),/BUSY/);
 const b=await app();b.failRecord();await assert.rejects(b.notifyOwnerOfStripeEvent(event('charge.succeeded',charge)),/ACCEPTANCE_RECORD_FAILED/);
 await assert.rejects(b.notifyOwnerOfStripeEvent(event('charge.succeeded',charge)),/BUSY/);assert.equal(b.messages.length,1);
});
test('email HTML escapes untrusted product metadata and partial refunds have separate keys',async()=>{
 const a=await app();await a.notifyOwnerOfStripeEvent(event('charge.succeeded',{...charge,metadata:{product_key:'<img src=x onerror=alert(1)>'}}));
 assert.doesNotMatch(a.messages[0].htmlContent,/<img/);assert.match(a.messages[0].htmlContent,/&lt;img/);
 assert.notEqual(a.paymentOwnerNotice(event('charge.refunded',{...charge,amount_refunded:100})).key,a.paymentOwnerNotice(event('charge.refunded',{...charge,amount_refunded:200})).key);
});
