// Forecasting Feature Types

export type QuestionType = 'text' | 'number' | 'select' | 'multiline' | 'people_multi_select';

export interface ForecastQuestion {
  id: string;
  section: string | null;
  order_index: number;
  question_text: string;
  question_type: QuestionType;
  options?: any; // JSONB field for select options
  include_text_area?: boolean | null; // For people questions that need additional text
  is_active: boolean | null;
  created_at: string | null;
  updated_at?: string | null;
}

export interface ForecastResponse {
  id: string;
  user_id: string | null;
  week_of: string; // Date string for Monday of the week
  team: string | null;
  area: string | null;
  region: string | null;
  submitted_at: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

export interface ForecastAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string | null;
  answer_number: number | null;
  created_at: string | null;
}

// Extended types with relations
export interface ForecastResponseWithAnswers extends ForecastResponse {
  answers: ForecastAnswer[];
}

export interface ForecastQuestionWithAnswer extends ForecastQuestion {
  answer?: ForecastAnswer;
}

// Form types for submission
export interface ForecastSubmission {
  week_of: string;
  selectedArea?: string;
  selectedRegion?: string;
  answers: {
    question_id: string;
    answer_text?: string;
    answer_number?: number;
  }[];
}

// Dashboard aggregation types
export interface ForecastSummary {
  week_of: string;
  total_responses: number;
  sales_forecast: number;
  lead_forecast: number;
  stretch_goal: number;
  by_region: RegionSummary[];
  by_area: AreaSummary[];
  by_team: TeamSummary[];
  completion_stats: CompletionStats;
  pending_areas: PendingArea[];
}

export interface RegionSummary {
  region: string;
  response_count: number;
  sales_forecast: number;
  lead_forecast: number;
  stretch_goal: number;
  last_week_sales?: number;
}

export interface AreaSummary {
  area: string;
  region: string;
  response_count: number;
  sales_forecast: number;
  lead_forecast: number;
  stretch_goal: number;
  last_week_sales?: number;
  last_week_leads?: number;
  last_week_sales_forecast?: number; // Last week's forecast for comparison
  scheduled_leads?: number;
  has_submitted: boolean;
  submitted_at?: string;
  submitted_by?: string; // User ID who submitted
  submitter_name?: string; // Name of submitter
  submitter_profile_pic?: string; // Profile pic URL
  submitter_user_key?: string; // User key for profile pic
  week_over_week_sales_change?: number;
  week_over_week_leads_change?: number;
  forecast_accuracy?: 'above' | 'hit' | 'below' | null; // Performance vs last week's forecast
}

export interface TeamSummary {
  team: string;
  area: string;
  region: string;
  manager_name: string;
  sales_forecast: number;
  lead_forecast: number;
  stretch_goal: number;
  state_of_mind?: string;
  key_challenges?: string;
}

// User profile for people selection
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  team: string | null;
  area: string | null;
  region: string | null;
  role: string | null;
  user_key: string | null;
}

// Person with avatar support
export interface PersonWithAvatar {
  name: string;
  user_key: string | null;
}

// Combined answer type for people + text questions (for survey collection)
export interface SurveyPeopleTextAnswer {
  people: string[];
  text: string;
}

// Combined answer type for people + text questions (for display with avatars)
export interface PeopleTextAnswer {
  people: PersonWithAvatar[];
  text: string;
}

// Survey state management
export interface SurveyState {
  currentQuestionIndex: number;
  answers: Map<string, string | number | string[] | SurveyPeopleTextAnswer>;
  isSubmitting: boolean;
  error: string | null;
  selectedArea?: string;
  selectedRegion?: string;
  selectedWeek?: string;
  showAreaSelection: boolean;
}

// Area selection types
export interface AreaOption {
  area: string;
  region: string;
}

// Completion tracking types
export interface CompletionStats {
  total_areas: number;
  completed_areas: number;
  completion_rate: number;
  by_region: RegionCompletionStats[];
}

export interface RegionCompletionStats {
  region: string;
  total_areas: number;
  completed_areas: number;
  completion_rate: number;
}

export interface PendingArea {
  area: string;
  region: string;
  days_overdue?: number;
}

// Area detail drill-down types
export interface AreaDetailView {
  area: string;
  region: string;
  week_of: string;
  submitted_at?: string;
  manager_info?: {
    name: string;
    email: string;
    user_key: string;
  };
  sections?: {
    [sectionName: string]: QuestionAnswer[];
  };
  past_performance: {
    last_week_sales?: number;
    performance_factors?: string;
  };
  leadership_intuition: {
    team_state_of_mind?: string;
    personal_challenges?: PersonWithAvatar[] | PeopleTextAnswer;
    struggling_reps?: PersonWithAvatar[] | PeopleTextAnswer;
    weather_impact?: string;
  };
  team_status: {
    unavailable_people?: PersonWithAvatar[] | PeopleTextAnswer;
    coaching_needed?: PersonWithAvatar[] | PeopleTextAnswer;
  };
  opportunities: {
    scheduled_leads?: number;
    upcoming_appointments?: number;
  };
  incentives: {
    current_incentives?: string;
    planned_incentives?: string;
  };
  forecast_numbers: {
    sales_forecast: number;
    lead_forecast: number;
    stretch_goal: number;
  };
}

export interface QuestionAnswer {
  id: string;
  question_text: string;
  question_type: QuestionType;
  order_index: number;
  answer: any;
  options?: any;
}