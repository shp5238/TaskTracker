import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export function usePomodoro() {
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
  const [sessionCount, setSessionCount] = useState(0);
  
  const { toast } = useToast();

  const WORK_DURATION = 1500; // 25 minutes
  const SHORT_BREAK_DURATION = 300; // 5 minutes
  const LONG_BREAK_DURATION = 900; // 15 minutes

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const playNotificationSound = useCallback(() => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    playNotificationSound();
    toast({ title, description: body });
  }, [toast, playNotificationSound]);

  const switchSession = useCallback(() => {
    if (sessionType === 'work') {
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      
      if (newSessionCount % 4 === 0) {
        // Long break after 4 work sessions
        setTimeLeft(LONG_BREAK_DURATION);
        setSessionType('break');
        showNotification('Work session completed!', 'Time for a long break (15 minutes)');
      } else {
        // Short break
        setTimeLeft(SHORT_BREAK_DURATION);
        setSessionType('break');
        showNotification('Work session completed!', 'Time for a short break (5 minutes)');
      }
    } else {
      // Break finished, back to work
      setTimeLeft(WORK_DURATION);
      setSessionType('work');
      showNotification('Break finished!', 'Ready for the next work session?');
    }
  }, [sessionType, sessionCount, showNotification]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            switchSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, switchSession]);

  // Request notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(WORK_DURATION);
    setSessionType('work');
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(sessionType === 'work' ? WORK_DURATION : SHORT_BREAK_DURATION);
  }, [sessionType]);

  return {
    timeLeft,
    isRunning,
    sessionType,
    sessionCount,
    start,
    pause,
    stop,
    reset,
    formatTime,
  };
}
