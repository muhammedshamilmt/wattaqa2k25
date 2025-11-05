"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";


export function Hero() {
  // Team data with positions
  const teams = [
    {
      id: 'sumud',
      name: 'Team Sumud',
      description: 'Arts & Sports Excellence',
      image: '/images/teams/sumud team.png',
      gradient: 'from-green-400 to-emerald-500',
      overlayGradient: 'from-green-500/50 via-emerald-400/15 to-transparent',
      borderColor: 'border-green-400/30'
    },
    {
      id: 'aqsa',
      name: 'Team Aqsa',
      description: 'Creative & Athletic Champions',
      image: '/images/teams/AL AQSA TEAM.png',
      gradient: 'from-gray-600 to-gray-700',
      overlayGradient: 'from-gray-700/50 via-gray-600/15 to-transparent',
      borderColor: 'border-gray-500/30'
    },
    {
      id: 'inthifada',
      name: 'Team Inthifada',
      description: 'Innovation & Competition',
      image: '/images/teams/inthifada team.png',
      gradient: 'from-red-400 to-rose-500',
      overlayGradient: 'from-red-500/50 via-rose-400/15 to-transparent',
      borderColor: 'border-red-400/30'
    }
  ];

  // Position configurations for the three slots - fixed positions, no x-axis movement
  const positions = [
    {
      id: 'left',
      height: 'h-80',
      width: 'md:w-80',
      order: 0,
      scale: 1, // All teams same scale
      y: 0,
      zIndex: 10
    },
    {
      id: 'center',
      height: 'h-80', // Same height as others
      width: 'md:w-80', // Same width as others
      order: 1,
      scale: 1, // Same scale as others
      y: 0,
      zIndex: 20
    },
    {
      id: 'right',
      height: 'h-80',
      width: 'md:w-80',
      order: 2,
      scale: 1, // All teams same scale
      y: 0,
      zIndex: 10
    }
  ];

  // Teams stay in fixed positions - no state management needed

  return (
    <div className="h-screen relative overflow-hidden bg-white flex flex-col"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}>

      {/* Navigation - Enhanced Alignment */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        {/* Logo Section - Fixed Width for Consistent Alignment */}
        <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
          <Image
            src="/images/festival-logo.png"
            alt="Festival 2K25"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="font-bold text-xl text-gray-900 truncate">wattaqa 2K25</span>
        </div>

        {/* Center Navigation - Properly Centered */}
        <div className="hidden lg:flex items-center justify-center flex-1 max-w-md mx-8">
          <div className="flex items-center space-x-8 text-gray-600">
            <a href="#schedule" className="hover:text-gray-900 transition-colors duration-200 font-medium">
              Schedule
            </a>
            <Link href="/programmes" className="hover:text-gray-900 transition-colors duration-200 font-medium">
              Programmes
            </Link>
            <Link href="/profiles" className="hover:text-gray-900 transition-colors duration-200 font-medium">
              Profiles
            </Link>
            <Link href="/results" className="hover:text-gray-900 transition-colors duration-200 font-medium">
              Results
            </Link>
          </div>
        </div>

        {/* Medium Screen Navigation */}
        <div className="hidden md:flex lg:hidden items-center space-x-6 text-gray-600">
          <a href="#schedule" className="hover:text-gray-900 transition-colors duration-200">Schedule</a>
          <Link href="/programmes" className="hover:text-gray-900 transition-colors duration-200">Programmes</Link>
          <Link href="/profiles" className="hover:text-gray-900 transition-colors duration-200">Profiles</Link>
          <Link href="/results" className="hover:text-gray-900 transition-colors duration-200">Results</Link>
        </div>

        {/* Action Button - Fixed Width for Consistent Alignment */}
        <div className="flex items-center flex-shrink-0">
          <Link 
            href="/login" 
            className="bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center ml-4">
          <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Section - Full Screen Height */}
      <div className="flex-1 flex flex-col justify-center text-center px-8 max-w-6xl mx-auto w-full">

        {/* User avatars and rating */}
        <motion.div
          className="flex items-center justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className="flex items-center mr-2"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <div className="text-2xl mr-2">🎭</div>
          </motion.div>
          <div className="flex -space-x-2 mr-4">
            {[
              'from-green-400 to-emerald-400',
              'from-blue-400 to-cyan-400',
              'from-red-400 to-rose-400',
              'from-gray-600 to-gray-800'
            ].map((gradient, index) => (
              <motion.div
                key={index}
                className={`w-10 h-10 bg-gradient-to-r ${gradient} rounded-full border-2 border-white ${index === 3 ? 'flex items-center justify-center' : ''}`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.4 + index * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                whileHover={{ scale: 1.1, y: -2 }}
              >
                {index === 3 && <span className="text-white text-sm font-bold">+</span>}
              </motion.div>
            ))}
          </div>
          <motion.span
            className="text-gray-600 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            135+ talented students
          </motion.span>
        </motion.div>

        {/* Main heading */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1.2,
              delay: 0.5,
              type: "spring",
              stiffness: 100
            }}
          >
            <motion.span
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Celebrate
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
            >
              WATTAQA 2K25
            </motion.span>
          </motion.h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          Join three dynamic teams competing across 200+ programs<br />
          in arts, sports, and creative excellence
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link href="/results" className="bg-black text-white px-8 py-4 rounded-full flex items-center gap-2 hover:bg-gray-800 transition-colors text-lg shadow-lg hover:shadow-xl">
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              >
                🏆
              </motion.span>
              <span>View Results</span>
            </Link>
          </motion.div>
        
        </motion.div>
        {/* Three Team Containers - Fixed Positions, No Movement */}
        <motion.div
          className="flex flex-col md:flex-row items-end justify-center gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          {teams.map((team, teamIndex) => {
            const position = positions[teamIndex] || positions[0]; // Use team index for fixed positions

            return (
              <motion.div
                key={team.id}
                className={`bg-gradient-to-br ${team.gradient} rounded-3xl w-full ${position.width} ${position.height} relative overflow-hidden cursor-pointer group`}
                initial={{
                  opacity: 1, // Start visible immediately
                  y: 100,
                  scale: 1 // No initial scale animation
                }}
                animate={{
                  opacity: 1, // Always fully visible - no hiding
                  y: position.y,
                  zIndex: position.zIndex
                }}
                transition={{
                  duration: 1.2,
                  delay: 1.7 + teamIndex * 0.2,
                  type: "spring",
                  stiffness: 80,
                  damping: 20
                }}
                whileHover={{
                  y: position.y - 10, // Simple hover lift
                  transition: { duration: 0.3, type: "spring", stiffness: 300 }
                }}
                whileTap={{ y: position.y + 2 }} // Simple tap effect
                style={{ zIndex: position.zIndex }}
              >
                {/* Floating animation background with team-specific colors */}
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: team.id === 'sumud' ? [
                      "linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(5, 150, 105, 0.2))",
                      "linear-gradient(to bottom right, rgba(5, 150, 105, 0.3), rgba(34, 197, 94, 0.1))",
                      "linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(5, 150, 105, 0.2))"
                    ] : team.id === 'aqsa' ? [
                      "linear-gradient(to bottom right, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2))",
                      "linear-gradient(to bottom right, rgba(75, 85, 99, 0.3), rgba(107, 114, 128, 0.1))",
                      "linear-gradient(to bottom right, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2))"
                    ] : [
                      "linear-gradient(to bottom right, rgba(248, 113, 113, 0.2), rgba(225, 29, 72, 0.2))",
                      "linear-gradient(to bottom right, rgba(225, 29, 72, 0.3), rgba(248, 113, 113, 0.1))",
                      "linear-gradient(to bottom right, rgba(248, 113, 113, 0.2), rgba(225, 29, 72, 0.2))"
                    ]
                  }}
                  transition={{
                    duration: 2.5, // Match the rotation interval
                    repeat: Infinity,
                    delay: teamIndex * 0.3 // Shorter delay for more frequent visibility
                  }}
                />

                {/* Team Image Background */}
                <motion.div
                  className="absolute inset-0 opacity-80"
                  key={team.id}
                  initial={{ opacity: 0.8, scale: 1.1 }} // Start visible
                  animate={{ opacity: 0.8, scale: 1 }} // Maintain visibility
                  transition={{ duration: 0.8 }}
                >
                  <Image
                    src={team.image}
                    alt={team.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </motion.div>

                {/* Team color overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${team.overlayGradient}`}></div>



                {/* Team indicator dot - fixed position */}
                <motion.div
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 2 + teamIndex * 0.1 }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-white"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: teamIndex * 0.2
                    }}
                  />
                </motion.div>

                {/* Animated border with team-specific glow */}
                <motion.div
                  className={`absolute inset-0 rounded-3xl border-2 ${team.borderColor}`}
                  animate={{
                    borderColor: team.id === 'sumud' ? [
                      "rgba(34, 197, 94, 0.3)",
                      "rgba(34, 197, 94, 0.6)",
                      "rgba(34, 197, 94, 0.3)"
                    ] : team.id === 'aqsa' ? [
                      "rgba(107, 114, 128, 0.3)",
                      "rgba(107, 114, 128, 0.6)",
                      "rgba(107, 114, 128, 0.3)"
                    ] : [
                      "rgba(248, 113, 113, 0.3)",
                      "rgba(248, 113, 113, 0.6)",
                      "rgba(248, 113, 113, 0.3)"
                    ],
                    boxShadow: teamIndex === 1 ? [
                      "0 0 20px rgba(255, 255, 255, 0.1)",
                      "0 0 40px rgba(255, 255, 255, 0.2)",
                      "0 0 20px rgba(255, 255, 255, 0.1)"
                    ] : [
                      "0 0 10px rgba(255, 255, 255, 0.05)",
                      "0 0 20px rgba(255, 255, 255, 0.1)",
                      "0 0 10px rgba(255, 255, 255, 0.05)"
                    ]
                  }}
                  transition={{
                    duration: 2.5, // Match rotation timing
                    repeat: Infinity,
                    delay: teamIndex * 0.2 // Shorter delay for more visibility
                  }}
                />

                {/* Spotlight effect for center team (Team Aqsa) */}
                {teamIndex === 1 && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-radial from-white/15 via-transparent to-transparent rounded-3xl"
                    animate={{
                      opacity: [0.4, 0.7, 0.4]
                    }}
                    transition={{
                      duration: 2.5, // Match rotation timing
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}