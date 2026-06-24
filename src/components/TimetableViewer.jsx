import React, { useState, useMemo } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function TimetableViewer({ data }) {
  const [tab, setTab] = useState("class"); // class, teacher, room, period
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [selectedClass, setSelectedClass] = useState(1);
  const [selectedTeacher, setSelectedTeacher] = useState(data.teachers[0]?.name || "");
  const [selectedRoom, setSelectedRoom] = useState(data.rooms[0]?.id || "");
  const [selectedDay, setSelectedDay] = useState(1); // 1=월, 2=화, 3=수, 4=목, 5=금
  const [selectedPeriod, setSelectedPeriod] = useState(1); // 1~7교시

  const DAYS = ["월", "화", "수", "목", "금"];
  const PERIODS = [1, 2, 3, 4, 5, 6, 7];

  // Unique list of grades and classes available in data
  const grades = useMemo(() => {
    const list = new Set(data.classes.map(c => c.grade));
    return Array.from(list).sort();
  }, [data]);

  const classesInGrade = useMemo(() => {
    return data.classes
      .filter(c => c.grade === Number(selectedGrade))
      .map(c => c.classNum)
      .sort((a, b) => a - b);
  }, [data, selectedGrade]);

  // If selected class isn't in current classesInGrade, reset it
  React.useEffect(() => {
    if (classesInGrade.length > 0 && !classesInGrade.includes(selectedClass)) {
      setSelectedClass(classesInGrade[0]);
    }
  }, [classesInGrade, selectedClass]);

  // Compute the 5x7 matrix based on selection
  const gridData = useMemo(() => {
    const matrix = Array(7).fill(null).map(() => Array(5).fill(null));

    data.timetable.forEach(item => {
      let match = false;
      let displaySubject = item.subject;
      let displaySubInfo = "";

      if (tab === "class") {
        if (item.grade === Number(selectedGrade) && item.classNum === Number(selectedClass)) {
          match = true;
          displaySubInfo = item.teacher;
        }
      } else if (tab === "teacher") {
        if (item.teacher === selectedTeacher) {
          match = true;
          displaySubInfo = `${item.grade}-${item.classNum}`;
        }
      } else if (tab === "room") {
        if (item.room === selectedRoom) {
          match = true;
          displaySubInfo = `${item.grade}-${item.classNum} (${item.teacher})`;
        }
      }

      if (match) {
        const dIdx = item.day - 1;
        const pIdx = item.period - 1;
        if (dIdx >= 0 && dIdx < 5 && pIdx >= 0 && pIdx < 7) {
          matrix[pIdx][dIdx] = {
            subject: displaySubject,
            info: displaySubInfo,
            room: item.room,
            teacher: item.teacher,
            grade: item.grade,
            classNum: item.classNum
          };
        }
      }
    });

    return matrix;
  }, [data, tab, selectedGrade, selectedClass, selectedTeacher, selectedRoom]);

  // Compute data for period view (list of all classes on a day/period)
  const periodData = useMemo(() => {
    if (tab !== "period") return [];
    
    return data.classes.map(cls => {
      const lesson = data.timetable.find(
        t => t.grade === cls.grade && 
             t.classNum === cls.classNum && 
             t.day === Number(selectedDay) && 
             t.period === Number(selectedPeriod)
      );

      const roomObj = data.rooms.find(r => r.id === (lesson?.room || cls.room));

      return {
        className: `${cls.grade}학년 ${cls.classNum}반`,
        subject: lesson?.subject || "공강",
        teacher: lesson?.teacher || "-",
        roomName: roomObj ? roomObj.name : (lesson?.room || "-")
      };
    });
  }, [data, tab, selectedDay, selectedPeriod]);

  // Export functions
  const handleExportExcel = () => {
    let sheetName = "";
    let rows = [];

    if (tab === "class") {
      sheetName = `${selectedGrade}학년_${selectedClass}반_시간표`;
      rows.push(["교시", "월요일", "화요일", "수요일", "목요일", "금요일"]);
      PERIODS.forEach(p => {
        const row = [`${p}교시`];
        DAYS.forEach((d, dIdx) => {
          const cell = gridData[p - 1][dIdx];
          row.push(cell ? `${cell.subject}\n(${cell.info})` : "");
        });
        rows.push(row);
      });
    } else if (tab === "teacher") {
      sheetName = `${selectedTeacher}_교사_시간표`;
      rows.push(["교시", "월요일", "화요일", "수요일", "목요일", "금요일"]);
      PERIODS.forEach(p => {
        const row = [`${p}교시`];
        DAYS.forEach((d, dIdx) => {
          const cell = gridData[p - 1][dIdx];
          row.push(cell ? `${cell.subject}\n(${cell.info})` : "");
        });
        rows.push(row);
      });
    } else if (tab === "room") {
      const rObj = data.rooms.find(r => r.id === selectedRoom);
      sheetName = `${rObj ? rObj.name : selectedRoom}_시간표`;
      rows.push(["교시", "월요일", "화요일", "수요일", "목요일", "금요일"]);
      PERIODS.forEach(p => {
        const row = [`${p}교시`];
        DAYS.forEach((d, dIdx) => {
          const cell = gridData[p - 1][dIdx];
          row.push(cell ? `${cell.subject}\n(${cell.info})` : "");
        });
        rows.push(row);
      });
    } else {
      sheetName = `${selectedDay}요일_${selectedPeriod}교시_시간표`;
      rows.push(["학급", "과목", "담당교사", "수업교실"]);
      periodData.forEach(row => {
        rows.push([row.className, row.subject, row.teacher, row.roomName]);
      });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 30));
    XLSX.writeFile(wb, `${sheetName}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    // Configure korean font support
    // Set font to standard doc fonts (might default to Helvetica, but we specify metadata)
    doc.setFont("helvetica");

    let title = "";
    let headers = [["Period", "Mon", "Tue", "Wed", "Thu", "Fri"]];
    let body = [];

    if (tab === "class") {
      title = `${selectedGrade}-${selectedClass} Timetable`;
      PERIODS.forEach(p => {
        const row = [`Period ${p}`];
        DAYS.forEach((d, dIdx) => {
          const cell = gridData[p - 1][dIdx];
          row.push(cell ? `${cell.subject} (${cell.info})` : "-");
        });
        body.push(row);
      });
    } else if (tab === "teacher") {
      title = `Teacher ${selectedTeacher} Timetable`;
      PERIODS.forEach(p => {
        const row = [`Period ${p}`];
        DAYS.forEach((d, dIdx) => {
          const cell = gridData[p - 1][dIdx];
          row.push(cell ? `${cell.subject} (${cell.info})` : "-");
        });
        body.push(row);
      });
    } else if (tab === "room") {
      const rObj = data.rooms.find(r => r.id === selectedRoom);
      title = `Room ${rObj ? rObj.name : selectedRoom} Timetable`;
      PERIODS.forEach(p => {
        const row = [`Period ${p}`];
        DAYS.forEach((d, dIdx) => {
          const cell = gridData[p - 1][dIdx];
          row.push(cell ? `${cell.subject} (${cell.info})` : "-");
        });
        body.push(row);
      });
    } else {
      const daysEng = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      title = `${daysEng[selectedDay]} - Period ${selectedPeriod} Timetable`;
      headers = [["Class", "Subject", "Teacher", "Room"]];
      periodData.forEach(row => {
        body.push([row.className, row.subject, row.teacher, row.roomName]);
      });
    }

    doc.text(title, 14, 15);
    doc.autoTable({
      startY: 20,
      head: headers,
      body: body,
      theme: "striped",
      styles: { cellPadding: 5, fontSize: 10 }
    });

    doc.save(`${title.replace(/ /g, "_")}.pdf`);
  };

  return (
    <div className="fade-in">
      <div className="view-header">
        <div className="view-title">
          <h1>통합 시간표 조회</h1>
          <p>학급, 교사, 교실, 교시별로 학교의 실시간 시간표를 통합 조회하고 출력할 수 있습니다.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={18} />
            <span>Excel 다운로드</span>
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <FileText size={18} />
            <span>PDF 다운로드</span>
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${tab === "class" ? "active" : ""}`} onClick={() => setTab("class")}>학급별 조회</button>
        <button className={`tab-btn ${tab === "teacher" ? "active" : ""}`} onClick={() => setTab("teacher")}>교사별 조회</button>
        <button className={`tab-btn ${tab === "room" ? "active" : ""}`} onClick={() => setTab("room")}>교실/특별실별 조회</button>
        <button className={`tab-btn ${tab === "period" ? "active" : ""}`} onClick={() => setTab("period")}>교시별 전체 조회</button>
      </div>

      <div className="card">
        {/* Filters bar */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
          {tab === "class" && (
            <>
              <div>
                <label className="form-label">학년 선택</label>
                <select className="form-control" style={{ width: "120px" }} value={selectedGrade} onChange={e => setSelectedGrade(Number(e.target.value))}>
                  {grades.map(g => <option key={g} value={g}>{g}학년</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">학반 선택</label>
                <select className="form-control" style={{ width: "120px" }} value={selectedClass} onChange={e => setSelectedClass(Number(e.target.value))}>
                  {classesInGrade.map(c => <option key={c} value={c}>{c}반</option>)}
                </select>
              </div>
            </>
          )}

          {tab === "teacher" && (
            <div>
              <label className="form-label">교사 선택</label>
              <select className="form-control" style={{ width: "200px" }} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
                {data.teachers.map(t => <option key={t.id} value={t.name}>{t.name} ({t.subject})</option>)}
              </select>
            </div>
          )}

          {tab === "room" && (
            <div>
              <label className="form-label">교실/특별실 선택</label>
              <select className="form-control" style={{ width: "220px" }} value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
                {data.rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.type === "special" ? "(특별실)" : "(일반학급)"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tab === "period" && (
            <>
              <div>
                <label className="form-label">요일 선택</label>
                <select className="form-control" style={{ width: "120px" }} value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))}>
                  <option value={1}>월요일</option>
                  <option value={2}>화요일</option>
                  <option value={3}>수요일</option>
                  <option value={4}>목요일</option>
                  <option value={5}>금요일</option>
                </select>
              </div>
              <div>
                <label className="form-label">교시 선택</label>
                <select className="form-control" style={{ width: "120px" }} value={selectedPeriod} onChange={e => setSelectedPeriod(Number(e.target.value))}>
                  {PERIODS.map(p => <option key={p} value={p}>{p}교시</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Timetable view content */}
        {tab !== "period" ? (
          <div className="timetable-container">
            <table className="timetable-grid">
              <thead>
                <tr>
                  <th>교시</th>
                  <th>월</th>
                  <th>화</th>
                  <th>수</th>
                  <th>목</th>
                  <th>금</th>
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(p => (
                  <tr key={p}>
                    <td style={{ fontWeight: 600, backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)" }}>
                      {p}교시
                    </td>
                    {DAYS.map((d, dIdx) => {
                      const cell = gridData[p - 1][dIdx];
                      return (
                        <td key={dIdx}>
                          {cell ? (
                            <div className="timetable-cell active-lesson">
                              <span className="cell-subject">{cell.subject}</span>
                              <span className="cell-sub-info">
                                <span>{cell.info}</span>
                                {tab !== "room" && <span className="cell-room">{data.rooms.find(r => r.id === cell.room)?.name.replace(" 교실", "") || cell.room}</span>}
                              </span>
                            </div>
                          ) : (
                            <div className="timetable-cell" style={{ opacity: 0.3 }}>
                              <span className="cell-subject" style={{ fontWeight: 400 }}>공강</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>학급</th>
                  <th>수업 과목</th>
                  <th>담당 교사</th>
                  <th>진행 교실</th>
                </tr>
              </thead>
              <tbody>
                {periodData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{row.className}</td>
                    <td>
                      <span className={`badge ${row.subject === "공강" ? "badge-secondary" : "badge-primary"}`}>
                        {row.subject}
                      </span>
                    </td>
                    <td>{row.teacher}</td>
                    <td>{row.roomName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
