import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import JobFeed from "./pages/jobFeed";
import ResumeUpload from "./pages/ResumeUpload";
import Applications from "./pages/Applications";
import { useState } from "react";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("user"));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/jobs" /> : <Login setIsLoggedIn={setIsLoggedIn} />
        } />
        <Route path="/resume" element={
          isLoggedIn ? <ResumeUpload /> : <Navigate to="/login" />
        } />
        <Route path="/jobs" element={
          isLoggedIn ? <JobFeed setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/login" />
        } />
        <Route path="/applications" element={
          isLoggedIn ? <Applications /> : <Navigate to="/login" />
        } />
        <Route path="*" element={
          <Navigate to={isLoggedIn ? "/jobs" : "/login"} />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;