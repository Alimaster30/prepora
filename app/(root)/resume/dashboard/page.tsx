import DashboardCards from "@/components/resume/layout/DashboardCards";
import { getCurrentUser } from "@/lib/actions/auth.action";

const ResumeDashboard = async () => {
  const user = await getCurrentUser();

  return (
    <div className="root-layout">
      <header>
        <p className="text-sm font-semibold text-primary">Resume builder</p>
        <h1 className="mt-2 tracking-[-0.025em]">Your resumes</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Build a focused resume for each opportunity, then review it before you apply.
        </p>
      </header>
      <DashboardCards userId={user?.id} />
    </div>
  );
};

export default ResumeDashboard;
