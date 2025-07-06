// src/types/jobMappings.d.ts

export interface JobGrow {
  jobGrowId:   string
  jobGrowName: string
  imgSrc?:     string
}

export interface JobMapping {
  jobName:        string
  finalJobGrows:  JobGrow[]
  // …add any other fields you use
}

// “Augment” the module so TS knows its shape
declare module '@/config/jobMappings.js' {
  const jobMappings: Record<string, JobMapping>
  export default jobMappings
}
