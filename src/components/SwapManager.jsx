import React, { useState, useMemo } from "react";
import { ArrowLeftRight, HelpCircle, AlertCircle, CheckCircle } from "lucide-react";

export default function SwapManager({ data, updateTableAndLogSwap }) {
  // Selection states for Lesson A
  const [gradeA, setGradeA] = useState(1);
  const [classA, setClassA] = useState(1);
  const [dayA, setDayA] = useState(1); // 1=월, 2=화, 3=수, 4=목, 5=금
  const [periodA, setPeriodA] = useState(1);

  // Selection states for Lesson B
  const [gradeB, setGradeB] = useState(1);
  const [classB, setClassB] = useState(1);
  const [dayB, setDayB] = useState(1);
  const [periodB, setPeriodB] = useState(2);

  const [reason, setReason] = useState("");

  const DAYS = ["월", "화", "수", "목", "금"];
  const PERIODS = [1, 2, 3, 4, 5, 6, 7];

  // Helper to fetch unique grades and classes
  const grades = useMemo(() => {
    const list = new Set(data.classes.map(c => c.grade));
    return Array.from(list).sort();
  }, [data]);

  const classesInGradeA = useMemo(() => {
    return data.classes.filter(c => c.grade === Number(gradeA)).map(c => c.classNum).sort((a,b)=>a-b);
  }, [data, gradeA]);

  const classesInGradeB = useMemo(() => {
    return data.classes.filter(c => c.grade === Number(gradeB)).map(c => c.classNum).sort((a,b)=>a-b);
  }, [data, gradeB]);

  // Adjust defaults if grades change
  React.useEffect(() => {
    if (classesInGradeA.length > 0 && !classesInGradeA.includes(classA)) setClassA(classesInGradeA[0]);
  }, [classesInGradeA, classA]);

  React.useEffect(() => {
    if (classesInGradeB.length > 0 && !classesInGradeB.includes(classB)) setClassB(classesInGradeB[0]);
  }, [classesInGradeB, classB]);

  // Fetch target lessons from state
  const lessonA = useMemo(() => {
    return data.timetable.find(
      t => t.grade === Number(gradeA) && t.classNum === Number(classA) && t.day === Number(dayA) && t.period === Number(periodA)
    ) || { grade: Number(gradeA), classNum: Number(classA), day: Number(dayA), period: Number(periodA), subject: "공강", teacher: "", room: "" };
  }, [data, gradeA, classA, dayA, periodA]);

  const lessonB = useMemo(() => {
    return data.timetable.find(
      t => t.grade === Number(gradeB) && t.classNum === Number(classB) && t.day === Number(dayB) && t.period === Number(periodB)
    ) || { grade: Number(gradeB), classNum: Number(classB), day: Number(dayB), period: Number(periodB), subject: "공강", teacher: "", room: "" };
  }, [data, gradeB, classB, dayB, periodB]);

  // Check conflicts if A and B swap
  // We swap:
  // - Lesson A (Subject A, Teacher A, Room A) goes to Day B, Period B.
  // - Lesson B (Subject B, Teacher B, Room B) goes to Day A, Period A.
  const simulation = useMemo(() => {
    const alerts = [];
    
    // Check if both selections are the exact same slot
    if (gradeA === gradeB && classA === classB && dayA === dayB && periodA === periodB) {
      alerts.push("동일한 시간표 칸을 서로 교환할 수 없습니다.");
      return { alerts, canSwap: false };
    }

    // Swapping Class A to B's slot, and Class B to A's slot
    // If we swap, we must check:
    // 1. Teacher A's schedule: Teacher A is now teaching in slot B (dayB, periodB).
    //    Does Teacher A already have a class in dayB, periodB (excluding Class A's own slot, and Class B's slot)?
    if (lessonA.teacher && lessonA.teacher !== "공강") {
      const conflictA = data.timetable.find(
        t => t.teacher === lessonA.teacher &&
             t.day === Number(dayB) &&
             t.period === Number(periodB) &&
             !(t.grade === Number(gradeA) && t.classNum === Number(classA)) && // not himself
             !(t.grade === Number(gradeB) && t.classNum === Number(classB)) // not the one we swap with
      );
      if (conflictA) {
        alerts.push(`교사 충돌: [${lessonA.teacher}] 교사가 교환 시간대(${getDayName(dayB)}요일 ${periodB}교시)에 ${conflictA.grade}-${conflictA.classNum}반 수업이 있어 교환 불가합니다.`);
      }
    }

    // 2. Teacher B's schedule: Teacher B is now teaching in slot A (dayA, periodA).
    if (lessonB.teacher && lessonB.teacher !== "공강") {
      const conflictB = data.timetable.find(
        t => t.teacher === lessonB.teacher &&
             t.day === Number(dayA) &&
             t.period === Number(periodA) &&
             !(t.grade === Number(gradeB) && t.classNum === Number(classB)) &&
             !(t.grade === Number(gradeA) && t.classNum === Number(classA))
      );
      if (conflictB) {
        alerts.push(`교사 충돌: [${lessonB.teacher}] 교사가 교환 시간대(${getDayName(dayA)}요일 ${periodA}교시)에 ${conflictB.grade}-${conflictB.classNum}반 수업이 있어 교환 불가합니다.`);
      }
    }

    // 3. Room A's availability: Room A is now used in slot B.
    //    Is Room A used in dayB, periodB by another class?
    if (lessonA.room && lessonA.room.startsWith("R5")) { // Check special rooms only
      const roomConflictA = data.timetable.find(
        t => t.room === lessonA.room &&
             t.day === Number(dayB) &&
             t.period === Number(periodB) &&
             !(t.grade === Number(gradeA) && t.classNum === Number(classA)) &&
             !(t.grade === Number(gradeB) && t.classNum === Number(classB))
      );
      if (roomConflictA) {
        const rName = data.rooms.find(r => r.id === lessonA.room)?.name || lessonA.room;
        alerts.push(`교실 충돌: 특별실 [${rName}]이 교환 시간대(${getDayName(dayB)}요일 ${periodB}교시)에 ${roomConflictA.grade}-${roomConflictA.classNum}반 수업으로 사용 중입니다.`);
      }
    }

    // 4. Room B's availability: Room B is now used in slot A.
    if (lessonB.room && lessonB.room.startsWith("R5")) {
      const roomConflictB = data.timetable.find(
        t => t.room === lessonB.room &&
             t.day === Number(dayA) &&
             t.period === Number(periodA) &&
             !(t.grade === Number(gradeB) && t.classNum === Number(classB)) &&
             !(t.grade === Number(gradeA) && t.classNum === Number(classA))
      );
      if (roomConflictB) {
        const rName = data.rooms.find(r => r.id === lessonB.room)?.name || lessonB.room;
        alerts.push(`교실 충돌: 특별실 [${rName}]이 교환 시간대(${getDayName(dayA)}요일 ${periodA}교시)에 ${roomConflictB.grade}-${roomConflictB.classNum}반 수업으로 사용 중입니다.`);
      }
    }

    // 5. Restrict swaps checking (교체금지 설정)
    const restrictions = data.restrictions || [];
    restrictions.forEach(res => {
      if (res.rule === "prevent") {
        if (res.type === "teacher" && (lessonA.teacher === res.target || lessonB.teacher === res.target)) {
          alerts.push(`교체 금지 규정: 교사 [${res.target}]의 수업은 상호 교환이 금지되어 있습니다. 사유: ${res.reason}`);
        }
        if (res.type === "room" && (lessonA.room === res.target || lessonB.room === res.target)) {
          const rName = data.rooms.find(r => r.id === res.target)?.name || res.target;
          alerts.push(`교체 금지 규정: 특별실 [${rName}]의 수업은 자동 교환이 금지되어 있습니다. 사유: ${res.reason}`);
        }
      }
    });

    return {
      alerts,
      canSwap: alerts.length === 0
    };
  }, [data, gradeA, classA, dayA, periodA, gradeB, classB, dayB, periodB, lessonA, lessonB]);

  function getDayName(d) {
    const days = ["", "월", "화", "수", "목", "금"];
    return days[d] || "";
  }

  const handleExecuteSwap = () => {
    if (!simulation.canSwap) return;
    if (!reason.trim()) {
      alert("수업 교체 사유를 입력해 주세요.");
      return;
    }

    // Proceed to trigger parent state update
    const details = `${gradeA}-${classA}반 ${getDayName(dayA)}요일 ${periodA}교시(${lessonA.subject}) ↔ ${gradeB}-${classB}반 ${getDayName(dayB)}요일 ${periodB}교시(${lessonB.subject})`;
    
    updateTableAndLogSwap(
      {
        gradeA, classA, dayA, periodA,
        gradeB, classB, dayB, periodB,
        lessonA, lessonB
      },
      reason,
      details
    );

    alert("시간표가 성공적으로 교체되었으며 변경 로그가 기록되었습니다.");
    // Clear reason
    setReason("");
  };

  return (
    <div className="fade-in">
      <div className="view-header">
        <div className="view-title">
          <h1>1:1 수업 상호 교환</h1>
          <p>두 수업의 일정을 맞바꾸며, 교사 동시 배정 및 특별실 중복 배정 여부를 실시간으로 자동 검증합니다.</p>
        </div>
      </div>

      <div className="layout-split">
        {/* Left Side: Selectors */}
        <div>
          <div className="card">
            <div className="card-title">
              <ArrowLeftRight size={20} />
              <span>수업 선택 및 교환 설정</span>
            </div>

            <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
              {/* Selector A */}
              <div style={{ background: "var(--bg-hover)", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>대상 수업 A</span>
                  <span className="badge badge-primary">{gradeA}학년 {classA}반</span>
                </h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">학년/학반</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select className="form-control" value={gradeA} onChange={e => setGradeA(Number(e.target.value))}>
                        {grades.map(g => <option key={g} value={g}>{g}학년</option>)}
                      </select>
                      <select className="form-control" value={classA} onChange={e => setClassA(Number(e.target.value))}>
                        {classesInGradeA.map(c => <option key={c} value={c}>{c}반</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">요일/교시</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select className="form-control" value={dayA} onChange={e => setDayA(Number(e.target.value))}>
                        <option value={1}>월요일</option>
                        <option value={2}>화요일</option>
                        <option value={3}>수요일</option>
                        <option value={4}>목요일</option>
                        <option value={5}>금요일</option>
                      </select>
                      <select className="form-control" value={periodA} onChange={e => setPeriodA(Number(e.target.value))}>
                        {PERIODS.map(p => <option key={p} value={p}>{p}교시</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div style={{ background: "var(--bg-card)", padding: "10px", borderRadius: "4px", marginTop: "8px", fontSize: "0.85rem" }}>
                  현재 과목: <strong>{lessonA.subject}</strong> | 담당: {lessonA.teacher || "-"} | 교실: {data.rooms.find(r => r.id === lessonA.room)?.name || lessonA.room || "-"}
                </div>
              </div>

              {/* Selector B */}
              <div style={{ background: "var(--bg-hover)", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>대상 수업 B</span>
                  <span className="badge badge-primary">{gradeB}학년 {classB}반</span>
                </h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">학년/학반</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select className="form-control" value={gradeB} onChange={e => setGradeB(Number(e.target.value))}>
                        {grades.map(g => <option key={g} value={g}>{g}학년</option>)}
                      </select>
                      <select className="form-control" value={classB} onChange={e => setClassB(Number(e.target.value))}>
                        {classesInGradeB.map(c => <option key={c} value={c}>{c}반</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">요일/교시</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select className="form-control" value={dayB} onChange={e => setDayB(Number(e.target.value))}>
                        <option value={1}>월요일</option>
                        <option value={2}>화요일</option>
                        <option value={3}>수요일</option>
                        <option value={4}>목요일</option>
                        <option value={5}>금요일</option>
                      </select>
                      <select className="form-control" value={periodB} onChange={e => setPeriodB(Number(e.target.value))}>
                        {PERIODS.map(p => <option key={p} value={p}>{p}교시</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div style={{ background: "var(--bg-card)", padding: "10px", borderRadius: "4px", marginTop: "8px", fontSize: "0.85rem" }}>
                  현재 과목: <strong>{lessonB.subject}</strong> | 담당: {lessonB.teacher || "-"} | 교실: {data.rooms.find(r => r.id === lessonB.room)?.name || lessonB.room || "-"}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "20px" }}>
              <label className="form-label">교환 사유 입력 (필수)</label>
              <input
                type="text"
                className="form-control"
                placeholder="예) 국어 교사 개인 연가, 외부 체험 프로그램 연계 등"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Simulation Preview & Execution */}
        <div>
          <div className="card">
            <div className="card-title">
              <span>교환 전/후 시뮬레이션</span>
            </div>

            <div className="swap-comparison">
              <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>[변경 전]</div>
              <div className="swap-comparison-row">
                <div>A: {gradeA}-{classA}반 ({getDayName(dayA)}요일 {periodA}교시)</div>
                <div style={{ fontWeight: 600 }}>{lessonA.subject} ({lessonA.teacher})</div>
              </div>
              <div className="swap-comparison-row">
                <div>B: {gradeB}-{classB}반 ({getDayName(dayB)}요일 {periodB}교시)</div>
                <div style={{ fontWeight: 600 }}>{lessonB.subject} ({lessonB.teacher})</div>
              </div>

              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginTop: "12px" }}>[교환 후 미리보기]</div>
              <div className="swap-comparison-row success">
                <div>A: {gradeA}-{classA}반 ({getDayName(dayA)}요일 {periodA}교시)</div>
                <div style={{ fontWeight: 600 }}>{lessonB.subject} ({lessonB.teacher})</div>
              </div>
              <div className="swap-comparison-row success">
                <div>B: {gradeB}-{classB}반 ({getDayName(dayB)}요일 {periodB}교시)</div>
                <div style={{ fontWeight: 600 }}>{lessonA.subject} ({lessonA.teacher})</div>
              </div>
            </div>

            {/* Validation Banner */}
            <div style={{ marginTop: "24px" }}>
              {simulation.alerts.length > 0 ? (
                <div className="conflict-list" style={{ margin: 0 }}>
                  <div style={{ fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <AlertCircle size={18} />
                    <span>교환 불가 (충돌 {simulation.alerts.length}건)</span>
                  </div>
                  <ul style={{ paddingLeft: "16px" }}>
                    {simulation.alerts.map((al, idx) => <li key={idx}>{al}</li>)}
                  </ul>
                </div>
              ) : (
                <div style={{ background: "var(--success-light)", color: "var(--success)", border: "1px solid var(--success)", padding: "16px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <CheckCircle size={24} />
                  <div>
                    <div style={{ fontWeight: "700" }}>교환 가능</div>
                    <div style={{ fontSize: "0.8rem", marginTop: "2px" }}>시간표 충돌이 검출되지 않았습니다.</div>
                  </div>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "20px", justifyContent: "center" }}
              disabled={!simulation.canSwap || !reason.trim()}
              onClick={handleExecuteSwap}
            >
              수업 교환 승인 및 확정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
