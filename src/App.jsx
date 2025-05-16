import './shared/App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchIdentification from './searchID/SearchIdentification.jsx';
import District from './searchID/District.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchIdentification />} />
        <Route path="/district" element={<District />} />
      </Routes>
    </Router>
  );
}

export default App;
