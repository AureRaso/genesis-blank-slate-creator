import { PosicionJugador, Movimiento } from "@/types/ejercicios";

interface PistaMiniaturaProps {
  posiciones: PosicionJugador[];
  movimientos: Movimiento[];
  className?: string;
}

const PistaMiniatura = ({ posiciones, movimientos, className = "" }: PistaMiniaturaProps) => {
  // Si no hay posiciones ni movimientos, mostrar pista vacía
  const isEmpty = posiciones.length === 0 && movimientos.length === 0;

  return (
    <svg
      viewBox="0 0 200 100"
      className={`bg-[#1e3a5f] rounded ${className}`}
      style={{ minWidth: '66px', maxWidth: '88px', height: 'auto', aspectRatio: '2/1' }}
    >
      {/* Fondo de pista */}
      <rect x="0" y="0" width="200" height="100" fill="#1e3a5f" />

      {/* Líneas de la pista (rotadas 90°) */}
      {/* Líneas exteriores */}
      <rect x="5" y="2.5" width="190" height="95" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />

      {/* Línea central (vertical en pista normal = horizontal aquí) */}
      <line x1="100" y1="2.5" x2="100" y2="97.5" stroke="white" strokeWidth="0.5" opacity="0.7" />

      {/* Líneas de servicio (cerca de la pared de fondo) */}
      <line x1="35" y1="2.5" x2="35" y2="97.5" stroke="white" strokeWidth="0.5" opacity="0.7" />
      <line x1="165" y1="2.5" x2="165" y2="97.5" stroke="white" strokeWidth="0.5" opacity="0.7" />

      {/* Líneas centrales de servicio (desde línea de servicio hasta la red) */}
      <line x1="35" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.5" opacity="0.7" />
      <line x1="100" y1="50" x2="165" y2="50" stroke="white" strokeWidth="0.5" opacity="0.7" />

      {/* Red */}
      <line x1="100" y1="0" x2="100" y2="100" stroke="white" strokeWidth="1" strokeDasharray="2,1" opacity="0.7" />

      {/* Cristales (paredes) */}
      <rect x="0" y="0" width="200" height="2.5" fill="rgba(200,200,200,0.2)" />
      <rect x="0" y="97.5" width="200" height="2.5" fill="rgba(200,200,200,0.2)" />
      <rect x="0" y="0" width="5" height="100" fill="rgba(200,200,200,0.2)" />
      <rect x="195" y="0" width="5" height="100" fill="rgba(200,200,200,0.2)" />

      {/* Movimientos (flechas) - Coordenadas rotadas */}
      <defs>
        <marker id="arrowhead-mini" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#F59E0B" />
        </marker>
      </defs>

      {movimientos.map((mov, i) => (
        <line
          key={i}
          x1={mov.from.y * 2}
          y1={mov.from.x}
          x2={mov.to.y * 2}
          y2={mov.to.x}
          stroke={mov.color || '#F59E0B'}
          strokeWidth="1.5"
          markerEnd="url(#arrowhead-mini)"
          strokeDasharray={mov.type === 'globo' ? '3,2' : undefined}
        />
      ))}

      {/* Jugadores - Coordenadas rotadas */}
      {posiciones.map((pos, i) => (
        <g key={i} transform={`translate(${pos.y * 2}, ${pos.x})`}>
          <circle r="6" fill={pos.color} />
          <text
            textAnchor="middle"
            dy="2"
            fill="white"
            fontSize="6"
            fontWeight="bold"
          >
            {pos.label}
          </text>
        </g>
      ))}

      {/* Indicador de pista vacía */}
      {isEmpty && (
        <text
          x="100"
          y="50"
          textAnchor="middle"
          dy="3"
          fill="rgba(255,255,255,0.3)"
          fontSize="10"
        >
          -
        </text>
      )}
    </svg>
  );
};

export default PistaMiniatura;
