import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  Star,
  MessageSquare,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  X
} from 'lucide-react';
import { feedbackAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Feedback = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch feedback
  const { data: feedbackResponse, isLoading, error } = useQuery(
    ['feedback', searchTerm, ratingFilter],
    () => feedbackAPI.getAll({
      search: searchTerm,
      rating: ratingFilter !== 'all' ? ratingFilter : undefined
    })
  );

  const feedback = feedbackResponse?.data || [];

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Error loading feedback</div>
        <div className="text-gray-500 mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  const averageRating = feedback?.length > 0 
    ? (feedback && Array.isArray(feedback) 
        ? (feedback.reduce((sum, item) => sum + (item.rating || 0), 0) / feedback.length).toFixed(1)
        : '0.0'
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage customer feedback and reviews
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Feedback
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
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Feedback
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {feedback?.length || 0}
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
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Rating
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {averageRating}
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
                  <ThumbsUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Positive (4-5★)
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {(feedback && Array.isArray(feedback)) 
                      ? feedback.filter(f => f.rating >= 4).length 
                      : 0}
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
                  <ThumbsDown className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Negative (1-2★)
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {(feedback && Array.isArray(feedback)) 
                      ? feedback.filter(f => f.rating <= 2).length 
                      : 0}
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
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <button className="btn btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {(feedback && Array.isArray(feedback)) ? feedback.map((item) => (
          <div key={item.id} className="card">
            <div className="card-content">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.users?.first_name} {item.users?.last_name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {getRatingStars(item.rating || 0)}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(item.rating || 0)}`}>
                          {item.rating || 0} stars
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Order #{item.order_number || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {item.comment && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-700">{item.comment}</p>
                    </div>
                  )}
                  <div className="mt-3 flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {error ? 'Error loading feedback. Please try again.' : 'No feedback matches your current filter.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Feedback Modal */}
      {showAddModal && (
        <AddFeedbackModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries('feedback');
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

// Add Feedback Modal
const AddFeedbackModal = ({ onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const createFeedbackMutation = useMutation(
    (data) => feedbackAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Feedback added successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add feedback');
      }
    }
  );

  const onSubmit = (data) => {
    createFeedbackMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Feedback</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Rating *</label>
              <select
                {...register('rating', { required: 'Rating is required' })}
                className="input mt-1"
              >
                <option value="">Select rating</option>
                <option value="1">1 Star - Poor</option>
                <option value="2">2 Stars - Fair</option>
                <option value="3">3 Stars - Good</option>
                <option value="4">4 Stars - Very Good</option>
                <option value="5">5 Stars - Excellent</option>
              </select>
              {errors.rating && (
                <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Comment</label>
              <textarea
                {...register('comment')}
                rows={4}
                className="input mt-1"
                placeholder="Share your feedback..."
              />
            </div>

            <div className="flex items-center">
              <input
                {...register('is_public')}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Make this feedback public
              </label>
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
                disabled={createFeedbackMutation.isLoading}
                className="btn btn-primary"
              >
                {createFeedbackMutation.isLoading ? (
                  <div className="loading-spinner h-4 w-4"></div>
                ) : (
                  'Add Feedback'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
