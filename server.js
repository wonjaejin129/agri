// ✅ .env에서 환경변수 로드
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { pool: db } = require('./config/database');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const dayjs = require('dayjs');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); 


const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.DATA_API_KEY;
const BASE_URL = process.env.BASE_URL;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// ✅ 전역 변수
let whsalMap = {};
let cmpMap = {};
let fullItemData = [];
let originData = [];
let unifiedList = [];

// ✅ MySQL 연결
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '1209',
  database: process.env.DB_NAME || 'testdb',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
  queueLimit: 0,
};

const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL 연결 실패:', err);
  } else {
    console.log('✅ MySQL 연결 성공');
    connection.release();
  }
});

// ✅ CSV 파서
function parseCSV(filePath) {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// ✅ 도매시장 & 법인 코드 로딩
async function loadCodeMaps() {
  const marketPath = path.join(__dirname, 'csv', '도매시장코드.csv');
  const corpPath = path.join(__dirname, 'csv', '법인코드.csv');

  const markets = await parseCSV(marketPath);
  const corps = await parseCSV(corpPath);

  markets.forEach(row => {
    if (row['시장명'] && row['시장코드']) {
      whsalMap[row['시장명'].trim()] = row['시장코드'].trim();
    }
  });

  const cleanKey = key => key.replace(/^\uFEFF/, '');

  corps.forEach(row => {
    const nameKey = cleanKey('법인명');
    const codeKey = cleanKey('법인코드');
    if (row[nameKey] && row[codeKey]) {
      cmpMap[row[nameKey].trim()] = row[codeKey].trim();
    }
  });

  console.log('✅ 도매시장/법인 코드 로딩 완료:', Object.keys(whsalMap).length, Object.keys(cmpMap).length);
}

// ✅ DB 상태 체크 (웹 & 안드로이드 공용 진단용)
app.get('/api/db-health', async (_req, res) => {
  try {
    await db.promise().query('SELECT 1');
    res.json({ success: true });
  } catch (error) {
    console.error('DB 상태 체크 실패:', error);
    res.status(500).json({ success: false, message: 'DB 연결 실패', error: error.message });
  }
});


// ✅ 품목/산지/통합 리스트 로딩
async function loadAllOptions() {
  fullItemData = await parseCSV(path.join(__dirname, 'csv', '품목코드.csv'));
  originData = (await parseCSV(path.join(__dirname, 'csv', '산지코드.csv')))
    .map(row => row['시군구']?.split(' ')[0]).filter(Boolean);
  unifiedList = await parseCSV(path.join(__dirname, 'csv', '도매시장코드 통합.csv'));
}

// ✅ API: 로그인 (bcrypt 비교)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const sql = 'SELECT id, email, name, password FROM users WHERE email = ?';
  db.query(sql, [email?.trim().toLowerCase()], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    if (!results?.length) return res.json({ success: false, message: '존재하지 않는 계정' });

    const user = results[0];
    try {
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.json({ success: false, message: '비밀번호 불일치' });
      // 필요 시 JWT 발급 가능:
      // const token = jwt.sign({ uid: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
});


// ✅ API: 회원가입 (비밀번호 해시 저장)
async function signupHandler(req, res) {
  const { email, name, password } = req.body || {};
  if (!email || !name || !password) {
    return res.status(400).json({ success: false, message: '모든 필드를 입력하세요.' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (email, name, password) VALUES (?, ?, ?)';
    db.query(sql, [email.trim().toLowerCase(), name, hashed], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.json({ success: false, message: '이미 존재하는 이메일' });
        }
        return res.status(500).json({ success: false, message: 'DB 오류' });
      }
      res.json({ success: true });
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

app.post('/signup', signupHandler);
app.post('/api/signup', signupHandler);


// ✅ API: 비밀번호 찾기
app.post('/api/send-reset-email', async (req, res) => {
  const { email } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    if (results.length === 0) return res.json({ success: false, message: '해당 이메일로 등록된 계정이 없습니다.' });

    const user = results[0];
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const mailOptions = {
      from: `"도매가 비교 플랫폼" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '비밀번호 찾기 안내',
      html: `<h3>${user.name}님, 안녕하세요!</h3><p>당신의 비밀번호는 다음과 같습니다:</p><strong>${user.password}</strong><p>보안을 위해 로그인 후 비밀번호를 변경해 주세요.</p>`
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: '메일이 전송되었습니다.' });
    } catch (error) {
      console.error('메일 전송 실패:', error);
      res.status(500).json({ success: false, message: '메일 전송 실패' });
    }
  });
});

// ✅ API: 선택 옵션 제공
app.get('/api/options', (req, res) => {
  const markets = Object.keys(whsalMap);
  const corps = Object.keys(cmpMap);
  const categories = [...new Set(fullItemData.map(i => i['gds_lclsf_nm']).filter(Boolean))];
  const items = [...new Set(fullItemData.map(i => i['gds_mclsf_nm']).filter(Boolean))];
  const species = [...new Set(fullItemData.map(i => i['gds_sclsf_nm']).filter(Boolean))];
  const origins = [...new Set(originData)].filter(Boolean);
  

  res.json({
    success: true,
    markets,
    corps,
    categories,
    items,
    species,
    origins
  });
}); 

// ✅ API: 시장 실시간 시세 조회
app.get('/api/market', async (req, res) => {
  const { date, market, cmp, species, origin } = req.query;
  const SALEDATE = date?.replace(/-/g, '') || dayjs().format('YYYYMMDD');
  

  const targets = [];

  if (market !== '전체') {
    const marketCode = whsalMap[market];
    if (cmp !== '전체') {
      const corpCode = cmpMap[cmp];
      if (marketCode && corpCode) targets.push({ whsal: marketCode, corp: corpCode });
    } else {
      const filtered = unifiedList.filter(r => r['시장명'] === market);
      filtered.forEach(row => {
        const corpCode = cmpMap[row['법인명']];
        if (marketCode && corpCode) targets.push({ whsal: marketCode, corp: corpCode });
      });
    }
  } else {
    unifiedList.forEach(row => {
      const marketCode = whsalMap[row['시장명']];
      const corpCode = cmpMap[row['법인명']];
      if (marketCode && corpCode) targets.push({ whsal: marketCode, corp: corpCode });
    });
  }

  // 디버깅: targets가 비어 있을 경우 기본값 추가
  if (targets.length === 0 && market === '전체') {
    console.log('⚠️ targets가 비어 있음. 기본값으로 테스트.');
    targets.push({ whsal: '380401', corp: '38040101' }); // 예: 서울가락시장 테스트 코드
  }

  //console.log('🔧 조합된 요청 수:', targets.length);

  let allResults = [];

  for (const { whsal, corp } of targets) {
    const params = {
      serviceKey: API_KEY,
      returnType: 'json',
      pageNo: 1,
      numOfRows: 1000,
      //'cond[saledate::EQ]': SALEDATE,
      'cond[gds_lclsf_cd::EQ]': '06', // 과실류
      'cond[gds_mclsf_cd::EQ]': '04', // 복숭아  12번 바나나
      'cond[whsl_mrkt_cd::EQ]': whsal,
      'cond[corp_cd::EQ]': corp
    };
    if (species && species !== '전체') {
  params['cond[gds_sclsf_nm::EQ]'] = species;
}
if (origin && origin !== '전체') {
  params['cond[plor_nm::LIKE]'] = origin;
}



    try {
      const requestUrl = `${BASE_URL}/trades?${new URLSearchParams(params).toString()}`;
      //console.log('요청 URL:', requestUrl);
      const response = await axios.get(requestUrl);
      //console.log('API 응답 전체:', response.data);
      const raw = response.data?.response?.body?.items?.item;
      const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
      //console.log('📋 개별 아이템 목록:', items);
      const enrichedItems = items.map(item => ({
        ...item,
        trd_clcln_ymd: item.trd_clcln_ymd || '-',
        scsbd_dt: item.scsbd_dt || '-',
        whsl_mrkt_nm: item.whsl_mrkt_nm || '-',
        corp_nm: item.corp_nm || '-',
        gds_lclsf_nm: item.gds_lclsf_nm || '-',
        gds_mclsf_nm: item.gds_mclsf_nm || '-',
        gds_sclsf_nm: item.gds_sclsf_nm || '-',
        plor_nm: item.plor_nm || '-',
        unit_qty: item.unit_qty || '-',
        unit_nm: item.unit_nm || '-',
        qty: item.qty || '-',
        scsbd_prc: item.scsbd_prc || '-'
      }));
      allResults = allResults.concat(enrichedItems);
      console.log(`✅ ${whsal}/${corp} 조회 성공: ${items.length}건`);
    } catch (e) {
      console.error(`⚠️ ${whsal}/${corp} 요청 실패:`, e.message, e.response?.data);
    }
  }

  console.log(`📦 ${SALEDATE} 전체 조회 → ${allResults.length}건`);
  res.json({ success: true, data: allResults.length > 0 ? allResults : [{ message: '데이터가 없습니다.' }] });
});

// ✅ API: 시장 정산정보 보기
// ✅ 도매시장 선택 시 해당 시장의 법인 목록 반환
app.get('/api/corps-by-market', (req, res) => {
  const { market } = req.query;
  const filtered = unifiedList.filter(r => r['시장명'] === market);
  const corps = filtered.map(r => r['법인명']);
  
  res.json({ success: true, corps });
});
// ✅ API: 과거 경락 정산 정보 조회
app.get('/api/settlement', async (req, res) => {
  const { date, market, cmp, species, origin } = req.query;
  const SALEDATE = date // ⬅️ 과거일 필수

console.log('📥 [1단계] 요청 파라미터:', req.query);


  if (!SALEDATE) {
    return res.status(400).json({ success: false, message: '정산일(날짜)은 필수입니다.' });
  }

  const targets = [];

  if (market !== '전체') {
    const marketCode = whsalMap[market];
    if (cmp !== '전체') {
      const corpCode = cmpMap[cmp];
      if (marketCode && corpCode) targets.push({ whsal: marketCode, corp: corpCode });
    } else {
      const filtered = unifiedList.filter(r => r['시장명'] === market);
      filtered.forEach(row => {
        const corpCode = cmpMap[row['법인명']];
        if (marketCode && corpCode) targets.push({ whsal: marketCode, corp: corpCode });
      });
    }
  } else {
    unifiedList.forEach(row => {
      const marketCode = whsalMap[row['시장명']];
      const corpCode = cmpMap[row['법인명']];
      if (marketCode && corpCode) targets.push({ whsal: marketCode, corp: corpCode });
    });
  }

console.log('🧩 [2단계] 조합된 요청 targets:', targets);

  
  if (targets.length === 0) {
    console.log('⚠️ 정산 targets 없음 → 기본값 테스트용 추가');
    targets.push({ whsal: '380401', corp: '38040101' }); // 진주/진주원협(공)
  }

  const BASE_URL2 = 'https://apis.data.go.kr/B552845/katSale'; // ✅ 과거 시세 API
  let allResults = [];



  for (const { whsal, corp } of targets) {
    const SALEDATE = date;

    
     let currentPage = 1;
     let totalPages = 1;

  do {
    
    
    const params = {
      serviceKey: API_KEY,
      returnType: 'json',
      pageNo: 1,
      numOfRows: 1000,


      // 올바른 키 (정산정보 전용)
      'cond[trd_clcln_ymd::EQ]': SALEDATE,  // ✅ 필수!
      'cond[whsl_mrkt_cd::EQ]': whsal,
      'cond[corp_cd::EQ]': corp,
      'cond[gds_lclsf_cd::EQ]': '06',  // 과실류
      'cond[gds_mclsf_cd::EQ]': '04',  // 복숭아
    
    };

    if (species && species !== '전체') {
  params['cond[gds_sclsf_nm::EQ]'] = species;
}
if (origin && origin !== '전체') {
  params['cond[plor_nm::LIKE]'] = origin;
}

// const requestUrl = `${BASE_URL2}/trades?${new URLSearchParams(params).toString()}`;
      //console.log('🔗 [3단계] 요청 URL:', requestUrl);

    
    try {
      const requestUrl = `${BASE_URL2}/trades?${new URLSearchParams(params).toString()}`;
      const response = await axios.get(requestUrl);
      const raw = response.data?.response?.body?.items?.item;
      const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
      console.log('📋 개별 아이템 목록:', items);

      const enrichedItems = items.map(item => ({
        ...item,
        trd_clcln_ymd: item.trd_clcln_ymd ,
        //scsbd_dt: item.scsbd_dt || '-',
        whsl_mrkt_nm: item.whsl_mrkt_nm || '-',
        corp_nm: item.corp_nm || '-',
        gds_lclsf_nm: item.gds_lclsf_nm || '-',
        gds_mclsf_nm: item.gds_mclsf_nm || '-',
        gds_sclsf_nm: item.gds_sclsf_nm || '-',
        plor_nm: item.plor_nm || '-',
        unit_qty: item.unit_qty || '-',
        unit_nm: item.unit_nm || '-',
        unit_tot_qty: item.unit_tot_qty || '-',
        lwprc: item.lwprc || '-',
        hgprc: item.hgprc|| '-',
        avgprc: item.avgprc|| '-',
        totprc: item.totprc || '-'
      }));

      const totalCount = response.data?.response?.body?.totalCount || 0;
      totalPages = Math.ceil(totalCount / params.numOfRows);
      currentPage++;

      allResults = allResults.concat(enrichedItems);
      console.log(`📦 정산: ${whsal}/${corp} → ${items.length}건`);
    } catch (e) {
      console.error(`❌ 정산 요청 실패: ${whsal}/${corp}`, e.message);
    }
  } while (currentPage <= totalPages);
} 

  console.log('📤 [5단계] 최종 응답 건수:', allResults.length);

  res.json({
    success: true,
    data: allResults.length > 0 ? allResults : [{ message: '정산 데이터 없음' }]
});
});

// ✅ 출하일지 저장 API
app.post('/api/shipment-log', (req, res) => {
  const { shipment_date, shipper_name, product_name, species, unit_weight, quantity, total_boxes } = req.body;

  const sql = `INSERT INTO shipment_log (shipment_date, shipper_name, product_name, species, unit_weight, quantity, total_boxes) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const values = [shipment_date, shipper_name, product_name, species, unit_weight, quantity, total_boxes];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('❌ 저장 오류:', err);
      return res.status(500).json({ success: false, message: '저장 실패' });
    }
    res.json({ success: true, id: result.insertId });
  });
});

// ✅ 출하일지 전체 조회 API
app.get('/api/shipment-log', (req, res) => {
  db.query('SELECT * FROM shipment_log ORDER BY shipment_date DESC', (err, rows) => {
    if (err) {
      console.error('❌ 조회 오류:', err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, data: rows });
  });
});

// ✅ 출하일지 항목 삭제
app.delete('/api/shipment/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM shipment_log WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send('삭제 실패');
    res.send('삭제 완료');
  });
});

// ✅ 출하일지 항목 조회

app.get('/api/shipment/search', (req, res) => {
  const { shipment_date, shipper, product, species } = req.query;

  let query = 'SELECT * FROM shipment_log WHERE 1=1';
  const values = [];

  if (shipment_date) {
    query += ' AND shipment_date = ?';
    values.push(shipment_date);
  }
  if (shipper) {
    query += ' AND shipper LIKE ?';
    values.push(`%${shipper}%`);
  }
  if (product) {
    query += ' AND product LIKE ?';
    values.push(`%${product}%`);
  }
  if (species) {
    query += ' AND species LIKE ?';
    values.push(`%${species}%`);
  }

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('❌ 검색 오류:', err);
      return res.status(500).send('검색 실패');
    }
    res.json(results);
  });
});




// ✅ 서버 실행
(async () => {
  await loadCodeMaps();
  await loadAllOptions();
  app.listen(PORT, () => {
    console.log(`✅ 전국 실시간 복숭아 경락 서버 실행 중: http://localhost:${PORT}`);
  });
})();
