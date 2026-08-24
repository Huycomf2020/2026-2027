const CONFIG = Object.freeze({
  ATTENDANCE_PASSWORD: 'Diemdanh@26',
  SHEETS: {
    RULES: 'quy_dinh',
    STUDENTS: 'khoi_lop',
    COMPETITION: 'thi_dua',
    ACTIVITIES: 'hoat_dong_khac',
    DASHBOARD: 'dashboard'
  },
  STATUS: ['Có mặt', 'Vắng mặt', 'Vắng không phép', 'Đi trễ'],
  CLASSES: [
    ...Array.from({length: 12}, (_, i) => `10A${i + 1}`),
    ...Array.from({length: 14}, (_, i) => `11A${i + 1}`),
    ...Array.from({length: 14}, (_, i) => `12A${i + 1}`)
  ]
});

function doGet(e) {
  if (e && e.parameter && e.parameter.action) return handleApiRequest_(e);
  return HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle('Đoàn trường THPT Lộc Ninh')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  return handleApiRequest_(e);
}

function handleApiRequest_(e) {
  try {
    const action = String(e.parameter.action || '');
    const args = JSON.parse(e.parameter.args || '[]');
    const allowed = {
      getBootstrapData: getBootstrapData,
      getRules: getRules,
      verifyAttendancePassword: verifyAttendancePassword,
      getStudentsByClass: getStudentsByClass,
      saveAttendance: saveAttendance,
      getCompetitionData: getCompetitionData
    };
    if (!allowed[action]) throw new Error('API action không hợp lệ.');
    return ContentService.createTextOutput(JSON.stringify({ok:true, data:allowed[action].apply(null, args)}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ok:false, error:error.message || String(error)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🤖 Trợ lý Đoàn trường')
    .addItem('Mở trợ lý AI', 'showSchoolAssistant')
    .addSeparator()
    .addItem('Khởi tạo/Cập nhật hệ thống', 'initializeSystem')
    .addItem('Làm mới thi đua & dashboard', 'refreshCompetition')
    .addToUi();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet_(name, headers) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (headers && (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() === '')) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  if (headers) formatHeader_(sheet, headers.length);
  return sheet;
}

function formatHeader_(sheet, columns) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, columns)
    .setBackground('#075985').setFontColor('#ffffff').setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.autoResizeColumns(1, columns);
}

function initializeSystem() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const rules = getOrCreateSheet_(CONFIG.SHEETS.RULES, ['STT', 'Nội dung', 'Điểm trừ', 'Ghi chú']);
    const students = getOrCreateSheet_(CONFIG.SHEETS.STUDENTS,
      ['STT', 'Họ và tên', 'Mã học sinh', 'Lớp', 'Trạng thái', 'Ngày', 'Buổi', 'Cập nhật lúc']);
    const competition = getOrCreateSheet_(CONFIG.SHEETS.COMPETITION,
      ['Tuần', 'Tháng', 'Học kỳ', 'Năm học', 'Lớp', 'Điểm nền', 'Điểm cộng', 'Điểm trừ', 'Tổng điểm', 'Xếp hạng']);
    const activities = getOrCreateSheet_(CONFIG.SHEETS.ACTIVITIES,
      ['STT', 'Lớp', 'Điểm cộng', 'Điểm trừ', 'Ghi chú', 'Ngày', 'Tuần']);

    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(CONFIG.STATUS, true).setAllowInvalid(false).build();
    students.getRange(2, 5, Math.max(students.getMaxRows() - 1, 1), 1).setDataValidation(statusRule);

    [rules, students, competition, activities].forEach(s => {
      s.getDataRange().setVerticalAlignment('middle');
      s.setRowHeight(1, 34);
      if (!s.getFilter() && s.getLastColumn()) s.getRange(1, 1, Math.max(s.getLastRow(), 2), s.getLastColumn()).createFilter();
    });

    refreshCompetition();
    return {ok: true, message: 'Đã khởi tạo đầy đủ các sheet và dashboard.'};
  } finally {
    lock.releaseLock();
  }
}

function getBootstrapData() {
  return {
    rules: getRules(),
    competition: getCompetitionData('week'),
    classes: CONFIG.CLASSES,
    current: getCurrentSession_()
  };
}

function getRules() {
  const sheet = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.RULES);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(sheet.getLastColumn(), 2))
    .getDisplayValues().filter(row => row.some(Boolean))
    .map(row => ({stt: row[0], content: row[1], deduction: row[2] || '', note: row[3] || ''}));
}

function verifyAttendancePassword(password) {
  const valid = String(password || '') === CONFIG.ATTENDANCE_PASSWORD;
  return {valid, token: valid ? Utilities.base64EncodeWebSafe(`${Date.now()}|attendance`) : ''};
}

function validateToken_(token) {
  try {
    const decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(token)).getDataAsString();
    const [time, scope] = decoded.split('|');
    return scope === 'attendance' && Date.now() - Number(time) < 8 * 60 * 60 * 1000;
  } catch (e) { return false; }
}

function getStudentsByClass(className, token) {
  if (!validateToken_(token)) throw new Error('Phiên điểm danh không hợp lệ hoặc đã hết hạn.');
  if (!CONFIG.CLASSES.includes(className)) throw new Error('Lớp không hợp lệ.');
  const sheet = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.STUDENTS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getDisplayValues()
    .map((row, i) => ({sourceRow: i + 2, values: row}))
    .filter(item => item.values[3] === className)
    .map(item => ({row: item.sourceRow, stt: item.values[0], name: item.values[1], code: item.values[2], className: item.values[3], status: item.values[4] || 'Có mặt'}));
}

function saveAttendance(payload, token) {
  if (!validateToken_(token)) throw new Error('Phiên điểm danh không hợp lệ hoặc đã hết hạn.');
  if (!payload || !CONFIG.CLASSES.includes(payload.className)) throw new Error('Dữ liệu lớp không hợp lệ.');
  const allowed = new Set(CONFIG.STATUS);
  const updates = (payload.students || []).filter(s => allowed.has(s.status));
  const sheet = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.STUDENTS);
  if (!sheet) throw new Error('Chưa có sheet khoi_lop. Hãy chạy initializeSystem trước.');
  const session = getCurrentSession_();
  const now = new Date();
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    updates.forEach(s => {
      const row = Number(s.row);
      if (row < 2 || sheet.getRange(row, 4).getDisplayValue() !== payload.className) return;
      sheet.getRange(row, 5, 1, 4).setValues([[s.status, session.isoDate, session.period, now]]);
    });
    SpreadsheetApp.flush();
    refreshCompetition();
    return {ok: true, count: updates.length, savedAt: Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss dd/MM/yyyy')};
  } finally { lock.releaseLock(); }
}

function getCurrentSession_() {
  const now = new Date();
  const tz = Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh';
  const hour = Number(Utilities.formatDate(now, tz, 'H'));
  return {
    date: Utilities.formatDate(now, tz, 'EEEE, dd/MM/yyyy'),
    isoDate: Utilities.formatDate(now, tz, 'yyyy-MM-dd'),
    period: hour < 12 ? 'Sáng' : 'Chiều'
  };
}

function getWeekInfo_(date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d); monday.setDate(d.getDate() - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((monday - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);
  const month = d.getMonth() + 1;
  const semester = month >= 8 || month === 1 ? 1 : 2;
  const schoolYearStart = month >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return {week, month, semester, schoolYear: `${schoolYearStart}-${schoolYearStart + 1}`};
}

function refreshCompetition() {
  const ss = getSpreadsheet_();
  const studentSheet = ss.getSheetByName(CONFIG.SHEETS.STUDENTS);
  const activitySheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITIES);
  const competitionSheet = getOrCreateSheet_(CONFIG.SHEETS.COMPETITION,
    ['Tuần', 'Tháng', 'Học kỳ', 'Năm học', 'Lớp', 'Điểm nền', 'Điểm cộng', 'Điểm trừ', 'Tổng điểm', 'Xếp hạng']);
  const info = getWeekInfo_(new Date());
  const penalties = {'Có mặt': 0, 'Vắng mặt': 1, 'Vắng không phép': 2, 'Đi trễ': 0.5};
  const byClass = Object.fromEntries(CONFIG.CLASSES.map(c => [c, {plus: 0, minus: 0}]));

  if (studentSheet && studentSheet.getLastRow() > 1) {
    studentSheet.getRange(2, 1, studentSheet.getLastRow() - 1, 8).getValues().forEach(r => {
      const cls = String(r[3] || '');
      if (byClass[cls]) byClass[cls].minus += penalties[r[4]] || 0;
    });
  }
  if (activitySheet && activitySheet.getLastRow() > 1) {
    activitySheet.getRange(2, 1, activitySheet.getLastRow() - 1, 7).getValues().forEach(r => {
      const cls = String(r[1] || '');
      const activityWeek = Number(r[6]) || getWeekInfo_(r[5] || new Date()).week;
      if (byClass[cls] && activityWeek === info.week) {
        byClass[cls].plus += Number(r[2]) || 0;
        byClass[cls].minus += Number(r[3]) || 0;
      }
    });
  }
  const rows = CONFIG.CLASSES.map(cls => {
    const x = byClass[cls], base = 100, total = base + x.plus - x.minus;
    return [info.week, info.month, info.semester, info.schoolYear, cls, base, x.plus, x.minus, total, 0];
  }).sort((a, b) => b[8] - a[8] || a[4].localeCompare(b[4], 'vi'));
  rows.forEach((r, i) => r[9] = i + 1);

  if (competitionSheet.getLastRow() > 1) competitionSheet.getRange(2, 1, competitionSheet.getLastRow() - 1, 10).clearContent();
  competitionSheet.getRange(2, 1, rows.length, 10).setValues(rows);
  competitionSheet.getRange(2, 6, rows.length, 4).setNumberFormat('0.0');
  buildDashboard_(rows);
  return {ok: true, rows: rows.length};
}

function getCompetitionData(period) {
  const sheet = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.COMPETITION);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
  return rows.map(r => ({week:r[0], month:r[1], semester:r[2], year:r[3], className:r[4], base:r[5], plus:r[6], minus:r[7], total:r[8], rank:r[9]}))
    .sort((a,b) => a.rank-b.rank);
}

function buildDashboard_(rows) {
  const ss = getSpreadsheet_();
  const old = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  const dash = old || ss.insertSheet(CONFIG.SHEETS.DASHBOARD);
  dash.clear(); dash.getCharts().forEach(c => dash.removeChart(c));
  dash.setHiddenGridlines(true);
  dash.getRange('A1:J2').merge().setValue('🏆 DASHBOARD THI ĐUA CÁC CHI ĐOÀN')
    .setBackground('#082f49').setFontColor('#fff').setFontSize(20).setFontWeight('bold').setHorizontalAlignment('center');
  dash.getRange('A4:D4').setValues([['Xếp hạng', 'Lớp', 'Tổng điểm', 'Điểm trừ']]);
  dash.getRange(5, 1, rows.length, 4).setValues(rows.map(r => [r[9], r[4], r[8], r[7]]));
  formatHeaderRange_(dash.getRange('A4:D4'));
  dash.setColumnWidths(1, 4, 130);
  dash.getRange(5, 1, 3, 4).setBackground('#fef3c7').setFontWeight('bold');
  const bar = dash.newChart().asBarChart().addRange(dash.getRange(4, 2, Math.min(rows.length + 1, 16), 2))
    .setPosition(4, 6, 0, 0).setOption('title', 'Top 15 chi đoàn').setOption('legend', {position:'none'}).build();
  const pie = dash.newChart().asPieChart().addRange(dash.getRange(4, 2, Math.min(rows.length + 1, 11), 2))
    .setPosition(21, 6, 0, 0).setOption('title', 'Tỷ trọng điểm Top 10').setOption('pieHole', .45).build();
  dash.insertChart(bar); dash.insertChart(pie);
}

function formatHeaderRange_(range) {
  range.setBackground('#0e7490').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
}

function showSchoolAssistant() {
  const html = HtmlService.createHtmlOutputFromFile('Assistant').setTitle('Trợ lý Đoàn trường');
  SpreadsheetApp.getUi().showSidebar(html);
}

function askSchoolAssistant(question) {
  const q = String(question || '').trim();
  if (!q) throw new Error('Vui lòng nhập câu hỏi.');
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) return 'Chưa cấu hình GEMINI_API_KEY trong Script Properties. Bạn vẫn có thể dùng các lệnh: “top thi đua”, “thống kê vắng”, hoặc “hướng dẫn”.';
  const context = JSON.stringify({rules:getRules().slice(0,30), competition:getCompetitionData('week').slice(0,40)});
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = UrlFetchApp.fetch(url, {method:'post', contentType:'application/json', muteHttpExceptions:true,
    payload: JSON.stringify({contents:[{parts:[{text:`Bạn là Trợ lý Đoàn trường THPT Lộc Ninh. Trả lời ngắn gọn bằng tiếng Việt dựa trên dữ liệu: ${context}\nCâu hỏi: ${q}`}]}]})});
  const data = JSON.parse(response.getContentText());
  if (response.getResponseCode() >= 300) throw new Error(data.error && data.error.message || 'Không thể gọi AI.');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Chưa có câu trả lời.';
}
