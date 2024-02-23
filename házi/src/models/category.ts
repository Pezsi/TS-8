// src/models/category.ts

export class Category {
    constructor(public name: string) {}
}

export class Fiction extends Category {
    constructor(name: string, public genre: string) {
        super(name);
    }
}

export class NonFiction extends Category {
    constructor(name: string, public field: string) {
        super(name);
    }
}
