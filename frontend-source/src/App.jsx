
import { useEffect, useState } from "react";
import "./App.css";

const API = "https://employee-dashboard-assignment3.onrender.com/employeelist";
const AUTH = "https://employee-dashboard-assignment3.onrender.com/api/auth";
export default function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("employeeToken") || ""
  );
  const [screen, setScreen] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    position: "",
    location: "",
    salary: ""
  });

  function logout() {
    sessionStorage.removeItem("employeeToken");
    setToken("");
    setEmployees([]);
    setPassword("");
    setScreen("login");
    setError("");
  }

  async function submitAuth(e) {
    e.preventDefault();
    setAuthLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${AUTH}/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      sessionStorage.setItem("employeeToken", data.token);
      setToken(data.token);
      setScreen("dashboard");
      setPassword("");
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Make sure node app.js is running."
          : err.message
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function apiRequest(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      logout();
      throw new Error("Your session expired. Please log in again.");
    }

    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  async function loadEmployees() {
    if (!token) return;

    try {
      const data = await apiRequest(API);
      setEmployees(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (token) {
      setScreen("dashboard");
      loadEmployees();
    } else {
      setScreen("login");
    }
    // Run when the token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function openForm(employee = null) {
    setEditing(employee);
    setForm(
      employee
        ? {
            name: employee.name || "",
            position: employee.position || "",
            location: employee.location || "",
            salary: employee.salary ?? ""
          }
        : { name: "", position: "", location: "", salary: "" }
    );
    setShowForm(true);
    setError("");
  }

  async function saveEmployee(e) {
    e.preventDefault();

    try {
      await apiRequest(API, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          salary: Number(form.salary),
          ...(editing ? { _id: editing._id } : {})
        })
      });

      setShowForm(false);
      await loadEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteEmployee(id) {
    if (!window.confirm("Delete this employee?")) return;

    try {
      await apiRequest(`${API}/${id}`, { method: "DELETE" });
      await loadEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = employees.filter((emp) =>
    [emp.name, emp.position, emp.location].some((value) =>
      value?.toLowerCase().includes(search.toLowerCase())
    )
  );

  if (!token || screen !== "dashboard") {
    return (
      <div className="auth-page">
        <div className="auth-decoration">
          <div className="auth-brand">
            <span className="brand-icon">E</span> Employa
          </div>
          <div className="auth-message">
            <span className="eyebrow">EMPLOYEE MANAGEMENT</span>
            <h1>Your team.<br />All in one place.</h1>
            <p>A simpler way to manage employee records and office information.</p>
          </div>
          <div className="auth-bottom">Employa · Employee Workspace</div>
        </div>

        <div className="auth-panel">
          <form className="auth-card" onSubmit={submitAuth}>
            <p className="eyebrow">{isRegister ? "GET STARTED" : "WELCOME BACK"}</p>
            <h2>{isRegister ? "Create your account" : "Sign in to Employa"}</h2>
            <p className="muted">
              {isRegister
                ? "Register with your email to access the dashboard."
                : "Enter your account details to continue."}
            </p>

            {error && <div className="error-banner">{error}</div>}

            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                minLength={isRegister ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? "At least 8 characters" : "Enter your password"}
              />
            </label>

            {isRegister && (
              <p className="muted auth-hint">
                Use at least 8 characters. Your password is hashed by the server.
              </p>
            )}

            <button className="primary-btn auth-submit" disabled={authLoading}>
              {authLoading
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </button>

            <p className="auth-switch">
              {isRegister ? "Already have an account?" : "New to Employa?"}{" "}
              <button
                type="button"
                className="text-btn"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
              >
                {isRegister ? "Sign in" : "Create an account"}
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">E</span> Employa
        </div>
        <p className="nav-label">WORKSPACE</p>
        <div className="nav-item active">▦ &nbsp; Dashboard</div>
        <div className="nav-item">♙ &nbsp; Employees</div>
        <div className="sidebar-bottom">
          Employee Management<br />
          <small>Admin workspace</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span>Workspace / Dashboard</span>
          <div className="admin-chip">
            <span className="avatar">
              {email ? email.charAt(0).toUpperCase() : "A"}
            </span>
            <span>{email || "Signed in"}</span>
            <button className="logout-btn" onClick={logout}>Log out</button>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Employee Dashboard</h1>
            <p className="muted">Manage your team and employee records in one place.</p>
          </div>
          <button className="primary-btn" onClick={() => openForm()}>
            ＋ Add employee
          </button>
        </section>

        {error && <div className="error-banner">{error}</div>}

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-symbol purple">♙</span>
            <p>Total employees</p>
            <h2>{employees.length}</h2>
            <small>Records in your database</small>
          </div>
          <div className="stat-card">
            <span className="stat-symbol blue">▤</span>
            <p>Positions</p>
            <h2>{new Set(employees.map((e) => e.position).filter(Boolean)).size}</h2>
            <small>Unique job titles</small>
          </div>
          <div className="stat-card">
            <span className="stat-symbol green">⌖</span>
            <p>Office locations</p>
            <h2>{new Set(employees.map((e) => e.location).filter(Boolean)).size}</h2>
            <small>Locations represented</small>
          </div>
        </section>

        <section className="table-card">
          <div className="table-heading">
            <div>
              <h2>All employees</h2>
              <p className="muted">View and manage employee information</p>
            </div>
            <input
              className="search-input"
              placeholder="⌕  Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>POSITION</th>
                  <th>OFFICE LOCATION</th>
                  <th>SALARY</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div className="employee-cell">
                        <span className="employee-avatar">
                          {emp.name?.charAt(0)?.toUpperCase()}
                        </span>
                        <strong>{emp.name}</strong>
                      </div>
                    </td>
                    <td><span className="position-tag">{emp.position}</span></td>
                    <td>{emp.location}</td>
                    <td>
                      {Number(emp.salary || 0).toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0
                      })}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="edit-btn" onClick={() => openForm(emp)}>Edit</button>
                        <button className="delete-btn" onClick={() => deleteEmployee(emp._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            Showing {filtered.length} of {employees.length} employees
          </div>
        </section>

        {showForm && (
          <div className="modal-backdrop" onClick={() => setShowForm(false)}>
            <form
              className="employee-modal"
              onSubmit={saveEmployee}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
              <p className="eyebrow">EMPLOYEE DETAILS</p>
              <h2>{editing ? "Edit employee" : "Add new employee"}</h2>
              <p className="muted">Fill in the information below.</p>
              {["name", "position", "location", "salary"].map((field) => (
                <label key={field}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                  <input
                    required
                    type={field === "salary" ? "number" : "text"}
                    min={field === "salary" ? "0" : undefined}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    placeholder={`Enter ${field}`}
                  />
                </label>
              ))}
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button className="primary-btn">
                  {editing ? "Save changes" : "Add employee"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

