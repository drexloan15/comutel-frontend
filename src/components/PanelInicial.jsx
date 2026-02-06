function PanelInicial({ metricas }) {
  // Función auxiliar para dibujar las cajitas de resumen
  const InfoCard = ({ titulo, total, sub1, sub1Label, sub2, sub2Label }) => (
    <div style={{ backgroundColor: 'white', border: '1px solid #ddd', padding: '15px', borderRadius: '4px', flex: 1, minWidth: '250px' }}>
      <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <strong style={{ color: '#3498db' }}>📝 {titulo}</strong>
        <span style={{ color: '#3498db', fontWeight: 'bold' }}>{total}</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px' }}>{sub1Label}</span>
        <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{sub1}</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px' }}>{sub2Label}</span>
        <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{sub2}</span>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <InfoCard 
        titulo="Según fecha OLA/UC" 
        total={metricas.total} 
        sub1Label="Caducadas" sub1={metricas.resueltos} // Simulamos datos
        sub2Label="En plazo > 24h" sub2={metricas.nuevos} 
      />
      <InfoCard 
        titulo="Según fecha solución" 
        total={metricas.proceso} 
        sub1Label="Caducadas" sub1="0" 
        sub2Label="En plazo > 24h" sub2={metricas.proceso} 
      />
      <InfoCard 
        titulo="Actividades pendientes" 
        total="5" 
        sub1Label="Críticas" sub1="2" 
        sub2Label="Normales" sub2="3" 
      />
    </div>
  )
}

export default PanelInicial