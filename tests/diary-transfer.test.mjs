import {test} from 'node:test';
import assert from 'node:assert/strict';
import {acceptsDiaryReply,buildDiaryReading,diaryOrigin} from '../src/lib/client/diary-transfer.ts';

const input={readingId:null,occurredAt:'2026-10-01T12:00:00Z',timezone:'Europe/London',locale:'pt-BR',question:'Minha pergunta',spreadLabel:'Três cartas',interpretation:'Uma leitura',cards:[{name:'A Estrela',position:'Caminho',reversed:false,meaning:'not exported',assetPath:'/not-exported'}]};
test('export preserves content, strips extra card fields and uses stable IDs for unsynced readings',async()=>{
  const one=await buildDiaryReading(input);const two=await buildDiaryReading({...input,occurredAt:'2026-10-02T12:00:00Z'});
  assert.equal(one.readingId,two.readingId);assert.match(one.readingId,/^local_[a-f0-9]{64}$/);
  assert.deepEqual(one.cards,[{name:'A Estrela',position:'Caminho',reversed:false}]);
  assert.equal((await buildDiaryReading({...input,readingId:'real-reading'})).readingId,'real-reading');
  await assert.rejects(buildDiaryReading({...input,interpretation:'x'.repeat(20001)}));
});
test('destination and replies require exact origins, window and nonce',()=>{
  assert.equal(diaryOrigin(undefined),'https://diario.palavrasdouniverso.com');
  assert.equal(diaryOrigin('http://localhost:4325',true),'http://localhost:4325');
  assert.throws(()=>diaryOrigin('http://localhost:4325',false));
  assert.throws(()=>diaryOrigin('https://diario.palavrasdouniverso.com.evil.test'));
  const target={};const event={origin:diaryOrigin(undefined),source:target,data:{nonce:'n',type:'du:pdu-ready'}};
  assert.equal(acceptsDiaryReply(event,target,event.origin,'n','du:pdu-ready'),true);
  assert.equal(acceptsDiaryReply(event,{},event.origin,'n','du:pdu-ready'),false);
  assert.equal(acceptsDiaryReply(event,target,event.origin,'other','du:pdu-ready'),false);
});
