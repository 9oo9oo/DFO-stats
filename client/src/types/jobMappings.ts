// src/types/jobMappings.ts

export interface JobGrow {
  jobGrowId:   string;
  jobGrowName: string;
  imgSrc?:     string;
}

export interface JobMapping {
  jobName:       string;
  finalJobGrows: JobGrow[];
}