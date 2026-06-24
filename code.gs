/**
 * School Timetable Manager (STM) - Google Apps Script Backend
 * 
 * 이 스크립트는 구글 스프레드시트를 데이터베이스로 활용하여 시간표 데이터를 저장하고 관리합니다.
 * 웹앱 웹페이지에서 보내는 GET 및 POST 요청을 처리하여 구글 시트와 양방향으로 연동합니다.
 */

// 각 데이터 테이블과 구글 시트 이름 매핑
const SHEET_MAPPING = {
  teachers: "교사정보",
  rooms: "교실정보",
  classes: "학급정보",
  timetable: "시간표",
  restrictions: "교체금지 설정",
  reservations: "특별실예약",
  swaps: "교체이력",
  substitutes: "대강이력",
  events: "행사일정"
};

// 각 시트의 기본 헤더 구성 (시트 자동 초기화용)
const SHEET_HEADERS = {
  "교사정보": ["교사ID", "교사명", "교과", "학년", "주당시수"],
  "교실정보": ["교실ID", "교실명", "유형"],
  "학급정보": ["학급ID", "학년", "반", "교실ID"],
  "시간표": ["학년", "반", "요일", "교시", "교과", "교사", "교실"],
  "교체금지 설정": ["구분", "대상", "사유", "규칙"],
  "특별실예약": ["id", "roomId", "date", "period", "teacherId", "purpose", "className"],
  "교체이력": ["id", "date", "user", "type", "details", "reason", "status", "timestamp", "meta"],
  "대강이력": ["id", "date", "absentTeacher", "period", "subTeacher", "subject", "className", "reason", "status", "timestamp", "meta"],
  "행사일정": ["id", "name", "startDate", "endDate", "targetGrade", "description", "status"]
};

/**
 * GET 요청 처리: 시간표의 모든 테이블 데이터를 가져와 JSON으로 반환
 */
function doGet(e) {
  // Apps Script 에디터에서 [실행] 버튼을 직접 눌렀거나 웹앱 URL을 브라우저에 직접 쳤을 때 예외 처리
  if (!e || !e.parameter) {
    return ContentService.createTextOutput("구글 앱스 스크립트 웹앱이 성공적으로 활성화되었습니다! \n\n* 안내: 스크립트 에디터에서 '실행' 버튼을 누르면 브라우저 요청 객체(e)가 없어 에러가 발생하는 것이 정상입니다. \n* 사용법: 이 창의 웹앱 URL 주소를 복사하여, 제작된 시간표 웹앱의 [환경 설정] > [GAS 웹앱 URL] 칸에 입력하고 저장하여 연동해 주세요.")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const action = e.parameter.action;
  
  if (action === "getAllData") {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      initializeSheets(ss); // 누락된 시트가 있으면 자동 생성
      
      const allData = {};
      
      // 각 매핑 시트에서 데이터를 조회하여 JSON 포맷으로 변환
      Object.keys(SHEET_MAPPING).forEach(key => {
        const sheetName = SHEET_MAPPING[key];
        const sheet = ss.getSheetByName(sheetName);
        allData[key] = sheetToJson(sheet);
      });
      
      return createJsonResponse({
        status: "success",
        data: allData
      });
    } catch (err) {
      return createJsonResponse({
        status: "error",
        message: err.toString()
      });
    }
  }
  
  return createJsonResponse({
    status: "error",
    message: "지원하지 않는 GET 액션입니다."
  });
}

/**
 * POST 요청 처리: 특정 테이블 데이터를 덮어쓰기 형태로 저장
 */
function doPost(e) {
  // 에디터에서 테스트 실행하거나 잘못된 호출 시 예외 처리
  if (!e || !e.postData || !e.postData.contents) {
    return createJsonResponse({
      status: "error",
      message: "유효하지 않은 POST 요청이거나 Apps Script 에디터에서 테스트 실행되었습니다."
    });
  }

  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    if (action === "saveTable") {
      const tableName = postData.table;
      const data = postData.data;
      
      if (!SHEET_MAPPING[tableName]) {
        throw new Error("유효하지 않은 테이블 이름입니다: " + tableName);
      }
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheetName = SHEET_MAPPING[tableName];
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      // 시트 비우고 헤더 설정 및 데이터 작성
      sheet.clear();
      const headers = SHEET_HEADERS[sheetName];
      sheet.appendRow(headers);
      
      if (data && data.length > 0) {
        const rows = data.map(item => {
          return headers.map(header => {
            const val = getPropertyByHeader(item, header, tableName);
            // 객체나 배열 형태(예: meta 정보)는 JSON 문자열로 변환하여 시트에 저장
            if (typeof val === "object" && val !== null) {
              return JSON.stringify(val);
            }
            return val !== undefined ? val : "";
          });
        });
        
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      
      return createJsonResponse({
        status: "success",
        message: tableName + " 테이블 저장 완료"
      });
    }
    
    throw new Error("지원하지 않는 POST 액션입니다.");
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * 스프레드시트의 모든 데이터 시트를 자동으로 초기화
 */
function initializeSheets(ss) {
  Object.keys(SHEET_HEADERS).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(SHEET_HEADERS[sheetName]);
    }
  });
}

/**
 * 구글 시트 데이터를 JSON 객체 배열로 변환하는 헬퍼 함수
 */
function sheetToJson(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return []; // 데이터가 없고 헤더만 있는 경우
  
  const headers = values[0];
  const rows = values.slice(1);
  
  return rows.map(row => {
    const item = {};
    headers.forEach((header, idx) => {
      const cellValue = row[idx];
      const modelKey = mapHeaderToKey(header);
      
      // JSON 문자열로 저장된 meta 데이터 등은 파싱해서 복원
      if (typeof cellValue === "string" && (cellValue.startsWith("{") || cellValue.startsWith("["))) {
        try {
          item[modelKey] = JSON.parse(cellValue);
        } catch (e) {
          item[modelKey] = cellValue;
        }
      } else {
        item[modelKey] = cellValue;
      }
    });
    return item;
  });
}

/**
 * 프론트엔드 모델의 Key 이름을 시트 헤더 명칭과 매핑
 */
function mapHeaderToKey(header) {
  const mapping = {
    // 교사정보
    "교사ID": "id",
    "교사명": "name",
    "교과": "subject",
    "학년": "grade",
    "주당시수": "weeklyHours",
    // 교실정보
    "교실ID": "id",
    "교실명": "name",
    "유형": "type",
    // 학급정보
    "학급ID": "id",
    "반": "classNum",
    // 시간표
    "요일": "day",
    "교시": "period",
    // 교체금지
    "구분": "type",
    "대상": "target",
    "사유": "reason",
    "규칙": "rule"
  };
  
  return mapping[header] || header;
}

/**
 * 시트 헤더 명칭에 맞추어 JSON 객체에서 프로퍼티 값을 추출
 */
function getPropertyByHeader(item, header, tableName) {
  // 공통 매핑 처리
  const key = mapHeaderToKey(header);
  
  // 특정 시트의 요일 데이터 정수형 변환 예외 처리 (시간표의 day는 1~5 정수형 저장)
  if (tableName === "timetable" && header === "요일" && typeof item[key] === "string") {
    const dayStr = item[key];
    if (dayStr.includes("월")) return 1;
    if (dayStr.includes("화")) return 2;
    if (dayStr.includes("수")) return 3;
    if (dayStr.includes("목")) return 4;
    if (dayStr.includes("금")) return 5;
  }
  
  return item[key];
}

/**
 * CORS 에러 방지를 위한 JSON 응답 헬퍼 함수
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
