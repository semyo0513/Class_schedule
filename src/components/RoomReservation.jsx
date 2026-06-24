import React, { useState, useMemo } from "react";
import { DoorOpen, Check, Calendar, AlertTriangle } from "lucide-react";

export default function RoomReservation({ data, addReservation }) {
  const [selectedRoomId, setSelectedRoomId] = useState(data.rooms.find(r => r.type === "special")?.id || "");
  const [date, setDate] = useState("2026-06-25");
  const [teacherId, setTeacherId] = useState(data.teachers[0]?.id || "");
  const [period, setPeriod] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [className, setClassName] = useState("1-1");

  const PERIODS = [1, 2, 3, 4, 5, 6, 7];

  // Resolve special rooms
  const specialRooms = useMemo(() => {
    return data.rooms.filter(r => r.type === "special");
  }, [data]);

  // Adjust default room if list changes
  React.useEffect(() => {
    if (specialRooms.length > 0 && !specialRooms.some(r => r.id === selectedRoomId)) {
      setSelectedRoomId(specialRooms[0].id);
    }
  }, [specialRooms, selectedRoomId]);

  // Resolve active room name
  const selectedRoomObj = useMemo(() => {
    return data.rooms.find(r => r.id === selectedRoomId);
  }, [data, selectedRoomId]);

  // Resolve day index from date
  const dayIndex = useMemo(() => {
    if (!date) return 1;
    const d = new Date(date);
    const day = d.getDay();
    if (day === 0 || day === 6) return 1;
    return day;
  }, [date]);

  // Fetch timetable slots that regularly occupy this special room
  const regularLessonsInRoom = useMemo(() => {
    return data.timetable.filter(
      t => t.room === selectedRoomId && t.day === dayIndex
    );
  }, [data, selectedRoomId, dayIndex]);

  // Fetch active reservations for this room on the selected date
  const activeReservations = useMemo(() => {
    return data.reservations.filter(
      r => r.roomId === selectedRoomId && r.date === date
    );
  }, [data, selectedRoomId, date]);

  // Create unified timeline (7 periods) showing either regular lesson, reservation, or free.
  const roomTimeline = useMemo(() => {
    return PERIODS.map(p => {
      // 1. Check reservation
      const res = activeReservations.find(r => r.period === p);
      if (res) {
        const tObj = data.teachers.find(t => t.id === res.teacherId);
        return {
          period: p,
          status: "reserved",
          label: `예약완료: [${res.className}반] ${res.purpose}`,
          details: `예약자: ${tObj ? tObj.name : "교사"} | 사유: ${res.purpose}`
        };
      }

      // 2. Check regular timetable lesson
      const reg = regularLessonsInRoom.find(l => l.period === p);
      if (reg) {
        return {
          period: p,
          status: "regular",
          label: `정규수업: [${reg.grade}-${reg.classNum}반] ${reg.subject}`,
          details: `담당: ${reg.teacher} (정규 배정 수업)`
        };
      }

      return {
        period: p,
        status: "free",
        label: "사용 가능 (공실)",
        details: "특별 예약 진행 가능"
      };
    });
  }, [activeReservations, regularLessonsInRoom, data]);

  // Check if selected period can be booked
  const isPeriodBookable = useMemo(() => {
    const slot = roomTimeline.find(s => s.period === Number(period));
    return slot ? slot.status === "free" : false;
  }, [roomTimeline, period]);

  const handleBookRoom = () => {
    if (!isPeriodBookable) {
      alert("선택하신 교시는 이미 정규 수업 또는 타 예약이 잡혀 있어 사용 불가능합니다.");
      return;
    }
    if (!purpose.trim()) {
      alert("사용 목적을 입력해 주세요.");
      return;
    }
    if (!className.trim()) {
      alert("대상 학급/동아리명을 입력해 주세요.");
      return;
    }

    addReservation({
      roomId: selectedRoomId,
      date,
      period: Number(period),
      teacherId,
      purpose,
      className
    });

    alert("특별실 예약이 정상적으로 접수되었습니다.");
    setPurpose("");
    setClassName("1-1");
  };

  return (
    <div className="fade-in">
      <div className="view-header">
        <div className="view-title">
          <h1>특별실 예약 관리</h1>
          <p>과학실, 컴퓨터실, 체육관 등 교내 공동 특별시설물의 정규 수업 배정 현황을 파악하고 비는 시간에 예약을 진행합니다.</p>
        </div>
      </div>

      <div className="layout-split">
        {/* Left Side: Timeline view */}
        <div>
          <div className="card">
            <div className="card-title">
              <Calendar size={20} />
              <span>특별실 예약 현황 현황판</span>
            </div>

            <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">특별실 지정</label>
                <select className="form-control" value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)}>
                  {specialRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">날짜 선택</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {roomTimeline.map(slot => (
                <div
                  key={slot.period}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      padding: "16px",
                      textAlign: "center",
                      fontWeight: "700",
                      backgroundColor: "var(--bg-hover)",
                      borderRight: "1px solid var(--border-color)"
                    }}
                  >
                    {slot.period}교시
                  </div>
                  <div style={{ padding: "12px 16px", flexGrow: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        className={`badge ${
                          slot.status === "reserved"
                            ? "badge-warning"
                            : slot.status === "regular"
                            ? "badge-primary"
                            : "badge-success"
                        }`}
                      >
                        {slot.status === "reserved" ? "예약됨" : slot.status === "regular" ? "정규 수업" : "공실"}
                      </span>
                      <strong style={{ fontSize: "0.9rem" }}>{slot.label}</strong>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      {slot.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Reservation Form */}
        <div>
          <div className="card">
            <div className="card-title">
              <DoorOpen size={20} />
              <span>신규 시설 이용 예약 신청</span>
            </div>

            <div className="form-group">
              <label className="form-label">신청 교사</label>
              <select className="form-control" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
                {data.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">교시 선택</label>
                <select className="form-control" value={period} onChange={e => setPeriod(Number(e.target.value))}>
                  {PERIODS.map(p => <option key={p} value={p}>{p}교시</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">이용 학급/단체명</label>
                <input
                  type="text"
                  className="form-control"
                  value={className}
                  placeholder="예) 1-1, 화학동아리"
                  onChange={e => setClassName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">사용 목적</label>
              <input
                type="text"
                className="form-control"
                value={purpose}
                placeholder="예) 현미경 관찰 세포 실험 실습"
                onChange={e => setPurpose(e.target.value)}
              />
            </div>

            {/* Validation warning */}
            {!isPeriodBookable && (
              <div className="conflict-list" style={{ marginTop: "16px" }}>
                <AlertTriangle size={18} />
                <span>선택하신 {period}교시는 현재 예약 불가능합니다. 공실 상태의 교시만 신청할 수 있습니다.</span>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "20px", justifyContent: "center" }}
              disabled={!isPeriodBookable || !purpose.trim() || !className.trim()}
              onClick={handleBookRoom}
            >
              <Check size={18} />
              <span>예약 완료 및 저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
