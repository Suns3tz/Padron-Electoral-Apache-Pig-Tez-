import './shared/App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchIdentification from './searchID/SearchIdentification.jsx';
import Distrito from './searchID/Distrito.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchIdentification />} />
        <Route path="/distrito" element={<Distrito />} />
      </Routes>
    </Router>
  );
}

export default App;
