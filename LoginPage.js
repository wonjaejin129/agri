// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { setAuthToken } from '../api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/login', { email, password });
      if (data.success) {
        // 서버가 토큰을 준다면 적용(없으면 주석 유지해도 동작)
        if (data.token) setAuthToken(data.token);
        alert('로그인 성공!');
        navigate('/homepage');
      } else {
        setMsg(data.message || '로그인 실패');
      }
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 shadow-lg rounded-xl">
        <h2 className="text-2xl font-bold text-green-700 mb-6">로그인</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />

          {msg && <p className="text-red-600 text-sm">{msg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-green-700 text-white rounded hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <div className="mt-6 flex justify-between text-sm text-gray-500">
          <button type="button" onClick={() => navigate('/signup')}>회원가입</button>
          <Link to="/find-account" className="text-blue-700">아이디/비밀번호 찾기</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
