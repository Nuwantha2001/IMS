import React from 'react'
import { NavLink } from 'react-router-dom'
import '../styles/Navbar.css'

const Navbar = () => {
  return (
    <div className="navbar">
        <ul>
            <NavLink to='/admin_dashboard'><li>Dashboard</li></NavLink>
            <NavLink to='/add_interndata'><li>Add New</li></NavLink>
            <NavLink to='/manage_intern'><li>Manage Intern</li></NavLink>
            <NavLink to='/calendar'><li>Calendar</li></NavLink>
            <NavLink to='/uploadexcel'><li>Upload</li></NavLink>
            
            <NavLink to='/'><li>Log out</li></NavLink>
        </ul>
      
    </div>
  )
}

export default Navbar
