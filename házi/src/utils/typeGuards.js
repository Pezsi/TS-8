"use strict";
// src/utils/typeGuards.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBorrower = exports.isBook = void 0;
// Ellenőrzi, hogy egy objektum Book típusú-e
function isBook(obj) {
    return obj && typeof obj.id === 'number' && typeof obj.title === 'string' && typeof obj.author === 'string';
}
exports.isBook = isBook;
// Ellenőrzi, hogy egy objektum Borrower típusú-e
function isBorrower(obj) {
    return obj && typeof obj.id === 'number' && typeof obj.name === 'string';
}
exports.isBorrower = isBorrower;
