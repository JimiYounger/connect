// src/types/airtable.ts  

export interface TeamMember {
  id?: string;
  createdTime?: string;
  lastModifiedTime?: string;
  fields?: {
    "Full Name"?: string;
    "First Name"?: string;
    "Last Name"?: string;
    Email?: string;
    Role?: string;
    "Role Type"?: string;
    Phone?: string;
    Area?: string;
    Team?: string;
    Region?: string;
    "Personal Email"?: string;
    "Profile Picture"?: string;
    "Google User ID"?: string;
    "Hire Date"?: Date | string; // Can be either Date object or ISO string
    "User Key"?: string;
    "Recruiting ID"?: string;
    "Profile Pic URL"?: string;
    "Health Dashboard"?: string;
    "Salesforce ID"?: string;
    State?: string[];
    Branch?: string[];
    "Immediate Supervisor"?: string[];
    Admin?: boolean;
    UUID?: string;
    "Shirt Size"?: string;
    Department?: string;
  };
}

// Helper function to parse dates
export function parseAirtableDate(dateString: string): Date {
  return new Date(dateString);
}

// Utility type for required email fields
export type TeamMemberWithEmail = Required<Pick<TeamMember, 'fields'>> & {
  fields: Required<Pick<NonNullable<TeamMember['fields']>, 'Email'>> & 
    NonNullable<TeamMember['fields']>;
};