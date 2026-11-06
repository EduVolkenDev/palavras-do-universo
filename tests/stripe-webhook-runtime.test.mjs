import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import Stripe from 'stripe';
const secret='whsec_unit_test_only';
const stripe=new Stripe('sk_test_unit_test_only');
async function harness(fail=false){
 const notified=[];
 const modules={
  'next/server':{NextResponse:{json:Response.json}},
  stripe:{default:Stripe},
  '@/lib/supabase/server':{hasSupabaseConfig:()=>true,getSupabaseAdmin:()=>({rpc:async()=>({data:false,error:null})})},
  '@/lib/stripe/server':{getStripe:()=>stripe},
  '@/lib/stripe/owner-notifications':{notifyOwnerOfStripeEvent:async e=>{if(fail)throw Error('delivery failed');notified.push(e.id);}},
  '@/lib/product/fulfillment':{},'@/lib/edu-reading-checkout':{}
 };
 const source=await readFile(new URL('../src/app/api/stripe/webhook/route.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:n=>modules[n],process:{env:{STRIPE_WEBHOOK_SECRET:secret}},console,Response});return {...exports,notified};
}
const payload=JSON.stringify({id:'evt_signed_unit',object:'event',type:'charge.succeeded',livemode:true,data:{object:{id:'ch_signed_unit'}}});
async function signed(body=payload){const signature=await stripe.webhooks.generateTestHeaderStringAsync({payload,secret,cryptoProvider:Stripe.createSubtleCryptoProvider()});return new Request('https://example.invalid/api/stripe/webhook',{method:'POST',body,headers:{'stripe-signature':signature}});}
test('webhook verifies real Web Crypto signatures asynchronously and retries pending notifications even for processed events',async()=>{
 const a=await harness();const response=await a.POST(await signed());assert.equal(response.status,200);assert.deepEqual(a.notified,['evt_signed_unit']);
});
test('tampered payload is rejected before accessing payment records or sending messages',async()=>{
 const a=await harness();assert.equal((await a.POST(await signed(payload+' '))).status,400);assert.equal(a.notified.length,0);
});
test('a failed owner delivery on an already processed event returns 500 for Stripe retry',async()=>{
 const a=await harness(true);assert.equal((await a.POST(await signed())).status,500);
});
