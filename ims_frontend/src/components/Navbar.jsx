import React from 'react'
import { NavLink } from 'react-router-dom'
import '../styles/Navbar.css'

const Navbar = () => {
  return (
    <div className="navbar">
        <ul>
            <NavLink to='/attendance'><li>Attendance</li></NavLink>
            <NavLink to='/request'><li>Request</li></NavLink>
            <NavLink to='/m_attendence'><li>Month Summary</li></NavLink>
            
            <NavLink to='/'><li>Log out</li></NavLink>
        </ul>
      
    </div>
  )
}

export default Navbar
