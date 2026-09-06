# 🐾 Paw Pass (반려동물 동반 관광지 플랫폼)

반려동물과 함께하는 여행을 더 쉽고 스마트하게 만들어주는 맞춤형 관광지 추천 및 동선 관리 플랫폼입니다.

---

## 🛠️ Tech Stack & Template (기술 스택 및 환경)
* **Framework / Bundler:** React, Vite (HMR 및 ESLint 지원)
* **Available Vite Plugins:** 
  * `@vitejs/plugin-react` (uses [Oxc](https://oxc.rs))
  * `@vitejs/plugin-react-swc` (uses [SWC](https://swc.rs/))
* **State Management:** LocalStorage, React Hooks (`useState`, `useEffect`)
* **Authentication:** `@react-oauth/google` (구글 OAuth 2.0 로그인 및 `jwt-decode`)
* **Data:** Mock JSON datasets (`tourist-spots.json`, `pets.json`, `trips.json`, `favorites.json`, `notices.json`, `faqs.json`)

> **Note on React Compiler & ESLint:**
> * The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [React Compiler Documentation](https://react.dev/learn/react-compiler/installation).
> * If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled (refer to the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts)).

---

## ✨ 구현된 주요 기능 (Progress)

### 1. 🧭 네비게이션 및 공통 레이아웃 (`App.jsx`)
* 상단 네비게이션 바를 통한 주요 페이지 간 빠른 이동 (홈, 프로필 등록, 관광지 탐색, 지도 및 동선, 즐겨찾기, 고객센터)
* **구글 로그인 연동:** `@react-oauth/google`을 활용한 실제 구글 계정 로그인 및 유저 프로필(이름, 사진) 표시, LocalStorage 세션 유지

### 2. 🐶 반려동물 프로필 관리 및 맞춤 추천 (`ProfilePage.jsx`)
* 여러 마리의 반려동물 프로필 등록, 수정 및 삭제 기능
* 생년월일 **연/월/일 드롭다운 선택** UI 적용
* 체중 입력 시 소형/중형/대형 크기 자동 분류 기능 (수동 변경 가능)
* **프로필 등록 완료 팝업 모달:** 등록 직후 해당 반려동물과 함께 갈 수 있는 맞춤 추천 관광지 3개 리스트 노출

### 3. 🔍 관광지 탐색 및 필터링 (`SearchPage.jsx`)
* 키워드 검색창 및 **[검색]** 버튼 구현
* 드롭다운 형식의 상단 필터 바 (지역별, 장소 유형별 필터)
* **반려동물 프로필 연동 필터:** 등록해둔 반려동물 목록을 체크박스로 선택하여 개별/전체 선택 또는 '반려동물 없음' 상태로 맞춤 필터링 조회 가능
* **좌우 2분할 레이아웃:** 왼쪽 목록 카드와 우측 상세 미리보기 패널 연동
* **매칭 상태 한글 표기:** 기획서 기준에 맞추어 `방문 가능` 및 `조건부 방문 가능` 뱃지 디자인 적용

### 4. ❤️ 즐겨찾기(찜하기) 모아보기 (`FavoritesPage.jsx`)
* 관광지 상세 페이지나 탐색 목록에서 찜한 장소들을 LocalStorage 기반으로 모아볼 수 있는 전용 페이지
* 찜 목록 개별 삭제 및 상세 페이지 바로가기 연동

### 5. 💬 고객센터 및 공지/FAQ (`SupportPage.jsx`)
* 공지사항 탭과 자주 묻는 질문(FAQ) 아코디언 토글 형태의 안내 페이지 구축

### 6. 🗺️ 지도 및 동선 화면 (`MapPage.jsx`)
* 위치 기반 및 추천 동선 시뮬레이션 레이아웃 뼈대 구현

---

## 📂 Project Structure (폴더 구조)
```text
paw-pass-frontend/
├── public/
├── src/
│   ├── hooks/          # 커스텀 훅 (관광지 조회, 찜하기 등)
│   ├── mocks/          # 목업 JSON 데이터 (관광지, 펫, 공지 등)
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── HomePage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── SearchPage.jsx
│   │   ├── DetailPage.jsx
│   │   ├── MapPage.jsx
│   │   ├── FavoritesPage.jsx
│   │   └── SupportPage.jsx
│   ├── App.jsx         # 라우팅 및 전역 네비게이션/로그인 상태 관리
│   ├── main.jsx        # GoogleOAuthProvider 래퍼 설정
│   └── index.css
├── .env                # 구글 클라이언트 ID 환경 변수
└── package.json

🚀 Getting Started (실행 방법)
1. 저장소 클론 및 패키지 설치
git clone [https://github.com/Smaseeun2/paw-pass-frontend.git](https://github.com/Smaseeun2/paw-pass-frontend.git)
cd paw-pass-frontend
npm install

2. 라이브러리 추가 설치 (필요 시)
npm install @react-oauth/google jwt-decode

3. 환경 변수 설정 (.env)
프로젝트 루트에 .env 파일을 만들고 구글 클라이언트 ID를 입력합니다.
VITE_GOOGLE_CLIENT_ID=본인의_구글_클라이언트_ID.apps.googleusercontent.com

4. 개발 서버 실행
npm run dev