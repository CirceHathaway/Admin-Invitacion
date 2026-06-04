// src/App.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';
import './App.css'; 

export default function App() {
  const [invitados, setInvitados] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NUEVO: Estado para manejar el filtro actual
  const [filtro, setFiltro] = useState('todos'); 

  useEffect(() => {
    const q = query(collection(db, "invitados"), orderBy("fechaConfirmacion", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvitados(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Cálculos de estadísticas (siempre calculan sobre el total)
  const confirmados = invitados.filter(i => i.asistencia === 'si');
  const ausentes = invitados.filter(i => i.asistencia === 'no');
  const totalAdultos = confirmados.reduce((sum, inv) => sum + Number(inv.adultos || 0), 0);
  const totalNinos = confirmados.reduce((sum, inv) => sum + Number(inv.ninos || 0), 0);
  const totalPersonas = totalAdultos + totalNinos;

  // NUEVO: Lógica para filtrar qué filas se muestran en la tabla
  const invitadosFiltrados = invitados.filter(inv => {
    if (filtro === 'confirmados') return inv.asistencia === 'si';
    if (filtro === 'ausentes') return inv.asistencia === 'no';
    return true; // Si es 'todos', pasa directo
  });

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="header-content">
          <i className="fas fa-crown"></i>
          <h1>Panel de Control | <span>Mis 15 Melanie</span></h1>
        </div>
      </header>
      
      <main className="admin-main">
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Sincronizando base de datos...</p>
          </div>
        ) : (
          <>
            {/* Tarjetas de Resumen (Grid) */}
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon"><i className="fas fa-users"></i></div>
                <div className="stat-info">
                  <h3>Total Personas</h3>
                  <div className="stat-number">{totalPersonas}</div>
                </div>
              </div>
              
              <div className="stat-card confirmed">
                <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
                <div className="stat-info">
                  <h3>Confirmados</h3>
                  <div className="stat-number">{confirmados.length} flias</div>
                  <div className="stat-detail">{totalAdultos} Adultos | {totalNinos} Niños</div>
                </div>
              </div>
              
              <div className="stat-card absent">
                <div className="stat-icon"><i className="fas fa-times-circle"></i></div>
                <div className="stat-info">
                  <h3>Ausentes</h3>
                  <div className="stat-number">{ausentes.length}</div>
                </div>
              </div>
            </div>

            {/* NUEVO: Controles de Filtro */}
            <div className="table-controls">
              <h3 className="table-title">Lista de Invitados</h3>
              <div className="filter-group">
                <button 
                  className={`filter-btn ${filtro === 'todos' ? 'active' : ''}`} 
                  onClick={() => setFiltro('todos')}
                >
                  Todos
                </button>
                <button 
                  className={`filter-btn ${filtro === 'confirmados' ? 'active' : ''}`} 
                  onClick={() => setFiltro('confirmados')}
                >
                  Confirmados
                </button>
                <button 
                  className={`filter-btn ${filtro === 'ausentes' ? 'active' : ''}`} 
                  onClick={() => setFiltro('ausentes')}
                >
                  Ausentes
                </button>
              </div>
            </div>

            {/* Tabla Responsive */}
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre Principal</th>
                    <th>Acompañantes</th>
                    <th>Estado</th>
                    <th>Adultos</th>
                    <th>Niños</th>
                    <th>Menú Especial</th>
                    <th>Comentarios</th>
                  </tr>
                </thead>
                <tbody>
                  {invitadosFiltrados.map(inv => (
                    <tr key={inv.id} className={inv.asistencia === 'no' ? 'row-absent' : 'row-confirmed'}>
                      <td data-label="Nombre">{inv.nombre}</td>
                      
                      {/* NUEVA COLUMNA: Acompañantes */}
                      <td data-label="Acompañantes" className="comment-text">
                        {inv.asistencia === 'si' && inv.nombresAcompanantes 
                          ? inv.nombresAcompanantes 
                          : <span className="empty-text">-</span>}
                      </td>

                      <td data-label="Estado">
                        {inv.asistencia === 'si' 
                          ? <span className="badge badge-success">Confirmado</span> 
                          : <span className="badge badge-error">Ausente</span>}
                      </td>
                      <td data-label="Adultos">{inv.asistencia === 'si' ? inv.adultos : '-'}</td>
                      <td data-label="Niños">{inv.asistencia === 'si' ? inv.ninos : '-'}</td>
                      <td data-label="Menú Especial" className={inv.dieta !== 'ninguna' ? 'highlight' : ''}>
                        {inv.asistencia === 'si' ? (inv.dieta === 'ninguna' ? 'Ninguno' : inv.dieta.toUpperCase()) : '-'}
                      </td>
                      <td data-label="Comentarios" className="comment-text">
                        {inv.comentarios || <span className="empty-text">Sin comentarios</span>}
                      </td>
                    </tr>
                  ))}
                  
                  {invitadosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan="7" className="empty-state">No hay registros para este filtro.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}