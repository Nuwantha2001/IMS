import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from 'chart.js';
import { format, parseISO, startOfMonth, isWithinInterval } from 'date-fns';
import '../styles/Admin_dash.css';

// Register ChartJS components
ChartJS.register( CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Admin_dash = () => {
    const [summary, setSummary] = useState({});
    const [certificate, setCertificate] = useState({});
    const [attendance, setAttendance] = useState([]);
    const [activeInterns, setActiveInterns] = useState([]);
    const [certiRequeste, setCertiRequeste] =useState([]);
    const [monthlyInterns, setMonthlyInterns] = useState([]);
    const [yearlyInterns, setYearlyInterns] = useState([]);
    const [selectedMonthInterns, setSelectedMonthInterns] = useState([]);
    const [selectedYearInterns, setSelectedYearInterns] = useState([]);
    const [showMonthDetails, setShowMonthDetails] = useState(false);
    const [showYearDetails, setShowYearDetails] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        try {
          return format(parseISO(dateString), 'yyyy-MM-dd');
        } catch (error) {
          console.error('Error formatting date:', error);
          return dateString;
        }
      };

    useEffect(() => { 
        axios.get('http://localhost:5000/admin_summary')
            .then(res => {
                setSummary(res.data.summary);
            })
            .catch(err => { console.log("Error to calculate summary data", err) });
    }, []);
    useEffect(() => {
        axios.get('http://localhost:5000/admin_certificate')
            .then(res => {
                setCertificate(res.data.certificate);
            })
            .catch(err => { console.log("Error to calculate Certificate data", err) });
    }, []);

    useEffect(() => {
        axios.get('http://localhost:5000/daily_attendance')
            .then(res => {
                setAttendance(res.data.attendance);
            })
            .catch(err => { console.log("Error to calculate attendance data", err) });
    }, []);

    useEffect(() => {
        axios.get('http://localhost:5000/active_interns')
          .then(response => {
            //console.log('Received interns Data:', response.data);
            setActiveInterns(response.data || []);
          })
          .catch(error => console.error('Error fetching active intern data:', error));
      }, []);
      useEffect(() => {
        axios.get('http://localhost:5000/certificate_request')
          .then(response => {
            //console.log('Received certificate Data:', response.data);
            setCertiRequeste(response.data || []);
          })
          .catch(error => console.error('Error fetching cetificate request data:', error));
      }, []);
    
      useEffect(() => {
        axios.get('http://localhost:5000/api/monthly_active_interns')
            .then(response => {
                const processedData = processMonthlyData(response.data, selectedYear);
                setMonthlyInterns(processedData);
            })
            .catch(error => {
                console.error('Error fetching monthly intern data:', error);
                setMonthlyInterns([]);
            });
    }, [selectedYear]);
    
    //  process monthly data 
    const processMonthlyData = (rawData, yearFilter) => {
        const monthlyData = {};
        const months = Array.from({ length: 12 }, (_, i) => {
            return {
                month: format(new Date(yearFilter, i, 1), 'yyyy-MM'),
                activeCount: 0,
                newCount: 0,
                activeInterns: [],
                newInterns: []
            };
        });
    
        rawData.forEach(intern => {
            try {
                if (!intern.Start_Date || !intern.End_Date) return;
    
                const startDate = parseISO(intern.Start_Date);
                const endDate = parseISO(intern.End_Date);
    
                // Skip if intern's dates don't overlap with selected year
                if (startDate.getFullYear() > yearFilter || endDate.getFullYear() < yearFilter) {
                    return;
                }
    
                let currentMonth = startOfMonth(startDate);
                const lastMonth = startOfMonth(endDate);

                // Check if this intern started in the current year
                const startedThisYear = startDate.getFullYear() === yearFilter;
    
                while (currentMonth <= lastMonth) {
                    const monthKey = format(currentMonth, 'yyyy-MM');
                    
                    // Only process months in the selected year
                    if (currentMonth.getFullYear() === yearFilter) {
                        if (!monthlyData[monthKey]) {
                            monthlyData[monthKey] = {
                                activeCount: 0,
                                newCount: 0,
                                activeInterns: [],
                                newInterns: []
                            };
                        }
                        monthlyData[monthKey].activeCount++;
                        monthlyData[monthKey].activeInterns.push(intern);

                         // If this is the month they started and it's the selected year
                        if (startedThisYear && format(startOfMonth(startDate), 'yyyy-MM') === monthKey) {
                            monthlyData[monthKey].newCount++;
                            monthlyData[monthKey].newInterns.push(intern);
                        }
                    }
    
                    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                }
            } catch (error) {
                console.error('Error processing intern dates:', error);
            }
        });
    
        // Merge with all months to ensure we show all 12 months
        return months.map(month => {
            const dataForMonth = monthlyData[month.month] || { 
                activeCount: 0, 
                newCount: 0,
                activeInterns: [],
                newInterns: [] 
            };
            return {
                month: format(parseISO(`${month.month}-01`), 'MMM'), // Format as 'Jan', 'Feb', etc.
                fullMonth: month.month,
                activeCount: dataForMonth.activeCount,
                newCount: dataForMonth.newCount,
                activeInterns: dataForMonth.activeInterns,
                newInterns: dataForMonth.newInterns
            };
        });
    };
    
    // Similarly for yearly data
    useEffect(() => {
        axios.get('http://localhost:5000/api/yearly_active_interns')
            .then(response => {
                const processedData = processYearlyData(response.data);
                setYearlyInterns(processedData);
            })
            .catch(error => {
                console.error('Error fetching yearly intern data:', error);
                setYearlyInterns([]);
            });
    }, []);
    
    const processYearlyData = (rawData) => {
        const yearlyData = {};
        
        rawData.forEach(intern => {
            try {
                if (!intern.Start_Date || !intern.End_Date) return;
                
                const startYear = parseISO(intern.Start_Date).getFullYear();
                const endYear = parseISO(intern.End_Date).getFullYear();
                
                for (let year = startYear; year <= endYear; year++) {
                    const yearKey = year.toString();
                    
                    if (!yearlyData[yearKey]) {
                        yearlyData[yearKey] = {
                            count: 0,
                            interns: []
                        };
                    }
                    yearlyData[yearKey].count++;
                    yearlyData[yearKey].interns.push(intern);
                }
            } catch (error) {
                console.error('Error processing intern dates:', error);
            }
        });
        
        return Object.entries(yearlyData)
            .map(([year, data]) => ({
                year,
                count: data.count,
                interns: data.interns
            }))
            .sort((a, b) => a.year - b.year);
    };
    

    // Prepare data for monthly chart
    const monthlyChartData = {
        labels: monthlyInterns.map(item => item.month),
        datasets: [
            {
                label: `Active Interns (${selectedYear})`, 
                data: monthlyInterns.map(item => item.activeCount),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
            {
                label: `New Interns (${selectedYear})`,
                data: monthlyInterns.map(item => item.newCount),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            }
        ]
    };
    
    const yearlyChartData = {
        labels: yearlyInterns.map(item => item.year),
        datasets: [
            {
                label: 'Active Interns',
                data: yearlyInterns.map(item => item.count),
                backgroundColor: 'rgba(93, 250, 93, 0.73)',
                borderColor: 'rgb(93, 250, 93)',
                borderWidth: 2,
            }
        ]
    };

    // Handle click on monthly chart bars
    const handleMonthlyChartClick = (event, elements) => {
        if (elements.length > 0) {
            const element = elements[0];
            const index = element.index;
            const datasetIndex = element.datasetIndex;
            const selectedData = monthlyInterns[index];
            
            if (datasetIndex === 0) { // Active interns dataset
                setSelectedMonthInterns(selectedData.activeInterns || []);
            } else { // New interns dataset
                setSelectedMonthInterns(selectedData.newInterns || []);
            }
            
            setShowMonthDetails(true);
            setShowYearDetails(false);
        }
    };
    
    const handleYearlyChartClick = (event, elements) => {
        if (elements.length > 0) {
            const index = elements[0].index;
            const selectedData = yearlyInterns[index];
            setSelectedYearInterns(selectedData.interns || []);
            setSelectedYear(parseInt(selectedData.year)); // Update the selected year
            setShowYearDetails(true);
            setShowMonthDetails(false);
        }
    };

    return (
        <div className='admin_dash-container'>
            <h1>Admin Dashboard</h1>
            <div className='a_chart-container'>
                            <div className='a_chart'>
                                <div className="year-selector">
                                    <h3>Monthly Active Interns</h3><div>
                                    <label htmlFor="year-select">Year: </label>
                                    <select id="year-select" value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))} >
                                        {Array.from({ length: 5 }, (_, i) => {
                                            const year = new Date().getFullYear() - i;
                                            return (
                                                <option key={year} value={year}> {year} </option>);
                                        })}
                                    </select></div>
                                </div>
                                <Bar 
                                    data={monthlyChartData}
                                    options={{
                                        onClick: handleMonthlyChartClick,
                                        scales: {
                                            y: {  beginAtZero: true,  title: {display: true, text: 'Number of Interns'  }},
                                            x: {  title: {display: true,text: 'Month'  }}
                                        },
                                        plugins: {
                                            tooltip: {  callbacks: {label: (context) => `Interns: ${context.parsed.y}`  }}
                                        } }}/>
                            </div>
                            <div className='a_chart'>
                                <h3>Yearly Active Interns</h3>
                                <Bar 
                                    data={yearlyChartData}
                                    options={{
                                        onClick: handleYearlyChartClick,
                                        scales: {
                                            y: { beginAtZero: true, title: {display: true,text: 'Number of Interns'  }},
                                            x: {  title: {display: true,text: 'Year'  } }
                                        },
                                        plugins: {
                                            tooltip: { callbacks: {label: (context) => `Interns: ${context.parsed.y}`}}
                                        } }}/>
                            </div>
                        </div>
            
                        {/* Details panels that appear when a chart bar is clicked */}
                        {showMonthDetails && (
                            <div className='details-panel'>
                                <h3>Interns Active in {selectedMonthInterns.length > 0 ? 
                                    format(parseISO(selectedMonthInterns[0].Start_Date), 'MMMM yyyy') : 'Selected Month'}</h3>
                                <button onClick={() => setShowMonthDetails(false)} className='close-button'>Close</button>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Intern ID</th>
                                            <th>Name</th>
                                            <th>Mobile No</th>
                                            <th>Institute</th>
                                            <th>Programme</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedMonthInterns.map((intern, index) => (
                                            <tr key={index}>
                                                <td>{intern.TR_ID}</td>
                                                <td>{intern.Short_Name}</td>
                                                <td>{intern.Mobile_No}</td>
                                                <td>{intern.Institute}</td>
                                                <td>{intern.Programme}</td>
                                                <td>{formatDateForDisplay(intern.Start_Date)}</td>
                                                <td>{formatDateForDisplay(intern.End_Date)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {showYearDetails && (
                            <div className='details-panel'>
                                <h3>Active Interns</h3>
                                {/* <h3>Interns Active in {selectedYearInterns.length > 0 ? 
                                    parseISO(selectedYearInterns[0].Start_Date).getFullYear() : 'Selected Year'}</h3> */}
                                <button onClick={() => setShowYearDetails(false)} className='close-button'>Close</button>
                                <table>
                                    <thead>
                                        <tr>
                                        <th>Intern ID</th>
                                            <th>Name</th>
                                            <th>Mobile No</th>
                                            <th>Institute</th>
                                            <th>Programme</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedYearInterns.map((intern, index) => (
                                            <tr key={index}>
                                                <td>{intern.TR_ID}</td>
                                                <td>{intern.Short_Name}</td>
                                                <td>{intern.Mobile_No}</td>
                                                <td>{intern.Institute}</td>
                                                <td>{intern.Programme}</td>
                                                <td>{formatDateForDisplay(intern.Start_Date)}</td>
                                                <td>{formatDateForDisplay(intern.End_Date)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
            
            <div className='summary-flex-container'>
                <div className='a_summary'>
                    <h1>Summary</h1>
                    <table>
                        <thead>
                            <tr><th>Status</th>
                                <th>No of Interns</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Active</td>
                                <td>{summary.active_count}</td></tr>
                            <tr><td>Inactive</td>
                                <td>{summary.inactive_count}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div className='a_summary'>
                    <h1>Cetificate</h1>
                    <table>
                        <thead>
                            <tr><th>Status</th>
                                <th>No of Certificate</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Requested</td>
                                <td>{certificate.request_count}</td></tr>
                            <tr><td>Issued</td>
                                <td>{certificate.issue_count}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            {/* <div className='attendance-table'>
                <h1>Today Attendance</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Intern ID</th>
                            <th>Name</th>
                            <th>Time Slot</th>
                            <th>Division</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(attendance) && attendance.map((att, index) => (
                            <tr key={index}>
                                <td>{att.tr_id}</td>
                                <td>{att.name}</td>
                                <td>{att.time_slot}</td>
                                <td>{att.division}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div> */}
            <div className='interns-table'>
                <h1>Active Interns Details</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Intern ID</th>
                            <th>Name</th>
                            <th>Mobile No</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Actual End Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeInterns.map((intern, index) => (
                            <tr key={index}>
                                <td>{intern.TR_ID}</td>
                                <td>{intern.Short_Name}</td>
                                <td>{intern.Mobile_No}</td>
                                <td>{intern.Start_Date}</td>
                                <td>{intern.End_Date}</td>
                                <td>{intern.Actual_End_Date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className='interns-table'>
                <h1>Certificate Request</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Intern Id</th>
                            <th>Short Name</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certiRequeste.map((request, index) =>
                            <tr key={index}>
                                <td>{request.tr_id}</td>
                                <td>{request.name}</td>
                                <td>{request.start_date}</td>
                                <td>{request.end_date}</td>
                            </tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Admin_dash;