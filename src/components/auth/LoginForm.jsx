import { useState } from "react";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../firebase_data/auth";

const LoginForm = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await loginUser(email, password);
    setLoading(false);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Login successful! Redirecting...");
      setTimeout(() => navigate("/vendor"), 1000);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      background: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative"
    }}>
      {/* Login Form */}
      <div style={{
        background: "#ffffff",
        width: "500px",
        height: "580px",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            padding: "0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 500,
            marginBottom: "20px",
            transition: "color 0.2s ease",
            position: "absolute",
            top: "20px",
            left: "20px"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#000000"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
        >
          <FaArrowLeft size={12} /> Back
        </button>

        {/* Logo and Header */}
        <div style={{
          textAlign: "center",
          marginTop: "40px",
          marginBottom: "30px"
        }}>
          {/* KANTEEN wordmark — bold, spaced-out, red */}
          <div style={{
            fontSize: "36px",
            fontWeight: 800,
            letterSpacing: "6px",
            color: "#dc2626",
            marginBottom: "20px",
            fontFamily: "'Poppins', system-ui, sans-serif"
          }}>
            KANTEEN
          </div>

          <h1 style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#000000",
            marginBottom: "6px",
            letterSpacing: "-0.5px"
          }}>
            Welcome back
          </h1>
          <p style={{
            color: "#6b7280",
            fontSize: "14px",
            fontWeight: 400
          }}>
            Log in to your Kanteen account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Email Input */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#000000",
              marginBottom: "6px"
            }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@myuwc.ac.za"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                boxSizing: "border-box",
                outline: "none",
                color: "#000000",
                fontWeight: 400,
                background: "#ffffff"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#dc2626";
                e.target.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#000000",
              marginBottom: "6px"
            }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 45px 12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                  outline: "none",
                  color: "#000000",
                  fontWeight: 400,
                  background: "#ffffff"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#dc2626";
                  e.target.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  fontSize: "16px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div style={{ marginBottom: "20px", textAlign: "right" }}>
            <button
              type="button"
              onClick={() => {/* Add forgot password logic */}}
              style={{
                background: "none",
                border: "none",
                color: "#dc2626",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "13px",
                cursor: "pointer",
                padding: 0,
                transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.target.style.color = "#991b1b"}
              onMouseLeave={(e) => e.target.style.color = "#dc2626"}
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#9ca3af" : "#dc2626",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              letterSpacing: "0.3px"
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#b91c1c";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "#dc2626";
            }}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          {/* Message */}
          {message && (
            <div style={{
              marginTop: "14px",
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: message.includes("success") ? "#991b1b" : "#dc2626",
              fontSize: "13px",
              fontWeight: 500,
              textAlign: "center"
            }}>
              {message}
            </div>
          )}

          {/* Sign Up Link */}
          <div style={{
            textAlign: "center",
            fontSize: "14px",
            color: "#6b7280",
            marginTop: "auto",
            paddingTop: "20px"
          }}>
            New to Kanteen?{" "}
            <button
              type="button"
              onClick={() => onSwitchToSignup && onSwitchToSignup()}
              style={{
                background: "none",
                border: "none",
                color: "#dc2626",
                textDecoration: "none",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                fontSize: "14px",
                transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.target.style.color = "#991b1b"}
              onMouseLeave={(e) => e.target.style.color = "#dc2626"}
            >
              Create an account
            </button>
          </div>
        </form>
      </div>

      <style>{`
        input::placeholder {
          color: #9ca3af !important;
          font-weight: 400 !important;
        }
      `}</style>
    </div>
  );
};

export default LoginForm;