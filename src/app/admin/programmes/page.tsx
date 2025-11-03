'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Programme, ProgrammeParticipant, Team } from '@/types';

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manage' | 'registrations'>('manage');
  const [formData, setFormData] = useState({
    _id: '',
    code: '',
    name: '',
    category: '' as 'arts' | 'sports' | '',
    subcategory: '' as 'stage' | 'non-stage' | '',
    section: '' as 'senior' | 'junior' | 'sub-junior' | 'general' | '',
    positionType: '' as 'individual' | 'group' | 'general' | '',
    requiredParticipants: 1,
    maxParticipants: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationProgramme, setMigrationProgramme] = useState<Programme | null>(null);
  const [migrationTarget, setMigrationTarget] = useState<'individual' | 'group'>('individual');
  const [migrationDismissed, setMigrationDismissed] = useState(false);

  // Filter out blank/empty programmes
  const filterValidProgrammes = (programmes: Programme[]) => {
    return programmes.filter(programme =>
      programme.name &&
      programme.name.trim() !== '' &&
      programme.code &&
      programme.code.trim() !== '' &&
      programme.category &&
      programme.category.trim() !== '' &&
      programme.section &&
      programme.section.trim() !== '' &&
      programme.positionType &&
      programme.positionType.trim() !== ''
    );
  };

  // Fetch all data from APIs
  const fetchData = async () => {
    try {
      setLoading(true);
      const [programmesRes, participantsRes, teamsRes] = await Promise.all([
        fetch('/api/programmes'),
        fetch('/api/programme-participants'),
        fetch('/api/teams')
      ]);

      const [programmesData, participantsData, teamsData] = await Promise.all([
        programmesRes.json(),
        participantsRes.json(),
        teamsRes.json()
      ]);

      // Filter out blank/empty programmes
      const validProgrammes = filterValidProgrammes(programmesData);

      setProgrammes(validProgrammes);
      setParticipants(participantsData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching programmes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Load program data into form for editing
  const handleEditProgramme = (programme: Programme) => {
    console.log('Editing programme:', programme);
    const editData = {
      _id: programme._id?.toString() || '',
      code: programme.code || '',
      name: programme.name || '',
      category: programme.category as 'arts' | 'sports' | '',
      subcategory: (programme.subcategory as 'stage' | 'non-stage') || '',
      section: programme.section as 'senior' | 'junior' | 'sub-junior' | 'general' | '',
      positionType: programme.positionType || '',
      requiredParticipants: programme.requiredParticipants || 1,
      maxParticipants: programme.maxParticipants?.toString() || ''
    };
    console.log('Setting form data:', editData);
    setFormData(editData);
    setIsEditMode(true);
    // Scroll to form
    document.getElementById('programme-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      _id: '',
      code: '',
      name: '',
      category: '' as 'arts' | 'sports' | '',
      subcategory: '' as 'stage' | 'non-stage' | '',
      section: '' as 'senior' | 'junior' | 'sub-junior' | 'general' | '',
      positionType: '' as 'individual' | 'group' | 'general' | '',
      requiredParticipants: 1,
      maxParticipants: ''
    });
    setIsEditMode(false);
  };

  // Check if program code already exists (excluding current program in edit mode)
  const isProgramCodeExists = (code: string) => {
    if (!code) return false;
    
    const duplicates = programmes.filter(programme => 
      programme.code.toLowerCase() === code.toLowerCase()
    );
    
    console.log('Checking code:', code, 'isEditMode:', isEditMode, 'formData._id:', formData._id);
    console.log('Found programmes with same code:', duplicates);
    
    if (!isEditMode) {
      // For new programmes, any duplicate is invalid
      return duplicates.length > 0;
    } else {
      // For editing, exclude the current programme
      const otherDuplicates = duplicates.filter(programme => 
        programme._id?.toString() !== formData._id
      );
      console.log('Other duplicates (excluding current):', otherDuplicates);
      return otherDuplicates.length > 0;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.category || !formData.section || !formData.positionType || !formData.requiredParticipants) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.category === 'arts' && !formData.subcategory) {
      alert('Please select subcategory for arts programmes');
      return;
    }

    // Validate participant range
    if (formData.maxParticipants && parseInt(formData.maxParticipants) < formData.requiredParticipants) {
      alert('Maximum participants must be greater than or equal to minimum participants');
      return;
    }

    // Check for duplicate program code (skip if editing the same programme)
    if (!isEditMode) {
      // Only check for duplicates when adding new programmes
      const isDuplicate = isProgramCodeExists(formData.code);
      if (isDuplicate) {
        alert(`A program with code "${formData.code}" already exists. Please choose a different code.`);
        return;
      }
    } else {
      // For editing, only check if the code has actually changed
      const originalProgramme = programmes.find(p => p._id?.toString() === formData._id);
      if (originalProgramme && originalProgramme.code !== formData.code) {
        // Code has changed, check for duplicates
        const isDuplicate = isProgramCodeExists(formData.code);
        if (isDuplicate) {
          console.log('Duplicate check failed - isEditMode:', isEditMode, 'formData._id:', formData._id);
          alert(`A program with code "${formData.code}" already exists. Please use a different code.`);
          return;
        }
      }
      // If code hasn't changed, skip duplicate check entirely
    }

    try {
      setSubmitting(true);
      const url = isEditMode 
        ? `/api/programmes?id=${formData._id}`
        : '/api/programmes';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      // Prepare data for submission
      const { _id, ...submitData } = formData;
      const requestBody = isEditMode 
        ? { ...submitData, status: 'active' }
        : { ...submitData, status: 'active' }; // Exclude _id for new programmes
      
      console.log('Submitting:', { method, url, requestBody, isEditMode });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        // Reset form
        resetForm();
        
        // Refresh data
        await fetchData();
        alert(`Programme ${isEditMode ? 'updated' : 'added'} successfully!`);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Unknown error');
      }  
    } catch (error) {
      console.error('Error updating programme:', error);
      alert('Error updating programme');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get category icon
  const getCategoryIcon = (category: string | null | undefined) => {
    if (!category) return '❓';
    return category === 'arts' ? '🎨' : '⚽';
  };

  // Get category color
  const getCategoryColor = (category: string | null | undefined) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    return category === 'arts' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  // Handle delete programme
  const handleDelete = async (programmeId: string, programmeName: string) => {
    // Get registration count for this programme
    const registrationCount = participants.filter(p => p.programmeId === programmeId).length;
    
    const confirmMessage = registrationCount > 0 
      ? `⚠️ WARNING: Deleting "${programmeName}" will also delete:\n\n• ${registrationCount} team registration(s)\n• All associated results\n\nThis action cannot be undone. Are you sure?`
      : `Are you sure you want to delete "${programmeName}"? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleting(programmeId);
      const response = await fetch(`/api/programmes?id=${programmeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData(); // Refresh the list
        // If we were editing the deleted programme, reset the form
        if (formData._id === programmeId) {
          resetForm();
        }
        alert('Programme deleted successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting programme:', error);
      alert('Error deleting programme');
    } finally {
      setDeleting(null);
    }
  };

  // Get programme registrations with team info
  const getProgrammeRegistrations = () => {
    return programmes.map(programme => {
      const programmeParticipants = participants.filter(p => p.programmeId === programme._id?.toString());
      return {
        ...programme,
        registrations: programmeParticipants.map(p => ({
          ...p,
          teamInfo: teams.find(t => t.code === p.teamCode)
        }))
      };
    });
  };

  const programmeRegistrations = getProgrammeRegistrations();
  const totalRegistrations = participants.length;

  // Get programmes with deprecated "general" position type
  const generalPositionProgrammes = programmes.filter(p => p.positionType === 'general');

  // Handle migration of general position type programmes
  const handleMigrateProgramme = async (programme: Programme, newPositionType: 'individual' | 'group') => {
    try {
      const response = await fetch(`/api/programmes?id=${programme._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...programme,
          positionType: newPositionType,
          status: 'active'
        }),
      });

      if (response.ok) {
        await fetchData(); // Refresh the list
        setShowMigrationModal(false);
        setMigrationProgramme(null);
        alert(`Programme "${programme.name}" successfully migrated to ${newPositionType} position type!`);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Migration failed');
      }
    } catch (error) {
      console.error('Error migrating programme:', error);
      alert('Error migrating programme. Please try again.');
    }
  };

  return (
    <>
      <Breadcrumb pageName="Programmes" />

      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'manage'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            📝 Manage Programmes ({programmes.length})
          </button>
          {/* <button
            onClick={() => setActiveTab('registrations')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'registrations'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👥 View Registrations ({totalRegistrations})
          </button> */}
        </div>
        {/* Manage Programmes Tab */}
        {activeTab === 'manage' && (
          <>
            {/* Programme Form */}
            <div id="programme-form">
              <ShowcaseSection title={isEditMode ? 'Edit Programme' : 'Add New Programme'}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programme Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Enter programme code (e.g., P001)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programme Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter programme name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="arts">Arts</option>
                      <option value="sports">Sports</option>
                    </select>
                  </div>
                </div>

                {formData.category === 'arts' && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Arts Subcategory
                      </label>
                      <select
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                        required
                      >
                        <option value="">Select subcategory</option>
                        <option value="stage">Stage</option>
                        <option value="non-stage">Non-Stage</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                      required
                    >
                      <option value="">Select section</option>
                      <option value="senior">Senior</option>
                      <option value="junior">Junior</option>
                      <option value="sub-junior">Sub Junior</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position Type
                    </label>
                    <select
                      name="positionType"
                      value={formData.positionType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                      required
                    >
                      <option value="">Select position type</option>
                      <option value="individual">Individual</option>
                      <option value="group">Group</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Participants (Required)
                    </label>
                    <input
                      type="number"
                      name="requiredParticipants"
                      value={formData.requiredParticipants}
                      onChange={handleInputChange}
                      min="1"
                      max="45"
                      placeholder="Minimum number of participants"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Participants (Optional)
                    </label>
                    <input
                      type="number"
                      name="maxParticipants"
                      value={formData.maxParticipants}
                      onChange={handleInputChange}
                      min={formData.requiredParticipants || 1}
                      max="45"
                      placeholder="Maximum allowed (leave empty for no limit)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                    />
                  </div>
                </div>

                {/* Participant Range Display */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">📊 Participant Range Summary</h4>
                    <div className="text-sm text-green-700">
                      {formData.maxParticipants && parseInt(formData.maxParticipants) > formData.requiredParticipants ? (
                        <div>
                          <p><strong>Range:</strong> {formData.requiredParticipants} to {formData.maxParticipants} participants</p>
                          <p><strong>Teams can register with:</strong> {formData.requiredParticipants}, {formData.requiredParticipants + 1}{parseInt(formData.maxParticipants) > formData.requiredParticipants + 1 ? `, ... ${formData.maxParticipants}` : ''} participants</p>
                        </div>
                      ) : (
                        <div>
                          <p><strong>Fixed:</strong> Exactly {formData.requiredParticipants} participant{formData.requiredParticipants !== 1 ? 's' : ''} required</p>
                          <p><strong>Teams must register with:</strong> {formData.requiredParticipants} participant{formData.requiredParticipants !== 1 ? 's' : ''} only</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : isEditMode ? 'Update Programme' : 'Add Programme'}
                  </button>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              </ShowcaseSection>
            </div>

            {/* Migration Notice for General Position Type */}
            {generalPositionProgrammes.length > 0 && !migrationDismissed && (
              <ShowcaseSection title="⚠️ Migration Required">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-yellow-600 text-2xl">⚠️</div>
                      <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                        Deprecated Position Type Found
                      </h3>
                      <p className="text-yellow-700 mb-4">
                        The following programmes use the deprecated "General" position type. Please migrate them based on their section:
                        <br/>• <strong>General section</strong> programmes should use <strong>Group</strong> position type (marks go to teams)
                        <br/>• <strong>Age-based sections</strong> (Senior/Junior/Sub-Junior) should use <strong>Individual</strong> position type (marks go to individuals)
                      </p>
                      
                      <div className="space-y-3">
                        {generalPositionProgrammes.map((programme) => (
                          <div key={programme._id?.toString()} className="bg-white border border-yellow-300 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900">{programme.name}</div>
                                <div className="text-sm text-gray-600">
                                  Code: {programme.code} • Section: {programme.section}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                {programme.section === 'general' ? (
                                  <button
                                    onClick={() => {
                                      setMigrationProgramme(programme);
                                      setMigrationTarget('group');
                                      setShowMigrationModal(true);
                                    }}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                  >
                                    → Group (Recommended)
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setMigrationProgramme(programme);
                                      setMigrationTarget('individual');
                                      setShowMigrationModal(true);
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                  >
                                    → Individual (Recommended)
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setMigrationProgramme(programme);
                                    setMigrationTarget(programme.section === 'general' ? 'individual' : 'group');
                                    setShowMigrationModal(true);
                                  }}
                                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                                >
                                  → {programme.section === 'general' ? 'Individual' : 'Group'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Migration Guide:</strong><br/>
                          • Choose <strong>Individual</strong> for age-based sections (Senior/Junior/Sub-Junior) - marks go to individual participants<br/>
                          • Choose <strong>Group</strong> for General section programmes - marks go to the entire team
                        </p>
                      </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => setMigrationDismissed(true)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                        title="Mark migration as complete and hide this notice"
                      >
                        <span>✓</span>
                        <span>All Good</span>
                      </button>
                      <button
                        onClick={() => setMigrationDismissed(true)}
                        className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                        title="Hide this notice for now"
                      >
                        <span>✕</span>
                        <span>Hide</span>
                      </button>
                    </div>
                  </div>
                </div>
              </ShowcaseSection>
            )}

            {/* Hidden Migration Notice */}
            {generalPositionProgrammes.length > 0 && migrationDismissed && (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-orange-600 text-lg">⚠️</div>
                    <div>
                      <p className="text-orange-800 font-medium">
                        {generalPositionProgrammes.length} programme{generalPositionProgrammes.length !== 1 ? 's' : ''} still need{generalPositionProgrammes.length === 1 ? 's' : ''} migration
                      </p>
                      <p className="text-orange-700 text-sm">Migration notice is hidden. Click to review.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMigrationDismissed(false)}
                    className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Review Migration
                  </button>
                </div>
              </div>
            )}

            {/* Programme Status Section - Priority Attention */}
            <ShowcaseSection title="Programme Status - Requires Attention">
              <div className="space-y-4">
                {/* Critical Alert for Unregistered Programmes */}
                {(() => {
                  const unregisteredProgrammes = programmeRegistrations.filter(p => p.registrations.length === 0);
                  return unregisteredProgrammes.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">!</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-red-900">🚨 Critical: Programmes with No Registrations</h3>
                          <p className="text-red-700 text-sm">These programmes need immediate attention - no teams have registered</p>
                        </div>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-200 text-red-900">
                            {unregisteredProgrammes.length} programme{unregisteredProgrammes.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {unregisteredProgrammes.map((programme) => (
                          <div key={programme._id?.toString()} className="bg-white border-2 border-red-300 rounded-lg p-3 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-sm mb-1">{programme.name}</h4>
                                <p className="text-xs text-gray-600 font-mono">{programme.code}</p>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-200 text-red-900">
                                0 Teams
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              <span className="capitalize">{programme.category}{programme.subcategory ? ` • ${programme.subcategory}` : ''}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {programme.section} • {programme.positionType}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Warning for Incomplete Registrations */}
                {(() => {
                  const incompleteRegistrations = programmeRegistrations.filter(p => 
                    p.registrations.length > 0 && p.registrations.length < teams.length
                  );
                  return incompleteRegistrations.length > 0 && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">⚠</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-yellow-900">⚡ Warning: Incomplete Registrations</h3>
                          <p className="text-yellow-700 text-sm">Some teams are missing from these programmes</p>
                        </div>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-200 text-yellow-900">
                            {incompleteRegistrations.length} programme{incompleteRegistrations.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {incompleteRegistrations.map((programme) => {
                          const registeredTeamCodes = programme.registrations.map(r => r.teamCode);
                          const unregisteredTeams = teams.filter(team => !registeredTeamCodes.includes(team.code));
                          
                          return (
                            <div key={programme._id?.toString()} className="bg-white border-2 border-yellow-300 rounded-lg p-3 shadow-sm">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-sm mb-1">{programme.name}</h4>
                                  <p className="text-xs text-gray-600 font-mono">{programme.code}</p>
                                </div>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-200 text-yellow-900">
                                  {programme.registrations.length}/{teams.length}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                <span className="capitalize">{programme.category}{programme.subcategory ? ` • ${programme.subcategory}` : ''}</span>
                              </div>
                              
                              {/* Missing Teams - Compact Display */}
                              <div className="mb-1">
                                <p className="text-xs font-bold text-red-700">Missing:</p>
                                <div className="flex flex-wrap gap-1">
                                  {unregisteredTeams.slice(0, 3).map((team) => (
                                    <span
                                      key={team.code}
                                      className="inline-flex items-center px-1 py-0.5 rounded text-xs font-bold bg-red-200 text-red-900"
                                    >
                                      {team.code}
                                    </span>
                                  ))}
                                  {unregisteredTeams.length > 3 && (
                                    <span className="text-xs text-red-700 font-bold">
                                      +{unregisteredTeams.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Success Message for Complete Registrations */}
                {(() => {
                  const unregisteredCount = programmeRegistrations.filter(p => p.registrations.length === 0).length;
                  const incompleteCount = programmeRegistrations.filter(p => 
                    p.registrations.length > 0 && p.registrations.length < teams.length
                  ).length;
                  
                  return (unregisteredCount === 0 && incompleteCount === 0 && programmeRegistrations.length > 0) && (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">✓</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-green-900">🎉 Excellent! All Programmes Have Registrations</h3>
                          <p className="text-green-700 text-sm">All programmes have been registered by teams - ready for competition!</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* No Programmes Message */}
                {programmeRegistrations.length === 0 && (
                  <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-3">📋</div>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">No Programmes Created Yet</h3>
                    <p className="text-gray-600 text-sm">Create programmes using the form above to see registration status</p>
                  </div>
                )}
              </div>
            </ShowcaseSection>

            {/* Programmes List */}
            <ShowcaseSection title="Programmes List">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading programmes...</p>
                  </div>
                </div>
              ) : programmes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No programmes found. Add your first programme above!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Code</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Programme Name</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Category</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Section</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Position</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Participants</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Status</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programmes.map((programme) => (
                        <tr key={programme._id?.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900 font-bold">{programme.code}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs">{getCategoryIcon(programme.category)}</span>
                              </div>
                              <Link
                                href={`/admin/programmes/${programme._id}`}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                              >
                                {programme.name}
                              </Link>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(programme.category)}`}>
                              {programme.category ? programme.category.charAt(0).toUpperCase() + programme.category.slice(1) : 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              {programme.section ? programme.section.charAt(0).toUpperCase() + programme.section.slice(1).replace('-', ' ') : 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                              {programme.positionType ? programme.positionType.charAt(0).toUpperCase() + programme.positionType.slice(1) : 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                {programme.maxParticipants && programme.maxParticipants > programme.requiredParticipants
                                  ? `${programme.requiredParticipants}-${programme.maxParticipants} participants`
                                  : `${programme.requiredParticipants || 1} participants`
                                }
                              </span>
                              <div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                  programme.maxParticipants && programme.maxParticipants > programme.requiredParticipants
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                  {programme.maxParticipants && programme.maxParticipants > programme.requiredParticipants
                                    ? '📊 Range' 
                                    : '🔒 Fixed'
                                  }
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${programme.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                              }`}>
                              {programme.status ? programme.status.charAt(0).toUpperCase() + programme.status.slice(1) : 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleEditProgramme(programme)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit programme"
                              >
                                Edit
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleDelete(programme._id?.toString() || '', programme.name)}
                                disabled={deleting === programme._id?.toString()}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete programme"
                              >
                                {deleting === programme._id?.toString() ? 'Deleting...' : 'Delete'}
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

            {/* Programme Statistics */}
            <ShowcaseSection title="Programme Statistics">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Total Programmes</h3>
                  <p className="text-2xl font-bold text-gray-900">{programmes.length}</p>
                  <p className="text-sm text-gray-600">Active programmes</p>
                </div>

                <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-3xl mb-3">👤</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Individual</h3>
                  <p className="text-2xl font-bold text-gray-900">{programmes.filter(p => p.positionType === 'individual').length}</p>
                  <p className="text-sm text-gray-600">Individual competitions</p>
                </div>

                <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-3xl mb-3">👥</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Group</h3>
                  <p className="text-2xl font-bold text-gray-900">{programmes.filter(p => p.positionType === 'group').length}</p>
                  <p className="text-sm text-gray-600">Group competitions</p>
                </div>

                <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-3xl mb-3">⚠️</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Migration Needed</h3>
                  <p className="text-2xl font-bold text-red-600">{generalPositionProgrammes.length}</p>
                  <p className="text-sm text-gray-600">Deprecated programmes</p>
                  {generalPositionProgrammes.length > 0 && migrationDismissed && (
                    <button
                      onClick={() => setMigrationDismissed(false)}
                      className="mt-2 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                    >
                      Show Migration
                    </button>
                  )}
                </div>
              </div>
            </ShowcaseSection>
          </>
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <>
            {/* Registration Statistics */}
            <ShowcaseSection title="Registration Overview">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-3xl mb-3">📋</div>
                  <h3 className="font-semibold text-blue-900 mb-2">Total Registrations</h3>
                  <p className="text-2xl font-bold text-blue-900">{totalRegistrations}</p>
                  <p className="text-sm text-blue-600">Across all programmes</p>
                </div>

                <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-semibold text-green-900 mb-2">Active Programmes</h3>
                  <p className="text-2xl font-bold text-green-900">{programmeRegistrations.filter(p => p.registrations.length > 0).length}</p>
                  <p className="text-sm text-green-600">With registrations</p>
                </div>

                <div className="text-center p-6 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-3xl mb-3">👥</div>
                  <h3 className="font-semibold text-purple-900 mb-2">Teams Participating</h3>
                  <p className="text-2xl font-bold text-purple-900">{new Set(participants.map(p => p.teamCode)).size}</p>
                  <p className="text-sm text-purple-600">Unique teams</p>
                </div>

                <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-3xl mb-3">⭐</div>
                  <h3 className="font-semibold text-orange-900 mb-2">Avg per Programme</h3>
                  <p className="text-2xl font-bold text-orange-900">
                    {programmes.length > 0 ? (totalRegistrations / programmes.length).toFixed(1) : '0'}
                  </p>
                  <p className="text-sm text-orange-600">Registrations</p>
                </div>
              </div>
            </ShowcaseSection>

            {/* Programme Status Section */}
            <ShowcaseSection title="Programme Status">
              <div className="space-y-6">
                {/* Programmes with No Registrations */}
                {(() => {
                  const unregisteredProgrammes = programmeRegistrations.filter(p => p.registrations.length === 0);
                  return unregisteredProgrammes.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-lg">⚠️</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-red-900">Programmes with No Registrations</h3>
                          <p className="text-red-700 text-sm">These programmes have not been registered by any team</p>
                        </div>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            {unregisteredProgrammes.length} programme{unregisteredProgrammes.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unregisteredProgrammes.map((programme) => (
                          <div key={programme._id?.toString()} className="bg-white border border-red-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">{programme.name}</h4>
                                <p className="text-sm text-gray-600">Code: {programme.code}</p>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                No Teams
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span className="capitalize">{programme.category} • {programme.subcategory}</span>
                              <span className="capitalize">{programme.section} • {programme.positionType}</span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Required: {programme.requiredParticipants} participant{programme.requiredParticipants !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Programmes with Incomplete Registrations */}
                {(() => {
                  const incompleteRegistrations = programmeRegistrations.filter(p => 
                    p.registrations.length > 0 && p.registrations.length < teams.length
                  );
                  return incompleteRegistrations.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-lg">⚡</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-yellow-900">Programmes with Incomplete Registrations</h3>
                          <p className="text-yellow-700 text-sm">Some teams have not registered for these programmes</p>
                        </div>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            {incompleteRegistrations.length} programme{incompleteRegistrations.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {incompleteRegistrations.map((programme) => {
                          const registeredTeamCodes = programme.registrations.map(r => r.teamCode);
                          const unregisteredTeams = teams.filter(team => !registeredTeamCodes.includes(team.code));
                          
                          return (
                            <div key={programme._id?.toString()} className="bg-white border border-yellow-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-1">{programme.name}</h4>
                                  <p className="text-sm text-gray-600">Code: {programme.code}</p>
                                </div>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {programme.registrations.length}/{teams.length} Teams
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                <span className="capitalize">{programme.category} • {programme.subcategory}</span>
                                <span className="capitalize">{programme.section} • {programme.positionType}</span>
                              </div>
                              
                              {/* Registered Teams */}
                              <div className="mb-2">
                                <p className="text-xs font-medium text-green-700 mb-1">Registered Teams:</p>
                                <div className="flex flex-wrap gap-1">
                                  {programme.registrations.map((registration) => {
                                    const team = teams.find(t => t.code === registration.teamCode);
                                    return (
                                      <span
                                        key={registration.teamCode}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                                        style={{ backgroundColor: team?.color + '20', color: team?.color }}
                                      >
                                        {registration.teamCode}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              {/* Unregistered Teams */}
                              <div>
                                <p className="text-xs font-medium text-red-700 mb-1">Missing Teams:</p>
                                <div className="flex flex-wrap gap-1">
                                  {unregisteredTeams.map((team) => (
                                    <span
                                      key={team.code}
                                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"
                                    >
                                      {team.code}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Programmes with Full Registrations */}
                {(() => {
                  const fullyRegisteredProgrammes = programmeRegistrations.filter(p => 
                    p.registrations.length === teams.length && p.registrations.length > 0
                  );
                  return fullyRegisteredProgrammes.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-lg">✅</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-900">Programmes with Full Registrations</h3>
                          <p className="text-green-700 text-sm">All teams have registered for these programmes</p>
                        </div>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {fullyRegisteredProgrammes.length} programme{fullyRegisteredProgrammes.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {fullyRegisteredProgrammes.map((programme) => (
                          <div key={programme._id?.toString()} className="bg-white border border-green-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">{programme.name}</h4>
                                <p className="text-sm text-gray-600">Code: {programme.code}</p>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                All Teams
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                              <span className="capitalize">{programme.category} • {programme.subcategory}</span>
                              <span className="capitalize">{programme.section} • {programme.positionType}</span>
                            </div>
                            
                            {/* All Registered Teams */}
                            <div>
                              <p className="text-xs font-medium text-green-700 mb-1">All Teams Registered:</p>
                              <div className="flex flex-wrap gap-1">
                                {programme.registrations.map((registration) => {
                                  const team = teams.find(t => t.code === registration.teamCode);
                                  return (
                                    <span
                                      key={registration.teamCode}
                                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                                      style={{ backgroundColor: team?.color + '20', color: team?.color }}
                                    >
                                      {registration.teamCode}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Summary Message */}
                {programmeRegistrations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Programmes Available</h3>
                    <p className="text-gray-500">Create programmes in the Manage tab to see registration status</p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📊</span>
                      <div>
                        <h4 className="font-medium text-blue-900">Registration Summary</h4>
                        <p className="text-blue-700 text-sm">
                          {programmeRegistrations.filter(p => p.registrations.length === teams.length).length} programmes fully registered • {' '}
                          {programmeRegistrations.filter(p => p.registrations.length > 0 && p.registrations.length < teams.length).length} programmes partially registered • {' '}
                          {programmeRegistrations.filter(p => p.registrations.length === 0).length} programmes unregistered
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ShowcaseSection>

            {/* Programme Registrations */}
            <ShowcaseSection title="Programme Registrations">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading registrations...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {programmeRegistrations.map((programme) => (
                    <div key={programme._id?.toString()} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{programme.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className="font-mono bg-gray-200 px-2 py-1 rounded">{programme.code}</span>
                              <span className="capitalize">{programme.section} • {programme.positionType}</span>
                              <span>Required: {programme.requiredParticipants} participants</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{programme.registrations.length}</div>
                            <div className="text-sm text-gray-500">Team{programme.registrations.length !== 1 ? 's' : ''} Registered</div>
                          </div>
                        </div>
                      </div>

                      {programme.registrations.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <div className="text-4xl mb-2">📝</div>
                          <p>No teams registered for this programme yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {programme.registrations.map((registration) => (
                            <div key={registration._id?.toString()} className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                  <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: registration.teamInfo?.color || '#6B7280' }}
                                  >
                                    {registration.teamCode}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{registration.teamInfo?.name || registration.teamCode}</h4>
                                    <p className="text-sm text-gray-600">{registration.teamInfo?.description}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    {registration.participants.length} Participant{registration.participants.length !== 1 ? 's' : ''}
                                  </div>
                                  <div className="text-xs text-gray-500 capitalize">{registration.status}</div>
                                </div>
                              </div>

                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Participants:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {registration.participants.map((chestNumber, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                                    >
                                      {chestNumber}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {programmeRegistrations.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📋</div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Programmes Available</h3>
                      <p className="text-gray-500">Add programmes first to see registrations.</p>
                    </div>
                  )}
                </div>
              )}
            </ShowcaseSection>
          </>
        )}
      </div>

      {/* Migration Confirmation Modal */}
      {showMigrationModal && migrationProgramme && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Position Type Migration
            </h3>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                You are about to migrate:
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold">{migrationProgramme.name}</div>
                <div className="text-sm text-gray-600">Code: {migrationProgramme.code}</div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                From: <span className="font-semibold text-red-600">General</span> → 
                To: <span className="font-semibold text-green-600 capitalize">{migrationTarget}</span>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>What this means:</strong><br/>
                {migrationTarget === 'individual' 
                  ? 'This programme will use individual marking - each participant gets their own marks based on the section rules (Senior/Junior/Sub-Junior sections assign marks to individuals).'
                  : 'This programme will use team marking - the entire team gets the same marks (General section assigns marks to teams).'
                }
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleMigrateProgramme(migrationProgramme, migrationTarget)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm Migration
              </button>
              <button
                onClick={() => {
                  setShowMigrationModal(false);
                  setMigrationProgramme(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}