import React, { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import '../styles/Attendance.css';

const Attendance = () => {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [userid, setId] = useState('');
    const [name, setName] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [division, setDivision] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
      const fetchData = async () => {
        try {
            setIsLoading(true);
            const storedUserId = localStorage.getItem("user") || '';
            setId(storedUserId);
            
            if (!storedUserId) {
              setError('No user ID found');
              return;
            }

            const response = await axios.post("http://localhost:5000/attendance", {
                userId: storedUserId,
            });

            if (response.data.success) {
                setName(response.data.name || '');
            } else {
                setError(response.data.message || 'Failed to fetch user data');
            }
        } catch (error) {
          console.error('Error fetching intern data', error);
          setError('Error fetching user data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!userid || !name) {
          alert('Please complete the form');
          return;
        }

        const attendanceData = { 
          date: date || new Date().toISOString().split('T')[0], 
          userId: userid, 
          timeSlot: timeSlot || '', 
          division: division || '' 
        };

        try {
            setIsLoading(true);
            const response = await axios.post('http://localhost:5000/ins_attendance', attendanceData);

            if (response.status === 200) {
                alert('Attendance Submitted Successfully');
                // Reset form after successful submission
                setTimeSlot('');
                setDivision('');
            } else {
                throw new Error(response.data.message || 'Error submitting attendance');
            }
        } catch (error) {
            console.error('Error submitting attendance', error);
            alert(error.message || 'Error submitting attendance');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="att_container">Loading...</div>;
    }

    if (error) {
        return (
            <div className="att_container">
                <div className="error-message">{error}</div>
                <button onClick={() => navigate('/login')}>Go to Login</button>
            </div>
        );
    }

    return (
        <div className="att_container">
            <div className="att_header">
                <h1>Daily Attendance</h1>
            </div>
            <div className="att_form">
                <form onSubmit={handleSubmit}>
                    <label>Date:</label>
                    <input
                        type="date" 
                        name="Date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                    
                    <label>ID:</label>
                    <input 
                        type="text" 
                        name="Id" 
                        value={userid || ''} 
                        readOnly 
                    />
                    
                    <label>Name:</label>
                    <input 
                        type="text" 
                        name="Name" 
                        value={name || ''} 
                        readOnly 
                    />
                    
                    <label>Time Slot:</label>
                    <select 
                        value={timeSlot || ''} 
                        onChange={(e) => setTimeSlot(e.target.value)} 
                        required
                    >
                        <option value="">Select Time Slot</option>
                        <option value="8.00 am - 1.00 pm">8.00 am - 1.00 pm</option>
                        <option value="8.00 am - 5.00 pm">8.00 am - 5.00 pm</option>
                    </select>
                    
                    <label>Division:</label>
                    <select 
                        value={division || ''} 
                        onChange={(e) => setDivision(e.target.value)} 
                        required
                    >
                        <option value="">Select Division</option>
                        <option value="inoc">Inoc</option>
                        <option value="planning">Planning</option>
                    </select>
                    
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Attendance;