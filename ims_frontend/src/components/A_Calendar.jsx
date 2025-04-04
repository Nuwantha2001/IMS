import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/A_Calendar.css'; 

const A_Calendar = () => {
  const [holidays, setHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHoliday, setSelectedHoliday] = useState('select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch holidays on component mount
  useEffect(() => {
    const fetchHolidays = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/holidays');
        if (!Array.isArray(response.data)) {
          console.error('Unexpected response format:', response.data);
          setHolidays([]);
        } else {
          setHolidays(response.data);
        }
      } catch (err) {
        setError('Failed to fetch holidays');
        console.error('Error fetching holidays:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || selectedHoliday === 'select') {
      setError('Please select both date and holiday');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:5000/ins_holidays', {
        date: selectedDate,
        name: selectedHoliday
      });
      
      // Update local state with new holiday
      setHolidays([...holidays, response.data]);
      setSelectedDate('');
      setSelectedHoliday('select');
      setError('');
    } catch (err) {
      setError('Failed to add holiday');
      console.error('Error adding holiday:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date to display as "Month Day" (e.g., "January 1")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long', day: 'numeric' });
  };

  return (
    <div className='ac_container'>
      <h1>Update Company Holidays</h1>
      
      {error && <div className="ac_error">{error}</div>}
      
      <form onSubmit={handleSubmit} className='ac_form'>
        <div className='ac_form_group'>
          <label htmlFor="date">Select Date</label>
          <input type="date" id="date" name='date' value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required/>
        </div>
        
        <div className='ac_form_group'>
          <label htmlFor="holiday">Holiday Name:</label>
          <select id="holiday" name='holiday' value={selectedHoliday} onChange={(e) => setSelectedHoliday(e.target.value)} required >
            <option value="select">Select Holiday</option>
            <option value="Poya Day">Poya Day</option>
            <option value="Thai Pongal Day">Thai Pongal Day</option>
            <option value="Independence Day">Independence Day</option>
            <option value="New Year Day">New Year Day</option>
            <option value="May Day">May Day</option>
            <option value="Holy Prophet's Birthday">Holy Prophet's Birthday</option>
            <option value="Deepavali">Deepavali Day</option>
            <option value="Christmas">Christmas</option>
            <option value='Special Company Holiday'>Special Company Holiday</option>
            <option value='Mercantile Holiday'>Mercantile Holiday</option>
            <option value="Good Friday">Good Friday</option>
            <option value="Election Day">Election Day</option>
          </select>
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Holiday'}
        </button>
      </form>
      
      <div className='ac_table_container'>
        {isLoading && !holidays.length ? (
          <p>Loading holidays...</p>
        ) : (
          <table className='ac_table'>
            <thead>
              <tr>
                <th>Month</th>
                <th>Date</th>
                <th>Holiday Name</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((holiday, index) => (
                <tr key={index}>
                  <td>{formatDate(holiday.date).split(' ')[0]}</td> {/* Month */}
                  <td>{formatDate(holiday.date).split(' ')[1]}</td> {/* Day */}
                  <td>{holiday.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default A_Calendar;