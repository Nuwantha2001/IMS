import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, isWithinInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import '../styles/Manage_intern.css';

const Manage_intern = () => {
    const [allInterns, setAllInterns] = useState([]);
    const [editingIntern, setEditingIntern] = useState(null);
    const [filter, setFilter] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [editFormData, setEditFormData] = useState({
        
        Mr_Ms: '', 
        Name: '',
        Short_Name: '',
        Address: '',
        Mobile_No: '',
        Id_No: '',
        Institute: '',
        Programme: '',
        Start_Date: '',
        End_Date: '',
        Actual_End_Date: '',
        Extended_Period: '',
        Category: '',
        Bank: '',
        Branch: '',
        Account_No: '',
        Memo_Number: '',
        Status: '',
        CV: '',
        NDA: '',
        Appointment_Letter: '',
        Certificate: '',
        Reference_By: '',
        Name_2: '',
        Password: ''
    });

    useEffect(() => {
        fetchInterns();
    }, []);

    const fetchInterns = () => {
        axios.get('http://localhost:5000/interns_details')
          .then(response => {
            setAllInterns(Array.isArray(response.data) ? response.data : []);
          })
          .catch(error => {
            console.error('Error fetching interndetails:', error);
          });
    };

    const filteredInterns = allInterns.filter(intern => {
            const today = new Date();
            const startDate = intern.Start_Date ? new Date(intern.Start_Date) : null;
            const endDate = intern.End_Date ? new Date(intern.End_Date) : null;
            
            // Handle status filters
            switch(filter) {
                case 'all':
                    break;
                case 'active':
                    if (intern.Status !== 'Active') return false;
                    break;
                case 'inactive':
                    if (intern.Status !== 'Inactive') return false;
                    break;
                case 'monthly_active':
                    if (intern.Status !== 'Active' || !endDate) return false;
                    if (!isWithinInterval(endDate, {
                        start: today,
                        end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
                    })) return false;
                    break;
            }
    
            // Handle month filter if selected
            if (selectedMonth) {
                const [year, month] = selectedMonth.split('-').map(Number);
                const monthStart = new Date(year, month - 1, 1);
                const monthEnd = new Date(year, month, 0);
                
                // Check if internship overlaps with selected month
                if (!startDate || !endDate) return false;
                
                // Internship starts before or during the month AND ends after or during the month
                return (startDate <= monthEnd && endDate >= monthStart);
            }
    
            return true;
        });


    const handleEdit = (intern) => {
        setEditingIntern(intern.TR_ID);
        setEditFormData({
            Mr_Ms: intern.Mr_Ms || '',
            Name: intern.Name || '',
            Short_Name: intern.Short_Name || '',
            Address: intern.Address || '',
            Mobile_No: intern.Mobile_No || '',
            Id_No: intern.Id_No || '',
            Institute: intern.Institute || '',
            Programme: intern.Programme || '',
            Start_Date: intern.Start_Date || '',
            End_Date: intern.End_Date || '',
            Actual_End_Date: intern.Actual_End_Date || '',
            Extended_Period: intern.Extended_Period || '',
            Category: intern.Category || '',
            Bank: intern.Bank || '',
            Branch: intern.Branch || '',
            Account_No: intern.Account_No || '',
            Memo_Number: intern.Memo_Number || '',
            Status: intern.Status || '',
            CV: intern.CV || '',
            NDA: intern.NDA || '',
            Appointment_Letter: intern.Appointment_Letter || '',
            Certificate: intern.Certificate || '',
            Reference_By: intern.Reference_By || '',
            Name_2: intern.Name_2 || '',
            Password: intern.Password || ''

            
        });
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({
            ...editFormData,
            [name]: value
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        axios.put(`http://localhost:5000/interns_details/${encodeURIComponent(editingIntern)}`, editFormData)
            .then(response => {
                alert('Intern updated successfully');
                setEditingIntern(null);
                fetchInterns();
            })
            .catch(error => {
                console.error('Error updating intern:', error);
                alert('Error updating intern');
            });
    };

    const handleDelete = async (internId) => {
        if (window.confirm('Are you sure you want to delete this intern?')) {
          try {
            const response = await axios.delete(`http://localhost:5000/interns_details/${encodeURIComponent(internId)}`);
            
            if (response.data.success) {
              alert('Intern deleted successfully');
              fetchInterns(); // Refresh the list
            } else {
              alert(response.data.message || 'Failed to delete intern');
            }
          } catch (error) {
            console.error('Error deleting intern:', error);
            
            // More detailed error logging
            if (error.response) {
              // The request was made and the server responded with a status code
              console.error('Response data:', error.response.data);
              console.error('Response status:', error.response.status);
              console.error('Response headers:', error.response.headers);
              alert(`Error: ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
              // The request was made but no response was received
              console.error('No response received:', error.request);
              alert('No response from server. Check your network connection.');
            } else {
              // Something happened in setting up the request
              console.error('Request setup error:', error.message);
              alert('Error setting up request: ' + error.message);
            }
          }
        }
      };

    const handleCancelEdit = () => {
        setEditingIntern(null);
    };

    const downloadExcel = () => {
        // Prepare data without Status, Password, and Actions
        const dataForExcel = filteredInterns.map(intern => {
            const { Type, Password, no, ...rest } = intern;
            return {
                ...rest,
                Start_Date: intern.Start_Date ? format(new Date(intern.Start_Date), 'yyyy-MM-dd') : 'N/A',
                End_Date: intern.End_Date ? format(new Date(intern.End_Date), 'yyyy-MM-dd') : 'N/A',
                Actual_End_Date: intern.Actual_End_Date ? format(new Date(intern.Actual_End_Date), 'yyyy-MM-dd') : 'N/A',
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Interns");
        XLSX.writeFile(workbook, "Interns_Data.xlsx");
    };

   

    return (
        <div className='mi_dash-container'>
            <div className='mi_interns-table'>
                <h2>Manage Interns Details</h2>
                <div className="mi_filter-controls">
                        <label>Filter by Status:</label>
                        <select 
                            value={filter} 
                            onChange={(e) => setFilter(e.target.value)}
                            className="mi_filter-select"
                        >
                            <option value="all">All Interns</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                        <label>Filter By Month:</label>
                        <input type="month" value={selectedMonth} onChange={(e) => {
                                setSelectedMonth(e.target.value);
                                setFilter('all'); }} className="mi_filter-select" />
                        {selectedMonth && (
                            <button onClick={() => setSelectedMonth('')}className="mi_clear-btn"> Clear</button>)}
                    </div>
                    <div className="mi_download-buttons">
                            <button onClick={downloadExcel} className="mi_download-btn">
                                Download Excel
                            </button>
                        </div>
                <table>
                    <thead>
                        <tr>
                            <th>Intern ID</th>
                            <th>Mr/Mrs</th>
                            <th>Name</th>
                            <th>Short Name</th>
                            <th>Address</th>
                            <th>Mobile No:</th>
                            <th>Id_No</th>
                            <th>Institute</th>
                            <th>Programme</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Actual End Date</th>
                            <th>Extended Period</th>
                            <th>Category</th>
                            <th>Bank</th>
                            <th>Branch</th>
                            <th>Account No:</th>
                            <th>Status</th>
                            <th>Memo No</th>
                            <th>CV</th>
                            <th>NDA</th>
                            <th>Appointment Letter</th>
                            <th>Certificate</th>
                            <th>Reference By</th>
                            <th>Name 2</th>
                            <th>Password</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInterns.map((intern, index) => (
                            <React.Fragment key={index}>
                                {editingIntern === intern.TR_ID ? (
                                    <tr className="mi_editing-row">
                                        <td>{intern.TR_ID}</td>
                                        <td colSpan="14">
                                            <form onSubmit={handleEditSubmit} className="mi_edit-form">
                                                <div className="mi_form-grid">
                                                    <div className="mi_form-group">
                                                        <label>Mr/Mrs:</label>
                                                        <select name="Mr_Ms" value={editFormData.Mr_Ms} onChange={handleEditFormChange} required >
                                                            <option value="">Select</option>
                                                            <option value="Mr">Mr</option>
                                                            <option value="Ms">Ms</option>
                                                        </select>
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Name:</label>
                                                        <input type="text" name="Name" value={editFormData.Name} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Short Name:</label>
                                                        <input type="text" name="Short_Name" value={editFormData.Short_Name} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Address:</label>
                                                        <input type="text" name="Address" value={editFormData.Address} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Mobile No:</label>
                                                        <input type="text" name="Mobile_No" value={editFormData.Mobile_No} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Id_No:</label>
                                                        <input type="text" name="Id_No" value={editFormData.Id_No} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Institute:</label>
                                                        <input type="text" name="Institute" value={editFormData.Institute} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Programme:</label>
                                                        <input type="text" name="Programme" value={editFormData.Programme} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Start Date:</label>
                                                        <input type="date" name="Start_Date" value={editFormData.Start_Date} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>End Date:</label>
                                                        <input type="date" name="End_Date" value={editFormData.End_Date} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Actual End Date:</label>
                                                        <input type="date" name="Actual_End_Date" value={editFormData.Actual_End_Date} onChange={handleEditFormChange} />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Extended Period:</label>
                                                        <input type="text" name="Extended_Period" value={editFormData.Extended_Period} onChange={handleEditFormChange}/>
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Category:</label>
                                                        <select name="Category" value={editFormData.Category} onChange={handleEditFormChange} required>
                                                            <option value="">Select</option>
                                                            <option value="General">General </option>
                                                            <option value="On Job">On Job </option>
                                                        </select>
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Bank:</label>
                                                        <input type="text" name="Bank" value={editFormData.Bank} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Branch:</label>
                                                        <input type="text" name="Branch" value={editFormData.Branch} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Account No:</label>
                                                        <input type="text" name="Account_No" value={editFormData.Account_No} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Memo No:</label>
                                                        <input type="text" name="Memo_Number" value={editFormData.Memo_Number} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Status:</label>
                                                        <select name="Status" value={editFormData.Status} onChange={handleEditFormChange} required>
                                                            <option value="Active">Active</option>
                                                            <option value="Inactive">Inactive</option>
                                                        </select>
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>CV:</label>
                                                        <input type="text" name="CV" value={editFormData.CV} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>NDA:</label>
                                                        <input type="text" name="NDA" value={editFormData.NDA} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Appointment Letter:</label>
                                                        <input type="text" name="Appointment_Letter" value={editFormData.Appointment_Letter} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Certificate:</label>
                                                        <select name="Certificate" value={editFormData.Certificate} onChange={handleEditFormChange} required>
                                                            <option value="">Selecte </option>
                                                            <option value="Null">Null </option>
                                                            <option value="Requested">Requested </option>
                                                            <option value="Issued">Issued </option>
                                                        </select>
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Reference By:</label>
                                                        <input type="text" name="Reference_By" value={editFormData.Reference_By} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Name2:</label>
                                                        <input type="text" name="Name_2" value={editFormData.Name_2} onChange={handleEditFormChange} required />
                                                    </div>
                                                    <div className="mi_form-group">
                                                        <label>Password:</label>
                                                        <input type="text" name="Password" value={editFormData.Password} onChange={handleEditFormChange} required />
                                                    </div>
                                                </div>
                                                <div className="mi_form-actions">
                                                    <button type="submit">Save</button>
                                                    <button type="button" onClick={handleCancelEdit}>Cancel</button>
                                                </div>
                                            </form>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr>
                                        <td>{intern.TR_ID}</td>
                                        <td>{intern.Mr_Ms}</td>
                                        <td>{intern.Name}</td>
                                        <td>{intern.Short_Name}</td>
                                        <td>{intern.Address}</td>
                                        <td>{intern.Mobile_No}</td>
                                        <td>{intern.Id_No}</td>
                                        <td>{intern.Institute}</td>
                                        <td>{intern.Programme}</td>
                                        <td>{intern.Start_Date}</td>
                                        <td>{intern.End_Date}</td>
                                        <td>{intern.Actual_End_Date}</td>
                                        <td>{intern.Extended_Period}</td>
                                        <td>{intern.Category}</td>
                                        <td>{intern.Bank}</td>
                                        <td>{intern.Branch}</td>
                                        <td>{intern.Account_No}</td>
                                        <td>{intern.Status}</td>
                                        <td>{intern.Memo_Number}</td>
                                        <td>{intern.CV}</td>
                                        <td>{intern.NDA}</td>
                                        <td>{intern.Appointment_Letter}</td>
                                        <td>{intern.Certificate}</td>
                                        <td>{intern.Reference_By}</td>
                                        <td>{intern.Name_2}</td>
                                        <td>{intern.Password}</td>
                                        <td>
                                            <button onClick={() => handleEdit(intern)}>Edit</button>
                                            <button onClick={() => handleDelete(intern.TR_ID)}>Delete</button>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Manage_intern;