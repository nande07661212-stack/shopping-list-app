# shopping-list-app

간단한 쇼핑리스트 웹 앱입니다. 프레임워크 없이 HTML, CSS, 바닐라 JavaScript로 만들었고 데이터는 브라우저 `localStorage`에 저장됩니다.

## 기능

- 항목 추가 / 삭제
- 체크(구매 완료) 토글
- 체크한 항목 일괄 비우기
- 전체 / 완료 개수 요약
- 새로고침 후에도 목록 유지 (localStorage)
- 다크 모드 대응 (`prefers-color-scheme`)

## 실행 방법

`index.html`을 브라우저에서 열면 됩니다. 별도의 빌드나 서버가 필요 없습니다.

## 파일 구성

- `index.html` — 마크업
- `style.css` — 스타일
- `app.js` — 애플리케이션 로직
