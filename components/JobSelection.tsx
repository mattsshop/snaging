
import React, { useState } from 'react';
import { Job } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface JobSelectionProps {
  jobs: Job[];
  onSelectJob: (id: string) => void;
  onAddJob: (name: string) => void;
  onDeleteJob: (id: string) => void;
}

const JobSelection: React.FC<JobSelectionProps> = ({ jobs, onSelectJob, onAddJob, onDeleteJob }) => {
  const [newJobName, setNewJobName] = useState('');

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (newJobName.trim()) {
      onAddJob(newJobName.trim());
      setNewJobName('');
    }
  };
  
  const handleDelete = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation(); // Prevent job selection when deleting
    if (window.confirm('Are you sure you want to delete this job and all its items? This action cannot be undone.')) {
        onDeleteJob(jobId);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-center">Select or Create a Job</h2>
      <form onSubmit={handleAddJob} className="flex gap-2">
        <input
          type="text"
          value={newJobName}
          onChange={(e) => setNewJobName(e.target.value)}
          placeholder="Enter new job name"
          className="flex-grow bg-brand-light-gray border-gray-600 rounded-md shadow-sm p-3 text-white focus:border-brand-blue focus:ring focus:ring-brand-blue focus:ring-opacity-50"
          aria-label="New job name"
        />
        <button type="submit" className="bg-brand-blue text-white font-bold p-3 rounded-md shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform" aria-label="Add new job">
          <PlusIcon className="h-6 w-6" />
        </button>
      </form>

      {jobs.length === 0 ? (
        <div className="text-center py-10 px-4 text-gray-400">
          <p>No jobs found.</p>
          <p className="text-sm">Create your first job above to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map(job => (
            <li 
              key={job.id} 
              onClick={() => onSelectJob(job.id)}
              className="bg-brand-gray rounded-lg shadow-lg flex items-center justify-between p-4 cursor-pointer hover:bg-brand-light-gray transition-colors"
            >
              <div>
                <p className="font-semibold text-lg">{job.name}</p>
                <p className="text-sm text-gray-400">{job.items.length} items</p>
              </div>
              <button 
                onClick={(e) => handleDelete(e, job.id)}
                className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/50 rounded-full transition-colors"
                aria-label={`Delete job ${job.name}`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JobSelection;
