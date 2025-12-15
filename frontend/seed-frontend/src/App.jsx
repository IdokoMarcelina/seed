import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./contexts/WalletContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Campaigns from "./pages/Campaigns";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="bg-black min-h-screen text-white font-sans">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
