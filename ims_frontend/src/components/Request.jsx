import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Request.css';

const Request = () => {
    const [s_date, setStart_Date] = useState(new Date().toISOString().split('T')[0]);
    const [e_date, setEnd_Date] = useState(new Date().toISOString().split('T')[0]);
    const [userid, setId] = useState('');
    const [name, setName] = useState('');
    const [requestExists, setRequestExists] = useState(false); // State to track existing request

    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedUserId = localStorage.getItem("user"); 
                setId(storedUserId);

                // Fetch intern details
                const response = await axios.post("http://localhost:5000/attendance", {
                    userId: storedUserId,
                });

                if (response.data.success) {
                    setName(response.data.name);
                }

                // Check if request already exists
                const checkRequest = await axios.post("http://localhost:5000/check-request", {
                    userId: storedUserId,
                });

                if (checkRequest.data.exists) {
                    setRequestExists(true);
                }
            } catch (error) {
                console.log('Error fetching data', error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (requestExists) {
            alert("You have already submitted a certificate request.");
            return;
        }

        const requestData = { userId: userid, name: name, start_date: s_date, end_date: e_date }; 
        console.log('Submitting certificate request:', requestData); 

        try {
            const response = await fetch('http://localhost:5000/certificate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                alert('Request Submitted Successfully');
                setRequestExists(true); // Prevent further submissions
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert('Error submitting request');
            }
        } catch (error) {
            console.log('Error submitting request', error);
        }
    };

    return (
        <div className="re_container">
            <div className="re_header">
                <h1>Certificate Requests</h1>
                <div className="re_form">
                    <form onSubmit={handleSubmit}>
                        <label>ID :</label>
                        <input type="text" name="Id" value={userid} readOnly />
                        <label>Name :</label>
                        <input type="text" name="Name" value={name} readOnly />
                        <label>Internship Duration :</label>
                        <div className="re_time_slot">
                            <label>From :</label>
                            <input type="date" name="Date" value={s_date} onChange={(e) => setStart_Date(e.target.value)} />
                            <label>To :</label>
                            <input type="date" name="Date" value={e_date} onChange={(e) => setEnd_Date(e.target.value)} />
                        </div>
                        <button type="submit" disabled={requestExists}>
                            {requestExists ? "Request Already Submitted" : "Submit"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Request;
