import React from "react";
import ResumeEditor from "@/components/resume/layout/my-resume/ResumeEditor";
import { getCurrentUser } from "@/lib/actions/auth.action";

const EditResume = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const user = await getCurrentUser();
  const { id } = await params;

  return (
    <div>
      <div className="my-10 mx-2 md:mx-8 lg:mx-16">
        <h2 className="text-center text-primary-100">Edit Your Resume</h2>
        <p className="text-center text-light-100 mt-2">
          Fill in the details below to build your professional resume.
        </p>
      </div>
      <ResumeEditor params={{ id }} userId={user?.id} />
    </div>
  );
};

export default EditResume;
