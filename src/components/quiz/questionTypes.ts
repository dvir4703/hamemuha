import {
  CheckCircle2,
  LayoutGrid,
  Lightbulb,
  ListChecks,
  MessageCircle,
  TextCursorInput,
  type LucideIcon,
} from 'lucide-react';

import type { QuestionType } from '../../types';

export interface QuestionTypeMeta {
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
  surfaceClass: string;
}

export const QUESTION_TYPE_ORDER: QuestionType[] = [
  'multiple_choice',
  'true_false',
  'complete_sentence',
  'open_answer',
  'multiple_options',
  'association_hints',
];

export const QUESTION_TYPE_META: Record<QuestionType, QuestionTypeMeta> = {
  multiple_choice: {
    label: 'שאלה אמריקאית',
    shortLabel: 'אמריקאית',
    description: 'אפשרויות תשובה עם בחירה נכונה אחת או יותר',
    icon: ListChecks,
    accentClass: 'text-teal',
    surfaceClass: 'bg-teal/10',
  },
  true_false: {
    label: 'נכון או לא נכון',
    shortLabel: 'נכון / לא נכון',
    description: 'שתי תשובות קבועות ובחירה נכונה אחת',
    icon: CheckCircle2,
    accentClass: 'text-emerald-700',
    surfaceClass: 'bg-emerald-50',
  },
  complete_sentence: {
    label: 'השלם משפט',
    shortLabel: 'השלם משפט',
    description: 'תשובה מילולית ורמזים שחושפים אותה בהדרגה',
    icon: TextCursorInput,
    accentClass: 'text-violet',
    surfaceClass: 'bg-violet/10',
  },
  open_answer: {
    label: 'תשובה פתוחה',
    shortLabel: 'תשובה פתוחה',
    description: 'תשובה למנחה בלבד, ללא אפשרויות לקהל',
    icon: MessageCircle,
    accentClass: 'text-sky-700',
    surfaceClass: 'bg-sky-50',
  },
  multiple_options: {
    label: 'אופציות מרובות',
    shortLabel: 'אופציות מרובות',
    description: 'אלמנט מרכזי ומספר אפשרויות נכונות אפשריות',
    icon: LayoutGrid,
    accentClass: 'text-coral',
    surfaceClass: 'bg-coral/10',
  },
  association_hints: {
    label: 'אסוציאציה ורמזים',
    shortLabel: 'אסוציאציה',
    description: 'רמזים שנחשפים בהדרגה ואפשרויות תשובה',
    icon: Lightbulb,
    accentClass: 'text-amber-dark',
    surfaceClass: 'bg-amber/15',
  },
};
