import React, { useState } from "react";
import { Settings as SettingsIcon, Save, RefreshCw, Moon, Sun, Link, Info } from "lucide-react";

export default function Settings({ settings, saveSettings, resetDatabase, theme, toggleTheme }) {
  const [gasUrl, setGasUrl] = useState(settings.gasUrl || "");
  const [discordWebhook, setDiscordWebhook] = useState(settings.discordWebhook || "");
  const [googleChatWebhook, setGoogleChatWebhook] = useState(settings.googleChatWebhook || "");
  const [periodsPerDay, setPeriodsPerDay] = useState(settings.periodsPerDay || 7);
  const [schoolName, setSchoolName] = useState(settings.schoolName || "대경고등학교");
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected, testing, success, error

  const handleSave = (e) => {
    e.preventDefault();
    saveSettings({
      gasUrl,
      discordWebhook,
      googleChatWebhook,
      periodsPerDay: Number(periodsPerDay),
      schoolName
    });
    alert("설정이 저장되었습니다!");
  };

  const handleTestConnection = async () => {
    if (!gasUrl) {
      alert("검증할 GAS URL을 입력해 주세요.");
      return;
    }
    setConnectionStatus("testing");
    try {
      const response = await fetch(`${gasUrl}?action=getAllData`);
      if (response.ok) {
        const json = await response.json();
        if (json.status === "success") {
          setConnectionStatus("success");
          alert("연결 성공! 구글 시트 데이터베이스와 정상적으로 동기화가 이루어집니다.");
        } else {
          setConnectionStatus("error");
          alert("GAS 스크립트 실행 오류: 스크립트는 연결되었으나 데이터를 가져오지 못했습니다.");
        }
      } else {
        setConnectionStatus("error");
        alert("서버 연결 실패: URL 주소와 네트워크 연결 상태를 확인해 주세요.");
      }
    } catch (err) {
      console.error(err);
      setConnectionStatus("error");
      alert("연결 실패: 크로스 도메인(CORS) 차단 혹은 잘못된 URL 주소일 수 있습니다.");
    }
  };

  const handleReset = () => {
    if (confirm("경고: 모든 변경 사항과 기존 데이터베이스를 초기화하고 초기 샘플 데이터로 복구하시겠습니까?")) {
      resetDatabase();
      alert("데이터베이스가 초기화되었습니다.");
      window.location.reload();
    }
  };

  return (
    <div className="fade-in">
      <div className="view-header">
        <div className="view-title">
          <h1>환경 설정</h1>
          <p>구글 스프레드시트 DB(GAS API) 연동, 메신저 알림 연계, 다크 모드 등 시스템 환경 변수를 조율합니다.</p>
        </div>
      </div>

      <div className="layout-split">
        {/* Left Side: Forms */}
        <div>
          <div className="card">
            <div className="card-title">
              <SettingsIcon size={20} />
              <span>시스템 일반 설정</span>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">학교명 설정</label>
                <input
                  type="text"
                  className="form-control"
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">하루 수업 교시 설정</label>
                <select className="form-control" value={periodsPerDay} onChange={e => setPeriodsPerDay(Number(e.target.value))}>
                  <option value={5}>5교시</option>
                  <option value={6}>6교시</option>
                  <option value={7}>7교시</option>
                  <option value={8}>8교시</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: "24px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label className="form-label" style={{ margin: 0 }}>Google Apps Script (GAS) 웹앱 URL</label>
                  <span
                    className={`badge ${
                      connectionStatus === "success"
                        ? "badge-success"
                        : connectionStatus === "error"
                        ? "badge-danger"
                        : connectionStatus === "testing"
                        ? "badge-warning"
                        : "badge-secondary"
                    }`}
                  >
                    {connectionStatus === "success"
                      ? "연결 성공"
                      : connectionStatus === "error"
                      ? "연결 에러"
                      : connectionStatus === "testing"
                      ? "연결 테스트중"
                      : "비활성 (Mock)"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={gasUrl}
                    onChange={e => setGasUrl(e.target.value)}
                  />
                  <button className="btn btn-secondary" type="button" onClick={handleTestConnection}>
                    연결 검증
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "24px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
                <label className="form-label">메신저 알림 웹훅 연계 (선택)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Discord Webhook URL</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={discordWebhook}
                      onChange={e => setDiscordWebhook(e.target.value)}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Google Chat Webhook URL</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://chat.googleapis.com/v1/spaces/..."
                      value={googleChatWebhook}
                      onChange={e => setGoogleChatWebhook(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" type="submit" style={{ width: "100%", justifyContent: "center", marginTop: "24px" }}>
                <Save size={18} />
                <span>환경 설정 변경값 저장</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: DB reset and documentation */}
        <div>
          <div className="card">
            <div className="card-title">
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              <span>테마 설정 및 데이터 관리</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem" }}>어두운 테마 (다크 모드)</span>
                <button className="theme-toggle" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <span style={{ fontSize: "0.9rem", display: "block", marginBottom: "8px" }}>데이터베이스 복구</span>
                <button className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }} onClick={handleReset}>
                  <RefreshCw size={16} />
                  <span>로컬 DB 전체 초기화</span>
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <Info size={20} />
              <span>구글 스프레드시트 연동 방법</span>
            </div>
            
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              <ol style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>구글 스프레드시트를 생성하고 시간표 양식의 시트 5개(교사정보, 교실정보, 학급정보, 시간표, 교체금지 설정)를 구축합니다.</li>
                <li><strong>[확장 프로그램] &gt; [Apps Script]</strong>를 클릭합니다.</li>
                <li>제공 예정인 <strong>`code.gs`</strong> 스크립트를 에디터에 붙여넣습니다.</li>
                <li>오른쪽 위의 <strong>[배포] &gt; [새 배포]</strong>를 클릭하고, 유형을 <strong>[웹앱]</strong>으로 선택합니다.</li>
                <li>액세스 권한이 있는 사용자를 <strong>[모든 사용자(Anyone)]</strong>로 설정하여 배포합니다.</li>
                <li>부여된 웹앱 URL 주소를 복사하여 왼쪽의 <strong>[GAS URL]</strong>란에 붙여넣고 저장하세요!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
