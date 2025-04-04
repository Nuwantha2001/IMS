import React, { memo, useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import '../styles/Excel.css';

const Excel = () => {
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fileChosen, setFileChosen] = useState(false);
    const [error, setError] = useState(null);
  
    const handleFileUpload = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          const sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase() === 'infomation' || name.toLowerCase() === 'information'
          );
          
          if (!sheetName) {
            throw new Error('"Infomation" sheet not found in the Excel file');
          }
          const sheet = workbook.Sheets[sheetName];
  
          const parsedData = XLSX.utils.sheet_to_json(sheet, { range: 0 });

          // Excel serial date to JS date conversion function
            const excelDate = (serial) => {
                if (!serial || isNaN(serial)) return '';
                const utcDays = serial - 25569;
                const utcValue = utcDays * 86400 * 1000;
                const date = new Date(utcValue);
                return date.toISOString().slice(0, 10);
            };

          const parsedSummary = parsedData
            .filter(row => row["TR ID"]?.trim() && row["Name"]?.trim())
            .map((row, index) => ({
              index: index + 1,
              tr_id: row["TR ID"],
              name: row["Name"],
              mr_ms: row["MR/MS"],
              short_name: row["Short Name"],
              address: row["ADDRESS"],
              mobile_no: row["MOBILE NO"],
              id_no: row["ID NO"],
              institute: row["INSTITUTE"],
              program: row["PROGRAM"],
              s_date: excelDate(row["S.Date"]),
              e_date: excelDate(row["E.Date"]),
              actual: excelDate(row["Actual End Date"]),
              extended: row["Extended Period"],
              category: row["CATEGORY"],
              bank: row["BANK"],
              branch: row["BRANCH"],
              account_no: row["ACCOUNT NO"],
              memo_no: row["Memo Number"],
              status: row["Status"],
              cv: row["CV"],
              nda: row["NDA"],     
              appointment: row["Appointment Letter"],
              certificate: row["Certificate"],
              referance: row["Reference By"] === "N/A" || row["Reference By"] == null ? "" : row["Reference By"],
              name_2: row["Name2"] === "N/A" || row["Name2"] == null ? "" : row["Name2"],
            }));
  
          setSummary(parsedSummary);
          setError(null);
        } catch (error) {
          console.error("Error parsing file:", error);
          setError("Error processing the file: " + error.message);
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Error reading file");
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    };
  
    const handleUpload = async () => {
      if (summary.length === 0) {
        setError("No data to upload");
        return;
      }
      
      try {
        setLoading(true);
        const response = await axios.post("http://localhost:5000/upload_all", { parsedData: summary });
        alert("Data uploaded successfully");
      } catch (error) {
        console.error("Error uploading data", error);
        if (error.response?.data?.message) {
          const { message, unmatchedSiteIds } = error.response.data;
          setError(unmatchedSiteIds?.length > 0 
            ? `${message}\nUnmatched Site IDs:\n${unmatchedSiteIds.join(", ")}` 
            : message);
        } else {
          setError("Failed to upload the data: " + (error.message || "Unknown error"));
        }
      } finally {
        setLoading(false);
      }
    };
  
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setLoading(true);
        setFileChosen(true);
        setError(null);
        handleFileUpload(file);
      }
    };

    return (
      <div className='ex_container'>
        <h2>Excel Data Reader - Infomation Sheet</h2>
        
        {!fileChosen && (
          <div className='file-upload-container'>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileChange} 
              className='file-input'
              id='fileInput'
            />
            <label htmlFor='fileInput' className='file-input-label'>
              Choose Excel File
            </label>
          </div>
        )}

        {loading && <p className='loading'>Loading data...</p>}
        {error && <p className='error'>{error}</p>}

        {summary.length > 0 && (
          <div className='ex_table'>          
            <button 
              onClick={handleUpload} 
              className='ex_button' 
              disabled={loading}
            >   
              {loading ? 'Uploading...' : 'Submit Data'}
            </button>

            <div className='ex_table-container'>
              <table className='ex_table-content'>
                <thead>
                  <tr>
                    <th>No:</th>
                    <th>TR ID</th>
                    <th>MR/MS</th>
                    <th>Name</th>
                    <th>Short Name</th>
                    <th>Address</th>
                    <th>Mobile No</th>
                    <th>ID No</th>
                    <th>Institute</th>
                    <th>Program</th>
                    <th>S.Date</th>
                    <th>E.Date</th>
                    <th>Actual End Date</th>
                    <th>Extended Period</th>
                    <th>Category</th>
                    <th>Bank</th>
                    <th>Branch</th>
                    <th>Account No</th>
                    <th>Memo No</th>
                    <th>Status</th>
                    <th>CV</th>
                    <th>NDA</th>
                    <th>Appointment Letter</th>
                    <th>Certificate</th>
                    <th>Reference By</th>
                    <th>Name2</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
                    <tr key={row.index}>
                      <td>{row.index}</td>
                      <td>{row.tr_id}</td>
                      <td>{row.mr_ms}</td>
                      <td>{row.name}</td>
                      <td>{row.short_name}</td>
                      <td>{row.address}</td>
                      <td>{row.mobile_no}</td>
                      <td>{row.id_no}</td>
                      <td>{row.institute}</td>
                      <td>{row.program}</td>
                      <td>{row.s_date}</td>
                      <td>{row.e_date}</td>
                      <td>{row.actual}</td>
                      <td>{row.extended}</td>
                      <td>{row.category}</td>
                      <td>{row.bank}</td>
                      <td>{row.branch}</td>
                      <td>{row.account_no}</td>
                      <td>{row.memo_no}</td>
                      <td>{row.status}</td>
                      <td>{row.cv}</td>
                      <td>{row.nda}</td>
                      <td>{row.appointment}</td>
                      <td>{row.certificate}</td>
                      <td>{row.referance}</td> 
                      <td>{row.name_2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
};

export default memo(Excel);