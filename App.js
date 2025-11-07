import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 페이지 컴포넌트들 import
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import FindAccountPage from './pages/FindAccountPage';
import MarketSearchPage from './pages/MarketSearchPage';
import AuctionPage from './pages/AuctionPage';
import SettlementPage from './pages/SettlementPage';
import ShipmentPage from './pages/ShipmentPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/find-account" element={<FindAccountPage />} />
        <Route path="/market" element={<MarketSearchPage />} />
        <Route path="/auction" element={<AuctionPage />} />
        <Route path="/sales" element={<SettlementPage />} />
        <Route path="/stats" element={<ShipmentPage />} />
      </Routes>
    </Router>
  );
}

export default App;
