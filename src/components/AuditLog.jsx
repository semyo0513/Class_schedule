import React, { useState } from "react";
import { History, RotateCcw, Search, Calendar } from "lucide-react";

export default function AuditLog({ data, restoreSwap, restoreSubstitute }) {
  const [filterType, setFilterType] = useState("all"); // all, swap, substitute
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSwaps = data.swaps.filter(sw => {
    if (filterType === "substitute") return false;
    const q = searchQuery.toLowerCase();
    return (
      sw.details.toLowerCase().includes(q) ||
      sw.reason.toLowerCase().includes(q) ||
      sw.user.toLowerCase().includes(q)
    );
  });

  const filteredSubs = data.substitutes.filter(sb => {
    if (filterType === "swap") return false;
    const q = searchQuery.toLowerCase();
    return (
      sb.absentTeacher.toLowerCase().includes(q) ||
      sb.subTeacher.toLowerCase().includes(q) ||
      sb.reason.toLowerCase().includes(q) ||
      sb.className.toLowerCase().includes(q)
    );
  });

  // Combine both logs and sort by timestamp/date descending
  const combinedLogs = [
    ...filteredSwaps.map(sw => ({
      ...sw,
      logType: "swap",
      key: `sw-${sw.id}`,
      sortTime: new Date(`${sw.date} ${sw.timestamp?.split(" ")[1] || "00:00:00"}`).getTime()
    })),
    ...filteredSubs.map(sb => ({
      ...sb,
      logType: "substitute",
      key: `sb-${sb.id}`,
      sortTime: new Date(`${sb.date} ${sb.timestamp?.split(" ")[1] || "00:00:00"}`).getTime()
    }))
  ].sort((a, b) => b.sortTime - a.sortTime);

  return (
    <div className="fade-in">
      <div className="view-header">
        <div className="view-title">
          <h1>변경 이력 & 복구 관리</h1>
          <p>시간표 교환, 보강 교사 배정 등 모든 변경 이력을 실시간 로깅하며, 복구 버튼을 통해 직전 상태로 즉시 복원 가능합니다.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <History size={20} />
          <span>전체 시간표 변경 이력 로그</span>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
            <button
              className={`btn btn-secondary`}
              style={{
                borderRadius: 0,
                border: "none",
                backgroundColor: filterType === "all" ? "var(--primary-light)" : "",
                color: filterType === "all" ? "var(--primary)" : ""
              }}
              onClick={() => setFilterType("all")}
            >
              전체 보기
            </button>
            <button
              className={`btn btn-secondary`}
              style={{
                borderRadius: 0,
                border: "none",
                backgroundColor: filterType === "swap" ? "var(--primary-light)" : "",
                color: filterType === "swap" ? "var(--primary)" : ""
              }}
              onClick={() => setFilterType("swap")}
            >
              1:1 수업교체
            </button>
            <button
              className={`btn btn-secondary`}
              style={{
                borderRadius: 0,
                border: "none",
                backgroundColor: filterType === "substitute" ? "var(--primary-light)" : "",
                color: filterType === "substitute" ? "var(--primary)" : ""
              }}
              onClick={() => setFilterType("substitute")}
            >
              결강/보강배정
            </button>
          </div>

          <div style={{ position: "relative", flexGrow: 1 }}>
            <input
              type="text"
              className="form-control"
              placeholder="교사명, 학급, 사유 등으로 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {combinedLogs.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "40px" }}>
            조회된 변경 이력이 없습니다.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>발생 일자</th>
                <th>구분</th>
                <th>세부 사항</th>
                <th>변경 사유</th>
                <th>상태</th>
                <th style={{ textAlign: "right" }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {combinedLogs.map(log => (
                <tr key={log.key}>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {log.date} <br />
                    <span style={{ fontSize: "0.7rem" }}>{log.timestamp?.split(" ")[1] || ""}</span>
                  </td>
                  <td>
                    {log.logType === "swap" ? (
                      <span className="badge badge-primary">1:1 교환</span>
                    ) : (
                      <span className="badge badge-danger">보강 배정</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500, fontSize: "0.85rem" }}>
                    {log.logType === "swap" ? (
                      log.details
                    ) : (
                      `${log.className}반 ${log.period}교시: ${log.absentTeacher} → ${log.subTeacher}`
                    )}
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>{log.reason}</td>
                  <td>
                    <span
                      className={`badge ${
                        log.status === "복구완료" || log.status === "취소됨"
                          ? "badge-secondary"
                          : "badge-success"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {log.status !== "복구완료" && log.status !== "취소됨" && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", gap: "4px", padding: "6px 10px", fontSize: "0.8rem" }}
                        onClick={() => {
                          if (confirm("정말 이 이력을 되돌리고 시간표를 원래대로 복원하시겠습니까?")) {
                            if (log.logType === "swap") {
                              restoreSwap(log.id);
                            } else {
                              restoreSubstitute(log.id);
                            }
                            alert("작업이 성공적으로 되돌려졌습니다.");
                          }
                        }}
                      >
                        <RotateCcw size={14} />
                        <span>복구</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
