import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

const LoginPage = () => {
  const [userId, setUser] = useState(""); 
  const [password, setPass] = useState("");
  const [userType, setType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

    const handleSubmit = async (e) => {
      e.preventDefault(); // Prevent default form submission
  
      try {
          let response;
          if (userType === "admin") {
              response = await axios.post("http://localhost:5000/adminlogin", {
                  userId,
                  password,
                  userType,
              });
          } else {
              response = await axios.post("http://localhost:5000/login", {
                  userId,
                  password,
                  userType,
              });
          }
  
          if (response.data.success) {
              if (userType === "admin") {
                  navigate("/admin_dashboard");
              } else if (userType === "intern") {
                  localStorage.setItem("user", userId);
                  navigate("/attendance");
              }
          } else {
              setErrorMessage(response.data.message);
          }
      } catch (error) {
          console.error("Login failed:", error);
          setErrorMessage("Error logging in. Please try again.");
      }
  };

  return (
    <div className="login_container">
      <div className="logo">
        <div className="logo-left">
          <h1>Intern Management System</h1>
          <div>
            <p><hr></hr>&copy; 2025 Intern Management System. All rights reserved.<br></br>
              Developed by K.G.N.Wickramasingha / @NIBM Kandy</p>
          </div>
        </div>
        <div className="login-right">
          <h2>Welcome Back!</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="userType">Login As:</label>
            <select
              id="userType" value={userType} onChange={(e) => setType(e.target.value)} required >
              <option value="">Select User Type</option>
              <option value="admin">Admin</option>
              <option value="intern">Intern</option>
            </select>
            <input
              type="text" placeholder="Enter User Id" required value={userId} onChange={(e) => setUser(e.target.value)} />
            <input
              type="password" placeholder="Enter Password" required value={password} onChange={(e) => setPass(e.target.value)} />

            <button type="submit">Login</button>
          </form>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
      </div>
      
    </div>
  );
};

export default LoginPage;

