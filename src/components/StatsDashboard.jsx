import React, { useMemo } from "react";
import { BarChart3, Clock, LayoutGrid, CheckCircle } from "lucide-react";

export default function StatsDashboard({ data }) {
  // 1. Weekly teaching hours per teacher
  const teacherStats = useMemo(() => {
    return data.teachers.map(teacher => {
      // Count hours from regular timetable
      const hours = data.timetable.filter(t => t.teacher === teacher.name).length;
      return {
        ...teacher,
        actualHours: hours,
        percentage: Math.min(Math.round((hours / 22) * 100), 100) // Assumed max standard hours is 22
      };
    }).sort((a, b) => b.actualHours - a.actualHours);
  }, [data]);

  // 2. Special Room Occupancy (out of 35 periods: 5 days * 7 periods)
  const roomStats = useMemo(() => {
    return data.rooms.map(room => {
      const regularUse = data.timetable.filter(t => t.room === room.id).length;
      const reservations = data.reservations.filter(r => r.roomId === room.id).length;
      const totalUse = regularUse + reservations;
      const occupancyRate = Math.round((totalUse / 35) * 100);

      return {
        ...room,
        regularUse,
        reservations,
        totalUse,
        occupancyRate: Math.min(occupancyRate, 100)
      };
    }).sort((a, b) => b.occupancyRate - a.occupancyRate);
  }, [data]);

  // 3. Substitute duty counters
  const subStats = useMemo(() => {
    const counts = {};
    data.teachers.forEach(t => { counts[t.name] = 0; });
    
    data.substitutes.forEach(sub => {
      if (counts[sub.subTeacher] !== undefined) {
        counts[sub.subTeacher]++;
      }
    });

    return Object.keys(counts).map(name => ({
      name,
      duties: counts[name]
    })).sort((a, b) => b.duties - a.duties);
  }, [data]);

  return (
    <div className="fade-in">
      <div className="view-header">
        <div className="view-title">
          <h1>데이터 분석 대시보드</h1>
          <p>교사별 주당 수업 시수 균형성, 특별실 가동률, 보강 분담률 등을 실시간 도표와 수치로 종합 모니터링합니다.</p>
        </div>
      </div>

      <div className="layout-split">
        {/* Left Side: Teacher hours & Room usage */}
        <div>
          {/* Teacher Hours */}
          <div className="card">
            <div className="card-title">
              <Clock size={20} />
              <span>교사별 주당 수업 실시간 시수</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {teacherStats.map(teacher => (
                <div key={teacher.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600 }}>{teacher.name} ({teacher.subject})</span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      <strong>{teacher.actualHours}시수</strong> / 주 (설정기준: {teacher.weeklyHours}시수)
                    </span>
                  </div>
                  {/* Custom progress bar */}
                  <div style={{ width: "100%", height: "8px", backgroundColor: "var(--bg-hover)", borderRadius: "99px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.min((teacher.actualHours / teacher.weeklyHours) * 100, 100)}%`,
                        height: "100%",
                        backgroundColor: teacher.actualHours > teacher.weeklyHours ? "var(--warning)" : "var(--primary)",
                        borderRadius: "99px",
                        transition: "width 0.5s ease"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Room Occupancy */}
          <div className="card">
            <div className="card-title">
              <LayoutGrid size={20} />
              <span>특별실/교실 공간 활용도</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {roomStats.filter(r => r.type === "special").map(room => (
                <div key={room.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600 }}>{room.name}</span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      주당 {room.totalUse}교시 점유 (이용률 <strong>{room.occupancyRate}%</strong>)
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "var(--bg-hover)", borderRadius: "99px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${room.occupancyRate}%`,
                        height: "100%",
                        backgroundColor: room.occupancyRate > 60 ? "var(--danger)" : room.occupancyRate > 30 ? "var(--warning)" : "var(--success)",
                        borderRadius: "99px",
                        transition: "width 0.5s ease"
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "8px", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    <span>정규배정: {room.regularUse}교시</span>
                    <span>특별예약: {room.reservations}교시</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Substitute load balancing statistics */}
        <div>
          <div className="card">
            <div className="card-title">
              <BarChart3 size={20} />
              <span>누적 대강/보강 업무 분담 현황</span>
            </div>
            
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
              보강 교사 추천 시 업무 과부하 방지를 위해 보강 업무 분담 횟수가 적은 교사가 먼저 배정될 수 있도록 반영합니다.
            </p>

            <table className="data-table">
              <thead>
                <tr>
                  <th>교사명</th>
                  <th>보강 실적</th>
                  <th>부담 지수</th>
                </tr>
              </thead>
              <tbody>
                {subStats.map(sub => (
                  <tr key={sub.name}>
                    <td style={{ fontWeight: 600 }}>{sub.name}</td>
                    <td>{sub.duties}회</td>
                    <td>
                      <span
                        className={`badge ${
                          sub.duties >= 3
                            ? "badge-danger"
                            : sub.duties >= 1
                            ? "badge-warning"
                            : "badge-success"
                        }`}
                      >
                        {sub.duties >= 3 ? "과부하" : sub.duties >= 1 ? "보통" : "여유"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
