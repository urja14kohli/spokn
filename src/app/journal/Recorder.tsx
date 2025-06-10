import React, { useState, useEffect } from 'react';
import MicRecorder from 'mic-recorder-to-mp3';

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

interface RecorderProps {
  onTranscriptionComplete: (transcript: string) => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

const Recorder: React.FC<RecorderProps> = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [blobURL, setBlobURL] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');

  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const windowWithSpeech = window as WindowWithSpeechRecognition;
      const SpeechRecognition = windowWithSpeech.webkitSpeechRecognition || windowWithSpeech.SpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';
        recognitionInstance.maxAlternatives = 1;
        
        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let newFinalTranscript = finalTranscript;
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptSegment = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newFinalTranscript += transcriptSegment + ' ';
              setFinalTranscript(newFinalTranscript);
            } else {
              interimTranscript += transcriptSegment;
            }
          }
          
          // Update the display transcript
          setTranscript(newFinalTranscript + interimTranscript);
        };
        
        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.log('Speech recognition error:', event.error);
          
          // Handle different error types
          if (event.error === 'aborted') {
            // User intentionally stopped, don't restart
            console.log('Recognition aborted by user');
            setIsListening(false);
            return;
          }
          
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            // Permission denied, don't restart
            console.log('Permission denied for speech recognition');
            setIsListening(false);
            return;
          }
          
          // For recoverable errors, try to restart if still recording
          if (isRecording && (event.error === 'no-speech' || event.error === 'network' || event.error === 'audio-capture')) {
            console.log('Attempting to restart recognition after recoverable error:', event.error);
            setTimeout(() => {
              if (isRecording) {
                try {
                  recognitionInstance.start();
                  console.log('Recognition restarted successfully');
                } catch (e) {
                  console.log('Failed to restart recognition:', e);
                }
              }
            }, 1000);
          }
        };
        
        recognitionInstance.onend = () => {
          console.log('Recognition ended, isRecording:', isRecording);
          
          // Only restart if we're still recording and it wasn't intentionally stopped
          if (isRecording) {
            console.log('Attempting to restart recognition after end event');
            setTimeout(() => {
              if (isRecording) {
                try {
                  recognitionInstance.start();
                  console.log('Recognition restarted after end event');
                } catch (e) {
                  console.log('Failed to restart after end event:', e);
                  // Try one more time with a longer delay
                  setTimeout(() => {
                    if (isRecording) {
                      try {
                        recognitionInstance.start();
                        console.log('Recognition restarted on second attempt');
                      } catch (e2) {
                        console.log('Final restart attempt failed:', e2);
                        setIsListening(false);
                      }
                    }
                  }, 2000);
                }
              }
            }, 100);
          } else {
            setIsListening(false);
          }
        };
        
        recognitionInstance.onstart = () => {
          console.log('Recognition started successfully');
          setIsListening(true);
        };
        
        setRecognition(recognitionInstance);
      }
    }

    // Check if microphone access is blocked
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        setIsBlocked(false);
      })
      .catch(() => {
        setIsBlocked(true);
      });
  }, [isRecording, finalTranscript]);

  const startRecording = () => {
    if (isBlocked) {
      console.log('Permission Denied');
    } else {
      setTranscript(''); // Clear previous transcript
      setFinalTranscript(''); // Clear final transcript
      
      Mp3Recorder.start()
        .then(() => {
          setIsRecording(true);
          setTimer(0);
          const interval = setInterval(() => {
            setTimer((prev) => prev + 1);
          }, 1000);
          setTimerInterval(interval);
          
          // Start speech recognition with better error handling
          if (recognition) {
            try {
              recognition.start();
              console.log('Starting speech recognition...');
            } catch (e) {
              console.log('Failed to start speech recognition:', e);
              // Recognition might already be running, that's okay
            }
          }
        })
        .catch((e: Error) => console.error('Failed to start audio recording:', e));
    }
  };

  const stopRecording = () => {
    // Stop speech recognition first
    if (recognition && isListening) {
      try {
        recognition.stop();
        console.log('Stopping speech recognition...');
        setIsListening(false);
      } catch (e) {
        console.log('Error stopping speech recognition:', e);
      }
    }

    Mp3Recorder.stop()
      .getMp3()
      .then(([, blob]: [ArrayBuffer, Blob]) => {
        const blobURL = URL.createObjectURL(blob);
        setBlobURL(blobURL);
        setIsRecording(false);
        if (timerInterval) clearInterval(timerInterval);

        // Send the final transcript if we have one
        if (finalTranscript.trim()) {
          console.log('Sending final transcript:', finalTranscript.trim());
          onTranscriptionComplete(finalTranscript.trim());
        } else if (transcript.trim()) {
          // Fallback to current transcript if no final transcript
          console.log('Sending current transcript:', transcript.trim());
          onTranscriptionComplete(transcript.trim());
        }
      })
      .catch((e: Error) => console.error('Failed to stop audio recording:', e));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full backdrop-blur-lg bg-card-gradient border border-white/30 rounded-2xl shadow-glass p-8 flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-6 text-text-primary font-space underline">Voice Recorder</h2>
      {isBlocked ? (
        <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-300">Microphone access is blocked. Please allow access to use the recorder.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-dark/20 rounded-xl border border-white/10">
            <p className="text-3xl font-mono text-text-primary font-bold text-center">
              {formatTime(timer)}
            </p>
          </div>
          
          {isListening && (
            <div className="mb-4 flex items-center gap-2 bg-secondary/10 border border-secondary/30 rounded-lg px-4 py-2">
              <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
              <p className="text-secondary font-medium">Listening continuously...</p>
            </div>
          )}
          
          {transcript && (
            <div className="mb-6 p-6 bg-gray-50 backdrop-blur-sm rounded-xl w-full max-h-40 overflow-y-auto border border-gray-200 shadow-md">
              <p className="text-sm text-gray-600 mb-3 font-medium">Live Transcript:</p>
              <pre className="text-dark-200 font-mono text-sm leading-loose whitespace-pre-wrap break-words">
                {transcript}
              </pre>
            </div>
          )}
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-8 py-4 rounded-xl text-lg font-bold shadow-button transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 transform hover:scale-105 ${
              isRecording 
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-glow' 
                : 'bg-button-gradient hover:shadow-glow text-dark shadow-button'
            }`}
          >
            {isRecording ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                Stop Recording
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Start Recording
              </span>
            )}
          </button>
          
          {!recognition && (
            <div className="text-center mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="text-accent text-sm">
                Note: Speech recognition not supported in this browser. Consider using Chrome or Edge.
              </p>
            </div>
          )}
          
          {blobURL && (
            <div className="mt-6 w-full flex flex-col items-center">
              <audio 
                src={blobURL} 
                controls 
                className="w-full rounded-lg shadow-glass bg-dark/20" 
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Recorder;
