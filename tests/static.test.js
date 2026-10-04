const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('luonghoa.html','utf8'),app=fs.readFileSync('kpi/app.js','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'duplicate HTML IDs');
for(const id of ['loginForm','passwordForm','managerNav','managerPeople','exportExcel','exportPdf','generalArea','bonusArea','personalSummary','catalogData'])assert.ok(ids.includes(id),id);
const json=JSON.parse(html.match(/<script id="catalogData" type="application\/json">([\s\S]*?)<\/script>/)[1]);assert.equal(json.length,59);assert.equal(new Set(json.map(c=>c.id)).size,59);for(const c of json)assert.equal(c.max,Math.round(c.base*c.coef*100)/100);
assert.ok(!app.includes('localStorage'));assert.ok(!html.includes('file_0000'));assert.ok(!html.includes('123456'));
console.log('Static HTML and source catalogue checks passed');
