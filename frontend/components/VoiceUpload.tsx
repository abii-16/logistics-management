"use client";

import { Mic, PhoneCall, Volume2 } from "lucide-react";
import { useState } from "react";
import { extraction } from "@/services/demoData";
import { useSpeechConfirmation } from "@/hooks/useSpeechConfirmation";

export function VoiceUpload() {
  const [processed, setProcessed] = useState(false);
  const { speak } = useSpeechConfirmation();

  function handleProcess() {
    setProcessed(true);
    speak("Thank you. We recorded 400 kilograms of tomatoes from Melma village.", "en-IN");
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-soil">Voice Call Intake</h2>
          <p className="mt-1 text-sm text-stone-600">Tamil, Hindi, and English booking capture for non-literate farmers.</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-chilli/10 text-chilli">
          <PhoneCall size={20} />
        </span>
      </div>

      <div className="mt-4 rounded-lg bg-stone-50 p-4">
        <p className="text-sm font-semibold text-stone-700">Sample call transcript</p>
        <p className="mt-2 text-sm text-stone-600">{extraction.transcript}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="focus-ring inline-flex items-center gap-2 rounded-lg bg-soil px-4 py-2 text-sm font-semibold text-white"
          onClick={handleProcess}
          type="button"
        >
          <Mic size={18} />
          Process Voice
        </button>
        <button
          className="focus-ring inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-soil"
          onClick={() => speak("KrishiBundle booking confirmed. Crop Tomato. Weight 400 kilograms. Village Melma.", "en-IN")}
          type="button"
        >
          <Volume2 size={18} />
          Play Confirmation
        </button>
      </div>

      {processed ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {Object.entries(extraction.extracted).map(([key, value]) => (
            <div className="rounded-lg border border-stone-200 p-3" key={key}>
              <p className="text-xs uppercase text-stone-500">{key.replace("_", " ")}</p>
              <p className="mt-1 font-bold text-soil">{value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

