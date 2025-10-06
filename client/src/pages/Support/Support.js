import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  HeadphonesIcon,
  MessageSquare,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Shield,
  UserCheck
} from 'lucide-react';
import { supportAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Support = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch support tickets
  const { data: ticketsResponse, isLoading, error } = useQuery(
    ['support-tickets', searchTerm, statusFilter],
    () => supportAPI.getAll({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined
    })
  );

  const tickets = ticketsResponse?.data || [];

  // Update ticket status mutation
  const updateStatusMutation = useMutation(
    ({ id, status }) => supportAPI.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('support-tickets');
        toast.success('Ticket status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update ticket status');
      }
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <X className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading support tickets</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  const openTickets = (tickets && Array.isArray(tickets)) 
    ? tickets.filter(t => t.status === 'open').length 
    : 0;
  const inProgressTickets = (tickets && Array.isArray(tickets)) 
    ? tickets.filter(t => t.status === 'in_progress').length 
    : 0;
  const resolvedTickets = (tickets && Array.isArray(tickets)) 
    ? tickets.filter(t => t.status === 'resolved').length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            {user?.role === 'admin' ? (
              <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                <Shield className="h-3 w-3 mr-1" />
                Admin View
              </div>
            ) : (
              <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                <UserCheck className="h-3 w-3 mr-1" />
                My Tickets
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-700">
            {user?.role === 'admin' 
              ? 'Manage all customer support requests and tickets' 
              : 'View and manage your support tickets'
            }
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-blue-500">
                  <HeadphonesIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tickets
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {tickets?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-red-500">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Open
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {openTickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-yellow-500">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Progress
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {inProgressTickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-green-500">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Resolved
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {resolvedTickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <button className="btn btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Support Tickets ({tickets?.length || 0})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {(tickets && Array.isArray(tickets)) ? tickets.map((ticket) => (
            <li key={ticket.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {ticket.ticket_number}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {ticket.users?.first_name} {ticket.users?.last_name}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{ticket.subject}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                    <span className="mr-1">{getStatusIcon(ticket.status)}</span>
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority.toUpperCase()}
                  </span>
                  <div className="flex space-x-2">
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: ticket.id, status: e.target.value })}
                      className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          )) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No support tickets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No tickets match your current filter.
              </p>
            </div>
          )}
        </ul>

        {tickets?.length === 0 && (
          <div className="text-center py-12">
            <HeadphonesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'admin' 
                ? 'No tickets match your current filter.' 
                : 'You haven\'t created any support tickets yet.'
              }
            </p>
            {user?.role !== 'admin' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Ticket
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Ticket Modal */}
      {showAddModal && (
        <AddTicketModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries('support-tickets');
            setShowAddModal(false);
          }}
        />
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
};

// Add Ticket Modal
const AddTicketModal = ({ onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const createTicketMutation = useMutation(
    (data) => supportAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Ticket created successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create ticket');
      }
    }
  );

  const onSubmit = (data) => {
    createTicketMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Support Ticket</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject *</label>
              <input
                {...register('subject', { required: 'Subject is required' })}
                className="input mt-1"
                placeholder="Enter ticket subject"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="input mt-1"
                placeholder="Describe your issue in detail..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select {...register('priority')} className="input mt-1">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTicketMutation.isLoading}
                className="btn btn-primary"
              >
                {createTicketMutation.isLoading ? (
                  <div className="loading-spinner h-4 w-4"></div>
                ) : (
                  'Create Ticket'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Ticket Details Modal
const TicketDetailsModal = ({ ticket, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Ticket Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Ticket Number</label>
                <p className="text-sm text-gray-900">{ticket.ticket_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-sm text-gray-900 capitalize">{ticket.status.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Priority</label>
                <p className="text-sm text-gray-900 capitalize">{ticket.priority}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm text-gray-900">{new Date(ticket.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Subject</label>
              <p className="text-sm text-gray-900">{ticket.subject}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-sm text-gray-900">{ticket.description}</p>
            </div>

            {ticket.resolution && (
              <div>
                <label className="text-sm font-medium text-gray-500">Resolution</label>
                <p className="text-sm text-gray-900">{ticket.resolution}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="btn btn-outline"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
