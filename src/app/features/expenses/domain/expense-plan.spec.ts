import { describe, expect, it } from 'vitest';
import { Money } from './money';
import { ExpensePlanValidationError, validateExpensePlanIntent } from './expense.models';
const valid=()=>({template:{description:'Alquiler',amount:Money.fromDecimal('900.00','EUR'),payerMemberId:'m1',categoryId:null,split:{type:'EQUAL' as const,memberIds:['m1','m2']}},frequency:'MONTHLY' as const,startDate:'2026-09-01',zoneId:'Europe/Madrid',endCondition:{type:'AFTER_OCCURRENCES' as const,totalOccurrences:12},reminderDaysBefore:1});
describe('expense plan intent',()=>{
 it('accepts a finite recurring plan',()=>expect(()=>validateExpensePlanIntent(valid(),'2026-08-25')).not.toThrow());
 it('rejects a recurring plan without an end condition',()=>expect(()=>validateExpensePlanIntent({...valid(),endCondition:undefined},'2026-08-25')).toThrow(ExpensePlanValidationError));
 it('rejects a start date in the past of the selected zone',()=>expect(()=>validateExpensePlanIntent({...valid(),startDate:'2026-08-24'},'2026-08-25')).toThrow(ExpensePlanValidationError));
 it('rejects reminders outside the supported range',()=>expect(()=>validateExpensePlanIntent({...valid(),reminderDaysBefore:31},'2026-08-25')).toThrow(ExpensePlanValidationError));
});
