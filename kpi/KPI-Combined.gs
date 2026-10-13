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


const KPI_CATALOG = [
  {
    "id": "GVBM-1",
    "role": "GVBM",
    "title": "Xây dựng kế hoạch giáo dục môn học đối với các lớp được phân công; tham gia xây dựng, điều chỉnh kế hoạch giáo dục của tổ chuyên môn.",
    "output": "Kế hoạch giáo dục môn học",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Văn bản ban hành và hồ sơ trình",
    "source": "GVBM!B4"
  },
  {
    "id": "GVBM-2",
    "role": "GVBM",
    "title": "Xây dựng kế hoạch bài dạy, học liệu và chuẩn bị phương tiện, thiết bị dạy học theo yêu cầu của chương trình và kế hoạch giáo dục nhà trường.",
    "output": "Kế hoạch bài dạy, học liệu",
    "sourceDue": "Hằng tuần",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Kế hoạch bài dạy",
    "source": "GVBM!B5"
  },
  {
    "id": "GVBM-3",
    "role": "GVBM",
    "title": "Tổ chức dạy học đúng chương trình, yêu cầu cần đạt, đúng thời gian và bảo đảm chất lượng các tiết dạy theo thời khóa biểu, phân công chuyên môn và định mức tiết dạy theo quy định.",
    "output": "Lịch giảng dạy / Sổ đầu bài",
    "sourceDue": "Hằng tuần",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Sổ đầu bài, TKB",
    "source": "GVBM!B6"
  },
  {
    "id": "GVBM-4",
    "role": "GVBM",
    "title": "Tổ chức kiểm tra, đánh giá thường xuyên, định kỳ và cập nhật điểm số, nhận xét học sinh",
    "output": "Bảng điểm môn học và học bạ điện tử",
    "sourceDue": "Theo lịch",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Dữ liệu điểm số đồng bộ trên VnEdu",
    "source": "GVBM!B7"
  },
  {
    "id": "GVBM-5",
    "role": "GVBM",
    "title": "6. Xây dựng đề, đáp án, hướng dẫn chấm và thực hiện kiểm tra, đánh giá kết quả học tập, sự tiến bộ của học sinh theo phân công và quy định.",
    "output": "Đề kiểm tra, đáp án, ma trận",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Hồ sơ đề thi, đáp án",
    "source": "GVBM!B8"
  },
  {
    "id": "GVBM-6",
    "role": "GVBM",
    "title": "Phân tích kết quả học tập và sự tiến bộ của học sinh theo từng giai đoạn; xác định những nội dung cần điều chỉnh và đề xuất biện pháp nâng cao chất lượng dạy học.",
    "output": "Báo cáo phân tích chất lượng",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Báo cáo chuyên môn",
    "source": "GVBM!B9"
  },
  {
    "id": "GVBM-7",
    "role": "GVBM",
    "title": "Thực hiện phụ đạo, hỗ trợ học sinh chưa đạt yêu cầu theo kế hoạch; bồi dưỡng học sinh giỏi, hướng dẫn nghiên cứu khoa học hoặc tham gia các kỳ thi khi được phân công.",
    "output": "Kế hoạch & Danh sách HS",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.2,
    "max": 12.0,
    "evidence": "Hồ sơ phụ đạo, bồi dưỡng HSG",
    "source": "GVBM!B10"
  },
  {
    "id": "GVBM-8",
    "role": "GVBM",
    "title": "Thực hiện giáo dục hòa nhập đối với học sinh thuộc phạm vi được giao; phối hợp thực hiện các biện pháp hỗ trợ phù hợp với từng đối tượng học sinh.",
    "output": "Kế hoạch giáo dục cá nhân hóa",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.2,
    "max": 12.0,
    "evidence": "Hồ sơ theo dõi HS hòa nhập",
    "source": "GVBM!B11"
  },
  {
    "id": "GVBM-9",
    "role": "GVBM",
    "title": "Tham gia đầy đủ sinh hoạt tổ, nhóm chuyên môn, nghiên cứu bài học, chuyên đề, dự giờ, thao giảng và các hoạt động phát triển chuyên môn theo kế hoạch.",
    "output": "Biên bản sinh hoạt tổ/nhóm",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Biên bản họp tổ chuyên môn",
    "source": "GVBM!B12"
  },
  {
    "id": "GVBM-10",
    "role": "GVBM",
    "title": "Tham gia đào tạo, bồi dưỡng, tự bồi dưỡng chuyên môn, nghiệp vụ và thực hiện các yêu cầu về phát triển năng lực nghề nghiệp giáo viên.",
    "output": "Chứng nhận / Báo cáo",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Chứng chỉ, giấy chứng nhận",
    "source": "GVBM!B13"
  },
  {
    "id": "GVBM-11",
    "role": "GVBM",
    "title": "Ứng dụng công nghệ thông tin, chuyển đổi số, học liệu số, thiết bị và các phương tiện dạy học phù hợp trong quá trình giảng dạy.",
    "output": "Bài giảng điện tử / Học liệu số",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.2,
    "max": 12.0,
    "evidence": "Kho học liệu số, LMS",
    "source": "GVBM!B14"
  },
  {
    "id": "GVBM-12",
    "role": "GVBM",
    "title": "Chủ động đổi mới phương pháp, hình thức tổ chức dạy học, kiểm tra đánh giá và khai thác hiệu quả các nguồn học liệu phục vụ dạy học.",
    "output": "Sản phẩm đổi mới PPDH",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.2,
    "max": 12.0,
    "evidence": "Báo cáo chuyên đề, sáng kiến",
    "source": "GVBM!B15"
  },
  {
    "id": "GVBM-13",
    "role": "GVBM",
    "title": "Tham gia các hoạt động giáo dục, hoặc các nhiệm vụ khác khi được Hiệu trưởng, Phó Hiệu trưởng  phân công.",
    "output": "Báo cáo kết quả / Kế hoạch",
    "sourceDue": "Theo phân công",
    "kind": "Đột xuất",
    "base": 12,
    "coef": 1.1,
    "max": 13.2,
    "evidence": "Minh chứng phân công",
    "source": "GVBM!B16"
  },
  {
    "id": "GVBM-14",
    "role": "GVBM",
    "title": "Tham gia các hoạt động giáo dục, hoặc các nhiệm vụ chuyên môn khác khi được Sở Giáo dục phân công.",
    "output": "Biên bản kiểm tra / Báo cáo",
    "sourceDue": "Theo phân công",
    "kind": "Đột xuất",
    "base": 12,
    "coef": 1.1,
    "max": 13.2,
    "evidence": "QĐ/Hồ sơ thực hiện nhiệm vụ",
    "source": "GVBM!B17"
  },
  {
    "id": "GVCN-1",
    "role": "GVCN",
    "title": "Xây dựng và thực hiện kế hoạch công tác chủ nhiệm, kế hoạch giáo dục của lớp phù hợp với kế hoạch giáo dục nhà trường.",
    "output": "Kế hoạch công tác chủ nhiệm",
    "sourceDue": "2026-08-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Văn bản ban hành và hồ sơ trình",
    "source": "GVCN!B4"
  },
  {
    "id": "GVCN-2",
    "role": "GVCN",
    "title": "Nắm bắt, cập nhật và quản lý đầy đủ, chính xác thông tin về học sinh thuộc lớp chủ nhiệm; kịp thời phát hiện những vấn đề cần quan tâm, hỗ trợ.",
    "output": "Hồ sơ thông tin học sinh",
    "sourceDue": "2026-08-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Sổ chủ nhiệm / CSDL học sinh",
    "source": "GVCN!B5"
  },
  {
    "id": "GVCN-3",
    "role": "GVCN",
    "title": "Theo dõi thường xuyên tình hình chuyên cần, học tập, rèn luyện, ý thức chấp hành nội quy và sự tiến bộ của từng học sinh.",
    "output": "Sổ theo dõi chuyên cần",
    "sourceDue": "Hằng tuần",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Sổ đầu bài / Sổ điểm danh",
    "source": "GVCN!B6"
  },
  {
    "id": "GVCN-4",
    "role": "GVCN",
    "title": "Tổ chức tiết sinh hoạt lớp và các hoạt động giáo dục tập thể theo kế hoạch; xây dựng tập thể lớp đoàn kết, tích cực, tự quản và có ý thức trách nhiệm.",
    "output": "Biên bản sinh hoạt lớp",
    "sourceDue": "Hằng tuần",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Giáo án HĐTN-HN / Sổ chủ nhiệm",
    "source": "GVCN!B7"
  },
  {
    "id": "GVCN-5",
    "role": "GVCN",
    "title": "Hướng dẫn ban cán sự lớp tổ chức, điều hành và quản lý các hoạt động của lớp; phát huy vai trò tự quản của học sinh.",
    "output": "Sổ tay cán sự lớp",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Sổ phân công nhiệm vụ lớp",
    "source": "GVCN!B8"
  },
  {
    "id": "GVCN-6",
    "role": "GVCN",
    "title": "Tư vấn, hỗ trợ ban đầu đối với học sinh gặp khó khăn trong học tập, tâm lý, quan hệ xã hội; phối hợp với nhà trường, cha mẹ học sinh và các lực lượng có liên quan khi cần thiết.",
    "output": "Nhật ký tư vấn tâm lý",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Biên bản tư vấn / Sổ theo dõi",
    "source": "GVCN!B9"
  },
  {
    "id": "GVCN-7",
    "role": "GVCN",
    "title": "Chủ động thực hiện các biện pháp hỗ trợ đối với học sinh có nguy cơ bỏ học, vi phạm nội quy, sa sút trong học tập hoặc rèn luyện; theo dõi kết quả và báo cáo nhà trường theo quy định.",
    "output": "Hồ sơ hỗ trợ HS cá biệt",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.2,
    "max": 12.0,
    "evidence": "Biên bản làm việc với PHHS, BGH",
    "source": "GVCN!B10"
  },
  {
    "id": "GVCN-8",
    "role": "GVCN",
    "title": "Phối hợp với giáo viên bộ môn trong theo dõi, quản lý, giáo dục và hỗ trợ học sinh; trao đổi kịp thời những vấn đề phát sinh liên quan đến học sinh.",
    "output": "Biên bản phối hợp GVBM",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Sổ ghi chép / Sổ liên lạc",
    "source": "GVCN!B11"
  },
  {
    "id": "GVCN-9",
    "role": "GVCN",
    "title": "Phối hợp, trao đổi thường xuyên với cha mẹ học sinh về tình hình học tập, rèn luyện, chuyên cần và những vấn đề cần phối hợp giáo dục học sinh.",
    "output": "Sổ liên lạc PHHS",
    "sourceDue": "Hằng tuần",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Nhật ký trao đổi, ứng dụng SLLĐT",
    "source": "GVCN!B12"
  },
  {
    "id": "GVCN-10",
    "role": "GVCN",
    "title": "Tổ chức họp cha mẹ học sinh theo kế hoạch của nhà trường; thực hiện đầy đủ nội dung, bảo đảm đúng quy định và hiệu quả phối hợp giáo dục.",
    "output": "Biên bản họp PHHS",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Biên bản họp, danh sách điểm danh",
    "source": "GVCN!B13"
  },
  {
    "id": "GVCN-11",
    "role": "GVCN",
    "title": "Hướng dẫn, quản lý học sinh tham gia hoạt động trải nghiệm, hướng nghiệp và các hoạt động giáo dục khác theo kế hoạch của nhà trường.",
    "output": "Báo cáo hoạt động trải nghiệm",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Kế hoạch, Hình ảnh minh chứng",
    "source": "GVCN!B14"
  },
  {
    "id": "GVCN-12",
    "role": "GVCN",
    "title": "Tổng hợp thông tin, nhận xét và thực hiện đánh giá kết quả rèn luyện của học sinh cuối học kỳ, cuối năm học theo quy định; bảo đảm khách quan, chính xác và đúng thời hạn.",
    "output": "Kết quả đánh giá rèn luyện",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Bảng tổng hợp xếp loại trên vnedu",
    "source": "GVCN!B15"
  },
  {
    "id": "GVCN-13",
    "role": "GVCN",
    "title": "Hướng dẫn học sinh thực hiện quy trình bình xét, đề nghị khen thưởng; tổng hợp và báo cáo kết quả theo quy định của nhà trường.",
    "output": "Biên bản xét khen thưởng",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Hồ sơ đề nghị khen thưởng",
    "source": "GVCN!B16"
  },
  {
    "id": "GVCN-14",
    "role": "GVCN",
    "title": "Tổng hợp, lập danh sách và đề xuất việc lên lớp, không lên lớp, rèn luyện trong kỳ nghỉ hè và các nội dung liên quan đến kết quả giáo dục học sinh theo quy định.",
    "output": "Danh sách xét duyệt",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Biên bản họp xét duyệt cuối năm/hè",
    "source": "GVCN!B17"
  },
  {
    "id": "GVCN-15",
    "role": "GVCN",
    "title": "Cập nhật, hoàn thiện học bạ và hồ sơ học sinh của lớp chủ nhiệm đầy đủ, chính xác, đúng thời hạn; thực hiện quản lý, bảo quản thông tin, hồ sơ học sinh theo quy định.",
    "output": "Học bạ học sinh",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Hồ sơ học bạ hoàn thiện",
    "source": "GVCN!B18"
  },
  {
    "id": "GVCN-16",
    "role": "GVCN",
    "title": "Thực hiện đầy đủ, chính xác và đúng thời hạn các báo cáo định kỳ, đột xuất về tình hình lớp, học sinh và công tác chủ nhiệm theo yêu cầu của nhà trường.",
    "output": "Báo cáo tổng hợp/đột xuất",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Văn bản báo cáo / Biểu mẫu",
    "source": "GVCN!B19"
  },
  {
    "id": "TTCM-1",
    "role": "TTCM",
    "title": "Tham gia xây dựng kế hoạch giáo dục của nhà trường theo lĩnh vực chuyên môn được phân công.",
    "output": "Kế hoạch giáo dục nhà trường",
    "sourceDue": "2026-08-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.2,
    "max": 12.0,
    "evidence": "Văn bản Kế hoạch trường",
    "source": "TTCM!B4"
  },
  {
    "id": "TTCM-2",
    "role": "TTCM",
    "title": "Xây dựng và tổ chức thực hiện kế hoạch giáo dục của tổ chuyên môn; chịu trách nhiệm về tiến độ, chất lượng và hiệu quả thực hiện kế hoạch của tổ.",
    "output": "Kế hoạch tổ chuyên môn",
    "sourceDue": "2026-08-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.2,
    "max": 12.0,
    "evidence": "Kế hoạch tổ được duyệt",
    "source": "TTCM!B5"
  },
  {
    "id": "TTCM-3",
    "role": "TTCM",
    "title": "Tham mưu, đề xuất với Hiệu trưởng việc phân công giáo viên giảng dạy, làm công tác chủ nhiệm và thực hiện các nhiệm vụ chuyên môn khác phù hợp với năng lực, chuyên môn và yêu cầu của nhà trường.",
    "output": "Phiếu/Văn bản đề xuất",
    "sourceDue": "2026-08-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Tờ trình đề xuất BGH",
    "source": "TTCM!B6"
  },
  {
    "id": "TTCM-4",
    "role": "TTCM",
    "title": "Đề xuất lựa chọn, sử dụng tài liệu giáo dục, học liệu và xuất bản phẩm tham khảo phục vụ hoạt động dạy học theo quy định.",
    "output": "Danh mục tài liệu đề xuất",
    "sourceDue": "2026-08-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Biên bản họp tổ đề xuất",
    "source": "TTCM!B7"
  },
  {
    "id": "TTCM-5",
    "role": "TTCM",
    "title": "Hướng dẫn thành viên xây dựng, thực hiện và điều chỉnh kế hoạch giáo dục môn học, kế hoạch bài dạy và các nhiệm vụ chuyên môn theo yêu cầu.",
    "output": "Biên bản / Hướng dẫn",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Biên bản sinh hoạt chuyên môn",
    "source": "TTCM!B8"
  },
  {
    "id": "TTCM-6",
    "role": "TTCM",
    "title": "Tổ chức sinh hoạt tổ chuyên môn theo quy định; sinh hoạt chuyên môn theo NCBH bảo đảm nội dung sinh hoạt thiết thực, hiệu quả và gắn với nâng cao chất lượng dạy học.",
    "output": "Biên bản họp tổ",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Sổ biên bản sinh hoạt tổ",
    "source": "TTCM!B9"
  },
  {
    "id": "TTCM-7",
    "role": "TTCM",
    "title": "Tổ chức hội giảng, chuyên đề đổi mới phương pháp dạy học, ứng dụng công nghệ số cấp tổ/trường",
    "output": "Kế hoạch & Báo cáo kết quả chuyên đề",
    "sourceDue": "Theo lịch",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Kế hoạch, Biên bản dự giờ",
    "source": "TTCM!B10"
  },
  {
    "id": "TTCM-8",
    "role": "TTCM",
    "title": "Theo dõi, đôn đốc tiến độ thực hiện chương trình, kế hoạch giáo dục và các nhiệm vụ chuyên môn của thành viên trong tổ; kịp thời báo cáo, đề xuất xử lý những vấn đề phát sinh.",
    "output": "Báo cáo tiến độ",
    "sourceDue": "Hằng tuần/tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Nhật ký tổ trưởng, Sổ theo dõi",
    "source": "TTCM!B11"
  },
  {
    "id": "TTCM-9",
    "role": "TTCM",
    "title": "Kiểm tra hồ sơ, sản phẩm chuyên môn của thành viên theo kế hoạch; hướng dẫn khắc phục những hạn chế và theo dõi kết quả thực hiện.",
    "output": "Biên bản kiểm tra hồ sơ",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Biên bản kiểm tra HSSS GV",
    "source": "TTCM!B12"
  },
  {
    "id": "TTCM-10",
    "role": "TTCM",
    "title": "Phân tích kết quả giáo dục của tổ, xác định những vấn đề cần cải thiện và đề xuất giải pháp nâng cao chất lượng dạy học.",
    "output": "Báo cáo phân tích chất lượng",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.2,
    "max": 12.0,
    "evidence": "Báo cáo thống kê, phân tích",
    "source": "TTCM!B13"
  },
  {
    "id": "TTCM-11",
    "role": "TTCM",
    "title": "Tham mưu đánh giá, xếp loại thi đua viên chức định kỳ quý/năm đối với giáo viên trong tổ",
    "output": "Bảng đánh giá và phiếu nhận xét",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Bảng đánh giá và phiếu nhận xét",
    "source": "TTCM!B14"
  },
  {
    "id": "TTCM-12",
    "role": "TTCM",
    "title": "Quản lý, cập nhật và lưu trữ hồ sơ, dữ liệu và minh chứng hoạt động của tổ chuyên môn theo quy định.",
    "output": "Hồ sơ tổ chuyên môn",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Hệ thống hồ sơ sổ sách tổ",
    "source": "TTCM!B15"
  },
  {
    "id": "TTCM-13",
    "role": "TTCM",
    "title": "Thực hiện báo cáo định kỳ, sơ kết, tổng kết và các báo cáo đột xuất về hoạt động của tổ chuyên môn theo yêu cầu của Hiệu trưởng.",
    "output": "Báo cáo chuyên môn tổ",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Báo cáo nộp BGH",
    "source": "TTCM!B16"
  },
  {
    "id": "TPCM-1",
    "role": "TPCM",
    "title": "Tham gia xây dựng và thực hiện kế hoạch giáo dục của tổ chuyên môn theo lĩnh vực, nhiệm vụ được phân công.",
    "output": "Kế hoạch giáo dục",
    "sourceDue": "2026-08-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Bản thảo góp ý/Kế hoạch ban hành",
    "source": "TPCM!B4"
  },
  {
    "id": "TPCM-2",
    "role": "TPCM",
    "title": "Tổ chức triển khai các nhiệm vụ chuyên môn được Tổ trưởng phân công; phối hợp với các thành viên trong tổ để bảo đảm tiến độ và chất lượng thực hiện.",
    "output": "Kế hoạch triển khai",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Báo cáo tiến độ/Biên bản phối hợp",
    "source": "TPCM!B5"
  },
  {
    "id": "TPCM-3",
    "role": "TPCM",
    "title": "Theo dõi tiến độ thực hiện chương trình, kế hoạch giáo dục và kết quả giáo dục của môn học, lĩnh vực chuyên môn được phân công; kịp thời báo cáo Tổ trưởng những vấn đề phát sinh.",
    "output": "Báo cáo tiến độ",
    "sourceDue": "Hằng tuần",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Sổ theo dõi/Nhật ký tổ phó",
    "source": "TPCM!B6"
  },
  {
    "id": "TPCM-4",
    "role": "TPCM",
    "title": "Hỗ trợ, hướng dẫn thành viên trong tổ xây dựng, thực hiện và điều chỉnh kế hoạch giáo dục môn học, kế hoạch bài dạy và các nhiệm vụ chuyên môn theo yêu cầu.",
    "output": "Biên bản hướng dẫn",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Biên bản sinh hoạt/Sổ ghi chép",
    "source": "TPCM!B7"
  },
  {
    "id": "TPCM-5",
    "role": "TPCM",
    "title": "Chuẩn bị nội dung sinh hoạt tổ chuyên môn, chuyên đề, nghiên cứu bài học và các hoạt động chuyên môn khác theo phân công của Tổ trưởng.",
    "output": "Tài liệu chuyên đề",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Hồ sơ sinh hoạt chuyên môn",
    "source": "TPCM!B8"
  },
  {
    "id": "TPCM-6",
    "role": "TPCM",
    "title": "Tham gia kiểm tra hồ sơ, sản phẩm chuyên môn của thành viên theo phân công; tổng hợp những nội dung cần điều chỉnh và báo cáo Tổ trưởng để chỉ đạo thực hiện.",
    "output": "Biên bản kiểm tra",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Phiếu/Biên bản kiểm tra HSSS",
    "source": "TPCM!B9"
  },
  {
    "id": "TPCM-7",
    "role": "TPCM",
    "title": "Tổng hợp số liệu, hồ sơ, minh chứng và kết quả thực hiện các nhiệm vụ chuyên môn thuộc lĩnh vực được phân công; phục vụ công tác đánh giá, sơ kết, tổng kết và báo cáo của tổ.",
    "output": "Bảng tổng hợp dữ liệu",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Báo cáo/Biểu mẫu thống kê",
    "source": "TPCM!B10"
  },
  {
    "id": "TPCM-8",
    "role": "TPCM",
    "title": "Điều hành hoạt động của tổ chuyên môn hoặc các hoạt động chuyên môn cụ thể khi được Tổ trưởng phân công hoặc ủy quyền; bảo đảm hoạt động được thực hiện đúng kế hoạch và quy định.",
    "output": "Biên bản điều hành",
    "sourceDue": "Theo phân công",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Biên bản họp do tổ phó chủ trì",
    "source": "TPCM!B11"
  },
  {
    "id": "TPCM-9",
    "role": "TPCM",
    "title": "Báo cáo Tổ trưởng về tiến độ, kết quả thực hiện nhiệm vụ được giao; đề xuất giải pháp xử lý những khó khăn, vướng mắc trong quá trình thực hiện.",
    "output": "Báo cáo công tác",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Báo cáo định kỳ nộp Tổ trưởng",
    "source": "TPCM!B12"
  },
  {
    "id": "HOANHAP-1",
    "role": "HOANHAP",
    "title": "Tham gia xây dựng và thực hiện kế hoạch giáo dục cá nhân đối với học sinh hòa nhập theo hồ sơ, nhu cầu, khả năng của học sinh và sự hướng dẫn của nhà trường.",
    "output": "Kế hoạch GD cá nhân",
    "sourceDue": "2026-08-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.2,
    "max": 12.0,
    "evidence": "Hồ sơ kế hoạch giáo dục cá nhân được duyệt",
    "source": "HOA NHAP!B4"
  },
  {
    "id": "HOANHAP-2",
    "role": "HOANHAP",
    "title": "Hỗ trợ học sinh hòa nhập trong học tập và tham gia các hoạt động giáo dục theo kế hoạch giáo dục cá nhân và nhiệm vụ được phân công; tạo điều kiện để học sinh tham gia phù hợp với khả năng.",
    "output": "Nhật ký hỗ trợ HS",
    "sourceDue": "Hằng tuần",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Sổ theo dõi/Nhật ký hỗ trợ học sinh",
    "source": "HOA NHAP!B5"
  },
  {
    "id": "HOANHAP-3",
    "role": "HOANHAP",
    "title": "Phối hợp với giáo viên bộ môn, giáo viên chủ nhiệm và các bộ phận có liên quan trong việc điều chỉnh cách thức hỗ trợ, phương pháp, hình thức tổ chức hoạt động giáo dục phù hợp với nhu cầu của học sinh.",
    "output": "Biên bản điều chỉnh phương pháp",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Biên bản sinh hoạt chuyên môn / Góp ý",
    "source": "HOA NHAP!B6"
  },
  {
    "id": "HOANHAP-4",
    "role": "HOANHAP",
    "title": "Theo dõi, ghi nhận và báo cáo sự tiến bộ của học sinh về học tập, khả năng tham gia hoạt động giáo dục và các kỹ năng cần hỗ trợ; kịp thời thông tin những khó khăn phát sinh.",
    "output": "Báo cáo tiến độ học sinh",
    "sourceDue": "Hằng tháng",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Sổ theo dõi sự tiến bộ / Báo cáo định kỳ",
    "source": "HOA NHAP!B7"
  },
  {
    "id": "HOANHAP-5",
    "role": "HOANHAP",
    "title": "Phối hợp với cha mẹ học sinh và cơ quan, đơn vị, cá nhân có chuyên môn liên quan trong quá trình hỗ trợ học sinh theo kế hoạch và sự chỉ đạo của nhà trường.",
    "output": "Biên bản làm việc với PHHS",
    "sourceDue": "Khi phát sinh",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Biên bản phối hợp gia đình - nhà trường",
    "source": "HOA NHAP!B8"
  },
  {
    "id": "HOANHAP-6",
    "role": "HOANHAP",
    "title": "Quản lý, cập nhật và bảo mật hồ sơ, thông tin liên quan đến quá trình hỗ trợ học sinh theo quy định; bảo đảm thông tin được sử dụng đúng mục đích.",
    "output": "Hệ thống hồ sơ bảo mật",
    "sourceDue": "Hằng tuần",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.0,
    "max": 10.0,
    "evidence": "Tủ lưu trữ hồ sơ / Minh chứng bảo mật",
    "source": "HOA NHAP!B9"
  },
  {
    "id": "HOANHAP-7",
    "role": "HOANHAP",
    "title": "Tổng hợp, báo cáo kết quả thực hiện kế hoạch hỗ trợ và đề xuất điều chỉnh biện pháp hỗ trợ khi cần thiết; thực hiện các nhiệm vụ khác theo phân công của Hiệu trưởng.",
    "output": "Báo cáo tổng kết hỗ trợ",
    "sourceDue": "2026-09-30",
    "kind": "Thường xuyên",
    "base": 10,
    "coef": 1.1,
    "max": 11.0,
    "evidence": "Văn bản báo cáo tổng kết nộp Ban Giám hiệu",
    "source": "HOA NHAP!B10"
  }
];


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
