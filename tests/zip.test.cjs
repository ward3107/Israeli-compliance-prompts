const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../docs/site/zip.js');
test('ZIP rejects traversal and Windows extraction aliases',()=>{
  for(const path of ['../secret','x/../../secret','/root','C:/evil','C:evil','x\\..\\secret','x\u0000.txt','x\n.txt','a//b','a/./b','a/../b','a/','NUL.txt','a/CON','a.','a ']) {
    assert.throws(()=>ToolkitZip({[path]:'test'}),/Invalid archive/);
  }
  assert.throws(()=>ToolkitZip({'a.txt':'one','A.txt':'two'}),/Invalid archive/);
  assert.throws(()=>ToolkitZip({'a.txt':{code:'no'}}),/Invalid archive/);
});
test('ZIP preserves normal UTF-8 files and hidden source folders',async()=>{
  const zip=ToolkitZip({'תיקיה/פרטיות.txt':'שלום','.github/workflows/validate.yml':'name: validate'});
  assert.equal(zip.type,'application/zip');
  const bytes=Buffer.from(await zip.arrayBuffer());assert.equal(bytes.readUInt32LE(0),0x04034b50);
  assert.ok(bytes.includes(Buffer.from('תיקיה/פרטיות.txt')));
});
test('ZIP bounds archive entry count and individual file sizes',()=>{
  assert.throws(()=>ToolkitZip(Object.fromEntries(Array.from({length:2001},(_,i)=>[String(i),'']))),/Too many/);
  assert.throws(()=>ToolkitZip({'file':'a'.repeat(10*1024*1024+1)}),/size limit/);
});
