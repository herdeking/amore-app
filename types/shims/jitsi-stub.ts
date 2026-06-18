// types/shims/jitsi-stub.ts
import * as React from 'react';
import { ViewStyle } from 'react-native';

export interface JitsiRefProps {
  close: () => void;
  setAudioOnly?: (value: boolean) => void;
  setAudioMuted?: (muted: boolean) => void;
  setVideoMuted?: (muted: boolean) => void;
  getRoomsInfo?: () => any;
}

export interface IJitsiMeetingProps {
  config?: object;
  eventListeners?: { [key: string]: Function };
  flags?: object;
  room: string;
  serverURL?: string;
  style?: ViewStyle;
  token?: string;
  userInfo?: {
    avatarURL?: string;
    displayName?: string;
    email?: string;
  };
}

export declare const JitsiMeeting: React.ForwardRefExoticComponent<
  IJitsiMeetingProps & React.RefAttributes<JitsiRefProps>
>;
