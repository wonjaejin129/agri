// src/pages/SignUpPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/signup', { email, name, password });
      if (data.success) {
        alert('회원가입 완료! 이제 로그인하세요.');
        navigate('/');
      } else {
        setMsg(data.message || '회원가입 실패');
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
        <h2 className="text-2xl font-bold text-green-700 mb-6">회원가입</h2>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />
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
            {loading ? '가입 중…' : '회원가입 완료'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <button className="text-green-700 underline" onClick={() => navigate('/')}>
            로그인
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
