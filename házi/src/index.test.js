"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libary_1 = require("./services/libary");
describe('Library', () => {
    let library;
    beforeEach(() => {
        library = new libary_1.Library();
        // Itt hozzáadhatja a tesztelni kívánt könyveket, kölcsönzőket stb.
    });
    test('addBook should add a book to the library', () => {
        const book = { id: 1, title: 'Test Book', author: 'Test Author', category: { name: 'Test Category' } };
        library.addBook(book);
        const books = library.listBooks();
        expect(books).toContain(book);
    });
    // Írj további teszteket a többi metódusra...
});
