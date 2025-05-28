import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const placeholderTexts = [
    "Send an email to John",
    "Remind me to buy groceries", 
    "Add task: finish project",
    "Schedule call tomorrow at 4 PM"
  ];

  // Typewriter animation for placeholder text
  useEffect(() => {
    const currentText = placeholderTexts[currentPlaceholder];
    let currentIndex = 0;
    setIsTyping(true);
    setDisplayedText('');

    const typeInterval = setInterval(() => {
      if (currentIndex <= currentText.length) {
        setDisplayedText(currentText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        
        // Wait 2 seconds then move to next placeholder
        setTimeout(() => {
          setCurrentPlaceholder((prev) => (prev + 1) % placeholderTexts.length);
        }, 2000);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, [currentPlaceholder]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Recognition Error",
          description: "Speech recognition failed. Please try again or use manual input.",
          variant: "destructive"
        });
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [toast]);

  const startRecording = async () => {
    try {
      if (recognitionRef.current) {
        setTranscript('');
        setIsRecording(true);
        recognitionRef.current.start();
        
        toast({
          title: "Listening...",
          description: "Speak your command now",
        });
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not start voice recording. Please check microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const retryTranscription = () => {
    setTranscript('');
    if (!isRecording) {
      startRecording();
    }
  };

  const sendCommand = async (command: string) => {
    if (!command.trim()) {
      toast({
        title: "Empty Command",
        description: "Please provide a command to send.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Clean and format the command
      const cleanCommand = command.toLowerCase().trim();
      
      // n8n webhook URL
      const webhookUrl = 'https://mochamadarif.app.n8n.cloud/webhook-test/c6846426-c38d-4230-979f-1cbed0867bed';
      
      console.log("Sending command to n8n webhook:", cleanCommand);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: cleanCommand,
          timestamp: new Date().toISOString(),
          source: transcript ? 'voice' : 'manual'
        }),
      });

      if (response.ok) {
        const result = await response.text();
        console.log("n8n webhook response:", result);
        
        toast({
          title: "Command Sent",
          description: `Successfully processed: "${cleanCommand}"`,
        });
        setTranscript('');
        setManualInput('');
      } else {
        throw new Error(`Webhook response: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending command:', error);
      toast({
        title: "Error",
        description: "Failed to send command to n8n webhook. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendTranscript = () => {
    sendCommand(transcript);
  };

  const handleSendManual = () => {
    sendCommand(manualInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendManual();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Halftone Background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0 animate-wave"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px',
            width: '150%',
          }}
        />
        <div 
          className="absolute inset-0 animate-wave"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            backgroundPosition: '10px 10px, 30px 30px',
            width: '150%',
            animationDelay: '-2s',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-poppins text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Voice Assistant
          </h1>
          <p className="font-sf-pro text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Speak your command or type it below. I'll help you with emails, reminders, scheduling, and tasks.
          </p>
        </div>

        {/* Voice Interface */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
          
          {/* Microphone Button */}
          <div className="mb-8">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-32 h-32 rounded-full border-4 transition-all duration-300 ${
                isRecording 
                  ? 'bg-white text-black border-white animate-pulse-glow' 
                  : 'bg-black text-white border-white hover:bg-white hover:text-black'
              }`}
              disabled={isProcessing}
            >
              {isRecording ? (
                <MicOff className="w-12 h-12" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
            </Button>
          </div>

          {/* Status Text */}
          <div className="mb-6 h-8">
            <p className="font-sf-pro text-lg text-center">
              {isRecording && (
                <span className="text-green-400 animate-pulse">● Listening...</span>
              )}
              {isProcessing && (
                <span className="text-blue-400">Processing command...</span>
              )}
              {!isRecording && !isProcessing && (
                <span className="text-gray-400">Tap microphone to start</span>
              )}
            </p>
          </div>

          {/* Transcription Display */}
          {transcript && (
            <div className="w-full max-w-2xl mb-6">
              <label className="font-sf-pro text-sm text-gray-400 mb-2 block">
                Voice Transcription:
              </label>
              <div className="relative">
                <Textarea
                  value={transcript}
                  readOnly
                  className="bg-white text-black border-2 border-gray-300 font-sf-pro text-lg min-h-[100px] resize-none"
                  placeholder="Your voice command will appear here..."
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleSendTranscript}
                    disabled={!transcript.trim() || isProcessing}
                    className="bg-white text-black hover:bg-gray-200 font-sf-pro"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Command
                  </Button>
                  <Button
                    onClick={retryTranscription}
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-black font-sf-pro"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Input */}
          <div className="w-full max-w-2xl">
            <label className="font-sf-pro text-sm text-gray-400 mb-2 block">
              Or type your command:
            </label>
            <div className="relative">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-black border-2 border-white text-white font-sf-pro text-lg py-6 pr-20"
                placeholder=""
              />
              
              {/* Animated Placeholder */}
              {!manualInput && (
                <div className="absolute inset-0 pointer-events-none flex items-center px-3">
                  <span className="font-sf-pro text-lg text-gray-500">
                    {displayedText}
                    {isTyping && (
                      <span className="border-r-2 border-white animate-blink ml-1"></span>
                    )}
                  </span>
                </div>
              )}
              
              <Button
                onClick={handleSendManual}
                disabled={!manualInput.trim() || isProcessing}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-black hover:bg-gray-200 h-10 px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Feature Info */}
          <div className="mt-12 text-center">
            <p className="font-sf-pro text-sm text-gray-500 max-w-lg mx-auto">
              Commands are processed and sent securely. Supports email management, 
              task creation, reminders, and scheduling requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
