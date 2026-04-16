import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook to manage camera access and video stream
 * Supports front/rear camera toggle
 * Mobile-first: defaults to rear camera
 */
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);

  // Enumerate available video devices
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices?.().then(devs => {
      setDevices(devs.filter(d => d.kind === 'videoinput'));
    }).catch(() => {});
  }, []);

  const startCamera = useCallback(async (facing) => {
    try {
      setError(null);
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const mode = facing || facingMode;
      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      if (facing) setFacingMode(facing);
    } catch (err) {
      setError(err.message || 'Camera access denied');
      setIsActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const toggleFacing = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    if (isActive) {
      startCamera(next);
    } else {
      setFacingMode(next);
    }
  }, [facingMode, isActive, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return {
    videoRef,
    isActive,
    facingMode,
    error,
    devices,
    startCamera,
    stopCamera,
    toggleFacing,
  };
}
