import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PunchlistItem, PunchlistItemCategory } from '../types';
import { CSI_DIVISIONS } from '../constants';
import { parseVoiceCommand } from '../services/geminiService';
import { CameraIcon, MicrophoneIcon } from './icons';

// Type declarations for the browser's SpeechRecognition API.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }
  interface SpeechRecognitionErrorEvent extends Event {
      error: string;
      message: string;
  }
}

// Check for SpeechRecognition API and configure it for continuous input
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = true;
  recognition.lang = 'en-US';
  recognition.interimResults = true;
}

interface AddItemFormProps {
  onAddItem: (item: Omit<PunchlistItem, 'id' | 'createdAt' | 'photo'>, photoFile: File) => void;
  onCancel: () => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onAddItem, onCancel }) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<PunchlistItemCategory>(CSI_DIVISIONS[0]);
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [liveTranscript, setLiveTranscript] = useState('');
  const transcriptRef = useRef('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isProcessingRef = useRef(isProcessing);
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const handleVoiceCommand = useCallback(async (transcript: string) => {
    if (!transcript) return;
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
  }, []);

  useEffect(() => {
    if (!recognition) return;

    const handleResult = (event: SpeechRecognitionEvent) => {
      const fullTranscript = Array.from(event.results).map(r => r[0].transcript).join('');
      transcriptRef.current = fullTranscript;
      setLiveTranscript(fullTranscript);
    };

    const handleEnd = () => {
      setIsListening(false);
      // Process the final transcript only if not already processing from a previous command
      if (!isProcessingRef.current) {
         handleVoiceCommand(transcriptRef.current.trim());
      }
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Speech recognition failed. Please try again.';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please speak clearly.';
          break;
        case 'audio-capture':
          errorMessage = 'Audio capture failed. Check microphone connection and permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow it in browser settings.';
          break;
        case 'network':
            errorMessage = 'A network error occurred. Please check your internet connection.';
            break;
      }
      setError(errorMessage);
      setIsListening(false);
      setIsProcessing(false);
      setLiveTranscript('');
      transcriptRef.current = '';
    };

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('end', handleEnd);
    recognition.addEventListener('error', handleError);

    return () => {
        recognition.removeEventListener('result', handleResult);
        recognition.removeEventListener('end', handleEnd);
        recognition.removeEventListener('error', handleError);
    };
  }, [handleVoiceCommand]);

  const toggleListen = () => {
    if (!recognition) {
      setError("Speech recognition is not supported in your browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      transcriptRef.current = '';
      setLiveTranscript('');
      setRoom('');
      setDescription('');
      setError('');
      setIsListening(true);
      recognition.start();
    }
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile || !room || !description) {
      setError('Photo, Room, and Description are required.');
      return;
    }
    onAddItem({ room, description, category }, photoFile);
    onCancel();
  };

  const getInstructionText = () => {
    if (isListening) return "Listening... Tap mic to stop.";
    if (isProcessing) return "Thinking...";
    return "Tap mic to describe the snag.";
  }

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
        {photoPreview ? (
          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
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
                className={`p-4 rounded-full transition-colors ${isListening ? 'bg-red-600 animate-pulse' : 'bg-brand-blue'} disabled:bg-gray-500`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
                disabled={isProcessing}
            >
                <MicrophoneIcon className="h-8 w-8 text-white" />
            </button>
            <div className="text-gray-400 flex-1">
                {getInstructionText()}
            </div>
        </div>
         {(liveTranscript || isListening) && (
          <div className="mt-4 p-3 bg-brand-light-gray rounded-md min-h-[4em] border border-gray-600">
              <p className="text-white italic">{liveTranscript || '...'}</p>
          </div>
         )}
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
            {CSI_DIVISIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>
      
      {error && <p className="text-red-400 text-sm text-center p-2 bg-red-900/50 rounded-md">{error}</p>}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-dark border-t border-brand-light-gray flex gap-4">
        <button type="button" onClick={onCancel} className="flex-1 py-3 bg-brand-gray text-white font-semibold rounded-lg">Cancel</button>
        <button type="submit" className="flex-1 py-3 bg-brand-blue text-white font-semibold rounded-lg">Save Item</button>
      </div>
    </form>
  );
};

export default AddItemForm;