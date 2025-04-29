import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, isWithinInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import '../styles/Manage_intern.css';

const Manage_intern = () => {
    const [allInterns, setAllInterns] = useState([]);
    const [editingIntern, setEditingIntern] = useState(null);
    const [viewingIntern, setViewingIntern] = useState(null);
    const [filter, setFilter] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); 
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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'yyyy-MM-dd');
        } catch {
            return dateString;
        }
    };

    const filteredInterns = allInterns.filter(intern => {
        const matchesSearch = !searchTerm || 
            (intern.Name && intern.Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (intern.TR_ID && intern.TR_ID.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
            (intern.Institute && intern.Institute.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (intern.Programme && intern.Programme.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (intern.Mobile_No && intern.Mobile_No.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (intern.Id_No && intern.Id_No.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        const today = new Date();
        const startDate = intern.Start_Date ? parseISO(intern.Start_Date) : null;
        const endDate = intern.End_Date ? parseISO(intern.End_Date) : null;
        
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

        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-').map(Number);
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = new Date(year, month, 0);
            
            if (!startDate || !endDate) return false;
            
            return (startDate <= monthEnd && endDate >= monthStart);
        }

        return true;
    });

    const handleEdit = (intern) => {
        setEditingIntern(intern.TR_ID);
        setViewingIntern(null); // Close view form if open
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

    const handleView = (intern) => {
        if (viewingIntern && viewingIntern.TR_ID === intern.TR_ID) {
            setViewingIntern(null); // Toggle close if already viewing this intern
        } else {
            setViewingIntern(intern);
            setEditingIntern(null); // Close edit form if open
        }
    };

    const closeViewForm = () => {
        setViewingIntern(null);
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
              fetchInterns();
            } else {
              alert(response.data.message || 'Failed to delete intern');
            }
          } catch (error) {
            console.error('Error deleting intern:', error);
            
            if (error.response) {
              console.error('Response data:', error.response.data);
              console.error('Response status:', error.response.status);
              console.error('Response headers:', error.response.headers);
              alert(`Error: ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
              console.error('No response received:', error.request);
              alert('No response from server. Check your network connection.');
            } else {
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
        const dataForExcel = filteredInterns.map(intern => {
            const { Type, Password, no, ...rest } = intern;
            return {
                ...rest,
                Start_Date: intern.Start_Date ? format(parseISO(intern.Start_Date), 'yyyy-MM-dd') : 'N/A',
                End_Date: intern.End_Date ? format(parseISO(intern.End_Date), 'yyyy-MM-dd') : 'N/A',
                Actual_End_Date: intern.Actual_End_Date ? format(parseISO(intern.Actual_End_Date), 'yyyy-MM-dd') : 'N/A',
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
                    <div className="mi_search-bar">
                        <h3>Search:</h3>
                        <input 
                            type="text" 
                            placeholder="Search by name, ID, institute..."
                            value={searchTerm} 
                            onChange={handleSearchChange} 
                            className="mi_search-input"
                        />
                    </div>
                    <h3>Filter by Status:</h3>
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        className="mi_filter-select"
                    >
                        <option value="all">All Interns</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                    <h3>Filter By Month:</h3>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => {
                            setSelectedMonth(e.target.value);
                            setFilter('all'); 
                        }} 
                        className="mi_filter-select" 
                    />
                    {selectedMonth && (
                        <button onClick={() => setSelectedMonth('')} className="mi_clear-btn">Clear</button>
                    )}
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
                            <th>Short Name</th>
                            <th>Mobile No</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInterns.map((intern, index) => (
                            <React.Fragment key={index}>
                                <tr>
                                    <td>{intern.TR_ID}</td>
                                    <td>{intern.Short_Name}</td>
                                    <td>{intern.Mobile_No}</td>
                                    <td>{formatDateForDisplay(intern.Start_Date)}</td>
                                    <td>{formatDateForDisplay(intern.End_Date)}</td>
                                    <td>{intern.Status}</td>
                                    <td>
                                        <button onClick={() => handleView(intern)}>
                                            {viewingIntern && viewingIntern.TR_ID === intern.TR_ID ? 'Hide' : 'View'}
                                        </button>
                                        <button onClick={() => handleEdit(intern)}>Edit</button>
                                        <button onClick={() => handleDelete(intern.TR_ID)}>Delete</button>
                                    </td>
                                </tr>
                                {viewingIntern && viewingIntern.TR_ID === intern.TR_ID && (
                                    <tr className="mi_view-row">
                                        <td colSpan="7">
                                            <div className="mi_view-form">
                                                <h3>Intern Details</h3>
                                                    <div className="mi_form_group">
                                                        <h4>Personal Details</h4> 
                                                        <div className="mi_form_div">
                                                            <label>Intern ID:</label>
                                                            <span>{viewingIntern.TR_ID}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Mr/Mrs:</label>
                                                            <span>{viewingIntern.Mr_Ms}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Name:</label>
                                                            <span>{viewingIntern.Name}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Short Name:</label>
                                                            <span>{viewingIntern.Short_Name}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Name 2:</label>
                                                            <span>{viewingIntern.Name_2}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Address:</label>
                                                            <span>{viewingIntern.Address}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Mobile No:</label>
                                                            <span>{viewingIntern.Mobile_No}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>NIC:</label>
                                                            <span>{viewingIntern.Id_No}</span>
                                                        </div>
                                                    </div>
                                                    <div className='mi_form_group'>
                                                        <h4>Bank Details</h4>
                                                        <div className="mi_form_div">
                                                            <label>Bank:</label>
                                                            <span>{viewingIntern.Bank}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Branch:</label>
                                                            <span>{viewingIntern.Branch}</span>
                                                        </div>
                                                        <div className="mi_form_div"> 
                                                            <label>Account No:</label>
                                                            <span>{viewingIntern.Account_No}</span>
                                                        </div>
                                                    </div>    
                                                    <div className="mi_form_group">
                                                        <h4>Acedemics Details</h4>
                                                        <div className="mi_form_div">
                                                            <label>Institute:</label>
                                                            <span>{viewingIntern.Institute}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Programme:</label>
                                                            <span>{viewingIntern.Programme}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Start Date:</label>
                                                            <span>{formatDateForDisplay(viewingIntern.Start_Date)}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>End Date:</label>
                                                            <span>{formatDateForDisplay(viewingIntern.End_Date)}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Actual End Date:</label>
                                                            <span>{formatDateForDisplay(viewingIntern.Actual_End_Date)}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Extended Period:</label>
                                                            <span>{viewingIntern.Extended_Period}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Category:</label>
                                                            <span>{viewingIntern.Category}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Status:</label>
                                                            <span>{viewingIntern.Status}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mi_form_group">
                                                        <h4>Other Details</h4>
                                                        <div className="mi_form_div">
                                                            <label>Memo No:</label>
                                                            <span>{viewingIntern.Memo_Number}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>CV:</label>
                                                            <span>{viewingIntern.CV}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>NDA:</label>
                                                            <span>{viewingIntern.NDA}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Appointment Letter:</label>
                                                            <span>{viewingIntern.Appointment_Letter}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Certificate:</label>
                                                            <span>{viewingIntern.Certificate}</span>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Reference By:</label>
                                                            <span>{viewingIntern.Reference_By}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mi_form_div">
                                                    </div>
                                                <div className="mi_form-actions">
                                                    <button onClick={closeViewForm}>Close</button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {editingIntern === intern.TR_ID && (
                                    <tr className="mi_editing-row">
                                        <td colSpan="7">
                                            <form onSubmit={handleEditSubmit} className="mi_edit-form">
                                                    <h3>Edit Intern Details</h3>
                                                    <div className="mi_form_group">
                                                        <h4>Personal Details</h4>
                                                        <div className="mi_form_div">
                                                            <label>Mr/Mrs:</label>
                                                            <select name="Mr_Ms" value={editFormData.Mr_Ms} onChange={handleEditFormChange} required>
                                                                <option value="">Select</option>
                                                                <option value="Mr">Mr</option>
                                                                <option value="Ms">Ms</option>
                                                            </select>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Name:</label>
                                                            <input type="text" name="Name" value={editFormData.Name} onChange={handleEditFormChange} required /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Short Name:</label>
                                                            <input type="text" name="Short_Name" value={editFormData.Short_Name} onChange={handleEditFormChange} required /> 
                                                        </div>
                                                        <div className="mi_form_div">   
                                                            <label>Name 2:</label>
                                                            <input type="text" name="Name_2" value={editFormData.Name_2} onChange={handleEditFormChange}/> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Address:</label>
                                                            <input type="text" name="Address" value={editFormData.Address} onChange={handleEditFormChange} required /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Mobile No:</label>
                                                            <input type="text" name="Mobile_No" value={editFormData.Mobile_No} onChange={handleEditFormChange} required /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>NIC:</label>
                                                            <input type="text" name="Id_No" value={editFormData.Id_No} onChange={handleEditFormChange} required /> 
                                                        </div>
                                                    </div>
                                                    <div className="mi_form_group">
                                                        <h4>Acedemics Details</h4>
                                                        <div className="mi_form_div">
                                                            <label>Institute:</label>
                                                            <input type="text" name="Institute" value={editFormData.Institute} onChange={handleEditFormChange} required /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Programme:</label>
                                                            <input type="text" name="Programme" value={editFormData.Programme} onChange={handleEditFormChange} required /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Start Date:</label>
                                                            <input type="date" name="Start_Date" value={editFormData.Start_Date} onChange={handleEditFormChange} required /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>End Date:</label>
                                                            <input type="date" name="End_Date" value={editFormData.End_Date} onChange={handleEditFormChange} required /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Actual End Date:</label>
                                                            <input type="date" name="Actual_End_Date" value={editFormData.Actual_End_Date} onChange={handleEditFormChange}/> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Extended Period:</label>
                                                            <input type="text" name="Extended_Period" value={editFormData.Extended_Period} onChange={handleEditFormChange}/> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Category:</label>
                                                            <select name="Category" value={editFormData.Category} onChange={handleEditFormChange} required>
                                                                <option value="General">General</option>
                                                                <option value="On job">On job</option>
                                                            </select>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Status:</label>
                                                            <select name="Status" value={editFormData.Status} onChange={handleEditFormChange} required>
                                                                <option value="Active">Active</option>
                                                                <option value="Inactive">Inactive</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="mi_form_group">
                                                        <h4>Bank Details</h4>
                                                        <div className="mi_form_div">   
                                                            <label>Bank:</label>
                                                            <input type="text" name="Bank" value={editFormData.Bank} onChange={handleEditFormChange}/> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Branch:</label>
                                                            <input type="text" name="Branch" value={editFormData.Branch} onChange={handleEditFormChange}/> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Account No:</label>
                                                            <input type="text" name="Account_No" value={editFormData.Account_No} onChange={handleEditFormChange} /> 
                                                        </div>
                                                    </div>
                                                    <div className="mi_form_group">
                                                        <h4>Other Details</h4>
                                                        <div className="mi_form_div">
                                                            <label>Memo No:</label>
                                                            <input type="text" name="Memo_Number" value={editFormData.Memo_Number} onChange={handleEditFormChange} /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>CV:</label>
                                                            <input type="text" name="CV" value={editFormData.CV} onChange={handleEditFormChange} /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>NDA:</label>
                                                            <input type="text" name="NDA" value={editFormData.NDA} onChange={handleEditFormChange} /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Appointment Letter:</label>
                                                            <input type="text" name="Appointment_Letter" value={editFormData.Appointment_Letter} onChange={handleEditFormChange} /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Certificate:</label>
                                                            <select name="Certificate" value={editFormData.Certificate} onChange={handleEditFormChange} required>
                                                                <option value="">Select</option>
                                                                <option value="Null">Null</option>
                                                                <option value="Requested">Requested</option>
                                                                <option value="Issued">Issued</option>
                                                            </select>
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Reference By:</label>
                                                            <input type="text" name="Reference_By" value={editFormData.Reference_By} onChange={handleEditFormChange} /> 
                                                        </div>
                                                        <div className="mi_form_div">
                                                            <label>Password:</label>
                                                            <input type="password" name="Password" value={editFormData.Password} onChange={handleEditFormChange} /> 
                                                        </div>
                                                    </div>   
                                                    <div className="mi_form_div">
                                                    </div>
                                                    <div className="mi_form-actions">
                                                        <button type="submit">Save</button>
                                                        <button type="button" onClick={handleCancelEdit}>Cancel</button>
                                                    </div>
                                            </form>
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