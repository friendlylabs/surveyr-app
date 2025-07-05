// Common types for survey components

export interface Choice {
  value: string;
  text: string;
  imageLink?: string;
  enableIf?: string;
  visibleIf?: string;
}
