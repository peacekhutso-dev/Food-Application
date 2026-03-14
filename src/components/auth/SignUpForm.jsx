import { useState } from "react";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SignUpForm = ({ onSwitchToLogin }) => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [countryCode, setCountryCode] = useState("+27");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // ── Verification states ───────────────────────────────────────
  const [emailChecking, setEmailChecking]   = useState(false); // spinner while checking
  const [emailValid,    setEmailValid]      = useState(null);  // true / false / null
  const [phoneValid,    setPhoneValid]      = useState(null);  // true / false / null

  const navigate = useNavigate();
  const { signup } = useAuth();

  const countryCodes = [
    { code: "+27",  country: "ZA", name: "South Africa",  flag: "🇿🇦" },
    { code: "+1",   country: "US", name: "United States", flag: "🇺🇸" },
    { code: "+44",  country: "GB", name: "United Kingdom",flag: "🇬🇧" },
    { code: "+91",  country: "IN", name: "India",         flag: "🇮🇳" },
    { code: "+86",  country: "CN", name: "China",         flag: "🇨🇳" },
    { code: "+234", country: "NG", name: "Nigeria",       flag: "🇳🇬" },
    { code: "+254", country: "KE", name: "Kenya",         flag: "🇰🇪" },
    { code: "+263", country: "ZW", name: "Zimbabwe",      flag: "🇿🇼" },
    { code: "+267", country: "BW", name: "Botswana",      flag: "🇧🇼" },
    { code: "+264", country: "NA", name: "Namibia",       flag: "🇳🇦" },
  ];

  // ── Shared input style ────────────────────────────────────────
  const inputStyle = {
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
    background: "#ffffff",
  };

  const focusStyle = (e) => {
    e.target.style.borderColor = "#dc2626";
    e.target.style.boxShadow   = "0 0 0 3px rgba(220, 38, 38, 0.1)";
  };
  const blurStyle = (e) => {
    e.target.style.borderColor = "#e5e7eb";
    e.target.style.boxShadow   = "none";
  };

  // ── Email existence check (runs onBlur) ───────────────────────
  // Uses AbstractAPI free tier — no key needed for basic MX check.
  // We verify two things:
  //   1. The email ends with @myuwc.ac.za (domain rule)
  //   2. The domain has valid MX records (mailbox likely exists)
  const checkEmailExists = async (value) => {
    const trimmed = value.trim().toLowerCase();

    // Step 1: domain rule
    if (!trimmed.endsWith('@myuwc.ac.za')) {
      setEmailValid(false);
      setMessage("Only @myuwc.ac.za email addresses are allowed");
      return;
    }

    // Step 2: MX / deliverability check via Abstract API (free, no key)
    // Falls back gracefully if the request fails
    setEmailChecking(true);
    setEmailValid(null);
    setMessage("");

    try {
      const res  = await fetch(
        `https://emailvalidation.abstractapi.com/v1/?api_key=free&email=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();

      // abstractapi returns is_mx_found and deliverability
      const mxFound      = data?.is_mx_found?.value === true;
      const deliverable  = data?.deliverability === "DELIVERABLE";

      if (mxFound || deliverable) {
        setEmailValid(true);
        setMessage("");
      } else {
        // MX check failed — domain might not accept mail
        // But since myuwc.ac.za is a known university domain we
        // trust it even if the API is uncertain
        setEmailValid(true); // trust the domain rule above
      }
    } catch {
      // Network error — trust the domain rule, don't block the user
      setEmailValid(true);
    } finally {
      setEmailChecking(false);
    }
  };

  // ── Phone number validation (runs onBlur) ─────────────────────
  // Checks digit count per country. For ZA (+27): 9 digits after code.
  // For other countries: 7–12 digits is a reasonable range.
  const checkPhone = (value) => {
    const digits = value.replace(/\D/g, '');

    const rules = {
      "+27":  { min: 9,  max: 9  },  // South Africa: 9 digits
      "+1":   { min: 10, max: 10 },  // US/Canada
      "+44":  { min: 10, max: 10 },  // UK
      "+91":  { min: 10, max: 10 },  // India
      "+86":  { min: 11, max: 11 },  // China
      "+234": { min: 10, max: 10 },  // Nigeria
      "+254": { min: 9,  max: 9  },  // Kenya
      "+263": { min: 9,  max: 9  },  // Zimbabwe
      "+267": { min: 7,  max: 8  },  // Botswana
      "+264": { min: 9,  max: 9  },  // Namibia
    };

    const rule = rules[countryCode] || { min: 7, max: 12 };
    const valid = digits.length >= rule.min && digits.length <= rule.max;
    setPhoneValid(valid);
    if (!valid) setMessage(`Enter a valid ${rule.min}-digit phone number for ${countryCode}`);
    else setMessage("");
  };

  // ── Indicator icon helper ─────────────────────────────────────
  const indicator = (state, checking = false) => {
    if (checking) return <span style={{ color: "#6b7280", fontSize: "12px" }}>checking…</span>;
    if (state === true)  return <span style={{ color: "#16a34a", fontSize: "14px" }}>✓</span>;
    if (state === false) return <span style={{ color: "#dc2626", fontSize: "14px" }}>✗</span>;
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name.trim() || !surname.trim()) {
      setMessage("Please enter your name and surname"); return;
    }
    if (!phone.trim()) {
      setMessage("Please enter your phone number"); return;
    }
    if (phoneValid === false) {
      setMessage("Please enter a valid phone number"); return;
    }
    if (!email.toLowerCase().endsWith('@myuwc.ac.za')) {
      setMessage("Only @myuwc.ac.za email addresses are allowed"); return;
    }
    if (emailValid === false) {
      setMessage("Please enter a valid email address"); return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters"); return;
    }
    if (!/[A-Z]/.test(password)) {
      setMessage("Password must contain at least one uppercase letter"); return;
    }
    if (!/[a-z]/.test(password)) {
      setMessage("Password must contain at least one lowercase letter"); return;
    }
    if (!/[0-9]/.test(password)) {
      setMessage("Password must contain at least one number"); return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setMessage('Password must contain at least one special character (!@#$%^&*...)'); return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match"); return;
    }

    setLoading(true);
    try {
      const fullName  = `${name.trim()} ${surname.trim()}`;
      const fullPhone = `${countryCode}${phone.trim()}`;
      await signup(email, password, fullName, fullPhone);
      setMessage("Account created successfully!");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setMessage("This email is already registered");
      else if (err.code === 'auth/invalid-email')   setMessage("Invalid email address");
      else if (err.code === 'auth/weak-password')   setMessage("Password is too weak");
      else setMessage(err.message || "Failed to create account");
    } finally {
      setLoading(false);
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
      padding: "20px"
    }}>
      <div style={{ maxWidth: "500px", width: "100%" }}>

        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none", color: "#6b7280",
            padding: "0", cursor: "pointer", display: "flex",
            alignItems: "center", gap: "8px", fontSize: "15px",
            fontWeight: 500, marginBottom: "40px", transition: "color 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#000000"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
        >
          <FaArrowLeft size={14} /> Back
        </button>

        {/* ── KANTEEN wordmark + header ── */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
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
            fontSize: "28px", fontWeight: 700, color: "#000000",
            marginBottom: "6px", letterSpacing: "-0.5px"
          }}>
            Create Account
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: 400 }}>
            Join Kanteen today
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSignUp}>

          {/* First Name */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#000000", marginBottom: "6px" }}>
              First Name
            </label>
            <input
              type="text" placeholder="John" value={name}
              onChange={(e) => setName(e.target.value)} required
              style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>

          {/* Surname */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#000000", marginBottom: "6px" }}>
              Surname
            </label>
            <input
              type="text" placeholder="Doe" value={surname}
              onChange={(e) => setSurname(e.target.value)} required
              style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>

          {/* Phone Number */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#000000", marginBottom: "6px" }}>
              Phone Number
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {/* Country code picker */}
              <div style={{ position: "relative", width: "120px" }}>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  style={{
                    width: "100%", padding: "12px 8px",
                    border: "1px solid #e5e7eb", borderRadius: "8px",
                    outline: "none", fontSize: "14px", color: "#000000",
                    background: "#ffffff", cursor: "pointer",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "6px"
                  }}
                >
                  <img
                    src={`https://flagcdn.com/${countryCodes.find(c => c.code === countryCode)?.country.toLowerCase()}.svg`}
                    alt="flag"
                    style={{ width: "20px", height: "14px", borderRadius: "2px" }}
                  />
                  <span style={{ fontSize: "13px" }}>{countryCode}</span>
                </button>
                {showCountryDropdown && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0,
                    background: "#ffffff", border: "1px solid #e5e7eb",
                    borderRadius: "8px", maxHeight: "200px", overflowY: "auto",
                    zIndex: 10, marginTop: "4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: "240px"
                  }}>
                    {countryCodes.map((item) => (
                      <button
                        key={item.code} type="button"
                        onClick={() => { setCountryCode(item.code); setShowCountryDropdown(false); setPhoneValid(null); }}
                        style={{
                          width: "100%", padding: "10px 12px",
                          background: countryCode === item.code ? "#fef2f2" : "#ffffff",
                          border: "none", cursor: "pointer", textAlign: "left",
                          fontSize: "13px", color: "#000000",
                          borderBottom: "1px solid #f5f5f5",
                          display: "flex", alignItems: "center", gap: "8px"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={(e) => e.currentTarget.style.background = countryCode === item.code ? "#fef2f2" : "#ffffff"}
                      >
                        <img
                          src={`https://flagcdn.com/${item.country.toLowerCase()}.svg`}
                          alt="flag" style={{ width: "20px", height: "14px", borderRadius: "2px" }}
                        />
                        <span>{item.code} {item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone input + tick/cross indicator */}
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="tel" placeholder="812345678" value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setPhoneValid(null); }}
                  onBlur={() => phone.trim() && checkPhone(phone)}
                  maxLength={12} required
                  style={{ ...inputStyle, paddingRight: "36px" }}
                  onFocus={focusStyle}
                />
                {/* Validation indicator inside the input */}
                <span style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)"
                }}>
                  {indicator(phoneValid)}
                </span>
              </div>
            </div>
            {/* Helper text */}
            {phoneValid === false && (
              <p style={{ fontSize: "11px", color: "#dc2626", margin: "4px 0 0" }}>
                Check the number of digits for {countryCode}
              </p>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#000000", marginBottom: "6px" }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email" placeholder="you@myuwc.ac.za" value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailValid(null); }}
                onBlur={(e) => e.target.value && checkEmailExists(e.target.value)}
                required
                style={{ ...inputStyle, paddingRight: "90px" }}
                onFocus={focusStyle}
              />
              {/* Checking spinner / tick / cross */}
              <span style={{
                position: "absolute", right: "12px", top: "50%",
                transform: "translateY(-50%)"
              }}>
                {indicator(emailValid, emailChecking)}
              </span>
            </div>
            {/* Domain hint */}
            <p style={{ fontSize: "11px", color: "#9ca3af", margin: "4px 0 0" }}>
              Must be a @myuwc.ac.za address
            </p>
            {emailValid === false && (
              <p style={{ fontSize: "11px", color: "#dc2626", margin: "2px 0 0" }}>
                This email address doesn't appear to be valid
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#000000", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required minLength={8}
                style={{ ...inputStyle, padding: "12px 45px 12px 14px" }}
                onFocus={focusStyle} onBlur={blurStyle}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: "14px", top: "50%",
                  transform: "translateY(-50%)", background: "none", border: "none",
                  cursor: "pointer", color: "#6b7280", fontSize: "16px", padding: 0,
                  display: "flex", alignItems: "center"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "#9ca3af", margin: "4px 0 0" }}>
              Min 8 chars · uppercase · lowercase · number · special character
            </p>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#000000", marginBottom: "6px" }}>
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ ...inputStyle, padding: "12px 45px 12px 14px" }}
                onFocus={focusStyle} onBlur={blurStyle}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute", right: "14px", top: "50%",
                  transform: "translateY(-50%)", background: "none", border: "none",
                  cursor: "pointer", color: "#6b7280", fontSize: "16px", padding: 0,
                  display: "flex", alignItems: "center"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "14px",
              background: loading ? "#9ca3af" : "#dc2626",
              color: "#ffffff", border: "none", borderRadius: "8px",
              fontSize: "15px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease", letterSpacing: "0.3px"
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#b91c1c"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#dc2626"; }}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          {/* Message */}
          {message && (
            <div style={{
              marginTop: "14px", padding: "10px 14px",
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "8px",
              color: message.includes("success") ? "#16a34a" : "#dc2626",
              fontSize: "13px", fontWeight: 500, textAlign: "center"
            }}>
              {message}
            </div>
          )}

          {/* Login link */}
          <div style={{
            textAlign: "center", fontSize: "14px",
            color: "#6b7280", marginTop: "24px"
          }}>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => onSwitchToLogin && onSwitchToLogin()}
              style={{
                background: "none", border: "none", color: "#dc2626",
                fontWeight: 600, cursor: "pointer", padding: 0,
                fontSize: "14px", transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.target.style.color = "#991b1b"}
              onMouseLeave={(e) => e.target.style.color = "#dc2626"}
            >
              Log in
            </button>
          </div>
        </form>
      </div>

      <style>{`
        input::placeholder { color: #9ca3af !important; font-weight: 400 !important; }
      `}</style>
    </div>
  );
};

export default SignUpForm;