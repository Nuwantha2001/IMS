import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import '../styles/Payment_M.css'; 

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Payment_M = () => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [month1, setMonth1] = useState(new Date().toISOString().slice(0, 7));
    const [year, setYear] = useState(new Date().getFullYear());
    const [interns, setInterns] = useState([]); //
    const [paymentdata, setPaymentdata] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [totalAllowance, setTotalAllowance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    // Form state
    const [formData, setFormData] = useState({
        internId: '',
        name: '',
        workedDays: '',
        holidays: '',
        leaveDays: '',
        allowance: ''
    });

     // Update your useEffect for fetching payment data
    useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
        const paymentRes = await axios.get(`http://localhost:5000/api/payments_month/${month1}`);
        if (paymentRes.data && Array.isArray(paymentRes.data)) {
            setPaymentdata(paymentRes.data);
            const total = paymentRes.data.reduce((acc, item) => acc + (parseFloat(item.allowance) || 0), 0);
            setTotalAllowance(total);
        }
        } catch (err) {
        console.error("Error fetching data:", err);
        const errorMsg = err.response?.data?.error || err.message;
        setError(`Failed to load payment data: ${errorMsg}`);
        if (err.response?.data?.details) {
            console.error("Server details:", err.response.data.details);
        }
        } finally {
        setLoading(false);
        }
    };

    fetchData();
    }, [month1]); // Changed dependency to month1

    useEffect(() => {
        const fetchInternData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`http://localhost:5000/api/interns/active`);
                if (response.data && Array.isArray(response.data)) {
                    setInterns(response.data); 
                    if (response.data.length > 0) {
                        setFormData(prev => ({
                            ...prev,
                            internId: response.data.TR_ID,
                            name: response.data.Short_Name
                        }));
                    }
                }
            } catch (err) {
                console.error("Error fetching intern data:", err);
                setError('Failed to load intern data');
            } finally {
                setLoading(false);
            }
        };
            fetchInternData();
    }, []);

    const handleInternChange = (e) => {
        const selectedInternId = e.target.value;
        const selectedIntern = interns.find(intern => intern.TR_ID === selectedInternId);
        
        setFormData(prev => ({
            ...prev,
            internId: selectedInternId,
            name: selectedIntern ? selectedIntern.Short_Name : ''
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCalculate = () => {
        const dateofmonth = parseInt(formData.workedDays) + parseInt(formData.holidays) +  parseInt(formData.leaveDays);
        const amountperday = 10000 / dateofmonth;
        const countofday = parseInt(formData.workedDays) + parseInt(formData.holidays);
        const amount = Math.round(amountperday * countofday);

     const calculatedAllowance = parseFloat(amount);
        
        setFormData(prev => ({
            ...prev,
            allowance: calculatedAllowance
        }));
    };

    const handleEdit = (record) => {
    // Set the form data with the record you want to edit
    setFormData({
        internId: record.tr_id,
        name: record.name,
        workedDays: record.workday,
        holidays: record.holiday,
        leaveDays: record.leave,
        allowance: record.allowance
    });
    
    // Set the month to the record's month
    setMonth(record.month);
    
    // Scroll to the form section for better UX
    document.querySelector('.M_py-section_3').scrollIntoView({ behavior: 'smooth' });
    };

    const handleDelete = async (internId, month) => {
        if (window.confirm('Are you sure you want to delete this payment record?')) {
            try {
                const response = await axios.delete(`http://localhost:5000/api/payments`, {
                    data: { internId, month }
                });
                
                if (response.data.success) {
                    // Refresh the payment data
                    const paymentRes = await axios.get(`http://localhost:5000/api/payments_month/${month1}`);
                    setPaymentdata(paymentRes.data);
                    alert('Payment record deleted successfully!');
                } else {
                    throw new Error(response.data.message);
                }
            } catch (err) {
                console.error("Error deleting payment:", err);
                setError(err.message || 'Failed to delete payment record');
                alert(`Error: ${err.message}`);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const isEdit = paymentdata.some(
                record => record.tr_id === formData.internId && record.month === month
            );

            let response;
            if (isEdit) {
                // Update existing record
                response = await axios.put('http://localhost:5000/api/payments', {
                    internId: formData.internId,
                    month: month,
                    name: formData.name,
                    workedDays: formData.workedDays,
                    holidays: formData.holidays,
                    leaveDays: formData.leaveDays,
                    allowance: formData.allowance
                });
            } else {
                // Create new record
                response = await axios.post('http://localhost:5000/api/payments', {
                    internId: formData.internId,
                    month: month,
                    name: formData.name,
                    workedDays: formData.workedDays,
                    holidays: formData.holidays,
                    leaveDays: formData.leaveDays,
                    allowance: formData.allowance
                });
            }

            if (response.data.success) {
                // Refresh payment data
                //const paymentRes = await axios.get(`http://localhost:5000/api/payments_month/${month1}`);
                //setPaymentdata(paymentRes.data);
                
                // Reset form
                setFormData({
                    internId: interns.length > 0 ? interns[0].TR_ID : '',
                    name: interns.length > 0 ? interns[0].Short_Name : '',
                    workedDays: '',
                    holidays: '',
                    leaveDays: '',
                    allowance: ''
                });
                
                alert(`Payment data ${isEdit ? 'updated' : 'saved'} successfully!`);
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            console.error("Error submitting payment:", err);
            setError(err.message || 'Failed to submit payment data');
            alert(`Error: ${err.message}`);
        }
    };

    const handleClear = () => {
        setFormData({
            internId: '',
            name: '',
            workedDays: '',
            holidays: '',
            leaveDays: '',
            allowance: ''
        });
    };

    useEffect(() => {
        const fetchYearlyData = async () => {
            setChartLoading(true);
            try {
                const response = await axios.get(`http://localhost:5000/api/payments_summary/${year}`);
                if (response.data && Array.isArray(response.data)) {
                    setMonthlyData(response.data);
                }
            } catch (err) {
                console.error("Error fetching yearly data:", err);
                // Don't show error in UI for chart to avoid confusion
            } finally {
                setChartLoading(false);
            }
        };

        fetchYearlyData();
    }, [year]);

    // Prepare chart data
    const chartData = {
        labels: monthlyData.map(item => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return monthNames[parseInt(item.month.slice(5, 7)) - 1];
            
        }),
        datasets: [
            {
                label: 'Monthly Allowance (Rs)',
                data: monthlyData.map(item => item.totalPay ),
                backgroundColor: '#0069d9ca',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Amount (Rs)'
                }
            }
        }
    };

    return (
        <div className="M_py-container">
            <div className="M_py-container-header">
                <h1>Intern Allowance</h1>
                <div>
                <button onClick={() => navigate('/payment_m')} className='M_py-btn_1'> View Allowance</button>
                </div>
            </div>
            

            <div className="M_py-section_1">
                <div className="M_py-chart-section">
                    <div className="M_py-selection">
                        <h2>Monthly Allowance Overview</h2>
                        <div className="M_py-c-group">
                            <label>Year:</label>
                            <input 
                                type='number' 
                                value={year} 
                                onChange={(e) => setYear(e.target.value)}
                                className="M_py-c-control"
                            />
                        </div>
                    </div>
                    {chartLoading ? (
                        <div className="M_py-loading">Loading chart data...</div>
                    ) : monthlyData.length > 0 ? (
                        <div className="M_py-chart-container">
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    ) : (
                        <div className="M_py-no-data">No monthly data available for {year}</div>
                    )}
                </div>

                <div className="M_py-summary-section">
                    <div className="M_py-summary-card">
                        <h3>Total Allowance</h3>
                        <p>Rs. {totalAllowance.toLocaleString()}</p>
                    </div>
                    <div className="M_py-summary-card">
                        <h3>Total Interns</h3>
                        <p>{paymentdata.length}</p>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="M_py-section_2">
                <h2>Payment Details - {month1}</h2>
                <label>Select Month:</label>
                        <input 
                            type='month' 
                            value={month1}
                            onChange={(e) => {
                                setMonth1(e.target.value);
                            }}  
                        />
                <table className="M_py-payment-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Intern ID</th>
                            <th>Name</th>
                            <th>Worked Days</th>
                            <th>Holidays</th>
                            <th>Leave Days</th>
                            <th>Allowance (Rs)</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paymentdata.length > 0 ? (
                            paymentdata.map((record, index) => (
                                <tr key={record.tr_id}>
                                    <td>{index + 1}</td>
                                    <td>{record.tr_id}</td>
                                    <td>{record.name}</td>
                                    <td>{record.workday ?? 0}</td>
                                    <td>{record.holiday ?? 0}</td>
                                    <td>{record.leave ?? 0}</td>
                                    <td>{record.allowance?.toLocaleString()}</td>
                                    <td>
                                        <button onClick={() => handleEdit(record)}
                                            className="M_py-btn btn-edit"
                                        > Edit </button>
                                        <button onClick={() => handleDelete(record.tr_id, record.month)}
                                            className="M_py-btn btn-delete"
                                        > Delete </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="M_py-no-data">
                                    {loading ? 'Loading...' : 'No payment data available for selected month'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className='M_py-section_3'>
                <form onSubmit={handleSubmit}>
                    <div className="M_py-form-group">
                        <label>Select Month:</label>
                        <input 
                            type='month' 
                            value={month}
                            onChange={(e) => {
                                setMonth(e.target.value);
                                setYear(e.target.value.slice(0, 4));
                            }} 
                            className="M_py-form-control" 
                        />
                    </div>
                    
                    <div className="M_py-form-group">
                        <label>Intern ID:</label>
                        <select 
                            name="internId"
                            value={formData.internId}
                            onChange={handleInternChange} // Use the new handler
                            className="M_py-form-control"
                            required
                        >
                            <option value="">Select Intern</option>
                            {interns.map(intern => (
                                <option key={intern.TR_ID} value={intern.TR_ID}>
                                    {intern.TR_ID} - {intern.Short_Name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="M_py-form-group">
                        <label>Short Name:</label>
                        <input 
                            type='text' 
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="M_py-form-control"
                            placeholder="Name"
                            readOnly // Make it read-only since it's auto-filled
                        />
                    </div>
                    
                    <div className="M_py-form-group">
                        <label>No of worked days:</label>
                        <input 
                            type='number' 
                            name="workedDays"
                            value={formData.workedDays}
                            onChange={handleInputChange}
                            className="M_py-form-control"
                            placeholder="Worked Days"
                        />
                    </div>
                    
                    <div className="M_py-form-group">
                        <label>No of holidays:</label>
                        <input 
                            type='number' 
                            name="holidays"
                            value={formData.holidays}
                            onChange={handleInputChange}
                            className="M_py-form-control"
                            placeholder="Holidays"
                        />
                    </div>
                    
                    <div className="M_py-form-group">
                        <label>No of leave days:</label>
                        <input 
                            type='number' 
                            name="leaveDays"
                            value={formData.leaveDays}
                            onChange={handleInputChange}
                            className="M_py-form-control"
                            placeholder="Leave Days"
                        />
                    </div>
                    
                    <div className="M-py-form-actions">
                        <button type="button" onClick={handleClear} className="M_py-btn btn-secondary">
                            Clear
                        </button>
                        <button type="button" onClick={handleCalculate} className="M_py-btn btn-info">
                            Calculate
                        </button>
                    </div>
                    
                    <div className="M_py-form-group">
                        <label>Allowance:</label>
                        <input 
                            type='text' 
                            name="allowance"
                            value={formData.allowance}
                            onChange={handleInputChange}
                            className="M_py-form-control"
                            placeholder="Allowance"
                            readOnly
                        />
                    </div>
                    
                    <button type="submit" className="M_py-btn btn-primary">
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Payment_M;