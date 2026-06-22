// services/webrtcService.ts
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { db } from './firebase';
import {
  doc, setDoc, getDoc, onSnapshot,
  collection, addDoc, deleteDoc, updateDoc
} from 'firebase/firestore';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: [
        'turn:a.relay.metered.ca:80',
        'turn:a.relay.metered.ca:80?transport=tcp',
        'turn:a.relay.metered.ca:443',
        'turn:a.relay.metered.ca:443?transport=tcp',
      ],
      username: '3b8f3fe3c0400b37189b624a',
      credential: 'FwFiFsc/WADmmGVq',
    },
  ],
};

export type CallType = 'voice' | 'video';

export class WebRTCCall {
  private pc: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private callId: string;
  private userId: string;
  private unsubOffer: (() => void) | null = null;
  private unsubAnswer: (() => void) | null = null;
  private unsubRemoteCandidates: (() => void) | null = null;

  public onRemoteStream: ((stream: MediaStream) => void) | null = null;
  public onCallEnded: (() => void) | null = null;
  public onConnected: (() => void) | null = null;

  constructor(callId: string, userId: string) {
    this.callId = callId;
    this.userId = userId;
    this.pc = new RTCPeerConnection(ICE_SERVERS);
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    (this.pc as any).onicecandidate = async (event: any) => {
      if (event.candidate) {
        try {
          await addDoc(
            collection(db, 'callSessions', this.callId, `${this.userId}_candidates`),
            event.candidate.toJSON()
          );
        } catch {}
      }
    };

    (this.pc as any).ontrack = (event: any) => {
      if (event.streams?.[0] && this.onRemoteStream) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    (this.pc as any).onconnectionstatechange = () => {
      const state = (this.pc as any).connectionState;
      if (state === 'connected' && this.onConnected) {
        this.onConnected();
      }
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        if (this.onCallEnded) this.onCallEnded();
      }
    };
  }

  async initLocalStream(isVideo: boolean): Promise<MediaStream> {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: isVideo ? { facingMode: 'user', width: 640, height: 480 } : false,
    }) as MediaStream;
    this.localStream = stream;
    stream.getTracks().forEach((track: any) => {
      this.pc.addTrack(track, stream);
    });
    return stream;
  }

  // CALLER: create offer
  async createOffer(callType: CallType, callerId: string, callerName: string, receiverId: string, receiverName: string) {
    const offer = await this.pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === 'video' });
    await this.pc.setLocalDescription(new RTCSessionDescription(offer));

    await setDoc(doc(db, 'callSessions', this.callId), {
      callerId,
      callerName,
      receiverId,
      receiverName,
      callType,
      offer: { type: offer.type, sdp: offer.sdp },
      status: 'calling',
      createdAt: new Date().toISOString(),
    });

    // Notify receiver
    await setDoc(doc(db, 'callInvites', receiverId), {
      callId: this.callId,
      callerId,
      callerName,
      receiverId,
      receiverName,
      type: callType,
      channelName: this.callId,
      createdAt: new Date().toISOString(),
    });

    // Listen for answer
    this.unsubAnswer = onSnapshot(doc(db, 'callSessions', this.callId), async (snap) => {
      const data = snap.data();
      if (data?.answer && !(this.pc as any).currentRemoteDescription) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
      if (data?.status === 'ended') {
        if (this.onCallEnded) this.onCallEnded();
      }
    });

    // Listen for remote ICE candidates
    this.listenForRemoteCandidates(receiverId);
  }

  // RECEIVER: answer call
  async answerCall() {
    const snap = await getDoc(doc(db, 'callSessions', this.callId));
    const data = snap.data();
    if (!data) throw new Error('Call session not found');

    await this.pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(new RTCSessionDescription(answer));

    await updateDoc(doc(db, 'callSessions', this.callId), {
      answer: { type: answer.type, sdp: answer.sdp },
      status: 'connected',
    });

    // Listen for caller ending the call
    this.unsubOffer = onSnapshot(doc(db, 'callSessions', this.callId), (snap) => {
      const d = snap.data();
      if (d?.status === 'ended') {
        if (this.onCallEnded) this.onCallEnded();
      }
    });

    this.listenForRemoteCandidates(data.callerId);
  }

  private listenForRemoteCandidates(otherUserId: string) {
    this.unsubRemoteCandidates = onSnapshot(
      collection(db, 'callSessions', this.callId, `${otherUserId}_candidates`),
      (snap) => {
        snap.docChanges().forEach((change: any) => {
          if (change.type === 'added') {
            try {
              this.pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            } catch {}
          }
        });
      }
    );
  }

  async endCall() {
    try {
      await updateDoc(doc(db, 'callSessions', this.callId), { status: 'ended' });
    } catch {}
    this.cleanup();
  }

  toggleMute(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled; // returns true if muted
    }
    return false;
  }

  toggleCamera(): void {
    if (!this.localStream) return;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
    }
  }

  switchCamera(): void {
    if (!this.localStream) return;
    const videoTrack = this.localStream.getVideoTracks()[0] as any;
    if (videoTrack?._switchCamera) videoTrack._switchCamera();
  }

  getStream(): MediaStream | null {
    return this.localStream;
  }

  cleanup() {
    this.unsubOffer?.();
    this.unsubAnswer?.();
    this.unsubRemoteCandidates?.();
    this.localStream?.getTracks().forEach((t: any) => t.stop());
    this.pc.close();
  }
}
