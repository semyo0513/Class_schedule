import React, { useState, useMemo } from "react";
import { UserMinus, Check, Search, AlertCircle } from "lucide-react";

export default function SubstituteManager({ data, addSubstituteAssignment }) {
  const [absentTeacherId, setAbsentTeacherId] = useState(data.teachers[0]?.id || "");
  const [date, setDate] = useState("2026-06-25"); // Next day by default
  const [period, setPeriod] = useState(1);
  const [reason, setReason] = useState("");
  const [selectedSubTeacher, setSelectedSubTeacher] = useState(null);

  const PERIODS = [1, 2, 3, 4, 5, 6, 7];

  // Resolve absent teacher object
  const absentTeacher = useMemo(() => {
    return data.teachers.find(t => t.id === absentTeacherId);
  }, [data, absentTeacherId]);

  // Resolve day of week index from date string (e.g., 2026-06-25 -> day index 1-5)
  const dayIndex = useMemo(() => {
    if (!date) return 1;
    const d = new Date(date);
    const day = d.getDay(); // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
    if (day === 0 || day === 6) return 1; // Fallback to Monday
    return day;
  }, [date]);

  // Find what class/subject the absent teacher was supposed to teach
  const affectedClass = useMemo(() => {
    if (!absentTeacher) return null;
    return data.timetable.find(
      t => t.teacher === absentTeacher.name && t.day === dayIndex && t.period === Number(period)
    );
  }, [data, absentTeacher, dayIndex, period]);

  // Recommend candidates
  const recommendations = useMemo(() => {
    if (!absentTeacher) return [];

    const candidates = [];

    data.teachers.forEach(teacher => {
      // Exclude the absent teacher himself
      if (teacher.id === absentTeacher.id) return;

      // 1. Check availability: Is this teacher free (공강) during dayIndex, period?
      // He is free if there is NO entry in the timetable for him on this day and period.
      const isTeaching = data.timetable.some(
        t => t.teacher === teacher.name && t.day === dayIndex && t.period === Number(period)
      );

      // Also check if he is already assigned as a substitute in this slot
      const isAlreadySub = data.substitutes.some(
        s => s.subTeacher === teacher.name && s.date === date && s.period === Number(period)
      );

      if (isTeaching || isAlreadySub) {
        return; // NOT free, cannot recommend
      }

      // Calculate score criteria
      let score = 0;
      const badges = [];

      // Criteria A: Same subject (+50 pts)
      if (teacher.subject === absentTeacher.subject) {
        score += 50;
        badges.push("동일 교과");
      }

      // Criteria B: Same grade (+25 pts)
      if (teacher.grade === absentTeacher.grade) {
        score += 25;
        badges.push("동일 학년");
      }

      // Criteria C: Substitute load balance (-10 pts per duty already assigned)
      // Count total substitute assignments for this teacher in the logs
      const subDuties = data.substitutes.filter(s => s.subTeacher === teacher.name).length;
      score -= subDuties * 10;
      badges.push(`주간대강 ${subDuties}회`);

      candidates.push({
        teacher,
        score,
        badges,
        duties: subDuties
      });
    });

    // Sort by score descending
    return candidates.sort((a, b) => b.score - a.score);
  }, [data, absentTeacher, dayIndex, period, date]);

  // Automatically select the top candidate if recommendations change
  React.useEffect(() => {
    if (recommendations.length > 0) {
      setSelectedSubTeacher(recommendations[0].teacher.name);
    } else {
      setSelectedSubTeacher(null);
    }
  }, [recommendations]);

  const handleAssignSubstitute = () => {
    if (!selectedSubTeacher) {
      alert("보강을 배정할 교사를 선택해 주세요.");
      return;
    }
    if (!reason.trim()) {
      alert("부재/보강 사유를 입력해 주세요.");
      return;
    }

    const className = affectedClass ? `${affectedClass.grade}-${affectedClass.classNum}` : "공강";
    const subject = affectedClass ? `${affectedClass.subject} (보강)` : "자율 (보강)";

    addSubstituteAssignment({
      date,
      absentTeacher: absentTeacher.name,
      period: Number(period),
      subTeacher: selectedSubTeacher,
      subject,
      className,
      reason
    });

    alert("보강 교사가 배정되고 대강 기록에 저장되었습니다.");
    setReason("");
  };

  function getDayName(d) {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dateObj = new Date(date);
    return days[dateObj.getDay()] || "";
  }

  return (
    <div className="fade-in">
      <div className="view-header">
        <div className="view-title">
          <h1>보강 관리 & 교사 추천</h1>
          <p>교사 결강 발생 시, 해당 교시 공강 상태인 교사들을 분석하여 최적의 대강 교사를 자동 추천하고 배정합니다.</p>
        </div>
      </div>

      <div className="layout-split">
        {/* Left Side: Input Details */}
        <div>
          <div className="card">
            <div className="card-title">
              <UserMinus size={20} />
              <span>결강 교사 및 일시 설정</span>
            </div>

            <div className="form-group">
              <label className="form-label">결강(부재) 교사 선택</label>
              <select className="form-control" value={absentTeacherId} onChange={e => setAbsentTeacherId(e.target.value)}>
                {data.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">결강 날짜</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">결강 교시</label>
                <select className="form-control" value={period} onChange={e => setPeriod(Number(e.target.value))}>
                  {PERIODS.map(p => <option key={p} value={p}>{p}교시</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">부재 사유 (필수)</label>
              <input
                type="text"
                className="form-control"
                placeholder="예) 병가(독감), 공무 출장, 조사 참여 등"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            {/* Affected Class Status Info */}
            <div style={{ marginTop: "24px", padding: "16px", background: "var(--bg-hover)", borderRadius: "8px", borderLeft: "3px solid var(--primary)" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "6px" }}>결강 수업 정보</h4>
              {affectedClass ? (
                <div style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                  대상 학급: <strong>{affectedClass.grade}학년 {affectedClass.classNum}반</strong> <br />
                  배정 과목: <strong>{affectedClass.subject}</strong> <br />
                  수업 요일: {getDayName(dayIndex)}요일 {period}교시
                </div>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  선택한 {getDayName(dayIndex)}요일 {period}교시는 해당 교사의 <strong>공강 시간</strong>입니다. (대강 필요 없음)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Recommender System list */}
        <div>
          <div className="card">
            <div className="card-title">
              <Search size={20} />
              <span>보강 교사 매칭 추천 시스템</span>
            </div>

            {!affectedClass ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "20px" }}>
                대강 수업 일정이 존재할 때 추천 리스트가 활성화됩니다.
              </p>
            ) : recommendations.length === 0 ? (
              <div className="conflict-list">
                <AlertCircle size={18} />
                <span>해당 요일/교시에 공강 상태인 교사가 없어 대강 추천을 진행할 수 없습니다.</span>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  * 공강 교사 중 <strong>교과 일치도(50점), 학년 경험(25점), 주간 대강 횟수 감점(-10점)</strong>을 조합하여 추천 우선순위를 산출합니다.
                </p>

                <div className="rec-list">
                  {recommendations.slice(0, 5).map(rec => (
                    <div
                      key={rec.teacher.id}
                      className="rec-item"
                      style={{
                        borderColor: selectedSubTeacher === rec.teacher.name ? "var(--primary)" : "",
                        backgroundColor: selectedSubTeacher === rec.teacher.name ? "var(--primary-light)" : "",
                        cursor: "pointer"
                      }}
                      onClick={() => setSelectedSubTeacher(rec.teacher.name)}
                    >
                      <div>
                        <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{rec.teacher.name}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 400 }}>
                            {rec.teacher.subject} (학년: {rec.teacher.grade}학군)
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                          {rec.badges.map((b, idx) => (
                            <span
                              key={idx}
                              className={`badge ${
                                b.includes("교과") ? "badge-primary" : b.includes("학년") ? "badge-success" : "badge-secondary"
                              }`}
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="rec-score">
                        {rec.score >= 0 ? `+${rec.score}` : rec.score}점
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "24px", justifyContent: "center" }}
                  disabled={!selectedSubTeacher || !reason.trim()}
                  onClick={handleAssignSubstitute}
                >
                  <Check size={18} />
                  <span>선택된 보강 교사 배정 확정</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
