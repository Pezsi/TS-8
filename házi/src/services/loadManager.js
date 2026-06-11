"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanManager = void 0;
// src/services/loanManager.ts
class LoanManager {
    constructor() {
        this.items = new Map();
    }
    addItem(item) {
        this.items.set(item.id, item);
        console.log(`Item added: ${item.id}`);
    }
    removeItem(itemId) {
        this.items.delete(itemId);
        console.log(`Item removed: ${itemId}`);
    }
    listItem() {
        return Array.from(this.items.values());
    }
}
exports.LoanManager = LoanManager;
