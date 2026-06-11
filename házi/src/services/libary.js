"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Library = void 0;
const typeGuards_1 = require("../utils/typeGuards"); // Feltételezve, hogy a typeGuards a megfelelő helyen van definiálva
const loadManager_1 = require("./loadManager");
class Library {
    constructor() {
        this.books = new Map();
        this.borrowers = new Map();
        this.loans = new loadManager_1.LoanManager(); // A LoanManager használata a kölcsönzési logikára
    }
    addBook(book) {
        this.books.set(book.id, book);
    }
    addBorrower(borrower) {
        this.borrowers.set(borrower.id, borrower);
    }
    removeBook(bookId) {
        this.books.delete(bookId);
        this.loans.removeItem(bookId); // A kölcsönzött könyvek közül is eltávolítjuk
    }
    listBooks() {
        return Array.from(this.books.values());
    }
    borrowBook(bookId, borrowerId) {
        const book = this.books.get(bookId);
        const borrower = this.borrowers.get(borrowerId);
        if ((0, typeGuards_1.isBook)(book) && (0, typeGuards_1.isBorrower)(borrower) && !this.loans.listItem().find(b => b.id === bookId)) {
            this.loans.addItem(book);
            console.log(`Book ${book.title} borrowed by ${borrower.name}`);
        }
        else {
            console.log(`Cannot borrow book: ${book ? book.title : 'Book not found'} or already borrowed`);
        }
    }
    returnBook(bookId) {
        if (this.loans.listItem().find(b => b.id === bookId)) {
            this.loans.removeItem(bookId);
            console.log(`Book returned`);
        }
        else {
            console.log('Book was not borrowed or does not exist');
        }
    }
    listBorrowedBooks() {
        return this.loans.listItem();
    }
    findBooksByTitle(title) {
        return Array.from(this.books.values()).filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
    }
    getBorrowerDetails(borrowerId) {
        return this.borrowers.get(borrowerId);
    }
}
exports.Library = Library;
