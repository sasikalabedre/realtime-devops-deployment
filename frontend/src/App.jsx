import { useEffect, useState } from "react";

function App() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");

  async function loadEmployees() {
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to load employees");
      setEmployees(await response.json());
    } catch (error) {
      console.error(error);
      setStatus("Backend/database connection failed");
    }
  }

  const getStatusBadge = (employee) => {
    if (employee.id % 2 === 0) {
      return { label: "Active", className: "badge active" };
    }
    return { label: "On Leave", className: "badge leave" };
  };

  const filteredEmployees = employees.filter((employee) => {
    const query = search.toLowerCase();
    return (
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      String(employee.id).includes(query)
    );
  });

  function resetForm() {
    setName("");
    setEmail("");
    setEditingId(null);
  }

  async function submitEmployee(event) {
    event.preventDefault();
    setStatus("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setStatus("Name and email are required");
      return;
    }

    if (trimmedName.length < 2) {
      setStatus("Name must be at least 2 characters long");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setStatus("Please enter a valid email address");
      return;
    }

    try {
      const url = editingId ? `/api/employees/${editingId}` : "/api/employees";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      resetForm();
      setStatus(editingId ? "Employee updated successfully" : "Employee added successfully");
      await loadEmployees();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function deleteEmployee(id) {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete employee");
      }

      setStatus("Employee deleted successfully");
      if (editingId === id) resetForm();
      await loadEmployees();
    } catch (error) {
      setStatus(error.message);
    }
  }

  function editEmployee(employee) {
    setName(employee.name);
    setEmail(employee.email);
    setEditingId(employee.id);
    setStatus("");
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="topbar">
          <div>
            <p className="eyebrow">HR Dashboard</p>
            <h1>Employee Management</h1>
          </div>
          <div className="topbar-badge">{employees.length} Total</div>
        </header>

        <section className="content-grid">
          <div className="panel form-panel">
            <h2>{editingId ? "Edit Employee" : "Add Employee"}</h2>

            <form onSubmit={submitEmployee} className="employee-form">
              <label>
                Employee name
                <input
                  required
                  placeholder="Enter employee name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label>
                Employee email
                <input
                  required
                  type="email"
                  placeholder="Enter employee email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  {editingId ? "Update Employee" : "Add Employee"}
                </button>
                {editingId && (
                  <button type="button" className="secondary-btn" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel summary-panel">
            <h3>Overview</h3>
            <div className="stat-box">
              <span>Active</span>
              <strong>{employees.filter((emp) => emp.id % 2 === 0).length}</strong>
            </div>
            <div className="stat-box muted">
              <span>On Leave</span>
              <strong>{employees.filter((emp) => emp.id % 2 !== 0).length}</strong>
            </div>
          </div>
        </section>

        {status && <div className="status-box">{status}</div>}

        <section className="panel table-panel">
          <div className="table-head">
            <h2>Employees</h2>
            <div className="search-wrap">
              <span>Search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or ID"
              />
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="empty-state">
              <p>No employees found.</p>
              <small>Try another search or add a new employee.</small>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const badge = getStatusBadge(employee);
                    return (
                      <tr key={employee.id}>
                        <td>#{employee.id}</td>
                        <td>{employee.name}</td>
                        <td>{employee.email}</td>
                        <td>
                          <span className={badge.className}>{badge.label}</span>
                        </td>
                        <td className="action-col">
                          <button type="button" className="table-btn edit-btn" onClick={() => editEmployee(employee)}>
                            Edit
                          </button>
                          <button type="button" className="table-btn delete-btn" onClick={() => deleteEmployee(employee.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
