/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import api from './api';
import dayjs from 'dayjs';
export default function ShipmentPage() {
  const [form, setForm] = useState({
    shipment_date: '',
    shipper_name: '',
    product_name: '',
    species: '',
    unit_weight: '',
    quantity: '',
    total_boxes: ''
  });

  const [data, setData] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  

  const handleDelete = async () => {
  if (!selectedId) return alert('삭제할 항목을 선택하세요.');
  try {
    await api.delete(`/api/shipment/${selectedId}`);
    alert('✅ 삭제 완료');
    setSelectedId(null);
    fetchData(); // 테이블 새로고침
  } catch (error) {
    alert('❌ 삭제 실패');
    console.error(error);
  }
};



  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  if (!dateStr.includes('-') && dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6)}`;
  }
  return dateStr.split('T')[0];
};



  const handleSubmit = async () => {
  try {
    await api.post('/api/shipment-log', {
      ...form,
       shipment_date: formatDate(form.shipment_date),
    });

    alert('✅ 저장 성공');
    setForm({
      shipment_date: '',
      shipper_name: '',
      product_name: '',
      species: '',
      unit_weight: '',
      quantity: '',
      total_boxes: ''
    });
    fetchData();
    
  } catch (error) {
    console.error('출하 정보 저장 실패:', error);
    alert('저장 실패');
  }
};


  const fetchData = async () => {
    try {
      const res = await api.get('/api/shipment-log');
      setData(res.data.data);
    } catch (error) {
      console.error('출하 정보 조회 실패:', error);
    }
  };

const handleSearch = async () => {
  try {
    const res = await api.get('/api/shipment-log');
    const filtered = res.data.data.filter(item => {
      const matchDate = !form.shipment_date || item.shipment_date === formatSearchDate(form.shipment_date);
      const matchShipper = !form.shipper_name || item.shipper_name.includes(form.shipper_name);
      const matchSpecies = !form.species || item.species.includes(form.species);
      return matchDate && matchShipper && matchSpecies;
    });
     setData(filtered);
  } catch (error) {
    alert('❌ 검색 실패');
    console.error(error);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📦 출하일지
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <label className="flex flex-col">
          <span className="text-sm font-semibold">출하일</span>
          <input
  type="text"
  name="shipment_date"
  placeholder="예: 20250612"
  value={form.shipment_date}
  onChange={(e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8); // 숫자만
    let formatted = raw;
    if (raw.length === 8) {
      formatted = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    }
    setForm({ ...form, shipment_date: formatted });
  }}
  className="border rounded p-2"
/>
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold">출하주명</span>
          <input name="shipper_name" value={form.shipper_name} onChange={handleChange} className="border rounded p-2" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold">물품명</span>
          <input name="product_name" value={form.product_name} onChange={handleChange} className="border rounded p-2" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold">품종</span>
          <input name="species" value={form.species} onChange={handleChange} className="border rounded p-2" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold">단량 (예: 4kg)</span>
          <input name="unit_weight" value={form.unit_weight} onChange={handleChange} className="border rounded p-2" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold">수량 (개수)</span>
          <input name="quantity" value={form.quantity} onChange={handleChange} className="border rounded p-2" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold">총 상자 수</span>
          <input name="total_boxes" value={form.total_boxes} onChange={handleChange} className="border rounded p-2" />
        </label>
        <div className="flex items-end">
          <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full">저장</button>
        </div>
      </div>
      <div className="flex justify-between items-center w-full mb-4">
  {/* 왼쪽: 검색 버튼 */}
  <button
    onClick={handleSearch}
    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
  >
    검색
  </button>

  {/* 오른쪽: 삭제 버튼 */}
  <button
    onClick={handleDelete}
    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
  >
    삭제
  </button>
</div>


      
  

      {/* 저장된 데이터 테이블 */}
      <table className="w-full border text-sm mt-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">출하일</th>
            <th className="border px-2 py-1">출하주명</th>
            <th className="border px-2 py-1">물품명</th>
            <th className="border px-2 py-1">품종</th>
            <th className="border px-2 py-1">단량</th>
            <th className="border px-2 py-1">수량</th>
            <th className="border px-2 py-1">총 상자 수</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id}
      onClick={() => setSelectedId(row.id)} // ✅ 클릭 시 ID 저장
      className={`text-center cursor-pointer ${selectedId === row.id ? 'bg-yellow-100' : ''}`} // ✅ 선택 강조
    >
              <td className="border px-2 py-1">{dayjs(row.shipment_date).format('YYYY-MM-DD')}</td>
              <td className="border px-2 py-1">{row.shipper_name}</td>
              <td className="border px-2 py-1">{row.product_name}</td>
              <td className="border px-2 py-1">{row.species}</td>
              <td className="border px-2 py-1">{row.unit_weight}kg</td>
              <td className="border px-2 py-1">{row.quantity}</td>
              <td className="border px-2 py-1">{row.total_boxes}상자</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
