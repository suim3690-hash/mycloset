# AGENTS.md

## 1. 프로젝트 목적
패션 스타일 다이어리 앱 "나의 옷장" — 데일리 룩을 캘린더로 기록하고,
AI 기반 스타일 분석과 셀프 평가, 스타일 매거진/트렌드 피드를 제공하는
개인용 스타일 다이어리 앱입니다.

## 2. Frontend 기술
- React
- Vite
- 별도 상태관리 라이브러리(Redux 등) 없이 React 기본 state로 구현
- 위치: `front/`

## 3. Backend 기술
- Java 21
- Spring Boot (Gradle)
- MyBatis (SQL 매핑)
- Database: PostgreSQL (Supabase)
- 위치: `back/`

## 4. Backend 기본 구조
```
back/src/main/java/com/mycloset/
  BackApplication.java   # 실행 진입점
  WebConfig.java          # 정적 리소스(/uploads/**) 서빙 설정
  outfit/
    Outfit.java           # 데이터 모델
    OutfitController.java # REST API
    OutfitService.java    # 비즈니스 로직 + 파일 저장
    OutfitMapper.java     # MyBatis 인터페이스
back/src/main/resources/
  application.yml
  mapper/OutfitMapper.xml # SQL 정의
```
기능은 `도메인 패키지(outfit, ...)` 단위로 Controller/Service/Mapper/Model을 함께 두는 구조를 유지합니다. 새 기능을 추가할 때도 이 패턴(패키지당 4개 파일)을 따릅니다.

## 5. REST API 사용
- Frontend ↔ Backend 통신은 REST API(JSON, multipart/form-data)로만 처리합니다.
- 서버사이드 렌더링이나 템플릿 엔진(Thymeleaf 등)은 사용하지 않습니다.
- API prefix는 `/api/{도메인}` 형태를 유지합니다 (예: `/api/outfits`).

## 6. 불필요한 Library 추가 금지
- 기능 구현에 꼭 필요한 경우가 아니면 새 npm/Gradle 라이브러리를 추가하지 않는다.
- 추가가 필요하면 이유를 먼저 설명한다.
- 예: 화면이 몇 개 없는 동안은 React Router, 상태관리 라이브러리를 추가하지 않는다.

## 7. Secret을 코드에 직접 작성하지 않기
- DB 계정/비밀번호 등은 `application.yml`에 하드코딩하지 않고 `${ENV_VAR:기본값}` 형태의 환경변수로 분리한다.
- Firebase 등 외부 서비스 키가 다시 필요해지는 경우도 동일 원칙을 적용한다.

## 8. 기존 파일을 대량으로 삭제하지 않기
- 기존 파일을 대량으로 삭제하거나 구조를 임의로 갈아엎지 않는다.
- 삭제가 필요하면 대상과 이유를 먼저 밝히고, 되돌릴 수 없는 삭제보다는 백업 후 삭제를 우선한다.

## 9. 큰 변경 전에 계획 먼저 설명하기
- 여러 파일에 걸친 변경이나 구조 변경 등 큰 작업은 구현 전에 계획(무엇을, 왜, 어떻게)을 먼저 설명하고 진행한다.

## 10. 구현 후 Build 또는 테스트하기
- Backend: `./gradlew compileJava` (또는 `bootRun`)으로 정상 빌드/실행을 확인한다.
- Frontend: `npm run build` (또는 `npm run dev`)로 정상 빌드/실행을 확인한다.
- 가능하면 실제 API 호출까지 확인한다 (curl 등으로 등록→조회 흐름 검증).

## 11. 변경한 파일을 작업 마지막에 설명하기
- 작업이 끝나면 생성/수정/삭제한 파일 목록과 실행한 명령어, 빌드·테스트 결과를 마지막에 정리해서 보고한다.

## 프로젝트 구조 참고
```
mycloset/
├─ front/     # React + Vite
├─ back/      # Spring Boot + MyBatis
├─ database/  # schema.sql
└─ AGENTS.md
```

# Claude Code

- 큰 변경 작업은 구현 전에 계획을 먼저 제시한다.
- 수정 후 변경된 파일 목록을 알려준다.
- 작업 완료 후 실행한 테스트 결과를 정리한다.
