import React, { useState } from 'react';
import { auth, isConfigured } from '../services/firebaseService';

const FirebaseConfigWarning = () => {
    if (isConfigured) {
        return null;
    }
    return (
        <div className="bg-yellow-900/50 border-2 border-yellow-500 text-yellow-200 p-4 rounded-lg mb-6 text-sm">
            <h3 className="font-bold text-lg mb-2">Backend Not Configured</h3>
            <p className="mb-2">
                This app requires a Firebase backend to save data and manage users. Please follow these steps to connect your own free Firebase project.
            </p>
            <ol className="list-decimal list-inside space-y-1">
                <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Firebase Console</a> and create a project.</li>
                <li>In <strong>Project Settings</strong> &gt; <strong>General</strong>, create a new Web App.</li>
                <li>Copy the `firebaseConfig` object and paste its values into the <strong>`firebase/config.ts`</strong> file.</li>
                <li>Go to the <strong>Authentication</strong> section, click <strong>Sign-in method</strong>, and enable the <strong>Email/Password</strong> provider.</li>
            </ol>
        </div>
    )
}


const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
        setError("Setup incomplete. Please configure Firebase using the instructions above.");
        return;
    }
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        await auth.createUserWithEmailAndPassword(email, password);
      }
    } catch (err: any) {
        switch (err.code) {
            case 'auth/user-not-found':
                setError('No account found with this email.');
                break;
            case 'auth/wrong-password':
                setError('Incorrect password. Please try again.');
                break;
            case 'auth/email-already-in-use':
                setError('This email is already registered. Please log in.');
                break;
            case 'auth/weak-password':
                setError('Password should be at least 6 characters long.');
                break;
            default:
                setError(`Authentication failed. Please check the following: 
                1) Your credentials in firebase/config.ts are correct. 
                2) The Email/Password provider is enabled in Firebase. 
                3) This app's domain has been added to the "Authorized domains" list in your Firebase Authentication settings.`);
                break;
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm mx-auto bg-brand-gray p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-center text-gray-400 mb-8">{isLogin ? 'Sign in to access your projects' : 'Get started with a free account'}</p>
        
        <FirebaseConfigWarning />

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            required
            className="w-full bg-brand-light-gray border-gray-600 rounded-md shadow-sm p-3 text-white focus:border-brand-blue focus:ring focus:ring-brand-blue focus:ring-opacity-50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full bg-brand-light-gray border-gray-600 rounded-md shadow-sm p-3 text-white focus:border-brand-blue focus:ring focus:ring-brand-blue focus:ring-opacity-50"
          />
          
          {error && <p className="text-red-400 text-sm text-center whitespace-pre-line">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-blue text-white font-semibold rounded-lg disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        
        <p className="text-center text-gray-400 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setError('');
            }}
            className="font-semibold text-brand-blue hover:underline ml-2"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;