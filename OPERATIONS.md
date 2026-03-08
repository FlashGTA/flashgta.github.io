# Lightning AI Consultant - 운영 가이드

> 라이트닝(Lightning) AI 컨설턴트 서비스의 아키텍처, 구축 방법, 비용 구조를 정리한 문서입니다.

---

## 📐 전체 아키텍처 (워크플로우)

```
사용자 브라우저
    │
    ▼
[GitHub Pages] flashgta.github.io
    │  (자동 리다이렉트)
    ▼
[Vercel] flashgta-github-io.vercel.app
    │  (정적 HTML/CSS 서빙)
    │
    ├─── /api/chat (POST)
    │         │
    │         ▼
    │    [Vercel Serverless Function] api/chat.js
    │         │
    │         ▼
    │    [Google Gemini API] gemini-2.5-flash
    │         │  AI 응답 반환
    │         ▼
    │    브라우저에 응답
    │
    └─── /api/send-email (POST)
              │
              ▼
         [Vercel Serverless Function] api/send-email.js
              │
              ▼
         [EmailJS API]
              │  이메일 발송
              ▼
         담당자 이메일 수신
```

---

## 🗂️ 파일 구조

```
flashgta.github.io/
├── index.html          # 메인 랜딩 페이지 + AI 챗봇 UI
├── brand.html          # 브랜드 소개 페이지
├── style.css           # 전체 스타일시트
├── api/
│   ├── chat.js         # Gemini AI 호출 서버리스 함수
│   └── send-email.js   # EmailJS 이메일 발송 서버리스 함수
└── OPERATIONS.md       # 이 문서
```

---

## 🤖 AI 챗봇 대화 흐름 (STEP)

```
STEP 1: inquiry    → Gemini AI와 자유 상담 (3~4회 대화)
                         ↓ [INQUIRY_COMPLETE] 태그 감지
STEP 2: privacy    → 개인정보 수집 동의 (예/아니오)
                         ↓ 동의 시
STEP 3: contact_name  → 이름 수집
                         ↓
STEP 4: contact_info  → 이메일/전화번호 수집 + 이메일 발송
                         ↓
STEP 5: done       → 상담 종료
```

---

## 🔑 필요한 외부 서비스 및 환경변수

### Vercel 환경변수 설정 위치
`Vercel 대시보드 → 프로젝트 → Settings → Environment Variables`

| 환경변수 | 설명 | 발급 위치 |
|----------|------|-----------|
| `GEMINI_API_KEY` | Google Gemini AI API 키 | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `EMAILJS_PUBLIC_KEY` | EmailJS Public Key | [EmailJS 대시보드 > Account](https://dashboard.emailjs.com/admin/account) |
| `EMAILJS_PRIVATE_KEY` | EmailJS Private Key | [EmailJS 대시보드 > Account](https://dashboard.emailjs.com/admin/account) |
| `EMAILJS_SERVICE_ID` | 연결된 이메일 서비스 ID | [EmailJS 대시보드 > Email Services](https://dashboard.emailjs.com/admin) |
| `EMAILJS_TEMPLATE_ID` | 이메일 템플릿 ID | [EmailJS 대시보드 > Email Templates](https://dashboard.emailjs.com/admin) |

---

## 🚀 서버리스 환경 구축 방법 (처음부터)

### 1단계: GitHub 저장소 준비

```bash
git clone https://github.com/FlashGTA/flashgta.github.io.git
cd flashgta.github.io
```

### 2단계: Vercel 배포 설정

1. [vercel.com](https://vercel.com) 에서 GitHub 계정으로 로그인
2. **"Add New Project"** → GitHub 저장소 `flashgta.github.io` 선택
3. **Framework Preset**: `Other` 선택 (정적 사이트)
4. **Build & Output Settings**: 기본값 유지
5. **Deploy** 클릭

> Vercel은 `api/` 폴더 안의 `.js` 파일을 자동으로 서버리스 함수로 인식합니다.
> 별도 설정 없이 `/api/chat`, `/api/send-email` 엔드포인트가 자동 생성됩니다.

### 3단계: Google Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. **"Create API Key"** 클릭
3. 발급된 키를 Vercel 환경변수 `GEMINI_API_KEY`에 등록

### 4단계: EmailJS 설정

1. [EmailJS](https://www.emailjs.com) 회원가입
2. **Email Services** → Gmail 또는 원하는 서비스 연결
3. **Email Templates** → 아래 템플릿 변수를 사용해 템플릿 생성:
   - `{{visitor_name}}` - 문의자 이름
   - `{{contact}}` - 연락처
   - `{{inquiry_summary}}` - 문의 요약
   - `{{full_conversation}}` - 전체 대화 내용
   - `{{date}}` - 문의 일시
4. **Account** 메뉴에서 Public Key / Private Key 복사
5. 모든 키를 Vercel 환경변수에 등록
6. ⚠️ **[중요]** `Account > Security` 에서 **"Allow API access from non-browser environments"** 활성화

### 5단계: GitHub Pages 리다이렉트 설정

`index.html` `<head>` 최상단에 아래 코드가 포함되어 있으면 됩니다:
```html
<meta http-equiv="refresh" content="0; url=https://flashgta-github-io.vercel.app">
<script>window.location.replace('https://flashgta-github-io.vercel.app');</script>
```

### 6단계: 환경변수 등록 후 재배포

Vercel 환경변수 등록 후 반드시 **Redeploy** 해야 적용됩니다:
`Vercel 대시보드 → Deployments → 최신 배포 → Redeploy`

---

## 💰 비용 구조

### 🟢 최소 비용 (테스트/소규모 운영)

| 서비스 | 플랜 | 비용 | 한도 |
|--------|------|------|------|
| **GitHub Pages** | Free | **$0** | 무제한 |
| **Vercel** | Hobby (Free) | **$0** | 서버리스 함수 100GB-hrs/월, 대역폭 100GB/월 |
| **Google Gemini API** | Free Tier | **$0** | 분당 10회, 일 250회 (gemini-2.5-flash 기준) |
| **EmailJS** | Free | **$0** | 월 200건 |
| **합계** | | **$0/월** | |

> ⚠️ 무료 플랜은 **테스트 및 소규모(월 200건 이하 문의)** 에 적합합니다.

### 🟡 적정 비용 (본격 운영 - 중소규모)

| 서비스 | 플랜 | 비용 | 한도 |
|--------|------|------|------|
| **GitHub Pages** | Free | **$0** | 무제한 |
| **Vercel** | Pro | **$20/월** | 서버리스 함수 1,000GB-hrs/월, 대역폭 1TB/월, 커스텀 도메인 지원 |
| **Google Gemini API** | Pay-as-you-go | **~$1~5/월** | 분당 1,000회, 무제한 일일 요청 |
| **EmailJS** | Personal | **$15/월** | 월 1,000건, 비브라우저 환경 허용 |
| **합계** | | **약 $36~40/월** (약 5~6만원) | |

### 🔴 고가용성 비용 (대��모 운영)

| 서비스 | 플랜 | 비용 | 한도 |
|--------|------|------|------|
| **Vercel** | Enterprise | **$500+/월** | SLA 보장, 팀 협업, 고급 분석 |
| **Google Gemini API** | Pay-as-you-go | **$10~50/월** | 트래픽에 따라 변동 |
| **이메일 발송** | AWS SES 또는 SendGrid | **$0.10/1,000건** | 거의 무제한 |
| **합계** | | **$500+/월** | |

---

### 📊 Gemini API 상세 비용 (Pay-as-you-go 기준, gemini-2.5-flash)

| 구분 | 단가 |
|------|------|
| 입력 토큰 (128K 이하) | $0.075 / 1M tokens |
| 출력 토큰 (128K 이하) | $0.30 / 1M tokens |
| 예상 1회 대화 비용 | 약 $0.0003 (0.04원) |
| 월 1,000회 대화 기준 | 약 $0.30 (약 440원) |

---

### 📊 EmailJS vs 대안 서비스 비교

| 서비스 | 무료 한도 | 유료 최저 | 서버사이드 지원 |
|--------|-----------|-----------|----------------|
| **EmailJS** | 200건/월 | $15/월 (1,000건) | ⚠️ 설정 필요 |
| **Resend** | 3,000건/월 | $20/월 (50,000건) | ✅ 기본 지원 |
| **SendGrid** | 100건/일 | $19.95/월 (50,000건) | ✅ 기본 지원 |
| **AWS SES** | 62,000건/월 (EC2 내) | $0.10/1,000건 | ✅ 기본 지원 |
| **Nodemailer + Gmail** | Gmail 한도 (500건/일) | 무료 | ✅ 기본 지원 |

> 💡 **추천**: 본격 운영 시 **Resend** 로 교체 (무료 3,000건, 서버사이드 기본 지원, 간단한 API)

---

## ⚠️ 알려진 제약사항 및 해결 방법

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| Gemini 429 오류 | 무료 티어 분당/일일 한도 초과 | Pay-as-you-go 전환 또는 잠시 대기 |
| EmailJS 비브라우저 오류 | EmailJS 보안 설정 기본값 | EmailJS 대시보드 > Security에서 허용 활성화 |
| 이메일 미수신 | EmailJS 템플릿 변수 불일치 | 템플릿 변수명 확인 (`{{visitor_name}}` 등) |

---

## 🔄 배포 프로세스

```
코드 수정 (GitHub)
    │
    ▼
GitHub main 브랜치 push
    │
    ▼ (자동 감지, 약 1~2분)
Vercel 자동 배포
    │
    ▼
https://flashgta-github-io.vercel.app 적용 완료
```

> Vercel은 GitHub `main` 브랜치에 push 할 때마다 **자동으로 재배포**합니다.
> 환경변수 변경 시에는 수동으로 Redeploy 필요합니다.

---

## 📞 문의

- 서비스 URL: https://flashgta-github-io.vercel.app
- GitHub: https://github.com/FlashGTA/flashgta.github.io
- 담당자: redsunjin@gmail.com
