/* V20.5.37 · Typed grammar boundary. No business-state or write access. */
import {lexScoutingCode} from './scout-code-lexer';

export interface ScoutingLexerBridge{
 readonly VERSION:'20.5.37';
 readonly syntaxOnly:true;
 readonly lex:typeof lexScoutingCode;
}
export type ScoutingLexerWindow=Window&{VC_SCOUT_LEXER_20537?:Readonly<ScoutingLexerBridge>};
const installed=new WeakMap<Window,Readonly<ScoutingLexerBridge>>();

export function installScoutingLexerBridge(win:ScoutingLexerWindow):Readonly<ScoutingLexerBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<ScoutingLexerBridge>=Object.freeze({
  VERSION:'20.5.37',syntaxOnly:true,lex:lexScoutingCode
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_LEXER_20537)win.VC_SCOUT_LEXER_20537=api;
 return api;
}
