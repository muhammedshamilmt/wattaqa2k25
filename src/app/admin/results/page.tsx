'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Result, Programme, Candidate, ProgrammeParticipant, ResultStatus } from '@/types';

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  // Removed loading state for faster page load
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);

  // Enhanced form state
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [filteredParticipants, setFilteredParticipants] = useState<any[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<any[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [programmeSearch, setProgrammeSearch] = useState<string>('');

  const [formData, setFormData] = useState({
    programme: '',
    section: '' as 'senior' | 'junior' | 'sub-junior' | 'general' | '',
    positionType: '' as 'individual' | 'group' | 'general' | '',
    // For individual/group programmes with grades
    firstPlace: [] as { chestNumber: string; grade?: 'A' | 'B' | 'C' }[],
    secondPlace: [] as { chestNumber: string; grade?: 'A' | 'B' | 'C' }[],
    thirdPlace: [] as { chestNumber: string; grade?: 'A' | 'B' | 'C' }[],
    // For general programmes (team-based) with grades
    firstPlaceTeams: [] as { teamCode: string; grade?: 'A' | 'B' | 'C' }[],
    secondPlaceTeams: [] as { teamCode: string; grade?: 'A' | 'B' | 'C' }[],
    thirdPlaceTeams: [] as { teamCode: string; grade?: 'A' | 'B' | 'C' }[],
    // Participation grades for all participants/teams
    participationGrades: [] as { chestNumber: string; grade: 'A' | 'B' | 'C'; points: number }[],
    participationTeamGrades: [] as { teamCode: string; grade: 'A' | 'B' | 'C'; points: number }[],
    firstPoints: 10,
    secondPoints: 7,
    thirdPoints: 5,
    notes: ''
  });

  // Fetch data from APIs
  const fetchData = async () => {
    try {
      // Removed loading state for faster UI
      const [resultsRes, programmesRes, candidatesRes, participantsRes, teamsRes] = await Promise.all([
        fetch('/api/results'),
        fetch('/api/programmes'),
        fetch('/api/candidates'),
        fetch('/api/programme-participants'),
        fetch('/api/teams')
      ]);

      // Check if all responses are OK before parsing JSON
      const responses = [resultsRes, programmesRes, candidatesRes, participantsRes, teamsRes];
      const responseNames = ['results', 'programmes', 'candidates', 'programme-participants', 'teams'];

      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) {
          throw new Error(`Failed to fetch ${responseNames[i]}: ${responses[i].status} ${responses[i].statusText}`);
        }
      }

      const [resultsData, programmesData, candidatesData, participantsData, teamsData] = await Promise.all([
        resultsRes.json(),
        programmesRes.json(),
        candidatesRes.json(),
        participantsRes.json(),
        teamsRes.json()
      ]);

      setResults(resultsData || []);
      setProgrammes(programmesData || []);
      setCandidates(candidatesData || []);
      setParticipants(participantsData || []);
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays as fallback
      setResults([]);
      setProgrammes([]);
      setCandidates([]);
      setParticipants([]);
      setTeams([]);
    } finally {
      // No loading state to manage
    }
  };

  useEffect(() => {
    // Optimized data loading - start immediately without blocking UI
    fetchData();
  }, []);

  // Static points calculation based on programme type and section
  const getStaticPoints = (programme: Programme | null) => {
    if (!programme) return { first: 3, second: 2, third: 1 };

    const section = programme.section;
    const positionType = programme.positionType;

    if (section === 'general') {
      if (positionType === 'individual') {
        return { first: 10, second: 6, third: 3 };
      } else if (positionType === 'group') {
        return { first: 15, second: 10, third: 5 };
      }
    }

    // Senior, Junior, Sub-Junior sections
    if (section === 'senior' || section === 'junior' || section === 'sub-junior') {
      if (positionType === 'individual') {
        return { first: 3, second: 2, third: 1 };
      } else if (positionType === 'group') {
        return { first: 5, second: 3, third: 1 };
      }
    }

    // Default fallback
    return { first: 3, second: 2, third: 1 };
  };



  // Filter programmes based on search
  const getFilteredProgrammes = () => {
    if (!programmeSearch.trim()) return programmes;

    return programmes.filter(programme =>
      programme.name.toLowerCase().includes(programmeSearch.toLowerCase()) ||
      programme.code.toLowerCase().includes(programmeSearch.toLowerCase()) ||
      programme.category.toLowerCase().includes(programmeSearch.toLowerCase())
    );
  };

  // Handle programme selection
  const handleProgrammeSelection = (programmeId: string) => {
    const programme = programmes.find(p => p._id?.toString() === programmeId);
    setSelectedProgramme(programme || null);
    setSelectedSection(''); // Clear section when programme changes
    setFilteredParticipants([]);
    setFilteredTeams([]);
    setShowParticipants(false);

    if (programme) {
      const staticPoints = getStaticPoints(programme);
      setFormData(prev => ({
        ...prev,
        programme: `${programme.code} - ${programme.name}`,
        section: '', // Clear section in form data too
        positionType: programme.positionType || 'individual',
        // Clear position selections when programme changes
        firstPlace: [],
        secondPlace: [],
        thirdPlace: [],
        firstPlaceTeams: [],
        secondPlaceTeams: [],
        thirdPlaceTeams: [],
        participationGrades: [],
        participationTeamGrades: [],
        // Set static points based on programme type
        firstPoints: staticPoints.first,
        secondPoints: staticPoints.second,
        thirdPoints: staticPoints.third
      }));
    }
  };

  // Get available sections based on programme position type
  const getAvailableSections = () => {
    if (!selectedProgramme) return [];

    if (selectedProgramme.positionType === 'general') {
      // For general position type programmes, only show general section
      return [{ value: 'general', label: 'General' }];
    } else {
      // For individual/group position type programmes, show all sections except general
      return [
        { value: 'senior', label: 'Senior' },
        { value: 'junior', label: 'Junior' },
        { value: 'sub-junior', label: 'Sub Junior' }
      ];
    }
  };

  // Handle section selection
  const handleSectionSelection = (section: string) => {
    setSelectedSection(section);
    setFormData(prev => ({ ...prev, section: section as any }));

    if (selectedProgramme && section) {
      if (selectedProgramme.positionType === 'general') {
        // For general programmes, show teams that registered
        const programmeParticipants = participants.filter(p =>
          p.programmeId === selectedProgramme._id?.toString()
        );

        const registeredTeams = programmeParticipants.map(pp => {
          const team = teams.find(t => t.code === pp.teamCode);
          return {
            teamCode: pp.teamCode,
            team,
            programmeName: pp.programmeName,
            programmeCode: pp.programmeCode,
            participantCount: pp.participants.length
          };
        });

        setFilteredTeams(registeredTeams);
        setFilteredParticipants([]);
      } else {
        // For individual/group programmes, show participants
        const programmeParticipants = participants.filter(p =>
          p.programmeId === selectedProgramme._id?.toString()
        );

        const detailedParticipants = programmeParticipants.flatMap(pp =>
          pp.participants.map(chestNumber => {
            const candidate = candidates.find(c => c.chestNumber === chestNumber);
            return {
              chestNumber,
              candidate,
              teamCode: pp.teamCode,
              programmeName: pp.programmeName,
              programmeCode: pp.programmeCode
            };
          })
        ).filter(p => p.candidate && (section === 'general' || p.candidate.section === section));

        setFilteredParticipants(detailedParticipants);
        setFilteredTeams([]);
      }

      setShowParticipants(true);
    }
  };

  // Check if participant is assigned (position or grade)
  const isParticipantAssigned = (chestNumber: string) => {
    const hasPosition = [
      ...formData.firstPlace.map(p => p.chestNumber),
      ...formData.secondPlace.map(p => p.chestNumber),
      ...formData.thirdPlace.map(p => p.chestNumber)
    ].includes(chestNumber);

    const hasGrade = formData.participationGrades.some(pg => pg.chestNumber === chestNumber);

    return hasPosition || hasGrade;
  };

  // Check if team is assigned (position or grade)
  const isTeamAssigned = (teamCode: string) => {
    const hasPosition = [
      ...formData.firstPlaceTeams.map(p => p.teamCode),
      ...formData.secondPlaceTeams.map(p => p.teamCode),
      ...formData.thirdPlaceTeams.map(p => p.teamCode)
    ].includes(teamCode);

    const hasGrade = formData.participationTeamGrades.some(pg => pg.teamCode === teamCode);

    return hasPosition || hasGrade;
  };

  // Add/remove from position
  const togglePosition = (position: 'firstPlace' | 'secondPlace' | 'thirdPlace', chestNumber: string) => {
    setFormData(prev => {
      const currentPosition = prev[position];
      const existingIndex = currentPosition.findIndex(p => p.chestNumber === chestNumber);

      if (existingIndex >= 0) {
        // Remove from position
        return {
          ...prev,
          [position]: currentPosition.filter(p => p.chestNumber !== chestNumber)
        };
      } else {
        // Add to position
        return {
          ...prev,
          [position]: [...currentPosition, { chestNumber }]
        };
      }
    });
  };

  // Add/remove team from position
  const toggleTeamPosition = (position: 'firstPlaceTeams' | 'secondPlaceTeams' | 'thirdPlaceTeams', teamCode: string) => {
    setFormData(prev => {
      const currentPosition = prev[position];
      const existingIndex = currentPosition.findIndex(p => p.teamCode === teamCode);

      if (existingIndex >= 0) {
        // Remove from position
        return {
          ...prev,
          [position]: currentPosition.filter(p => p.teamCode !== teamCode)
        };
      } else {
        // Add to position
        return {
          ...prev,
          [position]: [...currentPosition, { teamCode }]
        };
      }
    });
  };

  // Grade points mapping
  const getGradePoints = (grade: string) => {
    const gradePoints: { [key: string]: number } = {
      'A': 5,
      'B': 3,
      'C': 1
    };
    return gradePoints[grade] || 0;
  };

  // Update grade for individual participant
  const updateParticipantGrade = (position: 'firstPlace' | 'secondPlace' | 'thirdPlace', chestNumber: string, grade: string) => {
    setFormData(prev => {
      const currentPosition = [...prev[position]];
      const existingIndex = currentPosition.findIndex(p => p.chestNumber === chestNumber);

      if (existingIndex >= 0) {
        currentPosition[existingIndex] = {
          ...currentPosition[existingIndex],
          grade: grade as any
        };
      }

      return { ...prev, [position]: currentPosition };
    });
  };

  // Update grade for team
  const updateTeamGrade = (position: 'firstPlaceTeams' | 'secondPlaceTeams' | 'thirdPlaceTeams', teamCode: string, grade: string) => {
    setFormData(prev => {
      const currentPosition = [...prev[position]];
      const existingIndex = currentPosition.findIndex(p => p.teamCode === teamCode);

      if (existingIndex >= 0) {
        currentPosition[existingIndex] = {
          ...currentPosition[existingIndex],
          grade: grade as any
        };
      }

      return { ...prev, [position]: currentPosition };
    });
  };

  // Get grade for participant
  const getParticipantGrade = (position: 'firstPlace' | 'secondPlace' | 'thirdPlace', chestNumber: string) => {
    const participant = formData[position].find(p => p.chestNumber === chestNumber);
    return participant?.grade || '';
  };

  // Get grade for team
  const getTeamGrade = (position: 'firstPlaceTeams' | 'secondPlaceTeams' | 'thirdPlaceTeams', teamCode: string) => {
    const team = formData[position].find(p => p.teamCode === teamCode);
    return team?.grade || '';
  };

  // Calculate total marks (position points + grade points)
  const calculateTotalMarks = (positionPoints: number, grade: string) => {
    return positionPoints + getGradePoints(grade);
  };

  // Update participation grade for individual participant
  const updateParticipationGrade = (chestNumber: string, grade: string) => {
    setFormData(prev => {
      const currentGrades = [...prev.participationGrades];
      const existingIndex = currentGrades.findIndex(pg => pg.chestNumber === chestNumber);

      if (grade === '') {
        // Remove grade if empty
        if (existingIndex >= 0) {
          currentGrades.splice(existingIndex, 1);
        }
      } else {
        // Add or update grade
        const gradeEntry = {
          chestNumber,
          grade: grade as 'A' | 'B' | 'C',
          points: getGradePoints(grade)
        };

        if (existingIndex >= 0) {
          currentGrades[existingIndex] = gradeEntry;
        } else {
          currentGrades.push(gradeEntry);
        }
      }

      return { ...prev, participationGrades: currentGrades };
    });
  };

  // Update participation grade for team
  const updateParticipationTeamGrade = (teamCode: string, grade: string) => {
    setFormData(prev => {
      const currentGrades = [...prev.participationTeamGrades];
      const existingIndex = currentGrades.findIndex(pg => pg.teamCode === teamCode);

      if (grade === '') {
        // Remove grade if empty
        if (existingIndex >= 0) {
          currentGrades.splice(existingIndex, 1);
        }
      } else {
        // Add or update grade
        const gradeEntry = {
          teamCode,
          grade: grade as 'A' | 'B' | 'C',
          points: getGradePoints(grade)
        };

        if (existingIndex >= 0) {
          currentGrades[existingIndex] = gradeEntry;
        } else {
          currentGrades.push(gradeEntry);
        }
      }

      return { ...prev, participationTeamGrades: currentGrades };
    });
  };

  // Get participation grade for participant
  const getParticipationGrade = (chestNumber: string) => {
    const gradeEntry = formData.participationGrades.find(pg => pg.chestNumber === chestNumber);
    return gradeEntry?.grade || '';
  };

  // Get participation grade for team
  const getParticipationTeamGrade = (teamCode: string) => {
    const gradeEntry = formData.participationTeamGrades.find(pg => pg.teamCode === teamCode);
    return gradeEntry?.grade || '';
  };



  // Handle edit result
  const handleEditResult = (result: Result) => {
    // Find the programme for this result
    const programme = programmes.find(p => p._id?.toString() === result.programmeId);

    if (!programme) {
      alert('Programme not found for this result');
      return;
    }

    // Set edit mode
    setIsEditMode(true);
    setEditingResultId(result._id?.toString() || null);

    // Set selected programme and section
    setSelectedProgramme(programme);
    setSelectedSection(result.section);

    // Calculate static points for this programme
    const staticPoints = getStaticPoints(programme);

    // Helper function to convert old grades to new format
    const convertGrade = (oldGrade?: string): 'A' | 'B' | 'C' | undefined => {
      if (!oldGrade) return undefined;
      if (oldGrade.startsWith('A')) return 'A';
      if (oldGrade.startsWith('B')) return 'B';
      if (oldGrade.startsWith('C')) return 'C';
      return 'C'; // Default for D, E, F grades
    };

    // Populate form with existing result data
    setFormData({
      programme: `${programme.code} - ${programme.name}`,
      section: result.section,
      positionType: result.positionType,
      firstPlace: (result.firstPlace || []).map(fp => ({
        chestNumber: fp.chestNumber,
        grade: convertGrade(fp.grade)
      })),
      secondPlace: (result.secondPlace || []).map(sp => ({
        chestNumber: sp.chestNumber,
        grade: convertGrade(sp.grade)
      })),
      thirdPlace: (result.thirdPlace || []).map(tp => ({
        chestNumber: tp.chestNumber,
        grade: convertGrade(tp.grade)
      })),
      firstPlaceTeams: (result.firstPlaceTeams || []).map(fpt => ({
        teamCode: fpt.teamCode,
        grade: convertGrade(fpt.grade)
      })),
      secondPlaceTeams: (result.secondPlaceTeams || []).map(spt => ({
        teamCode: spt.teamCode,
        grade: convertGrade(spt.grade)
      })),
      thirdPlaceTeams: (result.thirdPlaceTeams || []).map(tpt => ({
        teamCode: tpt.teamCode,
        grade: convertGrade(tpt.grade)
      })),
      participationGrades: (result.participationGrades || []).map(pg => ({
        chestNumber: pg.chestNumber,
        grade: convertGrade(pg.grade) as 'A' | 'B' | 'C',
        points: pg.points
      })).filter(pg => pg.grade), // Only include valid grades
      participationTeamGrades: (result.participationTeamGrades || []).map(pg => ({
        teamCode: pg.teamCode,
        grade: convertGrade(pg.grade) as 'A' | 'B' | 'C',
        points: pg.points
      })).filter(pg => pg.grade), // Only include valid grades
      firstPoints: staticPoints.first,
      secondPoints: staticPoints.second,
      thirdPoints: staticPoints.third,
      notes: result.notes || ''
    });

    // Load participants for this programme and section
    handleSectionSelection(result.section);

    // Scroll to form
    document.getElementById('result-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reset form to add mode
  const resetForm = () => {
    setIsEditMode(false);
    setEditingResultId(null);
    setSelectedProgramme(null);
    setSelectedSection('');
    setFilteredParticipants([]);
    setFilteredTeams([]);
    setShowParticipants(false);
    setProgrammeSearch('');

    setFormData({
      programme: '',
      section: '' as 'senior' | 'junior' | 'sub-junior' | 'general' | '',
      positionType: '' as 'individual' | 'group' | 'general' | '',
      firstPlace: [],
      secondPlace: [],
      thirdPlace: [],
      firstPlaceTeams: [],
      secondPlaceTeams: [],
      thirdPlaceTeams: [],
      participationGrades: [],
      participationTeamGrades: [],
      firstPoints: 10,
      secondPoints: 7,
      thirdPoints: 5,
      notes: ''
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.programme || !formData.section || !formData.positionType) {
      alert('Please fill in all required fields');
      return;
    }

    const submitData = {
      ...formData,
      status: isEditMode ? undefined : ResultStatus.PENDING, // Keep existing status for edits, set pending for new
      programmeId: selectedProgramme?._id?.toString()
    };

    try {
      setSubmitting(true);
      const url = isEditMode ? `/api/results?id=${editingResultId}` : '/api/results';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        // Reset form
        resetForm();

        await fetchData();
        alert(isEditMode
          ? 'Result updated successfully!'
          : 'Result added successfully! It has been sent to the checklist for review.'
        );
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding result');
      }
    } catch (error) {
      console.error('Error adding result:', error);
      alert('Error adding result');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate team points from results
  const calculateTeamPoints = () => {
    const teamPoints: { [teamCode: string]: { name: string; color: string; total: number } } = {};

    // Initialize teams
    teams.forEach(team => {
      teamPoints[team.code] = {
        name: team.name,
        color: team.color,
        total: 0
      };
    });

    // Calculate points from results
    results.forEach(result => {
      // Individual/group results
      if (result.firstPlace) {
        result.firstPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamPoints[candidate.team]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            teamPoints[candidate.team].total += result.firstPoints + gradePoints;
          }
        });
      }

      if (result.secondPlace) {
        result.secondPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamPoints[candidate.team]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            teamPoints[candidate.team].total += result.secondPoints + gradePoints;
          }
        });
      }

      if (result.thirdPlace) {
        result.thirdPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamPoints[candidate.team]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            teamPoints[candidate.team].total += result.thirdPoints + gradePoints;
          }
        });
      }

      // Participation grades for individuals (keeping for backward compatibility)
      if (result.participationGrades) {
        result.participationGrades.forEach(pg => {
          const candidate = candidates.find(c => c.chestNumber === pg.chestNumber);
          if (candidate && teamPoints[candidate.team]) {
            teamPoints[candidate.team].total += pg.points;
          }
        });
      }

      // Team results
      if (result.firstPlaceTeams) {
        result.firstPlaceTeams.forEach(winner => {
          if (teamPoints[winner.teamCode]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            teamPoints[winner.teamCode].total += result.firstPoints + gradePoints;
          }
        });
      }

      if (result.secondPlaceTeams) {
        result.secondPlaceTeams.forEach(winner => {
          if (teamPoints[winner.teamCode]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            teamPoints[winner.teamCode].total += result.secondPoints + gradePoints;
          }
        });
      }

      if (result.thirdPlaceTeams) {
        result.thirdPlaceTeams.forEach(winner => {
          if (teamPoints[winner.teamCode]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            teamPoints[winner.teamCode].total += result.thirdPoints + gradePoints;
          }
        });
      }

      // Participation grades for teams (keeping for backward compatibility)
      if (result.participationTeamGrades) {
        result.participationTeamGrades.forEach(pg => {
          if (teamPoints[pg.teamCode]) {
            teamPoints[pg.teamCode].total += pg.points;
          }
        });
      }
    });

    // Sort teams by total points
    return Object.entries(teamPoints)
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.total - a.total);
  };

  // Handle delete
  const handleDelete = async (resultId: string, programmeName: string) => {
    if (!confirm(`Are you sure you want to delete the result for "${programmeName}"?`)) {
      return;
    }

    try {
      setDeleting(resultId);
      const response = await fetch(`/api/results?id=${resultId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
        alert('Result deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting result:', error);
      alert('Error deleting result');
    } finally {
      setDeleting(null);
    }
  };

  // Remove loading spinner - show content immediately

  return (
    <>
      <Breadcrumb pageName="Results" />

      <div className="space-y-6">
        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Result Management</h2>
            <div className="flex space-x-3">
              <a
                href="/admin/results/checklist"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <span className="mr-2">📋</span>
                Review Checklist
              </a>
              <a
                href="/admin/results/publish"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">🚀</span>
                Publish Results
              </a>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Add new results below. They will be sent to the checklist for review before publication.
          </p>
        </div>

        {/* Add New Result */}
        <ShowcaseSection title={isEditMode ? "Edit Result" : "Add New Result"}>
          <form id="result-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Programme Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Search Programmes
              </label>
              <input
                type="text"
                value={programmeSearch}
                onChange={(e) => setProgrammeSearch(e.target.value)}
                placeholder="Search by programme name, code, or category..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
              />
            </div>

            {/* Programme and Section Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programme *
                </label>
                <select
                  value={selectedProgramme?._id?.toString() || ''}
                  onChange={(e) => handleProgrammeSelection(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                  required
                >
                  <option value="">Select programme</option>
                  {getFilteredProgrammes().map((programme) => (
                    <option key={programme._id?.toString()} value={programme._id?.toString()}>
                      {programme.code} - {programme.name} ({programme.category})
                    </option>
                  ))}
                </select>
                {selectedProgramme && (
                  <div className="mt-2 space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <p><strong>Category:</strong> {selectedProgramme.category}</p>
                        <p><strong>Position Type:</strong> {selectedProgramme.positionType}</p>
                        <p><strong>Required Participants:</strong> {selectedProgramme.requiredParticipants}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-800">
                        <p><strong>📊 Static Points:</strong></p>
                        <p>🥇 First: {getStaticPoints(selectedProgramme).first} pts</p>
                        <p>🥈 Second: {getStaticPoints(selectedProgramme).second} pts</p>
                        <p>🥉 Third: {getStaticPoints(selectedProgramme).third} pts</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section *
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => handleSectionSelection(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                  required
                  disabled={!selectedProgramme}
                >
                  <option value="">Select section</option>
                  {getAvailableSections().map((section) => (
                    <option key={section.value} value={section.value}>
                      {section.label}
                    </option>
                  ))}
                </select>
                {selectedProgramme && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <p><strong>Position Type:</strong> {selectedProgramme.positionType.charAt(0).toUpperCase() + selectedProgramme.positionType.slice(1)}</p>
                      <p><strong>Available Sections:</strong> {
                        selectedProgramme.positionType === 'general'
                          ? 'General only (team-based competitions)'
                          : 'Senior, Junior, Sub-Junior (age-based competitions)'
                      }</p>
                    </div>
                  </div>
                )}
                {selectedSection && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-800">
                      <p><strong>Selected Section:</strong> {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1).replace('-', ' ')}</p>
                      {showParticipants && selectedProgramme?.positionType !== 'general' && (
                        <p><strong>Registered Participants:</strong> {filteredParticipants.length}</p>
                      )}
                      {showParticipants && selectedProgramme?.positionType === 'general' && (
                        <p><strong>Registered Teams:</strong> {filteredTeams.length}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registered Teams Display (for general programmes) */}
            {showParticipants && selectedProgramme?.positionType === 'general' && filteredTeams.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🏆</span>
                  Registered Teams ({filteredTeams.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredTeams.map((teamEntry, index) => {
                    const isAssigned = isTeamAssigned(teamEntry.teamCode);
                    const isFirst = formData.firstPlaceTeams.some(p => p.teamCode === teamEntry.teamCode);
                    const isSecond = formData.secondPlaceTeams.some(p => p.teamCode === teamEntry.teamCode);
                    const isThird = formData.thirdPlaceTeams.some(p => p.teamCode === teamEntry.teamCode);


                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all ${isAssigned
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 mb-1"
                              style={{ backgroundColor: teamEntry.team?.color || '#6B7280' }}
                            >
                              {teamEntry.teamCode}
                            </div>
                            <div className="font-bold text-gray-900">
                              {teamEntry.team?.name || teamEntry.teamCode}
                            </div>
                            <div className="text-sm text-gray-700">
                              {teamEntry.participantCount} participants
                            </div>
                          </div>
                          {isAssigned && (
                            <div className="text-green-600 font-bold text-sm">
                              ✅
                            </div>
                          )}
                        </div>

                        {/* Position Buttons */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          <button
                            type="button"
                            onClick={() => toggleTeamPosition('firstPlaceTeams', teamEntry.teamCode)}
                            className={`px-2 py-1 text-xs rounded ${isFirst ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}
                          >
                            🥇 1st
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTeamPosition('secondPlaceTeams', teamEntry.teamCode)}
                            className={`px-2 py-1 text-xs rounded ${isSecond ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                          >
                            🥈 2nd
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTeamPosition('thirdPlaceTeams', teamEntry.teamCode)}
                            className={`px-2 py-1 text-xs rounded ${isThird ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                              }`}
                          >
                            🥉 3rd
                          </button>
                        </div>

                        {/* Grade Selection for All Teams */}
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            🎓 Performance Grade
                          </label>
                          <select
                            value={
                              isFirst ? getTeamGrade('firstPlaceTeams', teamEntry.teamCode) :
                                isSecond ? getTeamGrade('secondPlaceTeams', teamEntry.teamCode) :
                                  isThird ? getTeamGrade('thirdPlaceTeams', teamEntry.teamCode) :
                                    getParticipationTeamGrade(teamEntry.teamCode)
                            }
                            onChange={(e) => {
                              if (isFirst) {
                                updateTeamGrade('firstPlaceTeams', teamEntry.teamCode, e.target.value);
                              } else if (isSecond) {
                                updateTeamGrade('secondPlaceTeams', teamEntry.teamCode, e.target.value);
                              } else if (isThird) {
                                updateTeamGrade('thirdPlaceTeams', teamEntry.teamCode, e.target.value);
                              } else {
                                updateParticipationTeamGrade(teamEntry.teamCode, e.target.value);
                              }
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Grade</option>
                            <option value="A">A (5 pts)</option>
                            <option value="B">B (3 pts)</option>
                            <option value="C">C (1 pt)</option>
                          </select>
                          {/* Total Marks Display */}
                          {(() => {
                            let currentGrade = '';
                            let positionPoints = 0;

                            if (isFirst) {
                              currentGrade = getTeamGrade('firstPlaceTeams', teamEntry.teamCode);
                              positionPoints = formData.firstPoints;
                            } else if (isSecond) {
                              currentGrade = getTeamGrade('secondPlaceTeams', teamEntry.teamCode);
                              positionPoints = formData.secondPoints;
                            } else if (isThird) {
                              currentGrade = getTeamGrade('thirdPlaceTeams', teamEntry.teamCode);
                              positionPoints = formData.thirdPoints;
                            } else {
                              currentGrade = getParticipationTeamGrade(teamEntry.teamCode);
                              positionPoints = 0;
                            }

                            const gradePoints = getGradePoints(currentGrade);
                            const totalMarks = positionPoints + gradePoints;

                            if (currentGrade) {
                              return (
                                <div className="mt-1 text-xs">
                                  <span className="font-medium text-purple-600">
                                    Total: {totalMarks} marks
                                  </span>
                                  <span className="text-gray-500 ml-2">
                                    ({positionPoints} pos + {gradePoints} grade)
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Registered Participants Display (for individual/group programmes) */}
            {showParticipants && selectedProgramme?.positionType !== 'general' && filteredParticipants.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">👥</span>
                  Registered Participants ({filteredParticipants.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredParticipants.map((participant, index) => {
                    const isAssigned = isParticipantAssigned(participant.chestNumber);
                    const isFirst = formData.firstPlace.some(p => p.chestNumber === participant.chestNumber);
                    const isSecond = formData.secondPlace.some(p => p.chestNumber === participant.chestNumber);
                    const isThird = formData.thirdPlace.some(p => p.chestNumber === participant.chestNumber);


                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all ${isAssigned
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-bold text-gray-900 font-mono">
                              {participant.chestNumber}
                            </div>
                            <div className="text-sm text-gray-700">
                              {participant.candidate?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {participant.teamCode} • {participant.candidate?.section} section
                            </div>
                          </div>
                          {isAssigned && (
                            <div className="text-green-600 font-bold text-sm">
                              ✅
                            </div>
                          )}
                        </div>

                        {/* Position Buttons */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          <button
                            type="button"
                            onClick={() => togglePosition('firstPlace', participant.chestNumber)}
                            className={`px-2 py-1 text-xs rounded ${isFirst ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}
                          >
                            🥇 1st
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePosition('secondPlace', participant.chestNumber)}
                            className={`px-2 py-1 text-xs rounded ${isSecond ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                          >
                            🥈 2nd
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePosition('thirdPlace', participant.chestNumber)}
                            className={`px-2 py-1 text-xs rounded ${isThird ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                              }`}
                          >
                            🥉 3rd
                          </button>
                        </div>

                        {/* Grade Selection for All Participants */}
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            🎓 Performance Grade
                          </label>
                          <select
                            value={
                              isFirst ? getParticipantGrade('firstPlace', participant.chestNumber) :
                                isSecond ? getParticipantGrade('secondPlace', participant.chestNumber) :
                                  isThird ? getParticipantGrade('thirdPlace', participant.chestNumber) :
                                    getParticipationGrade(participant.chestNumber)
                            }
                            onChange={(e) => {
                              if (isFirst) {
                                updateParticipantGrade('firstPlace', participant.chestNumber, e.target.value);
                              } else if (isSecond) {
                                updateParticipantGrade('secondPlace', participant.chestNumber, e.target.value);
                              } else if (isThird) {
                                updateParticipantGrade('thirdPlace', participant.chestNumber, e.target.value);
                              } else {
                                updateParticipationGrade(participant.chestNumber, e.target.value);
                              }
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Grade</option>
                            <option value="A">A (5 pts)</option>
                            <option value="B">B (3 pts)</option>
                            <option value="C">C (1 pt)</option>
                          </select>
                          {/* Total Marks Display */}
                          {(() => {
                            let currentGrade = '';
                            let positionPoints = 0;

                            if (isFirst) {
                              currentGrade = getParticipantGrade('firstPlace', participant.chestNumber);
                              positionPoints = formData.firstPoints;
                            } else if (isSecond) {
                              currentGrade = getParticipantGrade('secondPlace', participant.chestNumber);
                              positionPoints = formData.secondPoints;
                            } else if (isThird) {
                              currentGrade = getParticipantGrade('thirdPlace', participant.chestNumber);
                              positionPoints = formData.thirdPoints;
                            } else {
                              currentGrade = getParticipationGrade(participant.chestNumber);
                              positionPoints = 0;
                            }

                            const gradePoints = getGradePoints(currentGrade);
                            const totalMarks = positionPoints + gradePoints;

                            if (currentGrade) {
                              return (
                                <div className="mt-1 text-xs">
                                  <span className="font-medium text-purple-600">
                                    Total: {totalMarks} marks
                                  </span>
                                  <span className="text-gray-500 ml-2">
                                    ({positionPoints} pos + {gradePoints} grade)
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {showParticipants && selectedProgramme?.positionType === 'general' && filteredTeams.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <div className="text-yellow-600 text-4xl mb-2">⚠️</div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Teams Found</h3>
                <p className="text-yellow-700">
                  No teams have registered for this programme in the selected section.
                </p>
              </div>
            )}

            {showParticipants && selectedProgramme?.positionType !== 'general' && filteredParticipants.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <div className="text-yellow-600 text-4xl mb-2">⚠️</div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Participants Found</h3>
                <p className="text-yellow-700">
                  No teams have registered for this programme in the selected section.
                </p>
              </div>
            )}

            {/* Static Points Display */}
            {selectedProgramme && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3">📊 Points System (Static)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="font-bold text-yellow-600">🥇 First Place</div>
                    <div className="text-2xl font-bold text-gray-900">{formData.firstPoints}</div>
                    <div className="text-xs text-gray-500">points each</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="font-bold text-gray-600">🥈 Second Place</div>
                    <div className="text-2xl font-bold text-gray-900">{formData.secondPoints}</div>
                    <div className="text-xs text-gray-500">points each</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="font-bold text-orange-600">🥉 Third Place</div>
                    <div className="text-2xl font-bold text-gray-900">{formData.thirdPoints}</div>
                    <div className="text-xs text-gray-500">points each</div>
                  </div>

                </div>
              </div>
            )}

            {/* Winners Summary */}
            {(formData.firstPlace.length > 0 || formData.secondPlace.length > 0 || formData.thirdPlace.length > 0 ||
              formData.firstPlaceTeams.length > 0 || formData.secondPlaceTeams.length > 0 || formData.thirdPlaceTeams.length > 0) && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="font-semibold text-yellow-800 mb-4 flex items-center">
                    <span className="mr-2">🏆</span>
                    Winners & Marks Summary
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* First Place */}
                    {(formData.firstPlace.length > 0 || formData.firstPlaceTeams.length > 0) && (
                      <div className="bg-white rounded-lg p-4 border border-yellow-300">
                        <h4 className="text-sm font-bold text-yellow-700 mb-2 flex items-center">
                          <span className="mr-1">🥇</span>
                          First Place ({formData.firstPoints} pts)
                        </h4>
                        {[...formData.firstPlace, ...formData.firstPlaceTeams].map((winner, index) => {
                          const isTeam = 'teamCode' in winner;
                          const identifier = isTeam ? winner.teamCode : winner.chestNumber;
                          const grade = winner.grade || '';
                          const totalMarks = formData.firstPoints + getGradePoints(grade);

                          return (
                            <div key={index} className="text-xs mb-2 p-2 bg-yellow-50 rounded">
                              <div className="font-bold">{identifier}</div>
                              {grade && (
                                <div className="text-purple-600">
                                  Grade: {grade} (+{getGradePoints(grade)} pts) = <span className="font-bold">{totalMarks} total</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Second Place */}
                    {(formData.secondPlace.length > 0 || formData.secondPlaceTeams.length > 0) && (
                      <div className="bg-white rounded-lg p-4 border border-gray-300">
                        <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                          <span className="mr-1">🥈</span>
                          Second Place ({formData.secondPoints} pts)
                        </h4>
                        {[...formData.secondPlace, ...formData.secondPlaceTeams].map((winner, index) => {
                          const isTeam = 'teamCode' in winner;
                          const identifier = isTeam ? winner.teamCode : winner.chestNumber;
                          const grade = winner.grade || '';
                          const totalMarks = formData.secondPoints + getGradePoints(grade);

                          return (
                            <div key={index} className="text-xs mb-2 p-2 bg-gray-50 rounded">
                              <div className="font-bold">{identifier}</div>
                              {grade && (
                                <div className="text-purple-600">
                                  Grade: {grade} (+{getGradePoints(grade)} pts) = <span className="font-bold">{totalMarks} total</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Third Place */}
                    {(formData.thirdPlace.length > 0 || formData.thirdPlaceTeams.length > 0) && (
                      <div className="bg-white rounded-lg p-4 border border-orange-300">
                        <h4 className="text-sm font-bold text-orange-700 mb-2 flex items-center">
                          <span className="mr-1">🥉</span>
                          Third Place ({formData.thirdPoints} pts)
                        </h4>
                        {[...formData.thirdPlace, ...formData.thirdPlaceTeams].map((winner, index) => {
                          const isTeam = 'teamCode' in winner;
                          const identifier = isTeam ? winner.teamCode : winner.chestNumber;
                          const grade = winner.grade || '';
                          const totalMarks = formData.thirdPoints + getGradePoints(grade);

                          return (
                            <div key={index} className="text-xs mb-2 p-2 bg-orange-50 rounded">
                              <div className="font-bold">{identifier}</div>
                              {grade && (
                                <div className="text-purple-600">
                                  Grade: {grade} (+{getGradePoints(grade)} pts) = <span className="font-bold">{totalMarks} total</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Enter any additional notes"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitting || !showParticipants}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                {submitting
                  ? (isEditMode ? 'Updating Result...' : 'Adding Result...')
                  : (isEditMode ? 'Update Result' : 'Add Result')
                }
              </button>
              {isEditMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </ShowcaseSection>

        {/* Results List */}
        <ShowcaseSection title="Results List">
          {results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No results found. Add your first result above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Programme</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Section</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">🥇 First</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">🥈 Second</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">🥉 Third</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result._id?.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{result.programme}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                          {result.section.charAt(0).toUpperCase() + result.section.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.status === 'published' ? 'bg-blue-100 text-blue-800' :
                          result.status === 'checked' ? 'bg-green-100 text-green-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                          {result.status === 'published' ? '🚀 Published' :
                            result.status === 'checked' ? '✅ Checked' :
                              '⏳ Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {/* Individual/Group Results */}
                          {result.firstPlace && result.firstPlace.length > 0 && (
                            <div className="mb-2">
                              {result.firstPlace.map((winner, index) => {
                                const gradePoints = getGradePoints(winner.grade || '');
                                const totalMarks = result.firstPoints + gradePoints;
                                return (
                                  <div key={index} className="mb-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                    <div className="font-medium text-gray-900">{winner.chestNumber}</div>
                                    {winner.grade && (
                                      <div className="text-xs text-purple-600 mt-1">
                                        Grade: <span className="font-bold">{winner.grade}</span> (+{gradePoints} pts)
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-600 mt-1">
                                      Total: <span className="font-bold text-yellow-700">{totalMarks} marks</span>
                                      <span className="text-gray-500"> ({result.firstPoints} pos + {gradePoints} grade)</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {/* Team Results */}
                          {result.firstPlaceTeams && result.firstPlaceTeams.length > 0 && (
                            <div>
                              {result.firstPlaceTeams.map((winner, index) => {
                                const gradePoints = getGradePoints(winner.grade || '');
                                const totalMarks = result.firstPoints + gradePoints;
                                return (
                                  <div key={index} className="mb-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                    <div className="flex items-center mb-1">
                                      <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: teams.find(t => t.code === winner.teamCode)?.color || '#6B7280' }}></span>
                                      <span className="font-medium text-gray-900">{winner.teamCode}</span>
                                    </div>
                                    {winner.grade && (
                                      <div className="text-xs text-purple-600 mt-1">
                                        Grade: <span className="font-bold">{winner.grade}</span> (+{gradePoints} pts)
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-600 mt-1">
                                      Total: <span className="font-bold text-yellow-700">{totalMarks} marks</span>
                                      <span className="text-gray-500"> ({result.firstPoints} pos + {gradePoints} grade)</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {(!result.firstPlace || result.firstPlace.length === 0) && (!result.firstPlaceTeams || result.firstPlaceTeams.length === 0) && (
                            <p className="text-gray-400">-</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {/* Individual/Group Results */}
                          {result.secondPlace && result.secondPlace.length > 0 && (
                            <div className="mb-2">
                              {result.secondPlace.map((winner, index) => {
                                const gradePoints = getGradePoints(winner.grade || '');
                                const totalMarks = result.secondPoints + gradePoints;
                                return (
                                  <div key={index} className="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                                    <div className="font-medium text-gray-900">{winner.chestNumber}</div>
                                    {winner.grade && (
                                      <div className="text-xs text-purple-600 mt-1">
                                        Grade: <span className="font-bold">{winner.grade}</span> (+{gradePoints} pts)
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-600 mt-1">
                                      Total: <span className="font-bold text-gray-700">{totalMarks} marks</span>
                                      <span className="text-gray-500"> ({result.secondPoints} pos + {gradePoints} grade)</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {/* Team Results */}
                          {result.secondPlaceTeams && result.secondPlaceTeams.length > 0 && (
                            <div>
                              {result.secondPlaceTeams.map((winner, index) => {
                                const gradePoints = getGradePoints(winner.grade || '');
                                const totalMarks = result.secondPoints + gradePoints;
                                return (
                                  <div key={index} className="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                                    <div className="flex items-center mb-1">
                                      <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: teams.find(t => t.code === winner.teamCode)?.color || '#6B7280' }}></span>
                                      <span className="font-medium text-gray-900">{winner.teamCode}</span>
                                    </div>
                                    {winner.grade && (
                                      <div className="text-xs text-purple-600 mt-1">
                                        Grade: <span className="font-bold">{winner.grade}</span> (+{gradePoints} pts)
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-600 mt-1">
                                      Total: <span className="font-bold text-gray-700">{totalMarks} marks</span>
                                      <span className="text-gray-500"> ({result.secondPoints} pos + {gradePoints} grade)</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {(!result.secondPlace || result.secondPlace.length === 0) && (!result.secondPlaceTeams || result.secondPlaceTeams.length === 0) && (
                            <p className="text-gray-400">-</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {/* Individual/Group Results */}
                          {result.thirdPlace && result.thirdPlace.length > 0 && (
                            <div className="mb-2">
                              {result.thirdPlace.map((winner, index) => {
                                const gradePoints = getGradePoints(winner.grade || '');
                                const totalMarks = result.thirdPoints + gradePoints;
                                return (
                                  <div key={index} className="mb-2 p-2 bg-orange-50 rounded border border-orange-200">
                                    <div className="font-medium text-gray-900">{winner.chestNumber}</div>
                                    {winner.grade && (
                                      <div className="text-xs text-purple-600 mt-1">
                                        Grade: <span className="font-bold">{winner.grade}</span> (+{gradePoints} pts)
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-600 mt-1">
                                      Total: <span className="font-bold text-orange-700">{totalMarks} marks</span>
                                      <span className="text-gray-500"> ({result.thirdPoints} pos + {gradePoints} grade)</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {/* Team Results */}
                          {result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0 && (
                            <div>
                              {result.thirdPlaceTeams.map((winner, index) => {
                                const gradePoints = getGradePoints(winner.grade || '');
                                const totalMarks = result.thirdPoints + gradePoints;
                                return (
                                  <div key={index} className="mb-2 p-2 bg-orange-50 rounded border border-orange-200">
                                    <div className="flex items-center mb-1">
                                      <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: teams.find(t => t.code === winner.teamCode)?.color || '#6B7280' }}></span>
                                      <span className="font-medium text-gray-900">{winner.teamCode}</span>
                                    </div>
                                    {winner.grade && (
                                      <div className="text-xs text-purple-600 mt-1">
                                        Grade: <span className="font-bold">{winner.grade}</span> (+{gradePoints} pts)
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-600 mt-1">
                                      Total: <span className="font-bold text-orange-700">{totalMarks} marks</span>
                                      <span className="text-gray-500"> ({result.thirdPoints} pos + {gradePoints} grade)</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {(!result.thirdPlace || result.thirdPlace.length === 0) && (!result.thirdPlaceTeams || result.thirdPlaceTeams.length === 0) && (
                            <p className="text-gray-400">-</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditResult(result)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(result._id!.toString(), result.programme || 'Unknown Programme')}
                            disabled={deleting === result._id?.toString()}
                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                          >
                            {deleting === result._id?.toString() ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ShowcaseSection>

        {/* Grand Marks Summary */}
        <ShowcaseSection title="📊 Grand Marks Summary">
          {results.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-500">No results available for summary</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Results */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-white text-xl">📋</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{results.length}</div>
                      <div className="text-sm text-blue-600">Total Results</div>
                    </div>
                  </div>
                </div>

                {/* Active Teams */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-white text-xl">🏆</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">{teams.length}</div>
                      <div className="text-sm text-green-600">Active Teams</div>
                    </div>
                  </div>
                </div>

                {/* Results by Status */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-white text-xl">📈</span>
                    </div>
                    <div>
                      <div className="text-sm text-orange-600 space-y-1">
                        <div>⏳ Pending: {results.filter(r => r.status === 'pending').length}</div>
                        <div>✅ Checked: {results.filter(r => r.status === 'checked').length}</div>
                        <div>🚀 Published: {results.filter(r => r.status === 'published').length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Points Grid */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🏆</span>
                  Team Grand Points
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {calculateTeamPoints().map((team, index) => (
                    <div key={team.code} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.code}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xl font-bold text-gray-900">{team.total}</div>
                          <div className="text-xs text-gray-600 truncate">{team.name}</div>
                        </div>
                        {index < 3 && (
                          <div className="text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ShowcaseSection>

        {/* Checked Results Summary */}
        <ShowcaseSection title="✅ Checked Results Summary">
          {results.filter(r => r.status === 'checked').length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-gray-500">No checked results available</p>
              <p className="text-sm text-gray-400 mt-2">Results will appear here after being reviewed and checked</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Checked Results Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-900">
                    {results.filter(r => r.status === 'checked').length}
                  </div>
                  <div className="text-sm text-green-600">Checked Results</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-blue-900">
                    {results.filter(r => r.status === 'checked').reduce((total, result) => {
                      let resultTotal = 0;
                      // Individual/Group results with grades
                      if (result.firstPlace) {
                        result.firstPlace.forEach(winner => {
                          const gradePoints = getGradePoints(winner.grade || '');
                          resultTotal += result.firstPoints + gradePoints;
                        });
                      }
                      if (result.secondPlace) {
                        result.secondPlace.forEach(winner => {
                          const gradePoints = getGradePoints(winner.grade || '');
                          resultTotal += result.secondPoints + gradePoints;
                        });
                      }
                      if (result.thirdPlace) {
                        result.thirdPlace.forEach(winner => {
                          const gradePoints = getGradePoints(winner.grade || '');
                          resultTotal += result.thirdPoints + gradePoints;
                        });
                      }

                      // Team results with grades
                      if (result.firstPlaceTeams) {
                        result.firstPlaceTeams.forEach(winner => {
                          const gradePoints = getGradePoints(winner.grade || '');
                          resultTotal += result.firstPoints + gradePoints;
                        });
                      }
                      if (result.secondPlaceTeams) {
                        result.secondPlaceTeams.forEach(winner => {
                          const gradePoints = getGradePoints(winner.grade || '');
                          resultTotal += result.secondPoints + gradePoints;
                        });
                      }
                      if (result.thirdPlaceTeams) {
                        result.thirdPlaceTeams.forEach(winner => {
                          const gradePoints = getGradePoints(winner.grade || '');
                          resultTotal += result.thirdPoints + gradePoints;
                        });
                      }

                      // Participation grades (backward compatibility)
                      if (result.participationGrades) {
                        resultTotal += result.participationGrades.reduce((sum, pg) => sum + pg.points, 0);
                      }
                      if (result.participationTeamGrades) {
                        resultTotal += result.participationTeamGrades.reduce((sum, pg) => sum + pg.points, 0);
                      }
                      return total + resultTotal;
                    }, 0)}
                  </div>
                  <div className="text-sm text-blue-600">Total Marks Ready</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-purple-900">
                    {results.filter(r => r.status === 'checked').reduce((total, result) => {
                      let winners = 0;
                      if (result.firstPlace) winners += result.firstPlace.length;
                      if (result.secondPlace) winners += result.secondPlace.length;
                      if (result.thirdPlace) winners += result.thirdPlace.length;
                      if (result.firstPlaceTeams) winners += result.firstPlaceTeams.length;
                      if (result.secondPlaceTeams) winners += result.secondPlaceTeams.length;
                      if (result.thirdPlaceTeams) winners += result.thirdPlaceTeams.length;
                      return total + winners;
                    }, 0)}
                  </div>
                  <div className="text-sm text-purple-600">Winners Ready</div>
                </div>
              </div>

              {/* Checked Results List */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-green-50 px-6 py-4 border-b border-green-200">
                  <h3 className="text-lg font-semibold text-green-900">Ready for Publication</h3>
                  <p className="text-sm text-green-700">These results have been checked and are ready to be published</p>
                </div>
                <div className="divide-y divide-gray-200">
                  {results.filter(r => r.status === 'checked').map((result, index) => (
                    <div key={result._id?.toString()} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{result.programme}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="capitalize">{result.section.replace('-', ' ')} section</span>
                            <span>•</span>
                            <span className="capitalize">{result.positionType}</span>
                            <span>•</span>
                            <span>
                              {((result.firstPlace?.length || 0) +
                                (result.secondPlace?.length || 0) +
                                (result.thirdPlace?.length || 0) +
                                (result.firstPlaceTeams?.length || 0) +
                                (result.secondPlaceTeams?.length || 0) +
                                (result.thirdPlaceTeams?.length || 0))} winners
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {(() => {
                              let total = 0;

                              // Individual/Group results with grades
                              if (result.firstPlace) {
                                result.firstPlace.forEach(winner => {
                                  const gradePoints = getGradePoints(winner.grade || '');
                                  total += result.firstPoints + gradePoints;
                                });
                              }
                              if (result.secondPlace) {
                                result.secondPlace.forEach(winner => {
                                  const gradePoints = getGradePoints(winner.grade || '');
                                  total += result.secondPoints + gradePoints;
                                });
                              }
                              if (result.thirdPlace) {
                                result.thirdPlace.forEach(winner => {
                                  const gradePoints = getGradePoints(winner.grade || '');
                                  total += result.thirdPoints + gradePoints;
                                });
                              }

                              // Team results with grades
                              if (result.firstPlaceTeams) {
                                result.firstPlaceTeams.forEach(winner => {
                                  const gradePoints = getGradePoints(winner.grade || '');
                                  total += result.firstPoints + gradePoints;
                                });
                              }
                              if (result.secondPlaceTeams) {
                                result.secondPlaceTeams.forEach(winner => {
                                  const gradePoints = getGradePoints(winner.grade || '');
                                  total += result.secondPoints + gradePoints;
                                });
                              }
                              if (result.thirdPlaceTeams) {
                                result.thirdPlaceTeams.forEach(winner => {
                                  const gradePoints = getGradePoints(winner.grade || '');
                                  total += result.thirdPoints + gradePoints;
                                });
                              }

                              // Participation grades (backward compatibility)
                              if (result.participationGrades) {
                                total += result.participationGrades.reduce((sum, pg) => sum + pg.points, 0);
                              }
                              if (result.participationTeamGrades) {
                                total += result.participationTeamGrades.reduce((sum, pg) => sum + pg.points, 0);
                              }

                              return total;
                            })()} pts
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(result.updatedAt || result.createdAt || '').toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center space-x-4">
                <a
                  href="/admin/results/checklist"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span className="mr-2">📋</span>
                  View in Checklist
                </a>
                <a
                  href="/admin/results/publish"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="mr-2">🚀</span>
                  Publish Results
                </a>
              </div>
            </div>
          )}
        </ShowcaseSection>
      </div>
    </>
  );
}