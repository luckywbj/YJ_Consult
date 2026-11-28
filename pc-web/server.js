// pc-web/server.js
// 零依赖静态开发预览服务器 + 微信官方云函数代理（tcb/invokecloudfunction）
// 启动命令：node pc-web/server.js [port]
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const ENV_LOCAL_PATH = path.join(ROOT_DIR, '.env.local');

function loadEnvLocal() {
  const parsed = {};
  if (!fs.existsSync(ENV_LOCAL_PATH)) return parsed;
  const lines = fs.readFileSync(ENV_LOCAL_PATH, 'utf8').split(/\r?\n/);
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    parsed[key] = val;
  });
  return parsed;
}

const fileEnv = loadEnvLocal();
function getConfigValue(key, fallback) {
  if (process.env[key] !== undefined && String(process.env[key]).trim() !== '') {
    return String(process.env[key]).trim();
  }
  if (fileEnv[key] !== undefined && String(fileEnv[key]).trim() !== '') {
    return String(fileEnv[key]).trim();
  }
  return fallback;
}

const WX_APP_ID = getConfigValue('WX_APP_ID', 'wx3aa3136395317b1f');
const WX_APP_SECRET = getConfigValue('WX_APP_SECRET', '');
const WX_CLOUD_ENV = getConfigValue('WX_CLOUD_ENV', 'cloud1-d7gf2c2g59cc2a156');
const WX_CLOUD_FUNCTION = getConfigValue('WX_CLOUD_FUNCTION', 'consultApi');
const PORT = Number(process.argv[2] || getConfigValue('PORT', '3280'));

function isProxyConfigured() {
  if (!WX_APP_ID || !WX_APP_SECRET || !WX_CLOUD_ENV) return false;
  if (WX_APP_SECRET.includes('请替换') || WX_APP_SECRET.includes('AppSecret')) return false;
  return true;
}

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const API_CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

let cachedAccessToken = '';
let cachedTokenExpiresAt = 0;

function httpsJsonRequest(url, method = 'GET', bodyObj = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const bodyStr = bodyObj ? JSON.stringify(bodyObj) : '';
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    };
    if (bodyStr) {
      opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          resolve(JSON.parse(text));
        } catch (err) {
          reject(new Error(`微信接口返回非 JSON (${res.statusCode}): ${text.slice(0, 120)}`));
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function translateWxError(errcode, errmsg) {
  if (errcode === 40125) return 'AppSecret 不正确，请核对 pc-web/.env.local 中的 WX_APP_SECRET（可在 mp.weixin.qq.com 开发设置重新生成确认）';
  if (errcode === 40164) return `本机公网 IP 未加入小程序后台 IP 白名单，请在微信公众平台 -> 开发管理 -> 开发设置 -> IP白名单中添加当前公网 IP（详情：${errmsg}）`;
  if (errcode === -501001 || errcode === 47001) return `云开发环境 ID (${WX_CLOUD_ENV}) 或云函数名称 (${WX_CLOUD_FUNCTION}) 不匹配：${errmsg}`;
  return `微信云开发调用失败 (${errcode}): ${errmsg || '未知错误'}`;
}

async function fetchAccessToken(forceRefresh = false) {
  if (!forceRefresh && cachedAccessToken && Date.now() < cachedTokenExpiresAt) {
    return cachedAccessToken;
  }
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(WX_APP_ID)}&secret=${encodeURIComponent(WX_APP_SECRET)}`;
  const res = await httpsJsonRequest(url, 'GET');
  if (!res || !res.access_token) {
    throw new Error(translateWxError(res && res.errcode, res && res.errmsg));
  }
  const expiresIn = Number(res.expires_in) || 7200;
  cachedAccessToken = res.access_token;
  cachedTokenExpiresAt = Date.now() + Math.max(60, expiresIn - 300) * 1000;
  return cachedAccessToken;
}

async function invokeWxCloudFunction(payload) {
  let token = await fetchAccessToken(false);
  let invokeUrl = `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${encodeURIComponent(token)}&env=${encodeURIComponent(WX_CLOUD_ENV)}&name=${encodeURIComponent(WX_CLOUD_FUNCTION)}`;
  let wxRes = await httpsJsonRequest(invokeUrl, 'POST', payload);

  if (wxRes && (wxRes.errcode === 40001 || wxRes.errcode === 42001)) {
    token = await fetchAccessToken(true);
    invokeUrl = `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${encodeURIComponent(token)}&env=${encodeURIComponent(WX_CLOUD_ENV)}&name=${encodeURIComponent(WX_CLOUD_FUNCTION)}`;
    wxRes = await httpsJsonRequest(invokeUrl, 'POST', payload);
  }

  if (!wxRes || (wxRes.errcode !== undefined && wxRes.errcode !== 0)) {
    throw new Error(translateWxError(wxRes && wxRes.errcode, wxRes && wxRes.errmsg));
  }

  let fnData = {};
  if (typeof wxRes.resp_data === 'string' && wxRes.resp_data.trim()) {
    fnData = JSON.parse(wxRes.resp_data);
  } else if (wxRes.resp_data && typeof wxRes.resp_data === 'object') {
    fnData = wxRes.resp_data;
  }
  return fnData;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, API_CORS_HEADERS);
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  const method = (req.method || 'GET').toUpperCase();

  if (urlPath === '/api/proxy-status') {
    return sendJson(res, 200, {
      ok: true,
      configured: isProxyConfigured(),
      appId: WX_APP_ID,
      cloudEnv: WX_CLOUD_ENV,
      functionName: WX_CLOUD_FUNCTION,
      endpoint: '/api/cloud'
    });
  }

  if (urlPath === '/api/cloud') {
    if (method === 'OPTIONS') {
      res.writeHead(204, API_CORS_HEADERS);
      return res.end('');
    }
    if (!isProxyConfigured()) {
      return sendJson(res, 400, {
        ok: false,
        msg: '尚未在 pc-web/.env.local 中配置 WX_APP_SECRET，请填写后重启 node pc-web/server.js'
      });
    }
    try {
      const raw = await readRequestBody(req);
      const bodyPayload = raw ? JSON.parse(raw) : {};
      const authHeader = String(req.headers.authorization || '');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ') && !bodyPayload.token) {
        bodyPayload.token = authHeader.slice(7).trim();
      }
      const fnData = await invokeWxCloudFunction(bodyPayload);
      let status = Number(fnData && fnData.statusCode) || 200;
      if (fnData && !fnData.ok && !fnData.statusCode) {
        const msg = String(fnData.msg || '');
        if (msg.includes('未登录') || msg.includes('过期') || msg.includes('凭证') || msg.includes('停用')) {
          status = 401;
        }
      }
      return sendJson(res, status, fnData);
    } catch (err) {
      return sendJson(res, 502, {
        ok: false,
        msg: err.message || '微信云函数代理转发失败'
      });
    }
  }

  let relPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  relPath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  let filePath = path.join(ROOT_DIR, relPath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      filePath = path.join(ROOT_DIR, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, buf) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Server Error');
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      });
      res.end(buf);
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`岩值咨询 · PC 端交付后台已启动: http://127.0.0.1:${PORT}`);
  if (isProxyConfigured()) {
    console.log(`☁️ 微信云开发官方 API 代理已就绪 (/api/cloud -> ${WX_CLOUD_ENV}/${WX_CLOUD_FUNCTION})`);
  } else {
    console.log(`🧪 当前未填写 WX_APP_SECRET（运行演示模式）。如需实时连通手机云库，请填写 ${ENV_LOCAL_PATH} 后重启服务。`);
  }
});
