# shopping-list-app

간단한 쇼핑리스트 웹 앱입니다. 프레임워크 없이 HTML, CSS, 바닐라 JavaScript로 만들었고 데이터는 Supabase(Postgres) 데이터베이스에 저장됩니다.

## 기능

- 항목 추가 / 삭제 / 인라인 수정
- 체크(구매 완료) 토글
- 체크한 항목 일괄 비우기
- 전체 / 완료 개수 요약
- 새로고침 후에도 목록 유지 (Supabase에 저장)
- 다크 모드 대응 (`prefers-color-scheme`)

## 실행 방법

`index.html`을 브라우저에서 열면 됩니다. 별도의 빌드나 서버가 필요 없습니다.

## 데이터 저장

- `index.html`의 인라인 스크립트에서 `window.SUPABASE_URL` / `window.SUPABASE_ANON_KEY`를 설정합니다.
- `app.js`는 Supabase 테이블 `shopping_items_2`(컬럼: `id`, `text`, `checked`, `created_at`)에 항목을 저장합니다.
- anon(publishable) 키는 클라이언트에 노출되어도 안전하며, 해당 테이블의 Row Level Security 정책으로 보호됩니다.
- Supabase 설정이나 CDN 스크립트가 없으면 `db`가 `null`이 되어 모든 동작이 콘솔 로그만 남기고 무시됩니다.

## 파일 구성

- `index.html` — 마크업 + Supabase 부트스트랩 설정
- `style.css` — 스타일
- `app.js` — 애플리케이션 로직 (Supabase 연동)
