import { Book } from './models/book';
import { Library } from './services/libary';

describe('Library', () => {
  let library: Library;
  
  beforeEach(() => {
    library = new Library();
    // Itt hozzáadhatja a tesztelni kívánt könyveket, kölcsönzőket stb.
  });

  test('addBook should add a book to the library', () => {
    const book: Book = { id: 1, title: 'Test Book', author: 'Test Author', category: { name: 'Test Category' }};
    library.addBook(book);
    const books = library.listBooks();
    expect(books).toContain(book);
  });

  // Írjon további teszteket a többi metódusra...
});
