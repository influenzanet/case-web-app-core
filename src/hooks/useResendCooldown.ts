import { useCallback, useEffect, useState } from "react";

// The backend refuses a second verification code inside a one minute window. The interface
// holds the resend for the same time, so a participant is not asked to spend a click on a
// refusal they had no way of seeing coming.
export const resendCooldownSeconds = 60;

const secondsUntil = (deadline: number): number =>
  Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

export interface ResendCooldown {
  secondsLeft: number;
  isCoolingDown: boolean;
  start: () => void;
}

// The countdown is derived from a deadline rather than counted down tick by tick, so a tab that
// was suspended or a slow render never leaves the button held for longer than the window.
export const useResendCooldown = (
  seconds: number = resendCooldownSeconds,
): ResendCooldown => {
  const [deadline, setDeadline] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (deadline <= 0) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const left = secondsUntil(deadline);
      setSecondsLeft(left);
      if (left <= 0) {
        setDeadline(0);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const start = useCallback(() => {
    setDeadline(Date.now() + seconds * 1000);
  }, [seconds]);

  return { secondsLeft, isCoolingDown: secondsLeft > 0, start };
};
