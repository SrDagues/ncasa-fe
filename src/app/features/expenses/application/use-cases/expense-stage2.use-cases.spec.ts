import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseApplicationError } from '../expense.errors';
import { ExpenseCategoryGateway } from '../ports/expense-category.gateway';
import { ExpenseDraftGateway } from '../ports/expense-draft.gateway';
import { CreateExpenseCategoryUseCase } from './expense-category.use-cases';
import { SaveExpenseDraftUseCase } from './expense-draft.use-cases';
import { ExpenseDraft, Money } from '../../domain';

const emptyDraft: ExpenseDraft = { id:'d1',householdId:'h1',createdByMemberId:'m1',description:null,payerMemberId:null,amount:null,currency:null,expenseDate:null,categoryId:null,split:null,status:'OPEN',confirmedExpenseId:null,createdAt:'2026-08-24T10:00:00Z',updatedAt:'2026-08-24T10:00:00Z',confirmedAt:null,discardedAt:null,version:0 };

describe('expense stage 2 use cases',()=>{
  it('trims a category name before crossing the port',async()=>{const port={create:vi.fn(()=>of({}))} as unknown as ExpenseCategoryGateway;await firstValueFrom(new CreateExpenseCategoryUseCase(port).execute('h1',' Food '));expect(port.create).toHaveBeenCalledWith('h1','Food');});
  it('creates and updates a draft in one explicit save',async()=>{const port=draftGateway();const snapshot={description:'Dinner',amount:Money.fromDecimal('10','EUR'),currency:'EUR',expenseDate:'2026-08-24',payerMemberId:'m1',categoryId:null,split:{type:'EQUAL' as const,memberIds:['m1']}};const saved=await firstValueFrom(new SaveExpenseDraftUseCase(port).execute({householdId:'h1',snapshot}));expect(saved.version).toBe(1);expect(port.update).toHaveBeenCalledWith('h1','d1',snapshot,0);});
  it('keeps the created draft identity when its first update fails',async()=>{const port=draftGateway();vi.mocked(port.update).mockReturnValue(throwError(()=>new ExpenseApplicationError('network','offline')));const result=firstValueFrom(new SaveExpenseDraftUseCase(port).execute({householdId:'h1',snapshot:{description:null,amount:null,currency:null,expenseDate:null,payerMemberId:null,categoryId:null,split:null}}));await expect(result).rejects.toMatchObject({recoverableDraft:{id:'d1'}});});
});
const draftGateway=():ExpenseDraftGateway=>({create:vi.fn(()=>of(emptyDraft)),list:vi.fn(()=>of([])),get:vi.fn(()=>of(emptyDraft)),update:vi.fn(()=>of({...emptyDraft,version:1})),confirm:vi.fn(),discard:vi.fn()});
