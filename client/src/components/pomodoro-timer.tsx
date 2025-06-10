import { useState, useEffect } from "react";
import { Play, Pause, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { connectSpotify, connectYoutube, connectAppleMusic } from "@/lib/music-services";
import type { Task } from "@shared/schema";

export function PomodoroTimer() {
  const [showModal, setShowModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const { timeLeft, isRunning, sessionType, start, pause, stop, formatTime } = usePomodoro();

  useEffect(() => {
    const getCurrentTask = () => {
      try {
        const stored = localStorage.getItem('currentTask');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    };

    const task = getCurrentTask();
    setCurrentTask(task);

    // Listen for storage changes to update current task
    const handleStorageChange = () => {
      const task = getCurrentTask();
      setCurrentTask(task);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleStart = () => {
    start();
    setShowModal(true);
  };

  const handleStop = () => {
    stop();
    setShowModal(false);
  };

  return (
    <>
      <div className="flex items-center space-x-4">
        <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="font-mono text-lg font-semibold">{formatTime(timeLeft)}</span>
          </div>
          <Button
            size="sm"
            className="w-8 h-8 rounded-full p-0"
            onClick={isRunning ? pause : handleStart}
          >
            {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
        </div>
        
        {/* Music Integration */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full p-0"
            onClick={connectSpotify}
          >
            <i className="fab fa-spotify text-xs"></i>
          </Button>
          <Button
            size="sm"
            className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full p-0"
            onClick={connectYoutube}
          >
            <i className="fab fa-youtube text-xs"></i>
          </Button>
          <Button
            size="sm"
            className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full p-0"
            onClick={connectAppleMusic}
          >
            <i className="fab fa-apple text-xs"></i>
          </Button>
        </div>
        
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <i className="fas fa-user text-gray-600 text-sm"></i>
        </div>
      </div>

      {/* Pomodoro Session Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <div className="text-center p-6">
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r="64" stroke="#E5E7EB" strokeWidth="8" fill="none"/>
                <circle 
                  cx="72" 
                  cy="72" 
                  r="64" 
                  stroke="#2563EB" 
                  strokeWidth="8" 
                  fill="none" 
                  strokeDasharray="402" 
                  strokeDashoffset={402 * (1 - (timeLeft / (sessionType === 'work' ? 1500 : 300)))}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-mono font-bold text-gray-900">{formatTime(timeLeft)}</span>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {sessionType === 'work' ? 'Work Session' : 'Break Time'}
            </h3>
            {currentTask && sessionType === 'work' ? (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Current Task:</p>
                <p className="text-gray-900 font-medium">{currentTask.title}</p>
                {currentTask.description && (
                  <p className="text-sm text-gray-600 mt-1">{currentTask.description}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-600 mb-6">
                {sessionType === 'work' ? 'Stay focused and productive!' : 'Take a well-deserved break!'}
              </p>
            )}
            
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={isRunning ? pause : start}
              >
                {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isRunning ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleStop}
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
