import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AuctionPage = () => {
  const [auctionData, setAuctionData] = useState([]);

  useEffect(() => {
    const fetchAuctionData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/auction');
        setAuctionData(response.data.items || []);
      } catch (error) {
        console.error('데이터 가져오기 실패:', error);
      }
    };

    fetchAuctionData();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-green-700 mb-6">실시간 경매 현황</h1>
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-green-100">
            <tr>
              <th className="border px-4 py-2">품목</th>
              <th className="border px-4 py-2">품종</th>
              <th className="border px-4 py-2">단위</th>
              <th className="border px-4 py-2">중량</th>
              <th className="border px-4 py-2">거래단가</th>
              <th className="border px-4 py-2">시장명</th>
              <th className="border px-4 py-2">법인명</th>
              <th className="border px-4 py-2">경락일시</th>
            </tr>
          </thead>
          <tbody>
            {auctionData.map((item, index) => {
 console.log("🔥 auction item:", JSON.stringify(item, null, 2));

  return (
    <tr key={index} className="text-center hover:bg-gray-50">
      <td className="border px-4 py-2">{item.itemName}</td>
      <td className="border px-4 py-2">{item.variety}</td>
      <td className="border px-4 py-2">{item.unit}</td>
      <td className="border px-4 py-2">{item.weight}</td>
      <td className="border px-4 py-2">{item.price}</td>
     <td className="border px-4 py-2">
  {typeof item.market === 'object' && item.market !== null
    ? typeof item.market.origin_nm === 'string'
      ? item.market.origin_nm
      : JSON.stringify(item.market.origin_nm)
    : item.market || '-'}
</td>
<td className="border px-4 py-2">
  {typeof item.corporation === 'object' && item.corporation !== null
    ? typeof item.corporation.origin_nm === 'string'
      ? item.corporation.origin_nm
      : JSON.stringify(item.corporation.origin_nm)
    : item.corporation || '-'}
</td>



      <td className="border px-4 py-2">{item.date}</td>
    </tr>
  );
})}

          </tbody>
        </table>
      </div>
    </div>
  );
};


export default AuctionPage;
