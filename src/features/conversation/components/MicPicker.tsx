'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { IMicrophoneAudioTrack } from 'agora-rtc-react';

interface MicrophoneDevice {
  deviceId: string;
  label: string;
}

function IconChevronUp() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

export interface MicPickerProps {
  localMicrophoneTrack: IMicrophoneAudioTrack | null;
}

// Chevron button attached to the right edge of the mic toggle. Opens a popover with the
// browser's available microphones so the user can switch input without leaving the call.
// Hidden when the browser only reports one device (no meaningful choice to make).
export function MicPicker({ localMicrophoneTrack }: MicPickerProps) {
  const [devices, setDevices] = useState<MicrophoneDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [open, setOpen] = useState(false);

  // Re-read the device list and sync `currentDeviceId` against whatever the track is
  // actually using. Browsers fire labels only after mic permission is granted, so this
  // needs to run after the track exists (see effects below).
  const refreshDevices = useCallback(async () => {
    try {
      const AgoraRTC = (await import('agora-rtc-react')).default;
      const microphones = await AgoraRTC.getMicrophones();
      setDevices(
        microphones.map((device) => ({
          deviceId: device.deviceId,
          label:
            device.label || `Microphone ${device.deviceId.slice(0, 5)}…`,
        })),
      );
      if (localMicrophoneTrack) {
        const currentLabel = localMicrophoneTrack.getTrackLabel();
        const match = microphones.find((d) => d.label === currentLabel);
        if (match) setCurrentDeviceId(match.deviceId);
      }
    } catch (err) {
      console.error('Error fetching microphones:', err);
    }
  }, [localMicrophoneTrack]);

  useEffect(() => {
    if (!localMicrophoneTrack) return;
    void refreshDevices();
  }, [localMicrophoneTrack, refreshDevices]);

  // Plug/unplug handler: refresh list, auto-switch to a new ACTIVE device, and fall
  // back to the first remaining mic if the current one was unplugged.
  useEffect(() => {
    let cancelled = false;
    const setup = async () => {
      try {
        const AgoraRTC = (await import('agora-rtc-react')).default;
        AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
          if (cancelled) return;
          await refreshDevices();
          if (!localMicrophoneTrack) return;
          if (changedDevice.state === 'ACTIVE') {
            await localMicrophoneTrack.setDevice(
              changedDevice.device.deviceId,
            );
            setCurrentDeviceId(changedDevice.device.deviceId);
          } else if (
            changedDevice.device.label ===
              localMicrophoneTrack.getTrackLabel() &&
            changedDevice.state === 'INACTIVE'
          ) {
            const microphones = await AgoraRTC.getMicrophones();
            const fallback = microphones[0];
            if (fallback) {
              await localMicrophoneTrack.setDevice(fallback.deviceId);
              setCurrentDeviceId(fallback.deviceId);
            }
          }
        };
      } catch (err) {
        console.error('Error setting up mic change listener:', err);
      }
    };
    void setup();
    return () => {
      cancelled = true;
      void import('agora-rtc-react').then(({ default: AgoraRTC }) => {
        AgoraRTC.onMicrophoneChanged = undefined;
      });
    };
  }, [localMicrophoneTrack, refreshDevices]);

  // Close when a click lands outside the popover — matches the VoiceLangMenu pattern.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('.mic-picker')) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  const handleChange = async (deviceId: string) => {
    if (!localMicrophoneTrack) return;
    try {
      await localMicrophoneTrack.setDevice(deviceId);
      setCurrentDeviceId(deviceId);
      setOpen(false);
    } catch (err) {
      console.error('Error changing microphone device:', err);
    }
  };

  // Hide until the browser reports a meaningful choice — one device means no picker needed.
  if (devices.length <= 1) return null;

  return (
    <div className="mic-picker relative inline-flex">
      <button
        type="button"
        className="flex h-11 w-5 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-muted-foreground transition-colors duration-150 hover:bg-black/5 hover:text-foreground"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Select microphone"
        title="Select microphone"
      >
        <IconChevronUp />
      </button>
      <AnimatePresence>
      {open && (
        <motion.div
          role="menu"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute bottom-[calc(100%+12px)] left-0 z-10 max-h-60 w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-border bg-surface/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-surface/95 max-sm:left-auto max-sm:right-0"
        >
          <div className="px-2.5 pb-1.5 pt-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Microphone
          </div>
          {devices.map((device) => (
            <button
              key={device.deviceId}
              type="button"
              className={`flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-lg border-none bg-transparent px-2.5 py-2 text-left font-ui text-xs transition-colors duration-100 hover:bg-muted ${
                device.deviceId === currentDeviceId ? 'text-foreground' : 'text-foreground'
              }`}
              onClick={() => handleChange(device.deviceId)}
            >
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {device.label}
              </span>
              {device.deviceId === currentDeviceId && (
                <span className="text-xs text-foreground">✓</span>
              )}
            </button>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
