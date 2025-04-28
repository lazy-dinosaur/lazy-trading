import fs from 'fs';
import path from 'path';

// 기본 매니페스트 템플릿
const baseManifest = {
  manifest_version: 3,
  name: "LazyTrading",
  icons: {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  action: {
    default_icon: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  version: "1.0.0",
  side_panel: {
    default_path: "index.html"
  },
  background: {
    service_worker: "background.js",
    type: "module"
  },
  permissions: [
    "storage",
    "unlimitedStorage",
    "declarativeNetRequest",
    "declarativeNetRequestFeedback",
    "sidePanel"
  ],
  host_permissions: [
    "https://*.binance.vision/*",
    "https://testnet.binance.vision/*",
    "https://testnet.binancefuture.com/*",
    "https://*.binancefuture.com/*",
    "https://api.bitget.com/*",
    "https://*.bitget.com/*",
    "https://api.binance.com/*",
    "https://*.binance.com/*",
    "https://api.bybit.com/*",
    "https://*.bybit.com/*",
    "https://api-testnet.bybit.com/*",
    "https://api.okx.com/*",
    "https://*.okx.com/*",
    "https://api.huobi.com/*",
    "https://*.huobi.com/*",
    "https://api.kucoin.com/*",
    "https://*.kucoin.com/*"
  ],
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.binance.com wss://*.binance.com https://*.bybit.com wss://*.bybit.com https://*.bitget.com wss://*.bitget.com https://*.okx.com https://*.huobi.com https://*.kucoin.com https://*.binance.vision https://testnet.binance.vision https://testnet.binancefuture.com https://*.binancefuture.com https://api-testnet.bybit.com"
  },
  declarative_net_request: {
    rule_resources: [
      {
        id: "ruleset_1",
        enabled: true,
        path: "rules.json"
      }
    ]
  }
};

// 다국어 설명
const descriptions = {
  ko: "Binance, Bybit, Bitget 거래소 연동으로 암호화폐 거래에서 안전한 매매 진입을 도와주는 크롬 확장 프로그램입니다.",
  en: "A Chrome extension that helps with safe trade entry in cryptocurrency trading by connecting to Binance, Bybit, and Bitget exchanges."
};

// 디렉토리 생성 함수
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 한국어 매니페스트 생성
const generateKoreanManifest = () => {
  const manifest = { ...baseManifest, description: descriptions.ko };
  const outputDir = path.resolve(__dirname, '../dist');
  ensureDir(outputDir);
  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('Korean manifest generated.');
};

// 영어 매니페스트 생성
const generateEnglishManifest = () => {
  const manifest = { ...baseManifest, description: descriptions.en };
  const outputDir = path.resolve(__dirname, '../dist_en');
  ensureDir(outputDir);
  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('English manifest generated.');
};

// 기본 매니페스트 생성 (개발용)
const generateDefaultManifest = () => {
  const outputDir = path.resolve(__dirname, '../public');
  ensureDir(outputDir);
  // 이미 존재하는 manifest.json 파일을 복사
  try {
    const existingManifest = JSON.parse(fs.readFileSync(path.join(outputDir, 'manifest.json'), 'utf8'));
    // default_locale 필드 추가
    const updatedManifest = { 
      ...existingManifest,
      default_locale: "ko"
    };
    fs.writeFileSync(
      path.join(outputDir, 'manifest.json'),
      JSON.stringify(updatedManifest, null, 2)
    );
    console.log('Default manifest updated with default_locale.');
  } catch (error) {
    console.error('Error updating manifest:', error);
  }
};

// 모든 매니페스트 생성
const generateAllManifests = () => {
  generateDefaultManifest();
  generateKoreanManifest();
  generateEnglishManifest();
};

// 스크립트 직접 실행 시 모든 매니페스트 생성
if (require.main === module) {
  generateAllManifests();
}

export { generateAllManifests, generateKoreanManifest, generateEnglishManifest };
