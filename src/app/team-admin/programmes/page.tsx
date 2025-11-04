'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { Candidate, Programme, ProgrammeParticipant, Team } from '@/types';
import TeamBreadcrumb from '@/components/TeamAdmin/TeamBreadcrumb';
import { useTeamAdmin } from '@/contexts/TeamAdminContext';
import { useFirebaseTeamAuth } from '@/contexts/FirebaseTeamAuthContext';
import { AccessDeniedScreen, TeamAccessLoadingScreen } from '@/hooks/useSecureTeamAccess';

function TeamProgrammesContent() {
  // Use simplified team admin context
  const { teamCode, loading: accessLoading, accessDenied, userEmail, isAdminAccess } = useTeamAdmin();
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamCode && teamCode !== 'Loading...') {
      fetchData();
    }
  }, [teamCode]);

  const fetchData = async () => {
    if (!teamCode || teamCode === 'Loading...') {
      console.error('No team code available');
      return;
    }

    try {
      console.log('🚀 Fetching programmes data for team:', teamCode);
      console.log('👤 Access info:', { userEmail, isAdminAccess });

      const [candidatesRes, programmesRes, participantsRes, teamsRes] = await Promise.all([
        fetch(`/api/team-admin/candidates?team=${teamCode}`),
        fetch('/api/programmes'), // Public data
        fetch(`/api/programme-participants?team=${teamCode}`), // Public data
        fetch('/api/teams') // Public data
      ]);

      console.log('📊 Programmes API response status:', {
        candidates: candidatesRes.status,
        programmes: programmesRes.status,
        participants: participantsRes.status,
        teams: teamsRes.status
      });

      const [candidatesData, programmesData, participantsData, teamsData] = await Promise.all([
        candidatesRes.ok ? candidatesRes.json() : [],
        programmesRes.ok ? programmesRes.json() : [],
        participantsRes.ok ? participantsRes.json() : [],
        teamsRes.ok ? teamsRes.json() : []
      ]);

      console.log('✅ Programmes data received:', {
        candidates: candidatesData?.length || 0,
        programmes: programmesData?.length || 0,
        participants: participantsData?.length || 0,
        teams: teamsData?.length || 0
      });

      // Debug: Log sample data for analysis
      console.log('🔍 Sample participants data:', participantsData?.slice(0, 2));
      console.log('🔍 Sample programmes data:', programmesData?.slice(0, 2).map((p: Programme) => ({
        id: p._id?.toString(),
        name: p.name,
        code: p.code
      })));

      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setProgrammes(Array.isArray(programmesData) ? programmesData : []);
      setParticipants(Array.isArray(participantsData) ? participantsData : []);
      setTeamData(teamsData.find((t: Team) => t.code === teamCode) || null);
    } catch (error) {
      console.error('💥 Error fetching programmes data:', error);
      setCandidates([]);
      setProgrammes([]);
      setParticipants([]);
      setTeamData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/programme-participants?team=${teamCode}`);
      const data = await response.json();
      setParticipants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants([]);
    }
  };

  // Get team's available sections from candidates
  const teamSections = [...new Set(candidates.map(c => c.section))];
  
  // Filter programmes that the team can participate in
  const availableProgrammes = programmes.filter(p => {
    // General programmes are available to all teams
    if (p.section === 'general') return true;
    // Section-specific programmes are only available if team has candidates in that section
    return teamSections.includes(p.section);
  });
  
  // Calculate correct statistics
  const registeredProgrammeIds = [...new Set(participants.map(p => p.programmeId))]; // Unique programme IDs
  const availableProgrammesCount = availableProgrammes.length;
  const registeredCount = registeredProgrammeIds.length; // Count unique registered programmes
  const unregisteredCount = Math.max(0, availableProgrammesCount - registeredCount); // Ensure non-negative

  const groupedProgrammes = {
    sports: availableProgrammes.filter(p => p.category === 'sports' && p.section !== 'general'),
    sportsGeneral: availableProgrammes.filter(p => p.category === 'sports' && p.section === 'general'),
    artsStage: availableProgrammes.filter(p => p.category === 'arts' && (p.subcategory === 'stage' || !p.subcategory) && p.section !== 'general'),
    artsStageGeneral: availableProgrammes.filter(p => p.category === 'arts' && (p.subcategory === 'stage' || !p.subcategory) && p.section === 'general'),
    artsNonStage: availableProgrammes.filter(p => p.category === 'arts' && p.subcategory === 'non-stage' && p.section !== 'general'),
    artsNonStageGeneral: availableProgrammes.filter(p => p.category === 'arts' && p.subcategory === 'non-stage' && p.section === 'general'),
    general: availableProgrammes.filter(p => p.section === 'general')
  };

  // Security checks
  if (accessLoading) {
    return <TeamAccessLoadingScreen />;
  }

  if (accessDenied) {
    return <AccessDeniedScreen />;
  }

  if (!teamCode) {
    return <TeamAccessLoadingScreen />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading programmes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <TeamBreadcrumb pageName="Programme Registration" teamData={teamData || undefined} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programme Registration</h1>
          <p className="text-gray-600">Register your team for competitions and events</p>
        </div>
        <div className="text-right px-4 py-2 rounded-lg border shadow-sm text-white"
             style={{ backgroundColor: teamData?.color || '#3B82F6' }}>
          <div className="text-2xl font-bold">{registeredCount}</div>
          <div className="text-sm opacity-90">Registered Programmes</div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{availableProgrammesCount}</div>
            <div className="text-sm text-gray-600">Available Programmes</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{registeredCount}</div>
            <div className="text-sm text-gray-600">Registered</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{unregisteredCount}</div>
            <div className="text-sm text-gray-600">Not Registered</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{candidates.length}</div>
            <div className="text-sm text-gray-600">Team Members</div>
          </div>
        </div>
      </div>

      {/* Programme Categories */}
      <div className="space-y-6">
        {/* Sports Programmes */}
        {groupedProgrammes.sports.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-green-50">
              <h2 className="text-lg font-semibold text-green-800">Sports Programmes</h2>
              <p className="text-sm text-green-600">Regular sports competitions by section</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.sports.map((programme) => (
                  <ProgrammeCard 
                    key={programme._id?.toString()} 
                    programme={programme} 
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sports General Programmes */}
        {groupedProgrammes.sportsGeneral.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-green-100">
              <h2 className="text-lg font-semibold text-green-900">Sports General Programmes</h2>
              <p className="text-sm text-green-700">General sports events open to all sections</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.sportsGeneral.map((programme) => (
                  <ProgrammeCard 
                    key={programme._id?.toString()} 
                    programme={programme} 
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arts Stage Programmes */}
        {groupedProgrammes.artsStage.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-purple-50">
              <h2 className="text-lg font-semibold text-purple-800">Arts Stage Programmes</h2>
              <p className="text-sm text-purple-600">Stage performances by section</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.artsStage.map((programme) => (
                  <ProgrammeCard 
                    key={programme._id?.toString()} 
                    programme={programme} 
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arts Stage General Programmes */}
        {groupedProgrammes.artsStageGeneral.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-purple-100">
              <h2 className="text-lg font-semibold text-purple-900">Arts Stage General Programmes</h2>
              <p className="text-sm text-purple-700">General stage events open to all sections</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.artsStageGeneral.map((programme) => (
                  <ProgrammeCard 
                    key={programme._id?.toString()} 
                    programme={programme} 
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arts Non-Stage Programmes */}
        {groupedProgrammes.artsNonStage.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-blue-50">
              <h2 className="text-lg font-semibold text-blue-800">Arts Non-Stage Programmes</h2>
              <p className="text-sm text-blue-600">Non-stage arts competitions by section</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.artsNonStage.map((programme) => (
                  <ProgrammeCard 
                    key={programme._id?.toString()} 
                    programme={programme} 
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arts Non-Stage General Programmes */}
        {groupedProgrammes.artsNonStageGeneral.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-blue-100">
              <h2 className="text-lg font-semibold text-blue-900">Arts Non-Stage General Programmes</h2>
              <p className="text-sm text-blue-700">General non-stage events open to all sections</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.artsNonStageGeneral.map((programme) => (
                  <ProgrammeCard 
                    key={programme._id?.toString()} 
                    programme={programme} 
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Programmes Message */}
        {Object.values(groupedProgrammes).every(group => group.length === 0) && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Programmes Available</h3>
            <p className="text-gray-500">Programmes will appear here once they are added by the admin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Programme Card Component
function ProgrammeCard({ 
  programme, 
  teamCode, 
  candidates, 
  participants, 
  onUpdate 
}: {
  programme: Programme;
  teamCode: string;
  candidates: Candidate[];
  participants: ProgrammeParticipant[];
  onUpdate: () => void;
}) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Debug: Log the matching attempt
  console.log('🔍 Matching participant for programme:', {
    programmeName: programme.name,
    programmeId: programme._id?.toString(),
    participantsCount: participants.length,
    sampleParticipant: participants[0] ? {
      programmeId: participants[0].programmeId,
      programmeCode: participants[0].programmeCode,
      programmeName: participants[0].programmeName
    } : 'No participants'
  });

  const existingParticipant = participants.find((p: ProgrammeParticipant) => {
    const match = p.programmeId === programme._id?.toString();
    if (match) {
      console.log('✅ Found matching participant:', {
        programmeId: p.programmeId,
        participants: p.participants
      });
    }
    return match;
  });
  const isRegistered = !!existingParticipant;
  
  // Debug: Log registration status
  console.log(`📋 Programme ${programme.name} (${programme._id?.toString()}): ${isRegistered ? 'REGISTERED' : 'NOT REGISTERED'}`);
  
  // Filter candidates based on programme section
  const sectionCandidates = candidates.filter(candidate => {
    // For general programmes, all team candidates are eligible
    if (programme.section === 'general') return true;
    // For section-specific programmes, only candidates from that section
    return candidate.section === programme.section;
  });

  const openModal = () => {
    setSelectedParticipants([]);
    setSearchTerm('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedParticipants([]);
    setSearchTerm('');
  };

  const openEditModal = () => {
    // Pre-populate with existing participants
    if (existingParticipant) {
      setSelectedParticipants(existingParticipant.participants);
    }
    setSearchTerm('');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedParticipants([]);
    setSearchTerm('');
  };

  // Filter candidates based on search term
  const filteredCandidates = sectionCandidates.filter(candidate =>
    candidate.chestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate participation requirements
  const minRequired = Number(programme.requiredParticipants) || 1;
  const maxAllowed = Number(programme.maxParticipants) || minRequired;
  const currentCount = selectedParticipants.length;
  
  // Check if minimum requirement is met
  const hasMinimumParticipants = currentCount >= minRequired;
  // Check if we can add more participants
  const canAddMore = currentCount < maxAllowed;
  // Check if registration is valid (meets minimum requirement)
  const canRegister = hasMinimumParticipants;

  const handleParticipantToggle = (chestNumber: string) => {
    setSelectedParticipants(prev => {
      const isCurrentlySelected = prev.includes(chestNumber);
      
      if (isCurrentlySelected) {
        // Remove from selection
        return prev.filter(p => p !== chestNumber);
      } else {
        // Check if we can add more (up to maximum allowed)
        if (prev.length < maxAllowed) {
          return [...prev, chestNumber];
        } else {
          alert(`Maximum ${maxAllowed} participants allowed. Please deselect someone first.`);
          return prev;
        }
      }
    });
  };

  const handleRegister = async () => {
    if (!canRegister) {
      alert(`Please select at least ${minRequired} participant(s). You can select up to ${maxAllowed} participants.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/programme-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programmeId: programme._id,
          programmeCode: programme.code,
          programmeName: programme.name,
          teamCode,
          participants: selectedParticipants,
          status: 'registered'
        })
      });

      if (response.ok) {
        closeModal();
        onUpdate();
        alert('Successfully registered for programme!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to register'}`);
      }
    } catch (error) {
      console.error('Error registering participants:', error);
      alert('Error registering for programme');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!canRegister) {
      alert(`Please select at least ${minRequired} participant(s). You can select up to ${maxAllowed} participants.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/programme-participants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programmeId: programme._id,
          teamCode,
          participants: selectedParticipants
        })
      });

      if (response.ok) {
        closeEditModal();
        onUpdate();
        alert('Successfully updated participants!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update'}`);
      }
    } catch (error) {
      console.error('Error updating participants:', error);
      alert('Error updating participants');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`border-2 rounded-xl p-5 transition-all duration-200 ${
        isRegistered 
          ? 'border-green-300 bg-green-50 shadow-md' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg bg-white'
      }`}>
        <div className="flex justify-between items-start mb-3">
          <Link 
            href={`/admin/programmes/${programme._id}`}
            className="font-bold text-base text-blue-600 hover:text-blue-800 hover:underline leading-tight transition-colors"
          >
            {programme.name}
          </Link>
          <span className="text-xs bg-gray-800 text-white px-3 py-1 rounded-full font-mono font-bold">
            {programme.code}
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            <span className="capitalize font-medium">{programme.section} Section</span>
            {programme.section !== 'general' && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {sectionCandidates.length} eligible
              </span>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            <span className="capitalize font-medium">{programme.positionType} Competition</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            <span className="font-medium">
              {maxAllowed > minRequired 
                ? `${minRequired}-${maxAllowed} Participants (${minRequired} required, ${maxAllowed - minRequired} optional)`
                : `${minRequired} Participant${minRequired > 1 ? 's' : ''} Required`
              }
            </span>
          </div>
        </div>
        
        {isRegistered ? (
          <div className="space-y-3">
            <div className="flex items-center text-green-700 font-semibold text-sm">
              <span className="text-lg mr-2">✅</span>
              Registered Successfully
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <div className="text-xs font-semibold text-gray-700 mb-2">Team Participants:</div>
              <div className="flex flex-wrap gap-1">
                {existingParticipant.participants.map((participant, index) => (
                  <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-mono">
                    {participant}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={openEditModal}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              Edit Participants
            </button>
          </div>
        ) : (
          <button
            onClick={openModal}
            disabled={sectionCandidates.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {sectionCandidates.length === 0 ? '❌ No Eligible Candidates' : '➕ Register for Programme'}
          </button>
        )}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1">{programme.name}</h3>
                  <div className="flex items-center space-x-4 text-blue-100 text-sm">
                    <span>📋 {programme.code}</span>
                    <span>👥 {programme.section}</span>
                    <span>🎯 {programme.positionType}</span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🎯</span>
                  <div>
                    <h4 className="font-semibold text-blue-900">Registration Requirements</h4>
                    <p className="text-blue-700 text-sm">
                      {maxAllowed > minRequired ? (
                        <>
                          Select <strong>{minRequired} to {maxAllowed}</strong> participants from your team
                          <br />
                          <span className="text-xs">
                            • <strong>{minRequired}</strong> participants required (minimum)
                            • Up to <strong>{maxAllowed - minRequired}</strong> additional participants optional
                          </span>
                        </>
                      ) : (
                        <>
                          Select exactly <strong>{minRequired}</strong> participant{minRequired > 1 ? 's' : ''} from your team
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {sectionCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😔</div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">No Eligible Candidates</h4>
                  <p className="text-gray-500">
                    {programme.section === 'general' 
                      ? 'No team candidates available for this programme.'
                      : `No ${programme.section} section candidates available. This programme requires ${programme.section} section participants.`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">👥</span>
                      Select Team Participants
                    </h4>
                    
                    {/* Search Box */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Search by chest number or name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-lg">🔍</span>
                        </div>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            <span className="text-lg">✕</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                      {filteredCandidates.length === 0 ? (
                        <div className="col-span-2 text-center py-8">
                          <div className="text-4xl mb-2">🔍</div>
                          <p className="text-gray-500">No candidates found matching "{searchTerm}"</p>
                        </div>
                      ) : (
                        filteredCandidates.map((candidate) => {
                          const isSelected = selectedParticipants.includes(candidate.chestNumber);
                          const isDisabled = !isSelected && selectedParticipants.length >= maxAllowed;
                          
                          return (
                            <div
                              key={candidate._id?.toString()}
                              className={`border-2 rounded-lg p-4 transition-all ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 shadow-md cursor-pointer'
                                  : isDisabled
                                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                              }`}
                              onClick={() => {
                                if (isSelected || !isDisabled) {
                                  handleParticipantToggle(candidate.chestNumber);
                                }
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                }`}>
                                  {isSelected && <span className="text-white text-sm font-bold">✓</span>}
                                </div>
                                <div className="flex-1">
                                  <div className="font-bold text-gray-900 font-mono text-base">
                                    {candidate.chestNumber}
                                  </div>
                                  <div className="text-gray-700 font-medium">{candidate.name}</div>
                                  <div className="text-xs text-gray-500 capitalize">
                                    {candidate.section} Section • {candidate.points} points
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="text-blue-500 font-bold text-sm">
                                    SELECTED
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Selection Summary */}
                  <div className={`border-2 rounded-lg p-4 mb-4 ${
                    canRegister && selectedParticipants.length <= maxAllowed
                      ? 'bg-green-50 border-green-300' 
                      : selectedParticipants.length > 0 
                      ? 'bg-yellow-50 border-yellow-300' 
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className={`font-semibold flex items-center ${
                        canRegister && selectedParticipants.length <= maxAllowed
                          ? 'text-green-800' 
                          : selectedParticipants.length > 0 
                          ? 'text-yellow-800' 
                          : 'text-gray-800'
                      }`}>
                        <span className="text-lg mr-2">
                          {canRegister ? '✅' : 
                           selectedParticipants.length > 0 ? '⏳' : '⭕'}
                        </span>
                        Selected Participants
                      </h5>
                      <div className={`px-3 py-1 rounded-full font-bold text-lg ${
                        canRegister && selectedParticipants.length <= maxAllowed
                          ? 'bg-green-200 text-green-800' 
                          : selectedParticipants.length > 0 
                          ? 'bg-yellow-200 text-yellow-800' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {selectedParticipants.length} / {maxAllowed}
                        {maxAllowed > minRequired && (
                          <span className="text-xs ml-1">(min: {minRequired})</span>
                        )}
                      </div>
                    </div>
                    
                    {selectedParticipants.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {selectedParticipants.map((chestNumber) => {
                            const candidate = candidates.find(c => c.chestNumber === chestNumber);
                            return (
                              <span 
                                key={chestNumber} 
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                              >
                                <span className="mr-1">👤</span>
                                {chestNumber} - {candidate?.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleParticipantToggle(chestNumber);
                                  }}
                                  className="ml-2 text-red-600 hover:text-red-800 font-bold"
                                  title="Remove this participant"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                        {!canRegister && (
                          <p className="text-yellow-700 text-sm font-medium">
                            ⚠️ Need {minRequired - selectedParticipants.length} more participant{minRequired - selectedParticipants.length > 1 ? 's' : ''} to register (minimum: {minRequired})
                          </p>
                        )}
                        {canRegister && selectedParticipants.length === minRequired && maxAllowed > minRequired && (
                          <p className="text-green-700 text-sm font-medium">
                            ✅ Minimum met! You can add {maxAllowed - selectedParticipants.length} more optional participant{maxAllowed - selectedParticipants.length > 1 ? 's' : ''}.
                          </p>
                        )}
                        {canRegister && selectedParticipants.length > minRequired && (
                          <p className="text-green-700 text-sm font-medium">
                            🎉 Perfect! {selectedParticipants.length - minRequired} optional participant{selectedParticipants.length - minRequired > 1 ? 's' : ''} added. You can register your team.
                          </p>
                        )}
                        {canRegister && selectedParticipants.length === minRequired && maxAllowed === minRequired && (
                          <p className="text-green-700 text-sm font-medium">
                            🎉 Perfect! You can now register your team.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm">
                        👆 Click on candidate cards above to select {programme.requiredParticipants} participant{programme.requiredParticipants > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t-2 border-gray-200 px-6 py-6">
              <div className="flex space-x-4">
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  ❌ Cancel
                </button>
                
                <button
                  onClick={handleRegister}
                  disabled={!canRegister || isSubmitting}
                  className={`flex-1 px-6 py-3 font-bold text-lg rounded-lg transition-all duration-200 border-2 ${
                    canRegister && !isSubmitting
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 border-green-600 hover:border-green-700'
                      : 'bg-gray-400 text-white cursor-not-allowed opacity-75 border-gray-400'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Registering...
                    </span>
                  ) : canRegister ? (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">🎉</span>
                      REGISTER TEAM
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">⚠️</span>
                      {selectedParticipants.length === 0 
                        ? `SELECT ${maxAllowed > minRequired ? `${minRequired}-${maxAllowed}` : minRequired} PARTICIPANTS`
                        : `NEED ${minRequired - selectedParticipants.length} MORE (MIN ${minRequired})`
                      }
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1">Edit Participants - {programme.name}</h3>
                  <div className="flex items-center space-x-4 text-orange-100 text-sm">
                    <span>📋 {programme.code}</span>
                    <span>👥 {programme.section}</span>
                    <span>🎯 {programme.positionType}</span>
                  </div>
                </div>
                <button
                  onClick={closeEditModal}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✏️</span>
                  <div>
                    <h4 className="font-semibold text-orange-900">Edit Registration</h4>
                    <p className="text-orange-700 text-sm">
                      {maxAllowed > minRequired ? (
                        <>
                          Update your team's participants for this programme. Select <strong>{minRequired} to {maxAllowed}</strong> participants
                          <br />
                          <span className="text-xs">
                            • <strong>{minRequired}</strong> participants required (minimum)
                            • Up to <strong>{maxAllowed - minRequired}</strong> additional participants optional
                          </span>
                        </>
                      ) : (
                        <>
                          Update your team's participants for this programme. Select exactly <strong>{minRequired}</strong> participant{minRequired > 1 ? 's' : ''}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Participants */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Current Participants:</h4>
                <div className="flex flex-wrap gap-2">
                  {existingParticipant?.participants.map((participant, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {participant}
                    </span>
                  ))}
                </div>
              </div>

              {sectionCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😔</div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">No Eligible Candidates</h4>
                  <p className="text-gray-500">
                    {programme.section === 'general' 
                      ? 'No team candidates available for this programme.'
                      : `No ${programme.section} section candidates available. This programme requires ${programme.section} section participants.`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">👥</span>
                      Select New Team Participants
                    </h4>
                    
                    {/* Search Box */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Search by chest number or name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-lg">🔍</span>
                        </div>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            <span className="text-lg">✕</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                      {filteredCandidates.length === 0 ? (
                        <div className="col-span-2 text-center py-8">
                          <div className="text-4xl mb-2">🔍</div>
                          <p className="text-gray-500">No candidates found matching "{searchTerm}"</p>
                        </div>
                      ) : (
                        filteredCandidates.map((candidate) => {
                          const isSelected = selectedParticipants.includes(candidate.chestNumber);
                          const isDisabled = !isSelected && selectedParticipants.length >= maxAllowed;
                          
                          return (
                            <div
                              key={candidate._id?.toString()}
                              className={`border-2 rounded-lg p-4 transition-all ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-50 shadow-md cursor-pointer'
                                  : isDisabled
                                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 cursor-pointer'
                              }`}
                              onClick={() => {
                                if (isSelected || !isDisabled) {
                                  handleParticipantToggle(candidate.chestNumber);
                                }
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                                }`}>
                                  {isSelected && <span className="text-white text-sm font-bold">✓</span>}
                                </div>
                                <div className="flex-1">
                                  <div className="font-bold text-gray-900 font-mono text-base">
                                    {candidate.chestNumber}
                                  </div>
                                  <div className="text-gray-700 font-medium">{candidate.name}</div>
                                  <div className="text-xs text-gray-500 capitalize">
                                    {candidate.section} Section • {candidate.points} points
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="text-orange-500 font-bold text-sm">
                                    SELECTED
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Selection Summary */}
                  <div className={`border-2 rounded-lg p-4 mb-4 ${
                    canRegister && selectedParticipants.length <= maxAllowed
                      ? 'bg-green-50 border-green-300' 
                      : selectedParticipants.length > 0 
                      ? 'bg-yellow-50 border-yellow-300' 
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className={`font-semibold flex items-center ${
                        canRegister && selectedParticipants.length <= maxAllowed
                          ? 'text-green-800' 
                          : selectedParticipants.length > 0 
                          ? 'text-yellow-800' 
                          : 'text-gray-800'
                      }`}>
                        <span className="text-lg mr-2">
                          {canRegister ? '✅' : 
                           selectedParticipants.length > 0 ? '⏳' : '⭕'}
                        </span>
                        New Selection
                      </h5>
                      <div className={`px-3 py-1 rounded-full font-bold text-lg ${
                        canRegister && selectedParticipants.length <= maxAllowed
                          ? 'bg-green-200 text-green-800' 
                          : selectedParticipants.length > 0 
                          ? 'bg-yellow-200 text-yellow-800' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {selectedParticipants.length} / {maxAllowed}
                        {maxAllowed > minRequired && (
                          <span className="text-xs ml-1">(min: {minRequired})</span>
                        )}
                      </div>
                    </div>
                    
                    {selectedParticipants.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {selectedParticipants.map((chestNumber) => {
                            const candidate = candidates.find(c => c.chestNumber === chestNumber);
                            return (
                              <span 
                                key={chestNumber} 
                                className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                              >
                                <span className="mr-1">👤</span>
                                {chestNumber} - {candidate?.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleParticipantToggle(chestNumber);
                                  }}
                                  className="ml-2 text-red-600 hover:text-red-800 font-bold"
                                  title="Remove this participant"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                        {!canRegister && (
                          <p className="text-yellow-700 text-sm font-medium">
                            ⚠️ Need {minRequired - selectedParticipants.length} more participant{minRequired - selectedParticipants.length > 1 ? 's' : ''} to update (minimum: {minRequired})
                          </p>
                        )}
                        {canRegister && selectedParticipants.length === minRequired && maxAllowed > minRequired && (
                          <p className="text-green-700 text-sm font-medium">
                            ✅ Minimum met! You can add {maxAllowed - selectedParticipants.length} more optional participant{maxAllowed - selectedParticipants.length > 1 ? 's' : ''}.
                          </p>
                        )}
                        {canRegister && selectedParticipants.length > minRequired && (
                          <p className="text-green-700 text-sm font-medium">
                            🎉 Perfect! {selectedParticipants.length - minRequired} optional participant{selectedParticipants.length - minRequired > 1 ? 's' : ''} added. You can update your registration.
                          </p>
                        )}
                        {canRegister && selectedParticipants.length === minRequired && maxAllowed === minRequired && (
                          <p className="text-green-700 text-sm font-medium">
                            🎉 Perfect! You can now update your team registration.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm">
                        👆 Click on candidate cards above to select {programme.requiredParticipants} participant{programme.requiredParticipants > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t-2 border-gray-200 px-6 py-6">
              <div className="flex space-x-4">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  ❌ Cancel
                </button>
                
                <button
                  onClick={handleUpdate}
                  disabled={!canRegister || isSubmitting}
                  className={`flex-1 px-6 py-3 font-bold text-lg rounded-lg transition-all duration-200 border-2 ${
                    canRegister && !isSubmitting
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 border-orange-600 hover:border-orange-700'
                      : 'bg-gray-400 text-white cursor-not-allowed opacity-75 border-gray-400'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Updating...
                    </span>
                  ) : canRegister ? (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">✏️</span>
                      UPDATE PARTICIPANTS
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">⚠️</span>
                      {selectedParticipants.length === 0 
                        ? `SELECT ${maxAllowed > minRequired ? `${minRequired}-${maxAllowed}` : minRequired} PARTICIPANTS`
                        : `NEED ${minRequired - selectedParticipants.length} MORE (MIN ${minRequired})`
                      }
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function TeamProgrammesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <TeamProgrammesContent />
    </Suspense>
  );
}