import React, { useState } from "react";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import * as XLSX from "xlsx";

export default function TimetableUpload({ data, updateData }) {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ab = e.target.result;
        const wb = XLSX.read(ab, { type: "array" });
        
        // Analyze sheets
        const parsedData = parseWorkbook(wb);
        validateAndReport(parsedData);
      } catch (err) {
        console.error("Error reading spreadsheet:", err);
        setReport({
          status: "error",
          errors: ["엑셀 파일을 읽는 과정에서 오류가 발생했습니다. 올바른 형식의 파일인지 확인해 주세요."]
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Helper to parse XLSX sheets
  const parseWorkbook = (wb) => {
    const sheets = wb.SheetNames;
    const result = {
      teachers: [],
      rooms: [],
      classes: [],
      timetable: [],
      restrictions: []
    };

    // Helper to read rows from sheet name
    const readSheet = (name) => {
      const sheet = wb.Sheets[name];
      if (!sheet) return [];
      return XLSX.utils.sheet_to_json(sheet);
    };

    // Mapping Sheet 1: 교사정보
    const sheet1 = readSheet("교사정보") || readSheet("Sheet1");
    result.teachers = sheet1.map((row, idx) => ({
      id: row["교사ID"] || `T${String(idx + 1).padStart(3, "0")}`,
      name: row["교사명"] || row["이름"],
      subject: row["교과"] || row["과목"],
      grade: Number(row["학년"]) || 1,
      weeklyHours: Number(row["주당시수"]) || 16
    })).filter(t => t.name);

    // Mapping Sheet 2: 교실정보
    const sheet2 = readSheet("교실정보") || readSheet("Sheet2");
    result.rooms = sheet2.map((row, idx) => ({
      id: row["교실ID"] || `R${String(idx + 1).padStart(3, "0")}`,
      name: row["교실명"],
      type: row["유형"] || "classroom" // special or classroom
    })).filter(r => r.name);

    // Mapping Sheet 3: 학급정보
    const sheet3 = readSheet("학급정보") || readSheet("Sheet3");
    result.classes = sheet3.map((row, idx) => ({
      id: row["학급ID"] || `C${row["학년"]}${String(row["반"]).padStart(2, "0")}`,
      grade: Number(row["학년"]),
      classNum: Number(row["반"]),
      room: row["교실ID"] || row["교실"]
    })).filter(c => c.grade && c.classNum);

    // Mapping Sheet 4: 시간표
    const sheet4 = readSheet("시간표") || readSheet("Sheet4");
    result.timetable = sheet4.map(row => {
      // Resolve day string to index
      let dayVal = row["요일"];
      let dayIdx = 1;
      if (typeof dayVal === "string") {
        if (dayVal.includes("월")) dayIdx = 1;
        else if (dayVal.includes("화")) dayIdx = 2;
        else if (dayVal.includes("수")) dayIdx = 3;
        else if (dayVal.includes("목")) dayIdx = 4;
        else if (dayVal.includes("금")) dayIdx = 5;
      } else {
        dayIdx = Number(dayVal) || 1;
      }

      // Resolve room string to ID
      let roomVal = row["교실"];
      let resolvedRoom = roomVal;
      // Search room ID by room name
      const foundRoom = result.rooms.find(r => r.name === roomVal || r.id === roomVal);
      if (foundRoom) {
        resolvedRoom = foundRoom.id;
      } else {
        // Find class homeroom
        const foundClass = result.classes.find(c => c.grade === Number(row["학년"]) && c.classNum === Number(row["반"]));
        resolvedRoom = foundClass ? foundClass.room : "";
      }

      return {
        grade: Number(row["학년"]),
        classNum: Number(row["반"]),
        day: dayIdx,
        period: Number(row["교시"]),
        subject: row["교과"] || row["과목"],
        teacher: row["교사"] || row["선생님"],
        room: resolvedRoom
      };
    }).filter(t => t.grade && t.classNum && t.period && t.subject);

    // Mapping Sheet 5: 교체금지 설정
    const sheet5 = readSheet("교체금지 설정") || readSheet("Sheet5");
    result.restrictions = sheet5.map(row => ({
      type: row["구분"] === "교실" || row["구분"] === "특별실" ? "room" : "teacher",
      target: row["대상"],
      reason: row["사유"],
      rule: "prevent"
    })).filter(r => r.target);

    return result;
  };

  // Perform validation on the parsed data
  const validateAndReport = (parsedData) => {
    const errors = [];
    const warnings = [];
    
    // 1. Basic validation
    if (parsedData.teachers.length === 0) errors.push("교사 정보가 없습니다.");
    if (parsedData.classes.length === 0) errors.push("학급 정보가 없습니다.");
    if (parsedData.timetable.length === 0) errors.push("시간표 데이터가 없습니다.");

    // 2. Deep Validation
    const timetable = parsedData.timetable;

    // Check teacher duplicate bookings
    const teacherSchedule = {}; // key: teacher-day-period -> [class]
    // Check room duplicate bookings
    const roomSchedule = {}; // key: room-day-period -> [class]

    timetable.forEach(item => {
      // Check if teacher is valid
      const teacherExists = parsedData.teachers.some(t => t.name === item.teacher);
      if (item.teacher && item.teacher !== "공강" && !teacherExists) {
        warnings.push(`알 수 없는 교사: 시간표 내의 교사 [${item.teacher}]가 교사정보 시트에 존재하지 않습니다.`);
      }

      // Check if room is valid
      if (item.room) {
        const roomExists = parsedData.rooms.some(r => r.id === item.room || r.name === item.room);
        if (!roomExists) {
          warnings.push(`알 수 없는 교실 코드: 시간표 내의 교실 [${item.room}]이 교실정보 시트에 존재하지 않습니다.`);
        }
      }

      // Teacher duplicate check
      if (item.teacher && item.teacher !== "공강") {
        const key = `${item.teacher}-${item.day}-${item.period}`;
        if (!teacherSchedule[key]) {
          teacherSchedule[key] = [];
        }
        teacherSchedule[key].push(`${item.grade}-${item.classNum}`);
      }

      // Room duplicate check
      if (item.room) {
        const key = `${item.room}-${item.day}-${item.period}`;
        if (!roomSchedule[key]) {
          roomSchedule[key] = [];
        }
        roomSchedule[key].push(`${item.grade}-${item.classNum}`);
      }
    });

    // Extract teacher duplicates
    Object.keys(teacherSchedule).forEach(key => {
      const classes = teacherSchedule[key];
      if (classes.length > 1) {
        const [teacher, day, period] = key.split("-");
        const dayNames = ["", "월", "화", "수", "목", "금"];
        errors.push(`교사 동시 배정 오류: [${teacher}] 교사가 ${dayNames[day]}요일 ${period}교시에 ${classes.join(", ")}반 수업에 동시 예약되어 있습니다.`);
      }
    });

    // Extract room duplicates (only special rooms or non-homeroom)
    Object.keys(roomSchedule).forEach(key => {
      const classes = roomSchedule[key];
      if (classes.length > 1) {
        const [roomId, day, period] = key.split("-");
        const roomObj = parsedData.rooms.find(r => r.id === roomId);
        // Only trigger room collision for special rooms to avoid homeroom misconfiguration alarms
        if (roomObj && roomObj.type === "special") {
          const dayNames = ["", "월", "화", "수", "목", "금"];
          errors.push(`특별실 동시 사용 오류: [${roomObj.name}] 교실이 ${dayNames[day]}요일 ${period}교시에 ${classes.join(", ")}반 수업에 동시 사용되고 있습니다.`);
        }
      }
    });

    const isSuccess = errors.length === 0;

    setReport({
      status: isSuccess ? "success" : "invalid",
      errors,
      warnings,
      data: parsedData
    });
  };

  // Commit changes to global state
  const handleApplyData = () => {
    if (report && report.status === "success" && report.data) {
      updateData(report.data);
      alert("시간표 데이터가 데이터베이스에 반영되었습니다!");
      setReport(null);
      setFile(null);
    }
  };

  // Download a sample template excel sheet
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: 교사정보
    const s1Data = [
      { "교사ID": "T001", "교사명": "김국어", "교과": "국어", "학년": 1, "주당시수": 16 },
      { "교사ID": "T002", "교사명": "이수학", "교과": "수학", "학년": 1, "주당시수": 18 },
      { "교사ID": "T003", "교사명": "박영어", "교과": "영어", "학년": 1, "주당시수": 16 },
      { "교사ID": "T004", "교사명": "최과학", "교과": "과학", "학년": 1, "주당시수": 14 }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s1Data), "교사정보");

    // Sheet 2: 교실정보
    const s2Data = [
      { "교실ID": "R101", "교실명": "1학년 1반 교실", "유형": "classroom" },
      { "교실ID": "R102", "교실명": "1학년 2반 교실", "유형": "classroom" },
      { "교실ID": "R501", "교실명": "과학실1", "유형": "special" },
      { "교실ID": "R507", "교실명": "체육관", "유형": "special" }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s2Data), "교실정보");

    // Sheet 3: 학급정보
    const s3Data = [
      { "학급ID": "C101", "학년": 1, "반": 1, "교실ID": "R101" },
      { "학급ID": "C102", "학년": 1, "반": 2, "교실ID": "R102" }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s3Data), "학급정보");

    // Sheet 4: 시간표
    const s4Data = [
      { "학년": 1, "반": 1, "요일": "월", "교시": 1, "교과": "국어", "교사": "김국어", "교실": "R101" },
      { "학년": 1, "반": 1, "요일": "월", "교시": 2, "교과": "수학", "교사": "이수학", "교실": "R101" },
      { "학년": 1, "반": 1, "요일": "월", "교시": 3, "교과": "과학", "교사": "최과학", "교실": "R501" },
      { "학년": 1, "반": 2, "요일": "월", "교시": 1, "교과": "수학", "교사": "이수학", "교실": "R102" },
      { "학년": 1, "반": 2, "요일": "월", "교시": 2, "교과": "국어", "교사": "김국어", "교실": "R102" }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s4Data), "시간표");

    // Sheet 5: 교체금지 설정
    const s5Data = [
      { "구분": "특별실", "대상": "과학실1", "사유": "실험장비 셋팅 불가" },
      { "구분": "교사", "대상": "강체육", "사유": "외부 수업 병행" }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s5Data), "교체금지 설정");

    XLSX.writeFile(wb, "학교_시간표_일괄업로드_양식.xlsx");
  };

  return (
    <div className="fade-in">
      <div className="view-header">
        <div className="view-title">
          <h1>시간표 일괄 업로드</h1>
          <p>엑셀 파일(.xlsx)을 업로드하여 교사, 교실, 학급 정보 및 시간표를 일괄적으로 시스템에 등록합니다.</p>
        </div>
        <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
          <Download size={18} />
          <span>기본 양식 다운로드</span>
        </button>
      </div>

      <div className="layout-split">
        {/* Left Side: Upload zone */}
        <div>
          <div className="card">
            <div
              className={`upload-zone ${dragActive ? "glow-active" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload").click()}
            >
              <input
                id="file-upload"
                type="file"
                style={{ display: "none" }}
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              <Upload className="upload-icon" size={48} style={{ margin: "0 auto 16px" }} />
              <h3 style={{ marginBottom: "8px" }}>엑셀 파일 드래그 & 드롭</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                또는 여기를 클릭하여 컴퓨터에서 파일을 선택하세요.
              </p>
              {file && (
                <div style={{ marginTop: "16px", fontWeight: "600", color: "var(--primary)" }}>
                  선택된 파일: {file.name}
                </div>
              )}
            </div>
          </div>

          {report && report.status === "success" && (
            <div className="card" style={{ borderLeft: "4px solid var(--success)" }}>
              <div className="card-title text-success" style={{ marginBottom: "12px" }}>
                <CheckCircle2 />
                <span>검증 성공</span>
              </div>
              <p style={{ fontSize: "0.95rem", marginBottom: "16px" }}>
                시간표 엑셀 파일 내의 데이터 충돌을 실시간으로 분석한 결과, 오류가 없으며 업로드하기에 적합합니다. 
                아래 요약을 검토 후 적용해 주세요.
              </p>

              <div style={{ display: "flex", gap: "24px", marginBottom: "20px", background: "var(--bg-hover)", padding: "16px", borderRadius: "8px" }}>
                <div>교사: <strong>{report.data.teachers.length}명</strong></div>
                <div>교실: <strong>{report.data.rooms.length}개</strong></div>
                <div>학반: <strong>{report.data.classes.length}개 반</strong></div>
                <div>시간표 행: <strong>{report.data.timetable.length}개</strong></div>
              </div>

              {report.warnings.length > 0 && (
                <div style={{ marginBottom: "20px", color: "var(--warning)", background: "var(--warning-light)", padding: "12px", borderRadius: "6px", fontSize: "0.85rem" }}>
                  <strong>경고 사항 ({report.warnings.length}건):</strong>
                  <ul style={{ paddingLeft: "16px", marginTop: "4px" }}>
                    {report.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}

              <button className="btn btn-primary" onClick={handleApplyData}>
                데이터베이스 최종 반영하기
              </button>
            </div>
          )}

          {report && report.status === "invalid" && (
            <div className="card" style={{ borderLeft: "4px solid var(--danger)" }}>
              <div className="card-title text-danger" style={{ marginBottom: "12px" }}>
                <XCircle />
                <span>데이터 검증 실패</span>
              </div>
              <p style={{ fontSize: "0.95rem", marginBottom: "16px", color: "var(--danger)" }}>
                시간표 데이터에서 치명적인 오류가 발생했습니다. 해당 오류를 수정한 후 다시 업로드해 주세요.
              </p>
              
              <div style={{ color: "var(--danger)", background: "var(--danger-light)", padding: "16px", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "16px" }}>
                <strong>오류 내역 ({report.errors.length}건):</strong>
                <ul style={{ paddingLeft: "16px", marginTop: "6px" }}>
                  {report.errors.map((e, idx) => <li key={idx}>{e}</li>)}
                </ul>
              </div>

              {report.warnings.length > 0 && (
                <div style={{ color: "var(--warning)", background: "var(--warning-light)", padding: "12px", borderRadius: "6px", fontSize: "0.85rem" }}>
                  <strong>경고 내역 ({report.warnings.length}건):</strong>
                  <ul style={{ paddingLeft: "16px", marginTop: "4px" }}>
                    {report.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {report && report.status === "error" && (
            <div className="card" style={{ borderLeft: "4px solid var(--danger)" }}>
              <div className="card-title text-danger">
                <XCircle />
                <span>파일 로딩 실패</span>
              </div>
              <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{report.errors[0]}</p>
            </div>
          )}
        </div>

        {/* Right Side: Help card */}
        <div>
          <div className="card">
            <div className="card-title">
              <span>시간표 양식 규칙</span>
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <p style={{ marginBottom: "10px" }}>
                업로드하는 엑셀 파일은 우측 상단의 <strong>[기본 양식 다운로드]</strong> 버튼을 통해 제공되는 구조를 그대로 유지해야 합니다.
              </p>
              <ul style={{ paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>교사정보 시트:</strong> 교사ID, 교사명, 교과, 담당학년, 주당시수 필드가 필요합니다.</li>
                <li><strong>교실정보 시트:</strong> 교실ID, 교실명, 유형(classroom, special)이 포함되어야 합니다.</li>
                <li><strong>학급정보 시트:</strong> 학급ID, 학년, 반, 소속 교실ID가 지정되어야 합니다.</li>
                <li><strong>시간표 시트:</strong> 학년, 반, 요일(월/화/수/목/금), 교시(1~7), 교과, 교사, 수업교실 정보가 필수입니다.</li>
                <li><strong>교체금지 설정:</strong> 교체 시 경고나 차단할 특별실이나 교사를 지정합니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
