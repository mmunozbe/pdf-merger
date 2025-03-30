import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Merge from "./pages/Merge";
import Attach from "./pages/Attach";
import Split from "./pages/Split";
import React from 'react';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/merge" element={<Merge />} />
        <Route path="/attach" element={<Attach />} />
        <Route path="/split" element={<Split />} />
      </Routes>
    </Router>
  );
}

export default App;


