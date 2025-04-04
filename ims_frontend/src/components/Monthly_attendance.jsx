import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../styles/Monthly_attendance.css';

const MonthlyAttendance = () => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [userId, setUserId] = useState('');
    const [name, setName] = useState('');
    const [attendance, setAttendance] = useState([]);
    const [summary, setSummary] = useState({});
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const pdfContentRef = useRef();

    useEffect(() => {
        const storedUserId = localStorage.getItem("user");
        if (storedUserId) {
            setUserId(storedUserId);
            axios.post("http://localhost:5000/attendance", { userId: storedUserId })
                .then(response => {
                    if (response.data.success && response.data.name) {
                        setName(response.data.name);
                    }
                })
                .catch(error => console.error('Error fetching user data:', error));
        }
    }, []);

    useEffect(() => {
        if (userId) {
            axios.get(`http://localhost:5000/monthly_attendance/${encodeURIComponent(userId)}/${month}`)
                .then(response => {
                    if (response.data.attendance && response.data.summary) {
                        setAttendance(response.data.attendance);
                        setSummary(response.data.summary);
                    }
                })
                .catch(error => console.error("Error fetching attendance:", error));
        }
    }, [month, userId]);

    const handleDownloadPDF = async () => {
        if (!pdfContentRef.current) return;
        
        setIsGeneratingPDF(true);
        
        try {
            // Hide the month input during PDF generation
            const monthInput = pdfContentRef.current.querySelector('input[type="month"]');
            if (monthInput) monthInput.style.visibility = 'hidden';

            const canvas = await html2canvas(pdfContentRef.current, {
                scale: 2,
                logging: false,
                useCORS: true,
                scrollY: -window.scrollY,
                backgroundColor: '#ffffff'
            });

            // Restore the month input visibility
            if (monthInput) monthInput.style.visibility = 'visible';

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 190; // Reduced width to account for margins
            const pageHeight = 277; // Reduced height to account for margins
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 10; // Top margin
            
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            // Add new pages if content is longer than one page
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            pdf.save(`attendance_${month}_${name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const firstHalf = attendance.slice(0, Math.ceil(attendance.length / 2));
    const secondHalf = attendance.slice(Math.ceil(attendance.length / 2));

    return (
        <div className="page-container">
            <div className="download-button-container">
                <button 
                    onClick={handleDownloadPDF} 
                    className="download-button"
                    disabled={isGeneratingPDF}
                >
                    {isGeneratingPDF ? 'Generating PDF...' : 'Download as PDF'}
                </button>
            </div>

            <div className="attendance-container" ref={pdfContentRef}>
                <div className="attendance-header">
                    <h1>MOBITEL (PVT) LIMITED</h1>
                    <h3>Intern Allowance Sheet</h3>
                </div>

                <div className="intern-details">
                    <div className="detail-row_1">
                        <label>Name:</label>
                        <input type="text" value={name} readOnly /><br />
                        <label>Month:</label>
                        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                    </div>
                    <div className="detail-row_2">
                        <label>Division:</label>
                        <input type="text" value="Network Planning and Operations" readOnly /><br />
                        <label>ID:</label>
                        <input type="text" value={userId} readOnly /><br />
                        <label>Intern Type:</label>
                        <input type="text" value="On-Job / General" readOnly />
                    </div>
                </div>

                <div className="attendance-tables-container">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th colSpan="3">Hours worked</th>
                            </tr>
                            <tr>
                                <th></th>
                                <th>From</th>
                                <th>To</th>
                                <th>No. of Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {firstHalf.map((record, index) => (
                                <tr key={index}>
                                    <td>{record.day}</td>
                                    <td>{record.time_from}</td>
                                    <td>{record.time_to}</td>
                                    <td>{record.hours_worked}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th colSpan="3">Hours worked</th>
                            </tr>
                            <tr>
                                <th></th>
                                <th>From</th>
                                <th>To</th>
                                <th>No. of Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {secondHalf.map((record, index) => (
                                <tr key={index}>
                                    <td>{record.day}</td>
                                    <td>{record.time_from}</td>
                                    <td>{record.time_to}</td>
                                    <td>{record.hours_worked}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="summary">
                    <table className="summary-table">
                        <tbody>
                            <tr>
                                <td>No. Of Days worked</td>
                                <td>{summary.workedDays}</td>
                            </tr>
                            <tr>
                                <td>No. Saturdays/Sundays/Poya & Mercantile holidays</td>
                                <td>{summary.holidays || 0}</td>
                            </tr>
                            <tr>
                                <td>No. of Days on personal Leave</td>
                                <td>{summary.leaveDays}</td>
                            </tr>
                            <tr>
                                <td>Amount (Rs)</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="requested-by">Requested By: ______</div>
                </div>
                             
                <div className="note">
                    <p>Note: Exposure gained when assigned tasks while being at home (other than Weekends, 
                        Poya Holidays and Company holidays) need to be indicated as "EFH" on this sheet and 
                        shall be supported by Schedule 1 attached. If you are physically present at Mobitel 
                        office then you need to indicate the times worked. (e.g. 8.00 a.m. to 5.00 p.m.) which 
                        shall be verified and confirmed by the supervisor.</p>
                </div>
                    
                <div className="approvals-container">
                    <table className="approvals-table">
                        <thead>
                            <tr>
                                <th>Approvals</th>
                                <th>Name</th>
                                <th>Signature</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Supervisor/HOD</td>
                                <td>Lanka Bandara</td>
                                <td>________</td>
                            </tr>
                            <tr>
                                <td>HR Approval</td>
                                <td>________</td>
                                <td>________</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MonthlyAttendance;