// src/services/loanManager.ts
export class LoanManager<T extends { id: number }> {
    private items: Map<number, T> = new Map();
  
    addItem(item: T): void {
      this.items.set(item.id, item);
      console.log(`Item added: ${item.id}`);
    }
  
    removeItem(itemId: number): void {
      this.items.delete(itemId);
      console.log(`Item removed: ${itemId}`);
    }
  
    listItem(): T[] {
      return Array.from(this.items.values());
    }
  }
  