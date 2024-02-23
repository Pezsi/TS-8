import { Category } from "./category";

export interface Book {
    id: number;
    title: string;
    author: string;
    category: Category;
  }