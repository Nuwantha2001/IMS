const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();


// Initialize the Express app
const app = express();
app.use(express.json());
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Wicki123@',
  database: process.env.DB_NAME || 'intern_management',
  //port: process.env.DB_PORT || 3306,
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully');
  }
});
//---------------------------------------------------------------------
//login
//----------------------------------------------------------------
app.post('/login', (req, res) => {
  const { userId, password, userType } = req.body;

  console.log("Login attempt:", { userId, userType });

  if (!userId || !password || !userType) {
    return res.status(400).json({ success: false, message: "Missing credentials" });
  }

  const query = `SELECT TR_ID, Short_Name, Password FROM intern_data WHERE TR_ID = ? AND Status='Active'`;

  db.query(query, [userId, userType], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      const user = results[0];

      if(password == user.Password) {
        return res.json({ success: true, message: "Login successful", user: { id: user.TR_ID, name: user.Short_Name } });
      }
      else {
        return res.json({ success: false, message: "Invalid Password" });
      }

    } else {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
  });
});

app.post('/adminlogin', (req, res) => {
  const { userId, password, userType } = req.body;

  console.log("Admin Login attempt:", { userId, userType });

  if (!userId || !password || !userType) {
    return res.status(400).json({ success: false, message: "Missing credentials" });
  }

  const query = `SELECT * FROM admin WHERE user_id = ? AND user_type = ?`;

  db.query(query, [userId, userType], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      const user = results[0];

      if (password == user.password) {
        return res.json({ success: true, message: "Login successful" });
      } else {
        return res.json({ success: false, message: "Invalid Password" });
      }

    } else {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
  });
});




//--------------------------------------------------------------------------------------------------------------------
// Attendance Form Handling
// //--------------------------------------------------------------------------------------------------------------------
app.post('/attendance', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  const query = 'SELECT Short_Name FROM intern_data WHERE TR_ID = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      const user = results[0];
      return res.json({ success: true,  name: user.Short_Name || 'Unknown' });
    }
    return res.status(404).json({ success: false, message: "User not found" });
  });
});

app.post('/ins_attendance', (req, res) => {
  const { date, userId, timeSlot, division } = req.body; // Ensure 'userId' is used

  //console.log('Received data:', req.body);

  if (!date || !userId || !timeSlot || !division) { 
    console.log('Missing fields:', { date, userId, timeSlot, division });
    return res.status(400).json({ error: 'All fields are required' }); 
  }

  const query = `INSERT INTO attendance (tr_id, date, time_slot, division) VALUES (?, ?, ?, ?)`; 
  db.query(query, [userId, date, timeSlot, division], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: 'Attendance added successfully!', insertId: result.insertId });
  });
});
//---------------------------------------------------------------------
//certificate request form
//----------------------------------------------------------------  
// Route to check if request already exists
app.post('/check-request', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
  }

  const checkQuery = `SELECT * FROM request WHERE tr_id = ?`;
  db.query(checkQuery, [userId], (err, results) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ success: false, message: "Database error" });
      }
      res.json({ exists: results.length > 0 });
  });
});

// Route to submit certificate request
app.post('/certificate', (req, res) => {
  const { userId, name, start_date, end_date } = req.body;

  // Validate required fields
  if (!userId || !name || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: "All fields are required" });
  }

  // Check if request already exists
  const checkQuery = `SELECT * FROM request WHERE tr_id = ?`;
  db.query(checkQuery, [userId], (err, results) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ success: false, message: "Database error" });
      }
      if (results.length > 0) {
          return res.status(409).json({ success: false, message: "You have already submitted a certificate request" });
      }

      // Insert new request
      const insertQuery = `INSERT INTO request (tr_id, name, start_date, end_date) VALUES (?, ?, ?, ?)`;
      db.query(insertQuery, [userId, name, start_date, end_date], (err, results) => {
          if (err) {
              console.error("Database error:", err);
              return res.status(500).json({ success: false, message: "Database error" });
          }

          // If insert is successful, update intern_data table
          const value = "Requested";
          const updateQuery = `UPDATE intern_data SET Certificate=? WHERE TR_ID = ?`;
          db.query(updateQuery, [value, userId], (err, updateResults) => {
              if (err) {
                  console.error("Database error:", err);
                  return res.status(500).json({ success: false, message: "Database error" });
              }
              return res.json({ success: true, message: "Certificate request submitted successfully" });
          });
      });
  });
});

//---------------------------------------------------------------------
//Admin Dashboard
//----------------------------------------------------------------
app.get('/admin_summary', (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM intern_data WHERE Status = 'Active') AS active_count,
      (SELECT COUNT(*) FROM intern_data WHERE Status = 'Inactive') AS inactive_count
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, summary: results[0] });
  });
});
app.get('/admin_certificate', (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM intern_data WHERE Certificate = 'Requested') AS request_count,
      (SELECT COUNT(*) FROM intern_data WHERE Certificate = 'Issued') AS issue_count
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, certificate: results[0] });
  });
});

app.get('/daily_attendance', (req, res) => {
  const currentDate = new Date().toISOString().split('T')[0]; 
  const query = `
    SELECT attendance.tr_id, intern_data.Short_Name, attendance.time_slot, attendance.division 
    FROM attendance 
    INNER JOIN intern_data ON attendance.tr_id = intern_data.TR_ID
    WHERE attendance.date = ?
  `;
  db.query(query, [currentDate], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, attendance: results });
  });
});

app.get('/active_interns', (req, res) => {
  const query = 'SELECT TR_ID, Name, Start_Date, End_Date FROM intern_data WHERE Status = "Active"';
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json(results);
    //console.log('Active Interns detais',results);
  });
})
app.get('/certificate_request', (req, res) => {
  const query = 'SELECT tr_id, name, start_date, end_date FROM request WHERE alert = "Requested"';
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json(results);
    //console.log('Certificate detais',results);
  });
})
//---------------------------------------------------------------------------------
//add intern
//---------------------------------------------------------------------------------

app.post('/upload', (req, res) => {
  const { parsedData } = req.body;

  console.log("Received data:", parsedData);

  if (!Array.isArray(parsedData)) {
    return res.status(400).json({ message: 'Invalid data format.' });
  }

  // Validate required fields
  const requiredFields = ['tr_id', 'name', 'nic', 'mobile_no'];
  const missingFields = parsedData.some(row => 
    requiredFields.some(field => !row[field])
  );

  if (missingFields) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  // Check for duplicates
  const internIds = parsedData.map(row => row.tr_id);
  const checkIDQuery = 'SELECT TR_ID FROM intern_data WHERE TR_ID IN (?)';

  db.query(checkIDQuery, [internIds], (checkErr, results) => {
    if (checkErr) {
      console.error('Error checking data:', checkErr);
      return res.status(500).json({ message: 'Database error during duplicate check.' });
    }

    if (results.length > 0) {
      const existingIds = results.map(row => row.tr_id);
      return res.status(400).json({ 
        message: `Duplicate IDs found: ${existingIds.join(', ')}` 
      });
    }

    // Prepare data for insertion
    const addnewQuery = `INSERT INTO intern_data (
      TR_ID, Mr_Ms, Name, Short_Name, Address, Mobile_No, Id_No,
      Institute, Programme, Start_Date, End_Date, Actual_End_Date,
      Extended_Period, Category, Bank, Branch, Account_No,
      Memo_Number, Status, CV, NDA, Appointment_Letter,
      Certificate, Reference_By, Name_2, Password, Type
    ) VALUES ?`;

    const addnewValues = parsedData.map(row => [
      row.tr_id,
      row.mr_mrs || null,
      row.name,
      row.short_name || null ,
      row.address || null,
      row.mobile_no,
      row.nic,
      row.institute || null,
      row.program || row.programme || null, // Handle both field names
      row.s_date || null,
      row.e_date || null,
      row.actual || null,
      row.extended || null,
      row.category || 'General',
      row.bank || null,
      row.branch || null,
      row.acc_no || null,
      row.memo_no || null,
      row.status || 'Active',
      row.cv || null,
      row.nda || null,
      row.appointment || null,
      row.certificate || null,
      row.referance || null,
      row.name_2 || null,
      row.password || null,
      row.type || 'Intern',
      
    ]);

    db.query(addnewQuery, [addnewValues], (err) => {
      if (err) {
        console.error('Database insertion error:', err);
        return res.status(500).json({ 
          message: 'Failed to save data to database.',
          error: err.message 
        });
      }
      res.json({ 
        message: `Successfully added ${parsedData.length} intern(s)!`,
        count: parsedData.length
      });
    });
  });
});
//--------------------------------------------------------------------------
//Mounthly Summary
//--------------------------------------------------------------------------
app.get('/monthly_attendance/:userId/:month', (req, res) => {
  const { userId, month } = req.params;
  const [year, monthNumber] = month.split('-');
  
  console.log('Fetching attendance for:', { userId, year, monthNumber });

  const query = `
    SELECT 
        DAY(date) as day,
        date,
        '08.00 am' as time_from,
        '05.00 pm' as time_to,
        '9' as hours_worked
    FROM attendance 
    WHERE tr_id = ? AND YEAR(date) = ? AND MONTH(date) = ?
    
    UNION ALL
    
    SELECT 
        DAY(date) as day,
        date,
        '' as time_from,
        '' as time_to,
        holiday_name AS hours_worked
    FROM holidays 
    WHERE YEAR(date) = ? AND MONTH(date) = ?
  `;

  db.query(query, [userId, year, monthNumber, year, monthNumber], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
              
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const attendanceMap = {};
              
    // Initialize all days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(date).getDay();
      
      // Default values
      attendanceMap[day] = {
        day,
        time_from: '',
        time_to: '',
        hours_worked: dayOfWeek === 0 ? 'Sunday' : 
                     dayOfWeek === 6 ? 'Saturday' : 'Leave'
      };
    }           
    
    // Override with actual data
    results.forEach(row => {
      attendanceMap[row.day] = {
        day: row.day,
        time_from: row.time_from,
        time_to: row.time_to,
        hours_worked: row.hours_worked
      };
    });          
    
    // Convert to array
    const attendanceArray = Object.values(attendanceMap);
    
    // Calculate summary
    const summary = {
      workedDays: attendanceArray.filter(d => d.hours_worked === '9').length,
      holidays: attendanceArray.filter(d => 
        ['Saturday', 'Sunday', 'Poya-day', 'Thai Pongal day'].includes(d.hours_worked)
      ).length, // Fixed misplaced `.length`
      leaveDays: attendanceArray.filter(d => d.hours_worked === 'Leave').length
    };
    
    res.json({
      attendance: attendanceArray,
      summary
    });
  });
});
//--------------------------------------------------------------------------
//Manage Intern Details
//--------------------------------------------------------------------------
app.get('/interns_details', (req, res) => {
  const query = 'SELECT * FROM intern_data'; 
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json(results);
    //console.log('All Interns details', results);
  });
})

// Edit an intern
app.put('/interns_details/:id', (req, res) => {
  const internId = req.params.id;
  const updatedData = req.body;
  
  const query = 'UPDATE intern_data SET ? WHERE TR_ID = ?';
  
  db.query(query, [updatedData, internId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Intern not found" });
    }

    // Now update the request table inside this callback
    const certiquery = 'UPDATE request SET alert = ? WHERE TR_ID = ?';
    
    db.query(certiquery, [updatedData.Certificate, internId], (err, certiResults) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      if (certiResults.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Intern not found in request table" });
      }
      
      return res.json({ success: true, message: "Intern updated successfully in both tables" });
    });
  });
});


// Delete an intern
app.delete('/interns_details/:id', (req, res) => {
  const internId = req.params.id;
  console.log("Deleting intern with ID:", internId);
  
  const query = 'DELETE FROM intern_data WHERE TR_ID = ?';
  db.query(query, [internId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Intern not found" });
    }
    res.json({ success: true, message: "Intern deleted successfully" });
  });
});
//--------------------------------------------------------------------------
//Calendar
//--------------------------------------------------------------------------

app.get('/holidays', (req, res) => {
  const query = 'SELECT id, date, holiday_name as name FROM holidays ORDER BY date ASC';
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    // Ensure we always return an array, even if empty
    res.json(Array.isArray(results) ? results : []);
  });
});

app.post('/ins_holidays', (req, res) => {
  const { date, name } = req.body;

  if (!date || !name) { 
    return res.status(400).json({ error: 'All fields are required' }); 
  }

  const query = `INSERT INTO holidays (date, holiday_name) VALUES (?, ?)`;
  db.query(query, [date, name], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // Return the newly created holiday in the same format as GET
    const getQuery = 'SELECT id, date, holiday_name as name FROM holidays WHERE id = ?';
    db.query(getQuery, [result.insertId], (err, newHoliday) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(newHoliday[0]); // Return the first (and only) result
    });
  });
});

//-------------------------------------------------------------------
//Upload All Interns Data
//-------------------------------------------------------------------

app.post('/upload_all', (req, res) => {
  const { parsedData } = req.body;
  console.log("Received data from frontend:", parsedData);

  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    return res.status(400).json({ message: 'No data provided' });
  }

  // First check for any duplicate TR_IDs in the incoming data
  const trIds = parsedData.map(row => row.tr_id);
  if (new Set(trIds).size !== trIds.length) {
    return res.status(400).json({ message: 'Duplicate TR_IDs found in the uploaded data' });
  }

  // Check for existing TR_IDs in database
  const checkTRIDQuery = 'SELECT TR_ID FROM intern_data WHERE TR_ID IN (?)'; 
  db.query(checkTRIDQuery, [trIds], (checkErr, results) => {
    if (checkErr) {
      console.error('Error checking TR_IDs:', checkErr);
      return res.status(500).json({ message: 'Database error during TR_ID check' });
    }

    if (results.length > 0) {
      const existingIds = results.map(row => row.tr_id);
      return res.status(400).json({ 
        message: 'Some TR_IDs already exist in database',
        unmatchedSiteIds: existingIds
      });
    }

    // Format data for insertion with proper date handling
    const insertData = parsedData.map(row => {
      // Helper function to handle date fields
      const formatDate = (dateStr) => {
        if (!dateStr) return null;
        // If it's already in ISO format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        // Try to parse as date object
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
      };

      return [
        row.tr_id,
        row.mr_ms || null,
        row.name,
        row.short_name || null,
        row.address || null,
        row.mobile_no || null,
        row.id_no || null,
        row.institute || null,
        row.program || null,
        formatDate(row.s_date),
        formatDate(row.e_date),
        formatDate(row.actual),
        formatDate(row.extended),
        row.category || 'General',
        row.bank || null,
        row.branch || null,
        row.account_no || null,
        row.memo_no || null,
        row.status || 'Active',
        row.cv || null,
        row.nda || null,
        row.appointment || null,
        row.certificate || null,
        row.referance || null,
        row.name_2 || null
      ];
    });

    const insertQuery = `INSERT INTO intern_data (
      TR_ID, Mr_Ms, Name, Short_Name, Address, Mobile_No, Id_No,
      Institute, Program, Start_Date, End_Date, Actual_End_Date,
      Extended_Period, Category, Bank, Branch, Account_No,
      Memo_Number, Status, CV, NDA, Appointment_Letter,
      Certificate, Reference_By, Name_2
    ) VALUES ?`;

    db.query(insertQuery, [insertData], (insertErr, result) => {
      if (insertErr) {
        console.error('Error inserting data:', insertErr);
        return res.status(500).json({ 
          message: 'Error inserting data', 
          error: insertErr.sqlMessage || insertErr.message 
        });
      }
      
      res.json({ 
        message: 'Data uploaded successfully', 
        count: result.affectedRows,
        insertedIds: result.insertId ? 
          Array.from({length: result.affectedRows}, (_, i) => result.insertId + i) : 
          []
      });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
