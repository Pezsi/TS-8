import { Book } from "./models/book";
import { Borrower } from "./models/borrower";
import { Fiction, NonFiction } from "./models/category";
import { Library } from "./services/libary";

const library = new Library();

// Kategóriák létrehozása
const fictionCategory = new Fiction("Fiction", "Novel");
const nonFictionCategory = new NonFiction("Non-Fiction", "History");

// Könyvek létrehozása a megfelelő kategóriával
const book1: Book = { 
  id: 1, 
  title: "The Great Gatsby", 
  author: "F. Scott Fitzgerald", 
  category: fictionCategory // Fiction példány
};

const book2: Book = { 
  id: 2, 
  title: "War and Peace", 
  author: "Leo Tolstoy", 
  category: fictionCategory // Esetleg másik kategória példányát is használhatnánk
};

// Kölcsönzők létrehozása
const borrower1: Borrower = { id: 1, name: "John Doe" };
const borrower2: Borrower = { id: 2, name: "Jane Doe" };

// Könyvek hozzáadása a könyvtárhoz
library.addBook(book1);
library.addBook(book2);

// Kölcsönzők hozzáadása a könyvtárhoz
library.addBorrower(borrower1);
library.addBorrower(borrower2);

// Könyvek kölcsönzése
library.borrowBook(1, 1); // John Doe kölcsönzi "The Great Gatsby"-t
library.borrowBook(2, 2); // Jane Doe kölcsönzi "War and Peace"-t

// Kölcsönzött könyvek listázása
console.log("Kölcsönzött könyvek:");
library.listBorrowedBooks().forEach(book => console.log(`- ${book.title} by ${book.author}`));

// Egy könyv visszavitel
library.returnBook(1);
console.log("Visszavitel után kölcsönzött könyvek:");
library.listBorrowedBooks().forEach(book => console.log(`- ${book.title} by ${book.author}`));

// Könyv keresése cím alapján
console.log("Keresés 'War' címszóra:");
library.findBooksByTitle("War").forEach(book => console.log(`- ${book.title} by ${book.author}`));

// Kölcsönző adatainak lekérdezése
console.log("Kölcsönző adatai (ID: 1):");
const borrowerDetails = library.getBorrowerDetails(1);
if (borrowerDetails) {
  console.log(`Név: ${borrowerDetails.name}`);
}
