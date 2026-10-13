/** Standalone bound Apps Script for the KPI spreadsheet. Do NOT replace attendance Code.gs. */
const KPI_VERSION='2026.10.04';
const KPI_HEADERS={
 kpi_cong_viec:['id','email','period','criterionId','title','role','output','due','kind','base','coef','inPlan','planStatus','planAt','progress','quality','completed','completedAt','note','fileId','fileName','reviewStatus','submittedAt','reviewer','reviewedAt','version','cancelled'],
 kpi_chung:['id','email','period','scores','note','status','reviewer','updatedAt'],
 kpi_thuong:['id','email','period','taskId','category','reference','requested','approved','status','reviewer','updatedAt'],
 kpi_nhat_ky:['at','actor','action','entity','before','after'],
 kpi_cau_hinh:['key','value'],
 kpi_xep_loai:['id','email','period','rating','reference','note','decider','updatedAt'],
 kpi_ket_qua:['email','period','A','B','KPI','Chung','Thuong','Tong','SoViec','HoanThanh','Vuot','DuDieuKienXS'],
 bang_luong_hoa_kpi:['id','role','title','output','sourceDue','kind','base','coef','max','evidence','source']
};
function kpiSS_(){const id=PropertiesService.getScriptProperties().getProperty('KPI_SPREADSHEET_ID');return id?SpreadsheetApp.openById(id):SpreadsheetApp.getActiveSpreadsheet();}
function kpiSheet_(name){const s=kpiSS_().getSheetByName(name);if(!s)throw Error('Chưa có sheet '+name+'. Chạy initializeKpiSystem.');return s;}
function kpiRows_(name){const s=kpiSheet_(name),v=s.getDataRange().getValues();const h=v.shift().map(String);return v.map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=r[j] instanceof Date?r[j].toISOString():r[j]);return o;}).filter(o=>Object.keys(o).some(k=>k!=='_row'&&o[k]!==''));}
function kpiWrite_(name,o){const s=kpiSheet_(name),h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];const row=h.map(k=>o[k]===undefined?'':(typeof o[k]==='object'?JSON.stringify(o[k]):o[k]));s.getRange(o._row||s.getLastRow()+1,1,1,h.length).setValues([row.map(v=>typeof v==='string'&&v.startsWith('=')?"'"+v:v)]);}
function kpiLocked_(fn){const l=LockService.getScriptLock();l.waitLock(30000);try{return fn();}finally{l.releaseLock();}}
function kpiAudit_(u,action,id,before,after){kpiWrite_('kpi_nhat_ky',{at:new Date().toISOString(),actor:u.email,action,entity:id,before:JSON.stringify(before||{}),after:JSON.stringify(after||{})});}
function initializeKpiSystem(){
 const ss=kpiSS_();if(!ss)throw Error('Gắn script vào Google Sheet hoặc đặt KPI_SPREADSHEET_ID.');
 return kpiLocked_(()=>{
 Object.keys(KPI_HEADERS).forEach(n=>{const s=ss.getSheetByName(n)||ss.insertSheet(n),h=KPI_HEADERS[n];if(s.getMaxColumns()<h.length)s.insertColumnsAfter(s.getMaxColumns(),h.length-s.getMaxColumns());if(s.getLastRow()===0)s.appendRow(h);else if(s.getRange(1,1,1,h.length).getValues()[0].join('|')!==h.join('|'))throw Error('Cấu trúc '+n+' khác phiên bản, không tự ghi đè.');s.setFrozenRows(1);s.getRange(1,1,1,h.length).setBackground('#145b46').setFontColor('#fff').setFontWeight('bold');});
 const gv=ss.getSheetByName('gvcnv');if(!gv)throw Error('Thiếu gvcnv. Giữ danh sách nhân sự hiện có.');
 const headers=gv.getRange(1,1,1,gv.getLastColumn()).getValues()[0];['Tổ','Nhóm nhiệm vụ tương đồng','Lớp chủ nhiệm','Hòa nhập','Vai trò KPI','Mật khẩu hash','Salt KPI','Phiên bản mật khẩu'].forEach(h=>{if(!headers.includes(h)){headers.push(h);gv.getRange(1,headers.length).setValue(h);}});
 if(kpiRows_('bang_luong_hoa_kpi').length===0)KPI_CATALOG.forEach(c=>kpiWrite_('bang_luong_hoa_kpi',c));
 const config=kpiRows_('kpi_cau_hinh');[{key:'period',value:'2026-2027'},{key:'schoolRule',value:'DỰ THẢO – tham khảo CV 9421/SGDĐT-TCCB TP.HCM quý III/2026; chờ quy chế nhà trường áp dụng năm học tại Đồng Nai'},{key:'bonusMode',value:'source'},{key:'autoTimeout',value:'false'},{key:'driveFolderId',value:'1t-pd9-xQD1hST9LZxHcEGJP8C8fcB8RG'}].forEach(c=>{if(!config.some(x=>x.key===c.key))kpiWrite_('kpi_cau_hinh',c);});
 const p=PropertiesService.getScriptProperties();if(!p.getProperty('KPI_PEPPER'))p.setProperty('KPI_PEPPER',Utilities.getUuid()+Utilities.getUuid());
 return 'Đã bổ sung sheet KPI. Không thay đổi các sheet cũ hoặc mật khẩu hiện có.';
 });
}
function kpiCfg_(){return Object.fromEntries(kpiRows_('kpi_cau_hinh').map(r=>[r.key,String(r.value)]));}
function kpiNorm_(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function kpiPick_(o,keys){for(const k of keys){const found=Object.keys(o).find(h=>kpiNorm_(h)===kpiNorm_(k));if(found&&o[found]!=='')return o[found];}return '';}
function kpiPeople_(){return kpiRows_('gvcnv').map(r=>{
 const raw=String(kpiPick_(r,['Vai trò KPI'])),job=kpiNorm_(kpiPick_(r,['Chức vụ']));
 let roles=raw?raw.toUpperCase().split(/[;,|\s]+/).filter(Boolean):[];
 if(!roles.length){if(job.includes('pho hieu truong'))roles=['PHT'];else if(job.includes('hieu truong'))roles=['HT'];else if(job.includes('to truong')||job==='ttcm')roles=['GVBM','TTCM'];else if(job.includes('to pho')||job==='tpcm')roles=['GVBM','TPCM'];else if(job.includes('to vien')||job.includes('giao vien')||job.includes('gvbm'))roles=['GVBM'];}
 if(kpiPick_(r,['Lớp chủ nhiệm','GVCN'])||job.includes('gvcn'))roles.push('GVCN');
 if(['co','true','1','x'].includes(kpiNorm_(kpiPick_(r,['Hòa nhập'])))||job.includes('hoa nhap'))roles.push('HOANHAP');
 return {_row:r._row,email:String(kpiPick_(r,['Email'])).trim().toLowerCase(),name:String(kpiPick_(r,['Họ và tên','Họ tên'])),unit:String(kpiPick_(r,['Tổ','Tổ chuyên môn'])||kpiPick_(r,['Môn'])),roles:[...new Set(roles)],group:String(kpiPick_(r,['Nhóm nhiệm vụ tương đồng'])),raw:r,version:Number(kpiPick_(r,['Phiên bản mật khẩu']))||0};
 }).filter(u=>u.email);}
function kpiPublicUser_(u){return {email:u.email,name:u.name,unit:u.unit,roles:u.roles,group:u.group};}
function kpiSha_(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function kpiStoredHash_(digest,salt){return Utilities.computeHmacSha256Signature(salt+':'+digest,PropertiesService.getScriptProperties().getProperty('KPI_PEPPER')).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function kpiSetPerson_(u,patch){const s=kpiSheet_('gvcnv'),h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];Object.keys(patch).forEach(k=>{const col=h.indexOf(k)+1;if(!col)throw Error('Chạy initializeKpiSystem để thêm '+k);s.getRange(u._row,col).setValue(patch[k]);});}
function kpiAuth_(token){const saved=CacheService.getScriptCache().get('kpi-session-'+token);if(!saved)throw Error('Phiên đã hết hạn. Đăng nhập lại.');const session=JSON.parse(saved),u=kpiPeople_().find(x=>x.email===session.email);if(!u||u.version!==session.version)throw Error('Phiên không còn hợp lệ.');return u;}
function kpiLogin_(email,digest){
 email=String(email).trim().toLowerCase();if(!/^[a-f0-9]{64}$/.test(String(digest)))throw Error('Thông tin đăng nhập không hợp lệ.');
 const cache=CacheService.getScriptCache(),failKey='kpi-fail-'+kpiSha_(email),failed=Number(cache.get(failKey)||0);if(failed>=8)throw Error('Thử lại sau 15 phút.');
 const matches=kpiPeople_().filter(u=>u.email===email);const u=matches.length===1?matches[0]:null;
 const salt=u?String(kpiPick_(u.raw,['Salt KPI'])):'',stored=u?String(kpiPick_(u.raw,['Mật khẩu hash'])):'';
 const legacy=u?String(kpiPick_(u.raw,['Mật khẩu'])):'';
 const valid=u&&(stored?kpiStoredHash_(digest,salt)===stored:legacy&&kpiSha_(legacy)===digest);
 if(!valid){cache.put(failKey,String(failed+1),900);throw Error('Email hoặc mật khẩu không chính xác.');}
 cache.remove(failKey);
 if(!stored){const newSalt=Utilities.getUuid();kpiSetPerson_(u,{'Salt KPI':newSalt,'Mật khẩu hash':kpiStoredHash_(digest,newSalt),'Mật khẩu':''});}
 const token=Utilities.getUuid()+Utilities.getUuid();cache.put('kpi-session-'+token,JSON.stringify({email:u.email,version:u.version}),21600);return {token,user:kpiPublicUser_(u)};
}
function kpiScope_(viewer,target,write){if(viewer.email===target.email)return !write;return viewer.roles.some(r=>['HT','PHT'].includes(r))||(viewer.roles.includes('TTCM')&&viewer.unit&&viewer.unit===target.unit&&(!write||!target.roles.some(r=>['HT','PHT','TTCM'].includes(r))));}
function kpiTarget_(u,email,write){const t=kpiPeople_().find(x=>x.email===email);if(!t||!kpiScope_(u,t,write))throw Error('Không có quyền với hồ sơ này.');return t;}
function kpiTasks_(email,period){return kpiRows_('kpi_cong_viec').filter(r=>r.email===email&&r.period===period).map(r=>{['base','coef','progress','quality','version'].forEach(k=>r[k]=Number(r[k])||0);['inPlan','completed','cancelled'].forEach(k=>r[k]=r[k]===true||String(r[k])==='true');return r;});}
function kpiSummary_(u,period){const tasks=kpiTasks_(u.email,period),g=kpiRows_('kpi_chung').find(r=>r.email===u.email&&r.period===period&&r.status==='approved');const general=g?KpiCore.round(JSON.parse(g.scores).reduce((s,x)=>s+x,0)):null;const b=kpiRows_('kpi_thuong').filter(r=>r.email===u.email&&r.period===period&&r.status==='approved').reduce((s,r)=>s+Number(r.approved||0),0);const final=kpiRows_('kpi_xep_loai').find(r=>r.email===u.email&&r.period===period);return Object.assign(kpiPublicUser_(u),KpiCore.summarize(tasks,general,b),{rating:final?final.rating:'Chờ hội đồng',decisionReference:final?final.reference:''});}
function kpiOverview_(u){const period=kpiCfg_().period;return {version:KPI_VERSION,config:kpiCfg_(),user:kpiPublicUser_(u),catalog:kpiRows_('bang_luong_hoa_kpi').map(c=>{['base','coef','max'].forEach(k=>c[k]=Number(c[k]));return c;}),tasks:kpiTasks_(u.email,period),general:kpiRows_('kpi_chung').filter(r=>r.email===u.email&&r.period===period),bonuses:kpiRows_('kpi_thuong').filter(r=>r.email===u.email&&r.period===period),summary:kpiSummary_(u,period),ranking:kpiPeople_().filter(t=>kpiScope_(u,t,false)).map(t=>kpiSummary_(t,period)).sort((a,b)=>(b.kpi??-1)-(a.kpi??-1)||(b.total??-1)-(a.total??-1)||a.name.localeCompare(b.name,'vi')),people:kpiPeople_().filter(t=>kpiScope_(u,t,false)).map(kpiPublicUser_)};}
function kpiRequiredText_(s,label){s=String(s||'').trim();if(!s||s.length>3000)throw Error('Thiếu hoặc quá dài: '+label);return s;}
function kpiFile_(f,u,t){if(!f)return {fileId:'',fileName:''};if(!['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg','image/webp'].includes(f.mimeType))throw Error('Loại tệp không được hỗ trợ.');const bytes=Utilities.base64Decode(f.base64);if(bytes.length>10*1024*1024)throw Error('Tệp vượt 10 MB.');const ext=({ 'application/pdf':'.pdf','application/msword':'.doc','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'.docx','image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp'})[f.mimeType];const name=[u.name,u.unit,t.title].join('_').replace(/[\\/:*?"<>|\r\n]/g,'_').slice(0,200)+ext;const file=DriveApp.getFolderById(kpiCfg_().driveFolderId).createFile(Utilities.newBlob(bytes,f.mimeType,name));return {fileId:file.getId(),fileName:name};}
function kpiDispatch_(action,p,token){
 if(action==='login')return kpiLocked_(()=>kpiLogin_(p.email,p.digest));
 const u=kpiAuth_(token),period=kpiCfg_().period;
 if(action==='overview')return kpiOverview_(u);
 if(action==='logout'){CacheService.getScriptCache().remove('kpi-session-'+token);return {ok:true};}
 if(action==='report'){const people=kpiPeople_().filter(t=>kpiScope_(u,t,false));if(!u.roles.some(r=>['HT','PHT','TTCM'].includes(r)))throw Error('Báo cáo dành cho BGH/TTCM.');return {period,rule:kpiCfg_().schoolRule,generatedAt:new Date().toISOString(),people:people.map(t=>({user:kpiPublicUser_(t),summary:kpiSummary_(t,period),tasks:kpiTasks_(t.email,period),general:kpiRows_('kpi_chung').filter(r=>r.email===t.email&&r.period===period),bonuses:kpiRows_('kpi_thuong').filter(r=>r.email===t.email&&r.period===period)}))};}
 if(action==='profile'){const target=kpiTarget_(u,p.email,false);return {user:kpiPublicUser_(target),tasks:kpiTasks_(target.email,period),general:kpiRows_('kpi_chung').filter(r=>r.email===target.email&&r.period===period),bonuses:kpiRows_('kpi_thuong').filter(r=>r.email===target.email&&r.period===period),summary:kpiSummary_(target,period)};}
 return kpiLocked_(()=>{
 if(action==='changePassword'){
  if(!/^[a-f0-9]{64}$/.test(p.newDigest)||!Number.isInteger(p.length)||p.length<10)throw Error('Mật khẩu mới phải ít nhất 10 ký tự.');
  const hash=String(kpiPick_(u.raw,['Mật khẩu hash'])),salt=String(kpiPick_(u.raw,['Salt KPI']));if(kpiStoredHash_(p.oldDigest,salt)!==hash)throw Error('Mật khẩu hiện tại không đúng.');if(p.oldDigest===p.newDigest)throw Error('Mật khẩu mới phải khác mật khẩu cũ.');
  const ns=Utilities.getUuid();kpiSetPerson_(u,{'Salt KPI':ns,'Mật khẩu hash':kpiStoredHash_(p.newDigest,ns),'Phiên bản mật khẩu':u.version+1,'Mật khẩu':''});CacheService.getScriptCache().remove('kpi-session-'+token);kpiAudit_(u,action,u.email,null,{changed:true});return {ok:true,relogin:true};
 }
 if(action==='decision'){
  if(!u.roles.some(r=>['HT','PHT'].includes(r)))throw Error('Chỉ BGH ghi nhận quyết định của cấp có thẩm quyền.');const target=kpiTarget_(u,p.email,true);const ratings=['Hoàn thành xuất sắc nhiệm vụ','Hoàn thành tốt nhiệm vụ','Hoàn thành nhiệm vụ','Không hoàn thành nhiệm vụ'];if(!ratings.includes(p.rating))throw Error('Mức xếp loại không hợp lệ.');const sum=kpiSummary_(target,period);if(p.rating===ratings[0]&&!sum.excellentEligible)throw Error('Chưa đủ điều kiện đề xuất xuất sắc theo nguồn.');if(p.rating===ratings[0]&&!target.group)throw Error('BGH phải xác định Nhóm nhiệm vụ tương đồng trong gvcnv trước khi chốt xuất sắc.');if(target.group){const groupPeople=kpiPeople_().filter(x=>x.group===target.group).map(x=>x.email);const decisions=kpiRows_('kpi_xep_loai').filter(r=>r.period===period&&groupPeople.includes(r.email)&&r.email!==target.email).map(r=>r.rating).concat(p.rating);const xs=decisions.filter(x=>x===ratings[0]).length,good=decisions.filter(x=>x===ratings[1]).length;if(xs>Math.floor(.2*good))throw Error('Vượt giới hạn XS của nhóm: '+xs+' XS / '+good+' HTT. Giới hạn floor(20% × HTT) = '+Math.floor(.2*good)+'. Chốt đủ kết quả nhóm trước khi xét XS.');}
  let old=kpiRows_('kpi_xep_loai').find(r=>r.email===target.email&&r.period===period);const row=Object.assign({},old||{id:Utilities.getUuid()}, {email:target.email,period,rating:p.rating,reference:kpiRequiredText_(p.reference,'số quyết định/biên bản hội đồng'),note:kpiRequiredText_(p.note,'nhận xét và xác nhận giới hạn tỷ lệ XS'),decider:u.email,updatedAt:new Date().toISOString()});kpiWrite_('kpi_xep_loai',row);kpiAudit_(u,action,row.id,old,row);return row;
 }
 if(action==='register'||action==='customTask'){
  const target=p.email?kpiTarget_(u,p.email,true):u;
  let c=kpiRows_('bang_luong_hoa_kpi').find(c=>c.id===p.criterionId);if(action==='customTask'){if(![1,1.1,1.2].includes(Number(p.coef)))throw Error('Hệ số không hợp lệ.');const kind=p.kind==='Đột xuất'?'Đột xuất':'Thường xuyên';c={id:'CUSTOM-'+Utilities.getUuid(),role:target.roles[0],title:kpiRequiredText_(p.title,'nhiệm vụ'),output:kpiRequiredText_(p.output,'sản phẩm'),kind,base:kind==='Đột xuất'?12:10,coef:Number(p.coef)};}if(!c||!target.roles.includes(c.role))throw Error('Nhiệm vụ không thuộc vai trò được phân công.');
  if(kpiTasks_(target.email,period).some(t=>t.criterionId===c.id&&!t.cancelled))throw Error('Nhiệm vụ đã có, cập nhật kết quả thay vì đăng ký trùng.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p.due)||isNaN(Date.parse(p.due)))throw Error('Chọn hạn hoàn thành cụ thể.');
  const t={id:Utilities.getUuid(),email:target.email,period,criterionId:c.id,title:c.title,role:c.role,output:kpiRequiredText_(p.output||c.output,'sản phẩm'),due:p.due,kind:c.kind,base:Number(c.base),coef:Number(c.coef),inPlan:!!p.inPlan,planStatus:'pending',planAt:new Date().toISOString(),progress:0,quality:0,completed:false,reviewStatus:'draft',version:1,cancelled:false};kpiWrite_('kpi_cong_viec',t);kpiAudit_(u,action,t.id,null,t);return t;
 }
 if(action==='submit'||action==='approvePlan'||action==='review'||action==='cancel'){
  const t=kpiRows_('kpi_cong_viec').find(x=>x.id===p.id&&x.period===period);if(!t)throw Error('Không tìm thấy nhiệm vụ.');if(Number(p.version)!==Number(t.version))throw Error('Hồ sơ đã thay đổi. Tải lại trước khi lưu.');const before=Object.assign({},t);const target=kpiPeople_().find(x=>x.email===t.email);if(!target)throw Error('Nhân sự không còn tồn tại.');
  if(action==='submit'){
   if(t.email!==u.email||t.planStatus!=='approved'||t.cancelled)throw Error('Chưa được duyệt giao việc.');if(t.reviewStatus==='approved')throw Error('Kết quả đã duyệt. Đề nghị người duyệt mở lại.');
   if(!p.completedAt||!/^\d{4}-\d{2}-\d{2}$/.test(p.completedAt)||p.completedAt>Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh','yyyy-MM-dd'))throw Error('Ngày hoàn thành không hợp lệ.');
   if(!p.completed&&(Number(p.progress)!==0||Number(p.quality)!==0))throw Error('Chưa hoàn thành: tiến độ và chất lượng phải là 0%.');
   Object.assign(t,{progress:Number(p.progress),quality:Number(p.quality),completed:!!p.completed,completedAt:p.completedAt,note:kpiRequiredText_(p.note,'kết quả thực tế'),reviewStatus:'pending',submittedAt:new Date().toISOString()});KpiCore.score(t);
   if(p.file)Object.assign(t,kpiFile_(p.file,u,t));
  }else{
   if(!kpiScope_(u,target,true))throw Error('Không được tự duyệt hoặc duyệt ngoài phạm vi.');
   if(action==='approvePlan'){
    if(!['pending','rejected'].includes(t.planStatus))throw Error('Kế hoạch đã duyệt.');t.planStatus=p.accept?'approved':'rejected';
    if(p.accept){if(![1,1.1,1.2].includes(Number(p.coef)))throw Error('Hệ số không hợp lệ.');t.coef=Number(p.coef);t.inPlan=!!p.inPlan;}
   }
   if(action==='review'){
    if(t.planStatus!=='approved'||!['pending','approved'].includes(t.reviewStatus))throw Error('Chưa có kết quả tự đánh giá.');
    if(p.accept){t.progress=Number(p.progress);t.quality=Number(p.quality);KpiCore.score(t);t.reviewStatus='approved';}else t.reviewStatus='returned';
   }
   if(action==='cancel'){t.cancelled=true;t.planStatus='cancelled';}
   t.reviewer=u.email;t.reviewedAt=new Date().toISOString();t.note=String(t.note||'')+'\nÝ kiến: '+kpiRequiredText_(p.note,'lý do/nhận xét duyệt');
  }
  t.version=Number(t.version)+1;kpiWrite_('kpi_cong_viec',t);kpiAudit_(u,action,t.id,before,t);return t;
 }
 if(action==='general'){
  const target=p.email?kpiTarget_(u,p.email,true):u;if(!Array.isArray(p.scores)||p.scores.length!==6||p.scores.some(x=>!Number.isFinite(x)||x<0||x>5))throw Error('Nhập 6 nhóm, mỗi nhóm 0–5 điểm.');
  let row=kpiRows_('kpi_chung').find(r=>r.email===target.email&&r.period===period),before=row?Object.assign({},row):null;
  if(target.email===u.email&&row&&row.status==='approved')throw Error('Tiêu chí chung đã được duyệt.');
  row=Object.assign(row||{id:Utilities.getUuid(),email:target.email,period},{scores:JSON.stringify(p.scores),note:kpiRequiredText_(p.note,'nhận xét'),status:target.email===u.email?'pending':'approved',reviewer:target.email===u.email?'':u.email,updatedAt:new Date().toISOString()});kpiWrite_('kpi_chung',row);kpiAudit_(u,action,row.id,before,row);return row;
 }
 if(action==='bonus'){
  const tasks=kpiTasks_(u.email,period),t=tasks.find(x=>x.id===p.taskId&&x.reviewStatus==='approved');if(!t)throw Error('Chọn nhiệm vụ đã được duyệt kết quả.');
  if(kpiRows_('kpi_thuong').some(r=>r.email===u.email&&r.period===period&&r.taskId===t.id&&r.status!=='rejected'))throw Error('Nhiệm vụ đã đề xuất thưởng.');
  const ref=kpiRequiredText_(p.reference,'kết quả/số quyết định'),category=kpiRequiredText_(p.category,'loại thành tích');
  if(!['Nổi trội theo PL5','Sáng kiến theo PL5','Tốt nghiệp bằng Thành phố','Tốt nghiệp cao hơn Thành phố','HSG Nhất','HSG Nhì','HSG Ba','HSG KK','QPAN Nhất','QPAN Nhì','QPAN Ba','QPAN KK','Hội thao Nhất','Hội thao Nhì','Hội thao Ba','Hội thao KK'].includes(category))throw Error('Loại thưởng không hợp lệ.');
  const cfg=kpiCfg_();const tiers={'Tốt nghiệp bằng Thành phố':1,'Tốt nghiệp cao hơn Thành phố':2,'HSG Nhất':3,'HSG Nhì':2,'HSG Ba':1.5,'HSG KK':1,'QPAN Nhất':3,'QPAN Nhì':2,'QPAN Ba':1.5,'QPAN KK':1,'Hội thao Nhất':3,'Hội thao Nhì':2,'Hội thao Ba':1.5,'Hội thao KK':1};const requested=tiers[category]===undefined?Number(p.requested):tiers[category];
  if(kpiRows_('kpi_thuong').some(r=>r.email===u.email&&r.period===period&&kpiNorm_(String(r.reference).split('\nXác nhận:')[0])===kpiNorm_(ref)&&r.status!=='rejected'))throw Error('Kết quả này đã có đề xuất thưởng.');if(!Number.isFinite(requested)||requested<0||requested>7)throw Error('Điểm thưởng không hợp lệ.');
  const row={id:Utilities.getUuid(),email:u.email,period,taskId:t.id,category,reference:ref,requested,approved:0,status:'pending',updatedAt:new Date().toISOString()};kpiWrite_('kpi_thuong',row);kpiAudit_(u,action,row.id,null,row);return row;
 }
 if(action==='reviewBonus'){
  const row=kpiRows_('kpi_thuong').find(r=>r.id===p.id&&r.period===period);if(!row)throw Error('Không có đề xuất thưởng.');kpiTarget_(u,row.email,true);const before=Object.assign({},row),t=kpiTasks_(row.email,period).find(t=>t.id===row.taskId),sum=kpiSummary_(kpiPeople_().find(x=>x.email===row.email),period);if(!t||sum.A<=0)throw Error('Chưa đủ dữ liệu KPI.');
  const source=String(row.category).includes('PL5');if(kpiCfg_().bonusMode!=='school'&&!source)throw Error('Chưa ban hành điểm thưởng trường. Chỉ có thể duyệt thưởng theo PL5.');
  if(p.accept&&String(row.category)==='Sáng kiến theo PL5'&&!p.qualifyingInnovation)throw Error('Xác nhận sáng kiến đã áp dụng hiệu quả và có khả năng nhân rộng.');
  if(p.accept&&String(row.category)==='Nổi trội theo PL5'){if(!p.qualifyingOutstanding)throw Error('Xác nhận nhiệm vụ quan trọng, phức tạp và hoàn thành trước 50% tiến độ hoặc thực hiện gấp dưới 2 ngày làm việc, đáp ứng chất lượng.');}
  const limit=source?KpiCore.round(.05*70*KpiCore.score(t).actual/sum.A):Number(row.requested);const value=Number(p.approved);if(!Number.isFinite(value)||value<0||value>limit)throw Error('Điểm thưởng nhiệm vụ tối đa '+limit);row.approved=p.accept?value:0;row.status=p.accept?'approved':'rejected';row.reviewer=u.email;row.reference+='\nXác nhận: '+kpiRequiredText_(p.note,'căn cứ duyệt');row.updatedAt=new Date().toISOString();kpiWrite_('kpi_thuong',row);kpiAudit_(u,action,row.id,before,row);return row;
 }
 throw Error('Hành động không hợp lệ.');
 });
}
function doGet(e){
 const p=e&&e.parameter||{},callback=String(p.callback||'');if(callback&&!/^[A-Za-z_$][\w$]{0,90}$/.test(callback))return ContentService.createTextOutput('invalid callback');
 let result;if(p.action==='kpiPublic')result={ok:true,data:{version:KPI_VERSION,config:kpiCfg_(),catalog:kpiRows_('bang_luong_hoa_kpi')}};
 else if(p.action==='kpiPoll'&&/^[a-f0-9-]{36,100}$/i.test(p.ticket||'')){const c=CacheService.getScriptCache(),manifest=c.get('kpi-result-'+p.ticket);if(!manifest)result={pending:true};else {const m=JSON.parse(manifest);result=p.chunk!==undefined?{chunk:c.get('kpi-result-'+p.ticket+'-'+Number(p.chunk))}:m;}}
 else result={ok:false,error:'API KPI không hợp lệ. Triển khai KpiBackend.gs.'};
 const json=JSON.stringify(result);return ContentService.createTextOutput(callback?callback+'('+json+');':json).setMimeType(callback?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON);
}
function doPost(e){
 const p=e&&e.parameter||{};const ticket=String(p.ticket||'');if(!/^[a-f0-9-]{36,100}$/i.test(ticket))return ContentService.createTextOutput('Invalid ticket');
 let result;try{result={ok:true,data:kpiDispatch_(p.action,JSON.parse(p.payload||'{}'),String(p.token||''))};}catch(err){result={ok:false,error:err.message};}
 const str=JSON.stringify(result),chunks=[];for(let i=0;i<str.length;i+=20000)chunks.push(str.slice(i,i+20000));const cache=CacheService.getScriptCache();chunks.forEach((x,i)=>cache.put('kpi-result-'+ticket+'-'+i,x,300));cache.put('kpi-result-'+ticket,JSON.stringify({ready:true,chunks:chunks.length}),300);return ContentService.createTextOutput('OK');
}
function applyKpiTimeouts(){if(kpiCfg_().autoTimeout!=='true')return;return kpiLocked_(()=>{const now=Date.now(),system={email:'SYSTEM-TIMEOUT'};kpiRows_('kpi_cong_viec').forEach(t=>{let changed=false;const before=Object.assign({},t);if(t.cancelled)return;if(t.planStatus==='pending'&&now-Date.parse(t.planAt)>=3*86400000){t.planStatus='approved';changed=true;}if(t.planStatus==='approved'&&t.reviewStatus==='pending'&&now-Date.parse(t.submittedAt)>=7*86400000){t.reviewStatus='approved';t.reviewer=system.email;t.reviewedAt=new Date().toISOString();changed=true;}if(changed){t.version=Number(t.version)+1;kpiWrite_('kpi_cong_viec',t);kpiAudit_(system,'SOURCE_TIMEOUT',t.id,before,t);}});});}
function installKpiTimeoutTrigger(){if(kpiCfg_().autoTimeout!=='true')throw Error('Chỉ bật sau khi trường ban hành cơ chế tự duyệt quá hạn 3/7 ngày.');if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='applyKpiTimeouts'))ScriptApp.newTrigger('applyKpiTimeouts').timeBased().everyHours(1).create();}
function refreshKpiResults(){const period=kpiCfg_().period;kpiPeople_().forEach(u=>{const sum=kpiSummary_(u,period),old=kpiRows_('kpi_ket_qua').find(r=>r.email===u.email&&r.period===period);kpiWrite_('kpi_ket_qua',Object.assign(old||{},{email:u.email,period,A:sum.A,B:sum.B,KPI:sum.kpi===null?'':sum.kpi,Chung:sum.general===null?'':sum.general,Thuong:sum.reward,Tong:sum.total===null?'':sum.total,SoViec:sum.count,HoanThanh:sum.done,Vuot:sum.exceeded,DuDieuKienXS:sum.excellentEligible}));});}
