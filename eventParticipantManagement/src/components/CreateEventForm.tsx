import React, { useState } from 'react';
import { X, Calendar, FileText, Image } from 'lucide-react';

interface CreateEventFormProps {
  onClose: () => void;
  onCreate: (eventData: {
    name: string;
    description: string;
    image_url?: string;
  }) => void;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Clear field-specific error
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    }

    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (error) {
      console.log(error)
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      ...(formData.image_url.trim() && { image_url: formData.image_url.trim() }),
    };

    onCreate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Create New Event</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Event Name *
        </label>
        <div className="relative">
          <Calendar className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter event name"
          />
        </div>
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <div className="relative">
          <FileText className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
          <textarea
            id="description"
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe your event"
          />
        </div>
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
          Image URL (Optional)
        </label>
        <div className="relative">
          <Image className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
          <input
            id="image_url"
            name="image_url"
            type="url"
            value={formData.image_url}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.image_url ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        {errors.image_url && (
          <p className="mt-1 text-sm text-red-600">{errors.image_url}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Event
        </button>
      </div>
    </form>
  );
};

export default CreateEventForm;