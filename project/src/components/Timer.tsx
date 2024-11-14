import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  minutes: number;
  onTimeUp: () => void;
}

export function Timer({ minutes, onTimeUp }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 text-xl font-mono">
      <Clock className="w-6 h-6 text-purple-500" />
      <span>
        {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
      </span>
    </div>
  );
}