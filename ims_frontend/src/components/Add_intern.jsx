import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import '../styles/Add_intern.css';

const Add_intern = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileChosen, setFileChosen] = useState(false);
  const [formData, setFormData] = useState({
    id: 'MOB/TR/',
    s_date: '',
    e_date: '',
    actual: 'Null',
    extended_period: 'Null',
    category: 'General',
    memo_no: 'ENG/TR/',
    status: 'Active',
    cv: 'Null',
    nda: 'Null',
    appointment: 'Null',
    certificate: 'Null',
    referance: 'Null',
    password: '',
    type: 'Intern'
  });

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsedData = XLSX.utils.sheet_to_json(sheet, { range: 0 });

        console.log("Excel data", parsedData);
        
        const parsedSummary = parsedData.map((row) => ({
          mr_mrs: row["MR/MS"] || row["Mr/Mrs"],
          name: row["Name"],
          short_name: row["Short Name"],
          address: row["ADDRESS"] || row["Address"],
          mobile_no: row["MOBILE NO"] || row["Mobile No"],
          nic: row["ID NO"] || row["NIC"] || row["ID NO"],
          institute: row["INSTITUTE"] || row["Institute"],
          programme: row["PROGRAM"] || row["Programme"],
          bank: row["BANK"] || row["Bank"],
          branch: row["BRANCH"] || row["Branch"],
          acc_no: row["ACCOUNT NO"] || row["Account No"],
          name_2: row["Name2"] || row["Name 2"],
        }));

        setSummary(parsedSummary);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Error processing the file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const UploadDetails = async () => {
    console.log("Summary being uploaded:", summary);
    try {
      // Combine form data with each intern's details
      const dataToUpload = summary.map(intern => ({
        ...intern,
        tr_id: formData.id,
        s_date: formData.s_date,
        e_date: formData.e_date,
        actual: formData.actual,
        extended_period: formData.extended_period,
        category: formData.category,
        status: formData.status,
        memo_no: formData.memo_no,
        cv: formData.cv,
        nda: formData.nda,
        appointment: formData.appointment,
        certificate: formData.certificate,
        referance: formData.referance,
        password: formData.password,
        type: formData.type,
        program: intern.programme // Map to backend's expected field name
      }));
      const response = await axios.post("http://localhost:5000/upload", { 
        parsedData: dataToUpload
      });
      
      if (response.data.message) {
        alert(response.data.message);
      } else {
        alert("Data uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading data", error);
      if (error.response) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error uploading data");
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      setFileChosen(true);
      handleFileUpload(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="ad_pageContainer">
      <h1>Add New Intern</h1>

      <div className="ad_pageheader">
        <label>Training ID:</label>
        <input type="text" name="id" value={formData.id} onChange={handleInputChange} /><br />
        <label>Start Date:</label>
        <input type="date" name="s_date" value={formData.s_date} onChange={handleInputChange} /><br />
        <label>End Date:</label>
        <input type="date" name="e_date" value={formData.e_date} onChange={handleInputChange} /><br />
        <label>Actual End Date:</label>
        <input type="date" name="actual" value={formData.actual} onChange={handleInputChange} /><br />
        <label>Extended Period:</label>
        <input type="text" name="extended_period" value={formData.extended_period} onChange={handleInputChange} /><br />
        <label>Category:</label>
        <input type="text" name="category" value={formData.category} onChange={handleInputChange} /><br />
        <label>Status:</label>
        <input type="text" name="status" value={formData.status} onChange={handleInputChange} /><br />
        <label>Memo Number</label>
        <input type="text" name="memo_no" value={formData.memo_no} onChange={handleInputChange} /><br />
        <label>CV:</label>
        <input type="text" name="cv" value={formData.cv} onChange={handleInputChange} /><br />
        <label>NDA:</label>
        <input type="text" name="nda" value={formData.nda} onChange={handleInputChange} /><br />
        <label>Appointment Letter:</label>
        <input type="text" name="appointment" value={formData.appointment} onChange={handleInputChange} /><br />
        <label>Certificate:</label>
        <input type="text" name="certificate" value={formData.certificate} onChange={handleInputChange} /><br />
        <label>Reference By:</label>
        <input type="text" name="referance" value={formData.referance} onChange={handleInputChange} /><br />
        <label>Password:</label>
        <input type="text" name="password" value={formData.password} onChange={handleInputChange} /><br />
        <label>Type:</label>
        <input type="text" name="type" value={formData.type} onChange={handleInputChange} /><br />
        <label>Choose Excel:</label>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      </div>

      {summary.length > 0 && (
        <div className="ad_exceltable">
          <h2>Intern Details</h2>
          <div className="ad_tableContainer">
            <table className="ad_table" border="1">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, index) => (
                  <React.Fragment key={index}>
                    <tr><td>Training ID</td><td>{formData.id}</td></tr>
                    <tr><td>Mr/Mrs</td><td>{row.mr_mrs}</td></tr>
                    <tr><td>Name</td><td>{row.name}</td></tr>
                    <tr><td>Short Name</td><td>{row.short_name}</td></tr>
                    <tr><td>Address</td><td>{row.address}</td></tr>
                    <tr><td>Mobile No</td><td>{row.mobile_no}</td></tr>
                    <tr><td>ID No</td><td>{row.nic}</td></tr>
                    <tr><td>Institute</td><td>{row.institute}</td></tr>
                    <tr><td>Programme</td><td>{row.programme}</td></tr>
                    <tr><td>Start Date</td><td>{formData.s_date}</td></tr>
                    <tr><td>End Date</td><td>{formData.e_date}</td></tr>
                    <tr><td>Actual End Date</td><td>{formData.actual}</td></tr>
                    <tr><td>Extended Period</td><td>{formData.extended_period}</td></tr>
                    <tr><td>Category</td><td>{formData.category}</td></tr>
                    <tr><td>Bank</td><td>{row.bank}</td></tr>
                    <tr><td>Branch</td><td>{row.branch}</td></tr>
                    <tr><td>Account No</td><td>{row.acc_no}</td></tr>
                    <tr><td>Memo No</td><td>{formData.memo_no}</td></tr>
                    <tr><td>Status</td><td>{formData.status}</td></tr>
                    <tr><td>CV</td><td>{formData.cv}</td></tr>
                    <tr><td>NDA</td><td>{formData.nda}</td></tr>
                    <tr><td>Appointment Letter</td><td>{formData.appointment}</td></tr>
                    <tr><td>Certificate</td><td>{formData.certificate}</td></tr>
                    <tr><td>Reference By</td><td>{formData.referance}</td></tr>
                    <tr><td>Name2</td><td>{row.name_2}</td></tr>
                    <tr><td>Password</td><td>{formData.password}</td></tr>
                    <tr><td>Type</td><td>{formData.type}</td></tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={UploadDetails} disabled={loading}>Upload</button>
        </div>
      )}
    </div>
  );
};

export default Add_intern;