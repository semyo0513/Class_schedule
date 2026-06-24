// Default Mock Data for School Timetable Manager (STM)

export const DEFAULT_TEACHERS = [
  { id: "T001", name: "김국어", subject: "국어", grade: 1, weeklyHours: 16 },
  { id: "T002", name: "이수학", subject: "수학", grade: 1, weeklyHours: 18 },
  { id: "T003", name: "박영어", subject: "영어", grade: 1, weeklyHours: 16 },
  { id: "T004", name: "최과학", subject: "과학", grade: 1, weeklyHours: 14 },
  { id: "T005", name: "정사회", subject: "사회", grade: 1, weeklyHours: 12 },
  { id: "T006", name: "강체육", subject: "체육", grade: 2, weeklyHours: 16 },
  { id: "T007", name: "조음악", subject: "음악", grade: 2, weeklyHours: 10 },
  { id: "T008", name: "윤미술", subject: "미술", grade: 2, weeklyHours: 10 },
  { id: "T009", name: "한정보", subject: "정보", grade: 3, weeklyHours: 14 },
  { id: "T010", name: "송역사", subject: "역사", grade: 3, weeklyHours: 12 },
  { id: "T011", name: "임중국어", subject: "중국어", grade: 3, weeklyHours: 8 },
  { id: "T012", name: "배한문", subject: "한문", grade: 3, weeklyHours: 8 }
];

export const DEFAULT_ROOMS = [
  { id: "R101", name: "1학년 1반 교실", type: "classroom" },
  { id: "R102", name: "1학년 2반 교실", type: "classroom" },
  { id: "R103", name: "1학년 3반 교실", type: "classroom" },
  { id: "R201", name: "2학년 1반 교실", type: "classroom" },
  { id: "R202", name: "2학년 2반 교실", type: "classroom" },
  { id: "R301", name: "3학년 1반 교실", type: "classroom" },
  { id: "R302", name: "3학년 2반 교실", type: "classroom" },
  { id: "R501", name: "과학실1", type: "special" },
  { id: "R502", name: "과학실2", type: "special" },
  { id: "R503", name: "컴퓨터실", type: "special" },
  { id: "R504", name: "AI 융합실", type: "special" },
  { id: "R505", name: "음악실", type: "special" },
  { id: "R506", name: "미술실", type: "special" },
  { id: "R507", name: "체육관", type: "special" },
  { id: "R508", name: "시청각실", type: "special" }
];

export const DEFAULT_CLASSES = [
  { id: "C101", grade: 1, classNum: 1, room: "R101" },
  { id: "C102", grade: 1, classNum: 2, room: "R102" },
  { id: "C103", grade: 1, classNum: 3, room: "R103" },
  { id: "C201", grade: 2, classNum: 1, room: "R201" },
  { id: "C202", grade: 2, classNum: 2, room: "R202" },
  { id: "C301", grade: 3, classNum: 1, room: "R301" },
  { id: "C302", grade: 3, classNum: 2, room: "R302" }
];

// Helper to define basic timetables for classes
// 5 Days (월, 화, 수, 목, 금), 7 Periods (1~7교시)
// Day indices: 1=월, 2=화, 3=수, 4=목, 5=금
export const DEFAULT_TIMETABLE = [
  // 1학년 1반 (C101)
  { grade: 1, classNum: 1, day: 1, period: 1, subject: "국어", teacher: "김국어", room: "R101" },
  { grade: 1, classNum: 1, day: 1, period: 2, subject: "수학", teacher: "이수학", room: "R101" },
  { grade: 1, classNum: 1, day: 1, period: 3, subject: "과학", teacher: "최과학", room: "R501" }, // 과학실1
  { grade: 1, classNum: 1, day: 1, period: 4, subject: "체육", teacher: "강체육", room: "R507" }, // 체육관
  { grade: 1, classNum: 1, day: 1, period: 5, subject: "영어", teacher: "박영어", room: "R101" },
  { grade: 1, classNum: 1, day: 1, period: 6, subject: "사회", teacher: "정사회", room: "R101" },
  { grade: 1, classNum: 1, day: 1, period: 7, subject: "자율", teacher: "김국어", room: "R101" },

  { grade: 1, classNum: 1, day: 2, period: 1, subject: "수학", teacher: "이수학", room: "R101" },
  { grade: 1, classNum: 1, day: 2, period: 2, subject: "영어", teacher: "박영어", room: "R101" },
  { grade: 1, classNum: 1, day: 2, period: 3, subject: "국어", teacher: "김국어", room: "R101" },
  { grade: 1, classNum: 1, day: 2, period: 4, subject: "음악", teacher: "조음악", room: "R505" }, // 음악실
  { grade: 1, classNum: 1, day: 2, period: 5, subject: "과학", teacher: "최과학", room: "R101" },
  { grade: 1, classNum: 1, day: 2, period: 6, subject: "한문", teacher: "배한문", room: "R101" },
  { grade: 1, classNum: 1, day: 2, period: 7, subject: "창체", teacher: "이수학", room: "R101" },

  { grade: 1, classNum: 1, day: 3, period: 1, subject: "영어", teacher: "박영어", room: "R101" },
  { grade: 1, classNum: 1, day: 3, period: 2, subject: "국어", teacher: "김국어", room: "R101" },
  { grade: 1, classNum: 1, day: 3, period: 3, subject: "수학", teacher: "이수학", room: "R101" },
  { grade: 1, classNum: 1, day: 3, period: 4, subject: "미술", teacher: "윤미술", room: "R506" }, // 미술실
  { grade: 1, classNum: 1, day: 3, period: 5, subject: "사회", teacher: "정사회", room: "R101" },
  { grade: 1, classNum: 1, day: 3, period: 6, subject: "체육", teacher: "강체육", room: "R507" },
  { grade: 1, classNum: 1, day: 3, period: 7, subject: "HR", teacher: "김국어", room: "R101" },

  { grade: 1, classNum: 1, day: 4, period: 1, subject: "과학", teacher: "최과학", room: "R101" },
  { grade: 1, classNum: 1, day: 4, period: 2, subject: "사회", teacher: "정사회", room: "R101" },
  { grade: 1, classNum: 1, day: 4, period: 3, subject: "국어", teacher: "김국어", room: "R101" },
  { grade: 1, classNum: 1, day: 4, period: 4, subject: "수학", teacher: "이수학", room: "R101" },
  { grade: 1, classNum: 1, day: 4, period: 5, subject: "정보", teacher: "한정보", room: "R503" }, // 컴퓨터실
  { grade: 1, classNum: 1, day: 4, period: 6, subject: "영어", teacher: "박영어", room: "R101" },
  { grade: 1, classNum: 1, day: 4, period: 7, subject: "진로", teacher: "최과학", room: "R101" },

  { grade: 1, classNum: 1, day: 5, period: 1, subject: "수학", teacher: "이수학", room: "R101" },
  { grade: 1, classNum: 1, day: 5, period: 2, subject: "영어", teacher: "박영어", room: "R101" },
  { grade: 1, classNum: 1, day: 5, period: 3, subject: "국어", teacher: "김국어", room: "R101" },
  { grade: 1, classNum: 1, day: 5, period: 4, subject: "역사", teacher: "송역사", room: "R101" },
  { grade: 1, classNum: 1, day: 5, period: 5, subject: "중국어", teacher: "임중국어", room: "R101" },
  { grade: 1, classNum: 1, day: 5, period: 6, subject: "과학", teacher: "최과학", room: "R501" },
  { grade: 1, classNum: 1, day: 5, period: 7, subject: "동아리", teacher: "박영어", room: "R101" },

  // 1학년 2반 (C102)
  { grade: 1, classNum: 2, day: 1, period: 1, subject: "수학", teacher: "이수학", room: "R102" },
  { grade: 1, classNum: 2, day: 1, period: 2, subject: "국어", teacher: "김국어", room: "R102" },
  { grade: 1, classNum: 2, day: 1, period: 3, subject: "영어", teacher: "박영어", room: "R102" },
  { grade: 1, classNum: 2, day: 1, period: 4, subject: "사회", teacher: "정사회", room: "R102" },
  { grade: 1, classNum: 2, day: 1, period: 5, subject: "체육", teacher: "강체육", room: "R507" },
  { grade: 1, classNum: 2, day: 1, period: 6, subject: "과학", teacher: "최과학", room: "R102" },
  { grade: 1, classNum: 2, day: 1, period: 7, subject: "자율", teacher: "이수학", room: "R102" },

  { grade: 1, classNum: 2, day: 2, period: 1, subject: "국어", teacher: "김국어", room: "R102" },
  { grade: 1, classNum: 2, day: 2, period: 2, subject: "과학", teacher: "최과학", room: "R501" },
  { grade: 1, classNum: 2, day: 2, period: 3, subject: "수학", teacher: "이수학", room: "R102" },
  { grade: 1, classNum: 2, day: 2, period: 4, subject: "영어", teacher: "박영어", room: "R102" },
  { grade: 1, classNum: 2, day: 2, period: 5, subject: "역사", teacher: "송역사", room: "R102" },
  { grade: 1, classNum: 2, day: 2, period: 6, subject: "음악", teacher: "조음악", room: "R505" },
  { grade: 1, classNum: 2, day: 2, period: 7, subject: "창체", teacher: "김국어", room: "R102" },

  // 2학년 1반 (C201)
  { grade: 2, classNum: 1, day: 1, period: 1, subject: "체육", teacher: "강체육", room: "R507" },
  { grade: 2, classNum: 1, day: 1, period: 2, subject: "음악", teacher: "조음악", room: "R505" },
  { grade: 2, classNum: 1, day: 1, period: 3, subject: "국어", teacher: "김국어", room: "R201" },
  { grade: 2, classNum: 1, day: 1, period: 4, subject: "수학", teacher: "이수학", room: "R201" },
  { grade: 2, classNum: 1, day: 1, period: 5, subject: "과학", teacher: "최과학", room: "R502" },
  { grade: 2, classNum: 1, day: 1, period: 6, subject: "영어", teacher: "박영어", room: "R201" },
  { grade: 2, classNum: 1, day: 1, period: 7, subject: "자율", teacher: "강체육", room: "R201" }
];

export const DEFAULT_RESTRICTIONS = [
  { type: "room", target: "R501", reason: "과학실1: 실험 장비 상시 준비로 타 교과 대체 불가", rule: "prevent" },
  { type: "room", target: "R503", reason: "컴퓨터실: 실습 장비 구축으로 컴퓨터 교과 전용", rule: "prevent" },
  { type: "teacher", target: "강체육", reason: "강체육: 화/목 오전 외부 출강으로 수업 배정 최소화", rule: "warn" },
  { type: "subject", target: "평가", reason: "평가/시험 시간표: 학교장 승인 필요", rule: "approval" }
];

export const DEFAULT_RESERVATIONS = [
  { id: 1, roomId: "R501", date: "2026-06-25", period: 3, teacherId: "T004", purpose: "1학년 1반 과학 물질의 구성 실험", className: "1-1" },
  { id: 2, roomId: "R503", date: "2026-06-25", period: 5, teacherId: "T009", purpose: "1학년 1반 피지컬 컴퓨팅 실습", className: "1-1" },
  { id: 3, roomId: "R507", date: "2026-06-26", period: 4, teacherId: "T006", purpose: "2학년 1반 농구 경기 평가", className: "2-1" }
];

export const DEFAULT_SWAPS = [
  {
    id: "SW001",
    date: "2026-06-24",
    user: "김국어 (관리자)",
    type: "1:1 교환",
    details: "1학년 1반 월요일 1교시(국어) ↔ 월요일 4교시(체육)",
    reason: "국어 교사 출장 일정 변경",
    status: "승인 완료",
    timestamp: "2026-06-24 10:15:32"
  }
];

export const DEFAULT_SUBSTITUTES = [
  {
    id: "SB001",
    date: "2026-06-24",
    absentTeacher: "최과학",
    period: 3,
    subTeacher: "이수학",
    subject: "수학 (보강)",
    className: "1-1",
    reason: "병가 (감기)",
    status: "배정 완료",
    timestamp: "2026-06-24 09:00:15"
  }
];

export const DEFAULT_EVENTS = [
  {
    id: "EV001",
    name: "1학년 진로 직업 체험의 날",
    startDate: "2026-06-29",
    endDate: "2026-06-29",
    targetGrade: 1,
    description: "교외 직업 체험 학습 센터 방문 및 특별 강연",
    status: "예정됨"
  },
  {
    id: "EV002",
    name: "2학년 체육대회 예선",
    startDate: "2026-06-30",
    endDate: "2026-06-30",
    targetGrade: 2,
    description: "오후 5~7교시 체육관 및 운동장 사용",
    status: "예정됨"
  }
];

export const DEFAULT_SETTINGS = {
  gasUrl: "https://script.google.com/macros/s/AKfycby73Y8hCwrvSJhCnkSgJKko3hL_Xl2w-cyYOBzFq_dQCSUJvCAHofB_eoLGc6DxVueXaQ/exec",
  discordWebhook: "",
  googleChatWebhook: "",
  periodsPerDay: 7,
  schoolName: "대경고등학교",
  adminPassword: "admin"
};
