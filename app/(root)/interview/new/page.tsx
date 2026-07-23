import InterviewSetupForm from "@/components/InterviewSetupForm";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";

const NewInterviewPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="root-layout">
      <header>
        <p className="text-sm font-semibold text-primary">New interview</p>
        <h1 className="mt-2 tracking-[-0.025em]">Set up your practice</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Choose the role, level, and topics you want the interview to cover.
        </p>
      </header>
      <InterviewSetupForm />
    </div>
  );
};

export default NewInterviewPage;
