import { Book } from "../models/book";
import { Borrower } from "../models/borrower";
import { isBook, isBorrower } from "../utils/typeGuards"; // Feltételezve, hogy a typeGuards a megfelelő helyen van definiálva
import { LoanManager } from "./loadManager";

export class Library {
  private books: Map<number, Book> = new Map();
  private borrowers: Map<number, Borrower> = new Map();
  private loans: LoanManager<Book> = new LoanManager<Book>(); // A LoanManager használata a kölcsönzési logikára

  addBook(book: Book): void {
    this.books.set(book.id, book);
  }

  addBorrower(borrower: Borrower): void {
    this.borrowers.set(borrower.id, borrower);
  }

  removeBook(bookId: number): void {
    this.books.delete(bookId);
    this.loans.removeItem(bookId); // A kölcsönzött könyvek közül is eltávolítjuk
  }

  listBooks(): Book[] {
    return Array.from(this.books.values());
  }

  borrowBook(bookId: number, borrowerId: number): void {
    const book = this.books.get(bookId);
    const borrower = this.borrowers.get(borrowerId);

    if (isBook(book) && isBorrower(borrower) && !this.loans.listItem().find(b => b.id === bookId)) {
      this.loans.addItem(book);
      console.log(`Book ${book.title} borrowed by ${borrower.name}`);
    } else {
      console.log(`Cannot borrow book: ${book ? book.title : 'Book not found'} or already borrowed`);
    }
  }

  returnBook(bookId: number): void {
    if (this.loans.listItem().find(b => b.id === bookId)) {
      this.loans.removeItem(bookId);
      console.log(`Book returned`);
    } else {
      console.log('Book was not borrowed or does not exist');
    }
  }

  listBorrowedBooks(): Book[] {
    return this.loans.listItem();
  }

  findBooksByTitle(title: string): Book[] {
    return Array.from(this.books.values()).filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
  }

  getBorrowerDetails(borrowerId: number): Borrower | undefined {
    return this.borrowers.get(borrowerId);
  }
}


