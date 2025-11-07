import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold text-green-700 mb-6">도매가 비교 플랫폼</h1>

  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
        <button
          onClick={() => navigate('/sales')}
          className="py-6 bg-green-700 text-white rounded-xl shadow-md hover:bg-green-800 text-lg font-semibold"
        >
          정산 정보
        </button>

        <button
          onClick={() => navigate('/market')}
          className="py-6 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 text-lg font-semibold"
        >
          실시간 시세
        </button>

        <button
          onClick={() => navigate('/stats')}
          className="py-6 bg-yellow-500 text-white rounded-xl shadow-md hover:bg-yellow-600 text-lg font-semibold"
        >
          출하 일지
        </button>
      </div>
    </div>
  );
};

export default HomePage;
