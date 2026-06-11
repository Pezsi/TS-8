"use strict";
// src/models/category.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonFiction = exports.Fiction = exports.Category = void 0;
class Category {
    constructor(name) {
        this.name = name;
    }
}
exports.Category = Category;
class Fiction extends Category {
    constructor(name, genre) {
        super(name);
        this.genre = genre;
    }
}
exports.Fiction = Fiction;
class NonFiction extends Category {
    constructor(name, field) {
        super(name);
        this.field = field;
    }
}
exports.NonFiction = NonFiction;
