import React, { useState } from "react";
import { CalendarRange, Plus, Trash2, CalendarDays } from "lucide-react";

export default function EventManager({ data, addEvent, deleteEvent }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("2026-06-29");
  const [endDate, setEndDate] = useState("2026-06-29");
  const [targetGrade, setTargetGrade] = useState(0); // 0 = 전체학년
  const [description, setDescription] = useState("");

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    addEvent({
      name,
      startDate,
      endDate,
      targetGrade: Number(targetGrade),
      description,
      status: "예정됨"
    });

    setName("");
    setDescription("");
    alert("새 학교 행사가 등록되었습니다.");
  };

  return (
    <div className="fade-in">
      <div className="view-header">
        <div className="view-title">
          <h1>행사 일정 운영 모드</h1>
          <p>학교의 단체 행사(체육대회, 소풍, 시험, 수련회 등)를 등록하고 행사 시간표 모드를 통합하여 관리합니다.</p>
        </div>
      </div>

      <div className="layout-split">
        {/* Left Side: Events List */}
        <div>
          <div className="card">
            <div className="card-title">
              <CalendarDays size={20} />
              <span>등록된 학교 일정 목록</span>
            </div>

            {data.events.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "40px" }}>
                현재 등록된 학교 공식 일정이 없습니다. 우측 폼에서 행사를 추가해 주세요.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {data.events.map(ev => (
                  <div
                    key={ev.id}
                    style={{
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      padding: "16px",
                      backgroundColor: "var(--bg-hover)",
                      position: "relative"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <h4 style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--text-primary)" }}>{ev.name}</h4>
                        <span className="badge badge-primary" style={{ marginTop: "4px" }}>
                          {ev.targetGrade === 0 ? "전체 학년 대상" : `${ev.targetGrade}학년 대상`}
                        </span>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: "var(--danger)", padding: "6px 8px" }}
                        onClick={() => {
                          if (confirm("정말 행사를 삭제하시겠습니까?")) {
                            deleteEvent(ev.id);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      {ev.description || "상세 내용 없음"}
                    </p>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", gap: "12px" }}>
                      <span>기간: {ev.startDate} ~ {ev.endDate}</span>
                      <span>상태: <strong>{ev.status}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Create Event */}
        <div>
          <div className="card">
            <div className="card-title">
              <CalendarRange size={20} />
              <span>신규 학교 행사 등록</span>
            </div>

            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label className="form-label">행사명</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="예) 1학기 지필평가, 학교 축제"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">시작 날짜</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">종료 날짜</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">적용 대상</label>
                <select className="form-control" value={targetGrade} onChange={e => setTargetGrade(Number(e.target.value))}>
                  <option value={0}>전체 학년</option>
                  <option value={1}>1학년 전체</option>
                  <option value={2}>2학년 전체</option>
                  <option value={3}>3학년 전체</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">상세 정보/일정 개요</label>
                <textarea
                  className="form-control"
                  style={{ height: "80px", resize: "none" }}
                  placeholder="행사에 관한 세부 일정이나 정규 시간표 대체 내용을 요약해 주세요."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <button className="btn btn-primary" type="submit" style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}>
                <Plus size={18} />
                <span>새 행사 일정 추가</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
