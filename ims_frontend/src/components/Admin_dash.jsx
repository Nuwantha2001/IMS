import axios from 'axios';
import React, { useState, useEffect } from 'react';
import '../styles/Admin_dash.css';

const Admin_dash = () => {
    const [summary, setSummary] = useState({});
    const [certificate, setCertificate] = useState({});
    const [attendance, setAttendance] = useState([]);
    const [activeInterns, setActiveInterns] = useState([]);
    const [certiRequeste, setCertiRequeste] =useState([]);

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
    

    return (
        <div className='admin_dash-container'>
            <h1>Admin Dashboard</h1>
            <div className='summary-flex-container'>
                <div className='a_summary-table'>
                    <h2>Summary</h2>
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
                <div className='a_summary-table'>
                    <h2>Cetificate</h2>
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
            <div className='attendance-table'>
                <h2>Today Attendance</h2>
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
            </div>
            <div className='interns-table'>
                <h2>Active Interns Details</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Intern ID</th>
                            <th>Name</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeInterns.map((intern, index) => (
                            <tr key={index}>
                                <td>{intern.TR_ID}</td>
                                <td>{intern.Name}</td>
                                <td>{intern.Start_Date}</td>
                                <td>{intern.End_Date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className='interns-table'>
                <h2>Certificate Request</h2>
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