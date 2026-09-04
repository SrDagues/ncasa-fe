import { ExpenseApplicationError } from '../../application/expense.errors';
import { ExpensePlanForecast, ExpensePlanPage } from '../../application/expense.models';
import { ExpensePlan, Money, Percentage } from '../../domain';
type Json=Readonly<Record<string,unknown>>;
const bad=():never=>{throw new ExpenseApplicationError('unexpected','Invalid expense plan response');};
const obj=(v:unknown):Json=>typeof v==='object'&&v!==null&&!Array.isArray(v)?v as Json:bad();
const str=(v:unknown):string=>typeof v==='string'?v:bad();
const num=(v:unknown):number=>typeof v==='number'&&Number.isInteger(v)?v:bad();
const nullable=(v:unknown):string|null=>v===null?null:str(v);
const optionalNullable=(v:unknown):string|null=>v===undefined||v===null?null:str(v);
const array=(v:unknown):readonly unknown[]=>Array.isArray(v)?v:bad();
export function mapExpensePlan(value:unknown):ExpensePlan{
 const d=obj(value),t=obj(d['template']),currency=str(t['currency']),frequency=str(d['frequency']),status=str(d['status']),splitType=str(t['splitType']);
 if(!['ONCE','WEEKLY','MONTHLY','YEARLY'].includes(frequency)||!['ACTIVE','PAUSED','CANCELLED','COMPLETED'].includes(status)||!['EQUAL','EXACT','PERCENTAGE'].includes(splitType))return bad();
 const raw=array(t['allocations']); let split:ExpensePlan['template']['split'];
 if(splitType==='EQUAL')split={type:'EQUAL',memberIds:raw.map(v=>str(obj(v)['memberId']))};
 else if(splitType==='EXACT')split={type:'EXACT',allocations:raw.map(v=>{const a=obj(v);return{memberId:str(a['memberId']),amount:Money.fromDecimal(str(a['amount']),currency)}})};
 else split={type:'PERCENTAGE',allocations:raw.map(v=>{const a=obj(v);return{memberId:str(a['memberId']),percentage:Percentage.fromDecimal(str(a['percentage']))}})};
 const endType=str(d['endCondition']); const endCondition=endType==='UNTIL_DATE'?{type:'UNTIL_DATE' as const,endDate:str(d['endDate'])}:endType==='AFTER_OCCURRENCES'?{type:'AFTER_OCCURRENCES' as const,totalOccurrences:num(d['totalOccurrences'])}:bad();
 return{id:str(d['id']),householdId:str(d['householdId']),createdByMemberId:str(d['createdByMemberId']),template:{description:str(t['description']),amount:Money.fromDecimal(str(t['amount']),currency),payerMemberId:str(t['payerMemberId']),categoryId:optionalNullable(t['categoryId']),split},frequency:frequency as ExpensePlan['frequency'],startDate:str(d['startDate']),zoneId:str(d['zoneId']),endCondition,reminderDaysBefore:num(d['reminderDaysBefore']),materializedOccurrences:num(d['materializedOccurrences']),nextOccurrence:nullable(d['nextOccurrence']),nextOccurrenceDueAt:nullable(d['nextOccurrenceDueAt']),nextReminderAt:nullable(d['nextReminderAt']),status:status as ExpensePlan['status'],pauseReason:nullable(d['pauseReason']),cancellationReason:nullable(d['cancellationReason']),createdAt:str(d['createdAt']),updatedAt:str(d['updatedAt']),pausedAt:nullable(d['pausedAt']),cancelledAt:nullable(d['cancelledAt']),completedAt:nullable(d['completedAt']),version:num(d['version'])};
}
export function mapExpensePlanPage(value:unknown):ExpensePlanPage{const d=obj(value);return{items:array(d['content']).map(mapExpensePlan),page:num(d['page']),size:num(d['size']),totalElements:num(d['totalElements']),totalPages:num(d['totalPages'])};}
export function mapExpensePlanForecast(value:unknown):ExpensePlanForecast{const d=obj(value);return{householdId:str(d['householdId']),from:str(d['from']),to:str(d['to']),currencies:array(d['currencies']).map(v=>{const c=obj(v),currency=str(c['currency']);return{currency,total:Money.fromDecimal(str(c['total']),currency)}}),occurrences:array(d['occurrences']).map(v=>{const o=obj(v),currency=str(o['currency']);return{planId:str(o['planId']),occurrenceKey:str(o['occurrenceKey']),occurrenceDate:str(o['occurrenceDate']),description:str(o['description']),amount:Money.fromDecimal(str(o['amount']),currency),payerMemberId:str(o['payerMemberId']),categoryId:optionalNullable(o['categoryId']),allocations:array(o['allocations']).map(x=>{const a=obj(x);return{memberId:str(a['memberId']),amount:Money.fromDecimal(str(a['amount']),currency)}}),lastOccurrence:typeof o['lastOccurrence']==='boolean'?o['lastOccurrence']:bad()}})};}
