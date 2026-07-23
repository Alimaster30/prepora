"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ScheduleInterviewProps {
  interviewId: string;
  interviewTitle: string;
  onSchedule: (scheduleData: ScheduleData) => Promise<void> | void;
  onCancel: () => void;
}

interface ScheduleData {
  interviewId: string;
  scheduledDate: string;
  scheduledTime: string;
  notes?: string;
}

const ScheduleInterview = ({ interviewId, interviewTitle, onSchedule, onCancel }: ScheduleInterviewProps) => {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");
  const [today, setToday] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Set today's date on client side to avoid hydration mismatch
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      setError("Select both a date and time.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSchedule({
        interviewId,
        scheduledDate,
        scheduledTime,
        notes,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="schedule-title" className="w-full max-w-md rounded-lg bg-white p-6">
        <h3 id="schedule-title" className="text-lg font-semibold mb-4">Schedule Interview</h3>
        <p className="text-gray-600 mb-4">{interviewTitle}</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={today}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or reminders..."
              className="w-full mt-1 p-2 border border-gray-300 rounded-md resize-none"
              rows={3}
            />
          </div>
        </div>
        {error && <p role="alert" className="mt-4 text-sm font-medium text-destructive">{error}</p>}

        <div className="flex gap-3 mt-6">
          <Button onClick={handleSchedule} className="btn-primary flex-1" disabled={saving}>
            {saving ? "Scheduling..." : "Schedule Interview"}
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1" disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterview;
