import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  Calendar,
  Upload,
  ArrowLeftRight,
  UserMinus,
  DoorOpen,
  CalendarRange,
  History,
  BarChart3,
  Settings as SettingsIcon,
  Sun,
  Moon,
  School
} from "lucide-react";

import { gasClient } from "./gasClient";
import Dashboard from "./components/Dashboard";
import TimetableViewer from "./components/TimetableViewer";
import TimetableUpload from "./components/TimetableUpload";
import SwapManager from "./components/SwapManager";
import SubstituteManager from "./components/SubstituteManager";
import RoomReservation from "./components/RoomReservation";
import EventManager from "./components/EventManager";
import AuditLog from "./components/AuditLog";
import StatsDashboard from "./components/StatsDashboard";
import Settings from "./components/Settings";

import "./App.css";

export default function App() {
  const [view, setView] = useState("dashboard");
  const [theme, setTheme] = useState(localStorage.getItem("stm_theme") || "light");
  const [loading, setLoading] = useState(true);

  // Unified Database State
  const [db, setDb] = useState({
    teachers: [],
    rooms: [],
    classes: [],
    timetable: [],
    restrictions: [],
    reservations: [],
    swaps: [],
    substitutes: [],
    events: [],
    settings: {}
  });

  // Load all data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await gasClient.getAllData();
        setDb(data);
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Theme Syncing
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("stm_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  // 1. Data Refresher / Syncer
  const syncTable = async (tableName, tableData) => {
    // Update local React state first
    setDb(prev => ({
      ...prev,
      [tableName]: tableData
    }));
    // Sync to GAS / localstorage
    await gasClient.saveTable(tableName, tableData);
  };

  // 2. Swaps & Adjustments Handler
  const updateTableAndLogSwap = async (swapDetails, reason, detailsText) => {
    const { gradeA, classA, dayA, periodA, gradeB, classB, dayB, periodB, lessonA, lessonB } = swapDetails;
    
    // Copy timetable
    const updatedTimetable = [...db.timetable];

    // Find and update lesson A
    const indexA = updatedTimetable.findIndex(
      t => t.grade === gradeA && t.classNum === classA && t.day === dayA && t.period === periodA
    );
    // Find and update lesson B
    const indexB = updatedTimetable.findIndex(
      t => t.grade === gradeB && t.classNum === classB && t.day === dayB && t.period === periodB
    );

    // Swap content
    // We swap: subject, teacher, room
    const targetA = {
      subject: lessonB.subject === "공강" ? "" : lessonB.subject,
      teacher: lessonB.teacher,
      room: lessonB.room
    };

    const targetB = {
      subject: lessonA.subject === "공강" ? "" : lessonA.subject,
      teacher: lessonA.teacher,
      room: lessonA.room
    };

    if (indexA !== -1) {
      updatedTimetable[indexA] = { ...updatedTimetable[indexA], ...targetA };
    } else if (lessonB.subject !== "공강") {
      updatedTimetable.push({
        grade: gradeA, classNum: classA, day: dayA, period: periodA,
        ...targetA
      });
    }

    if (indexB !== -1) {
      updatedTimetable[indexB] = { ...updatedTimetable[indexB], ...targetB };
    } else if (lessonA.subject !== "공강") {
      updatedTimetable.push({
        grade: gradeB, classNum: classB, day: dayB, period: periodB,
        ...targetB
      });
    }

    // Append to Swaps Log
    const newSwapLog = {
      id: `SW${String(db.swaps.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      user: "교무실 관리자",
      type: "1:1 교환",
      details: detailsText,
      reason: reason,
      status: "승인완료",
      timestamp: new Date().toLocaleString(),
      // Meta to help restore later
      meta: {
        gradeA, classA, dayA, periodA, originalTeacherA: lessonA.teacher, originalSubjectA: lessonA.subject, originalRoomA: lessonA.room,
        gradeB, classB, dayB, periodB, originalTeacherB: lessonB.teacher, originalSubjectB: lessonB.subject, originalRoomB: lessonB.room
      }
    };

    const updatedSwaps = [newSwapLog, ...db.swaps];

    await syncTable("timetable", updatedTimetable);
    await syncTable("swaps", updatedSwaps);
  };

  // 3. Revert Swaps (Restore)
  const restoreSwap = async (swapId) => {
    const swapLogIndex = db.swaps.findIndex(s => s.id === swapId);
    if (swapLogIndex === -1) return;

    const swapLog = db.swaps[swapLogIndex];
    if (!swapLog.meta) return;

    const {
      gradeA, classA, dayA, periodA, originalTeacherA, originalSubjectA, originalRoomA,
      gradeB, classB, dayB, periodB, originalTeacherB, originalSubjectB, originalRoomB
    } = swapLog.meta;

    const updatedTimetable = [...db.timetable];

    // Revert slot A
    const indexA = updatedTimetable.findIndex(
      t => t.grade === gradeA && t.classNum === classA && t.day === dayA && t.period === periodA
    );
    if (indexA !== -1) {
      updatedTimetable[indexA] = {
        ...updatedTimetable[indexA],
        subject: originalSubjectA === "공강" ? "" : originalSubjectA,
        teacher: originalTeacherA,
        room: originalRoomA
      };
    }

    // Revert slot B
    const indexB = updatedTimetable.findIndex(
      t => t.grade === gradeB && t.classNum === classB && t.day === dayB && t.period === periodB
    );
    if (indexB !== -1) {
      updatedTimetable[indexB] = {
        ...updatedTimetable[indexB],
        subject: originalSubjectB === "공강" ? "" : originalSubjectB,
        teacher: originalTeacherB,
        room: originalRoomB
      };
    }

    // Mark log status as Restored
    const updatedSwaps = [...db.swaps];
    updatedSwaps[swapLogIndex] = { ...swapLog, status: "복구완료" };

    await syncTable("timetable", updatedTimetable);
    await syncTable("swaps", updatedSwaps);
  };

  // 4. Add Substitute Assignment
  const addSubstituteAssignment = async (assignment) => {
    // Copy timetable
    const updatedTimetable = [...db.timetable];
    const [gradeStr, classStr] = assignment.className.split("-");
    const grade = Number(gradeStr);
    const classNum = Number(classStr);

    // Find lesson cell to substitute
    const index = updatedTimetable.findIndex(
      t => t.grade === grade && t.classNum === classNum && t.day === new Date(assignment.date).getDay() && t.period === assignment.period
    );

    let originalTeacher = "";
    let originalSubject = "";

    if (index !== -1) {
      originalTeacher = updatedTimetable[index].teacher;
      originalSubject = updatedTimetable[index].subject;

      // Update with substitute details
      updatedTimetable[index] = {
        ...updatedTimetable[index],
        teacher: assignment.subTeacher,
        subject: `${assignment.subject.split(" ")[0]} (보강)`
      };
    }

    // Append to substitute logs
    const newSubLog = {
      id: `SB${String(db.substitutes.length + 1).padStart(3, "0")}`,
      ...assignment,
      status: "배정 완료",
      timestamp: new Date().toLocaleString(),
      meta: {
        grade,
        classNum,
        day: new Date(assignment.date).getDay(),
        period: assignment.period,
        originalTeacher,
        originalSubject
      }
    };

    const updatedSubs = [newSubLog, ...db.substitutes];

    await syncTable("timetable", updatedTimetable);
    await syncTable("substitutes", updatedSubs);
  };

  // 5. Restore/Revert Substitute Assignment
  const restoreSubstitute = async (subId) => {
    const subLogIndex = db.substitutes.findIndex(s => s.id === subId);
    if (subLogIndex === -1) return;

    const subLog = db.substitutes[subLogIndex];
    if (!subLog.meta) return;

    const { grade, classNum, day, period, originalTeacher, originalSubject } = subLog.meta;

    const updatedTimetable = [...db.timetable];
    const index = updatedTimetable.findIndex(
      t => t.grade === grade && t.classNum === classNum && t.day === day && t.period === period
    );

    if (index !== -1) {
      // Revert back to original teacher and subject
      updatedTimetable[index] = {
        ...updatedTimetable[index],
        teacher: originalTeacher,
        subject: originalSubject
      };
    }

    const updatedSubs = [...db.substitutes];
    updatedSubs[subLogIndex] = { ...subLog, status: "취소됨" };

    await syncTable("timetable", updatedTimetable);
    await syncTable("substitutes", updatedSubs);
  };

  // 6. Special Room Reservation Handler
  const addReservation = async (res) => {
    const newRes = {
      id: db.reservations.length + 1,
      ...res
    };
    const updatedRes = [...db.reservations, newRes];
    await syncTable("reservations", updatedRes);
  };

  // 7. Events Handler
  const addEvent = async (ev) => {
    const newEv = {
      id: `EV${String(db.events.length + 1).padStart(3, "0")}`,
      ...ev
    };
    const updatedEvents = [...db.events, newEv];
    await syncTable("events", updatedEvents);
  };

  const deleteEvent = async (eventId) => {
    const updatedEvents = db.events.filter(e => e.id !== eventId);
    await syncTable("events", updatedEvents);
  };

  // 8. General Settings Handler
  const saveSettings = async (newSettings) => {
    await gasClient.saveSettings(newSettings);
    // Merge new settings with state
    setDb(prev => ({
      ...prev,
      settings: newSettings
    }));
  };

  // 9. Excel Upload Bulk Overwrite
  const updateData = async (newData) => {
    setDb(prev => ({
      ...prev,
      ...newData
    }));
    // Bulk save all tables
    await gasClient.saveTable("teachers", newData.teachers);
    await gasClient.saveTable("rooms", newData.rooms);
    await syncTable("classes", newData.classes);
    await syncTable("timetable", newData.timetable);
    await syncTable("restrictions", newData.restrictions);
  };

  const resetDatabase = async () => {
    await gasClient.resetDatabase();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", backgroundColor: "var(--bg-app)", color: "var(--text-primary)" }}>
        <School size={64} className="glow-active" style={{ color: "var(--primary)", marginBottom: "20px" }} />
        <h2>통합 시간표 관리 시스템 로딩 중...</h2>
      </div>
    );
  }

  const schoolName = db.settings?.schoolName || "학교";

  return (
    <div className="app-container">
      {/* Responsive Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">S</div>
          <div>
            <span className="logo-text">{schoolName}</span>
            <span className="logo-subtext">시간표 관리 시스템</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className={`menu-item ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>
            <LayoutGrid size={18} />
            <span>종합 대시보드</span>
          </li>
          <li className={`menu-item ${view === "viewer" ? "active" : ""}`} onClick={() => setView("viewer")}>
            <Calendar size={18} />
            <span>시간표 통합 조회</span>
          </li>
          <li className={`menu-item ${view === "upload" ? "active" : ""}`} onClick={() => setView("upload")}>
            <Upload size={18} />
            <span>엑셀 일괄 업로드</span>
          </li>
          <li className={`menu-item ${view === "swap" ? "active" : ""}`} onClick={() => setView("swap")}>
            <ArrowLeftRight size={18} />
            <span>1:1 수업 교환</span>
          </li>
          <li className={`menu-item ${view === "substitute" ? "active" : ""}`} onClick={() => setView("substitute")}>
            <UserMinus size={18} />
            <span>결강 & 보강 관리</span>
          </li>
          <li className={`menu-item ${view === "reservation" ? "active" : ""}`} onClick={() => setView("reservation")}>
            <DoorOpen size={18} />
            <span>특별실 예약 관리</span>
          </li>
          <li className={`menu-item ${view === "events" ? "active" : ""}`} onClick={() => setView("events")}>
            <CalendarRange size={18} />
            <span>행사 일정 설정</span>
          </li>
          <li className={`menu-item ${view === "history" ? "active" : ""}`} onClick={() => setView("history")}>
            <History size={18} />
            <span>변경 이력 & 복구</span>
          </li>
          <li className={`menu-item ${view === "stats" ? "active" : ""}`} onClick={() => setView("stats")}>
            <BarChart3 size={18} />
            <span>시수 & 통계 분석</span>
          </li>
          <li className={`menu-item ${view === "settings" ? "active" : ""}`} onClick={() => setView("settings")}>
            <SettingsIcon size={18} />
            <span>환경 설정</span>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">교</div>
            <div className="profile-info">
              <span className="profile-name">교무 부장</span>
              <span className="profile-role">최고 관리자</span>
            </div>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Dynamic Viewport */}
      <main className="main-content">
        {view === "dashboard" && <Dashboard data={db} setView={setView} />}
        {view === "viewer" && <TimetableViewer data={db} />}
        {view === "upload" && <TimetableUpload data={db} updateData={updateData} />}
        {view === "swap" && <SwapManager data={db} updateTableAndLogSwap={updateTableAndLogSwap} />}
        {view === "substitute" && <SubstituteManager data={db} addSubstituteAssignment={addSubstituteAssignment} />}
        {view === "reservation" && <RoomReservation data={db} addReservation={addReservation} />}
        {view === "events" && <EventManager data={db} addEvent={addEvent} deleteEvent={deleteEvent} />}
        {view === "history" && <AuditLog data={db} restoreSwap={restoreSwap} restoreSubstitute={restoreSubstitute} />}
        {view === "stats" && <StatsDashboard data={db} />}
        {view === "settings" && (
          <Settings
            settings={db.settings}
            saveSettings={saveSettings}
            resetDatabase={resetDatabase}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}
      </main>
    </div>
  );
}
