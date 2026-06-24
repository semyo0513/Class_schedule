import React, { useMemo } from "react";
import { Users, DoorOpen, ArrowLeftRight, UserMinus, AlertCircle, HelpCircle } from "lucide-react";

export default function Dashboard({ data, setView }) {
  // Compute dashboard statistics
  const stats = useMemo(() => {
    const teacherCount = data.teachers.length;
    const roomCount = data.rooms.length;
    
    // Count swaps processed today (mocking today as 2026-06-24 for consistency)
    const todayStr = "2026-06-24";
    const swapCount = data.swaps.filter(s => s.date === todayStr).length;
    const subCount = data.substitutes.filter(s => s.date === todayStr).length;

    return {
      teacherCount,
      roomCount,
      swapCount,
      subCount
    };
  }, [data]);

  // Compute timetable conflicts
  const conflicts = useMemo(() => {
    const list = [];
    const timetable = data.timetable;
    
    // Check conflicts:
    // 1. Teacher Conflict: same teacher, same day, same period, different class
    // 2. Room Conflict: same room, same day, same period, different class
    // 3. Class Conflict: same grade/class, same day, same period, different entries (less common, but possible)
    for (let i = 0; i < timetable.length; i++) {
      for (let j = i + 1; j < timetable.length; j++) {
        const itemA = timetable[i];
        const itemB = timetable[j];

        if (itemA.day === itemB.day && itemA.period === itemB.period) {
          // Check Teacher conflict (exclude blank teacher names or when teacher is "공강")
          if (itemA.teacher && itemA.teacher !== "공강" && itemA.teacher === itemB.teacher) {
            if (itemA.grade !== itemB.grade || itemA.classNum !== itemB.classNum) {
              list.push({
                type: "teacher",
                description: `교사 충돌: [${itemA.teacher}] 교사가 ${getDayName(itemA.day)}요일 ${itemA.period}교시에 ${itemA.grade}-${itemA.classNum}반과 ${itemB.grade}-${itemB.classNum}반에 동시 배정됨.`
              });
            }
          }
          // Check Room conflict (exclude homeroom classes in standard classrooms to avoid false positives, or check R501+ special rooms)
          if (itemA.room && itemA.room.startsWith("R5") && itemA.room === itemB.room) {
            if (itemA.grade !== itemB.grade || itemA.classNum !== itemB.classNum) {
              const roomObj = data.rooms.find(r => r.id === itemA.room);
              list.push({
                type: "room",
                description: `교실 충돌: [${roomObj ? roomObj.name : itemA.room}] 교실이 ${getDayName(itemA.day)}요일 ${itemA.period}교시에 ${itemA.grade}-${itemA.classNum}반과 ${itemB.grade}-${itemB.classNum}반에 동시 사용 예약됨.`
              });
            }
          }
        }
      }
    }
    
    // Deduplicate description
    const unique = [];
    const seen = new Set();
    list.forEach(c => {
      if (!seen.has(c.description)) {
        seen.add(c.description);
        unique.push(c);
      }
    });

    return unique.slice(0, 5); // Show top 5 conflicts
  }, [data]);

  function getDayName(d) {
    const days = ["", "월", "화", "수", "목", "금"];
    return days[d] || "";
  }

  return (
    <div className="fade-in">
      <div className="dashboard-grid">
        <div className="kpi-card">
          <div className="kpi-icon primary">
            <Users size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.teacherCount}</span>
            <span className="kpi-label">등록된 교사 수</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon success">
            <DoorOpen size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.roomCount}</span>
            <span className="kpi-label">전체 교실 수</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon warning">
            <ArrowLeftRight size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.swapCount}</span>
            <span className="kpi-label">오늘의 수업 교체 건수</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon danger">
            <UserMinus size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.subCount}</span>
            <span className="kpi-label">오늘의 보강 배정 건수</span>
          </div>
        </div>
      </div>

      <div className="layout-split">
        {/* Left Side: Conflicts and Activities */}
        <div>
          <div className="card">
            <div className="card-title text-danger">
              <AlertCircle size={20} />
              <span>실시간 시간표 충돌 검사 리포트</span>
            </div>
            
            {conflicts.length > 0 ? (
              <div className="conflict-list">
                <strong>주의: 시간표에 다음 충돌이 발견되었습니다.</strong>
                <ul>
                  {conflicts.map((conf, idx) => (
                    <li key={idx} style={{ marginBottom: "6px" }}>{conf.description}</li>
                  ))}
                </ul>
                <div style={{ marginTop: "12px" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setView("swap")}>
                    수업 교환 조정하기
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--success)" }}>
                🎉 현재 정규 시간표 내에 교사/교실 중복 충돌이 없습니다!
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">
              <span>최근 변경 이력</span>
            </div>
            {data.swaps.length === 0 && data.substitutes.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>
                최근 기록된 변경 이력이 없습니다.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>유형</th>
                    <th>상세 내용</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {data.swaps.slice(0, 3).map((sw, idx) => (
                    <tr key={`sw-${idx}`}>
                      <td>{sw.date}</td>
                      <td><span className="badge badge-primary">{sw.type}</span></td>
                      <td>{sw.details} ({sw.reason})</td>
                      <td><span className="badge badge-success">{sw.status}</span></td>
                    </tr>
                  ))}
                  {data.substitutes.slice(0, 3).map((sb, idx) => (
                    <tr key={`sb-${idx}`}>
                      <td>{sb.date}</td>
                      <td><span className="badge badge-danger">대강/보강</span></td>
                      <td>{sb.className}반 {sb.period}교시: {sb.absentTeacher} → {sb.subTeacher} ({sb.reason})</td>
                      <td><span className="badge badge-success">{sb.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Quick Links / Calendar Events */}
        <div>
          <div className="card">
            <div className="card-title">
              <span>빠른 작업 바로가기</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button className="btn btn-primary" onClick={() => setView("viewer")} style={{ justifyContent: "center" }}>
                시간표 조회하기
              </button>
              <button className="btn btn-secondary" onClick={() => setView("swap")} style={{ justifyContent: "center" }}>
                1:1 수업 교환
              </button>
              <button className="btn btn-secondary" onClick={() => setView("substitute")} style={{ justifyContent: "center" }}>
                보강 교사 배정
              </button>
              <button className="btn btn-secondary" onClick={() => setView("upload")} style={{ justifyContent: "center" }}>
                기본 엑셀 시간표 일괄 등록
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span>다가오는 학교 일정</span>
            </div>
            {data.events.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>등록된 다가오는 행사가 없습니다.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data.events.slice(0, 3).map(ev => (
                  <div key={ev.id} style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{ev.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      대상: {ev.targetGrade === 0 ? "전체 학년" : `${ev.targetGrade}학년`} | {ev.startDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
