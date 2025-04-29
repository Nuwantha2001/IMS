import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/A_Calendar.css';

const A_Calendar = () => {
  const [holidays, setHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHoliday, setSelectedHoliday] = useState('select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Fetch holidays on component mount
  useEffect(() => {
    const fetchHolidays = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/holidays');
        setHolidays(response.data);
      } catch (err) {
        setError('Failed to fetch holidays');
        console.error('Error fetching holidays:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || selectedHoliday === 'select') {
      setError('Please select both date and holiday');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      if (editingId) {
        // Update existing holiday
        const response = await axios.put(`http://localhost:5000/holidays/${editingId}`, {
          date: selectedDate,
          name: selectedHoliday
        });
        
        setHolidays(holidays.map(holiday => 
          holiday.id === editingId ? response.data : holiday
        ));
        setSuccessMessage('Holiday updated successfully!');
      } else {
        // Add new holiday
        const response = await axios.post('http://localhost:5000/ins_holidays', {
          date: selectedDate,
          name: selectedHoliday
        });
        
        setHolidays([...holidays, response.data]);
        setSuccessMessage('Holiday added successfully!');
      }
      
      // Reset form
      setSelectedDate('');
      setSelectedHoliday('select');
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.error || 
               (editingId ? 'Failed to update holiday' : 'Failed to add holiday'));
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (holiday) => {
    const formattedDate = new Date(holiday.date).toISOString().split('T')[0];
    setSelectedDate(formattedDate);
    setSelectedHoliday(holiday.name);
    setEditingId(holiday.id);
    setError('');
    setSuccessMessage('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        
        await axios.delete(`http://localhost:5000/holidays/${id}`);
        setHolidays(holidays.filter(holiday => holiday.id !== id));
        setSuccessMessage('Holiday deleted successfully!');
        
        // If deleting the holiday being edited, reset form
        if (editingId === id) {
          setSelectedDate('');
          setSelectedHoliday('select');
          setEditingId(null);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete holiday');
        console.error('Error deleting holiday:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long', day: 'numeric' });
  };

  return (
    <div className='ac_container'>
      <h1>Update Company Holidays</h1>
      
      {error && <div className="ac_error">{error}</div>}
      {successMessage && <div className="ac_success">{successMessage}</div>}
      
      <form onSubmit={handleSubmit} className='ac_form'>
        <div className='ac_form_group'>
          <label htmlFor="date">Select Date</label>
          <input 
            type="date" 
            id="date" 
            name='date' 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            required
          />
        </div>
        
        <div className='ac_form_group'>
          <label htmlFor="holiday">Holiday Name:</label>
          <select 
            id="holiday" 
            name='holiday' 
            value={selectedHoliday} 
            onChange={(e) => setSelectedHoliday(e.target.value)} 
            required
          >
            <option value="select">Select Holiday</option>
            <option value="Poya Day">Poya Day</option>
            <option value="Thai Pongal Day">Thai Pongal Day</option>
            <option value="Independence Day">Independence Day</option>
            <option value="New Year Day">Sinhala & Tamil New Year Day</option>
            <option value="May Day">May Day</option>
            <option value="Holy Prophets Birthday">Holy Prophet's Birthday</option>
            <option value="Deepavali">Deepavali Day</option>
            <option value="Christmas">Christmas</option>
            <option value='Special Company Holiday'>Special Company Holiday</option>
            <option value="Good Friday">Good Friday</option>
            <option value='Mercantile Holiday'>Mercantile Holiday</option>
            <option value="Election Day">Election Day</option>
          </select>
        </div>
        
        <div className='ac_form_buttons'>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : editingId ? 'Update Holiday' : 'Add Holiday'}
          </button>
          
          {editingId && (
            <button 
              type="button" 
              onClick={() => {
                setSelectedDate('');
                setSelectedHoliday('select');
                setEditingId(null);
                setError('');
                setSuccessMessage('');
              }}
              className="ac_cancel_button"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((holiday) => (
                <tr key={holiday.id}>
                  <td>{formatDate(holiday.date).split(' ')[0]}</td>
                  <td>{formatDate(holiday.date).split(' ')[1]}</td>
                  <td>{holiday.name}</td>
                  <td className='ac_actions'>
                    <button 
                      onClick={() => handleEdit(holiday)}
                      className="ac_edit_button"
                      disabled={isLoading}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(holiday.id)}
                      className="ac_delete_button"
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </td>
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