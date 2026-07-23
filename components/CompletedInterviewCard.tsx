import { getFeedbackByInterviewId } from "@/lib/actions/general.action";
import InterviewCard from "./InterviewCard";

interface CompletedInterviewCardProps {
  interview: any;
  userId?: string;
}

const CompletedInterviewCard = async ({ interview, userId }: CompletedInterviewCardProps) => {
  const feedback = await getFeedbackByInterviewId({
    interviewId: interview.id,
    userId: userId!,
  });

  return (
    <InterviewCard
      key={interview.id}
      userId={userId}
      interviewId={interview.id}
      role={interview.role}
      type={interview.type}
      techstack={interview.techstack}
      createdAt={interview.createdAt}
      feedback={feedback}
    />
  );
};

export default CompletedInterviewCard;
