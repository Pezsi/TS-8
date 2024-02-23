// src/utils/typeGuards.ts

import { Book } from "../models/book";
import { Borrower } from "../models/borrower";

// Ellenőrzi, hogy egy objektum Book típusú-e
export function isBook(obj: any): obj is Book {
  return obj && typeof obj.id === 'number' && typeof obj.title === 'string' && typeof obj.author === 'string';
}

// Ellenőrzi, hogy egy objektum Borrower típusú-e
export function isBorrower(obj: any): obj is Borrower {
  return obj && typeof obj.id === 'number' && typeof obj.name === 'string';
}

