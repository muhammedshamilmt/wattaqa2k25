"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <div className="h-screen relative overflow-hidden bg-white flex flex-col"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <Image
            src="/images/festival-logo.png"
            alt="Festival 2K25"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="font-bold text-xl">wattaqa 2K25</span>
        </div>

        <div className="hidden md:flex items-center space-x-6 text-gray-500">
          <a href="#schedule" className="hover:text-gray-900 transition-colors">Schedule</a>
          <Link href="/programmes" className="hover:text-gray-900 transition-colors">Programmes</Link>
          <Link href="/profiles" className="hover:text-gray-900 transition-colors">Profiles</Link>
          <Link href="/leaderboard" className="hover:text-gray-900 transition-colors">Leaderboard</Link>
          <Link href="/results" className="hover:text-gray-900 transition-colors">Results</Link>
        </div>

        <Link href="/login" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
          Login
        </Link>
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
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/leaderboard" className="text-gray-500 hover:text-gray-900 transition-colors text-lg">
              View Leaderboard
            </Link>
          </motion.div>
        </motion.div>
        {/* Three Animated Image Containers */}
        <motion.div
          className="flex flex-col md:flex-row items-end justify-center gap-6 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
        >

          {/* Green container - Team Sumud */}
          <motion.div
            className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl w-full md:w-80 h-80 relative overflow-hidden cursor-pointer group"
            initial={{ opacity: 0, y: 100, rotateY: -30 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{
              duration: 0.8,
              delay: 1.7,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{
              scale: 1.05,
              y: -10,
              rotateY: 5,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
          >

            {/* Floating animation background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-green-300/20 to-emerald-600/20"
              animate={{
                background: [
                  "linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(5, 150, 105, 0.2))",
                  "linear-gradient(to bottom right, rgba(5, 150, 105, 0.3), rgba(34, 197, 94, 0.1))",
                  "linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(5, 150, 105, 0.2))"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            {/* Team Image Background */}
            <div className="absolute inset-0 opacity-80">
              <Image
                src="/images/teams/sumud team.png"
                alt="Team Sumud"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Green overlay for team color identity */}
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/50 via-emerald-400/15 to-transparent"></div>

            {/* Content */}
            <motion.div
              className="absolute bottom-6 left-6 right-6 text-white text-center relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
            >
              {/* <h3 className="text-lg font-bold mb-1 drop-shadow-lg">Team Sumud</h3>
              <p className="text-sm opacity-90 drop-shadow-md">Arts & Sports Excellence</p> */}
            </motion.div>

            {/* Animated border */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-white/20"
              animate={{
                borderColor: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.2)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          {/* Gray container - Team Aqsa (taller) */}
          <motion.div
            className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-3xl w-full md:w-80 h-96 relative overflow-hidden cursor-pointer group"
            initial={{ opacity: 0, y: 120, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 1.9,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{
              scale: 1.05,
              y: -15,
              rotateY: -5,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
          >

            {/* Floating animation background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-gray-600/20"
              animate={{
                background: [
                  "linear-gradient(to bottom right, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2))",
                  "linear-gradient(to bottom right, rgba(75, 85, 99, 0.3), rgba(107, 114, 128, 0.1))",
                  "linear-gradient(to bottom right, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2))"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />

            {/* Team Image - Front and Center */}
            <div className="absolute inset-0 opacity-80">
              <Image
                src="/images/teams/AL AQSA TEAM.png"
                alt="Team Aqsa"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Gray overlay for team color identity */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-700/50 via-gray-600/15 to-transparent"></div>

            {/* Content */}
            <motion.div
              className="absolute bottom-6 left-6 right-6 text-white text-center relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2 }}
            >
              {/* <h3 className="text-lg font-bold mb-1 drop-shadow-lg">Team Aqsa</h3>
              <p className="text-sm opacity-90 drop-shadow-md">Creative & Athletic Champions</p> */}
            </motion.div>

            {/* Animated border */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-white/20"
              animate={{
                borderColor: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0.2)"]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
          </motion.div>

          {/* Red container - Team Inthifada */}
          <motion.div
            className="bg-gradient-to-br from-red-400 to-rose-500 rounded-3xl w-full md:w-80 h-80 relative overflow-hidden cursor-pointer group"
            initial={{ opacity: 0, y: 100, rotateY: 30 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{
              duration: 0.8,
              delay: 2.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{
              scale: 1.05,
              y: -10,
              rotateY: -5,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
          >

            {/* Floating animation background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-red-300/20 to-rose-600/20"
              animate={{
                background: [
                  "linear-gradient(to bottom right, rgba(248, 113, 113, 0.2), rgba(225, 29, 72, 0.2))",
                  "linear-gradient(to bottom right, rgba(225, 29, 72, 0.3), rgba(248, 113, 113, 0.1))",
                  "linear-gradient(to bottom right, rgba(248, 113, 113, 0.2), rgba(225, 29, 72, 0.2))"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />

            {/* Team Image Background */}
            <div className="absolute inset-0 opacity-80">
              <Image
                src="/images/teams/INTHIFADA TEAM.png"
                alt="Team Inthifada"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Red overlay for team color identity */}
            <div className="absolute inset-0 bg-gradient-to-t from-red-500/50 via-rose-400/15 to-transparent"></div>

            {/* Content */}
            <motion.div
              className="absolute bottom-6 left-6 right-6 text-white text-center relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4 }}
            >
              {/* <h3 className="text-lg font-bold mb-1 drop-shadow-lg">Team Inthifada</h3>
              <p className="text-sm opacity-90 drop-shadow-md">Innovation & Competition</p> */}
            </motion.div>

            {/* Animated border */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-white/20"
              animate={{
                borderColor: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.2)"]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            />
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}