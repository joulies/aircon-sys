import { useEffect, useState } from "react";

function Services() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "" });

  // Fetch services
  useEffect(() => {
    fetch("http://localhost:5000/services")
      .then(res => res.json())
      .then(data => setServices(data));
  }, []);

  // Add service
  const addService = () => {
    fetch("http://localhost:5000/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(res => res.json())
      .then(data => setServices([...services, data]));
    setForm({ name: "", description: "", price: "" });
  };

  // Delete service
  const deleteService = (id) => {
    fetch(`http://localhost:5000/services/${id}`, { method: "DELETE" })
      .then(() => setServices(services.filter(s => s.id !== id)));
  };

  return (
    <div>
      <h2>Electrical Services</h2>

      <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      <input placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
      <button onClick={addService}>Add Service</button>

      <ul>
        {services.map(s => (
          <li key={s.id}>
            {s.name} - {s.description} - ${s.price}
            <button onClick={() => deleteService(s.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Services;