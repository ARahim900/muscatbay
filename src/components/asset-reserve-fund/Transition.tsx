
import React, { useState, useEffect } from 'react';

interface TransitionProps {
  show: boolean;
  enter: string;
  enterFrom: string;
  enterTo: string;
  leave: string;
  leaveFrom: string;
  leaveTo: string;
  children: React.ReactNode;
  className?: string;
  unmount?: boolean;
}

const Transition: React.FC<TransitionProps> = ({
  show,
  enter,
  enterFrom,
  enterTo,
  leave,
  leaveFrom,
  leaveTo,
  children,
  className = '',
  unmount = true
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [transitionState, setTransitionState] = useState(show ? 'enterTo' : 'leaveTo');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (show) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setTransitionState('enterFrom');
        requestAnimationFrame(() => {
          setTransitionState('enterTo');
        });
      });
    } else {
      setTransitionState('leaveFrom');
      timeoutId = setTimeout(() => {
        setTransitionState('leaveTo');
        if (unmount) {
          setShouldRender(false);
        }
      }, 300); // Match transition duration
    }
    return () => clearTimeout(timeoutId);
  }, [show, unmount]);

  if (!shouldRender) {
    return null;
  }

  let currentTransitionClasses = '';
  switch (transitionState) {
    case 'enterFrom': currentTransitionClasses = `${enter} ${enterFrom}`; break;
    case 'enterTo': currentTransitionClasses = `${enter} ${enterTo}`; break;
    case 'leaveFrom': currentTransitionClasses = `${leave} ${leaveFrom}`; break;
    case 'leaveTo': currentTransitionClasses = `${leave} ${leaveTo}`; break;
    default: break;
  }

  return (
    <div className={`${className || ''} ${currentTransitionClasses}`}>
      {children}
    </div>
  );
};

export default Transition;
