/* Shared arithmetic. Ratios are percentage integers, difficulty is a multiplier. */
var KpiCore=(function(){
'use strict';
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
function score(t){
 if(![0,60,80,100].includes(Number(t.progress))||![0,60,80,100].includes(Number(t.quality)))throw Error('Tỷ lệ phải là 0, 60, 80 hoặc 100');
 if(![10,12].includes(Number(t.base))||![1,1.1,1.2].includes(Number(t.coef)))throw Error('Điểm chuẩn/hệ số không hợp lệ');
 const performed=Number(t.base)*(.3*Number(t.progress)/100+.7*Number(t.quality)/100);
 return {performed:round(performed),actual:Math.min(round(t.base*t.coef),round(performed*t.coef)),max:round(t.base*t.coef)};
}
function summarize(tasks,general,bonus){
 const accepted=tasks.filter(t=>t.planStatus==='approved'&&!t.cancelled);
 const A=round(accepted.filter(t=>t.inPlan).reduce((s,t)=>s+t.base*t.coef,0));
 const B=round(accepted.reduce((s,t)=>s+(t.reviewStatus==='approved'?score(t).actual:0),0));
 const kpi=A>0?round(Math.min(70,B/A*70)):null;
 const done=accepted.filter(t=>t.reviewStatus==='approved'&&t.completed&&t.quality>=60).length;
 const exceeded=accepted.filter(t=>t.reviewStatus==='approved'&&t.completed&&t.progress===100&&t.quality===100&&t.completedAt&&t.due&&t.completedAt<t.due).length;
 const bonusCap=kpi===null?0:round(Math.min(7,.1*kpi));
 const reward=round(Math.min(bonusCap,Math.max(0,Number(bonus)||0)));
 const total=kpi===null||general===null?null:round(Math.min(100,kpi+general+reward));
 return {A,B,kpi,general,reward,bonusCap,total,count:accepted.length,done,exceeded,exceedRate:accepted.length?round(exceeded/accepted.length*100):0,pending:accepted.filter(t=>t.reviewStatus!=='approved').length,excellentEligible:total!==null&&total>=90&&accepted.length>0&&done===accepted.length&&exceeded/accepted.length>=.3};
}
return {round,score,summarize};
})();
