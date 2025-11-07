import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const FindAccountPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('입력하신 이메일로 비밀번호 재설정 링크를 전송했습니다.');
    navigate('/'); // 또는 로그인 페이지로 이동
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-green-700">
          아이디/비밀번호 찾기
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="가입 시 사용한 이메일을 입력하세요."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-4 py-2 border rounded"
            required
          />
          <button
            type="submit"
            className="w-full py-2 bg-green-700 text-white rounded hover:bg-green-800"
          >
            전송
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>입력하신 이메일로 임시 비밀번호 또는 재설정 링크를 보내드립니다.</p>
          <p className="mt-4">
            이미 계정이 있으신가요?{' '}
            <Link to="/" className="text-blue-700">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FindAccountPage;
