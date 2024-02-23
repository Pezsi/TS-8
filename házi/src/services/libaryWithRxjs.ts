// src/services/library.ts

import { Observable, Subject } from "rxjs";
import { Book } from "../models/book";
import { Borrower } from "../models/borrower";

interface BookEvent {
    type: 'borrowed' | 'returned';
    book: Book;
    borrower?: Borrower;
  }

export class LibraryWitHRxjs {
  private books: Map<number, Book> = new Map();
  private borrowers: Map<number, Borrower> = new Map();
  private loans: Map<number, number> = new Map(); // Tárolja, hogy melyik könyv (key) melyik kölcsönzőnél van (value)
  private bookEventsSubject = new Subject<BookEvent>();
  public bookEvents$: Observable<BookEvent> = this.bookEventsSubject.asObservable();


  addBook(book: Book): void {
    this.books.set(book.id, book);
  }

  addBorrower(borrower: Borrower): void {
    this.borrowers.set(borrower.id, borrower);
  }

  removeBook(bookId: number): void {
    this.books.delete(bookId);
  }

  listBooks(): Book[] {
    return Array.from(this.books.values());
  }

  borrowBook(bookId: number, borrowerId: number): void {
    const book = this.books.get(bookId);
    const borrower = this.borrowers.get(borrowerId);
    if (book && borrower && !this.loans.has(bookId)) {
      this.loans.set(bookId, borrowerId);
      console.log(`Book ${book.title} borrowed by ${borrower.name}`);
      this.bookEventsSubject.next({ type: 'borrowed', book, borrower });
    } else {
      console.log(`Cannot borrow book: ${book ? book.title : 'Book not found'} to ${borrower ? borrower.name : 'Borrower not found'}`);
    }
  }

  returnBook(bookId: number): void {
    const book = this.books.get(bookId);
    const borrower = this.borrowers.get(bookId);
    if (book) {
      this.loans.delete(bookId);
      console.log(`Book ${book.title} returned`);
      this.bookEventsSubject.next({ type: 'returned', book, borrower });
    } else {
      console.log('Book was not borrowed');
    }
  }

  listBorrowedBooks(): Book[] {
    const borrowedBookIds = Array.from(this.loans.keys());
    return borrowedBookIds.map(id => this.books.get(id)).filter(book => book !== undefined) as Book[];
  }

  findBooksByTitle(title: string): Book[] {
    return Array.from(this.books.values()).filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
  }

  getBorrowerDetails(borrowerId: number): Borrower | undefined {
    return this.borrowers.get(borrowerId);
  }
}
