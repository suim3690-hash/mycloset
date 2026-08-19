# AGENTS.md

## 프로젝트 목적
패션 스타일 다이어리 앱 "나의 옷장" — 데일리 룩을 캘린더로 기록하고,
AI 기반 스타일 분석과 셀프 평가, 스타일 매거진/트렌드 피드를 제공하는
개인용 스타일 다이어리 앱입니다.

## 기술 스택
- Frontend: Flutter (Dart)
- Backend: Firebase (Authentication, Firestore, Storage)

## 작업 원칙

1. **Secret 관리**
   Firebase API Key 등 민감 정보는 코드에 직접 작성하지 않는다.
   `firebase_options.dart`, `.env` 등 설정 파일은 `.gitignore`로 관리하고
   저장소에 커밋하지 않는다.

2. **패키지 추가 최소화**
   기능 구현에 꼭 필요한 경우가 아니면 새 pub 패키지를 추가하지 않는다.
   추가가 필요하면 이유를 먼저 설명한다.

3. **기존 파일 보호**
   기존 파일을 대량으로 삭제하거나 구조를 임의로 갈아엎지 않는다.
   삭제가 필요하면 대상과 이유를 먼저 밝힌다.

4. **큰 변경 전 계획 공유**
   여러 파일에 걸친 변경이나 구조 변경 등 큰 작업은 구현 전에
   계획(무엇을, 왜, 어떻게)을 먼저 설명하고 진행한다.

5. **구현 후 검증**
   기능 구현 또는 수정 후에는 `flutter analyze`, `flutter test`,
   가능하면 `flutter build`(또는 `run`)로 정상 동작을 확인한다.

6. **변경 사항 요약**
   작업이 끝나면 생성/수정/삭제한 파일 목록과 실행한 명령어,
   빌드·테스트 결과를 마지막에 정리해서 보고한다.

## 프로젝트 구조 참고
- `lib/app.dart` — 앱 루트 위젯
- `lib/core/firebase/` — Firebase 초기화/공통 wrapper
- `lib/features/{auth,calendar,style_analysis,magazine}/` — 기능별 모듈
  (`data/`, `presentation/`, `models/`)

# Claude Code

- 큰 변경 작업은 구현 전에 계획을 먼저 제시한다.
- 수정 후 변경된 파일 목록을 알려준다.
- 작업 완료 후 실행한 테스트(빌드) 결과를 정리한다.
