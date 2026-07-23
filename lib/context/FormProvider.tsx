"use client";

import {
  ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import { fetchResume } from "../actions/resume.actions";

interface FormContextType {
  formData: any;
  handleInputChange: (e: { target: { name: string; value: any } }) => void;
  activeFormIndex: number;
  setActiveFormIndex: (index: number) => void;
  builderComplete: boolean;
  setBuilderComplete: (value: boolean) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({
  params,
  initialData,
  children,
}: {
  params: { id: string };
  initialData?: any;
  children: ReactNode;
}) => {
  const [formData, setFormData] = useState<any>(initialData ?? {});
  const [activeFormIndex, setActiveFormIndex] = useState(1);
  const [builderComplete, setBuilderComplete] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      return;
    }
    const loadResumeData = async () => {
      try {
        const resumeData = await fetchResume(params.id);
        const parsed = JSON.parse(resumeData);
        // Ensure formData is always an object, never null
        setFormData(parsed || {});
      } catch (error) {
        console.error("Error fetching resume:", error);
        setFormData({});
      }
    };

    loadResumeData();
  }, [params.id, initialData]);

  const handleInputChange = (e: { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const contextValue: FormContextType = {
    formData,
    handleInputChange,
    activeFormIndex,
    setActiveFormIndex,
    builderComplete,
    setBuilderComplete,
  };

  return (
    <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
};
