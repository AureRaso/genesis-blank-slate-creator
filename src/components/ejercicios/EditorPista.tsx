import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Users, Circle, ArrowRight, RotateCcw } from "lucide-react";
import { PosicionJugador, Movimiento, COLORES_JUGADORES } from "@/types/ejercicios";
import { useTranslation } from "react-i18next";

interface EditorPistaProps {
  posiciones: PosicionJugador[];
  movimientos: Movimiento[];
  onPosicionesChange: (posiciones: PosicionJugador[]) => void;
  onMovimientosChange: (movimientos: Movimiento[]) => void;
  readonly?: boolean;
}

type EditorMode = 'select' | 'player' | 'ball';

const EditorPista = ({
  posiciones,
  movimientos,
  onPosicionesChange,
  onMovimientosChange,
  readonly = false
}: EditorPistaProps) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<EditorMode>('select');
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<number | null>(null);
  const [drawingLine, setDrawingLine] = useState<{ from: { x: number; y: number } } | null>(null);
  const [tempLineEnd, setTempLineEnd] = useState<{ x: number; y: number } | null>(null);

  // Convertir coordenadas del mouse a porcentajes
  const getMousePosition = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  // Añadir jugador
  const handleAddPlayer = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (readonly || mode !== 'player' || posiciones.length >= 4) return;

    const pos = getMousePosition(e);
    const labels = ['A', 'B', 'C', 'D'];
    const newPlayer: PosicionJugador = {
      x: pos.x,
      y: pos.y,
      label: labels[posiciones.length],
      color: COLORES_JUGADORES[posiciones.length]
    };

    onPosicionesChange([...posiciones, newPlayer]);
  }, [readonly, mode, posiciones, getMousePosition, onPosicionesChange]);

  // Manejar click en SVG
  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (readonly) return;

    // Si estamos en modo jugador, añadir
    if (mode === 'player') {
      handleAddPlayer(e);
      return;
    }

    // Si estamos en modo bola y dibujando
    if (mode === 'ball') {
      const pos = getMousePosition(e);

      if (!drawingLine) {
        // Iniciar línea
        setDrawingLine({ from: pos });
        setTempLineEnd(pos);
      } else {
        // Terminar línea
        const newMovimiento: Movimiento = {
          from: drawingLine.from,
          to: pos,
          type: 'bola',
          color: '#F59E0B'
        };
        onMovimientosChange([...movimientos, newMovimiento]);
        setDrawingLine(null);
        setTempLineEnd(null);
      }
    }
  }, [readonly, mode, drawingLine, getMousePosition, handleAddPlayer, movimientos, onMovimientosChange]);

  // Mover mouse mientras dibuja
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedPlayer !== null) {
      const pos = getMousePosition(e);
      const newPosiciones = [...posiciones];
      newPosiciones[draggedPlayer] = { ...newPosiciones[draggedPlayer], x: pos.x, y: pos.y };
      onPosicionesChange(newPosiciones);
    }

    if (drawingLine) {
      const pos = getMousePosition(e);
      setTempLineEnd(pos);
    }
  }, [draggedPlayer, drawingLine, getMousePosition, posiciones, onPosicionesChange]);

  // Iniciar drag de jugador
  const handlePlayerMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    if (readonly) return;
    e.stopPropagation();
    if (mode === 'select') {
      setDraggedPlayer(index);
      setSelectedPlayer(index);
    }
  }, [readonly, mode]);

  // Terminar drag
  const handleMouseUp = useCallback(() => {
    setDraggedPlayer(null);
  }, []);

  // Eliminar jugador seleccionado
  const handleDeletePlayer = useCallback(() => {
    if (selectedPlayer === null) return;
    const newPosiciones = posiciones.filter((_, i) => i !== selectedPlayer);
    // Reasignar labels
    const labels = ['A', 'B', 'C', 'D'];
    const updated = newPosiciones.map((p, i) => ({
      ...p,
      label: labels[i],
      color: COLORES_JUGADORES[i]
    }));
    onPosicionesChange(updated);
    setSelectedPlayer(null);
  }, [selectedPlayer, posiciones, onPosicionesChange]);

  // Limpiar todo
  const handleClear = useCallback(() => {
    onPosicionesChange([]);
    onMovimientosChange([]);
    setSelectedPlayer(null);
    setDrawingLine(null);
    setTempLineEnd(null);
  }, [onPosicionesChange, onMovimientosChange]);

  // Eliminar último movimiento
  const handleUndoMovimiento = useCallback(() => {
    if (movimientos.length > 0) {
      onMovimientosChange(movimientos.slice(0, -1));
    }
  }, [movimientos, onMovimientosChange]);

  return (
    <div className="w-full space-y-3">
      {/* Header con título y modos */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {t('ejerciciosPage.editor.title', 'Editor de Pista')}
        </span>
        {!readonly && (
          <div className="flex gap-1">
            <Badge variant={mode === 'select' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setMode('select')}>
              <Circle className="w-3 h-3 mr-1" />
              {t('ejerciciosPage.editor.select', 'Seleccionar')}
            </Badge>
            <Badge variant={mode === 'player' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setMode('player')}>
              <Users className="w-3 h-3 mr-1" />
              {t('ejerciciosPage.editor.player', 'Jugador')}
            </Badge>
            <Badge variant={mode === 'ball' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setMode('ball')}>
              <ArrowRight className="w-3 h-3 mr-1" />
              {t('ejerciciosPage.editor.ball', 'Bola')}
            </Badge>
          </div>
        )}
      </div>
        {/* Pista de pádel SVG - Horizontal */}
        <svg
          ref={svgRef}
          viewBox="0 0 200 100"
          className="w-full mx-auto border-2 border-gray-300 rounded bg-blue-500 cursor-crosshair"
          style={{ aspectRatio: '2/1' }}
          onClick={handleSvgClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Fondo de pista */}
          <rect x="0" y="0" width="200" height="100" fill="#1e3a5f" />

          {/* Líneas de la pista - Horizontal */}
          {/* Líneas exteriores */}
          <rect x="5" y="2.5" width="190" height="95" fill="none" stroke="white" strokeWidth="0.5" />

          {/* Líneas de servicio (cerca de la pared de fondo) */}
          <line x1="35" y1="2.5" x2="35" y2="97.5" stroke="white" strokeWidth="0.5" />
          <line x1="165" y1="2.5" x2="165" y2="97.5" stroke="white" strokeWidth="0.5" />

          {/* Líneas centrales de servicio (desde línea de servicio hasta la red) */}
          <line x1="35" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.5" />
          <line x1="100" y1="50" x2="165" y2="50" stroke="white" strokeWidth="0.5" />

          {/* Red (centro) */}
          <line x1="100" y1="0" x2="100" y2="100" stroke="white" strokeWidth="1" strokeDasharray="2,1" />

          {/* Cristales (paredes) */}
          <rect x="0" y="0" width="200" height="2.5" fill="rgba(200,200,200,0.3)" />
          <rect x="0" y="97.5" width="200" height="2.5" fill="rgba(200,200,200,0.3)" />
          <rect x="0" y="0" width="5" height="100" fill="rgba(200,200,200,0.3)" />
          <rect x="195" y="0" width="5" height="100" fill="rgba(200,200,200,0.3)" />

          {/* Movimientos (flechas) */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B" />
            </marker>
          </defs>

          {movimientos.map((mov, i) => (
            <line
              key={i}
              x1={mov.from.x * 2}
              y1={mov.from.y}
              x2={mov.to.x * 2}
              y2={mov.to.y}
              stroke={mov.color || '#F59E0B'}
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
              strokeDasharray={mov.type === 'globo' ? '3,2' : undefined}
            />
          ))}

          {/* Línea temporal mientras dibuja */}
          {drawingLine && tempLineEnd && (
            <line
              x1={drawingLine.from.x * 2}
              y1={drawingLine.from.y}
              x2={tempLineEnd.x * 2}
              y2={tempLineEnd.y}
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeDasharray="3,2"
              opacity="0.7"
            />
          )}

          {/* Jugadores */}
          {posiciones.map((pos, i) => (
            <g
              key={i}
              transform={`translate(${pos.x * 2}, ${pos.y})`}
              className={`cursor-move ${selectedPlayer === i ? 'opacity-100' : 'opacity-90'}`}
              onMouseDown={(e) => handlePlayerMouseDown(i, e)}
            >
              <circle
                r="5"
                fill={pos.color}
                stroke={selectedPlayer === i ? 'white' : 'none'}
                strokeWidth="1.5"
              />
              <text
                textAnchor="middle"
                dy="1.5"
                fill="white"
                fontSize="5"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {pos.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Controles */}
        {!readonly && (
          <div className="flex justify-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeletePlayer}
              disabled={selectedPlayer === null}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {t('ejerciciosPage.editor.deletePlayer', 'Eliminar')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndoMovimiento}
              disabled={movimientos.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              {t('ejerciciosPage.editor.undo', 'Deshacer')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              {t('ejerciciosPage.editor.clear', 'Limpiar')}
            </Button>
          </div>
        )}

      {/* Leyenda */}
      <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
        <span>{t('ejerciciosPage.editor.playersCount', 'Jugadores')}: {posiciones.length}/4</span>
        <span>|</span>
        <span>{t('ejerciciosPage.editor.movementsCount', 'Movimientos')}: {movimientos.length}</span>
      </div>
    </div>
  );
};

export default EditorPista;
