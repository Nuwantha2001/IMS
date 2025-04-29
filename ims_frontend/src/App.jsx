import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AnimatedBackground from './pages/AnimatedBackground';
import Login from './pages/Login';
import Attendance from './components/Attendance';
import Request from './components/Request';
import Admin_dash from './components/Admin_dash';
import Add_intern from './components/Add_intern';
import Monthly_attendance from './components/Monthly_attendance';
import Manage_intern from './components/Manage_intern';
import A_Calendar from './components/A_Calendar';
import Excel from './components/Excel';
import Payment from './components/Payment';

const App = () => {
  return (
    <AnimatedBackground>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/request" element={<Request />} />
      <Route path="/admin_dashboard" element={<Admin_dash />} />
      <Route path="/add_interndata" element={<Add_intern />} />
      <Route path="/m_attendence" element={<Monthly_attendance />} />
      <Route path="/manage_intern" element={<Manage_intern />} />
      <Route path="/calendar" element={<A_Calendar />} />
      <Route path="/uploadexcel" element={<Excel />} />
      <Route path="/payment" element={<Payment />} />
      
    </Routes>
    </AnimatedBackground>
  );
};

export default App;
