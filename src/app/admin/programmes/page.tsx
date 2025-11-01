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
    setFormData({
      _id: programme._id?.toString() || '',
      code: programme.code || '',
      name: programme.name || '',
      category: programme.category as 'arts' | 'sports' | '',
      subcategory: programme.subcategory as 'stage' | 'non-stage' | '' || '',
      section: programme.section as 'senior' | 'junior' | 'sub-junior' | 'general' | '',
      positionType: programme.positionType as 'individual' | 'group' | 'general' | '',
      requiredParticipants: programme.requiredParticipants || 1,
      maxParticipants: programme.maxParticipants?.toString() || ''
    });
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
    return programmes.some(programme => 
      programme.code.toLowerCase() === code.toLowerCase() && 
      (!isEditMode || programme._id?.toString() !== formData._id)
    );
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

    // Check for duplicate program code
    if (isProgramCodeExists(formData.code)) {
      alert('A program with this code already exists');
      return;
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
            <ShowcaseSection title={isEditMode ? 'Edit Programme' : 'Add New Programme'} id="programme-form">
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
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Participants
                    </label>
                    <input
                      type="number"
                      name="requiredParticipants"
                      value={formData.requiredParticipants}
                      onChange={handleInputChange}
                      min="1"
                      max="45"
                      placeholder="Number of participants"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                      required
                    />
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
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              {programme.requiredParticipants || 1} required
                            </span>
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
                  <p className="text-2xl font-bold text-gray-900">25</p>
                  <p className="text-sm text-gray-600">Active programmes</p>
                </div>

                <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-3xl mb-3">👤</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Individual</h3>
                  <p className="text-2xl font-bold text-gray-900">15</p>
                  <p className="text-sm text-gray-600">Individual competitions</p>
                </div>

                <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-3xl mb-3">👥</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Group</h3>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-gray-600">Group competitions</p>
                </div>

                <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-3xl mb-3">🌟</div>
                  <h3 className="font-semibold text-gray-900 mb-2">General</h3>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                  <p className="text-sm text-gray-600">General events</p>
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
    </>
  );
}