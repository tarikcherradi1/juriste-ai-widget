import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SYSTEM_INSTRUCTION } from './types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export class LiveSession {
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;

  constructor(private onStatusChange: (isActive: boolean) => void) {}

  async start() {
    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            this.onStatusChange(true);
            this.setupInputStreaming();
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && this.outputAudioContext) {
              await this.playAudioChunk(base64Audio);
            }
            if (message.serverContent?.interrupted) {
              this.stopAllPlayback();
            }
          },
          onclose: () => this.onStatusChange(false),
          onerror: (err) => {
            console.error("Live Error:", err);
            this.onStatusChange(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION + " Réponds de manière très concise.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });
    } catch (e) {
      console.error(e);
      this.onStatusChange(false);
    }
  }

  private setupInputStreaming() {
    if (!this.inputAudioContext || !this.stream) return;
    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    const processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm = this.createPcmBlob(input);
      this.sessionPromise?.then(session => session.sendRealtimeInput({ media: pcm }));
    };
    
    source.connect(processor);
    processor.connect(this.inputAudioContext.destination);
  }

  private async playAudioChunk(base64: string) {
    if (!this.outputAudioContext) return;
    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
    const buffer = await this.decodeAudioData(this.decode(base64), this.outputAudioContext, 24000, 1);
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputAudioContext.destination);
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
  }

  private stopAllPlayback() {
    this.sources.forEach(s => { try { s.stop(); } catch(e){} });
    this.sources.clear();
    this.nextStartTime = 0;
  }

  async stop() {
    this.stopAllPlayback();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.sessionPromise) {
      const s = await this.sessionPromise;
      s.close();
    }
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.onStatusChange(false);
  }

  private createPcmBlob(data: Float32Array) {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: this.encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }

  private encode(b: Uint8Array) {
    let s = '';
    for (let i = 0; i < b.byteLength; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }

  private decode(s: string) {
    const b = atob(s);
    const r = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) r[i] = b.charCodeAt(i);
    return r;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, rate: number, chans: number): Promise<AudioBuffer> {
    const i16 = new Int16Array(data.buffer);
    const frames = i16.length / chans;
    const buf = ctx.createBuffer(chans, frames, rate);
    for (let c = 0; c < chans; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < frames; i++) d[i] = i16[i * chans + c] / 32768.0;
    }
    return buf;
  }
}
