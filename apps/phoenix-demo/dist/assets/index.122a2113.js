(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerpolicy&&(i.referrerPolicy=o.referrerpolicy),o.crossorigin==="use-credentials"?i.credentials="include":o.crossorigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();const kt="modulepreload",St=function(r){return"/"+r},Ce={},Ct=function(e,t,n){return!t||t.length===0?e():Promise.all(t.map(o=>{if(o=St(o),o in Ce)return;Ce[o]=!0;const i=o.endsWith(".css"),l=i?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${o}"]${l}`))return;const c=document.createElement("link");if(c.rel=i?"stylesheet":kt,i||(c.as="script",c.crossOrigin=""),c.href=o,document.head.appendChild(c),i)return new Promise((a,h)=>{c.addEventListener("load",a),c.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${o}`)))})})).then(()=>e())};var F={exports:{}};const Tt="2.0.0",rt=256,_t=Number.MAX_SAFE_INTEGER||9007199254740991,At=16,Ot=rt-6,Pt=["major","premajor","minor","preminor","patch","prepatch","prerelease"];var re={MAX_LENGTH:rt,MAX_SAFE_COMPONENT_LENGTH:At,MAX_SAFE_BUILD_LENGTH:Ot,MAX_SAFE_INTEGER:_t,RELEASE_TYPES:Pt,SEMVER_SPEC_VERSION:Tt,FLAG_INCLUDE_PRERELEASE:1,FLAG_LOOSE:2};const jt=typeof process=="object"&&process.env&&process.env.NODE_DEBUG&&/\bsemver\b/i.test(process.env.NODE_DEBUG)?(...r)=>console.error("SEMVER",...r):()=>{};var ne=jt;(function(r,e){const{MAX_SAFE_COMPONENT_LENGTH:t,MAX_SAFE_BUILD_LENGTH:n,MAX_LENGTH:o}=re,i=ne;e=r.exports={};const l=e.re=[],c=e.safeRe=[],a=e.src=[],h=e.safeSrc=[],s=e.t={};let f=0;const E="[a-zA-Z0-9-]",d=[["\\s",1],["\\d",o],[E,n]],_=S=>{for(const[T,L]of d)S=S.split(`${T}*`).join(`${T}{0,${L}}`).split(`${T}+`).join(`${T}{1,${L}}`);return S},m=(S,T,L)=>{const R=_(T),k=f++;i(S,k,T),s[S]=k,a[k]=T,h[k]=R,l[k]=new RegExp(T,L?"g":void 0),c[k]=new RegExp(R,L?"g":void 0)};m("NUMERICIDENTIFIER","0|[1-9]\\d*"),m("NUMERICIDENTIFIERLOOSE","\\d+"),m("NONNUMERICIDENTIFIER",`\\d*[a-zA-Z-]${E}*`),m("MAINVERSION",`(${a[s.NUMERICIDENTIFIER]})\\.(${a[s.NUMERICIDENTIFIER]})\\.(${a[s.NUMERICIDENTIFIER]})`),m("MAINVERSIONLOOSE",`(${a[s.NUMERICIDENTIFIERLOOSE]})\\.(${a[s.NUMERICIDENTIFIERLOOSE]})\\.(${a[s.NUMERICIDENTIFIERLOOSE]})`),m("PRERELEASEIDENTIFIER",`(?:${a[s.NONNUMERICIDENTIFIER]}|${a[s.NUMERICIDENTIFIER]})`),m("PRERELEASEIDENTIFIERLOOSE",`(?:${a[s.NONNUMERICIDENTIFIER]}|${a[s.NUMERICIDENTIFIERLOOSE]})`),m("PRERELEASE",`(?:-(${a[s.PRERELEASEIDENTIFIER]}(?:\\.${a[s.PRERELEASEIDENTIFIER]})*))`),m("PRERELEASELOOSE",`(?:-?(${a[s.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${a[s.PRERELEASEIDENTIFIERLOOSE]})*))`),m("BUILDIDENTIFIER",`${E}+`),m("BUILD",`(?:\\+(${a[s.BUILDIDENTIFIER]}(?:\\.${a[s.BUILDIDENTIFIER]})*))`),m("FULLPLAIN",`v?${a[s.MAINVERSION]}${a[s.PRERELEASE]}?${a[s.BUILD]}?`),m("FULL",`^${a[s.FULLPLAIN]}$`),m("LOOSEPLAIN",`[v=\\s]*${a[s.MAINVERSIONLOOSE]}${a[s.PRERELEASELOOSE]}?${a[s.BUILD]}?`),m("LOOSE",`^${a[s.LOOSEPLAIN]}$`),m("GTLT","((?:<|>)?=?)"),m("XRANGEIDENTIFIERLOOSE",`${a[s.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`),m("XRANGEIDENTIFIER",`${a[s.NUMERICIDENTIFIER]}|x|X|\\*`),m("XRANGEPLAIN",`[v=\\s]*(${a[s.XRANGEIDENTIFIER]})(?:\\.(${a[s.XRANGEIDENTIFIER]})(?:\\.(${a[s.XRANGEIDENTIFIER]})(?:${a[s.PRERELEASE]})?${a[s.BUILD]}?)?)?`),m("XRANGEPLAINLOOSE",`[v=\\s]*(${a[s.XRANGEIDENTIFIERLOOSE]})(?:\\.(${a[s.XRANGEIDENTIFIERLOOSE]})(?:\\.(${a[s.XRANGEIDENTIFIERLOOSE]})(?:${a[s.PRERELEASELOOSE]})?${a[s.BUILD]}?)?)?`),m("XRANGE",`^${a[s.GTLT]}\\s*${a[s.XRANGEPLAIN]}$`),m("XRANGELOOSE",`^${a[s.GTLT]}\\s*${a[s.XRANGEPLAINLOOSE]}$`),m("COERCEPLAIN",`(^|[^\\d])(\\d{1,${t}})(?:\\.(\\d{1,${t}}))?(?:\\.(\\d{1,${t}}))?`),m("COERCE",`${a[s.COERCEPLAIN]}(?:$|[^\\d])`),m("COERCEFULL",a[s.COERCEPLAIN]+`(?:${a[s.PRERELEASE]})?(?:${a[s.BUILD]})?(?:$|[^\\d])`),m("COERCERTL",a[s.COERCE],!0),m("COERCERTLFULL",a[s.COERCEFULL],!0),m("LONETILDE","(?:~>?)"),m("TILDETRIM",`(\\s*)${a[s.LONETILDE]}\\s+`,!0),e.tildeTrimReplace="$1~",m("TILDE",`^${a[s.LONETILDE]}${a[s.XRANGEPLAIN]}$`),m("TILDELOOSE",`^${a[s.LONETILDE]}${a[s.XRANGEPLAINLOOSE]}$`),m("LONECARET","(?:\\^)"),m("CARETTRIM",`(\\s*)${a[s.LONECARET]}\\s+`,!0),e.caretTrimReplace="$1^",m("CARET",`^${a[s.LONECARET]}${a[s.XRANGEPLAIN]}$`),m("CARETLOOSE",`^${a[s.LONECARET]}${a[s.XRANGEPLAINLOOSE]}$`),m("COMPARATORLOOSE",`^${a[s.GTLT]}\\s*(${a[s.LOOSEPLAIN]})$|^$`),m("COMPARATOR",`^${a[s.GTLT]}\\s*(${a[s.FULLPLAIN]})$|^$`),m("COMPARATORTRIM",`(\\s*)${a[s.GTLT]}\\s*(${a[s.LOOSEPLAIN]}|${a[s.XRANGEPLAIN]})`,!0),e.comparatorTrimReplace="$1$2$3",m("HYPHENRANGE",`^\\s*(${a[s.XRANGEPLAIN]})\\s+-\\s+(${a[s.XRANGEPLAIN]})\\s*$`),m("HYPHENRANGELOOSE",`^\\s*(${a[s.XRANGEPLAINLOOSE]})\\s+-\\s+(${a[s.XRANGEPLAINLOOSE]})\\s*$`),m("STAR","(<|>)?=?\\s*\\*"),m("GTE0","^\\s*>=\\s*0\\.0\\.0\\s*$"),m("GTE0PRE","^\\s*>=\\s*0\\.0\\.0-0\\s*$")})(F,F.exports);const Dt=Object.freeze({loose:!0}),Ft=Object.freeze({}),zt=r=>r?typeof r!="object"?Dt:r:Ft;var xe=zt;const Te=/^[0-9]+$/,nt=(r,e)=>{if(typeof r=="number"&&typeof e=="number")return r===e?0:r<e?-1:1;const t=Te.test(r),n=Te.test(e);return t&&n&&(r=+r,e=+e),r===e?0:t&&!n?-1:n&&!t?1:r<e?-1:1},Ut=(r,e)=>nt(e,r);var ot={compareIdentifiers:nt,rcompareIdentifiers:Ut};const Y=ne,{MAX_LENGTH:_e,MAX_SAFE_INTEGER:q}=re,{safeRe:W,t:J}=F.exports,Xt=xe,{compareIdentifiers:ue}=ot;class O{constructor(e,t){if(t=Xt(t),e instanceof O){if(e.loose===!!t.loose&&e.includePrerelease===!!t.includePrerelease)return e;e=e.version}else if(typeof e!="string")throw new TypeError(`Invalid version. Must be a string. Got type "${typeof e}".`);if(e.length>_e)throw new TypeError(`version is longer than ${_e} characters`);Y("SemVer",e,t),this.options=t,this.loose=!!t.loose,this.includePrerelease=!!t.includePrerelease;const n=e.trim().match(t.loose?W[J.LOOSE]:W[J.FULL]);if(!n)throw new TypeError(`Invalid Version: ${e}`);if(this.raw=e,this.major=+n[1],this.minor=+n[2],this.patch=+n[3],this.major>q||this.major<0)throw new TypeError("Invalid major version");if(this.minor>q||this.minor<0)throw new TypeError("Invalid minor version");if(this.patch>q||this.patch<0)throw new TypeError("Invalid patch version");n[4]?this.prerelease=n[4].split(".").map(o=>{if(/^[0-9]+$/.test(o)){const i=+o;if(i>=0&&i<q)return i}return o}):this.prerelease=[],this.build=n[5]?n[5].split("."):[],this.format()}format(){return this.version=`${this.major}.${this.minor}.${this.patch}`,this.prerelease.length&&(this.version+=`-${this.prerelease.join(".")}`),this.version}toString(){return this.version}compare(e){if(Y("SemVer.compare",this.version,this.options,e),!(e instanceof O)){if(typeof e=="string"&&e===this.version)return 0;e=new O(e,this.options)}return e.version===this.version?0:this.compareMain(e)||this.comparePre(e)}compareMain(e){return e instanceof O||(e=new O(e,this.options)),this.major<e.major?-1:this.major>e.major?1:this.minor<e.minor?-1:this.minor>e.minor?1:this.patch<e.patch?-1:this.patch>e.patch?1:0}comparePre(e){if(e instanceof O||(e=new O(e,this.options)),this.prerelease.length&&!e.prerelease.length)return-1;if(!this.prerelease.length&&e.prerelease.length)return 1;if(!this.prerelease.length&&!e.prerelease.length)return 0;let t=0;do{const n=this.prerelease[t],o=e.prerelease[t];if(Y("prerelease compare",t,n,o),n===void 0&&o===void 0)return 0;if(o===void 0)return 1;if(n===void 0)return-1;if(n===o)continue;return ue(n,o)}while(++t)}compareBuild(e){e instanceof O||(e=new O(e,this.options));let t=0;do{const n=this.build[t],o=e.build[t];if(Y("build compare",t,n,o),n===void 0&&o===void 0)return 0;if(o===void 0)return 1;if(n===void 0)return-1;if(n===o)continue;return ue(n,o)}while(++t)}inc(e,t,n){if(e.startsWith("pre")){if(!t&&n===!1)throw new Error("invalid increment argument: identifier is empty");if(t){const o=`-${t}`.match(this.options.loose?W[J.PRERELEASELOOSE]:W[J.PRERELEASE]);if(!o||o[1]!==t)throw new Error(`invalid identifier: ${t}`)}}switch(e){case"premajor":this.prerelease.length=0,this.patch=0,this.minor=0,this.major++,this.inc("pre",t,n);break;case"preminor":this.prerelease.length=0,this.patch=0,this.minor++,this.inc("pre",t,n);break;case"prepatch":this.prerelease.length=0,this.inc("patch",t,n),this.inc("pre",t,n);break;case"prerelease":this.prerelease.length===0&&this.inc("patch",t,n),this.inc("pre",t,n);break;case"release":if(this.prerelease.length===0)throw new Error(`version ${this.raw} is not a prerelease`);this.prerelease.length=0;break;case"major":(this.minor!==0||this.patch!==0||this.prerelease.length===0)&&this.major++,this.minor=0,this.patch=0,this.prerelease=[];break;case"minor":(this.patch!==0||this.prerelease.length===0)&&this.minor++,this.patch=0,this.prerelease=[];break;case"patch":this.prerelease.length===0&&this.patch++,this.prerelease=[];break;case"pre":{const o=Number(n)?1:0;if(this.prerelease.length===0)this.prerelease=[o];else{let i=this.prerelease.length;for(;--i>=0;)typeof this.prerelease[i]=="number"&&(this.prerelease[i]++,i=-2);if(i===-1){if(t===this.prerelease.join(".")&&n===!1)throw new Error("invalid increment argument: identifier already exists");this.prerelease.push(o)}}if(t){let i=[t,o];n===!1&&(i=[t]),ue(this.prerelease[0],t)===0?isNaN(this.prerelease[1])&&(this.prerelease=i):this.prerelease=i}break}default:throw new Error(`invalid increment argument: ${e}`)}return this.raw=this.format(),this.build.length&&(this.raw+=`+${this.build.join(".")}`),this}}var C=O;const Ae=C,Bt=(r,e,t=!1)=>{if(r instanceof Ae)return r;try{return new Ae(r,e)}catch(n){if(!t)return null;throw n}};var B=Bt;const Gt=B,Mt=(r,e)=>{const t=Gt(r,e);return t?t.version:null};var Vt=Mt;const Ht=B,Yt=(r,e)=>{const t=Ht(r.trim().replace(/^[=v]+/,""),e);return t?t.version:null};var qt=Yt;const Oe=C,Wt=(r,e,t,n,o)=>{typeof t=="string"&&(o=n,n=t,t=void 0);try{return new Oe(r instanceof Oe?r.version:r,t).inc(e,n,o).version}catch{return null}};var Jt=Wt;const Pe=B,Kt=(r,e)=>{const t=Pe(r,null,!0),n=Pe(e,null,!0),o=t.compare(n);if(o===0)return null;const i=o>0,l=i?t:n,c=i?n:t,a=!!l.prerelease.length;if(!!c.prerelease.length&&!a){if(!c.patch&&!c.minor)return"major";if(c.compareMain(l)===0)return c.minor&&!c.patch?"minor":"patch"}const s=a?"pre":"";return t.major!==n.major?s+"major":t.minor!==n.minor?s+"minor":t.patch!==n.patch?s+"patch":"prerelease"};var Zt=Kt;const Qt=C,er=(r,e)=>new Qt(r,e).major;var tr=er;const rr=C,nr=(r,e)=>new rr(r,e).minor;var or=nr;const ir=C,sr=(r,e)=>new ir(r,e).patch;var ar=sr;const lr=B,cr=(r,e)=>{const t=lr(r,e);return t&&t.prerelease.length?t.prerelease:null};var ur=cr;const je=C,pr=(r,e,t)=>new je(r,t).compare(new je(e,t));var P=pr;const dr=P,fr=(r,e,t)=>dr(e,r,t);var mr=fr;const hr=P,gr=(r,e)=>hr(r,e,!0);var wr=gr;const De=C,br=(r,e,t)=>{const n=new De(r,t),o=new De(e,t);return n.compare(o)||n.compareBuild(o)};var $e=br;const yr=$e,Er=(r,e)=>r.sort((t,n)=>yr(t,n,e));var vr=Er;const xr=$e,$r=(r,e)=>r.sort((t,n)=>xr(n,t,e));var Rr=$r;const Nr=P,Lr=(r,e,t)=>Nr(r,e,t)>0;var oe=Lr;const Ir=P,kr=(r,e,t)=>Ir(r,e,t)<0;var Re=kr;const Sr=P,Cr=(r,e,t)=>Sr(r,e,t)===0;var it=Cr;const Tr=P,_r=(r,e,t)=>Tr(r,e,t)!==0;var st=_r;const Ar=P,Or=(r,e,t)=>Ar(r,e,t)>=0;var Ne=Or;const Pr=P,jr=(r,e,t)=>Pr(r,e,t)<=0;var Le=jr;const Dr=it,Fr=st,zr=oe,Ur=Ne,Xr=Re,Br=Le,Gr=(r,e,t,n)=>{switch(e){case"===":return typeof r=="object"&&(r=r.version),typeof t=="object"&&(t=t.version),r===t;case"!==":return typeof r=="object"&&(r=r.version),typeof t=="object"&&(t=t.version),r!==t;case"":case"=":case"==":return Dr(r,t,n);case"!=":return Fr(r,t,n);case">":return zr(r,t,n);case">=":return Ur(r,t,n);case"<":return Xr(r,t,n);case"<=":return Br(r,t,n);default:throw new TypeError(`Invalid operator: ${e}`)}};var at=Gr;const Mr=C,Vr=B,{safeRe:K,t:Z}=F.exports,Hr=(r,e)=>{if(r instanceof Mr)return r;if(typeof r=="number"&&(r=String(r)),typeof r!="string")return null;e=e||{};let t=null;if(!e.rtl)t=r.match(e.includePrerelease?K[Z.COERCEFULL]:K[Z.COERCE]);else{const a=e.includePrerelease?K[Z.COERCERTLFULL]:K[Z.COERCERTL];let h;for(;(h=a.exec(r))&&(!t||t.index+t[0].length!==r.length);)(!t||h.index+h[0].length!==t.index+t[0].length)&&(t=h),a.lastIndex=h.index+h[1].length+h[2].length;a.lastIndex=-1}if(t===null)return null;const n=t[2],o=t[3]||"0",i=t[4]||"0",l=e.includePrerelease&&t[5]?`-${t[5]}`:"",c=e.includePrerelease&&t[6]?`+${t[6]}`:"";return Vr(`${n}.${o}.${i}${l}${c}`,e)};var Yr=Hr;class qr{constructor(){this.max=1e3,this.map=new Map}get(e){const t=this.map.get(e);if(t!==void 0)return this.map.delete(e),this.map.set(e,t),t}delete(e){return this.map.delete(e)}set(e,t){if(!this.delete(e)&&t!==void 0){if(this.map.size>=this.max){const o=this.map.keys().next().value;this.delete(o)}this.map.set(e,t)}return this}}var Wr=qr,pe,Fe;function j(){if(Fe)return pe;Fe=1;const r=/\s+/g;class e{constructor(u,b){if(b=o(b),u instanceof e)return u.loose===!!b.loose&&u.includePrerelease===!!b.includePrerelease?u:new e(u.raw,b);if(u instanceof i)return this.raw=u.value,this.set=[[u]],this.formatted=void 0,this;if(this.options=b,this.loose=!!b.loose,this.includePrerelease=!!b.includePrerelease,this.raw=u.trim().replace(r," "),this.set=this.raw.split("||").map(g=>this.parseRange(g.trim())).filter(g=>g.length),!this.set.length)throw new TypeError(`Invalid SemVer Range: ${this.raw}`);if(this.set.length>1){const g=this.set[0];if(this.set=this.set.filter(y=>!m(y[0])),this.set.length===0)this.set=[g];else if(this.set.length>1){for(const y of this.set)if(y.length===1&&S(y[0])){this.set=[y];break}}}this.formatted=void 0}get range(){if(this.formatted===void 0){this.formatted="";for(let u=0;u<this.set.length;u++){u>0&&(this.formatted+="||");const b=this.set[u];for(let g=0;g<b.length;g++)g>0&&(this.formatted+=" "),this.formatted+=b[g].toString().trim()}}return this.formatted}format(){return this.range}toString(){return this.range}parseRange(u){const g=((this.options.includePrerelease&&d)|(this.options.loose&&_))+":"+u,y=n.get(g);if(y)return y;const w=this.options.loose,v=w?a[h.HYPHENRANGELOOSE]:a[h.HYPHENRANGE];u=u.replace(v,Lt(this.options.includePrerelease)),l("hyphen replace",u),u=u.replace(a[h.COMPARATORTRIM],s),l("comparator trim",u),u=u.replace(a[h.TILDETRIM],f),l("tilde trim",u),u=u.replace(a[h.CARETTRIM],E),l("caret trim",u);let $=u.split(" ").map(I=>L(I,this.options)).join(" ").split(/\s+/).map(I=>Nt(I,this.options));w&&($=$.filter(I=>(l("loose invalid filter",I,this.options),!!I.match(a[h.COMPARATORLOOSE])))),l("range list",$);const x=new Map,N=$.map(I=>new i(I,this.options));for(const I of N){if(m(I))return[I];x.set(I.value,I)}x.size>1&&x.has("")&&x.delete("");const A=[...x.values()];return n.set(g,A),A}intersects(u,b){if(!(u instanceof e))throw new TypeError("a Range is required");return this.set.some(g=>T(g,b)&&u.set.some(y=>T(y,b)&&g.every(w=>y.every(v=>w.intersects(v,b)))))}test(u){if(!u)return!1;if(typeof u=="string")try{u=new c(u,this.options)}catch{return!1}for(let b=0;b<this.set.length;b++)if(It(this.set[b],u,this.options))return!0;return!1}}pe=e;const t=Wr,n=new t,o=xe,i=ie(),l=ne,c=C,{safeRe:a,t:h,comparatorTrimReplace:s,tildeTrimReplace:f,caretTrimReplace:E}=F.exports,{FLAG_INCLUDE_PRERELEASE:d,FLAG_LOOSE:_}=re,m=p=>p.value==="<0.0.0-0",S=p=>p.value==="",T=(p,u)=>{let b=!0;const g=p.slice();let y=g.pop();for(;b&&g.length;)b=g.every(w=>y.intersects(w,u)),y=g.pop();return b},L=(p,u)=>(p=p.replace(a[h.BUILD],""),l("comp",p,u),p=Et(p,u),l("caret",p),p=k(p,u),l("tildes",p),p=xt(p,u),l("xrange",p),p=Rt(p,u),l("stars",p),p),R=p=>!p||p.toLowerCase()==="x"||p==="*",k=(p,u)=>p.trim().split(/\s+/).map(b=>D(b,u)).join(" "),D=(p,u)=>{const b=u.loose?a[h.TILDELOOSE]:a[h.TILDE];return p.replace(b,(g,y,w,v,$)=>{l("tilde",p,g,y,w,v,$);let x;return R(y)?x="":R(w)?x=`>=${y}.0.0 <${+y+1}.0.0-0`:R(v)?x=`>=${y}.${w}.0 <${y}.${+w+1}.0-0`:$?(l("replaceTilde pr",$),x=`>=${y}.${w}.${v}-${$} <${y}.${+w+1}.0-0`):x=`>=${y}.${w}.${v} <${y}.${+w+1}.0-0`,l("tilde return",x),x})},Et=(p,u)=>p.trim().split(/\s+/).map(b=>vt(b,u)).join(" "),vt=(p,u)=>{l("caret",p,u);const b=u.loose?a[h.CARETLOOSE]:a[h.CARET],g=u.includePrerelease?"-0":"";return p.replace(b,(y,w,v,$,x)=>{l("caret",p,y,w,v,$,x);let N;return R(w)?N="":R(v)?N=`>=${w}.0.0${g} <${+w+1}.0.0-0`:R($)?w==="0"?N=`>=${w}.${v}.0${g} <${w}.${+v+1}.0-0`:N=`>=${w}.${v}.0${g} <${+w+1}.0.0-0`:x?(l("replaceCaret pr",x),w==="0"?v==="0"?N=`>=${w}.${v}.${$}-${x} <${w}.${v}.${+$+1}-0`:N=`>=${w}.${v}.${$}-${x} <${w}.${+v+1}.0-0`:N=`>=${w}.${v}.${$}-${x} <${+w+1}.0.0-0`):(l("no pr"),w==="0"?v==="0"?N=`>=${w}.${v}.${$}${g} <${w}.${v}.${+$+1}-0`:N=`>=${w}.${v}.${$}${g} <${w}.${+v+1}.0-0`:N=`>=${w}.${v}.${$} <${+w+1}.0.0-0`),l("caret return",N),N})},xt=(p,u)=>(l("replaceXRanges",p,u),p.split(/\s+/).map(b=>$t(b,u)).join(" ")),$t=(p,u)=>{p=p.trim();const b=u.loose?a[h.XRANGELOOSE]:a[h.XRANGE];return p.replace(b,(g,y,w,v,$,x)=>{l("xRange",p,g,y,w,v,$,x);const N=R(w),A=N||R(v),I=A||R($),G=I;return y==="="&&G&&(y=""),x=u.includePrerelease?"-0":"",N?y===">"||y==="<"?g="<0.0.0-0":g="*":y&&G?(A&&(v=0),$=0,y===">"?(y=">=",A?(w=+w+1,v=0,$=0):(v=+v+1,$=0)):y==="<="&&(y="<",A?w=+w+1:v=+v+1),y==="<"&&(x="-0"),g=`${y+w}.${v}.${$}${x}`):A?g=`>=${w}.0.0${x} <${+w+1}.0.0-0`:I&&(g=`>=${w}.${v}.0${x} <${w}.${+v+1}.0-0`),l("xRange return",g),g})},Rt=(p,u)=>(l("replaceStars",p,u),p.trim().replace(a[h.STAR],"")),Nt=(p,u)=>(l("replaceGTE0",p,u),p.trim().replace(a[u.includePrerelease?h.GTE0PRE:h.GTE0],"")),Lt=p=>(u,b,g,y,w,v,$,x,N,A,I,G)=>(R(g)?b="":R(y)?b=`>=${g}.0.0${p?"-0":""}`:R(w)?b=`>=${g}.${y}.0${p?"-0":""}`:v?b=`>=${b}`:b=`>=${b}${p?"-0":""}`,R(N)?x="":R(A)?x=`<${+N+1}.0.0-0`:R(I)?x=`<${N}.${+A+1}.0-0`:G?x=`<=${N}.${A}.${I}-${G}`:p?x=`<${N}.${A}.${+I+1}-0`:x=`<=${x}`,`${b} ${x}`.trim()),It=(p,u,b)=>{for(let g=0;g<p.length;g++)if(!p[g].test(u))return!1;if(u.prerelease.length&&!b.includePrerelease){for(let g=0;g<p.length;g++)if(l(p[g].semver),p[g].semver!==i.ANY&&p[g].semver.prerelease.length>0){const y=p[g].semver;if(y.major===u.major&&y.minor===u.minor&&y.patch===u.patch)return!0}return!1}return!0};return pe}var de,ze;function ie(){if(ze)return de;ze=1;const r=Symbol("SemVer ANY");class e{static get ANY(){return r}constructor(s,f){if(f=t(f),s instanceof e){if(s.loose===!!f.loose)return s;s=s.value}s=s.trim().split(/\s+/).join(" "),l("comparator",s,f),this.options=f,this.loose=!!f.loose,this.parse(s),this.semver===r?this.value="":this.value=this.operator+this.semver.version,l("comp",this)}parse(s){const f=this.options.loose?n[o.COMPARATORLOOSE]:n[o.COMPARATOR],E=s.match(f);if(!E)throw new TypeError(`Invalid comparator: ${s}`);this.operator=E[1]!==void 0?E[1]:"",this.operator==="="&&(this.operator=""),E[2]?this.semver=new c(E[2],this.options.loose):this.semver=r}toString(){return this.value}test(s){if(l("Comparator.test",s,this.options.loose),this.semver===r||s===r)return!0;if(typeof s=="string")try{s=new c(s,this.options)}catch{return!1}return i(s,this.operator,this.semver,this.options)}intersects(s,f){if(!(s instanceof e))throw new TypeError("a Comparator is required");return this.operator===""?this.value===""?!0:new a(s.value,f).test(this.value):s.operator===""?s.value===""?!0:new a(this.value,f).test(s.semver):(f=t(f),f.includePrerelease&&(this.value==="<0.0.0-0"||s.value==="<0.0.0-0")||!f.includePrerelease&&(this.value.startsWith("<0.0.0")||s.value.startsWith("<0.0.0"))?!1:!!(this.operator.startsWith(">")&&s.operator.startsWith(">")||this.operator.startsWith("<")&&s.operator.startsWith("<")||this.semver.version===s.semver.version&&this.operator.includes("=")&&s.operator.includes("=")||i(this.semver,"<",s.semver,f)&&this.operator.startsWith(">")&&s.operator.startsWith("<")||i(this.semver,">",s.semver,f)&&this.operator.startsWith("<")&&s.operator.startsWith(">")))}}de=e;const t=xe,{safeRe:n,t:o}=F.exports,i=at,l=ne,c=C,a=j();return de}const Jr=j(),Kr=(r,e,t)=>{try{e=new Jr(e,t)}catch{return!1}return e.test(r)};var se=Kr;const Zr=j(),Qr=(r,e)=>new Zr(r,e).set.map(t=>t.map(n=>n.value).join(" ").trim().split(" "));var en=Qr;const tn=C,rn=j(),nn=(r,e,t)=>{let n=null,o=null,i=null;try{i=new rn(e,t)}catch{return null}return r.forEach(l=>{i.test(l)&&(!n||o.compare(l)===-1)&&(n=l,o=new tn(n,t))}),n};var on=nn;const sn=C,an=j(),ln=(r,e,t)=>{let n=null,o=null,i=null;try{i=new an(e,t)}catch{return null}return r.forEach(l=>{i.test(l)&&(!n||o.compare(l)===1)&&(n=l,o=new sn(n,t))}),n};var cn=ln;const fe=C,un=j(),Ue=oe,pn=(r,e)=>{r=new un(r,e);let t=new fe("0.0.0");if(r.test(t)||(t=new fe("0.0.0-0"),r.test(t)))return t;t=null;for(let n=0;n<r.set.length;++n){const o=r.set[n];let i=null;o.forEach(l=>{const c=new fe(l.semver.version);switch(l.operator){case">":c.prerelease.length===0?c.patch++:c.prerelease.push(0),c.raw=c.format();case"":case">=":(!i||Ue(c,i))&&(i=c);break;case"<":case"<=":break;default:throw new Error(`Unexpected operation: ${l.operator}`)}}),i&&(!t||Ue(t,i))&&(t=i)}return t&&r.test(t)?t:null};var dn=pn;const fn=j(),mn=(r,e)=>{try{return new fn(r,e).range||"*"}catch{return null}};var hn=mn;const gn=C,lt=ie(),{ANY:wn}=lt,bn=j(),yn=se,Xe=oe,Be=Re,En=Le,vn=Ne,xn=(r,e,t,n)=>{r=new gn(r,n),e=new bn(e,n);let o,i,l,c,a;switch(t){case">":o=Xe,i=En,l=Be,c=">",a=">=";break;case"<":o=Be,i=vn,l=Xe,c="<",a="<=";break;default:throw new TypeError('Must provide a hilo val of "<" or ">"')}if(yn(r,e,n))return!1;for(let h=0;h<e.set.length;++h){const s=e.set[h];let f=null,E=null;if(s.forEach(d=>{d.semver===wn&&(d=new lt(">=0.0.0")),f=f||d,E=E||d,o(d.semver,f.semver,n)?f=d:l(d.semver,E.semver,n)&&(E=d)}),f.operator===c||f.operator===a||(!E.operator||E.operator===c)&&i(r,E.semver))return!1;if(E.operator===a&&l(r,E.semver))return!1}return!0};var Ie=xn;const $n=Ie,Rn=(r,e,t)=>$n(r,e,">",t);var Nn=Rn;const Ln=Ie,In=(r,e,t)=>Ln(r,e,"<",t);var kn=In;const Ge=j(),Sn=(r,e,t)=>(r=new Ge(r,t),e=new Ge(e,t),r.intersects(e,t));var Cn=Sn;const Tn=se,_n=P;var An=(r,e,t)=>{const n=[];let o=null,i=null;const l=r.sort((s,f)=>_n(s,f,t));for(const s of l)Tn(s,e,t)?(i=s,o||(o=s)):(i&&n.push([o,i]),i=null,o=null);o&&n.push([o,null]);const c=[];for(const[s,f]of n)s===f?c.push(s):!f&&s===l[0]?c.push("*"):f?s===l[0]?c.push(`<=${f}`):c.push(`${s} - ${f}`):c.push(`>=${s}`);const a=c.join(" || "),h=typeof e.raw=="string"?e.raw:String(e);return a.length<h.length?a:e};const Me=j(),ke=ie(),{ANY:me}=ke,M=se,Se=P,On=(r,e,t={})=>{if(r===e)return!0;r=new Me(r,t),e=new Me(e,t);let n=!1;e:for(const o of r.set){for(const i of e.set){const l=jn(o,i,t);if(n=n||l!==null,l)continue e}if(n)return!1}return!0},Pn=[new ke(">=0.0.0-0")],Ve=[new ke(">=0.0.0")],jn=(r,e,t)=>{if(r===e)return!0;if(r.length===1&&r[0].semver===me){if(e.length===1&&e[0].semver===me)return!0;t.includePrerelease?r=Pn:r=Ve}if(e.length===1&&e[0].semver===me){if(t.includePrerelease)return!0;e=Ve}const n=new Set;let o,i;for(const d of r)d.operator===">"||d.operator===">="?o=He(o,d,t):d.operator==="<"||d.operator==="<="?i=Ye(i,d,t):n.add(d.semver);if(n.size>1)return null;let l;if(o&&i){if(l=Se(o.semver,i.semver,t),l>0)return null;if(l===0&&(o.operator!==">="||i.operator!=="<="))return null}for(const d of n){if(o&&!M(d,String(o),t)||i&&!M(d,String(i),t))return null;for(const _ of e)if(!M(d,String(_),t))return!1;return!0}let c,a,h,s,f=i&&!t.includePrerelease&&i.semver.prerelease.length?i.semver:!1,E=o&&!t.includePrerelease&&o.semver.prerelease.length?o.semver:!1;f&&f.prerelease.length===1&&i.operator==="<"&&f.prerelease[0]===0&&(f=!1);for(const d of e){if(s=s||d.operator===">"||d.operator===">=",h=h||d.operator==="<"||d.operator==="<=",o){if(E&&d.semver.prerelease&&d.semver.prerelease.length&&d.semver.major===E.major&&d.semver.minor===E.minor&&d.semver.patch===E.patch&&(E=!1),d.operator===">"||d.operator===">="){if(c=He(o,d,t),c===d&&c!==o)return!1}else if(o.operator===">="&&!M(o.semver,String(d),t))return!1}if(i){if(f&&d.semver.prerelease&&d.semver.prerelease.length&&d.semver.major===f.major&&d.semver.minor===f.minor&&d.semver.patch===f.patch&&(f=!1),d.operator==="<"||d.operator==="<="){if(a=Ye(i,d,t),a===d&&a!==i)return!1}else if(i.operator==="<="&&!M(i.semver,String(d),t))return!1}if(!d.operator&&(i||o)&&l!==0)return!1}return!(o&&h&&!i&&l!==0||i&&s&&!o&&l!==0||E||f)},He=(r,e,t)=>{if(!r)return e;const n=Se(r.semver,e.semver,t);return n>0?r:n<0||e.operator===">"&&r.operator===">="?e:r},Ye=(r,e,t)=>{if(!r)return e;const n=Se(r.semver,e.semver,t);return n<0?r:n>0||e.operator==="<"&&r.operator==="<="?e:r};var Dn=On;const he=F.exports,qe=re,Fn=C,We=ot,zn=B,Un=Vt,Xn=qt,Bn=Jt,Gn=Zt,Mn=tr,Vn=or,Hn=ar,Yn=ur,qn=P,Wn=mr,Jn=wr,Kn=$e,Zn=vr,Qn=Rr,eo=oe,to=Re,ro=it,no=st,oo=Ne,io=Le,so=at,ao=Yr,lo=ie(),co=j(),uo=se,po=en,fo=on,mo=cn,ho=dn,go=hn,wo=Ie,bo=Nn,yo=kn,Eo=Cn,vo=An,xo=Dn;var $o={parse:zn,valid:Un,clean:Xn,inc:Bn,diff:Gn,major:Mn,minor:Vn,patch:Hn,prerelease:Yn,compare:qn,rcompare:Wn,compareLoose:Jn,compareBuild:Kn,sort:Zn,rsort:Qn,gt:eo,lt:to,eq:ro,neq:no,gte:oo,lte:io,cmp:so,coerce:ao,Comparator:lo,Range:co,satisfies:uo,toComparators:po,maxSatisfying:fo,minSatisfying:mo,minVersion:ho,validRange:go,outside:wo,gtr:bo,ltr:yo,intersects:Eo,simplifyRange:vo,subset:xo,SemVer:Fn,re:he.re,src:he.src,tokens:he.t,SEMVER_SPEC_VERSION:qe.SEMVER_SPEC_VERSION,RELEASE_TYPES:qe.RELEASE_TYPES,compareIdentifiers:We.compareIdentifiers,rcompareIdentifiers:We.rcompareIdentifiers};const Je="16.9.0",Ro=0,Ke=1;function No({rendererPackageName:r,version:e,bundleType:t},n){return r!=="react-dom"||typeof e!="string"||!/^\d+\.\d+\.\d+(-\S+)?$/.test(e)||!$o.gte(e,Je)?(n&&n(`Unsupported React renderer (only react-dom v${Je}+ is supported). Renderer: ${r||"unknown"}, Version: ${e||"unknown"}`),!1):t!==Ke?(n&&n(`Unsupported React renderer, only bundle type ${Ke} (development) is supported but ${t} (${t===Ro?"production":"unknown"}) is found`),!1):!0}const Ze={vscode:{url:"vscode://file/${projectPath}${filePath}:${line}:${column}",label:"VSCode"},webstorm:{url:"webstorm://open?file=${projectPath}${filePath}&line=${line}&column=${column}",label:"WebStorm"},cursor:{url:"cursor://file/${projectPath}${filePath}:${line}:${column}",label:"Cursor"},windsurf:{url:"windsurf://file/${projectPath}${filePath}:${line}:${column}",label:"Windsurf"}};typeof navigator<"u"&&navigator.platform.toUpperCase().indexOf("MAC")>=0;function Lo(){return!!(window.__SVELTE_HMR||window.__SAPPER__)}function Io(){return!!window.__VUE__}function ko(){return!!window.__LOCATOR_DATA__}function So(){if(window.__REACT_DEVTOOLS_GLOBAL_HOOK__){const r=window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;if(r&&Array.from(r.values()).filter(t=>No(t,n=>{})).length)return!0}return!1}const Co="Helvetica, sans-serif, Arial",To=`*, ::before, ::after {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
  --tw-contain-size:  ;
  --tw-contain-layout:  ;
  --tw-contain-paint:  ;
  --tw-contain-style:  ;
}

::backdrop {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
  --tw-contain-size:  ;
  --tw-contain-layout:  ;
  --tw-contain-paint:  ;
  --tw-contain-style:  ;
}

/*
! tailwindcss v3.4.18 | MIT License | https://tailwindcss.com
*/

/*
1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)
2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)
*/

*,
::before,
::after {
  box-sizing: border-box;
  /* 1 */
  border-width: 0;
  /* 2 */
  border-style: solid;
  /* 2 */
  border-color: #e5e7eb;
  /* 2 */
}

::before,
::after {
  --tw-content: '';
}

/*
1. Use a consistent sensible line-height in all browsers.
2. Prevent adjustments of font size after orientation changes in iOS.
3. Use a more readable tab size.
4. Use the user's configured \`sans\` font-family by default.
5. Use the user's configured \`sans\` font-feature-settings by default.
6. Use the user's configured \`sans\` font-variation-settings by default.
7. Disable tap highlights on iOS
*/

html,
:host {
  line-height: 1.5;
  /* 1 */
  -webkit-text-size-adjust: 100%;
  /* 2 */
  -moz-tab-size: 4;
  /* 3 */
  -o-tab-size: 4;
     tab-size: 4;
  /* 3 */
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  /* 4 */
  font-feature-settings: normal;
  /* 5 */
  font-variation-settings: normal;
  /* 6 */
  -webkit-tap-highlight-color: transparent;
  /* 7 */
}

/*
1. Remove the margin in all browsers.
2. Inherit line-height from \`html\` so users can set them as a class directly on the \`html\` element.
*/

body {
  margin: 0;
  /* 1 */
  line-height: inherit;
  /* 2 */
}

/*
1. Add the correct height in Firefox.
2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)
3. Ensure horizontal rules are visible by default.
*/

hr {
  height: 0;
  /* 1 */
  color: inherit;
  /* 2 */
  border-top-width: 1px;
  /* 3 */
}

/*
Add the correct text decoration in Chrome, Edge, and Safari.
*/

abbr:where([title]) {
  -webkit-text-decoration: underline dotted;
          text-decoration: underline dotted;
}

/*
Remove the default font size and weight for headings.
*/

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}

/*
Reset links to optimize for opt-in styling instead of opt-out.
*/

a {
  color: inherit;
  text-decoration: inherit;
}

/*
Add the correct font weight in Edge and Safari.
*/

b,
strong {
  font-weight: bolder;
}

/*
1. Use the user's configured \`mono\` font-family by default.
2. Use the user's configured \`mono\` font-feature-settings by default.
3. Use the user's configured \`mono\` font-variation-settings by default.
4. Correct the odd \`em\` font sizing in all browsers.
*/

code,
kbd,
samp,
pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  /* 1 */
  font-feature-settings: normal;
  /* 2 */
  font-variation-settings: normal;
  /* 3 */
  font-size: 1em;
  /* 4 */
}

/*
Add the correct font size in all browsers.
*/

small {
  font-size: 80%;
}

/*
Prevent \`sub\` and \`sup\` elements from affecting the line height in all browsers.
*/

sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}

/*
1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
3. Remove gaps between table borders by default.
*/

table {
  text-indent: 0;
  /* 1 */
  border-color: inherit;
  /* 2 */
  border-collapse: collapse;
  /* 3 */
}

/*
1. Change the font styles in all browsers.
2. Remove the margin in Firefox and Safari.
3. Remove default padding in all browsers.
*/

button,
input,
optgroup,
select,
textarea {
  font-family: inherit;
  /* 1 */
  font-feature-settings: inherit;
  /* 1 */
  font-variation-settings: inherit;
  /* 1 */
  font-size: 100%;
  /* 1 */
  font-weight: inherit;
  /* 1 */
  line-height: inherit;
  /* 1 */
  letter-spacing: inherit;
  /* 1 */
  color: inherit;
  /* 1 */
  margin: 0;
  /* 2 */
  padding: 0;
  /* 3 */
}

/*
Remove the inheritance of text transform in Edge and Firefox.
*/

button,
select {
  text-transform: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Remove default button styles.
*/

button,
input:where([type='button']),
input:where([type='reset']),
input:where([type='submit']) {
  -webkit-appearance: button;
  /* 1 */
  background-color: transparent;
  /* 2 */
  background-image: none;
  /* 2 */
}

/*
Use the modern Firefox focus style for all focusable elements.
*/

:-moz-focusring {
  outline: auto;
}

/*
Remove the additional \`:invalid\` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)
*/

:-moz-ui-invalid {
  box-shadow: none;
}

/*
Add the correct vertical alignment in Chrome and Firefox.
*/

progress {
  vertical-align: baseline;
}

/*
Correct the cursor style of increment and decrement buttons in Safari.
*/

::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}

/*
1. Correct the odd appearance in Chrome and Safari.
2. Correct the outline style in Safari.
*/

[type='search'] {
  -webkit-appearance: textfield;
  /* 1 */
  outline-offset: -2px;
  /* 2 */
}

/*
Remove the inner padding in Chrome and Safari on macOS.
*/

::-webkit-search-decoration {
  -webkit-appearance: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Change font properties to \`inherit\` in Safari.
*/

::-webkit-file-upload-button {
  -webkit-appearance: button;
  /* 1 */
  font: inherit;
  /* 2 */
}

/*
Add the correct display in Chrome and Safari.
*/

summary {
  display: list-item;
}

/*
Removes the default spacing and border for appropriate elements.
*/

blockquote,
dl,
dd,
h1,
h2,
h3,
h4,
h5,
h6,
hr,
figure,
p,
pre {
  margin: 0;
}

fieldset {
  margin: 0;
  padding: 0;
}

legend {
  padding: 0;
}

ol,
ul,
menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

/*
Reset default styling for dialogs.
*/

dialog {
  padding: 0;
}

/*
Prevent resizing textareas horizontally by default.
*/

textarea {
  resize: vertical;
}

/*
1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)
2. Set the default placeholder color to the user's configured gray 400 color.
*/

input::-moz-placeholder, textarea::-moz-placeholder {
  opacity: 1;
  /* 1 */
  color: #9ca3af;
  /* 2 */
}

input::placeholder,
textarea::placeholder {
  opacity: 1;
  /* 1 */
  color: #9ca3af;
  /* 2 */
}

/*
Set the default cursor for buttons.
*/

button,
[role="button"] {
  cursor: pointer;
}

/*
Make sure disabled buttons don't get the pointer cursor.
*/

:disabled {
  cursor: default;
}

/*
1. Make replaced elements \`display: block\` by default. (https://github.com/mozdevs/cssremedy/issues/14)
2. Add \`vertical-align: middle\` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)
   This can trigger a poorly considered lint error in some tools but is included by design.
*/

img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block;
  /* 1 */
  vertical-align: middle;
  /* 2 */
}

/*
Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
*/

img,
video {
  max-width: 100%;
  height: auto;
}

/* Make elements with the HTML hidden attribute stay hidden by default */

[hidden]:where(:not([hidden="until-found"])) {
  display: none;
}

[type='text'],input:where(:not([type])),[type='email'],[type='url'],[type='password'],[type='number'],[type='date'],[type='datetime-local'],[type='month'],[type='search'],[type='tel'],[type='time'],[type='week'],[multiple],textarea,select {
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
  background-color: #fff;
  border-color: #6b7280;
  border-width: 1px;
  border-radius: 0px;
  padding-top: 0.5rem;
  padding-right: 0.75rem;
  padding-bottom: 0.5rem;
  padding-left: 0.75rem;
  font-size: 1rem;
  line-height: 1.5rem;
  --tw-shadow: 0 0 #0000;
}

[type='text']:focus, input:where(:not([type])):focus, [type='email']:focus, [type='url']:focus, [type='password']:focus, [type='number']:focus, [type='date']:focus, [type='datetime-local']:focus, [type='month']:focus, [type='search']:focus, [type='tel']:focus, [type='time']:focus, [type='week']:focus, [multiple]:focus, textarea:focus, select:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  --tw-ring-inset: var(--tw-empty,/*!*/ /*!*/);
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: #2563eb;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  border-color: #2563eb;
}

input::-moz-placeholder, textarea::-moz-placeholder {
  color: #6b7280;
  opacity: 1;
}

input::placeholder,textarea::placeholder {
  color: #6b7280;
  opacity: 1;
}

::-webkit-datetime-edit-fields-wrapper {
  padding: 0;
}

::-webkit-date-and-time-value {
  min-height: 1.5em;
}

::-webkit-datetime-edit,::-webkit-datetime-edit-year-field,::-webkit-datetime-edit-month-field,::-webkit-datetime-edit-day-field,::-webkit-datetime-edit-hour-field,::-webkit-datetime-edit-minute-field,::-webkit-datetime-edit-second-field,::-webkit-datetime-edit-millisecond-field,::-webkit-datetime-edit-meridiem-field {
  padding-top: 0;
  padding-bottom: 0;
}

select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
}

[multiple],[size]:where(select:not([size="1"])) {
  background-image: initial;
  background-position: initial;
  background-repeat: unset;
  background-size: initial;
  padding-right: 0.75rem;
  -webkit-print-color-adjust: unset;
          print-color-adjust: unset;
}

[type='checkbox'],[type='radio'] {
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
  padding: 0;
  -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
  display: inline-block;
  vertical-align: middle;
  background-origin: border-box;
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
  flex-shrink: 0;
  height: 1rem;
  width: 1rem;
  color: #2563eb;
  background-color: #fff;
  border-color: #6b7280;
  border-width: 1px;
  --tw-shadow: 0 0 #0000;
}

[type='checkbox'] {
  border-radius: 0px;
}

[type='radio'] {
  border-radius: 100%;
}

[type='checkbox']:focus,[type='radio']:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  --tw-ring-inset: var(--tw-empty,/*!*/ /*!*/);
  --tw-ring-offset-width: 2px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: #2563eb;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}

[type='checkbox']:checked,[type='radio']:checked {
  border-color: transparent;
  background-color: currentColor;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}

[type='checkbox']:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
}

[type='radio']:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='8' cy='8' r='3'/%3e%3c/svg%3e");
}

[type='checkbox']:checked:hover,[type='checkbox']:checked:focus,[type='radio']:checked:hover,[type='radio']:checked:focus {
  border-color: transparent;
  background-color: currentColor;
}

[type='checkbox']:indeterminate {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e");
  border-color: transparent;
  background-color: currentColor;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}

[type='checkbox']:indeterminate:hover,[type='checkbox']:indeterminate:focus {
  border-color: transparent;
  background-color: currentColor;
}

[type='file'] {
  background: unset;
  border-color: inherit;
  border-width: 0;
  border-radius: 0;
  padding: 0;
  font-size: unset;
  line-height: inherit;
}

[type='file']:focus {
  outline: 1px solid ButtonText;
  outline: 1px auto -webkit-focus-ring-color;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.pointer-events-none {
  pointer-events: none;
}

.pointer-events-auto {
  pointer-events: auto;
}

.visible {
  visibility: visible;
}

.invisible {
  visibility: hidden;
}

.collapse {
  visibility: collapse;
}

.fixed {
  position: fixed;
}

.absolute {
  position: absolute;
}

.relative {
  position: relative;
}

.-bottom-7 {
  bottom: -1.75rem;
}

.-left-1 {
  left: -0.25rem;
}

.-left-2 {
  left: -0.5rem;
}

.-left-4 {
  left: -1rem;
}

.-right-2 {
  right: -0.5rem;
}

.-top-1 {
  top: -0.25rem;
}

.-top-2 {
  top: -0.5rem;
}

.-top-4 {
  top: -1rem;
}

.-top-7 {
  top: -1.75rem;
}

.bottom-3 {
  bottom: 0.75rem;
}

.left-0 {
  left: 0px;
}

.left-1 {
  left: 0.25rem;
}

.left-1\\/2 {
  left: 50%;
}

.left-3 {
  left: 0.75rem;
}

.top-0 {
  top: 0px;
}

.top-1 {
  top: 0.25rem;
}

.top-1\\/2 {
  top: 50%;
}

.z-10 {
  z-index: 10;
}

.m-1 {
  margin: 0.25rem;
}

.m-2 {
  margin: 0.5rem;
}

.m-4 {
  margin: 1rem;
}

.-mx-4 {
  margin-left: -1rem;
  margin-right: -1rem;
}

.my-2 {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.ml-3 {
  margin-left: 0.75rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

.mt-4 {
  margin-top: 1rem;
}

.block {
  display: block;
}

.inline-block {
  display: inline-block;
}

.inline {
  display: inline;
}

.flex {
  display: flex;
}

.inline-flex {
  display: inline-flex;
}

.table {
  display: table;
}

.contents {
  display: contents;
}

.hidden {
  display: none;
}

.h-4 {
  height: 1rem;
}

.h-6 {
  height: 1.5rem;
}

.h-screen {
  height: 100vh;
}

.max-h-full {
  max-height: 100%;
}

.w-11 {
  width: 2.75rem;
}

.w-4 {
  width: 1rem;
}

.w-6 {
  width: 1.5rem;
}

.w-60 {
  width: 15rem;
}

.w-80 {
  width: 20rem;
}

.w-96 {
  width: 24rem;
}

.w-full {
  width: 100%;
}

.w-screen {
  width: 100vw;
}

.max-w-2xl {
  max-width: 42rem;
}

.max-w-full {
  max-width: 100%;
}

.max-w-md {
  max-width: 28rem;
}

.max-w-xl {
  max-width: 36rem;
}

.flex-shrink {
  flex-shrink: 1;
}

.flex-grow {
  flex-grow: 1;
}

.grow {
  flex-grow: 1;
}

.border-collapse {
  border-collapse: collapse;
}

.-translate-x-1 {
  --tw-translate-x: -0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.-translate-x-1\\/2 {
  --tw-translate-x: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.-translate-x-full {
  --tw-translate-x: -100%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.-translate-y-1 {
  --tw-translate-y: -0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.-translate-y-1\\/2 {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.translate-x-full {
  --tw-translate-x: 100%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.transform {
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.cursor-auto {
  cursor: auto;
}

.cursor-default {
  cursor: default;
}

.cursor-pointer {
  cursor: pointer;
}

.resize {
  resize: both;
}

.list-disc {
  list-style-type: disc;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-end {
  justify-content: flex-end;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-1 {
  gap: 0.25rem;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-4 {
  gap: 1rem;
}

.self-stretch {
  align-self: stretch;
}

.overflow-auto {
  overflow: auto;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-scroll {
  overflow: scroll;
}

.text-ellipsis {
  text-overflow: ellipsis;
}

.whitespace-nowrap {
  white-space: nowrap;
}

.whitespace-pre-wrap {
  white-space: pre-wrap;
}

.break-words {
  overflow-wrap: break-word;
}

.break-all {
  word-break: break-all;
}

.rounded {
  border-radius: 0.25rem;
}

.rounded-full {
  border-radius: 9999px;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.rounded-md {
  border-radius: 0.375rem;
}

.rounded-sm {
  border-radius: 0.125rem;
}

.rounded-xl {
  border-radius: 0.75rem;
}

.border {
  border-width: 1px;
}

.border-2 {
  border-width: 2px;
}

.border-solid {
  border-style: solid;
}

.border-blue-500 {
  --tw-border-opacity: 1;
  border-color: rgb(59 130 246 / var(--tw-border-opacity, 1));
}

.border-gray-200 {
  --tw-border-opacity: 1;
  border-color: rgb(229 231 235 / var(--tw-border-opacity, 1));
}

.border-gray-300 {
  --tw-border-opacity: 1;
  border-color: rgb(209 213 219 / var(--tw-border-opacity, 1));
}

.border-gray-600 {
  --tw-border-opacity: 1;
  border-color: rgb(75 85 99 / var(--tw-border-opacity, 1));
}

.border-green-500 {
  --tw-border-opacity: 1;
  border-color: rgb(34 197 94 / var(--tw-border-opacity, 1));
}

.border-purple-500 {
  --tw-border-opacity: 1;
  border-color: rgb(168 85 247 / var(--tw-border-opacity, 1));
}

.border-red-500 {
  --tw-border-opacity: 1;
  border-color: rgb(239 68 68 / var(--tw-border-opacity, 1));
}

.border-sky-500 {
  --tw-border-opacity: 1;
  border-color: rgb(14 165 233 / var(--tw-border-opacity, 1));
}

.border-slate-200 {
  --tw-border-opacity: 1;
  border-color: rgb(226 232 240 / var(--tw-border-opacity, 1));
}

.border-slate-300 {
  --tw-border-opacity: 1;
  border-color: rgb(203 213 225 / var(--tw-border-opacity, 1));
}

.bg-black {
  --tw-bg-opacity: 1;
  background-color: rgb(0 0 0 / var(--tw-bg-opacity, 1));
}

.bg-blue-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(59 130 246 / var(--tw-bg-opacity, 1));
}

.bg-blue-500\\/30 {
  background-color: rgb(59 130 246 / 0.3);
}

.bg-blue-600 {
  --tw-bg-opacity: 1;
  background-color: rgb(37 99 235 / var(--tw-bg-opacity, 1));
}

.bg-gray-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(243 244 246 / var(--tw-bg-opacity, 1));
}

.bg-gray-200 {
  --tw-bg-opacity: 1;
  background-color: rgb(229 231 235 / var(--tw-bg-opacity, 1));
}

.bg-gray-50 {
  --tw-bg-opacity: 1;
  background-color: rgb(249 250 251 / var(--tw-bg-opacity, 1));
}

.bg-gray-700 {
  --tw-bg-opacity: 1;
  background-color: rgb(55 65 81 / var(--tw-bg-opacity, 1));
}

.bg-green-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(220 252 231 / var(--tw-bg-opacity, 1));
}

.bg-green-50 {
  --tw-bg-opacity: 1;
  background-color: rgb(240 253 244 / var(--tw-bg-opacity, 1));
}

.bg-green-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(34 197 94 / var(--tw-bg-opacity, 1));
}

.bg-green-500\\/30 {
  background-color: rgb(34 197 94 / 0.3);
}

.bg-orange-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(249 115 22 / var(--tw-bg-opacity, 1));
}

.bg-orange-500\\/30 {
  background-color: rgb(249 115 22 / 0.3);
}

.bg-purple-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(168 85 247 / var(--tw-bg-opacity, 1));
}

.bg-red-50 {
  --tw-bg-opacity: 1;
  background-color: rgb(254 242 242 / var(--tw-bg-opacity, 1));
}

.bg-red-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(239 68 68 / var(--tw-bg-opacity, 1));
}

.bg-slate-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(241 245 249 / var(--tw-bg-opacity, 1));
}

.bg-slate-300 {
  --tw-bg-opacity: 1;
  background-color: rgb(203 213 225 / var(--tw-bg-opacity, 1));
}

.bg-slate-50 {
  --tw-bg-opacity: 1;
  background-color: rgb(248 250 252 / var(--tw-bg-opacity, 1));
}

.bg-slate-900 {
  --tw-bg-opacity: 1;
  background-color: rgb(15 23 42 / var(--tw-bg-opacity, 1));
}

.bg-white {
  --tw-bg-opacity: 1;
  background-color: rgb(255 255 255 / var(--tw-bg-opacity, 1));
}

.bg-yellow-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(254 249 195 / var(--tw-bg-opacity, 1));
}

.p-0 {
  padding: 0px;
}

.p-1 {
  padding: 0.25rem;
}

.p-2 {
  padding: 0.5rem;
}

.p-3 {
  padding: 0.75rem;
}

.p-4 {
  padding: 1rem;
}

.p-6 {
  padding: 1.5rem;
}

.p-8 {
  padding: 2rem;
}

.px-0 {
  padding-left: 0px;
  padding-right: 0px;
}

.px-1 {
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}

.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-0 {
  padding-top: 0px;
  padding-bottom: 0px;
}

.py-0\\.5 {
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
}

.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.pb-0 {
  padding-bottom: 0px;
}

.pb-1 {
  padding-bottom: 0.25rem;
}

.pl-2 {
  padding-left: 0.5rem;
}

.pl-4 {
  padding-left: 1rem;
}

.pr-2 {
  padding-right: 0.5rem;
}

.pt-2 {
  padding-top: 0.5rem;
}

.text-left {
  text-align: left;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}

.text-base {
  font-size: 1rem;
  line-height: 1.5rem;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-xl {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.font-bold {
  font-weight: 700;
}

.font-medium {
  font-weight: 500;
}

.uppercase {
  text-transform: uppercase;
}

.lowercase {
  text-transform: lowercase;
}

.text-black {
  --tw-text-opacity: 1;
  color: rgb(0 0 0 / var(--tw-text-opacity, 1));
}

.text-blue-500 {
  --tw-text-opacity: 1;
  color: rgb(59 130 246 / var(--tw-text-opacity, 1));
}

.text-blue-600 {
  --tw-text-opacity: 1;
  color: rgb(37 99 235 / var(--tw-text-opacity, 1));
}

.text-gray-300 {
  --tw-text-opacity: 1;
  color: rgb(209 213 219 / var(--tw-text-opacity, 1));
}

.text-gray-400 {
  --tw-text-opacity: 1;
  color: rgb(156 163 175 / var(--tw-text-opacity, 1));
}

.text-gray-500 {
  --tw-text-opacity: 1;
  color: rgb(107 114 128 / var(--tw-text-opacity, 1));
}

.text-gray-600 {
  --tw-text-opacity: 1;
  color: rgb(75 85 99 / var(--tw-text-opacity, 1));
}

.text-gray-700 {
  --tw-text-opacity: 1;
  color: rgb(55 65 81 / var(--tw-text-opacity, 1));
}

.text-gray-900 {
  --tw-text-opacity: 1;
  color: rgb(17 24 39 / var(--tw-text-opacity, 1));
}

.text-green-500 {
  --tw-text-opacity: 1;
  color: rgb(34 197 94 / var(--tw-text-opacity, 1));
}

.text-green-600 {
  --tw-text-opacity: 1;
  color: rgb(22 163 74 / var(--tw-text-opacity, 1));
}

.text-green-700 {
  --tw-text-opacity: 1;
  color: rgb(21 128 61 / var(--tw-text-opacity, 1));
}

.text-green-800 {
  --tw-text-opacity: 1;
  color: rgb(22 101 52 / var(--tw-text-opacity, 1));
}

.text-indigo-600 {
  --tw-text-opacity: 1;
  color: rgb(79 70 229 / var(--tw-text-opacity, 1));
}

.text-orange-500 {
  --tw-text-opacity: 1;
  color: rgb(249 115 22 / var(--tw-text-opacity, 1));
}

.text-purple-500 {
  --tw-text-opacity: 1;
  color: rgb(168 85 247 / var(--tw-text-opacity, 1));
}

.text-red-500 {
  --tw-text-opacity: 1;
  color: rgb(239 68 68 / var(--tw-text-opacity, 1));
}

.text-red-600 {
  --tw-text-opacity: 1;
  color: rgb(220 38 38 / var(--tw-text-opacity, 1));
}

.text-red-800 {
  --tw-text-opacity: 1;
  color: rgb(153 27 27 / var(--tw-text-opacity, 1));
}

.text-sky-500 {
  --tw-text-opacity: 1;
  color: rgb(14 165 233 / var(--tw-text-opacity, 1));
}

.text-sky-700 {
  --tw-text-opacity: 1;
  color: rgb(3 105 161 / var(--tw-text-opacity, 1));
}

.text-slate-400 {
  --tw-text-opacity: 1;
  color: rgb(148 163 184 / var(--tw-text-opacity, 1));
}

.text-slate-500 {
  --tw-text-opacity: 1;
  color: rgb(100 116 139 / var(--tw-text-opacity, 1));
}

.text-slate-700 {
  --tw-text-opacity: 1;
  color: rgb(51 65 85 / var(--tw-text-opacity, 1));
}

.text-slate-800 {
  --tw-text-opacity: 1;
  color: rgb(30 41 59 / var(--tw-text-opacity, 1));
}

.text-white {
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity, 1));
}

.underline {
  text-decoration-line: underline;
}

.opacity-0 {
  opacity: 0;
}

.opacity-100 {
  opacity: 1;
}

.shadow {
  --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.shadow-lg {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.shadow-sm {
  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.shadow-xl {
  --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.outline-none {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.outline {
  outline-style: solid;
}

.ring-4 {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

.ring-blue-300 {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(147 197 253 / var(--tw-ring-opacity, 1));
}

.ring-blue-800 {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(30 64 175 / var(--tw-ring-opacity, 1));
}

.filter {
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}

.transition {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.duration-300 {
  transition-duration: 300ms;
}

.ease-in-out {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.ease-out {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

.hover\\:bg-white\\/30:hover {
  background-color: rgb(255 255 255 / 0.3);
}

.hover\\:text-gray-100:hover {
  --tw-text-opacity: 1;
  color: rgb(243 244 246 / var(--tw-text-opacity, 1));
}

.group\\/tooltip:hover .group-hover\\/tooltip\\:visible {
  visibility: visible;
}

.group\\/tooltip:hover .group-hover\\/tooltip\\:opacity-100 {
  opacity: 1;
}`;function V(r){let e=r;for(;e;){if(e._debugSource)return{fiber:e,source:e._debugSource};e=e._debugOwner||null}return null}function z(r,e){const n=window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.values();if(n){for(const o of Array.from(n))if(o.findFiberByHostInstance){const i=o.findFiberByHostInstance(r);if(i)return e?V(i)?.fiber||null:i}}return null}function ct(r){return r?typeof r.elementType=="string"?r.elementType:r.elementType?r.elementType.name?r.elementType.name:r.elementType.displayName?r.elementType.displayName:r.elementType.type?.name?r.elementType.type.name:r.elementType._payload?._result?.name?r.elementType._payload._result.name:"Anonymous":"Anonymous":"Not found"}function U(r){if(!r.startsWith("/"))return r;const e=["/app/","/src/","/pages/","/components/","/lib/"];for(const n of e){const o=r.indexOf(n);if(o!==-1)return r.substring(o+1)}const t=r.split("/");return t.length>3?t.slice(-4).join("/"):r}function ee(r,e){return{label:ct(r),link:e?{filePath:U(e.fileName),projectPath:"",line:e.lineNumber,column:e.columnNumber||0}:null}}function ut(r){const e=[];let t=r.child;for(;t;)e.push(t),t=t.sibling;return e}function _o(r){const e=[r];let t=r;for(;t.return;){if(t=t.return,t.stateNode&&t.stateNode instanceof HTMLElement||ut(t).length>1)return e;e.push(t)}return e}function pt(r){return r!=null}function Ao(r){const e={};return r.map(t=>{const n=JSON.stringify(t);return e[n]?null:(e[n]=!0,t)}).filter(pt)}function dt(r){return r.stateNode&&r.stateNode.getBoundingClientRect?r.stateNode.getBoundingClientRect():null}function ae(r,e){const t=Math.min(r.x,e.x),n=Math.min(r.y,e.y);return{x:t,y:n,width:Math.max(r.x+r.width,e.x+e.width)-t,height:Math.max(r.y+r.height,e.y+e.height)-n}}const Oo=6;function ft(r,e=0){const t=ut(r);let n;return t.forEach(o=>{let i=dt(o);!i&&e<Oo&&(i=ft(o,e+1)||null),i&&(i.width<=0||i.height<=0||(n?n=ae(n,i):n=i))}),n}function mt(r){return!!r._debugOwner?.elementType?.styledComponentId}function Po(r){const e=[],t=r.stateNode;if(!t||!(t instanceof HTMLElement))throw new Error("This functions works only for Fibres with HTMLElement stateNode");let n=t.getBoundingClientRect(),o=mt(r)&&r._debugOwner?r._debugOwner:r;for(;o._debugOwner||o.return;){o=o._debugOwner||o.return;const i=o.stateNode;if(!i||!(i instanceof HTMLElement))return{component:o,parentElements:e,componentBox:ft(o)||n};const l=ct(o);n=ae(n,i.getBoundingClientRect()),e.push({box:i.getBoundingClientRect(),label:l,link:null})}throw new Error("Could not find root component")}function le(r){let e=r;const t=new Set;let n=e;const o=e.uniqueId;t.add(n.uniqueId);let i=2;for(;n&&i>0;)i--,n=n.getParent(),n&&(t.add(n.uniqueId),e=n);return{expandedIds:t,highlightedId:o,root:e,originalNode:r}}const ge=new WeakMap;let Qe=0;function jo(r){return ge.has(r)||(Qe++,ge.set(r,Qe)),ge.get(r)}class ce{constructor(e){this.type="element",this.element=e,this.name=e.nodeName.toLowerCase(),this.uniqueId=String(jo(e))}getBox(){return this.element.getBoundingClientRect()}getElement(){return this.element}getChildren(){return Array.from(this.element.children).map(t=>t instanceof HTMLElement||t instanceof SVGElement?new this.constructor(t):null).filter(pt)}getParent(){return this.element.parentElement?new this.constructor(this.element.parentElement):null}getSource(){throw new Error("Method not implemented.")}getComponent(){throw new Error("Method not implemented.")}getOwnerComponents(){return[]}}function Do(r){const e=[],t=z(r,!1);if(t){const{component:n,componentBox:o,parentElements:i}=Po(t);_o(n).forEach(a=>{const h=V(a);if(h){const s=ee(h.fiber,h.source);e.push(s)}});const c=ee(t,V(t)?.source);return mt(t)&&(c.label=`${c.label} (styled)`),{thisElement:{box:dt(t)||r.getBoundingClientRect(),...c},htmlElement:r,parentElements:i,componentBox:o,componentsLabels:Ao(e)}}return null}class ye extends ce{getSource(){const e=z(this.element,!1);return e&&e._debugSource?{fileName:e._debugSource.fileName,lineNumber:e._debugSource.lineNumber,columnNumber:e._debugSource.columnNumber}:null}fiberToTreeNodeComponent(e){const t=ee(e,V(e)?.source);return{label:t.label,callLink:t.link&&{fileName:t.link.filePath,lineNumber:t.link.line,columnNumber:t.link.column,projectPath:t.link.projectPath}||void 0}}getComponent(){const t=z(this.element,!1)?._debugOwner;return t?this.fiberToTreeNodeComponent(t):null}getOwnerComponents(){const e=z(this.element,!1);if(!e)return[];const t=this.element.parentElement;let n=null;t&&(n=z(t,!1)?._debugOwner||null);const o=[];let i=e._debugOwner;for(;i&&!(n&&i===n);)o.push(this.fiberToTreeNodeComponent(i)),i=i._debugOwner||null;return o.reverse()}}function Fo(r){const e=new ye(r);return le(e)}function et(r){const e=ee(r,V(r)?.source);return{title:e.label,link:e.link}}function zo(r){const e=z(r,!1);if(e){const t=[];let n=e;for(t.push(et(n));n._debugOwner;)n=n._debugOwner,t.push(et(n));return t}return[]}const yi={getElementInfo:Do,getTree:Fo,getParentsPaths:zo};function X(r){const[e,t]=r.split("::");if(!e||!t)throw new Error("locatorjsId is malformed");return[e,t]}function H(r){const e=r.lastIndexOf(":");if(e===-1)return null;const t=r.lastIndexOf(":",e-1);if(t===-1)return null;const n=r.substring(0,t),o=r.substring(t+1,e),i=r.substring(e+1),l=parseInt(o,10),c=parseInt(i,10);return Number.isNaN(l)||Number.isNaN(c)?null:[n,l,c]}function ht(r){const e=["/src/","/app/","/pages/","/components/"];for(const n of e){const o=r.indexOf(n);if(o!==-1)return[r.substring(0,o),r.substring(o)]}const t=r.lastIndexOf("/");return t!==-1?[r.substring(0,t+1),r.substring(t+1)]:[r,""]}function te(r,e){const t=r.getAttribute("data-locatorjs"),n=r.getAttribute("data-locatorjs-id");if(t){const o=H(t);if(o){const[,i,l]=o;if(e){const c=e.expressions.find(a=>a.loc.start.line===i&&a.loc.start.column===l);if(c)return c}return{name:r.tagName.toLowerCase(),loc:{start:{line:i,column:l},end:{line:i,column:l}},wrappingComponentId:null}}}if(n&&e){const[,o]=X(n),i=e.expressions[Number(o)];if(i)return i}return null}function Uo(r,e,t,n){let o=r.getBoundingClientRect();function i(l){const c=l.parentNode;if(!!c&&(c instanceof HTMLElement||c instanceof SVGElement)){const a=c.getAttribute("data-locatorjs"),h=c.getAttribute("data-locatorjs-id");if(a||h){let s;if(a){const d=H(a);if(!d){i(c);return}[s]=d}else if(h)[s]=X(h);else{i(c);return}const f=e[s],E=te(c,f||null);E&&(E.wrappingComponentId===n&&t===s&&(o=ae(o,c.getBoundingClientRect()),i(c)),E.wrappingComponentId)}else i(c)}}return i(r),o}function gt(r){const e=r.closest("[data-locatorjs-id], [data-locatorjs]"),t=e?.getAttribute("data-locatorjs-id"),n=e?.getAttribute("data-locatorjs"),o=e?.getAttribute("data-locatorjs-styled");if(e&&(e instanceof HTMLElement||e instanceof SVGElement)&&(t||n||o)){if(!t&&!n)return null;let i;if(n){const S=H(n);if(!S)return null;[i]=S}else if(t)[i]=X(t);else return null;const l=window.__LOCATOR_DATA__,c=l?.[i],[a,h]=o?X(o):[null,null],s=a&&l?.[a],f=s&&s.styledDefinitions[Number(h)];f&&(s.filePath,s.projectPath,(f.loc?.start.column||0)+1,f.loc?.start.line);const E=te(e,c||null);if(!E)return null;let d,_;c?(d=c.filePath,_=c.projectPath):[_,d]=ht(i);const m=E.wrappingComponentId!==null&&c?c.components[Number(E.wrappingComponentId)]:null;return{thisElement:{box:e.getBoundingClientRect(),label:E.name,link:{filePath:d,projectPath:_,column:(E.loc.start.column||0)+1,line:E.loc.start.line||0}},htmlElement:e,parentElements:[],componentBox:Uo(e,l||{},i,Number(E.wrappingComponentId)),componentsLabels:m?[{label:m.name||"component",link:{filePath:d,projectPath:_,column:(m.loc?.start.column||0)+1,line:m.loc?.start.line||0}}]:[]}}return null}class Q extends ce{getSource(){const e=this.element.getAttribute("data-locatorjs-id"),t=this.element.getAttribute("data-locatorjs");if(!e&&!t)return null;let n;if(t){const c=H(t);if(!c)return null;[n]=c}else if(e)[n]=X(e);else return null;const i=window.__LOCATOR_DATA__?.[n],l=te(this.element,i||null);if(l){let c,a;return i?(c=i.filePath,a=i.projectPath):[a,c]=ht(n),{fileName:c,projectPath:a,columnNumber:(l.loc.start.column||0)+1,lineNumber:l.loc.start.line||0}}return null}getComponent(){const e=this.element.getAttribute("data-locatorjs-id"),t=this.element.getAttribute("data-locatorjs");if(!e&&!t)return null;let n;if(t){const l=H(t);if(!l)return null;[n]=l}else if(e)[n]=X(e);else return null;const i=window.__LOCATOR_DATA__?.[n];if(i){const l=te(this.element,i);if(l&&l.wrappingComponentId!==null){const c=i.components[l.wrappingComponentId];if(c)return{label:c.name||"component",definitionLink:{fileName:i.filePath,projectPath:i.projectPath,columnNumber:(c.loc?.start.column||0)+1,lineNumber:c.loc?.start.line||0}}}}return null}}function Xo(r){const e=new Q(r);return le(e)}function Bo(r){const e=[];let t=r,n=null;do{if(t){const o=gt(t),i=JSON.stringify(o?.thisElement.link);if(o&&i!==n){n=i;const l=o.thisElement.link,c=o.thisElement.label;l&&e.push({title:c,link:l})}}t=t.parentElement}while(t);return e}const Ei={getElementInfo:gt,getTree:Xo,getParentsPaths:Bo};function Go(r){if(r.__svelte_meta){const{loc:e}=r.__svelte_meta;return{thisElement:{box:r.getBoundingClientRect(),label:r.nodeName.toLowerCase(),link:{column:e.column+1,line:e.line+1,filePath:e.file,projectPath:""}},htmlElement:r,parentElements:[],componentBox:r.getBoundingClientRect(),componentsLabels:[]}}return null}class Ee extends ce{getSource(){const e=this.element;if(e.__svelte_meta){const{loc:t}=e.__svelte_meta;return{fileName:t.file,lineNumber:t.line+1,columnNumber:t.column+1}}return null}getComponent(){return null}}function Mo(r){const e=new Ee(r);return le(e)}function Vo(r){const e=[];let t=r,n=1e4;do{if(t?.__svelte_meta){const{loc:o}=t.__svelte_meta;o.file===e[e.length-1]?.link?.filePath||e.push({title:t.nodeName.toLowerCase(),link:{column:o.column+1,line:o.line+1,filePath:o.file,projectPath:""}})}if(t=t.parentElement,n--,n<0)break}while(t);return e}const vi={getElementInfo:Go,getTree:Mo,getParentsPaths:Vo};function wt(r){let e=null;return r?.subTree?.children&&r?.subTree?.children instanceof Array&&r?.subTree?.children.forEach(t=>{const n=Ho(t);!n||n.width<=0||n.height<=0||(e?e=ae(e,n):e=n)}),e}function Ho(r){return r.el instanceof HTMLElement?r.el.getBoundingClientRect():r.component?wt(r.component):null}function bt(r){const e=r.__vueParentComponent;if(e){if(!e.type)return null;const t=wt(e),{__file:n,__name:o}=e.type;if(n&&o)return{thisElement:{box:r.getBoundingClientRect(),label:r.nodeName.toLowerCase(),link:{column:1,line:1,filePath:n,projectPath:""}},htmlElement:r,parentElements:[],componentBox:t||r.getBoundingClientRect(),componentsLabels:[{label:o,link:{column:1,line:1,filePath:n,projectPath:""}}]}}return null}class ve extends ce{getSource(){const t=this.element.__vueParentComponent;if(t&&t.type){const{__file:n}=t.type;if(n)return{fileName:n,lineNumber:1,columnNumber:1}}return null}getComponent(){return null}}function Yo(r){const e=new ve(r);return le(e)}function qo(r){const e=[];let t=r,n=null;do{if(t){const o=bt(t),i=JSON.stringify(o?.componentsLabels);if(o&&i!==n){n=i;const l=o.thisElement.link,c=o.thisElement.label;l&&e.push({title:c,link:l})}}t=t.parentElement}while(t);return e}const xi={getElementInfo:bt,getTree:Yo,getParentsPaths:qo};function Wo(){if(typeof window<"u"&&window.liveSocket)return!0;if(typeof document<"u"){if(document.querySelector("[data-phx-main], [data-phx-session]"))return!0;const r=document.createTreeWalker(document.body,NodeFilter.SHOW_COMMENT,null);let e=0;for(;r.nextNode()&&e<50;){const t=r.currentNode.textContent;if(t?.includes("@caller")||t?.includes("<App"))return!0;e++}}return!1}function Jo(r,e){return e==="react"?new ye(r):e==="svelte"?new Ee(r):e==="vue"?new ve(r):e==="jsx"?new Q(r):Lo()?new Ee(r):Io()?new ve(r):So()?new ye(r):ko()||r.dataset.locatorjsId?new Q(r):Wo()?new Q(r):null}const Ko=/^@caller\s+(.+):(\d+)$/,Zo=/^<([^>]+)>\s+(.+):(\d+)$/,Qo=/^<\/([^>]+)>$/;function ei(r){const e=r.textContent?.trim();if(!e)return null;const t=e.match(Ko);if(t&&t[1]&&t[2])return{commentNode:r,name:"@caller",filePath:t[1],line:parseInt(t[2],10),type:"caller"};const n=e.match(Zo);return n&&n[1]&&n[2]&&n[3]?{commentNode:r,name:n[1],filePath:n[2],line:parseInt(n[3],10),type:"component"}:(e.match(Qo),null)}function ti(r){const e=[];let t=r.previousSibling;for(;t;){if(t.nodeType===Node.COMMENT_NODE){const n=ei(t);n&&e.push(n)}else if(t.nodeType===Node.TEXT_NODE){const n=t.textContent?.trim();if(n&&n.length>0)break}else break;t=t.previousSibling}return e.reverse()}function ri(r){return r.map(e=>({name:e.name,filePath:e.filePath,line:e.line,type:e.type}))}function ni(r){const e=ti(r);return e.length===0?null:ri(e)}function oi(r){const t=(r.split(":")[0]||r).split("/").pop()?.replace(/\.(tsx?|jsx?)$/,"")||"Unknown";return t==="layout"?"RootLayout":t==="page"?"Page":t}function ii(r){if(!r)return null;const e=r.split(":");if(e.length<2)return null;e.pop();const t=e.pop(),n=e.join(":");if(!n||!t)return null;const o=oi(n),i=U(n);return{name:o,filePath:i,line:parseInt(t,10),type:"component"}}function si(r){const e=r.getAttribute("data-locatorjs");if(!e)return[];const t=ii(e);return t?[t]:[]}function ai(r){const e=si(r);return e.length===0?null:e}const li=new Set(["html","body","head"]);function ci(r){return"getElement"in r&&typeof r.getElement=="function"}function ui(r){const e=r.parentElement;if(!e)return;const t=r.tagName,n=Array.from(e.children).filter(i=>i.tagName===t);return n.length<=1?void 0:n.indexOf(r)+1}function pi(r){return{name:r.label,filePath:r.callLink?.fileName?U(r.callLink.fileName):void 0,line:r.callLink?.lineNumber}}function di(r){const e=[];let t=r;for(;t;){if(li.has(t.name)){t=t.getParent();continue}const n=t.getSource(),o={elementName:t.name};if(ci(t)){const c=t.getElement();if(c instanceof Element){c.id&&(o.id=c.id);const a=ui(c);a!==void 0&&(o.nthChild=a);const h=ni(c),s=ai(c),f=[...h||[],...s||[]];f.length>0&&(o.serverComponents=f)}}const i=t.getOwnerComponents(),l=i[0];if(l)o.ownerComponents=i.map(pi),o.componentName=l.label,l.callLink&&(o.filePath=U(l.callLink.fileName),o.line=l.callLink.lineNumber);else{const c=t.getComponent();c&&(o.componentName=c.label,c.callLink&&(o.filePath=U(c.callLink.fileName),o.line=c.callLink.lineNumber))}!o.filePath&&n&&(o.filePath=U(n.fileName),o.line=n.lineNumber),(o.componentName||o.filePath||o.serverComponents)&&e.push(o),t=t.getParent()}return e}function tt(r){if(r.length===0)return"";const e=[...r].reverse(),t=[];return e.forEach((n,o)=>{const i="    ".repeat(o),l=o===0?"":"\u2514\u2500 ",c=o>0?e[o-1]:null,a=c?.componentName||c?.ownerComponents?.[c.ownerComponents.length-1]?.name,h=n.ownerComponents?.[n.ownerComponents.length-1]?.name||n.componentName;let s=n.elementName,f=[];if(h&&h!==a)if(n.ownerComponents&&n.ownerComponents.length>0){const L=n.ownerComponents[n.ownerComponents.length-1];L&&(s=L.name,f=n.ownerComponents.slice(0,-1).map(R=>R.name))}else n.componentName&&(s=n.componentName);let d=s;n.nthChild!==void 0&&(d+=`:nth-child(${n.nthChild})`),n.id&&(d+=`#${n.id}`);let _=d;const m=[];if(n.serverComponents&&n.serverComponents.length>0){const L=n.serverComponents.filter(k=>k.filePath.match(/\.(ex|exs|heex)$/)),R=n.serverComponents.filter(k=>k.filePath.match(/\.(tsx?|jsx?)$/));if(L.length>0){const k=L.filter(D=>D.type==="component").map(D=>D.name);k.length>0&&m.push(`[Phoenix: ${k.join(" > ")}]`)}if(R.length>0){const k=R.filter(D=>D.type==="component").map(D=>D.name);k.length>0&&m.push(`[Next.js: ${k.join(" > ")}]`)}}f.length>0&&m.push(`in ${f.join(" > ")}`),m.length>0&&(_=`${d} ${m.join(" ")}`);const S=[];if(n.serverComponents&&n.serverComponents.length>0&&n.serverComponents.forEach(L=>{const R=L.type==="caller"?" (called from)":"";S.push(`${L.filePath}:${L.line}${R}`)}),n.filePath){const L=`${n.filePath}:${n.line}`;S.includes(L)||S.push(L)}const T=S.length>0?` at ${S.join(", ")}`:"";t.push(`${i}${l}${_}${T}`)}),t.join(`
`)}let yt;function we(r){if(typeof r=="string"){const e=document.querySelector(r);return e instanceof HTMLElement?e:null}return r}function be(r){const e=Jo(r,yt);return e?di(e):null}const fi=`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                        TreeLocatorJS Browser API                          \u2551
\u2551                  Programmatic Component Ancestry Access                   \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

METHODS:
--------

1. getPath(elementOrSelector)
   Returns a formatted string showing the component hierarchy.

   Usage:
     window.__treelocator__.getPath('button.submit')
     window.__treelocator__.getPath(document.querySelector('.my-button'))

   Returns:
     "div in App at src/App.tsx:15
      \u2514\u2500 button in SubmitButton at src/components/SubmitButton.tsx:12"

2. getAncestry(elementOrSelector)
   Returns raw ancestry data as an array of objects.

   Usage:
     window.__treelocator__.getAncestry('button.submit')

   Returns:
     [
       { elementName: 'div', componentName: 'App',
         filePath: 'src/App.tsx', line: 15 },
       { elementName: 'button', componentName: 'SubmitButton',
         filePath: 'src/components/SubmitButton.tsx', line: 12 }
     ]

3. getPathData(elementOrSelector)
   Returns both formatted path and raw ancestry in one call.

   Usage:
     const data = window.__treelocator__.getPathData('button.submit')
     console.log(data.path)      // formatted string
     console.log(data.ancestry)  // structured array

4. help()
   Displays this help message.

PLAYWRIGHT EXAMPLES:
-------------------

// Get component path for debugging
const path = await page.evaluate(() => {
  return window.__treelocator__.getPath('button.submit');
});
console.log(path);

// Extract component names
const components = await page.evaluate(() => {
  const ancestry = window.__treelocator__.getAncestry('.error-message');
  return ancestry?.map(item => item.componentName).filter(Boolean);
});

// Create a test helper
async function getComponentPath(page, selector) {
  return await page.evaluate((sel) => {
    return window.__treelocator__.getPath(sel);
  }, selector);
}

PUPPETEER EXAMPLES:
------------------

const path = await page.evaluate(() => {
  return window.__treelocator__.getPath('.my-button');
});

SELENIUM EXAMPLES:
-----------------

const path = await driver.executeScript(() => {
  return window.__treelocator__.getPath('button.submit');
});

CYPRESS EXAMPLES:
----------------

cy.window().then((win) => {
  const path = win.__locatorjs__.getPath('button.submit');
  cy.log(path);
});

NOTES:
------
\u2022 Accepts CSS selectors or HTMLElement objects
\u2022 Returns null if element not found or framework not supported
\u2022 Works with React, Vue, Svelte, Preact, and any JSX framework
\u2022 Automatically installed when TreeLocatorJS runtime initializes

Documentation: https://github.com/wende/treelocatorjs
`;function mi(r){return yt=r,{getPath(e){const t=we(e);if(!t)return null;const n=be(t);return n?tt(n):null},getAncestry(e){const t=we(e);return t?be(t):null},getPathData(e){const t=we(e);if(!t)return null;const n=be(t);return n?{path:tt(n),ancestry:n}:null},help(){return fi}}}function hi(r){typeof window<"u"&&(window.__treelocator__=mi(r))}function gi({adapter:r,targets:e}={}){if(typeof window>"u"||typeof document>"u"||document.getElementById("locatorjs-wrapper"))return;hi(r);const t=document.createElement("style");t.id="locatorjs-style",t.innerHTML=`
      #locatorjs-layer {
        all: initial;
        pointer-events: none;
        font-family: ${Co};
      }
      #locatorjs-layer * {
        box-sizing: border-box;
      }
      #locatorjs-labels-wrapper {
        display: flex;
        gap: 8px;
      }
      ${To}
    `;const n=document.createElement("style");n.id="locatorjs-global-style",n.innerHTML=`
      #locatorjs-wrapper {
        z-index: ${wi};
        pointer-events: none;
        position: fixed;
      }
      .locatorjs-active-pointer * {
        cursor: pointer !important;
      }
    `;const o=document.createElement("div");o.setAttribute("id","locatorjs-wrapper");const i=o.attachShadow({mode:"open"}),l=document.createElement("div");if(l.setAttribute("id","locatorjs-layer"),i.appendChild(t),i.appendChild(l),document.body.appendChild(o),document.head.appendChild(n),typeof require<"u"){const{initRender:c}=require("./components/Runtime");c(l,r,e||Ze)}else Ct(()=>import("./Runtime.25fbbc6e.js"),[]).then(({initRender:c})=>{c(l,r,e||Ze)})}const wi=2147483647;function bi({adapter:r,targets:e}={}){setTimeout(()=>gi({adapter:r,targets:e}),0)}bi();console.log("\u2705 TreeLocatorJS initialized!");console.log("\u{1F4CB} Try Alt+clicking any element to see the unified server\u2192client component tree");console.log("\u{1F50D} Phoenix LiveView detected:",window.liveSocket!==void 0||document.querySelector("[data-phx-main]")!==null);export{di as a,Jo as c,tt as f,Ei as j,ni as p,yi as r,vi as s,xi as v};
