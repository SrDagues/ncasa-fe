import { TimeZoneGateway } from '../../application/ports/expense-plan.gateway';
export class BrowserTimeZoneGateway implements TimeZoneGateway{
 current():string{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';}
 list():readonly string[]{const intl=Intl as typeof Intl&{supportedValuesOf?:(key:'timeZone')=>string[]};return intl.supportedValuesOf?.('timeZone')??[this.current()];}
 isValid(zoneId:string):boolean{try{new Intl.DateTimeFormat('en',{timeZone:zoneId}).format();return true;}catch{return false;}}
 today(zoneId:string):string{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zoneId,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const value=(type:string)=>parts.find(p=>p.type===type)?.value??'';return`${value('year')}-${value('month')}-${value('day')}`;}
}
