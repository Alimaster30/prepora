"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { createFeedback, createInterviewRecord } from "@/lib/actions/general.action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

async function requestMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("unsupported");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  stream.getTracks().forEach((track) => track.stop());
}

function microphoneErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Microphone access was blocked. Allow it in your browser site settings, then try again.";
    }
    if (error.name === "NotFoundError") {
      return "No microphone was found. Connect one or choose another input device, then try again.";
    }
    if (error.name === "NotReadableError") {
      return "Your microphone is busy or unavailable. Close other apps using it, then try again.";
    }
  }
  return "The microphone could not be opened. Check browser permissions and try again.";
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  role,
  interviewType,
  level,
  techstack,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [currentInterviewId, setCurrentInterviewId] = useState<string | undefined>(interviewId);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [interviewName, setInterviewName] = useState(role || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use refs to always have access to latest values in callbacks
  const messagesRef = useRef<SavedMessage[]>([]);
  const currentInterviewIdRef = useRef<string | undefined>(interviewId);
  const isGeneratingFeedbackRef = useRef(false);

  // Update refs whenever state changes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (role) {
      setInterviewName(role);
    }
  }, [role]);

  useEffect(() => {
    if (typeof window === "undefined" || role) return;

    if (currentInterviewId) {
      const storedRole = localStorage.getItem(`interview_role_${currentInterviewId}`);
      if (storedRole) {
        setInterviewName(storedRole);
        return;
      }
    }

    const pendingRole = localStorage.getItem("pending_interview_name");
    if (!currentInterviewId && pendingRole) {
      setInterviewName(pendingRole);
    }
  }, [currentInterviewId, role]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = currentInterviewId
      ? `interview_role_${currentInterviewId}`
      : "pending_interview_name";

    if (interviewName.trim()) {
      localStorage.setItem(storageKey, interviewName.trim());
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [interviewName, currentInterviewId]);

  useEffect(() => {
    currentInterviewIdRef.current = currentInterviewId;
  }, [currentInterviewId]);

  useEffect(() => {
    isGeneratingFeedbackRef.current = isGeneratingFeedback;
  }, [isGeneratingFeedback]);

  // Load messages and interview ID from localStorage on mount
  useEffect(() => {
    // Try to recover interview ID if not provided
    if (!currentInterviewId) {
      const savedInterviewId = localStorage.getItem('current_interview_id');
      if (savedInterviewId) {
        setCurrentInterviewId(savedInterviewId);
      }
    }

    const storageKey = `interview_messages_${currentInterviewId || 'temp'}`;
    const savedMessages = localStorage.getItem(storageKey);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch {
        localStorage.removeItem(storageKey);
        setErrorMessage("The saved transcript could not be recovered and was cleared.");
      }
    }
  }, [currentInterviewId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && currentInterviewId) {
      const storageKey = `interview_messages_${currentInterviewId}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, currentInterviewId]);

  // Feedback generation function that can be called from anywhere
  const generateFeedback = useCallback(async () => {
    const messagesToUse = messagesRef.current;
    const interviewIdToUse = currentInterviewIdRef.current;

    if (!interviewIdToUse) {
      setErrorMessage("The interview could not be identified. Start a new interview and try again.");
      return false;
    }

    if (!userId) {
      setErrorMessage("Your session is unavailable. Sign in again before generating feedback.");
      return false;
    }

    if (messagesToUse.length === 0) {
      setErrorMessage("No conversation was recorded. Complete an interview before requesting feedback.");
      return false;
    }

    if (isGeneratingFeedbackRef.current) {
      return false;
    }

    setErrorMessage(null);
    setIsGeneratingFeedback(true);
    isGeneratingFeedbackRef.current = true;

    try {
      const { success, feedbackId: id, error } = await createFeedback({
        interviewId: interviewIdToUse,
        userId: userId,
        transcript: messagesToUse,
        feedbackId,
      });

      if (success && id) {
        const storageKey = `interview_messages_${interviewIdToUse}`;
        localStorage.removeItem(storageKey);
        localStorage.removeItem('current_interview_id');
        localStorage.removeItem(`interview_role_${interviewIdToUse}`);
        localStorage.removeItem('pending_interview_name');
        router.push(`/interview/${interviewIdToUse}/feedback`);
        return true;
      } else {
        setErrorMessage(error || "Feedback could not be generated. Please try again.");
        return false;
      }
    } catch {
      setErrorMessage("Feedback is temporarily unavailable. Your transcript remains saved in this browser.");
      return false;
    } finally {
      setIsGeneratingFeedback(false);
      isGeneratingFeedbackRef.current = false;
    }
  }, [userId, feedbackId, router]);

  useEffect(() => {
    const onCallStart = () => {
      setErrorMessage(null);
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = async () => {
      setCallStatus(CallStatus.FINISHED);

      // Wait a bit to ensure all messages are captured
      setTimeout(async () => {
        await generateFeedback();
      }, 1000);
    };

    const onMessage = (message: any) => {
      // Handle transcript messages
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = {
          role: message.role as "user" | "system" | "assistant",
          content: message.transcript
        };
        setMessages((previous) => [...previous, newMessage]);
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
    };

    const onError = () => {
      setCallStatus(CallStatus.INACTIVE);
      setErrorMessage("The voice service encountered an error. Check microphone access and try again.");
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, [generateFeedback]);

  // Update last message when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }
  }, [messages]);

  const handleCall = async () => {
    const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
    setErrorMessage(null);
    if (!workflowId) {
      setErrorMessage("Voice interviews are not configured for this environment.");
      return;
    }

    if (type === "generate" && !interviewName.trim()) {
      setErrorMessage("Provide a name for this interview before starting.");
      return;
    }

    try {
      await requestMicrophoneAccess();
    } catch (error) {
      setErrorMessage(microphoneErrorMessage(error));
      return;
    }

    setCallStatus(CallStatus.CONNECTING);

    // Clear any previous messages for a fresh start
    setMessages([]);
    const storageKey = `interview_messages_${currentInterviewId || 'temp'}`;
    localStorage.removeItem(storageKey);

    try {
      if (type === "generate") {
        const trimmedInterviewName = interviewName.trim();
        if (!trimmedInterviewName) {
          setErrorMessage("Provide a name for this interview before starting.");
          setCallStatus(CallStatus.INACTIVE);
          return;
        }

        // For generate type, create a new interview record first
        if (userId) {
          const interviewResult = await createInterviewRecord({
            role: trimmedInterviewName,
            type: "Mixed",
            level: "Mid-level",
            techstack: ["General"],
            questions: ["Generated interview questions"],
            userId: userId,
          });

          if (interviewResult.success && interviewResult.interviewId) {
            setCurrentInterviewId(interviewResult.interviewId);
            setInterviewName(trimmedInterviewName);
            // Save the interview ID to localStorage for recovery
            localStorage.setItem('current_interview_id', interviewResult.interviewId);
            localStorage.setItem(`interview_role_${interviewResult.interviewId}`, trimmedInterviewName);
            localStorage.removeItem('pending_interview_name');
          } else {
            setErrorMessage(interviewResult.error || "The interview could not be created. Please try again.");
            setCallStatus(CallStatus.INACTIVE);
            return;
          }
        } else {
          setErrorMessage("Your session is unavailable. Sign in again before starting.");
          setCallStatus(CallStatus.INACTIVE);
          return;
        }

        await vapi.start(workflowId, {
          variableValues: {
            username: userName,
            userid: userId,
          },
        });
      } else {
        // For interview type, use existing interview ID or create new one
        if (!currentInterviewId && questions && userId) {
          const interviewResult = await createInterviewRecord({
            role: role || "Mock Interview",
            type: interviewType || "Mixed",
            level: level || "Mid-level",
            techstack: techstack || ["General"],
            questions: questions,
            userId: userId,
          });

          if (interviewResult.success && interviewResult.interviewId) {
            setCurrentInterviewId(interviewResult.interviewId);
            localStorage.setItem('current_interview_id', interviewResult.interviewId);
          } else {
            setErrorMessage(interviewResult.error || "The interview could not be created. Please try again.");
            setCallStatus(CallStatus.INACTIVE);
            return;
          }
        }

        // Format interview context for the AI
        const interviewContext = `
Role: ${role || "General"}
Type: ${interviewType || "Mixed"}
Level: ${level || "Mid-level"}
Tech Stack: ${techstack?.join(", ") || "General"}
        `.trim();

        let formattedQuestions = "";
        if (questions && questions.length > 0) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        }

        await vapi.start(workflowId, {
          variableValues: {
            interviewContext: interviewContext,
            questions: formattedQuestions,
            username: userName,
            userid: userId,
            role: role || "candidate",
            interviewType: interviewType || "Mixed",
            level: level || "Mid-level",
            techstack: techstack?.join(", ") || "General",
          },
        });
      }
    } catch {
      setErrorMessage("The voice interview could not start. Check microphone access and try again.");
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    vapi.stop();
    // The onCallEnd handler will take care of feedback generation
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card with Interview Name */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
            <div className="mt-2 px-4 py-2 bg-dark-200 rounded-lg">
              <p className="text-primary-200 font-semibold capitalize">
                {(role || interviewName || "Mock") + " Interview"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {type === "generate" && (
        <div className="w-full max-w-xl mt-6">
          <Label htmlFor="interview-name" className="text-light-100 text-sm uppercase tracking-wide">
            Interview name
          </Label>
          <Input
            id="interview-name"
            placeholder="e.g. Frontend Developer"
            value={interviewName}
            onChange={(event) => setInterviewName(event.target.value)}
            className="mt-2 bg-dark-200 border-dark-300 text-light-100"
          />
          <p className="text-xs text-light-100/70 mt-2">
            This name appears in Your Interviews, schedules, and feedback.
          </p>
        </div>
      )}

      {/* Interview History - Only showing transcript/history */}
      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "opacity-0 transition-opacity duration-200",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col gap-4 items-center">
        <div className="flex justify-center gap-4">
          {callStatus !== "ACTIVE" ? (
            <button
              type="button"
              className="relative btn-call"
              onClick={handleCall}
              disabled={isGeneratingFeedback || callStatus === CallStatus.CONNECTING}
              aria-busy={isGeneratingFeedback || callStatus === CallStatus.CONNECTING}
            >
              <span
                className={cn(
                  "absolute animate-ping rounded-full opacity-75",
                  callStatus !== "CONNECTING" && "hidden"
                )}
              />

              <span className="relative">
                {isGeneratingFeedback
                  ? "Generating Feedback..."
                  : callStatus === "INACTIVE" || callStatus === "FINISHED"
                  ? "Call"
                  : ". . ."}
              </span>
            </button>
          ) : (
            <button type="button" className="btn-disconnect" onClick={handleDisconnect}>
              End
            </button>
          )}
        </div>

        {errorMessage && (
          <p
            role="alert"
            aria-live="assertive"
            className="max-w-xl text-center text-sm text-destructive-100"
          >
            {errorMessage}
          </p>
        )}

        {callStatus === CallStatus.FINISHED && messages.length === 0 && (
          <p role="status" className="text-sm text-destructive-100">
            No messages were recorded during the interview. Please try again.
          </p>
        )}
      </div>
    </>
  );
};

export default Agent;
