const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
class Range{constructor(s,r,c,n=1,m=1){Object.assign(this,{s,r,c,n,m});}getValues(){return Array.from({length:this.n},(_,i)=>Array.from({length:this.m},(_,j)=>this.s.data[this.r+i-1]?.[this.c+j-1]??''));}setValues(rows){rows.forEach((row,i)=>{this.s.data[this.r+i-1]??=[];row.forEach((v,j)=>this.s.data[this.r+i-1][this.c+j-1]=v);});return this;}setValue(v){return this.setValues([[v]]);}setBackground(){return this;}setFontColor(){return this;}setFontWeight(){return this;}}
class Sheet{constructor(name,data=[]){this.name=name;this.data=data;this.maxColumns=26;}getDataRange(){return this.getRange(1,1,Math.max(1,this.getLastRow()),Math.max(1,this.getLastColumn()));}getLastRow(){return this.data.length;}getLastColumn(){return Math.max(0,...this.data.map(x=>x.length));}getMaxColumns(){return this.maxColumns;}insertColumnsAfter(_,n){this.maxColumns+=n;}getRange(...a){return new Range(this,...a);}appendRow(r){this.data.push(r);}setFrozenRows(){}}
const sheets=new Map(),ss={getSheetByName:n=>sheets.get(n),insertSheet:n=>{const s=new Sheet(n);sheets.set(n,s);return s;}};
sheets.set('gvcnv',new Sheet('gvcnv',[
 ['Họ và tên','Chức vụ','Môn','Email','Mật khẩu','Lớp chủ nhiệm','Hòa nhập'],
 ['Teacher','Tổ viên','Anh','teacher@example.test','oldpassword','12A11','Có'],
 ['Leader','Tổ trưởng','Anh','leader@example.test','oldpassword','',''],
 ['Other','Tổ viên','Toán','other@example.test','oldpassword','',''],
 ['Principal','Hiệu trưởng','','principal@example.test','oldpassword','','']
]));
const props=new Map(),cache=new Map();const bytes=b=>Array.from(b).map(x=>x>127?x-256:x);
const ctx=vm.createContext({console,Date,JSON,Math,Number,String,Object,Array,Set,Map,Error,isNaN,globalThis:null,SpreadsheetApp:{getActiveSpreadsheet:()=>ss},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v)})},CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>bytes(crypto.createHash('sha256').update(s).digest()),computeHmacSha256Signature:(s,k)=>bytes(crypto.createHmac('sha256',k).update(s).digest()),formatDate:()=>new Date().toISOString().slice(0,10)}});
for(const f of ['KpiCore.gs','KpiCatalog.gs','KpiBackend.gs'])vm.runInContext(fs.readFileSync('kpi/'+f,'utf8'),ctx);
const call=(name,...args)=>{ctx.testArgs=args;return vm.runInContext(`${name}(...testArgs)`,ctx);};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
call('initializeKpiSystem');call('initializeKpiSystem');assert.equal(sheets.get('bang_luong_hoa_kpi').getLastRow(),60);
const login=email=>call('kpiDispatch_','login',{email,digest:sha('oldpassword')},'');
const teacher=login('teacher@example.test'),leader=login('leader@example.test'),principal=login('principal@example.test');assert.deepEqual(Array.from(teacher.user.roles),['GVBM','GVCN','HOANHAP']);
const raw=call('kpiPeople_').find(u=>u.email==='teacher@example.test').raw;assert.equal(raw['Mật khẩu'],'');assert.equal(raw['Mật khẩu hash'].length,64);
assert.throws(()=>call('kpiDispatch_','profile',{email:'other@example.test'},leader.token),/quyền/);
const reg=call('kpiDispatch_','register',{criterionId:'GVBM-1',due:'2027-05-30',output:'Test output',inPlan:true},teacher.token);
assert.throws(()=>call('kpiDispatch_','approvePlan',{id:reg.id,version:1,accept:true,coef:1,inPlan:true,note:'Accept'},teacher.token),/tự duyệt/);
const planned=call('kpiDispatch_','approvePlan',{id:reg.id,version:1,accept:true,coef:1,inPlan:true,note:'Accept'},leader.token);
assert.throws(()=>call('kpiDispatch_','submit',{id:reg.id,version:1},teacher.token),/thay đổi/);
const submitted=call('kpiDispatch_','submit',{id:reg.id,version:planned.version,completed:true,completedAt:'2026-10-01',progress:100,quality:80,note:'Result'},teacher.token);
let s=call('kpiDispatch_','overview',{},teacher.token).summary;assert.equal(s.B,0);assert.equal(s.pending,1);assert.equal(s.total,null);
call('kpiDispatch_','review',{id:reg.id,version:submitted.version,accept:true,progress:100,quality:80,note:'Approved'},leader.token);
call('kpiDispatch_','general',{scores:[5,5,5,5,5,5],note:'Self'},teacher.token);
assert.equal(call('kpiDispatch_','overview',{},teacher.token).summary.general,null);
call('kpiDispatch_','general',{email:teacher.user.email,scores:[5,5,5,5,5,5],note:'Reviewed'},leader.token);
s=call('kpiDispatch_','overview',{},teacher.token).summary;assert.equal(s.kpi,60.2);assert.equal(s.total,90.2);assert.equal(s.excellentEligible,false);
assert.throws(()=>call('kpiDispatch_','report',{},teacher.token),/BGH/);assert.equal(call('kpiDispatch_','report',{},leader.token).people.length,2);assert.equal(call('kpiDispatch_','report',{},principal.token).people.length,4);
const b=call('kpiDispatch_','bonus',{taskId:reg.id,category:'HSG Nhất',reference:'AWARD-001',requested:7},teacher.token);assert.equal(b.requested,3);
assert.throws(()=>call('kpiDispatch_','reviewBonus',{id:b.id,accept:true,approved:3,note:'Decision'},leader.token),/Chưa ban hành/);
assert.throws(()=>call('kpiDispatch_','decision',{email:teacher.user.email,rating:'Hoàn thành xuất sắc nhiệm vụ',reference:'X',note:'Y'},principal.token),/điều kiện/);
call('kpiDispatch_','changePassword',{oldDigest:sha('oldpassword'),newDigest:sha('newpassword123'),length:14},teacher.token);
assert.throws(()=>call('kpiDispatch_','overview',{},teacher.token),/hết hạn/);
assert.throws(()=>login('teacher@example.test'),/không chính xác/);
assert.ok(call('kpiDispatch_','login',{email:teacher.user.email,digest:sha('newpassword123')},'').token);
console.log('Backend auth, scopes, approval, scoring, bonus and password checks passed');
