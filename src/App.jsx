// src/App.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import './App.css'; 

export default function App() {
  const [invitados, setInvitados] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de la interfaz
  const [filtro, setFiltro] = useState('todos'); 
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState(''); 

  useEffect(() => {
    const q = query(collection(db, "invitados"), orderBy("fechaConfirmacion", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvitados(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleLlegada = async (idInvitado, nombrePersona, estadoActual) => {
    try {
      const invRef = doc(db, "invitados", idInvitado);
      await updateDoc(invRef, {
        [`checkInStatus.${nombrePersona}`]: !estadoActual
      });
    } catch (error) {
      console.error("Error al marcar llegada:", error);
      alert("Hubo un error al actualizar la lista.");
    }
  };

  const confirmados = invitados.filter(i => i.asistencia === 'si');
  const ausentes = invitados.filter(i => i.asistencia === 'no');
  const totalAdultos = confirmados.reduce((sum, inv) => sum + Number(inv.adultos || 0), 0);
  const totalNinos = confirmados.reduce((sum, inv) => sum + Number(inv.ninos || 0), 0);
  const totalPersonas = totalAdultos + totalNinos;

  const invitadosFiltrados = invitados.filter(inv => {
    if (filtro === 'confirmados') return inv.asistencia === 'si';
    if (filtro === 'ausentes') return inv.asistencia === 'no';
    return true; 
  });

  const listaRecepcion = confirmados.filter(inv => {
    const term = searchTerm.toLowerCase();
    if (!inv.nombres) return false;
    return inv.nombres.some(nombre => nombre.toLowerCase().includes(term));
  });

  // --- NUEVA FUNCIÓN: EXPORTAR A EXCEL (CSV) ---
  const exportarAExcel = () => {
    // El BOM (\uFEFF) fuerza a Excel a leer correctamente las tildes y la Ñ
    let csvContent = "\uFEFF"; 
    // Cabeceras de las columnas
    csvContent += "Titular,Acompanantes,Estado,Adultos,Ninos,Menu Especial,Comentarios\n";

    // CAMBIO: Ahora iteramos exclusivamente sobre el arreglo 'confirmados'
    confirmados.forEach(inv => {
      const nombrePrincipal = inv.nombres && inv.nombres.length > 0 ? inv.nombres[0] : "Sin nombre";
      const acompanantes = inv.nombres && inv.nombres.length > 1 ? inv.nombres.slice(1).join(' - ') : "";
      
      // Como solo exportamos confirmados, podemos simplificar estos datos
      const estado = 'Confirmado'; 
      const adultos = inv.adultos || '0';
      const ninos = inv.ninos || '0';
      const dieta = inv.dieta || 'Ninguna';
      
      // Limpiamos los comentarios para que los saltos de línea no rompan el Excel
      const comentarios = (inv.comentarios || '').replace(/"/g, '""').replace(/\n/g, ' ');

      // Envolvemos todo en comillas dobles para separar bien las celdas
      const fila = `"${nombrePrincipal}","${acompanantes}","${estado}","${adultos}","${ninos}","${dieta}","${comentarios}"`;
      csvContent += fila + "\n";
    });

    // Crear el archivo virtual y forzar la descarga
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Lista_Confirmados_Melanie.csv`); // Nombre del archivo actualizado
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="header-content">
          <i className="fas fa-crown crown-icon"></i>
          <h1 className="header-title">Panel de Control | <span>Mis 15 Melanie</span></h1>
          
          <button 
            className="nav-btn" 
            onClick={() => setVistaActual(vistaActual === 'dashboard' ? 'recepcion' : 'dashboard')}
            title={vistaActual === 'dashboard' ? "Ir a Lista de Recepción" : "Volver al Dashboard"}
          >
            <i className={vistaActual === 'dashboard' ? "fas fa-list-check" : "fas fa-chart-pie"}></i>
          </button>
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
            {vistaActual === 'dashboard' && (
              <div className="view-animate">
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

                <div className="table-controls">
                  <h3 className="table-title">Respuestas Generales</h3>
                  <div className="filter-group">
                    <button className={`filter-btn ${filtro === 'todos' ? 'active' : ''}`} onClick={() => setFiltro('todos')}>Todos</button>
                    <button className={`filter-btn ${filtro === 'confirmados' ? 'active' : ''}`} onClick={() => setFiltro('confirmados')}>Confirmados</button>
                    <button className={`filter-btn ${filtro === 'ausentes' ? 'active' : ''}`} onClick={() => setFiltro('ausentes')}>Ausentes</button>
                    
                    {/* --- NUEVO BOTÓN DE EXPORTAR --- */}
                    <button className="filter-btn export-btn" onClick={exportarAExcel}>
                      <i className="fas fa-file-excel"></i> Descargar Excel
                    </button>
                  </div>
                </div>

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
                      {invitadosFiltrados.map(inv => {
                        const nombrePrincipal = inv.nombres && inv.nombres.length > 0 ? inv.nombres[0] : "Sin nombre";
                        const acompañantes = inv.nombres && inv.nombres.length > 1 ? inv.nombres.slice(1).join(', ') : "";

                        return (
                          <tr key={inv.id} className={inv.asistencia === 'no' ? 'row-absent' : 'row-confirmed'}>
                            <td data-label="Nombre Principal">{nombrePrincipal}</td>
                            <td data-label="Acompañantes" className="comment-text">
                              {inv.asistencia === 'si' && acompañantes ? acompañantes : <span className="empty-text">-</span>}
                            </td>
                            <td data-label="Estado">
                              {inv.asistencia === 'si' ? <span className="badge badge-success">Confirmado</span> : <span className="badge badge-error">Ausente</span>}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {vistaActual === 'recepcion' && (
              <div className="view-animate">
                <div className="recepcion-header">
                  <h2><i className="fas fa-clipboard-list"></i> Lista de Entrada</h2>
                  
                  <div className="search-bar">
                    <i className="fas fa-search search-icon"></i>
                    <input 
                      type="text" 
                      placeholder="Buscar por invitado o acompañante..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button className="clear-search" onClick={() => setSearchTerm('')}><i className="fas fa-times"></i></button>
                    )}
                  </div>
                </div>

                <div className="recepcion-list">
                  {listaRecepcion.map(inv => {
                    const statusCheck = inv.checkInStatus || {};
                    const tituloFamilia = inv.nombres && inv.nombres.length > 0 ? inv.nombres[0] : "Invitado";

                    return (
                      <div className="familia-card" key={inv.id}>
                        <h3 className="familia-title">Familia / Grupo de {tituloFamilia}</h3>
                        
                        <div className="personas-list">
                          {inv.nombres && inv.nombres.map((persona, idx) => {
                            const personaLlego = statusCheck[persona] || false;
                            
                            return (
                              <div 
                                key={idx}
                                className={`persona-item ${personaLlego ? 'checked' : ''}`}
                                onClick={() => toggleLlegada(inv.id, persona, personaLlego)}
                              >
                                <span className="persona-nombre">
                                  <i className={idx === 0 ? "fas fa-user-tie" : "fas fa-user"}></i> {persona} {idx === 0 && <small>(Titular)</small>}
                                </span>
                                <button className="check-btn">
                                  <i className="fas fa-check"></i>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {listaRecepcion.length === 0 && (
                    <div className="empty-state">No se encontraron invitados con ese nombre.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}