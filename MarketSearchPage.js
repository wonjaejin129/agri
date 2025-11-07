import React, { useState, useEffect, useCallback } from 'react';
import api from './api';

export default function MarketSearchPage() {
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  const [form, setForm] = useState({
    date: today,
    market: '전체',
    cmp: '전체',
    category: '전체',
    item: '전체',
    species: '전체',
    origin: '전체'
  });

  const [options, setOptions] = useState({ markets: [], items: [], corps: [], categories: [], species: [], origins: [] });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/options').then(res => {
      if (res.data.success) setOptions(res.data);
    });
  }, []);

  useEffect(() => {
    if (form.market && form.market !== '전체') {
      api.get('/api/corps-by-market', { params: { market: form.market } })
        .then(res => {
          if (res.data.success) {
            setOptions(prev => ({
              ...prev,
              corps: res.data.corps.map(c => typeof c === 'object' ? c['법인명'] : c)
            }));
            setForm(prev => ({ ...prev, cmp: '전체' }));
          }
        })
        .catch(() => setOptions(prev => ({ ...prev, corps: [] })));
    } else {
      setOptions(prev => ({ ...prev, corps: [] }));
    }
  }, [form.market]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const cleanParams = {};
      for (const key in form) {
        cleanParams[key] = key === 'date' ? form[key].replace(/-/g, '') : form[key];
      }

      const res = await api.get('/api/market', { params: cleanParams });
      const result = res.data?.data;
      setData(Array.isArray(result) ? result : [result].filter(Boolean));
    } catch (error) {
      console.error('[API 오류]', error);
      setData([{ message: '데이터를 불러오지 못했습니다.' }]);
    } finally {
      setLoading(false);
    }
  }, [form]);
/*
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);*/

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">📊 실시간 농산물 경매 현황</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <label className="flex flex-col">
          <span className="text-sm font-semibold">경락일</span>
          <input type="date" name="date" value={form.date} onChange={handleChange} className="border rounded p-2" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold">도매시장</span>
          <select name="market" value={form.market} onChange={handleChange} className="border rounded p-2">
            <option>전체</option>
            {options.markets.map((m, i) => (
              <option key={i} value={typeof m === 'object' ? m.origin_nm : m}>
                {typeof m === 'object' ? m.origin_nm : m}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold">도매법인</span>
          <select name="cmp" value={form.cmp} onChange={handleChange} className="border rounded p-2">
            <option>전체</option>
            {options.corps.map((c, i) => (
              <option key={i} value={typeof c === 'object' ? c.origin_nm : c}>
                {typeof c === 'object' ? c.origin_nm : c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold">부류</span>
          <select name="category" value={form.category} onChange={handleChange} className="border rounded p-2">
            <option>전체</option>
            {options.categories.map((cat, i) => <option key={i}>{cat}</option>)}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold">품목</span>
          <select name="item" value={form.item} onChange={handleChange} className="border rounded p-2">
            <option>전체</option>
            {options.items.map((item, i) => (
              <option key={i} value={typeof item === 'object' ? item.origin_nm : item}>
                {typeof item === 'object' ? item.origin_nm : item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold">품종</span>
          <select name="species" value={form.species} onChange={handleChange} className="border rounded p-2">
            <option>전체</option>
            {options.species.map((s, i) => <option key={i}>{s}</option>)}
          </select>
        </label>
        
       <label className="flex flex-col">
  <span className="text-sm font-semibold">출하지</span>
  <select name="origin" value={form.origin} onChange={handleChange} className="border rounded p-2">
    <option>전체</option>
    {options.origins.map((prov, i) => (
      <option key={i} value={prov}>{prov}</option> // 시도만 표시
    ))}
  </select>
</label>

        <div className="flex items-end">
          <button onClick={handleSearch} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            검색 실행
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">불러오는 중...</p>
      ) : data.length > 0 && !data[0].message ? (
        
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">경락일시</th>
              <th className="border px-2 py-1">도매시장</th>
              <th className="border px-2 py-1">법인</th>
              <th className="border px-2 py-1">부류</th>
              <th className="border px-2 py-1">품목</th>
              <th className="border px-2 py-1">품종</th>
              <th className="border px-2 py-1">출하지</th>
              <th className="border px-2 py-1">단량</th>
              <th className="border px-2 py-1">수량</th>
              <th className="border px-2 py-1">단량당 경락가(원)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="text-center">
                <td className="border px-2 py-1">{`${item.trd_clcln_ymd} ${item.scsbd_dt?.split(' ')[1] || '-'}`}</td>
                <td className="border px-2 py-1">{item.whsl_mrkt_nm || '-'}</td>
                <td className="border px-2 py-1">{item.corp_nm || '-'}</td>
                <td className="border px-2 py-1">{item.gds_lclsf_nm || '-'}</td>
                <td className="border px-2 py-1">{item.gds_mclsf_nm || '-'}</td>
                <td className="border px-2 py-1">{item.gds_sclsf_nm || '-'}</td>
                <td className="border px-2 py-1">{item.plor_nm || '-'}</td>
              {/* 단량 (예: 17kg 상자,그물망) */}
                <td className="border px-2 py-1 text-center">
                   {item.unit_qty && item.unit_nm && item.pkg_nm
                    ? `${Number(item.unit_qty).toFixed(Number.isInteger(Number(item.unit_qty)) ? 0 : 1)}${item.unit_nm} ${item.pkg_nm}`
                   : '-'}
                  </td>


                {/* 수량 */}
                <td className="border px-2 py-1 text-center">
                  {item.qty != null ? Math.floor(item.qty) : '-'}
                </td>

                {/* 단량당 경락가(원) */}
                  <td className="border px-2 py-1">
                    {item.scsbd_prc != null ? `${Math.floor(item.scsbd_prc).toLocaleString()}원`
                    : '-'}
                  </td>

                
                {/* <td className="border px-2 py-1">{`${item.unit_qty} ${item.unit_nm}` || '-'}</td>
                <td className="border px-2 py-1">{item.qty || '-'}</td>
                <td className="border px-2 py-1">{item.scsbd_prc?.toLocaleString() || '-'}원</td> */}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="w-full border text-sm mt-4">
  <thead className="bg-gray-100">
    <tr>
      <th className="border px-2 py-1">경락일시</th>
      <th className="border px-2 py-1">도매시장</th>
      <th className="border px-2 py-1">법인</th>
      <th className="border px-2 py-1">부류</th>
      <th className="border px-2 py-1">품목</th>
      <th className="border px-2 py-1">품종</th>
      <th className="border px-2 py-1">출하지</th>
      <th className="border px-2 py-1">단량</th>
      <th className="border px-2 py-1">수량</th>
      <th className="border px-2 py-1">단량당 경락가(원)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colSpan={13} className="text-center py-4 text-gray-600">
        검색 조건을 선택 후 조회가 가능합니다.
      </td>
    </tr>
  </tbody>
</table>

      )}
    </div>
  );
}