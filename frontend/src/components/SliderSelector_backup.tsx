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
  const [phase, setPhase] = useState<'player-selection' | 'role-assignment' | 'complete'>('player-selection')
  const [currentRoleAssignment, setCurrentRoleAssignment] = useState(0)
  const [usedRoles, setUsedRoles] = useState<string[]>([])
  const [isSliding, setIsSliding] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true)
  const [showRetryMessage, setShowRetryMessage] = useState(false)
  
  const sliderRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']
  
  // IMPORTANT: Pentru slider folosesc liste diferite în funcție de fază
  const getSliderItems = () => {
    if (phase === 'player-selection') {
      // Pentru jucători, arăt toți dar exclud din selecție doar cei deja aleși
      return players
    } else if (phase === 'role-assignment') {
      // Pentru roluri, scot complet rolurile deja folosite
      return roles.filter(role => !usedRoles.includes(role))
    }
    return players
  }
  
  const sliderItems = getSliderItems()
  
  // Creez infinite loop cu item-uri duplicate pentru smooth scrolling
  const createInfiniteLoop = () => {
    if (sliderItems.length === 0) return []
    // Creez 3 copii ale listei pentru loop infinit
    return [...sliderItems, ...sliderItems, ...sliderItems]
  }

  const infiniteItems = createInfiniteLoop()
  const startIndex = sliderItems.length // Încep din mijloc pentru a avea spațiu în ambele direcții

  // LOGICĂ SIMPLĂ cu infinite loop
  const startSliding = () => {
    if (sliderItems.length <= 1) return
    
    setIsSliding(true)
    setCurrentIndex(startIndex) // Încep din mijloc
    setShowRetryMessage(false)
    
    // Play CS:GO sound effect
    if (audioRef.current && isSoundEnabled) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(error => {
        console.log('Audio play failed:', error)
      })
    }
    
    // Simplu: schimb indexul la interval regulat prin lista infinită
    let currentIdx = startIndex
    const slideInterval = setInterval(() => {
      currentIdx = (currentIdx + 1) % infiniteItems.length
      // Dacă ajung la sfârșit, resetez la început fără să se observe
      if (currentIdx === 0) {
        currentIdx = startIndex
      }
      setCurrentIndex(currentIdx)
    }, 80) // Slide rapid la 80ms
    
    // Oprește după un timp random
    const stopTime = 2000 + Math.random() * 2000
    setTimeout(() => {
      clearInterval(slideInterval)
      
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      // Calculez indexul real în lista originală
      const realIndex = currentIdx % sliderItems.length
      stopSliding(realIndex)
    }, stopTime)
  }

  const stopSliding = (finalIndex: number) => {
    setIsSliding(false)
    setCurrentIndex(finalIndex + startIndex) // Mențin poziția vizuală
    handleSelection(finalIndex)
  }

  const handleSelection = (selectedIndex?: number) => {
    if (sliderItems.length === 0) return

    const actualIndex = selectedIndex !== undefined ? selectedIndex : currentIndex % sliderItems.length
    const selectedItem = sliderItems[actualIndex]
    
    if (phase === 'player-selection') {
      const selectedPlayer = selectedItem as Player
      
      // IMPORTANT: Verific dacă player-ul este disponibil pentru selecție
      const isPlayerAvailable = !selectedPlayers.includes(selectedPlayer)
      
      if (selectedPlayer && isPlayerAvailable) {
        const newSelectedPlayers = [...selectedPlayers, selectedPlayer]
        setSelectedPlayers(newSelectedPlayers)

        if (newSelectedPlayers.length >= spinCount) {
          setTimeout(() => {
            setCurrentIndex(0)
            setPhase('role-assignment')
            setCurrentRoleAssignment(0)
            onSpinComplete(newSelectedPlayers)
          }, 500)
        }
      } else {
        // Dacă player-ul nu e disponibil, încearcă din nou automat
        setShowRetryMessage(true)
        setTimeout(() => {
          setShowRetryMessage(false)
          startSliding()
        }, 1000)
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
          // Check if we need to reset roles for second team
          const halfPoint = Math.ceil(selectedPlayers.length / 2)
          if (newPlayersWithRoles.length === halfPoint) {
            // Reset used roles for second team
            setUsedRoles([])
          }
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

  if (sliderItems.length === 0) {
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
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-2">🎰 CS:GO Style Selector!</h2>
        <p className="text-slate-300">
          {phase === 'player-selection' 
            ? `Click to slide and select players - ${selectedPlayers.length} of ${spinCount} selected`
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
            
            {/* Sliding Items - cu infinite loop */}
            <div 
              ref={sliderRef}
              className="flex items-center h-full transition-transform duration-75 ease-out"
              style={{
                transform: `translateX(calc(50% - ${currentIndex * 112}px - 56px))`,
              }}
            >
              {infiniteItems.map((item, index) => {
                // SIMPLU: indexul curent e cel highlighted
                const isCurrentlySelected = index === currentIndex
                
                // Verific dacă item-ul este deja selectat (pentru player-uri)
                const isAlreadySelected = phase === 'player-selection' && 
                  typeof item === 'object' && 
                  selectedPlayers.some(p => p.id === (item as Player).id)
                
                return (
                  <motion.div
                    key={`${typeof item === 'string' ? item : item.id}-${index}`}
                    className={`flex-shrink-0 w-24 h-20 mx-2 rounded-lg border-2 ${
                      isCurrentlySelected
                        ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 scale-110' 
                        : isAlreadySelected
                        ? 'border-red-400 bg-gradient-to-br from-red-600/30 to-red-800/30 opacity-50'
                        : 'border-slate-600 bg-gradient-to-br from-slate-700 to-slate-800'
                    } flex items-center justify-center transition-all duration-75`}
                    animate={{
                      scale: isCurrentlySelected ? 1.1 : 1,
                      opacity: isCurrentlySelected ? 1 : isAlreadySelected ? 0.5 : 0.7
                    }}
                  >
                    <div className={`text-center ${
                      isCurrentlySelected ? 'text-yellow-200' : 
                      isAlreadySelected ? 'text-red-300' : 'text-white'
                    }`}>
                      <div className="text-xs font-bold">
                        {typeof item === 'string' ? item : item.name}
                        {isAlreadySelected && <div className="text-xs">✓</div>}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Current Selection Display */}
          <div className="mt-6 text-center">
            <div className="text-sm text-slate-400 mb-2">Current Selection:</div>
            <div className={`text-2xl font-bold ${isSliding ? 'text-yellow-400' : 'text-white'} transition-colors duration-200`}>
              {currentIndex >= 0 && currentIndex < infiniteItems.length && infiniteItems[currentIndex] ? (
                typeof infiniteItems[currentIndex] === 'string' 
                  ? infiniteItems[currentIndex] as string
                  : (infiniteItems[currentIndex] as Player).name
              ) : 'Loading...'}
            </div>
            {showRetryMessage && (
              <div className="text-sm text-blue-400 mt-1">Player already selected - retrying...</div>
            )}
          </div>

          {/* Slide Button */}
          <div className="mt-6 text-center space-y-3">
            <button
              onClick={startSliding}
              disabled={isSliding}
              className={`px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                isSliding 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700 transform hover:scale-105'
              }`}
            >
              {isSliding ? '🎰 SLIDING...' : '🎰 START SLIDE'}
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