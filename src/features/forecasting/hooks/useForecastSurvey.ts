'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { ForecastQuestion, ForecastSubmission, SurveyState, UserProfile, PeopleTextAnswer, AreaOption } from '../types';

function getNextMonday(date = new Date()): string {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Days to add to get to next Monday
  let daysToAdd;
  if (dayOfWeek === 0) { // Sunday
    daysToAdd = 1;
  } else if (dayOfWeek === 1) { // Monday
    daysToAdd = 7; // Next Monday, not today
  } else { // Tuesday through Saturday
    daysToAdd = 8 - dayOfWeek;
  }

  d.setDate(d.getDate() + daysToAdd);
  d.setHours(0, 0, 0, 0);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

export function useForecastSurvey() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [surveyState, setSurveyState] = useState<SurveyState>({
    currentQuestionIndex: 0,
    answers: new Map(),
    isSubmitting: false,
    error: null,
    showAreaSelection: true
  });

  const [isNavigating, setIsNavigating] = useState(false);

  // Fetch questions and existing response
  const { data, isLoading, error } = useQuery({
    queryKey: ['forecast-survey', surveyState.selectedArea],
    queryFn: async () => {
      let url = '/api/forecast/survey';
      if (surveyState.selectedArea) {
        url += `?area=${encodeURIComponent(surveyState.selectedArea)}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch survey');
      return response.json();
    }
  });

  // Fetch users for people selection
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['forecast-users'],
    queryFn: async () => {
      const response = await fetch('/api/forecast/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Fetch areas for area selection
  const { data: areasData, isLoading: areasLoading } = useQuery({
    queryKey: ['forecast-areas'],
    queryFn: async () => {
      const response = await fetch('/api/forecast/areas');
      if (!response.ok) throw new Error('Failed to fetch areas');
      return response.json();
    }
  });

  const questions: ForecastQuestion[] = data?.questions || [];
  const existingResponse = data?.currentResponse;
  const users: UserProfile[] = usersData?.users || [];
  const currentUserArea: string | null = usersData?.currentUserArea || null;
  const areas: AreaOption[] = areasData?.areas || [];
  const currentUserRegion: string | null = areasData?.currentUserRegion || null;

  // Load existing answers if available
  useEffect(() => {
    if (existingResponse?.answers) {
      const answersMap = new Map();
      existingResponse.answers.forEach((answer: any) => {
        const value = answer.answer_number !== null ? answer.answer_number : answer.answer_text;
        if (value !== null) {
          answersMap.set(answer.question_id, value);
        }
      });
      setSurveyState(prev => ({ ...prev, answers: answersMap }));
    }
  }, [existingResponse]);

  // Save to localStorage for draft persistence
  useEffect(() => {
    if (surveyState.answers.size > 0) {
      const answersObj = Object.fromEntries(surveyState.answers);
      localStorage.setItem('forecast-draft', JSON.stringify(answersObj));
    }
  }, [surveyState.answers]);

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('forecast-draft');
    if (draft && !existingResponse) {
      try {
        const answersObj = JSON.parse(draft);
        const answersMap = new Map<string, string | number>();
        Object.entries(answersObj).forEach(([key, value]) => {
          answersMap.set(key, value as string | number);
        });
        setSurveyState(prev => ({ ...prev, answers: answersMap }));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, [existingResponse]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (submission: ForecastSubmission) => {
      const response = await fetch('/api/forecast/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });
      if (!response.ok) throw new Error('Failed to submit forecast');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Forecast submitted successfully!' });
      localStorage.removeItem('forecast-draft');
      queryClient.invalidateQueries({ queryKey: ['forecast-survey'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to submit forecast',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const setAnswer = useCallback((questionId: string, value: string | number | string[] | PeopleTextAnswer) => {
    setSurveyState(prev => {
      const newAnswers = new Map(prev.answers);
      newAnswers.set(questionId, value);
      return { ...prev, answers: newAnswers };
    });
  }, []);

  const nextQuestion = useCallback(async () => {
    setIsNavigating(true);

    // Add a brief delay for loading effect
    await new Promise(resolve => setTimeout(resolve, 200));

    setSurveyState(prev => ({
      ...prev,
      currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, questions.length - 1)
    }));

    setIsNavigating(false);
  }, [questions.length]);

  const previousQuestion = useCallback(async () => {
    setIsNavigating(true);

    // Add a brief delay for loading effect
    await new Promise(resolve => setTimeout(resolve, 200));

    setSurveyState(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(prev.currentQuestionIndex - 1, 0)
    }));

    setIsNavigating(false);
  }, []);

  const goToQuestion = useCallback((index: number) => {
    setSurveyState(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(0, Math.min(index, questions.length - 1))
    }));
  }, [questions.length]);

  const selectArea = useCallback((area: string, region: string, week: string) => {
    setSurveyState(prev => ({
      ...prev,
      selectedArea: area,
      selectedRegion: region,
      selectedWeek: week,
      showAreaSelection: false,
      // Reset answers when switching areas to avoid confusion
      answers: new Map(),
      currentQuestionIndex: 0
    }));
    // Invalidate and refetch survey data for the new area
    queryClient.invalidateQueries({ queryKey: ['forecast-survey'] });
  }, [queryClient]);

  const submitSurvey = useCallback(async () => {
    const submission: ForecastSubmission = {
      week_of: surveyState.selectedWeek || getNextMonday(),
      selectedArea: surveyState.selectedArea,
      selectedRegion: surveyState.selectedRegion,
      answers: Array.from(surveyState.answers.entries()).map(([question_id, value]) => {
        if (typeof value === 'number') {
          return { question_id, answer_number: value };
        } else if (Array.isArray(value)) {
          // For people multi-select without text, store as JSON string
          return { question_id, answer_text: JSON.stringify(value) };
        } else if (value && typeof value === 'object' && 'people' in value) {
          // For people + text combo, store as: ["user1","user2"]||text content
          const peopleTextAnswer = value as PeopleTextAnswer;
          const combinedValue = `${JSON.stringify(peopleTextAnswer.people)}||${peopleTextAnswer.text}`;
          return { question_id, answer_text: combinedValue };
        } else {
          return { question_id, answer_text: value as string };
        }
      })
    };

    setSurveyState(prev => ({ ...prev, isSubmitting: true }));
    await submitMutation.mutateAsync(submission);
    setSurveyState(prev => ({ ...prev, isSubmitting: false }));
  }, [surveyState.answers, surveyState.selectedArea, surveyState.selectedRegion, surveyState.selectedWeek, submitMutation]);

  return {
    questions,
    currentQuestion: questions[surveyState.currentQuestionIndex],
    currentQuestionIndex: surveyState.currentQuestionIndex,
    answers: surveyState.answers,
    users,
    currentUserArea,
    areas,
    currentUserRegion,
    showAreaSelection: surveyState.showAreaSelection,
    selectedArea: surveyState.selectedArea,
    selectedRegion: surveyState.selectedRegion,
    selectedWeek: surveyState.selectedWeek,
    defaultWeek: getNextMonday(),
    isLoading: isLoading || usersLoading || areasLoading,
    error: error?.message || surveyState.error,
    isSubmitting: surveyState.isSubmitting || submitMutation.isPending,
    isNavigating,
    isLastQuestion: surveyState.currentQuestionIndex === questions.length - 1,
    isFirstQuestion: surveyState.currentQuestionIndex === 0,
    progress: questions.length > 0 ? ((surveyState.currentQuestionIndex + 1) / questions.length) * 100 : 0,
    setAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    selectArea,
    submitSurvey
  };
}