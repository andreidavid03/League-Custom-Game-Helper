'use client'

import { useState, useRef, useEffect } from 'react'
import { Player } from '@/lib/api'

interface WheelSpinnerProps {
  players: Player[]
  spinCount: number
  disabled?: boolean
  onSpinComplete: (selectedPlayers: Player[]) => void
  onAllRolesAssigned: (playersWithRoles: { player: Player; role: string }[]) => void
}

type SpinPhase = 'player-selection' | 'role-assignment' | 'team-display'

interface SelectedPlayerWithRole {
  player: Player
  role: string
}

const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']

export default function WheelSpinner({ 
  players, 
  spinCount, 
  disabled = false, 
  onSpinComplete, 
  onAllRolesAssigned 
}: WheelSpinnerProps) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])
  const [playersWithRoles, setPlayersWithRoles] = useState<SelectedPlayerWithRole[]>([])
  const [phase, setPhase] = useState<SpinPhase>('player-selection')
  const [currentSpin, setCurrentSpin] = useState(0)
  const [currentRoleAssignment, setCurrentRoleAssignment] = useState(0)
  const [lastSelectedPlayer, setLastSelectedPlayer] = useState<Player | null>(null)
  const [lastAssignedRole, setLastAssignedRole] = useState<string | null>(null)
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true)
  const [usedRoles, setUsedRoles] = useState<string[]>([])
  const wheelRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const activePlayers = players.filter(p => p.isActive)
  const availablePlayers = activePlayers.filter(p => !selectedPlayers.includes(p))
  
  // For role assignment phase, get available roles
  const availableRoles = phase === 'role-assignment' ? roles.filter(role => !usedRoles.includes(role)) : roles
  
  // Determine what to show on the wheel based on phase
  const wheelItems = phase === 'player-selection' ? availablePlayers : availableRoles
  const segmentAngle = wheelItems.length > 0 ? 360 / wheelItems.length : 360

  // Color generators
  const generateSegmentColor = (index: number) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#F9E79F'
    ]
    return colors[index % colors.length]
  }

  const getRoleColor = (role: string) => {
    const roleColors = {
      'Top': '#C41E3A',
      'Jungle': '#228B22', 
      'Mid': '#FFD700',
      'ADC': '#FF4500',
      'Support': '#4169E1'
    }
    return roleColors[role as keyof typeof roleColors] || '#6B7280'
  }

  const spinWheel = () => {
    if (isSpinning || disabled || wheelItems.length === 0) return

    setIsSpinning(true)
    setLastSelectedPlayer(null)
    setLastAssignedRole(null)

    // Play CSGO spinning sound
    if (audioRef.current && isSoundEnabled) {
      audioRef.current.currentTime = 0
      // Create a shorter version by stopping the audio after 3 seconds
      audioRef.current.play().catch(error => {
        console.log('Audio play failed:', error)
      })
      
      // Auto-stop audio after 3 seconds to prevent it from being too long
      setTimeout(() => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause()
        }
      }, 3000)
    }

    // Ultra-smooth physics-based spin with variable duration
    const minSpins = 4
    const maxSpins = 6
    const spinDuration = 4000 + Math.random() * 2000 // 4-6 seconds
    const spins = minSpins + Math.random() * (maxSpins - minSpins)
    
    const baseRotation = 360 * spins
    
    // NEW APPROACH: Let the wheel spin freely, then calculate which segment is at the top
    // Instead of trying to align segments, we'll determine the winner after spinning
    const randomRotation = Math.random() * 360
    const finalRotation = rotation + baseRotation + randomRotation

    // Smooth easing with enhanced physics
    let startTime: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / spinDuration, 1)
      
      // Enhanced easing curve for ultra-smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4)
      const currentRotation = rotation + (finalRotation - rotation) * easeOut
      
      setRotation(currentRotation)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Stop the audio when spinning is complete
        if (audioRef.current) {
          audioRef.current.pause()
        }
        
        // Spinning complete - handle selection
        setTimeout(() => {
          // Calculate which segment is actually pointing at the arrow after spinning
          const normalizedRotation = ((currentRotation % 360) + 360) % 360
          
          // The pointer is at 0 degrees (top)
          // Segments start at -90 degrees and each segment spans segmentAngle degrees
          // We need to find which segment contains the 0-degree point (where the arrow points)
          
          // Adjust for the -90 degree offset of segments
          const adjustedAngle = (normalizedRotation + 90) % 360
          
          // Calculate which segment index this angle falls into
          let actualSelectedIndex = Math.floor(adjustedAngle / segmentAngle) % wheelItems.length
          
          // Since segments are rendered in order but the wheel can spin in either direction,
          // we need to reverse the index calculation
          actualSelectedIndex = (wheelItems.length - actualSelectedIndex) % wheelItems.length
          
          if (phase === 'player-selection') {
            const selectedPlayer = wheelItems[actualSelectedIndex] as Player
            const newSelectedPlayers = [...selectedPlayers, selectedPlayer]
            setSelectedPlayers(newSelectedPlayers)
            setLastSelectedPlayer(selectedPlayer)
            setCurrentSpin(currentSpin + 1)

            if (newSelectedPlayers.length >= spinCount) {
              // All players selected, move to role assignment
              setPhase('role-assignment')
              setCurrentRoleAssignment(0)
              onSpinComplete(newSelectedPlayers)
            }
          } else if (phase === 'role-assignment') {
            const selectedRole = wheelItems[actualSelectedIndex] as string
            const playerToAssign = selectedPlayers[currentRoleAssignment]
            const newPlayerWithRole: SelectedPlayerWithRole = {
              player: playerToAssign,
              role: selectedRole
            }
            const newPlayersWithRoles = [...playersWithRoles, newPlayerWithRole]
            setPlayersWithRoles(newPlayersWithRoles)
            setLastAssignedRole(selectedRole)
            setCurrentRoleAssignment(currentRoleAssignment + 1)
            
            // Add the role to used roles so it won't appear again
            setUsedRoles([...usedRoles, selectedRole])

            if (newPlayersWithRoles.length >= selectedPlayers.length) {
              // All roles assigned, move to team display
              setPhase('team-display')
              onAllRolesAssigned(newPlayersWithRoles)
            } else {
              // Check if we need to reset roles for second team
              const halfPoint = Math.ceil(selectedPlayers.length / 2)
              if (newPlayersWithRoles.length === halfPoint) {
                // Reset used roles for second team
                setUsedRoles([])
              }
            }
          }
          
          setIsSpinning(false)
        }, 500)
      }
    }
    
    requestAnimationFrame(animate)
  }

  const resetWheel = () => {
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    
    setSelectedPlayers([])
    setPlayersWithRoles([])
    setPhase('player-selection')
    setCurrentSpin(0)
    setCurrentRoleAssignment(0)
    setLastSelectedPlayer(null)
    setLastAssignedRole(null)
    setUsedRoles([])
    setRotation(0)
  }

  // Reset when players change
  useEffect(() => {
    resetWheel()
  }, [players])

  // Configure audio volume and load sound preference
  useEffect(() => {
    // Load sound preference from localStorage
    const savedSoundSetting = localStorage.getItem('wheelSoundEnabled')
    if (savedSoundSetting !== null) {
      setIsSoundEnabled(savedSoundSetting === 'true')
    }
  }, [])

  // Configure audio volume when sound is enabled
  useEffect(() => {
    if (audioRef.current && isSoundEnabled) {
      audioRef.current.volume = 0.3 // Set volume to 30%
    }
  }, [isSoundEnabled])

  // Save sound preference when it changes
  useEffect(() => {
    localStorage.setItem('wheelSoundEnabled', isSoundEnabled.toString())
  }, [isSoundEnabled])

  // Auto-return to player selection after showing teams
  useEffect(() => {
    if (phase === 'team-display') {
      const timer = setTimeout(() => {
        resetWheel()
      }, 10000) // Show teams for 10 seconds

      return () => {
        clearTimeout(timer)
      }
    }
  }, [phase])

  // Team Display Component
  if (phase === 'team-display') {
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
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getRoleColor(playerWithRole.role) }}
                    ></div>
                    <span className="text-white font-medium">{playerWithRole.player.name}</span>
                  </div>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: getRoleColor(playerWithRole.role) }}
                  >
                    {playerWithRole.role}
                  </span>
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
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getRoleColor(playerWithRole.role) }}
                    ></div>
                    <span className="text-white font-medium">{playerWithRole.player.name}</span>
                  </div>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: getRoleColor(playerWithRole.role) }}
                  >
                    {playerWithRole.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-slate-400 mb-4">Teams will auto-reset in a few seconds...</div>
          <button
            onClick={resetWheel}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all transform hover:scale-105"
          >
            🔄 Start New Game
          </button>
          <div className="text-sm mt-2">Returning to player selection...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Phase Indicator */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-lg p-4 border border-slate-600 backdrop-blur-sm">
        <div className="text-center">
          <div className="text-lg font-semibold text-white mb-2">
            {phase === 'player-selection' 
              ? `🎯 Selecting Players (${currentSpin} of ${spinCount})` 
              : `🎭 Assigning Roles (${currentRoleAssignment} of ${selectedPlayers.length})`
            }
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: phase === 'player-selection' 
                  ? `${(currentSpin / spinCount) * 100}%`
                  : `${(currentRoleAssignment / selectedPlayers.length) * 100}%`
              }}
            ></div>
          </div>
          <div className="text-sm text-slate-400">
            {phase === 'player-selection' 
              ? `${selectedPlayers.length} of ${spinCount} players selected`
              : `${currentRoleAssignment} of ${selectedPlayers.length} roles assigned`
            }
          </div>
        </div>
      </div>

      {/* Recently Selected Display */}
      {(lastSelectedPlayer || lastAssignedRole) && (
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="text-center">
            {phase === 'player-selection' && lastSelectedPlayer ? (
              <>
                <div className="text-green-400 text-sm font-medium mb-1">Last Selected Player</div>
                <div className="text-white text-lg font-bold">{lastSelectedPlayer.name}</div>
                {lastSelectedPlayer.preferredRole && (
                  <div className="text-green-300 text-sm">{lastSelectedPlayer.preferredRole}</div>
                )}
              </>
            ) : phase === 'role-assignment' && lastAssignedRole ? (
              <>
                <div className="text-green-400 text-sm font-medium mb-1">Last Assigned Role</div>
                <div className="text-white text-lg font-bold">{lastAssignedRole}</div>
                <div className="text-green-300 text-sm">
                  To: {selectedPlayers[currentRoleAssignment - 1]?.name}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Wheel Container */}
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 z-20">
          <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg"></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full -mt-1 mx-auto"></div>
        </div>

        {/* Outer Ring */}
        <div className="absolute inset-0 w-96 h-96 rounded-full border-8 border-yellow-400 shadow-2xl"></div>
        
        {/* Wheel */}
        <div 
          ref={wheelRef}
          className="relative w-96 h-96 rounded-full overflow-hidden shadow-2xl border-8 border-yellow-500"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {wheelItems.map((item, index) => {
            const angle = (index * segmentAngle) - 90 // Start from top
            const nextAngle = ((index + 1) * segmentAngle) - 90
            const isPlayer = phase === 'player-selection'
            const player = isPlayer ? item as Player : null
            const role = !isPlayer ? item as string : null
            
            return (
              <div
                key={isPlayer ? player!.id : role}
                className="absolute inset-0 border border-slate-800/30"
                style={{
                  clipPath: `polygon(50% 50%, ${
                    50 + 50 * Math.cos((angle * Math.PI) / 180)
                  }% ${
                    50 + 50 * Math.sin((angle * Math.PI) / 180)
                  }%, ${
                    50 + 50 * Math.cos((nextAngle * Math.PI) / 180)
                  }% ${
                    50 + 50 * Math.sin((nextAngle * Math.PI) / 180)
                  }%)`,
                  backgroundColor: isPlayer ? generateSegmentColor(index) : getRoleColor(role!),
                  background: isPlayer 
                    ? `linear-gradient(135deg, ${generateSegmentColor(index)}, ${generateSegmentColor(index)}dd)`
                    : `linear-gradient(135deg, ${getRoleColor(role!)}, ${getRoleColor(role!)}dd)`
                }}
              >
                {/* Content */}
                <div
                  className="absolute text-white font-bold text-sm whitespace-nowrap drop-shadow-lg"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${angle + segmentAngle/2 + 90}deg) translateY(-70px)`,
                    transformOrigin: 'center',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {isPlayer 
                    ? (player!.name.length > 12 ? player!.name.substring(0, 10) + '...' : player!.name)
                    : role
                  }
                </div>
                
                {/* Secondary info for players */}
                {isPlayer && player!.preferredRole && (
                  <div
                    className="absolute text-white text-xs bg-black/60 px-2 py-1 rounded-full border border-white/30"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${angle + segmentAngle/2 + 90}deg) translateY(-45px)`,
                      transformOrigin: 'center',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                    }}
                  >
                    {player!.preferredRole}
                  </div>
                )}

                {isPlayer && player!.rank && (
                  <div
                    className="absolute text-white text-xs opacity-90 font-medium"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${angle + segmentAngle/2 + 90}deg) translateY(-25px)`,
                      transformOrigin: 'center',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                    }}
                  >
                    {player!.rank}
                  </div>
                )}
              </div>
            )
          })}

          {/* Center Circle */}
          <div className="absolute inset-1/2 w-20 h-20 -mt-10 -ml-10 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white/30">
            <div className="text-slate-900 font-black text-base tracking-wider">SPIN</div>
          </div>
        </div>

        {/* Enhanced Spinning Effect */}
                {/* Enhanced Spinning Effect */}
        {isSpinning && (
          <>
            <div className="absolute inset-0 w-96 h-96 rounded-full border-4 border-dashed border-yellow-300/60 animate-spin"></div>
            <div className="absolute inset-4 w-88 h-88 rounded-full border-2 border-dotted border-blue-300/40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
            {/* Audio indicator - only show when sound is enabled */}
            {isSoundEnabled && (
              <div className="absolute top-4 right-4 bg-black/60 rounded-full p-2 flex items-center space-x-1">
                <span className="text-yellow-400 text-xs">🔊</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-3 bg-yellow-400 rounded animate-pulse"></div>
                  <div className="w-1 h-4 bg-yellow-400 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-2 bg-yellow-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={spinWheel}
          disabled={isSpinning || disabled || wheelItems.length === 0}
          className={`px-12 py-4 rounded-xl font-bold text-xl transition-all transform duration-200 ${
            isSpinning || disabled || wheelItems.length === 0
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed scale-95'
              : 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white hover:scale-105 shadow-lg hover:shadow-2xl active:scale-95'
          } shadow-lg`}
        >
          {isSpinning 
            ? '🌀 Spinning...' 
            : phase === 'player-selection'
              ? (currentSpin === 0 ? '🎯 Select Players!' : `🎯 Next Player! (${currentSpin}/${spinCount})`)
              : (currentRoleAssignment === 0 ? '🎭 Assign Roles!' : `🎭 Next Role! (${currentRoleAssignment}/${selectedPlayers.length})`)
          }
        </button>

        {(selectedPlayers.length > 0 || playersWithRoles.length > 0) && (
          <button
            onClick={resetWheel}
            className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg font-medium transition-all transform hover:scale-105"
          >
            🔄 Start Over
          </button>
        )}

        {/* Sound control button */}
        <button
          onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
            isSoundEnabled 
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
              : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
          }`}
        >
          {isSoundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF'}
        </button>

        <div className="text-center text-slate-400 space-y-1">
          <div className="font-medium">
            {phase === 'player-selection' 
              ? `${availablePlayers.length} players remaining`
              : `${roles.length} roles available`
            }
          </div>
          {selectedPlayers.length > 0 && (
            <div className="text-sm">
              Selected: {selectedPlayers.map(p => p.name).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Hidden audio element for CSGO sound effect - only load if sound is enabled */}
      {isSoundEnabled && (
        <audio
          ref={audioRef}
          preload="auto"
          loop
          style={{ display: 'none' }}
        >
          <source src="/csgo-wheel-sound.mp3" type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  )
}