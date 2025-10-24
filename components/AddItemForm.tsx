import React, { useState, useRef, useEffect } from 'react';
import { PunchlistItem, PunchlistItemCategory } from '../types';
import { CATEGORIES } from '../constants';
import { parseVoiceCommand } from '../services/geminiService';
import { CameraIcon, MicrophoneIcon } from './icons';

interface AddItemFormProps {
  onAddItem: (item: Omit<PunchlistItem, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

// FIX: Add type declarations for the browser's SpeechRecognition API.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Check for SpeechRecognition API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onAddItem, onCancel }) => {
  const [photo, setPhoto] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<PunchlistItemCategory>(CATEGORIES[0]);
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Speech recognition failed. Please try again.';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please make sure your microphone is working and you are speaking clearly.';
          break;
        case 'audio-capture':
          errorMessage = 'Audio capture failed. Please check your microphone connection and permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings to use this feature.';
          break;
        case 'network':
            errorMessage = 'A network error occurred with the speech service. Please check your internet connection.';
            break;
      }
      setError(errorMessage);
      setIsListening(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      if (isListening) { // Only stop processing if it wasn't a natural end
        setIsListening(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const handleVoiceCommand = async (transcript: string) => {
    setIsProcessing(true);
    setError('');
    const parsedData = await parseVoiceCommand(transcript);
    if (parsedData) {
      setRoom(parsedData.room);
      setDescription(parsedData.description);
      setCategory(parsedData.category);
    } else {
      setError('Could not understand the command. Please try again or fill manually.');
      // Keep transcript in description for manual correction
      setDescription(prev => prev || transcript);
    }
    setIsProcessing(false);
  };

  const toggleListen = () => {
    if (!recognition) {
      setError("Speech recognition is not supported in your browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      setError('');
      recognition.start();
    }
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo || !room || !description) {
      setError('Photo, Room, and Description are required.');
      return;
    }
    onAddItem({ photo, room, description, category });
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className="relative w-full h-64 bg-brand-gray rounded-lg flex items-center justify-center border-2 border-dashed border-brand-light-gray cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handlePhotoCapture}
          className="hidden"
        />
        {photo ? (
          <img src={photo} alt="Preview" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="text-center text-gray-400">
            <CameraIcon className="h-12 w-12 mx-auto" />
            <p className="mt-2">Tap to take a photo</p>
          </div>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Voice Command</label>
        <div className="flex items-center gap-4">
            <button
                type="button"
                onClick={toggleListen}
                className={`p-4 rounded-full transition-colors ${isListening ? 'bg-red-600 animate-pulse' : 'bg-brand-blue'}`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
                <MicrophoneIcon className="h-8 w-8 text-white" />
            </button>
            <div className="text-gray-400 flex-1">
                {isListening ? "Listening..." : (isProcessing ? "Thinking..." : "Tap mic and say 'Room [number], [description], contractor [trade]'")}
            </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="room" className="block text-sm font-medium text-gray-300">Room / Location</label>
          <input type="text" id="room" value={room} onChange={(e) => setRoom(e.target.value)} className="mt-1 block w-full bg-brand-light-gray border-gray-600 rounded-md shadow-sm p-2 text-white focus:border-brand-blue focus:ring focus:ring-brand-blue focus:ring-opacity-50" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full bg-brand-light-gray border-gray-600 rounded-md shadow-sm p-2 text-white focus:border-brand-blue focus:ring focus:ring-brand-blue focus:ring-opacity-50" />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value as PunchlistItemCategory)} className="mt-1 block w-full bg-brand-light-gray border-gray-600 rounded-md shadow-sm p-2 text-white focus:border-brand-blue focus:ring focus:ring-brand-blue focus:ring-opacity-50">
            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>
      
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-dark border-t border-brand-light-gray flex gap-4">
        <button type="button" onClick={onCancel} className="flex-1 py-3 bg-brand-gray text-white font-semibold rounded-lg">Cancel</button>
        <button type="submit" className="flex-1 py-3 bg-brand-blue text-white font-semibold rounded-lg">Save Item</button>
      </div>
    </form>
  );
};

export default AddItemForm;