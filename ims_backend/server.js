const express = require('express');
const mysql = require('mysql2/promise');
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

// Database pool connection
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Wicki123@',
  database: process.env.DB_NAME || 'intern_management',
  //port: process.env.DB_PORT || 3306,
});

// Test connection
(async () => {
  try {
    const conn = await db.getConnection();
    console.log('Database connected successfully');
    conn.release();
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();

//---------------------------------------------------------------------
//login
//----------------------------------------------------------------
app.post('/login', async (req, res) => {
  const { userId, password, userType } = req.body;

  console.log("Login attempt:", { userId, userType });

  if (!userId || !password || !userType) {
    return res.status(400).json({ success: false, message: "Missing credentials" });
  }

  const query = `SELECT TR_ID, Short_Name, Password FROM intern_data WHERE TR_ID = ? AND Status='Active'`;

  try {
    const [results] = await db.query(query, [userId]);
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
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

app.post('/adminlogin', async (req, res) => {
  const { userId, password, userType } = req.body;

  console.log("Admin Login attempt:", { userId, userType });

  if (!userId || !password || !userType) {
    return res.status(400).json({ success: false, message: "Missing credentials" });
  }

  const query = `SELECT * FROM admin WHERE user_id = ? AND user_type = ?`;

  try {
    const [results] = await db.query(query, [userId, userType]);
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
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

//--------------------------------------------------------------------------------------------------------------------
// Attendance Form Handling
// //--------------------------------------------------------------------------------------------------------------------
app.post('/attendance', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }
  const query = 'SELECT Short_Name FROM intern_data WHERE TR_ID = ?';
  try {
    const [results] = await db.query(query, [userId]);
    if (results.length > 0) {
      const user = results[0];
      return res.json({ success: true,  name: user.Short_Name || 'Unknown' });
    }
    return res.status(404).json({ success: false, message: "User not found" });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

app.post('/ins_attendance', async (req, res) => {
  const { date, userId, timeSlot, division } = req.body; // Ensure 'userId' is used

  //console.log('Received data:', req.body);

  if (!date || !userId || !timeSlot || !division) { 
    console.log('Missing fields:', { date, userId, timeSlot, division });
    return res.status(400).json({ error: 'All fields are required' }); 
  }

  const query = `INSERT INTO attendance (tr_id, date, time_slot, division) VALUES (?, ?, ?, ?)`; 
  try {
    const [result] = await db.query(query, [userId, date, timeSlot, division]);
    res.json({ message: 'Attendance added successfully!', insertId: result.insertId });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});
//---------------------------------------------------------------------
//certificate request form
//----------------------------------------------------------------  
// Route to check if request already exists
app.post('/check-request', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
  }

  const checkQuery = `SELECT * FROM request WHERE tr_id = ? AND alert = "Requested" OR alert = "Issued"`;
  try {
      const [results] = await db.query(checkQuery, [userId]);
      res.json({ exists: results.length > 0 });
  } catch (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
  }
});

// Route to submit certificate request
app.post('/certificate', async (req, res) => {
  const { userId, name, start_date, end_date } = req.body;

  // Validate required fields
  if (!userId || !name || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: "All fields are required" });
  }

  // Check if request already exists
  const checkQuery = `SELECT * FROM request WHERE tr_id = ? AND alert = "Requested" OR alert = "Issued"`;
  try {
      const [results] = await db.query(checkQuery, [userId]);
      if (results.length > 0) {
          return res.status(409).json({ success: false, message: "You have already submitted a certificate request" });
      }

      // Insert new request
      const insertQuery = `INSERT INTO request (tr_id, name, start_date, end_date) VALUES (?, ?, ?, ?)`;
      const [insertResult] = await db.query(insertQuery, [userId, name, start_date, end_date]);

      // If insert is successful, update intern_data table
      const value = "Requested";
      const updateQuery = `UPDATE intern_data SET Certificate=? WHERE TR_ID = ?`;
      await db.query(updateQuery, [value, userId]);

      return res.json({ success: true, message: "Certificate request submitted successfully" });
  } catch (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
  }
});

//---------------------------------------------------------------------
//Admin Dashboard
//----------------------------------------------------------------
app.get('/admin_summary', async (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM intern_data WHERE Status = 'Active') AS active_count,
      (SELECT COUNT(*) FROM intern_data WHERE Status = 'Inactive') AS inactive_count
  `;

  try {
    const [results] = await db.query(query);
    res.json({ success: true, summary: results[0] });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});
app.get('/admin_certificate', async (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM intern_data WHERE Certificate = 'Requested') AS request_count,
      (SELECT COUNT(*) FROM intern_data WHERE Certificate = 'Issued') AS issue_count
  `;

  try {
    const [results] = await db.query(query);
    res.json({ success: true, certificate: results[0] });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

app.get('/daily_attendance', async (req, res) => {
  const currentDate = new Date().toISOString().split('T')[0]; 
  const query = `
    SELECT attendance.tr_id, intern_data.Short_Name, attendance.time_slot, attendance.division 
    FROM attendance 
    INNER JOIN intern_data ON attendance.tr_id = intern_data.TR_ID
    WHERE attendance.date = ?
  `;
  try {
    const [results] = await db.query(query, [currentDate]);
    res.json({ success: true, attendance: results });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

app.get('/active_interns', async (req, res) => {
  const query = 'SELECT TR_ID, Short_Name, Mobile_No, Start_Date, End_Date, Actual_End_Date FROM intern_data WHERE Status = "Active"';
  try {
    const [results] = await db.query(query);
    res.json(results);
    //console.log('Active Interns detais',results);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
})
app.get('/certificate_request', async (req, res) => {
  const query = 'SELECT tr_id, name, start_date, end_date FROM request WHERE alert = "Requested"';
  try {
    const [results] = await db.query(query);
    res.json(results);
    //console.log('Certificate detais',results);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
})

// For monthly active interns
app.get('/api/monthly_active_interns', async (req, res) => {
  const query = `
      SELECT TR_ID, Short_Name, Mobile_No, Institute, Programme, 
             Start_Date, End_Date
      FROM intern_data
  `;
  
  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// For yearly active interns
app.get('/api/yearly_active_interns', async (req, res) => {
  const query = `
      SELECT TR_ID, Short_Name, Mobile_No, Institute, Programme, 
             Start_Date, End_Date
      FROM intern_data
  `;
  
  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Get all available years from intern_data (for frontend year dropdown)
app.get('/api/available_years', async (req, res) => {
  try {
    const query = `
      SELECT 
        MIN(YEAR(Start_Date)) AS minYear, 
        MAX(YEAR(End_Date)) AS maxYear 
      FROM intern_data
      WHERE Start_Date IS NOT NULL AND End_Date IS NOT NULL
    `;
    const [rows] = await db.query(query);
    const minYear = rows[0].minYear;
    const maxYear = rows[0].maxYear;
    let years = [];
    if (minYear && maxYear) {
      for (let y = minYear; y <= maxYear; y++) {
        years.push(y);
      }
    }
    res.json({ years });
  } catch (err) {
    console.error("Error fetching available years:", err);
    res.status(500).json({ years: [] });
  }
});


//----------------------------------------------------------------------------------
//Payment
//----------------------------------------------------------------------------------
// Get payment data for a specific month
app.get('/payment_data/:month', async (req, res) => {
  const { month } = req.params;

  const query = `
    SELECT 
      tr_id, 
      month, 
      name, 
      workedDays, 
      holidays, 
      leaveDays, 
      allowance 
    FROM payment 
    WHERE month = ? 
    ORDER BY name ASC
  `;

  try {
    const [results] = await db.query(query, [month]);
    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: 'Database error' });
  }
});


// In your backend (e.g., Node.js/Express)
app.get('/monthly_pay/:year', async (req, res) => {
  try {
      const { year } = req.params;
      const query = `
          SELECT month, total_pay 
          FROM monthly_pay 
          WHERE month LIKE '${year}-%'
          ORDER BY month ASC
      `;
      const [result] = await db.query(query);
      res.json(result);
  } catch (error) {
      console.error("Error fetching monthly payment data:", error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
//---------------------------------------------------------------------------------
// Update Payment Manual
//---------------------------------------------------------------------------------

// 1. Get active interns
app.get('/api/interns/active', async (req, res) => {
  const query = 'SELECT TR_ID, Short_Name FROM intern_data WHERE Status = "Active"';
  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// 2. Create new payment (with duplicate check)
app.post('/api/payments', async (req, res) => {
  const { internId, month, name, workedDays, holidays, leaveDays, allowance } = req.body;

  if (!internId || !month || !name || workedDays === undefined || allowance === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // First check if a record already exists
  const checkQuery = 'SELECT * FROM mpayment WHERE tr_id = ? AND month = ?';
  try {
    const [checkResults] = await db.query(checkQuery, [internId, month]);
    if (checkResults.length > 0) {
      return res.status(409).json({ 
        error: 'Payment record already exists for this intern and month',
        existingRecord: checkResults[0]
      });
    }

    // Proceed with insertion if no existing record
    const paymentData = {
      tr_id: internId,
      month: month,
      name: name,
      workday: parseInt(workedDays) || 0,
      holiday: parseInt(holidays) || 0,
      leave: parseInt(leaveDays) || 0,
      allowance: parseFloat(allowance)
    };

    const insertQuery = 'INSERT INTO mpayment SET ?';
    const [result] = await db.query(insertQuery, paymentData);
    res.json({ 
      success: true,
      message: 'Payment saved successfully',
      paymentId: result.insertId
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// 3. Update existing payment
app.put('/api/payments', async (req, res) => {
  const { internId, month, name, workedDays, holidays, leaveDays, allowance } = req.body;

  if (!internId || !month || !name || workedDays === undefined || allowance === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const paymentData = {
    name: name,
    workday: parseInt(workedDays) || 0,
    holiday: parseInt(holidays) || 0,
    leave: parseInt(leaveDays) || 0,
    allowance: parseFloat(allowance)
  };

  const query = 'UPDATE mpayment SET ? WHERE tr_id = ? AND month = ?';
  try {
    const [result] = await db.query(query, [paymentData, internId, month]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment record not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Payment updated successfully',
      affectedRows: result.affectedRows
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: 'Failed to update payment' });
  }
});

// 4. Delete payment record
app.delete('/api/payments', async (req, res) => {
  const { internId, month } = req.body;

  if (!internId || !month) {
    return res.status(400).json({ error: 'Missing internId or month' });
  }

  const query = 'DELETE FROM mpayment WHERE tr_id = ? AND month = ?';
  try {
    const [result] = await db.query(query, [internId, month]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment record not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Payment deleted successfully',
      affectedRows: result.affectedRows
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// 5. Get payments by month
app.get('/api/payments_month/:month', async (req, res) => {
  const { month } = req.params;

  const query = `SELECT * FROM mpayment WHERE month = ? ORDER BY name ASC`;

  try {
    const [results] = await db.query(query, [month]);
    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ 
      success: false,
      error: 'Database error',
      details: err.sqlMessage 
    });
  }
});

// 6. Get yearly payment summary
app.get('/api/payments_summary/:year', async (req, res) => {
  const { year } = req.params;
  
  const query = 'SELECT month, SUM(allowance) AS totalPay FROM mpayment WHERE month LIKE ? GROUP BY month ORDER BY month ASC';  

  try {
    const [results] = await db.query(query, [`${year}-%`]);
    // Ensure we have all 12 months in the response
    const allMonths = Array.from({ length: 12 }, (_, i) => {
      const month = (i + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
    });

    const completeResults = allMonths.map(month => {
      const found = results.find(r => r.month === month);
      return found || {
        month,
        totalPay: 0,
      };
    });

    console.log("Yearly payment summary:", completeResults);
    res.json(completeResults);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: 'Database error' });
  }
});
//---------------------------------------------------------------------------------
//add intern
//---------------------------------------------------------------------------------

app.post('/upload', async (req, res) => {
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

  try {
    const [results] = await db.query(checkIDQuery, [internIds]);
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

    const [result] = await db.query(addnewQuery, [addnewValues]);
    res.json({ 
      message: `Successfully added ${parsedData.length} intern(s)!`,
      count: parsedData.length
    });
  } catch (err) {
    console.error('Database insertion error:', err);
    return res.status(500).json({ 
      message: 'Failed to save data to database.',
      error: err.message 
    });
  }
});
//--------------------------------------------------------------------------
//Mounthly Summary
//--------------------------------------------------------------------------
app.get('/monthly_attendance/:userId/:month', async (req, res) => {
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

  try {
    const [results] = await db.query(query, [userId, year, monthNumber, year, monthNumber]);
              
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
        ['Saturday', 'Sunday', 'Poya-day', 'Thai Pongal day','Independence Day',
          'New Year Day', 'May Day', 'Holy Prophets Birthday', 'Deepavali',
         'Christmas', 'Special Company Holiday', 'Good Friday', 'Mercantile Holiday', 'Election Day'].includes(d.hours_worked)
      ).length, // Fixed misplaced `.length`
      leaveDays: attendanceArray.filter(d => d.hours_worked === 'Leave').length,
    };
    // Calculate derived values after the initial object is created
    const dateofmonth = summary.workedDays + summary.holidays + summary.leaveDays;
    const amountperday = (10000 / dateofmonth).toFixed(2);
    const countofday = summary.workedDays + summary.holidays;
    const amount = (amountperday * countofday).toFixed(2);

    summary.allowance = parseFloat(amount);
        
    res.json({
      attendance: attendanceArray,
      summary
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});


app.post('/store_payment', async (req, res) => {
  const paymentData = req.body; 
  
    console.log("Payment data:", paymentData);
  
    if (!Array.isArray(paymentData)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid data format. Expected an array of payment records.' 
      });
    }

  // Validate required fields
  const requiredFields = ['tr_id','month', 'name', 'workedDays', 'holidays', 'leaveDays', 'allowance'];
  
  const invalidRows = paymentData.filter(row => 
    !requiredFields.every(field => row[field] !== undefined && row[field] !== null)
  );

  if (invalidRows.length > 0) {
    return res.status(400).json({ 
      message: 'Missing required fields in one or more rows.',
      invalidRows: invalidRows.map(row => ({ tr_id: row.tr_id, missing: requiredFields.filter(f => !row[f]) }))
    });
  }

  try {
    // Check for duplicates (existing records with same tr_id and month)
    const checkConditions = paymentData.map(row => [row.tr_id, row.month]);
    const checkIDQuery = 'SELECT tr_id, month FROM payment WHERE (tr_id, month) IN (?)';

    const [existingRecords] = await db.query(checkIDQuery, [checkConditions]);

    // Separate new records and records to update
    const newRecords = paymentData.filter(row => 
      !existingRecords.some(existing => 
        existing.tr_id === row.tr_id && existing.month === row.month
      )
    );

    const recordsToUpdate = paymentData.filter(row => 
      existingRecords.some(existing => 
        existing.tr_id === row.tr_id && existing.month === row.month
      )
    );

    // Process updates if any
    if (recordsToUpdate.length > 0) {
      const updatePromises = recordsToUpdate.map(row => {
        return new Promise((resolve, reject) => {
          const updateQuery = `UPDATE payment SET 
            name = ?, 
            workedDays = ?, 
            holidays = ?, 
            leaveDays = ?, 
            allowance = ?
            WHERE tr_id = ? AND month = ?`;
          
          db.query(updateQuery, [
            row.name,
            row.workedDays,
            row.holidays,
            row.leaveDays,
            row.allowance,
            row.tr_id,
            row.month
          ], (updateErr, result) => {
            if (updateErr) reject(updateErr);
            else resolve(result);
          });
        });
      });

      await Promise.all(updatePromises);
    }

    // Process inserts if any
    let insertResult = { affectedRows: 0 };
    if (newRecords.length > 0) {
      const addnewQuery = `INSERT INTO payment (
        tr_id, month, name, workedDays, holidays, leaveDays, allowance
      ) VALUES ?`;

      const addnewValues = newRecords.map(row => [
        row.tr_id,
        row.month,
        row.name,
        row.workedDays,
        row.holidays,
        row.leaveDays,
        row.allowance
      ]);

      insertResult = await new Promise((resolve, reject) => {
        db.query(addnewQuery, [addnewValues], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    res.json({ 
      success: true,
      message: `Payment records processed successfully!`,
      insertedCount: newRecords.length,
      updatedCount: recordsToUpdate.length,
      totalProcessed: paymentData.length
    });

  } catch (error) {
    console.error('Error processing payment data:', error);
    res.status(500).json({ 
      message: 'Failed to process payment data.',
      error: error.message 
    });
  }
});

app.post('/monthly_payment', async (req, res) => {
  const paymentData = req.body; 
  
  console.log("Payment data:", paymentData);
  
  if (!Array.isArray(paymentData)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid data format. Expected an array of payment records.' 
    });
  }

  // Validate required fields
  const requiredFields = ['month', 'allowance']; // Now using 'allowance' for the additional amount
  
  const invalidRows = paymentData.filter(row => 
    !requiredFields.every(field => row[field] !== undefined && row[field] !== null)
  );

  if (invalidRows.length > 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields in one or more rows.',
      invalidRows: invalidRows.map(row => ({ 
        month: row.month, 
        missing: requiredFields.filter(f => row[f] === undefined || row[f] === null) 
      }))
    });
  }

  try {
    // Check for existing records
    const monthsToCheck = paymentData.map(row => row.month);
    const checkQuery = 'SELECT month, total_pay FROM monthly_pay WHERE month IN (?)';
    
    const [existingRecords] = await db.query(checkQuery, [monthsToCheck]);
    
    // Separate new records and records to update
    const newRecords = paymentData.filter(row => 
      !existingRecords.some(existing => existing.month === row.month)
    );
  
    const recordsToUpdate = paymentData.filter(row => 
      existingRecords.some(existing => existing.month === row.month)
    );

    // Process updates - add allowance to existing total_pay
    if (recordsToUpdate.length > 0) {
      const updatePromises = recordsToUpdate.map(row => {
        const existingRecord = existingRecords.find(r => r.month === row.month);
        const newTotal = parseFloat(existingRecord.total_pay) + parseFloat(row.allowance);
        
        return new Promise((resolve, reject) => {
          const updateQuery = `UPDATE monthly_pay SET 
            total_pay = ?
            WHERE month = ?`;
          
          db.query(updateQuery, [
            newTotal,
            row.month
          ], (updateErr, result) => {
            if (updateErr) reject(updateErr);
            else resolve(result);
          });
        });
      });

      await Promise.all(updatePromises);
    }

    // Process inserts - for new months, total_pay = allowance
    let insertResult = { affectedRows: 0 };
    if (newRecords.length > 0) {
      const addnewQuery = `INSERT INTO monthly_pay (
        month, total_pay
      ) VALUES ?`;

      const addnewValues = newRecords.map(row => [
        row.month,
        row.allowance // For new records, total_pay = allowance
      ]);

      insertResult = await new Promise((resolve, reject) => {
        db.query(addnewQuery, [addnewValues], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    res.json({ 
      success: true,
      message: `Payment records processed successfully!`,
      insertedCount: insertResult.affectedRows || newRecords.length,
      updatedCount: recordsToUpdate.length,
      totalProcessed: paymentData.length
    });

  } catch (error) {
    console.error('Error processing payment data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process payment data.',
      error: error.message 
    });
  }
});
//--------------------------------------------------------------------------
//Manage Payment Details  
//--------------------------------------------------------------------------
app.get('/monthly_attendance/:month', async (req, res) => {
  const { month } = req.params;
  const [year, monthNumber] = month.split('-');
  
  console.log('Fetching attendance for:', { year, monthNumber });

  const query = `
    SELECT tr_id,
        DAY(date) as day,
        date,
        '08.00 am' as time_from,
        '05.00 pm' as time_to,
        '9' as hours_worked
    FROM attendance 
    WHERE YEAR(date) = ? AND MONTH(date) = ?
    
    UNION ALL
    
    SELECT 
        DAY(date) as day,
        date,
        '' as time_from,
        '' as time_to,
        holiday_name AS hours_worked
    FROM holidays 
    WHERE YEAR(date) = ? AND MONTH(date) = ?

    UNION ALL
    SELECT TR_ID as id, Short_name as name FROM intern_data
  `;

  try {
    const [results] = await db.query(query, [ year, monthNumber, year, monthNumber]);
              
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
        id: row.id,
        name: row.name,
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
        ['Saturday', 'Sunday', 'Poya-day', 'Thai Pongal day','Independence Day',
          'New Year Day', 'May Day', 'Holy Prophets Birthday', 'Deepavali',
         'Christmas', 'Special Company Holiday', 'Good Friday', 'Mercantile Holiday', 'Election Day' ].includes(d.hours_worked)
      ).length, // Fixed misplaced `.length`
      leaveDays: attendanceArray.filter(d => d.hours_worked === 'Leave').length
    };
    
    res.json({
      attendance: attendanceArray,
      summary
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

//--------------------------------------------------------------------------
//Manage Intern Details
//--------------------------------------------------------------------------
app.get('/interns_details', async (req, res) => {
  const query = 'SELECT * FROM intern_data'; 
  try {
    const [results] = await db.query(query);
    res.json(results);
    //console.log('All Interns details', results);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
})

// Edit an intern
app.put('/interns_details/:id', async (req, res) => {
  const internId = req.params.id;
  const updatedData = req.body;

  // Ensure 'Certificate' has a valid value
  if (updatedData.Certificate === null || updatedData.Certificate === undefined) {
    updatedData.Certificate = ''; // Default to an empty string if not provided
  }

  const query = 'UPDATE intern_data SET ? WHERE TR_ID = ?';
  
  try {
    const [results] = await db.query(query, [updatedData, internId]);
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Intern not found" });
    }

    // Now update the request table, but don't return 404 if not found
    const certiquery = 'UPDATE request SET alert = ? WHERE TR_ID = ?';
    await db.query(certiquery, [updatedData.Certificate, internId]);
    
    return res.json({ success: true, message: "Intern updated successfully" });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});


// Delete an intern
app.delete('/interns_details/:id', async (req, res) => {
  const internId = req.params.id;
  console.log("Deleting intern with ID:", internId);
  
  const query = 'DELETE FROM intern_data WHERE TR_ID = ?';
  try {
    const [results] = await db.query(query, [internId]);
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Intern not found" });
    }
    res.json({ success: true, message: "Intern deleted successfully" });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});
//--------------------------------------------------------------------------
//Calendar
//--------------------------------------------------------------------------
// Get all holidays
app.get('/holidays', async (req, res) => {
  const query = 'SELECT id, date, holiday_name as name FROM holidays ORDER BY date ASC';
  try {
    const [results] = await db.query(query);
    res.json(Array.isArray(results) ? results : []);
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// Add new holiday
app.post('/ins_holidays', async (req, res) => {
  const { date, name } = req.body;

  if (!date || !name) { 
    return res.status(400).json({ error: 'All fields are required' }); 
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  const query = 'INSERT INTO holidays (date, holiday_name) VALUES (?, ?)';
  try {
    const [result] = await db.query(query, [date, name]);
    
    // Return the newly created holiday
    const getQuery = 'SELECT id, date, holiday_name as name FROM holidays WHERE id = ?';
    const [newHoliday] = await db.query(getQuery, [result.insertId]);
    res.status(201).json(newHoliday[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Holiday already exists for this date' });
    }
    console.error("Database error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// Update holiday
app.put('/holidays/:id', async (req, res) => {
  const { id } = req.params;
  const { date, name } = req.body;

  if (!date || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // First check if the holiday exists
  const checkQuery = 'SELECT id FROM holidays WHERE id = ?';
  try {
    const [results] = await db.query(checkQuery, [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: "Holiday not found" });
    }

    // Proceed with update
    const updateQuery = 'UPDATE holidays SET date = ?, holiday_name = ? WHERE id = ?';
    await db.query(updateQuery, [date, name, id]);

    // Return the updated holiday
    const getQuery = 'SELECT id, date, holiday_name as name FROM holidays WHERE id = ?';
    const [updatedHoliday] = await db.query(getQuery, [id]);
    res.json(updatedHoliday[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Another holiday already exists for this date' });
    }
    console.error("Database error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// Delete holiday
app.delete('/holidays/:id', async (req, res) => {
  const { id } = req.params;

  // First check if the holiday exists
  const checkQuery = 'SELECT id FROM holidays WHERE id = ?';
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Holiday not found" });
    }

    // Proceed with deletion
    const deleteQuery = 'DELETE FROM holidays WHERE id = ?';
    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true, message: "Holiday deleted successfully" });
    });
  });
});
//-------------------------------------------------------------------
//Upload All Interns Data
//-------------------------------------------------------------------

app.post('/upload_all', async (req, res) => {
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
  try {
    const [results] = await db.query(checkTRIDQuery, [trIds]);
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
      Institute, Programme, Start_Date, End_Date, Actual_End_Date,
      Extended_Period, Category, Bank, Branch, Account_No,
      Memo_Number, Status, CV, NDA, Appointment_Letter,
      Certificate, Reference_By, Name_2
    ) VALUES ?`;

    const [result] = await db.query(insertQuery, [insertData]);
    res.json({ 
      message: 'Data uploaded successfully', 
      count: result.affectedRows,
      insertedIds: result.insertId ? 
        Array.from({length: result.affectedRows}, (_, i) => result.insertId + i) : 
        []
    });
  } catch (err) {
    console.error('Error inserting data:', err);
    return res.status(500).json({ 
      message: 'Error inserting data', 
      error: err.sqlMessage || err.message 
    });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
