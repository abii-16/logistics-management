"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Mic, Phone, PhoneOff, RefreshCw, ShieldAlert, Volume2 } from "lucide-react";
import { api } from "@/services/api";

type CallState =
  | "IDLE"
  | "LANGUAGE_SELECTION"
  | "RECORDING"
  | "UPLOADING"
  | "AI_PROCESSING"
  | "BOOKING_CREATED";

type Language = "Tamil" | "Hindi" | "English";

interface VoiceCallSimulatorProps {
  onBookingCreated?: () => void;
  onNewNotification?: (notification: {
    id: string;
    crop: string;
    weightKg: number;
    village: string;
    timestamp: string;
  }) => void;
}

const demoTranscripts: Record<Language, string> = {
  Tamil: "Naan Arumugam. Melma village la irukken. En kitta 400 kilo thakkali irukku.",
  Hindi: "Main Ramesh hoon. Main Sevoor gaon se hoon. Mere paas 200 kilo baingan hai.",
  English: "Hello, I am Suresh from Athur village. I want to transport 350 kilograms of tomatoes."
};

export function VoiceCallSimulator({ onBookingCreated, onNewNotification }: VoiceCallSimulatorProps) {
  const [callState, setCallState] = useState<CallState>("IDLE");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("English");
  const [statusText, setStatusText] = useState("Call is offline");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [confidence, setConfidence] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [voiceList, setVoiceList] = useState<SpeechSynthesisVoice[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef("");

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const speech = window.speechSynthesis;
      synthRef.current = speech;

      const loadVoices = () => {
        const voices = speech.getVoices();
        if (voices.length > 0) {
          setVoiceList(voices);
          setSpeechAvailable(true);
        }
      };

      loadVoices();
      speech.onvoiceschanged = loadVoices;
    }

    return () => {
      stopRecordingTimer();
      stopSpeechRecognition();
      synthRef.current?.cancel();
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
      }
    };
  }, []);

  function startRecordingTimer() {
    stopRecordingTimer();
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
  }

  function stopRecordingTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function getLanguageCode(language: Language) {
    switch (language) {
      case "Tamil":
        return "ta-IN";
      case "Hindi":
        return "hi-IN";
      default:
        return "en-IN";
    }
  }

  function getLanguagePrompt(language: Language) {
    switch (language) {
      case "Tamil":
        return "Vanakkam. Please say your name, village, crop, and crop weight.";
      case "Hindi":
        return "Namaste. Please say your name, village, crop, and crop weight.";
      default:
        return "Hello. Please tell us your name, village, crop, and crop weight.";
    }
  }

  function getConfirmationText(language: Language, weight: number, crop: string, village: string, bId: string) {
    switch (language) {
      case "Tamil":
        return `Nandri. We recorded ${weight} kilo ${crop} from ${village}. Your booking ID is ${bId}.`;
      case "Hindi":
        return `Dhanyavaad. We recorded ${weight} kilo ${crop} from ${village}. Your booking ID is ${bId}.`;
      default:
        return `Thank you. We recorded ${weight} kilograms of ${crop} from ${village}. Your booking ID is ${bId}.`;
    }
  }

  function getSpeechVoice(langCode: string) {
    const voices = voiceList.length > 0 ? voiceList : synthRef.current?.getVoices() ?? [];
    const requestedPrefix = langCode.slice(0, 2).toLowerCase();
    return (
      voices.find((voice) => voice.lang.toLowerCase().startsWith(requestedPrefix)) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
      voices[0] ||
      null
    );
  }

  function speak(text: string, langCode = "en-IN", onEnd?: () => void) {
    if (!synthRef.current) {
      onEnd?.();
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getSpeechVoice(langCode);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = langCode;
    }
    utterance.rate = 0.95;
    utterance.volume = 1;
    utterance.pitch = 1;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    synthRef.current.speak(utterance);
  }

  function clearPreviousCallData() {
    liveTranscriptRef.current = "";
    setTranscript("");
    setExtractedData(null);
    setConfidence(null);
    setBookingDetails(null);
  }

  function startCall() {
    synthRef.current?.cancel();
    clearPreviousCallData();
    setCallState("LANGUAGE_SELECTION");
    setStatusText("Connecting to 1800-KRISHI...");
    speak("Welcome to KrishiBundle Voice Booking Helpline. Press 1 for Tamil, Press 2 for Hindi, Press 3 for English.");
  }

  function handleKeyPress(num: number) {
    if (callState !== "LANGUAGE_SELECTION") return;
    const lang = num === 1 ? "Tamil" : num === 2 ? "Hindi" : num === 3 ? "English" : null;
    if (lang) selectLanguage(lang);
  }

  function selectLanguage(lang: Language) {
    setSelectedLanguage(lang);
    setStatusText(`Call started: ${lang}`);
    const prompt = getLanguagePrompt(lang);
    const speechLang = getLanguageCode(lang);
    speak(prompt, speechLang, () => startRecording(lang));
  }

  async function startRecording(language: Language) {
    liveTranscriptRef.current = "";
    setTranscript("");
    setCallState("RECORDING");
    setStatusText("Listening...");
    startRecordingTimer();
    startSpeechRecognition(language);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        stopSpeechRecognition();
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        uploadAudio(audioBlob);
      };
      mediaRecorder.start();
    } catch {
      setStatusText("Listening with browser speech fallback...");
    }
  }

  function startSpeechRecognition(language: Language) {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === "Tamil" ? "ta-IN" : language === "Hindi" ? "hi-IN" : "en-IN";
    recognition.onresult = (event: any) => {
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const chunk = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) {
          liveTranscriptRef.current = `${liveTranscriptRef.current} ${chunk}`.trim();
        } else {
          interimText += `${chunk} `;
        }
      }
      const visibleTranscript = `${liveTranscriptRef.current} ${interimText}`.trim();
      if (visibleTranscript) setTranscript(visibleTranscript);
    };
    recognition.onerror = () => undefined;
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
    }
  }

  function stopSpeechRecognition() {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // It may already be stopped by the browser.
    }
    recognitionRef.current = null;
  }

  function endCall() {
    stopRecordingTimer();
    stopSpeechRecognition();
    if (callState === "RECORDING") {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      } else {
        uploadTranscriptOnly();
      }
      return;
    }
    synthRef.current?.cancel();
    setCallState("IDLE");
    setStatusText("Call ended");
  }

  async function uploadAudio(audioBlob: Blob) {
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "call_recording.webm");
    formData.append("language", selectedLanguage);
    appendBestTranscript(formData);
    await processUpload(formData, selectedLanguage);
  }

  async function uploadTranscriptOnly() {
    const formData = new FormData();
    formData.append("language", selectedLanguage);
    appendBestTranscript(formData);
    await processUpload(formData, selectedLanguage);
  }

  function appendBestTranscript(formData: FormData) {
    const bestTranscript = (liveTranscriptRef.current || transcript).trim();
    if (bestTranscript) {
      formData.append("transcript_text", bestTranscript);
    }
  }

  async function processUpload(formData: FormData, language: Language) {
    setCallState("AI_PROCESSING");
    setStatusText("Processing with AI...");
    const res = await api.uploadVoice(formData);
    if (!res) {
      setCallState("IDLE");
      setStatusText("Processing failed. Please try again.");
      return;
    }
    handleCallSuccess(res, language);
  }

  function handleCallSuccess(res: any, language: Language) {
    setTranscript(res.transcript);
    setExtractedData(res.extracted);
    setConfidence(res.confidence);
    setBookingDetails(res.booking);
    setCallState("BOOKING_CREATED");
    setStatusText("Booking created");

    const crop = res.extracted.crop || "Crop";
    const weight = res.extracted.weight || 0;
    const village = res.extracted.village || "Village";
    const bId = res.booking?.id || res.id;
    const confirmation = getConfirmationText(language, weight, crop, village, bId);
    speak(confirmation, getLanguageCode(language));

    onBookingCreated?.();
    if (onNewNotification && res.booking) {
      onNewNotification({
        id: res.booking.id,
        crop: res.booking.crop,
        weightKg: res.booking.weightKg,
        village: res.booking.village,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
    }
  }

  async function startDemoCall(lang: Language) {
    synthRef.current?.cancel();
    clearPreviousCallData();
    setSelectedLanguage(lang);
    setCallState("RECORDING");
    setStatusText(`Demo call started: ${lang}`);
    setTranscript(demoTranscripts[lang]);
    liveTranscriptRef.current = demoTranscripts[lang];
    startRecordingTimer();

    window.setTimeout(async () => {
      stopRecordingTimer();
      const formData = new FormData();
      formData.append("language", lang);
      formData.append("demo_type", lang === "Tamil" ? "ta" : lang === "Hindi" ? "hi" : "en");
      formData.append("transcript_text", demoTranscripts[lang]);
      await processUpload(formData, lang);
    }, 1200);
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
      <section className="relative flex min-h-[460px] flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white p-5 shadow-panel">
        <div className="relative z-10 flex w-full flex-col items-center text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-soil/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-soil">
            KrishiBundle Voice Assistant
          </div>
          <h2 className="text-xl font-extrabold text-soil">Book crop transport using voice</h2>
          <p className="mt-1 max-w-xs text-xs text-stone-500">Toll-free 1800-KRISHI helpline simulation with live entity extraction.</p>

          <div className="mt-6 flex min-h-[140px] w-full max-w-xs flex-col items-center justify-center rounded-xl bg-stone-900 p-5 text-stone-100 shadow-inner">
            {callState === "IDLE" && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-400">HELPLINE OFFLINE</p>
                <p className="text-2xl font-black tracking-widest text-white">1800-KRISHI</p>
                <p className="text-xs text-stone-500">Press start call to begin</p>
              </div>
            )}

            {callState === "LANGUAGE_SELECTION" && (
              <div className="space-y-3">
                <p className="animate-pulse text-xs font-bold text-river">CHOOSE LANGUAGE</p>
                <div className="space-y-1 text-left text-xs text-stone-300">
                  <p>Press <span className="font-bold text-white">1</span> - Tamil</p>
                  <p>Press <span className="font-bold text-white">2</span> - Hindi</p>
                  <p>Press <span className="font-bold text-white">3</span> - English</p>
                </div>
              </div>
            )}

            {(callState === "RECORDING" || callState === "UPLOADING" || callState === "AI_PROCESSING") && (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2.5 w-2.5 animate-ping rounded-full bg-red-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{statusText}</p>
                </div>
                <p className="text-3xl font-black tracking-wide text-white">{formatTime(recordingSeconds)}</p>
                <p className="text-[11px] font-bold text-harvest">{selectedLanguage} helpline mode</p>
              </div>
            )}

            {callState === "BOOKING_CREATED" && (
              <div className="space-y-1 text-center">
                <CheckCircle className="mx-auto text-field" size={30} />
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-field">Booking Created</p>
                <p className="text-lg font-black text-white">{bookingDetails?.id || "KB1024"}</p>
                <p className="text-[10px] text-stone-400">SMS confirmation sent</p>
              </div>
            )}

            {!speechAvailable && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-[11px] text-amber-800">
                Voice playback is currently unavailable in this browser. Please check your audio device settings or use a different browser.
              </div>
            )}
          </div>

          <div className="mt-6 grid w-full max-w-xs grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((key) => {
              const isSelectable = callState === "LANGUAGE_SELECTION" && typeof key === "number" && key >= 1 && key <= 3;
              return (
                <button
                  className={`focus-ring grid h-12 place-items-center rounded-lg border text-sm font-bold transition-all ${
                    isSelectable
                      ? "border-soil bg-soil/5 text-soil hover:bg-soil hover:text-white"
                      : "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-400"
                  }`}
                  disabled={callState !== "LANGUAGE_SELECTION"}
                  key={key}
                  onClick={() => typeof key === "number" && handleKeyPress(key)}
                  type="button"
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-6 flex w-full max-w-xs justify-center gap-4">
          {callState === "IDLE" || callState === "BOOKING_CREATED" ? (
            <button className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-field py-3 text-sm font-bold text-white shadow-md" onClick={startCall} type="button">
              <Phone size={18} />
              Start Call
            </button>
          ) : (
            <button className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-chilli py-3 text-sm font-bold text-white shadow-md" onClick={endCall} type="button">
              <PhoneOff size={18} />
              End Call
            </button>
          )}
        </div>
      </section>

      <div className="space-y-4">
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-panel">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-soil">
            <Volume2 size={16} />
            Quick Demo Helpline Calls
          </h3>
          <p className="mb-4 text-xs text-stone-500">Use these when browser microphone speech recognition is unavailable.</p>
          <div className="grid gap-2.5">
            {(["Tamil", "Hindi", "English"] as Language[]).map((lang) => (
              <button
                className="focus-ring flex items-center justify-between rounded-lg border border-soil/20 bg-[#fffbf7] px-4 py-2.5 text-xs font-bold text-soil transition-all hover:bg-soil hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={callState !== "IDLE" && callState !== "BOOKING_CREATED"}
                key={lang}
                onClick={() => startDemoCall(lang)}
                type="button"
              >
                <span>Demo {lang} Call</span>
                <span className="text-[10px] font-semibold">Press to Call</span>
              </button>
            ))}
          </div>
        </section>

        {(transcript || extractedData) && (
          <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-panel">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-soil">
                <RefreshCw className="text-river" size={15} />
                Live Helpline Analysis
              </h3>
              <p className="text-[11px] text-stone-500">Transcript text, extracted entities, and confidence scores.</p>
            </div>

            {transcript && (
              <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Transcript</p>
                <p className="mt-1.5 text-xs font-medium italic leading-relaxed text-stone-700">"{transcript}"</p>
              </div>
            )}

            {extractedData && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Extracted Entities</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["Farmer Name", "farmer_name", extractedData.farmer_name],
                    ["Village", "village", extractedData.village],
                    ["Crop Type", "crop", extractedData.crop],
                    ["Weight", "weight", extractedData.weight ? `${extractedData.weight} kg` : ""]
                  ].map(([label, key, value]) => (
                    <div className="flex flex-col rounded-lg border border-stone-100 bg-white p-2" key={key}>
                      <span className="text-[9px] font-bold uppercase text-stone-400">{label}</span>
                      <span className="mt-0.5 text-xs font-bold text-soil">{value || "-"}</span>
                      {confidence && (
                        <span className={`mt-1 text-[9px] font-bold ${confidence[key as string] >= 70 ? "text-field" : "text-chilli"}`}>
                          Confidence: {confidence[key as string]}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {bookingDetails?.reviewRequired && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-chilli/20 bg-chilli/10 p-2.5 text-chilli">
                    <ShieldAlert className="mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider">Manual Review Required</p>
                      <p className="mt-0.5 text-[10px] leading-tight">One or more confidence scores are below 70%.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
