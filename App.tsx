import React, { useState, useEffect } from 'react';
import Punchlist from './components/Punchlist';
import AddItemForm from './components/AddItemForm';
import { Header } from './components/Header';
import { PlusIcon, LoaderIcon } from './components/icons';
import JobSelection from './components/JobSelection';
import Auth from './components/Auth';
import { useAuth, User } from './hooks/useAuth';
import { PunchlistItem, Job } from './types';
import {
  getJobs,
  addJob as addJobToFirebase,
  deleteJob as deleteJobFromFirebase,
  addItem as addItemToFirebase,
  deleteItem as deleteItemFromFirebase
} from './services/firebaseService';

type View = 'list' | 'add';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [view, setView] = useState<View>('list');
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      setIsLoadingData(true);
      const unsubscribe = getJobs(user.uid, (fetchedJobs) => {
        setJobs(fetchedJobs);
        setIsLoadingData(false);
      });
      return () => unsubscribe();
    } else {
      setJobs([]);
      setSelectedJobId(null);
      setIsLoadingData(false);
    }
  }, [user]);
  
  const selectedJob = jobs.find(job => job.id === selectedJobId);

  const addJob = async (name: string) => {
    if (!user) return;
    await addJobToFirebase(name, user.uid);
  };
  
  const deleteJob = async (id: string) => {
    await deleteJobFromFirebase(id);
    if(selectedJobId === id) {
        setSelectedJobId(null);
    }
  };

  const addItem = async (item: Omit<PunchlistItem, 'id' | 'createdAt' | 'photo'>, photoFile: File) => {
    if (!selectedJobId) return;
    await addItemToFirebase(selectedJobId, item, photoFile);
  };

  const deleteItem = async (itemId: string) => {
    if (!selectedJobId) return;
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteItemFromFirebase(selectedJobId, itemId);
    }
  };
  
  const handleSelectJob = (id: string) => {
    setSelectedJobId(id);
    setView('list');
  };

  const handleBackToJobs = () => {
    setSelectedJobId(null);
  };

  if (authLoading || (user && isLoadingData)) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center">
        <LoaderIcon className="h-12 w-12 animate-spin text-brand-blue" />
        <p className="mt-4 text-lg">Loading your projects...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }
  
  if (!selectedJob) {
      return (
          <div className="min-h-screen bg-brand-dark font-sans">
              <Header user={user} />
              <main>
                <JobSelection jobs={jobs} onSelectJob={handleSelectJob} onAddJob={addJob} onDeleteJob={deleteJob} />
              </main>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-brand-dark font-sans">
      <Header jobName={selectedJob.name} onBack={handleBackToJobs} user={user} />
      <main className="p-4 pb-24">
        {view === 'list' ? (
          <Punchlist items={selectedJob.items} onDeleteItem={deleteItem} jobName={selectedJob.name} />
        ) : (
          <AddItemForm onAddItem={addItem} onCancel={() => setView('list')} />
        )}
      </main>

      {view === 'list' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-dark border-t border-brand-light-gray flex justify-center">
          <button
            onClick={() => setView('add')}
            className="bg-brand-blue text-white font-bold py-4 px-8 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform"
          >
            <PlusIcon className="h-6 w-6 mr-2" />
            Add New Snag
          </button>
        </div>
      )}
    </div>
  );
};

export default App;