import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Player } from '../lib/api'

interface SelectedPlayerWithRole {
  player: Player
  role: string
}

const DragWheelSpinner: React.FC<{
  players: Player[]
  spinCount: number
  onSpinComplete: (selectedPlayers: Player[]) => void
  onRoleAssignmentComplete: (playersWithRoles: SelectedPlayerWithRole[]) => void
}> = ({
  players,
  spinCount,
  onSpinComplete,
  onRoleAssignmentComplete
}) => {
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lastAngle, setLastAngle] = useState(0)
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])
  const [playersWithRoles, setPlayersWithRoles] = useState<SelectedPlayerWithRole[]>([])
  const [phase, setPhase] = useState<'player-selection' | 'role-assignment' | 'complete'>('player-selection')
  const [currentRoleAssignment, setCurrentRoleAssignment] = useState(0)
  const [usedRoles, setUsedRoles] = useState<string[]>([])
  const [lastSelectedPlayer, setLastSelectedPlayer] = useState<Player | null>(null)
  const [velocity, setVelocity] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)

  const wheelRef = useRef<HTMLDivElement>(null)
  const lastTimeRef = useRef<number>(0)
  const lastRotationRef = useRef<number>(0)

  const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']
  
  // Filter out already selected players for player selection phase
  const availablePlayers = phase === 'player-selection' 
    ? players.filter(player => !selectedPlayers.includes(player))
    : players
    
  const wheelItems = phase === 'player-selection' 
    ? availablePlayers 
    : roles.filter(role => !usedRoles.includes(role))
  const segmentAngle = wheelItems.length > 0 ? 360 / wheelItems.length : 360

  // Get center point of wheel
  const getWheelCenter = () => {
    if (!wheelRef.current) return { x: 0, y: 0 }
    const rect = wheelRef.current.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
  }

  // Calculate angle from center to mouse position
  const getAngleFromCenter = (clientX: number, clientY: number) => {
    const center = getWheelCenter()
    const dx = clientX - center.x
    const dy = clientY - center.y
    return Math.atan2(dy, dx) * (180 / Math.PI)
  }

  // Get currently selected item based on rotation
  const getSelectedItem = () => {
    if (wheelItems.length === 0) return null
    
    // Normalize rotation to 0-360
    const normalizedRotation = ((rotation % 360) + 360) % 360
    
    // The pointer is at the top (0 degrees), segments start from top and go clockwise
    // Calculate which segment is at the top
    const segmentIndex = Math.floor(normalizedRotation / segmentAngle) % wheelItems.length
    
    // Since we rotate clockwise, we need to reverse the index
    const selectedIndex = (wheelItems.length - segmentIndex) % wheelItems.length
    
    return wheelItems[selectedIndex] || null
  }

  // Handle mouse/touch start
  const handleDragStart = (clientX: number, clientY: number) => {
    if (isSpinning) return
    
    setIsDragging(true)
    const angle = getAngleFromCenter(clientX, clientY)
    setLastAngle(angle)
    lastTimeRef.current = Date.now()
    lastRotationRef.current = rotation
    setVelocity(0)
  }

  // Handle mouse/touch move
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || isSpinning) return

    const currentAngle = getAngleFromCenter(clientX, clientY)
    let deltaAngle = currentAngle - lastAngle

    // Handle angle wrap-around
    if (deltaAngle > 180) deltaAngle -= 360
    if (deltaAngle < -180) deltaAngle += 360

    const newRotation = rotation + deltaAngle
    setRotation(newRotation)
    setLastAngle(currentAngle)

    // Calculate velocity for momentum
    const currentTime = Date.now()
    const deltaTime = currentTime - lastTimeRef.current
    if (deltaTime > 0) {
      const rotationDelta = newRotation - lastRotationRef.current
      setVelocity(rotationDelta / deltaTime * 16) // Convert to per-frame velocity
    }
    lastTimeRef.current = currentTime
    lastRotationRef.current = newRotation
  }

  // Handle mouse/touch end
  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    // Add momentum spinning
    if (Math.abs(velocity) > 0.5) {
      setIsSpinning(true)
      let currentVelocity = velocity
      let currentRotation = rotation

      const momentumSpin = () => {
        currentVelocity *= 0.98 // Friction
        currentRotation += currentVelocity
        setRotation(currentRotation)

        if (Math.abs(currentVelocity) > 0.1) {
          requestAnimationFrame(momentumSpin)
        } else {
          setIsSpinning(false)
          handleSelection()
        }
      }
      requestAnimationFrame(momentumSpin)
    } else {
      // No momentum, select immediately
      handleSelection()
    }
  }

  // Handle selection after wheel stops
  const handleSelection = () => {
    if (wheelItems.length === 0) return // Safety check
    
    const selectedItem = getSelectedItem()
    
    if (phase === 'player-selection') {
      const selectedPlayer = selectedItem as Player
      if (selectedPlayer && !selectedPlayers.includes(selectedPlayer)) {
        const newSelectedPlayers = [...selectedPlayers, selectedPlayer]
        setSelectedPlayers(newSelectedPlayers)
        setLastSelectedPlayer(selectedPlayer)

        if (newSelectedPlayers.length >= spinCount) {
          // Reset wheel rotation for role assignment phase
          setTimeout(() => {
            setRotation(0)
            setPhase('role-assignment')
            setCurrentRoleAssignment(0)
            onSpinComplete(newSelectedPlayers)
          }, 100)
        }
      }
    } else if (phase === 'role-assignment') {
      const selectedRole = selectedItem as string
      if (selectedRole && currentRoleAssignment < selectedPlayers.length) {
        const playerToAssign = selectedPlayers[currentRoleAssignment]
        const newPlayerWithRole: SelectedPlayerWithRole = {
          player: playerToAssign,
          role: selectedRole
        }
        const newPlayersWithRoles = [...playersWithRoles, newPlayerWithRole]
        setPlayersWithRoles(newPlayersWithRoles)
        setUsedRoles([...usedRoles, selectedRole])
        setCurrentRoleAssignment(currentRoleAssignment + 1)

        if (currentRoleAssignment + 1 >= selectedPlayers.length) {
          setPhase('complete')
          onRoleAssignmentComplete(newPlayersWithRoles)
        } else {
          // Reset wheel rotation for next role assignment
          setTimeout(() => {
            setRotation(0)
          }, 100)
        }
      }
    }
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientX, e.clientY)
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handleDragEnd()
  }

  // Global mouse events for smooth dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientX, e.clientY)
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd()
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging])

  // Colors for segments
  const getSegmentColor = (index: number) => {
    const colors = [
      'from-red-500 to-red-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-yellow-500 to-yellow-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-orange-500 to-orange-600',
      'from-teal-500 to-teal-600',
      'from-gray-500 to-gray-600'
    ]
    return colors[index % colors.length]
  }

  // Calculate segment coordinates for clipPath
  const getSegmentPath = (index: number) => {
    const startAngle = (index * segmentAngle) * (Math.PI / 180)
    const endAngle = ((index + 1) * segmentAngle) * (Math.PI / 180)
    
    const x1 = 50 + 40 * Math.cos(startAngle)
    const y1 = 50 + 40 * Math.sin(startAngle)
    const x2 = 50 + 40 * Math.cos(endAngle)
    const y2 = 50 + 40 * Math.sin(endAngle)
    
    return `polygon(50% 50%, ${x1}% ${y1}%, ${x2}% ${y2}%)`
  }

  if (phase === 'complete') {
    return (
      <div className="flex flex-col items-center space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">🏆 Teams Formed!</h2>
          <div className="text-lg text-slate-300">Here are your teams with assigned roles</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Team 1 */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-blue-400 mb-4 text-center">Team 1</h3>
            <div className="space-y-3">
              {playersWithRoles.slice(0, Math.ceil(playersWithRoles.length / 2)).map((playerWithRole) => (
                <div key={playerWithRole.player.id} className="flex items-center justify-between bg-blue-900/30 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                    <span className="text-white font-medium">{playerWithRole.player.name}</span>
                  </div>
                  <span className="text-blue-300 text-sm font-medium">{playerWithRole.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team 2 */}
          <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-red-400 mb-4 text-center">Team 2</h3>
            <div className="space-y-3">
              {playersWithRoles.slice(Math.ceil(playersWithRoles.length / 2)).map((playerWithRole) => (
                <div key={playerWithRole.player.id} className="flex items-center justify-between bg-red-900/30 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-red-400"></div>
                    <span className="text-white font-medium">{playerWithRole.player.name}</span>
                  </div>
                  <span className="text-red-300 text-sm font-medium">{playerWithRole.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
        >
          Start New Game
        </button>
      </div>
    )
  }

  // Show loading if no wheel items
  if (wheelItems.length === 0) {
    return (
      <div className="flex flex-col items-center space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">🎯 Preparing Wheel...</h2>
          <p className="text-slate-300">Setting up the next phase</p>
        </div>
        <div className="w-96 h-96 rounded-full border-4 border-slate-600 bg-slate-800/50 flex items-center justify-center">
          <div className="text-slate-400 text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Status */}
      <div className="text-center">
        <p className="text-slate-300">
          {phase === 'player-selection' 
            ? `${selectedPlayers.length} of ${spinCount} selected`
            : `Assigning role to ${selectedPlayers[currentRoleAssignment]?.name}`
          }
        </p>
      </div>

      {/* Progress */}
      {phase === 'player-selection' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 min-w-[300px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300">🎮 Selecting Players ({selectedPlayers.length} of {spinCount})</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(selectedPlayers.length / spinCount) * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-slate-400 mt-1">{selectedPlayers.length} of {spinCount} players selected</div>
        </div>
      )}

      {/* Last Selected Player */}
      {lastSelectedPlayer && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
          <div className="text-green-400 font-bold text-center">
            Last Selected Player
          </div>
          <div className="text-white text-xl font-bold text-center mt-1">
            {lastSelectedPlayer.name}
          </div>
        </div>
      )}

      {/* Wheel */}
      <div className="relative">
        {/* Arrow Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
          <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-b-[30px] border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg"></div>
        </div>

        {/* Wheel Container */}
        <motion.div
          ref={wheelRef}
          className={`relative w-96 h-96 rounded-full border-4 border-yellow-400 shadow-2xl ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${isSpinning ? 'pointer-events-none' : ''}`}
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Segments */}
          {wheelItems.map((item, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-gradient-to-br ${getSegmentColor(index)}`}
              style={{
                clipPath: getSegmentPath(index)
              }}
            >
              {/* Player/Role Name */}
              <div
                className="absolute top-1/2 left-1/2 text-white font-bold text-base pointer-events-none select-none drop-shadow-lg"
                style={{
                  transform: `translate(-50%, -50%) rotate(${(index * segmentAngle) + (segmentAngle / 2)}deg) translateY(-80px)`,
                  transformOrigin: 'center center',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }}
              >
                {typeof item === 'string' ? item : item.name}
              </div>
            </div>
          ))}

          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg">
            DRAG
          </div>
        </motion.div>

        {/* Status */}
        <div className="text-center mt-4 text-slate-400">
          {!isDragging && !isSpinning && getSelectedItem() && (
            <p className="text-xs mt-1">Currently pointing at: <span className="text-white font-bold">
              {typeof getSelectedItem() === 'string' ? getSelectedItem() as string : (getSelectedItem() as Player)?.name || 'Unknown'}
            </span></p>
          )}
        </div>
      </div>

      {/* Selected Players Display */}
      {selectedPlayers.length > 0 && (
        <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-4 max-w-md">
          <h3 className="text-white font-bold mb-2">Selected Players:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedPlayers.map((player, index) => (
              <span 
                key={player.id}
                className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/30"
              >
                {index + 1}. {player.name}
              </span>
            ))}
          </div>
          {phase === 'player-selection' && availablePlayers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-600">
              <h4 className="text-slate-400 text-sm mb-2">Remaining Players:</h4>
              <div className="flex flex-wrap gap-2">
                {availablePlayers.map((player) => (
                  <span 
                    key={player.id}
                    className="bg-slate-700/30 text-slate-400 px-2 py-1 rounded text-xs border border-slate-600/30"
                  >
                    {player.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DragWheelSpinner