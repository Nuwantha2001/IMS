import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import '../styles/Payment.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Payment = () => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [year, setYear] = useState(new Date().getFullYear());
    const [paymentdata, setPaymentdata] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [totalAllowance, setTotalAllowance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const paymentRes = await axios.get(`http://localhost:5000/payment_data/${month}`);
                if (paymentRes.data && Array.isArray(paymentRes.data)) {
                    setPaymentdata(paymentRes.data);
                    const total = paymentRes.data.reduce((acc, item) => acc + (item.allowance || 0), 0);
                    setTotalAllowance(total);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError('Failed to load payment data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [month]);

    useEffect(() => {
        const fetchYearlyData = async () => {
            setChartLoading(true);
            try {
                const response = await axios.get(`http://localhost:5000/monthly_pay/${year}`);
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
                data: monthlyData.map(item => item.total_pay),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
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
        <div className="payment-container">
            <h1>Intern Allowance</h1>
            
            
            <div className="py_chart-section">
                <div className="py_selection">
                    <h2>Monthly Allowance Overview</h2>
                    <label> Year:</label>
                    <input 
                        type='number' value={year} 
                        onChange={(e) => setYear(e.target.value)}  />
                </div>
                {chartLoading ? (
                    <div className="py_loading">Loading chart data...</div>
                ) : monthlyData.length > 0 ? (
                    <div className="py_chart-container">
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                ) : (
                    <div className="py_no-data">No monthly data available for {year}</div>
                )}
            </div>

            <div className="py_selection-container">
                <div className="py_selection-group">
                    <label>Select Month:</label>
                    <input type='month' value={month} 
                        onChange={(e) => {
                            setMonth(e.target.value);
                            setYear(e.target.value.slice(0, 4)); }} 
                        className="py_month-selector" />
                </div>
            </div>

            {loading && <div className="py_loading">Loading...</div>}
            {error && (
                <div className="error">
                    <p>{error}</p>
                </div>
            )}

            <div className="py_summary-section">
                <div className="py_summary-card">
                    <h3>Total Allowance</h3>
                    <p>Rs. {totalAllowance.toLocaleString()}</p>
                </div>
                <div className="py_summary-card">
                    <h3>Total Interns</h3>
                    <p>{paymentdata.length}</p>
                </div>
            </div>

            {/* Data Table */}
            <div className="py_table-section">
                <h2>Payment Details - {month}</h2>
                <table className="py_payment-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Intern ID</th>
                            <th>Name</th>
                            <th>Worked Days</th>
                            <th>Holidays</th>
                            <th>Leave Days</th>
                            <th>Allowance (Rs)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paymentdata.length > 0 ? (
                            paymentdata.map((record, index) => (
                                <tr key={record.tr_id}>
                                    <td>{index + 1}</td>
                                    <td>{record.tr_id}</td>
                                    <td>{record.name}</td>
                                    <td>{record.workedDays}</td>
                                    <td>{record.holidays || 0}</td>
                                    <td>{record.leaveDays}</td>
                                    <td>{record.allowance?.toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="py_no-data">
                                    {loading ? 'Loading...' : 'No payment data available for selected month'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Payment;