import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Player } from '../lib/api'

interface SelectedPlayerWithRole {
  player: Player
  role: string
}

interface SliderSelectorProps {
  players: Player[]
  spinCount: number
  onSpinComplete: (selectedPlayers: Player[]) => void
  onRoleAssignmentComplete: (playersWithRoles: SelectedPlayerWithRole[]) => void
  gameMode: '5v5' | 'ARAM' | 'custom'
}

const SliderSelector: React.FC<SliderSelectorProps> = ({
  players,
  spinCount,
  onSpinComplete,
  onRoleAssignmentComplete,
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])
  const [playersWithRoles, setPlayersWithRoles] = useState<SelectedPlayerWithRole[]>([])
  const [phase, setPhase] = useState<'player-selection' | 'teams-display' | 'role-assignment' | 'complete'>('player-selection')
  const [currentRoleAssignment, setCurrentRoleAssignment] = useState(0)
  const [isSliding, setIsSliding] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true)
  const [showSelectionPopup, setShowSelectionPopup] = useState(false)
  const [lastSelectedItem, setLastSelectedItem] = useState<Player | string | null>(null)
  
  const sliderRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']
  
  // IMPORTANT: Pentru slider folosesc liste diferite în funcție de fază
  const getSliderItems = () => {
    if (phase === 'player-selection') {
      // Pentru jucători, SCOT COMPLET din listă pe cei deja aleși
      return players.filter(player => !selectedPlayers.some(selected => selected.id === player.id))
    } else if (phase === 'role-assignment') {
      // Pentru roluri, resetez lista pentru fiecare echipă
      // Verific ce roluri au fost deja atribuite în echipa curentă
      const currentPlayer = selectedPlayers[currentRoleAssignment]
      if (!currentPlayer) return []
      
      const currentPlayerTeamIndex = (currentRoleAssignment + 1) % 2 // 1 = Team 1, 0 = Team 2
      const playersInSameTeam = playersWithRoles.filter((pwr) => {
        const playerTeamIndex = (selectedPlayers.findIndex(p => p.id === pwr.player.id) + 1) % 2
        return playerTeamIndex === currentPlayerTeamIndex
      })
      
      const usedRolesInTeam = playersInSameTeam.map(pwr => pwr.role)
      return roles.filter(role => !usedRolesInTeam.includes(role))
    }
    return []
  }
  
  const sliderItems = getSliderItems()
  
  // PENTRU LOOP INFINIT: creez liste duplicate pentru efect vizual
  
  // const infiniteSliderItems = getInfiniteSliderItems()

  // LOGICĂ cu DESCENDING SPEED și loop continuu
  const startSliding = () => {
    // Dacă e doar un jucător rămas, îl pun automat
    if (sliderItems.length === 1) {
      setCurrentIndex(0)
      setTimeout(() => {
        showSelectionAndContinue(0)
      }, 500)
      return
    }
    
    if (sliderItems.length <= 0) return
    
    setIsSliding(true)
    
    // Play CS:GO sound effect
    if (audioRef.current && isSoundEnabled) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(error => {
        console.log('Audio play failed:', error)
      })
    }
    
    // LOOP CONTINUU cu DESCENDING SPEED
    let currentIdx = currentIndex // Start de unde a rămas
    const totalDuration = 3000 + Math.random() * 2000 // Durata totală 3-5 secunde
    const startTime = Date.now()
    
    const slideWithDescending = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / totalDuration
      
      if (progress >= 1) {
        // Oprește sliding
        setIsSliding(false)
        
        // Stop audio
        if (audioRef.current) {
          audioRef.current.pause()
        }
        
        const finalIndex = currentIdx % sliderItems.length
        setCurrentIndex(currentIdx)
        showSelectionAndContinue(finalIndex)
        return
      }
      
      // Calculez viteza cu descending (exponential slow down)
      const slowdownFactor = Math.pow(1 - progress, 2) // Mai dramatic pe măsură ce se apropie de final
      const currentSpeed = 50 + (300 * (1 - slowdownFactor)) // De la 50ms la 350ms
      
      currentIdx++
      
      // RESET pentru loop infinit seamless - când ajung la sfârșitul setului 3, sar la setul 1
      const totalItems = sliderItems.length * 5
      if (currentIdx >= totalItems - sliderItems.length) {
        currentIdx = sliderItems.length // Resetez la setul 1 (nu 0) pentru smooth transition
      }
      
      setCurrentIndex(currentIdx)
      
      setTimeout(slideWithDescending, currentSpeed)
    }
    
    slideWithDescending()
  }

  const showSelectionAndContinue = (selectedIndex: number) => {
    const actualIndex = selectedIndex % sliderItems.length
    const selectedItem = sliderItems[actualIndex]
    
    // Afișez popup cu selecția
    setLastSelectedItem(selectedItem)
    setShowSelectionPopup(true)
    
    // Pentru roluri sau jucători, după 2 secunde confirm selecția
    setTimeout(() => {
      setShowSelectionPopup(false)
      handleSelection(actualIndex)
    }, 2000)
  }

  const handleSelection = (selectedIndex?: number) => {
    if (sliderItems.length === 0) return

    // IMPORTANT: Normalizez indexul la lungimea listei, exact ca în display
    const rawIndex = selectedIndex !== undefined ? selectedIndex : currentIndex
    const actualIndex = rawIndex % sliderItems.length
    const selectedItem = sliderItems[actualIndex]
    
    if (phase === 'player-selection') {
      const selectedPlayer = selectedItem as Player
      
      // Simplu: adaugă player-ul (nu mai verific disponibilitatea că l-am scos din listă)
      if (selectedPlayer) {
        const newSelectedPlayers = [...selectedPlayers, selectedPlayer]
        setSelectedPlayers(newSelectedPlayers)

        if (newSelectedPlayers.length >= spinCount) {
          setTimeout(() => {
            setPhase('teams-display')
          }, 500)
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
        setCurrentRoleAssignment(currentRoleAssignment + 1)

        if (currentRoleAssignment + 1 >= selectedPlayers.length) {
          setPhase('complete')
          onRoleAssignmentComplete(newPlayersWithRoles)
        } else {
          setTimeout(() => {
            setCurrentIndex(0)
          }, 500)
        }
      }
    }
  }

  // Load sound preference from localStorage
  useEffect(() => {
    const savedSoundSetting = localStorage.getItem('sliderSoundEnabled')
    if (savedSoundSetting !== null) {
      setIsSoundEnabled(savedSoundSetting === 'true')
    }
  }, [])

  // Save sound preference when it changes
  useEffect(() => {
    localStorage.setItem('sliderSoundEnabled', isSoundEnabled.toString())
  }, [isSoundEnabled])

  // Configure audio volume when sound is enabled
  useEffect(() => {
    if (audioRef.current && isSoundEnabled) {
      audioRef.current.volume = 0.3 // Set volume to 30%
    }
  }, [isSoundEnabled])

  if (phase === 'teams-display') {
    return (
      <div className="flex flex-col items-center space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">🎯 Teams Formed!</h2>
          <div className="text-lg text-slate-300">Here are your teams based on alternating selection</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Team 1 - jucători cu index impar (1,3,5...) */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-blue-400 mb-4 text-center">Team 1</h3>
            <div className="space-y-3">
              {selectedPlayers.filter((_, index) => (index + 1) % 2 === 1).map((player) => (
                <div key={player.id} className="flex items-center justify-between bg-blue-900/30 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                    <span className="text-white font-medium">{player.name}</span>
                  </div>
                  <span className="text-blue-300 text-sm font-medium">
                    {player.preferredRole || 'No Role'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Team 2 - jucători cu index par (2,4,6...) */}
          <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-red-400 mb-4 text-center">Team 2</h3>
            <div className="space-y-3">
              {selectedPlayers.filter((_, index) => (index + 1) % 2 === 0).map((player) => (
                <div key={player.id} className="flex items-center justify-between bg-red-900/30 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-red-400"></div>
                    <span className="text-white font-medium">{player.name}</span>
                  </div>
                  <span className="text-red-300 text-sm font-medium">
                    {player.preferredRole || 'No Role'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={() => {
              setCurrentIndex(0)
              setPhase('role-assignment')
              setCurrentRoleAssignment(0)
              onSpinComplete(selectedPlayers)
            }}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
          >
            🎭 Assign Roles to Each Player
          </button>
          
          <div>
            <button
              onClick={() => {
                // Skip role assignment and go directly to complete
                const playersWithDefaultRoles = selectedPlayers.map(player => ({
                  player,
                  role: player.preferredRole || 'Flex'
                }))
                setPlayersWithRoles(playersWithDefaultRoles)
                setPhase('complete')
                onRoleAssignmentComplete(playersWithDefaultRoles)
              }}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-200 text-sm"
            >
              Skip Role Assignment (Use Preferred Roles)
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="flex flex-col items-center space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">🏆 Teams Formed!</h2>
          <div className="text-lg text-slate-300">Here are your teams with assigned roles</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Team 1 - jucători cu index impar (1,3,5...) */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-blue-400 mb-4 text-center">Team 1</h3>
            <div className="space-y-3">
              {playersWithRoles.filter((_, index) => (index + 1) % 2 === 1).map((playerWithRole) => (
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

          {/* Team 2 - jucători cu index par (2,4,6...) */}
          <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-red-400 mb-4 text-center">Team 2</h3>
            <div className="space-y-3">
              {playersWithRoles.filter((_, index) => (index + 1) % 2 === 0).map((playerWithRole) => (
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

  if (sliderItems.length === 0 && (phase === 'player-selection' || phase === 'role-assignment')) {
    return (
      <div className="flex flex-col items-center space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">🎰 Preparing Slider...</h2>
          <p className="text-slate-300">Setting up the next phase</p>
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
            ? (() => {
                const nextPlayerIndex = selectedPlayers.length + 1
                // ALTERNARE: primul la Team 1, al doilea la Team 2, etc.
                const isSelectingForTeam1 = (nextPlayerIndex % 2) === 1
                const teamColor = isSelectingForTeam1 ? 'text-blue-400' : 'text-red-400'
                const teamName = isSelectingForTeam1 ? 'Team 1' : 'Team 2'
                
                // Dacă e ultimul jucător, specific că merge automat în echipa potrivită
                if (sliderItems.length === 1) {
                  return (
                    <span>
                      Last player goes automatically to <span className={teamColor}>{teamName}</span> - 
                      {' '}{selectedPlayers.length + 1} of {spinCount} selected
                    </span>
                  )
                }
                
                return (
                  <span>
                    Selecting player for <span className={teamColor}>{teamName}</span> - 
                    {' '}{selectedPlayers.length} of {spinCount} selected
                  </span>
                )
              })()
            : phase === 'role-assignment'
            ? (() => {
                const playerIndex = currentRoleAssignment + 1
                // ALTERNARE: jucătorii cu index impar (1,3,5...) la Team 1, pari (2,4,6...) la Team 2
                const isTeam1 = (playerIndex % 2) === 1
                const teamColor = isTeam1 ? 'text-blue-400' : 'text-red-400'
                const teamName = isTeam1 ? 'Team 1' : 'Team 2'
                return (
                  <span>
                    Assigning role to <span className={teamColor}>{selectedPlayers[currentRoleAssignment]?.name}</span> 
                    {' '}(<span className={teamColor}>{teamName}</span>)
                  </span>
                )
              })()
            : 'Game setup complete'
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
        </div>
      )}

      {/* CS:GO Style Slider */}
      <div className="relative">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-yellow-400 rounded-xl p-8 shadow-2xl min-w-[500px]">
          
          {/* Slider Container */}
          <div className="relative h-32 overflow-hidden rounded-lg bg-black/50 border border-slate-600">
            
            {/* Center Indicator */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-yellow-400 to-orange-500 z-20 opacity-80"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-yellow-400 rounded-full bg-yellow-400/20 z-10"></div>
            
            {/* Sliding Items - LOOP INFINIT cu duplicate pentru seamless */}
            <div 
              ref={sliderRef}
              className="flex items-center h-full transition-transform duration-75 ease-out"
              style={{
                transform: `translateX(calc(50% - ${(currentIndex * 112)}px - 56px))`,
              }}
            >
              {/* Creez liste duplicate pentru loop seamless infinit */}
              {[...Array(5)].map((_, setIndex) => 
                sliderItems.map((item, index) => {
                  // Calculez poziția absolută în loop-ul infinit
                  const absolutePosition = setIndex * sliderItems.length + index
                  const isCurrentlySelected = absolutePosition === currentIndex
                  
                  return (
                    <motion.div
                      key={`${typeof item === 'string' ? item : item.id}-${setIndex}-${index}`}
                      className={`flex-shrink-0 w-24 h-20 mx-2 rounded-lg border-2 ${
                        isCurrentlySelected
                          ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 scale-110' 
                          : 'border-slate-600 bg-gradient-to-br from-slate-700 to-slate-800'
                      } flex items-center justify-center transition-all duration-75`}
                      animate={{
                        scale: isCurrentlySelected ? 1.1 : 1,
                        opacity: isCurrentlySelected ? 1 : 0.7
                      }}
                    >
                      <div className={`text-center ${
                        isCurrentlySelected ? 'text-yellow-200' : 'text-white'
                      }`}>
                        <div className="text-xs font-bold">
                          {typeof item === 'string' 
                            ? item 
                            : `${item.name}${item.preferredRole ? `\t${item.preferredRole}` : ''}${item.rank ? `\t${item.rank}` : ''}`
                          }
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>

          {/* Current Selection Display */}
          <div className="mt-6 text-center">
            <div className="text-sm text-slate-400 mb-2">Current Selection:</div>
            <div className={`text-2xl font-bold ${isSliding ? 'text-yellow-400' : 'text-white'} transition-colors duration-200`}>
              {(() => {
                // FOLOSESC EXACT ACEEAȘI LOGICĂ ca pentru highlighting în slider
                const normalizedIndex = currentIndex % sliderItems.length
                if (normalizedIndex >= 0 && normalizedIndex < sliderItems.length && sliderItems[normalizedIndex]) {
                  const item = sliderItems[normalizedIndex]
                  if (typeof item === 'string') {
                    return item
                  } else {
                    // EXACT ACELAȘI FORMAT ca în slider
                    return `${item.name}${item.preferredRole ? `\t${item.preferredRole}` : ''}${item.rank ? `\t${item.rank}` : ''}`
                  }
                }
                return 'Loading...'
              })()}
            </div>
          </div>

          {/* Slide Button */}
          <div className="mt-6 text-center space-y-3">
            <button
              onClick={startSliding}
              disabled={isSliding}
              className={`px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                isSliding 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : sliderItems.length === 1
                  ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 transform hover:scale-105'
                  : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700 transform hover:scale-105'
              }`}
            >
              {isSliding 
                ? (phase === 'player-selection' ? '🎰 SLIDING...' : '🎭 SPINNING...')
                : sliderItems.length === 1 
                ? (phase === 'player-selection' ? '⚡ AUTO-SELECT LAST PLAYER' : '⚡ AUTO-SELECT LAST ROLE')
                : (phase === 'player-selection' ? '🎰 START SLIDE' : '🎭 SPIN FOR ROLE')
              }
            </button>
            
            {/* Sound control button */}
            <div>
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 text-sm ${
                  isSoundEnabled 
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
                }`}
              >
                {isSoundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Popup */}
      {showSelectionPopup && lastSelectedItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-yellow-400 rounded-xl p-8 shadow-2xl text-center">
            <div className="text-6xl mb-4">
              {phase === 'player-selection' ? '🎯' : '🎭'}
            </div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">
              {phase === 'player-selection' ? 'Player Selected!' : 'Role Selected!'}
            </h2>
            <div className="text-2xl font-bold text-white mb-6">
              {typeof lastSelectedItem === 'string' 
                ? lastSelectedItem 
                : `${lastSelectedItem.name}${lastSelectedItem.preferredRole ? ` (${lastSelectedItem.preferredRole})` : ''}`
              }
            </div>
            <div className="text-slate-300">
              {phase === 'player-selection' 
                ? (() => {
                    const nextPlayerIndex = selectedPlayers.length + 1
                    const isSelectingForTeam1 = (nextPlayerIndex % 2) === 1
                    const teamColor = isSelectingForTeam1 ? 'text-blue-400' : 'text-red-400'
                    const teamName = isSelectingForTeam1 ? 'Team 1' : 'Team 2'
                    return (
                      <span>
                        Going to <span className={teamColor}>{teamName}</span>
                      </span>
                    )
                  })()
                : (() => {
                    const currentPlayer = selectedPlayers[currentRoleAssignment]
                    const playerIndex = currentRoleAssignment + 1
                    const isTeam1 = (playerIndex % 2) === 1
                    const teamColor = isTeam1 ? 'text-blue-400' : 'text-red-400'
                    const teamName = isTeam1 ? 'Team 1' : 'Team 2'
                    return (
                      <span>
                        Assigned to <span className={teamColor}>{currentPlayer?.name}</span> 
                        {' '}(<span className={teamColor}>{teamName}</span>)
                      </span>
                    )
                  })()
              }
            </div>
            <div className="mt-4 text-sm text-slate-400">
              Continuing in 2 seconds...
            </div>
          </div>
        </div>
      )}

      {/* Debug - Selected Players Display - doar pentru debug, să văd ce se întâmplă */}
      {selectedPlayers.length > 0 && !showSelectionPopup && (
        <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-4 max-w-md">
          <h3 className="text-white font-bold mb-2">Debug - Selected Players:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedPlayers.map((player, index) => {
              const isTeam1 = ((index + 1) % 2) === 1
              const teamColor = isTeam1 ? 'bg-blue-600/30 text-blue-300 border-blue-500/30' : 'bg-red-600/30 text-red-300 border-red-500/30'
              return (
                <span 
                  key={player.id}
                  className={`${teamColor} px-3 py-1 rounded-full text-sm border`}
                >
                  {index + 1}. {player.name} ({isTeam1 ? 'Team 1' : 'Team 2'})
                </span>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Hidden audio element for CS:GO sound effect */}
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

export default SliderSelector