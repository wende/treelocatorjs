(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function r(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerpolicy&&(i.referrerPolicy=o.referrerpolicy),o.crossorigin==="use-credentials"?i.credentials="include":o.crossorigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(o){if(o.ep)return;o.ep=!0;const i=r(o);fetch(o.href,i)}})();const Pt="modulepreload",jt=function(t){return"/"+t},Te={},Dt=function(e,r,n){return!r||r.length===0?e():Promise.all(r.map(o=>{if(o=jt(o),o in Te)return;Te[o]=!0;const i=o.endsWith(".css"),s=i?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${o}"]${s}`))return;const c=document.createElement("link");if(c.rel=i?"stylesheet":Pt,i||(c.as="script",c.crossOrigin=""),c.href=o,document.head.appendChild(c),i)return new Promise((l,h)=>{c.addEventListener("load",l),c.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${o}`)))})})).then(()=>e())};var z={exports:{}};const Ft="2.0.0",st=256,zt=Number.MAX_SAFE_INTEGER||9007199254740991,Bt=16,Mt=st-6,Ut=["major","premajor","minor","preminor","patch","prepatch","prerelease"];var ne={MAX_LENGTH:st,MAX_SAFE_COMPONENT_LENGTH:Bt,MAX_SAFE_BUILD_LENGTH:Mt,MAX_SAFE_INTEGER:zt,RELEASE_TYPES:Ut,SEMVER_SPEC_VERSION:Ft,FLAG_INCLUDE_PRERELEASE:1,FLAG_LOOSE:2};const Xt=typeof process=="object"&&process.env&&process.env.NODE_DEBUG&&/\bsemver\b/i.test(process.env.NODE_DEBUG)?(...t)=>console.error("SEMVER",...t):()=>{};var oe=Xt;(function(t,e){const{MAX_SAFE_COMPONENT_LENGTH:r,MAX_SAFE_BUILD_LENGTH:n,MAX_LENGTH:o}=ne,i=oe;e=t.exports={};const s=e.re=[],c=e.safeRe=[],l=e.src=[],h=e.safeSrc=[],a=e.t={};let p=0;const E="[a-zA-Z0-9-]",d=[["\\s",1],["\\d",o],[E,n]],_=S=>{for(const[T,L]of d)S=S.split(`${T}*`).join(`${T}{0,${L}}`).split(`${T}+`).join(`${T}{1,${L}}`);return S},m=(S,T,L)=>{const N=_(T),k=p++;i(S,k,T),a[S]=k,l[k]=T,h[k]=N,s[k]=new RegExp(T,L?"g":void 0),c[k]=new RegExp(N,L?"g":void 0)};m("NUMERICIDENTIFIER","0|[1-9]\\d*"),m("NUMERICIDENTIFIERLOOSE","\\d+"),m("NONNUMERICIDENTIFIER",`\\d*[a-zA-Z-]${E}*`),m("MAINVERSION",`(${l[a.NUMERICIDENTIFIER]})\\.(${l[a.NUMERICIDENTIFIER]})\\.(${l[a.NUMERICIDENTIFIER]})`),m("MAINVERSIONLOOSE",`(${l[a.NUMERICIDENTIFIERLOOSE]})\\.(${l[a.NUMERICIDENTIFIERLOOSE]})\\.(${l[a.NUMERICIDENTIFIERLOOSE]})`),m("PRERELEASEIDENTIFIER",`(?:${l[a.NONNUMERICIDENTIFIER]}|${l[a.NUMERICIDENTIFIER]})`),m("PRERELEASEIDENTIFIERLOOSE",`(?:${l[a.NONNUMERICIDENTIFIER]}|${l[a.NUMERICIDENTIFIERLOOSE]})`),m("PRERELEASE",`(?:-(${l[a.PRERELEASEIDENTIFIER]}(?:\\.${l[a.PRERELEASEIDENTIFIER]})*))`),m("PRERELEASELOOSE",`(?:-?(${l[a.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${l[a.PRERELEASEIDENTIFIERLOOSE]})*))`),m("BUILDIDENTIFIER",`${E}+`),m("BUILD",`(?:\\+(${l[a.BUILDIDENTIFIER]}(?:\\.${l[a.BUILDIDENTIFIER]})*))`),m("FULLPLAIN",`v?${l[a.MAINVERSION]}${l[a.PRERELEASE]}?${l[a.BUILD]}?`),m("FULL",`^${l[a.FULLPLAIN]}$`),m("LOOSEPLAIN",`[v=\\s]*${l[a.MAINVERSIONLOOSE]}${l[a.PRERELEASELOOSE]}?${l[a.BUILD]}?`),m("LOOSE",`^${l[a.LOOSEPLAIN]}$`),m("GTLT","((?:<|>)?=?)"),m("XRANGEIDENTIFIERLOOSE",`${l[a.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`),m("XRANGEIDENTIFIER",`${l[a.NUMERICIDENTIFIER]}|x|X|\\*`),m("XRANGEPLAIN",`[v=\\s]*(${l[a.XRANGEIDENTIFIER]})(?:\\.(${l[a.XRANGEIDENTIFIER]})(?:\\.(${l[a.XRANGEIDENTIFIER]})(?:${l[a.PRERELEASE]})?${l[a.BUILD]}?)?)?`),m("XRANGEPLAINLOOSE",`[v=\\s]*(${l[a.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[a.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[a.XRANGEIDENTIFIERLOOSE]})(?:${l[a.PRERELEASELOOSE]})?${l[a.BUILD]}?)?)?`),m("XRANGE",`^${l[a.GTLT]}\\s*${l[a.XRANGEPLAIN]}$`),m("XRANGELOOSE",`^${l[a.GTLT]}\\s*${l[a.XRANGEPLAINLOOSE]}$`),m("COERCEPLAIN",`(^|[^\\d])(\\d{1,${r}})(?:\\.(\\d{1,${r}}))?(?:\\.(\\d{1,${r}}))?`),m("COERCE",`${l[a.COERCEPLAIN]}(?:$|[^\\d])`),m("COERCEFULL",l[a.COERCEPLAIN]+`(?:${l[a.PRERELEASE]})?(?:${l[a.BUILD]})?(?:$|[^\\d])`),m("COERCERTL",l[a.COERCE],!0),m("COERCERTLFULL",l[a.COERCEFULL],!0),m("LONETILDE","(?:~>?)"),m("TILDETRIM",`(\\s*)${l[a.LONETILDE]}\\s+`,!0),e.tildeTrimReplace="$1~",m("TILDE",`^${l[a.LONETILDE]}${l[a.XRANGEPLAIN]}$`),m("TILDELOOSE",`^${l[a.LONETILDE]}${l[a.XRANGEPLAINLOOSE]}$`),m("LONECARET","(?:\\^)"),m("CARETTRIM",`(\\s*)${l[a.LONECARET]}\\s+`,!0),e.caretTrimReplace="$1^",m("CARET",`^${l[a.LONECARET]}${l[a.XRANGEPLAIN]}$`),m("CARETLOOSE",`^${l[a.LONECARET]}${l[a.XRANGEPLAINLOOSE]}$`),m("COMPARATORLOOSE",`^${l[a.GTLT]}\\s*(${l[a.LOOSEPLAIN]})$|^$`),m("COMPARATOR",`^${l[a.GTLT]}\\s*(${l[a.FULLPLAIN]})$|^$`),m("COMPARATORTRIM",`(\\s*)${l[a.GTLT]}\\s*(${l[a.LOOSEPLAIN]}|${l[a.XRANGEPLAIN]})`,!0),e.comparatorTrimReplace="$1$2$3",m("HYPHENRANGE",`^\\s*(${l[a.XRANGEPLAIN]})\\s+-\\s+(${l[a.XRANGEPLAIN]})\\s*$`),m("HYPHENRANGELOOSE",`^\\s*(${l[a.XRANGEPLAINLOOSE]})\\s+-\\s+(${l[a.XRANGEPLAINLOOSE]})\\s*$`),m("STAR","(<|>)?=?\\s*\\*"),m("GTE0","^\\s*>=\\s*0\\.0\\.0\\s*$"),m("GTE0PRE","^\\s*>=\\s*0\\.0\\.0-0\\s*$")})(z,z.exports);const Gt=Object.freeze({loose:!0}),Vt=Object.freeze({}),Ht=t=>t?typeof t!="object"?Gt:t:Vt;var Ne=Ht;const Ae=/^[0-9]+$/,lt=(t,e)=>{if(typeof t=="number"&&typeof e=="number")return t===e?0:t<e?-1:1;const r=Ae.test(t),n=Ae.test(e);return r&&n&&(t=+t,e=+e),t===e?0:r&&!n?-1:n&&!r?1:t<e?-1:1},Wt=(t,e)=>lt(e,t);var ct={compareIdentifiers:lt,rcompareIdentifiers:Wt};const Y=oe,{MAX_LENGTH:Oe,MAX_SAFE_INTEGER:q}=ne,{safeRe:K,t:J}=z.exports,Yt=Ne,{compareIdentifiers:pe}=ct;class O{constructor(e,r){if(r=Yt(r),e instanceof O){if(e.loose===!!r.loose&&e.includePrerelease===!!r.includePrerelease)return e;e=e.version}else if(typeof e!="string")throw new TypeError(`Invalid version. Must be a string. Got type "${typeof e}".`);if(e.length>Oe)throw new TypeError(`version is longer than ${Oe} characters`);Y("SemVer",e,r),this.options=r,this.loose=!!r.loose,this.includePrerelease=!!r.includePrerelease;const n=e.trim().match(r.loose?K[J.LOOSE]:K[J.FULL]);if(!n)throw new TypeError(`Invalid Version: ${e}`);if(this.raw=e,this.major=+n[1],this.minor=+n[2],this.patch=+n[3],this.major>q||this.major<0)throw new TypeError("Invalid major version");if(this.minor>q||this.minor<0)throw new TypeError("Invalid minor version");if(this.patch>q||this.patch<0)throw new TypeError("Invalid patch version");n[4]?this.prerelease=n[4].split(".").map(o=>{if(/^[0-9]+$/.test(o)){const i=+o;if(i>=0&&i<q)return i}return o}):this.prerelease=[],this.build=n[5]?n[5].split("."):[],this.format()}format(){return this.version=`${this.major}.${this.minor}.${this.patch}`,this.prerelease.length&&(this.version+=`-${this.prerelease.join(".")}`),this.version}toString(){return this.version}compare(e){if(Y("SemVer.compare",this.version,this.options,e),!(e instanceof O)){if(typeof e=="string"&&e===this.version)return 0;e=new O(e,this.options)}return e.version===this.version?0:this.compareMain(e)||this.comparePre(e)}compareMain(e){return e instanceof O||(e=new O(e,this.options)),this.major<e.major?-1:this.major>e.major?1:this.minor<e.minor?-1:this.minor>e.minor?1:this.patch<e.patch?-1:this.patch>e.patch?1:0}comparePre(e){if(e instanceof O||(e=new O(e,this.options)),this.prerelease.length&&!e.prerelease.length)return-1;if(!this.prerelease.length&&e.prerelease.length)return 1;if(!this.prerelease.length&&!e.prerelease.length)return 0;let r=0;do{const n=this.prerelease[r],o=e.prerelease[r];if(Y("prerelease compare",r,n,o),n===void 0&&o===void 0)return 0;if(o===void 0)return 1;if(n===void 0)return-1;if(n===o)continue;return pe(n,o)}while(++r)}compareBuild(e){e instanceof O||(e=new O(e,this.options));let r=0;do{const n=this.build[r],o=e.build[r];if(Y("build compare",r,n,o),n===void 0&&o===void 0)return 0;if(o===void 0)return 1;if(n===void 0)return-1;if(n===o)continue;return pe(n,o)}while(++r)}inc(e,r,n){if(e.startsWith("pre")){if(!r&&n===!1)throw new Error("invalid increment argument: identifier is empty");if(r){const o=`-${r}`.match(this.options.loose?K[J.PRERELEASELOOSE]:K[J.PRERELEASE]);if(!o||o[1]!==r)throw new Error(`invalid identifier: ${r}`)}}switch(e){case"premajor":this.prerelease.length=0,this.patch=0,this.minor=0,this.major++,this.inc("pre",r,n);break;case"preminor":this.prerelease.length=0,this.patch=0,this.minor++,this.inc("pre",r,n);break;case"prepatch":this.prerelease.length=0,this.inc("patch",r,n),this.inc("pre",r,n);break;case"prerelease":this.prerelease.length===0&&this.inc("patch",r,n),this.inc("pre",r,n);break;case"release":if(this.prerelease.length===0)throw new Error(`version ${this.raw} is not a prerelease`);this.prerelease.length=0;break;case"major":(this.minor!==0||this.patch!==0||this.prerelease.length===0)&&this.major++,this.minor=0,this.patch=0,this.prerelease=[];break;case"minor":(this.patch!==0||this.prerelease.length===0)&&this.minor++,this.patch=0,this.prerelease=[];break;case"patch":this.prerelease.length===0&&this.patch++,this.prerelease=[];break;case"pre":{const o=Number(n)?1:0;if(this.prerelease.length===0)this.prerelease=[o];else{let i=this.prerelease.length;for(;--i>=0;)typeof this.prerelease[i]=="number"&&(this.prerelease[i]++,i=-2);if(i===-1){if(r===this.prerelease.join(".")&&n===!1)throw new Error("invalid increment argument: identifier already exists");this.prerelease.push(o)}}if(r){let i=[r,o];n===!1&&(i=[r]),pe(this.prerelease[0],r)===0?isNaN(this.prerelease[1])&&(this.prerelease=i):this.prerelease=i}break}default:throw new Error(`invalid increment argument: ${e}`)}return this.raw=this.format(),this.build.length&&(this.raw+=`+${this.build.join(".")}`),this}}var C=O;const Pe=C,qt=(t,e,r=!1)=>{if(t instanceof Pe)return t;try{return new Pe(t,e)}catch(n){if(!r)return null;throw n}};var X=qt;const Kt=X,Jt=(t,e)=>{const r=Kt(t,e);return r?r.version:null};var Qt=Jt;const Zt=X,er=(t,e)=>{const r=Zt(t.trim().replace(/^[=v]+/,""),e);return r?r.version:null};var tr=er;const je=C,rr=(t,e,r,n,o)=>{typeof r=="string"&&(o=n,n=r,r=void 0);try{return new je(t instanceof je?t.version:t,r).inc(e,n,o).version}catch{return null}};var nr=rr;const De=X,or=(t,e)=>{const r=De(t,null,!0),n=De(e,null,!0),o=r.compare(n);if(o===0)return null;const i=o>0,s=i?r:n,c=i?n:r,l=!!s.prerelease.length;if(!!c.prerelease.length&&!l){if(!c.patch&&!c.minor)return"major";if(c.compareMain(s)===0)return c.minor&&!c.patch?"minor":"patch"}const a=l?"pre":"";return r.major!==n.major?a+"major":r.minor!==n.minor?a+"minor":r.patch!==n.patch?a+"patch":"prerelease"};var ir=or;const ar=C,sr=(t,e)=>new ar(t,e).major;var lr=sr;const cr=C,ur=(t,e)=>new cr(t,e).minor;var pr=ur;const dr=C,fr=(t,e)=>new dr(t,e).patch;var hr=fr;const mr=X,wr=(t,e)=>{const r=mr(t,e);return r&&r.prerelease.length?r.prerelease:null};var gr=wr;const Fe=C,br=(t,e,r)=>new Fe(t,r).compare(new Fe(e,r));var P=br;const yr=P,Er=(t,e,r)=>yr(e,t,r);var vr=Er;const xr=P,$r=(t,e)=>xr(t,e,!0);var Nr=$r;const ze=C,Rr=(t,e,r)=>{const n=new ze(t,r),o=new ze(e,r);return n.compare(o)||n.compareBuild(o)};var Re=Rr;const kr=Re,Lr=(t,e)=>t.sort((r,n)=>kr(r,n,e));var Sr=Lr;const Ir=Re,_r=(t,e)=>t.sort((r,n)=>Ir(n,r,e));var Cr=_r;const Tr=P,Ar=(t,e,r)=>Tr(t,e,r)>0;var ie=Ar;const Or=P,Pr=(t,e,r)=>Or(t,e,r)<0;var ke=Pr;const jr=P,Dr=(t,e,r)=>jr(t,e,r)===0;var ut=Dr;const Fr=P,zr=(t,e,r)=>Fr(t,e,r)!==0;var pt=zr;const Br=P,Mr=(t,e,r)=>Br(t,e,r)>=0;var Le=Mr;const Ur=P,Xr=(t,e,r)=>Ur(t,e,r)<=0;var Se=Xr;const Gr=ut,Vr=pt,Hr=ie,Wr=Le,Yr=ke,qr=Se,Kr=(t,e,r,n)=>{switch(e){case"===":return typeof t=="object"&&(t=t.version),typeof r=="object"&&(r=r.version),t===r;case"!==":return typeof t=="object"&&(t=t.version),typeof r=="object"&&(r=r.version),t!==r;case"":case"=":case"==":return Gr(t,r,n);case"!=":return Vr(t,r,n);case">":return Hr(t,r,n);case">=":return Wr(t,r,n);case"<":return Yr(t,r,n);case"<=":return qr(t,r,n);default:throw new TypeError(`Invalid operator: ${e}`)}};var dt=Kr;const Jr=C,Qr=X,{safeRe:Q,t:Z}=z.exports,Zr=(t,e)=>{if(t instanceof Jr)return t;if(typeof t=="number"&&(t=String(t)),typeof t!="string")return null;e=e||{};let r=null;if(!e.rtl)r=t.match(e.includePrerelease?Q[Z.COERCEFULL]:Q[Z.COERCE]);else{const l=e.includePrerelease?Q[Z.COERCERTLFULL]:Q[Z.COERCERTL];let h;for(;(h=l.exec(t))&&(!r||r.index+r[0].length!==t.length);)(!r||h.index+h[0].length!==r.index+r[0].length)&&(r=h),l.lastIndex=h.index+h[1].length+h[2].length;l.lastIndex=-1}if(r===null)return null;const n=r[2],o=r[3]||"0",i=r[4]||"0",s=e.includePrerelease&&r[5]?`-${r[5]}`:"",c=e.includePrerelease&&r[6]?`+${r[6]}`:"";return Qr(`${n}.${o}.${i}${s}${c}`,e)};var en=Zr;class tn{constructor(){this.max=1e3,this.map=new Map}get(e){const r=this.map.get(e);if(r!==void 0)return this.map.delete(e),this.map.set(e,r),r}delete(e){return this.map.delete(e)}set(e,r){if(!this.delete(e)&&r!==void 0){if(this.map.size>=this.max){const o=this.map.keys().next().value;this.delete(o)}this.map.set(e,r)}return this}}var rn=tn,de,Be;function j(){if(Be)return de;Be=1;const t=/\s+/g;class e{constructor(u,b){if(b=o(b),u instanceof e)return u.loose===!!b.loose&&u.includePrerelease===!!b.includePrerelease?u:new e(u.raw,b);if(u instanceof i)return this.raw=u.value,this.set=[[u]],this.formatted=void 0,this;if(this.options=b,this.loose=!!b.loose,this.includePrerelease=!!b.includePrerelease,this.raw=u.trim().replace(t," "),this.set=this.raw.split("||").map(w=>this.parseRange(w.trim())).filter(w=>w.length),!this.set.length)throw new TypeError(`Invalid SemVer Range: ${this.raw}`);if(this.set.length>1){const w=this.set[0];if(this.set=this.set.filter(y=>!m(y[0])),this.set.length===0)this.set=[w];else if(this.set.length>1){for(const y of this.set)if(y.length===1&&S(y[0])){this.set=[y];break}}}this.formatted=void 0}get range(){if(this.formatted===void 0){this.formatted="";for(let u=0;u<this.set.length;u++){u>0&&(this.formatted+="||");const b=this.set[u];for(let w=0;w<b.length;w++)w>0&&(this.formatted+=" "),this.formatted+=b[w].toString().trim()}}return this.formatted}format(){return this.range}toString(){return this.range}parseRange(u){const w=((this.options.includePrerelease&&d)|(this.options.loose&&_))+":"+u,y=n.get(w);if(y)return y;const g=this.options.loose,v=g?l[h.HYPHENRANGELOOSE]:l[h.HYPHENRANGE];u=u.replace(v,At(this.options.includePrerelease)),s("hyphen replace",u),u=u.replace(l[h.COMPARATORTRIM],a),s("comparator trim",u),u=u.replace(l[h.TILDETRIM],p),s("tilde trim",u),u=u.replace(l[h.CARETTRIM],E),s("caret trim",u);let $=u.split(" ").map(I=>L(I,this.options)).join(" ").split(/\s+/).map(I=>Tt(I,this.options));g&&($=$.filter(I=>(s("loose invalid filter",I,this.options),!!I.match(l[h.COMPARATORLOOSE])))),s("range list",$);const x=new Map,R=$.map(I=>new i(I,this.options));for(const I of R){if(m(I))return[I];x.set(I.value,I)}x.size>1&&x.has("")&&x.delete("");const A=[...x.values()];return n.set(w,A),A}intersects(u,b){if(!(u instanceof e))throw new TypeError("a Range is required");return this.set.some(w=>T(w,b)&&u.set.some(y=>T(y,b)&&w.every(g=>y.every(v=>g.intersects(v,b)))))}test(u){if(!u)return!1;if(typeof u=="string")try{u=new c(u,this.options)}catch{return!1}for(let b=0;b<this.set.length;b++)if(Ot(this.set[b],u,this.options))return!0;return!1}}de=e;const r=rn,n=new r,o=Ne,i=ae(),s=oe,c=C,{safeRe:l,t:h,comparatorTrimReplace:a,tildeTrimReplace:p,caretTrimReplace:E}=z.exports,{FLAG_INCLUDE_PRERELEASE:d,FLAG_LOOSE:_}=ne,m=f=>f.value==="<0.0.0-0",S=f=>f.value==="",T=(f,u)=>{let b=!0;const w=f.slice();let y=w.pop();for(;b&&w.length;)b=w.every(g=>y.intersects(g,u)),y=w.pop();return b},L=(f,u)=>(f=f.replace(l[h.BUILD],""),s("comp",f,u),f=Lt(f,u),s("caret",f),f=k(f,u),s("tildes",f),f=It(f,u),s("xrange",f),f=Ct(f,u),s("stars",f),f),N=f=>!f||f.toLowerCase()==="x"||f==="*",k=(f,u)=>f.trim().split(/\s+/).map(b=>D(b,u)).join(" "),D=(f,u)=>{const b=u.loose?l[h.TILDELOOSE]:l[h.TILDE];return f.replace(b,(w,y,g,v,$)=>{s("tilde",f,w,y,g,v,$);let x;return N(y)?x="":N(g)?x=`>=${y}.0.0 <${+y+1}.0.0-0`:N(v)?x=`>=${y}.${g}.0 <${y}.${+g+1}.0-0`:$?(s("replaceTilde pr",$),x=`>=${y}.${g}.${v}-${$} <${y}.${+g+1}.0-0`):x=`>=${y}.${g}.${v} <${y}.${+g+1}.0-0`,s("tilde return",x),x})},Lt=(f,u)=>f.trim().split(/\s+/).map(b=>St(b,u)).join(" "),St=(f,u)=>{s("caret",f,u);const b=u.loose?l[h.CARETLOOSE]:l[h.CARET],w=u.includePrerelease?"-0":"";return f.replace(b,(y,g,v,$,x)=>{s("caret",f,y,g,v,$,x);let R;return N(g)?R="":N(v)?R=`>=${g}.0.0${w} <${+g+1}.0.0-0`:N($)?g==="0"?R=`>=${g}.${v}.0${w} <${g}.${+v+1}.0-0`:R=`>=${g}.${v}.0${w} <${+g+1}.0.0-0`:x?(s("replaceCaret pr",x),g==="0"?v==="0"?R=`>=${g}.${v}.${$}-${x} <${g}.${v}.${+$+1}-0`:R=`>=${g}.${v}.${$}-${x} <${g}.${+v+1}.0-0`:R=`>=${g}.${v}.${$}-${x} <${+g+1}.0.0-0`):(s("no pr"),g==="0"?v==="0"?R=`>=${g}.${v}.${$}${w} <${g}.${v}.${+$+1}-0`:R=`>=${g}.${v}.${$}${w} <${g}.${+v+1}.0-0`:R=`>=${g}.${v}.${$} <${+g+1}.0.0-0`),s("caret return",R),R})},It=(f,u)=>(s("replaceXRanges",f,u),f.split(/\s+/).map(b=>_t(b,u)).join(" ")),_t=(f,u)=>{f=f.trim();const b=u.loose?l[h.XRANGELOOSE]:l[h.XRANGE];return f.replace(b,(w,y,g,v,$,x)=>{s("xRange",f,w,y,g,v,$,x);const R=N(g),A=R||N(v),I=A||N($),G=I;return y==="="&&G&&(y=""),x=u.includePrerelease?"-0":"",R?y===">"||y==="<"?w="<0.0.0-0":w="*":y&&G?(A&&(v=0),$=0,y===">"?(y=">=",A?(g=+g+1,v=0,$=0):(v=+v+1,$=0)):y==="<="&&(y="<",A?g=+g+1:v=+v+1),y==="<"&&(x="-0"),w=`${y+g}.${v}.${$}${x}`):A?w=`>=${g}.0.0${x} <${+g+1}.0.0-0`:I&&(w=`>=${g}.${v}.0${x} <${g}.${+v+1}.0-0`),s("xRange return",w),w})},Ct=(f,u)=>(s("replaceStars",f,u),f.trim().replace(l[h.STAR],"")),Tt=(f,u)=>(s("replaceGTE0",f,u),f.trim().replace(l[u.includePrerelease?h.GTE0PRE:h.GTE0],"")),At=f=>(u,b,w,y,g,v,$,x,R,A,I,G)=>(N(w)?b="":N(y)?b=`>=${w}.0.0${f?"-0":""}`:N(g)?b=`>=${w}.${y}.0${f?"-0":""}`:v?b=`>=${b}`:b=`>=${b}${f?"-0":""}`,N(R)?x="":N(A)?x=`<${+R+1}.0.0-0`:N(I)?x=`<${R}.${+A+1}.0-0`:G?x=`<=${R}.${A}.${I}-${G}`:f?x=`<${R}.${A}.${+I+1}-0`:x=`<=${x}`,`${b} ${x}`.trim()),Ot=(f,u,b)=>{for(let w=0;w<f.length;w++)if(!f[w].test(u))return!1;if(u.prerelease.length&&!b.includePrerelease){for(let w=0;w<f.length;w++)if(s(f[w].semver),f[w].semver!==i.ANY&&f[w].semver.prerelease.length>0){const y=f[w].semver;if(y.major===u.major&&y.minor===u.minor&&y.patch===u.patch)return!0}return!1}return!0};return de}var fe,Me;function ae(){if(Me)return fe;Me=1;const t=Symbol("SemVer ANY");class e{static get ANY(){return t}constructor(a,p){if(p=r(p),a instanceof e){if(a.loose===!!p.loose)return a;a=a.value}a=a.trim().split(/\s+/).join(" "),s("comparator",a,p),this.options=p,this.loose=!!p.loose,this.parse(a),this.semver===t?this.value="":this.value=this.operator+this.semver.version,s("comp",this)}parse(a){const p=this.options.loose?n[o.COMPARATORLOOSE]:n[o.COMPARATOR],E=a.match(p);if(!E)throw new TypeError(`Invalid comparator: ${a}`);this.operator=E[1]!==void 0?E[1]:"",this.operator==="="&&(this.operator=""),E[2]?this.semver=new c(E[2],this.options.loose):this.semver=t}toString(){return this.value}test(a){if(s("Comparator.test",a,this.options.loose),this.semver===t||a===t)return!0;if(typeof a=="string")try{a=new c(a,this.options)}catch{return!1}return i(a,this.operator,this.semver,this.options)}intersects(a,p){if(!(a instanceof e))throw new TypeError("a Comparator is required");return this.operator===""?this.value===""?!0:new l(a.value,p).test(this.value):a.operator===""?a.value===""?!0:new l(this.value,p).test(a.semver):(p=r(p),p.includePrerelease&&(this.value==="<0.0.0-0"||a.value==="<0.0.0-0")||!p.includePrerelease&&(this.value.startsWith("<0.0.0")||a.value.startsWith("<0.0.0"))?!1:!!(this.operator.startsWith(">")&&a.operator.startsWith(">")||this.operator.startsWith("<")&&a.operator.startsWith("<")||this.semver.version===a.semver.version&&this.operator.includes("=")&&a.operator.includes("=")||i(this.semver,"<",a.semver,p)&&this.operator.startsWith(">")&&a.operator.startsWith("<")||i(this.semver,">",a.semver,p)&&this.operator.startsWith("<")&&a.operator.startsWith(">")))}}fe=e;const r=Ne,{safeRe:n,t:o}=z.exports,i=dt,s=oe,c=C,l=j();return fe}const nn=j(),on=(t,e,r)=>{try{e=new nn(e,r)}catch{return!1}return e.test(t)};var se=on;const an=j(),sn=(t,e)=>new an(t,e).set.map(r=>r.map(n=>n.value).join(" ").trim().split(" "));var ln=sn;const cn=C,un=j(),pn=(t,e,r)=>{let n=null,o=null,i=null;try{i=new un(e,r)}catch{return null}return t.forEach(s=>{i.test(s)&&(!n||o.compare(s)===-1)&&(n=s,o=new cn(n,r))}),n};var dn=pn;const fn=C,hn=j(),mn=(t,e,r)=>{let n=null,o=null,i=null;try{i=new hn(e,r)}catch{return null}return t.forEach(s=>{i.test(s)&&(!n||o.compare(s)===1)&&(n=s,o=new fn(n,r))}),n};var wn=mn;const he=C,gn=j(),Ue=ie,bn=(t,e)=>{t=new gn(t,e);let r=new he("0.0.0");if(t.test(r)||(r=new he("0.0.0-0"),t.test(r)))return r;r=null;for(let n=0;n<t.set.length;++n){const o=t.set[n];let i=null;o.forEach(s=>{const c=new he(s.semver.version);switch(s.operator){case">":c.prerelease.length===0?c.patch++:c.prerelease.push(0),c.raw=c.format();case"":case">=":(!i||Ue(c,i))&&(i=c);break;case"<":case"<=":break;default:throw new Error(`Unexpected operation: ${s.operator}`)}}),i&&(!r||Ue(r,i))&&(r=i)}return r&&t.test(r)?r:null};var yn=bn;const En=j(),vn=(t,e)=>{try{return new En(t,e).range||"*"}catch{return null}};var xn=vn;const $n=C,ft=ae(),{ANY:Nn}=ft,Rn=j(),kn=se,Xe=ie,Ge=ke,Ln=Se,Sn=Le,In=(t,e,r,n)=>{t=new $n(t,n),e=new Rn(e,n);let o,i,s,c,l;switch(r){case">":o=Xe,i=Ln,s=Ge,c=">",l=">=";break;case"<":o=Ge,i=Sn,s=Xe,c="<",l="<=";break;default:throw new TypeError('Must provide a hilo val of "<" or ">"')}if(kn(t,e,n))return!1;for(let h=0;h<e.set.length;++h){const a=e.set[h];let p=null,E=null;if(a.forEach(d=>{d.semver===Nn&&(d=new ft(">=0.0.0")),p=p||d,E=E||d,o(d.semver,p.semver,n)?p=d:s(d.semver,E.semver,n)&&(E=d)}),p.operator===c||p.operator===l||(!E.operator||E.operator===c)&&i(t,E.semver))return!1;if(E.operator===l&&s(t,E.semver))return!1}return!0};var Ie=In;const _n=Ie,Cn=(t,e,r)=>_n(t,e,">",r);var Tn=Cn;const An=Ie,On=(t,e,r)=>An(t,e,"<",r);var Pn=On;const Ve=j(),jn=(t,e,r)=>(t=new Ve(t,r),e=new Ve(e,r),t.intersects(e,r));var Dn=jn;const Fn=se,zn=P;var Bn=(t,e,r)=>{const n=[];let o=null,i=null;const s=t.sort((a,p)=>zn(a,p,r));for(const a of s)Fn(a,e,r)?(i=a,o||(o=a)):(i&&n.push([o,i]),i=null,o=null);o&&n.push([o,null]);const c=[];for(const[a,p]of n)a===p?c.push(a):!p&&a===s[0]?c.push("*"):p?a===s[0]?c.push(`<=${p}`):c.push(`${a} - ${p}`):c.push(`>=${a}`);const l=c.join(" || "),h=typeof e.raw=="string"?e.raw:String(e);return l.length<h.length?l:e};const He=j(),_e=ae(),{ANY:me}=_e,V=se,Ce=P,Mn=(t,e,r={})=>{if(t===e)return!0;t=new He(t,r),e=new He(e,r);let n=!1;e:for(const o of t.set){for(const i of e.set){const s=Xn(o,i,r);if(n=n||s!==null,s)continue e}if(n)return!1}return!0},Un=[new _e(">=0.0.0-0")],We=[new _e(">=0.0.0")],Xn=(t,e,r)=>{if(t===e)return!0;if(t.length===1&&t[0].semver===me){if(e.length===1&&e[0].semver===me)return!0;r.includePrerelease?t=Un:t=We}if(e.length===1&&e[0].semver===me){if(r.includePrerelease)return!0;e=We}const n=new Set;let o,i;for(const d of t)d.operator===">"||d.operator===">="?o=Ye(o,d,r):d.operator==="<"||d.operator==="<="?i=qe(i,d,r):n.add(d.semver);if(n.size>1)return null;let s;if(o&&i){if(s=Ce(o.semver,i.semver,r),s>0)return null;if(s===0&&(o.operator!==">="||i.operator!=="<="))return null}for(const d of n){if(o&&!V(d,String(o),r)||i&&!V(d,String(i),r))return null;for(const _ of e)if(!V(d,String(_),r))return!1;return!0}let c,l,h,a,p=i&&!r.includePrerelease&&i.semver.prerelease.length?i.semver:!1,E=o&&!r.includePrerelease&&o.semver.prerelease.length?o.semver:!1;p&&p.prerelease.length===1&&i.operator==="<"&&p.prerelease[0]===0&&(p=!1);for(const d of e){if(a=a||d.operator===">"||d.operator===">=",h=h||d.operator==="<"||d.operator==="<=",o){if(E&&d.semver.prerelease&&d.semver.prerelease.length&&d.semver.major===E.major&&d.semver.minor===E.minor&&d.semver.patch===E.patch&&(E=!1),d.operator===">"||d.operator===">="){if(c=Ye(o,d,r),c===d&&c!==o)return!1}else if(o.operator===">="&&!V(o.semver,String(d),r))return!1}if(i){if(p&&d.semver.prerelease&&d.semver.prerelease.length&&d.semver.major===p.major&&d.semver.minor===p.minor&&d.semver.patch===p.patch&&(p=!1),d.operator==="<"||d.operator==="<="){if(l=qe(i,d,r),l===d&&l!==i)return!1}else if(i.operator==="<="&&!V(i.semver,String(d),r))return!1}if(!d.operator&&(i||o)&&s!==0)return!1}return!(o&&h&&!i&&s!==0||i&&a&&!o&&s!==0||E||p)},Ye=(t,e,r)=>{if(!t)return e;const n=Ce(t.semver,e.semver,r);return n>0?t:n<0||e.operator===">"&&t.operator===">="?e:t},qe=(t,e,r)=>{if(!t)return e;const n=Ce(t.semver,e.semver,r);return n<0?t:n>0||e.operator==="<"&&t.operator==="<="?e:t};var Gn=Mn;const we=z.exports,Ke=ne,Vn=C,Je=ct,Hn=X,Wn=Qt,Yn=tr,qn=nr,Kn=ir,Jn=lr,Qn=pr,Zn=hr,eo=gr,to=P,ro=vr,no=Nr,oo=Re,io=Sr,ao=Cr,so=ie,lo=ke,co=ut,uo=pt,po=Le,fo=Se,ho=dt,mo=en,wo=ae(),go=j(),bo=se,yo=ln,Eo=dn,vo=wn,xo=yn,$o=xn,No=Ie,Ro=Tn,ko=Pn,Lo=Dn,So=Bn,Io=Gn;var _o={parse:Hn,valid:Wn,clean:Yn,inc:qn,diff:Kn,major:Jn,minor:Qn,patch:Zn,prerelease:eo,compare:to,rcompare:ro,compareLoose:no,compareBuild:oo,sort:io,rsort:ao,gt:so,lt:lo,eq:co,neq:uo,gte:po,lte:fo,cmp:ho,coerce:mo,Comparator:wo,Range:go,satisfies:bo,toComparators:yo,maxSatisfying:Eo,minSatisfying:vo,minVersion:xo,validRange:$o,outside:No,gtr:Ro,ltr:ko,intersects:Lo,simplifyRange:So,subset:Io,SemVer:Vn,re:we.re,src:we.src,tokens:we.t,SEMVER_SPEC_VERSION:Ke.SEMVER_SPEC_VERSION,RELEASE_TYPES:Ke.RELEASE_TYPES,compareIdentifiers:Je.compareIdentifiers,rcompareIdentifiers:Je.rcompareIdentifiers};const Qe="16.9.0",Co=0,Ze=1;function To({rendererPackageName:t,version:e,bundleType:r},n){return t!=="react-dom"||typeof e!="string"||!/^\d+\.\d+\.\d+(-\S+)?$/.test(e)||!_o.gte(e,Qe)?(n&&n(`Unsupported React renderer (only react-dom v${Qe}+ is supported). Renderer: ${t||"unknown"}, Version: ${e||"unknown"}`),!1):r!==Ze?(n&&n(`Unsupported React renderer, only bundle type ${Ze} (development) is supported but ${r} (${r===Co?"production":"unknown"}) is found`),!1):!0}const et={vscode:{url:"vscode://file/${projectPath}${filePath}:${line}:${column}",label:"VSCode"},webstorm:{url:"webstorm://open?file=${projectPath}${filePath}&line=${line}&column=${column}",label:"WebStorm"},cursor:{url:"cursor://file/${projectPath}${filePath}:${line}:${column}",label:"Cursor"},windsurf:{url:"windsurf://file/${projectPath}${filePath}:${line}:${column}",label:"Windsurf"}};typeof navigator<"u"&&navigator.platform.toUpperCase().indexOf("MAC")>=0;function Ao(){return!!(window.__SVELTE_HMR||window.__SAPPER__)}function Oo(){return!!window.__VUE__}function Po(){return!!window.__LOCATOR_DATA__}function jo(){if(window.__REACT_DEVTOOLS_GLOBAL_HOOK__){const t=window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;if(t&&Array.from(t.values()).filter(r=>To(r,n=>{})).length)return!0}return!1}const Do="Helvetica, sans-serif, Arial",Fo=`*, ::before, ::after {
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

input:where([type='text']),input:where(:not([type])),input:where([type='email']),input:where([type='url']),input:where([type='password']),input:where([type='number']),input:where([type='date']),input:where([type='datetime-local']),input:where([type='month']),input:where([type='search']),input:where([type='tel']),input:where([type='time']),input:where([type='week']),select:where([multiple]),textarea,select {
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

input:where([type='text']):focus, input:where(:not([type])):focus, input:where([type='email']):focus, input:where([type='url']):focus, input:where([type='password']):focus, input:where([type='number']):focus, input:where([type='date']):focus, input:where([type='datetime-local']):focus, input:where([type='month']):focus, input:where([type='search']):focus, input:where([type='tel']):focus, input:where([type='time']):focus, input:where([type='week']):focus, select:where([multiple]):focus, textarea:focus, select:focus {
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
  text-align: inherit;
}

::-webkit-datetime-edit {
  display: inline-flex;
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

select:where([multiple]),select:where([size]:not([size="1"])) {
  background-image: initial;
  background-position: initial;
  background-repeat: unset;
  background-size: initial;
  padding-right: 0.75rem;
  -webkit-print-color-adjust: unset;
          print-color-adjust: unset;
}

input:where([type='checkbox']),input:where([type='radio']) {
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

input:where([type='checkbox']) {
  border-radius: 0px;
}

input:where([type='radio']) {
  border-radius: 100%;
}

input:where([type='checkbox']):focus,input:where([type='radio']):focus {
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

input:where([type='checkbox']):checked,input:where([type='radio']):checked {
  border-color: transparent;
  background-color: currentColor;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}

input:where([type='checkbox']):checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
}

@media (forced-colors: active)  {
  input:where([type='checkbox']):checked {
    -webkit-appearance: auto;
       -moz-appearance: auto;
            appearance: auto;
  }
}

input:where([type='radio']):checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='8' cy='8' r='3'/%3e%3c/svg%3e");
}

@media (forced-colors: active)  {
  input:where([type='radio']):checked {
    -webkit-appearance: auto;
       -moz-appearance: auto;
            appearance: auto;
  }
}

input:where([type='checkbox']):checked:hover,input:where([type='checkbox']):checked:focus,input:where([type='radio']):checked:hover,input:where([type='radio']):checked:focus {
  border-color: transparent;
  background-color: currentColor;
}

input:where([type='checkbox']):indeterminate {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e");
  border-color: transparent;
  background-color: currentColor;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}

@media (forced-colors: active)  {
  input:where([type='checkbox']):indeterminate {
    -webkit-appearance: auto;
       -moz-appearance: auto;
            appearance: auto;
  }
}

input:where([type='checkbox']):indeterminate:hover,input:where([type='checkbox']):indeterminate:focus {
  border-color: transparent;
  background-color: currentColor;
}

input:where([type='file']) {
  background: unset;
  border-color: inherit;
  border-width: 0;
  border-radius: 0;
  padding: 0;
  font-size: unset;
  line-height: inherit;
}

input:where([type='file']):focus {
  outline: 1px solid ButtonText;
  outline: 1px auto -webkit-focus-ring-color;
}

.container {
  width: 100%;
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}

@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
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

.sticky {
  position: sticky;
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

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.border-dashed {
  border-style: dashed;
}

.border-amber-500 {
  --tw-border-opacity: 1;
  border-color: rgb(245 158 11 / var(--tw-border-opacity, 1));
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

.border-gray-500 {
  --tw-border-opacity: 1;
  border-color: rgb(107 114 128 / var(--tw-border-opacity, 1));
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

.p-5 {
  padding: 1.25rem;
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

.blur {
  --tw-blur: blur(8px);
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}

.filter {
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}

.backdrop-filter {
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
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
}`,ge=new Map;function zo(t){const e=t.split(`
`);for(let r=1;r<e.length;r++){const n=e[r]?.trim();if(!n||n.includes("react-stack-top-frame")||n.includes("react_stack_bottom_frame")||n.includes("jsxDEV")||n.includes("exports.jsx ")||n.includes("exports.jsxs "))continue;const o=n.match(/at\s+(?:\S+\s+)?\(?(https?:\/\/.+?):(\d+):(\d+)\)?/)||n.match(/at\s+(https?:\/\/.+?):(\d+):(\d+)/);if(o&&o[1]&&o[2]&&o[3])return{url:o[1],line:parseInt(o[2],10),column:parseInt(o[3],10)}}return null}async function Bo(t){if(ge.has(t))return ge.get(t);const e=(async()=>{try{const r=await fetch(t);if(!r.ok)return null;const o=(await r.text()).match(/\/\/[#@]\s*sourceMappingURL=(.+?)(?:\s|$)/);if(!o||!o[1])return null;let i=o[1];i.startsWith("http")||(i=t.substring(0,t.lastIndexOf("/")+1)+i);const s=await fetch(i);return s.ok?await s.json():null}catch{return null}})();return ge.set(t,e),e}const ht=5,mt=1<<ht,Mo=mt-1,Uo=mt,tt="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",wt=new Map;for(let t=0;t<tt.length;t++)wt.set(tt[t],t);function H(t,e){let r=0,n=0,o,i=e;do{const c=t[i];if(!c)return[0,i];const l=wt.get(c);if(l===void 0)return[0,i];i++,o=(l&Uo)!==0,r+=(l&Mo)<<n,n+=ht}while(o);const s=(r&1)===1;return r>>=1,[s?-r:r,i]}function rt(t,e,r){const n=t.mappings;if(!n)return null;let o=1,i=0,s=0,c=0,l=0,h=null,a=0;for(;a<n.length;){const p=n[a];if(p===";"){o++,i=0,a++;continue}if(p===","){a++;continue}let E;if([E,a]=H(n,a),i+=E,a<n.length&&n[a]!==","&&n[a]!==";"){let d,_,m;if([d,a]=H(n,a),s+=d,[_,a]=H(n,a),c+=_,[m,a]=H(n,a),l+=m,a<n.length&&n[a]!==","&&n[a]!==";"&&([,a]=H(n,a)),o===e&&i<=r){const S=t.sources[s];S&&(h={fileName:Xo(S),lineNumber:c+1,columnNumber:l})}if(o>e)break}}return h}function Xo(t){let e=t.replace(/^file:\/\//,"");return e=e.replace(/^\[project\]\//,""),e=e.replace(/^webpack:\/\/[^/]*\//,""),e}async function Go(t,e,r){const n=await Bo(t);if(!n)return null;if("sections"in n&&n.sections){const o=n.sections;let i=null;for(let l=o.length-1;l>=0;l--){const h=o[l];if(!!h){if(h.offset.line<e){i=h;break}if(h.offset.line===e&&h.offset.column<=r){i=h;break}}}if(!i)return null;const s=e-i.offset.line,c=e===i.offset.line?r-i.offset.column:r;return rt(i.map,s,c)}return rt(n,e,r)}function M(t){let e=t;for(;e;){if(e._debugSource)return{fiber:e,source:e._debugSource};e=e._debugOwner||null}return null}function Vo(t){const e=Object.keys(t).find(r=>r.startsWith("__reactFiber$"));return e?t[e]:null}function B(t,e){const n=window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.values();if(n){for(const i of Array.from(n))if(i.findFiberByHostInstance){const s=i.findFiberByHostInstance(t);if(s)return e?M(s)?.fiber||null:s}}const o=Vo(t);return o?e?M(o)?.fiber||null:o:null}function gt(t){if(!t)return"Not found";if(typeof t.elementType=="string")return t.elementType;if(!t.elementType)return"Anonymous";if(t.elementType.name)return t.elementType.name;if(t.elementType.displayName)return t.elementType.displayName;if(t.elementType.type?.name)return t.elementType.type.name;if(t.elementType.type?.displayName)return t.elementType.type.displayName;if(t.elementType.render?.name)return t.elementType.render.name;if(t.elementType.render?.displayName)return t.elementType.render.displayName;if(t.elementType._payload?._result?.name)return t.elementType._payload._result.name;if(t.elementType._payload?._result?.displayName)return t.elementType._payload._result.displayName;if(t.type&&typeof t.type!="string"&&t.type!==t.elementType){if(t.type.name)return t.type.name;if(t.type.displayName)return t.type.displayName}return"Anonymous"}function F(t){if(!t.startsWith("/"))return t;const e=["/app/","/src/","/pages/","/components/","/lib/"];for(const n of e){const o=t.indexOf(n);if(o!==-1)return t.substring(o+1)}const r=t.split("/");return r.length>3?r.slice(-4).join("/"):t}function te(t,e){return{label:gt(t),link:e?{filePath:F(e.fileName),projectPath:"",line:e.lineNumber,column:e.columnNumber||0}:null}}function bt(t){const e=[];let r=t.child;for(;r;)e.push(r),r=r.sibling;return e}function Ho(t){const e=[t];let r=t;for(;r.return;){if(r=r.return,r.stateNode&&r.stateNode instanceof Element||bt(r).length>1)return e;e.push(r)}return e}function yt(t){return t!=null}function Wo(t){const e={};return t.map(r=>{const n=JSON.stringify(r);return e[n]?null:(e[n]=!0,r)}).filter(yt)}function Et(t){return t.stateNode&&t.stateNode.getBoundingClientRect?t.stateNode.getBoundingClientRect():null}function le(t,e){const r=Math.min(t.x,e.x),n=Math.min(t.y,e.y);return{x:r,y:n,width:Math.max(t.x+t.width,e.x+e.width)-r,height:Math.max(t.y+t.height,e.y+e.height)-n}}const Yo=6;function vt(t,e=0){const r=bt(t);let n;return r.forEach(o=>{let i=Et(o);!i&&e<Yo&&(i=vt(o,e+1)||null),i&&(i.width<=0||i.height<=0||(n?n=le(n,i):n=i))}),n}function xt(t){return!!t._debugOwner?.elementType?.styledComponentId}function qo(t){const e=[],r=t.stateNode;if(!r||!(r instanceof Element))return console.warn("[TreeLocator] Skipping fiber with non-Element stateNode:",t.type,t.stateNode),null;let n=r.getBoundingClientRect(),o=xt(t)&&t._debugOwner?t._debugOwner:t;for(;o._debugOwner||o.return;){o=o._debugOwner||o.return;const i=o.stateNode;if(!i||!(i instanceof Element))return{component:o,parentElements:e,componentBox:vt(o)||n};const s=gt(o);n=le(n,i.getBoundingClientRect()),e.push({box:i.getBoundingClientRect(),label:s,link:null})}return console.warn("[TreeLocator] Could not find root component for fiber:",t.type),null}function ce(t){let e=t;const r=new Set;let n=e;const o=e.uniqueId;r.add(n.uniqueId);let i=2;for(;n&&i>0;)i--,n=n.getParent(),n&&(r.add(n.uniqueId),e=n);return{expandedIds:r,highlightedId:o,root:e,originalNode:t}}const be=new WeakMap;let nt=0;function Ko(t){return be.has(t)||(nt++,be.set(t,nt)),be.get(t)}class ue{constructor(e){this.type="element",this.element=e,this.name=e.nodeName.toLowerCase(),this.uniqueId=String(Ko(e))}getBox(){return this.element.getBoundingClientRect()}getElement(){return this.element}getChildren(){return Array.from(this.element.children).map(r=>r instanceof HTMLElement||r instanceof SVGElement?new this.constructor(r):null).filter(yt)}getParent(){return this.element.parentElement?new this.constructor(this.element.parentElement):null}getSource(){throw new Error("Method not implemented.")}getComponent(){throw new Error("Method not implemented.")}getOwnerComponents(){return[]}}function Jo(t){const e=[],r=B(t,!1);if(r){const n=qo(r);if(!n)return null;const{component:o,componentBox:i,parentElements:s}=n;Ho(o).forEach(h=>{const a=M(h);if(a){const p=te(a.fiber,a.source);e.push(p)}});const l=te(r,M(r)?.source);return xt(r)&&(l.label=`${l.label} (styled)`),{thisElement:{box:Et(r)||t.getBoundingClientRect(),...l},htmlElement:t,parentElements:s,componentBox:i,componentsLabels:Wo(e)}}return null}class ve extends ue{getSource(){const e=B(this.element,!1);return e&&e._debugSource?{fileName:e._debugSource.fileName,lineNumber:e._debugSource.lineNumber,columnNumber:e._debugSource.columnNumber}:null}fiberToTreeNodeComponent(e){const r=te(e,M(e)?.source);return{label:r.label,callLink:r.link&&{fileName:r.link.filePath,lineNumber:r.link.line,columnNumber:r.link.column,projectPath:r.link.projectPath}||void 0}}getComponent(){const r=B(this.element,!1)?._debugOwner;return r?this.fiberToTreeNodeComponent(r):null}getOwnerComponents(){const e=B(this.element,!1);if(!e)return[];const r=this.element.parentElement;let n=null;r&&(n=B(r,!1)?._debugOwner||null);const o=[];let i=e._debugOwner;for(;i&&!(n&&i===n);)o.push(this.fiberToTreeNodeComponent(i)),i=i._debugOwner||null;return o.reverse()}}function Qo(t){const e=new ve(t);return ce(e)}function ot(t){const e=te(t,M(t)?.source);return{title:e.label,link:e.link}}function Zo(t){const e=B(t,!1);if(e){const r=[];let n=e;for(r.push(ot(n));n._debugOwner;)n=n._debugOwner,r.push(ot(n));return r}return[]}const Fi={getElementInfo:Jo,getTree:Qo,getParentsPaths:Zo};function U(t){const[e,r]=t.split("::");if(!e||!r)throw new Error("locatorjsId is malformed");return[e,r]}function W(t){const e=t.lastIndexOf(":");if(e===-1)return null;const r=t.lastIndexOf(":",e-1);if(r===-1)return null;const n=t.substring(0,r),o=t.substring(r+1,e),i=t.substring(e+1),s=parseInt(o,10),c=parseInt(i,10);return Number.isNaN(s)||Number.isNaN(c)?null:[n,s,c]}function $t(t){const e=["/src/","/app/","/pages/","/components/"];for(const n of e){const o=t.indexOf(n);if(o!==-1)return[t.substring(0,o),t.substring(o)]}const r=t.lastIndexOf("/");return r!==-1?[t.substring(0,r+1),t.substring(r+1)]:[t,""]}function re(t,e){const r=t.getAttribute("data-locatorjs"),n=t.getAttribute("data-locatorjs-id");if(r){const o=W(r);if(o){const[,i,s]=o;if(e){const c=e.expressions.find(l=>l.loc.start.line===i&&l.loc.start.column===s);if(c)return c}return{name:t.tagName.toLowerCase(),loc:{start:{line:i,column:s},end:{line:i,column:s}},wrappingComponentId:null}}}if(n&&e){const[,o]=U(n),i=e.expressions[Number(o)];if(i)return i}return null}function ei(t,e,r,n){let o=t.getBoundingClientRect();function i(s){const c=s.parentNode;if(!!c&&(c instanceof HTMLElement||c instanceof SVGElement)){const l=c.getAttribute("data-locatorjs"),h=c.getAttribute("data-locatorjs-id");if(l||h){let a;if(l){const d=W(l);if(!d){i(c);return}[a]=d}else if(h)[a]=U(h);else{i(c);return}const p=e[a],E=re(c,p||null);E&&E.wrappingComponentId===n&&r===a&&(o=le(o,c.getBoundingClientRect()),i(c))}else i(c)}}return i(t),o}function Nt(t){const e=t.closest("[data-locatorjs-id], [data-locatorjs]"),r=e?.getAttribute("data-locatorjs-id"),n=e?.getAttribute("data-locatorjs"),o=e?.getAttribute("data-locatorjs-styled");if(e&&(e instanceof HTMLElement||e instanceof SVGElement)&&(r||n||o)){if(!r&&!n)return null;let i;if(n){const S=W(n);if(!S)return null;[i]=S}else if(r)[i]=U(r);else return null;const s=window.__LOCATOR_DATA__,c=s?.[i],[l,h]=o?U(o):[null,null],a=l&&s?.[l],p=a&&a.styledDefinitions[Number(h)];p&&(a.filePath,a.projectPath,(p.loc?.start.column||0)+1,p.loc?.start.line);const E=re(e,c||null);if(!E)return null;let d,_;c?(d=c.filePath,_=c.projectPath):[_,d]=$t(i);const m=E.wrappingComponentId!==null&&c?c.components[Number(E.wrappingComponentId)]:null;return{thisElement:{box:e.getBoundingClientRect(),label:E.name,link:{filePath:d,projectPath:_,column:(E.loc.start.column||0)+1,line:E.loc.start.line||0}},htmlElement:e,parentElements:[],componentBox:ei(e,s||{},i,Number(E.wrappingComponentId)),componentsLabels:m?[{label:m.name||"component",link:{filePath:d,projectPath:_,column:(m.loc?.start.column||0)+1,line:m.loc?.start.line||0}}]:[]}}return null}class ee extends ue{getSource(){const e=this.element.getAttribute("data-locatorjs-id"),r=this.element.getAttribute("data-locatorjs");if(!e&&!r)return null;let n;if(r){const c=W(r);if(!c)return null;[n]=c}else if(e)[n]=U(e);else return null;const i=window.__LOCATOR_DATA__?.[n],s=re(this.element,i||null);if(s){let c,l;return i?(c=i.filePath,l=i.projectPath):[l,c]=$t(n),{fileName:c,projectPath:l,columnNumber:(s.loc.start.column||0)+1,lineNumber:s.loc.start.line||0}}return null}getComponent(){const e=this.element.getAttribute("data-locatorjs-id"),r=this.element.getAttribute("data-locatorjs");if(!e&&!r)return null;let n;if(r){const s=W(r);if(!s)return null;[n]=s}else if(e)[n]=U(e);else return null;const i=window.__LOCATOR_DATA__?.[n];if(i){const s=re(this.element,i);if(s&&s.wrappingComponentId!==null){const c=i.components[s.wrappingComponentId];if(c)return{label:c.name||"component",definitionLink:{fileName:i.filePath,projectPath:i.projectPath,columnNumber:(c.loc?.start.column||0)+1,lineNumber:c.loc?.start.line||0}}}}return null}}function ti(t){const e=new ee(t);return ce(e)}function ri(t){const e=[];let r=t,n=null;do{if(r){const o=Nt(r),i=JSON.stringify(o?.thisElement.link);if(o&&i!==n){n=i;const s=o.thisElement.link,c=o.thisElement.label;s&&e.push({title:c,link:s})}}r=r.parentElement}while(r);return e}const zi={getElementInfo:Nt,getTree:ti,getParentsPaths:ri};function ni(t){if(t.__svelte_meta){const{loc:e}=t.__svelte_meta;return{thisElement:{box:t.getBoundingClientRect(),label:t.nodeName.toLowerCase(),link:{column:e.column+1,line:e.line+1,filePath:e.file,projectPath:""}},htmlElement:t,parentElements:[],componentBox:t.getBoundingClientRect(),componentsLabels:[]}}return null}class xe extends ue{getSource(){const e=this.element;if(e.__svelte_meta){const{loc:r}=e.__svelte_meta;return{fileName:r.file,lineNumber:r.line+1,columnNumber:r.column+1}}return null}getComponent(){return null}}function oi(t){const e=new xe(t);return ce(e)}function ii(t){const e=[];let r=t,n=1e4;do{if(r?.__svelte_meta){const{loc:o}=r.__svelte_meta;o.file===e[e.length-1]?.link?.filePath||e.push({title:r.nodeName.toLowerCase(),link:{column:o.column+1,line:o.line+1,filePath:o.file,projectPath:""}})}if(r=r.parentElement,n--,n<0)break}while(r);return e}const Bi={getElementInfo:ni,getTree:oi,getParentsPaths:ii};function Rt(t){let e=null;return t?.subTree?.children&&t?.subTree?.children instanceof Array&&t?.subTree?.children.forEach(r=>{const n=ai(r);!n||n.width<=0||n.height<=0||(e?e=le(e,n):e=n)}),e}function ai(t){return t.el instanceof HTMLElement?t.el.getBoundingClientRect():t.component?Rt(t.component):null}function kt(t){const e=t.__vueParentComponent;if(e){if(!e.type)return null;const r=Rt(e),{__file:n,__name:o}=e.type;if(n&&o)return{thisElement:{box:t.getBoundingClientRect(),label:t.nodeName.toLowerCase(),link:{column:1,line:1,filePath:n,projectPath:""}},htmlElement:t,parentElements:[],componentBox:r||t.getBoundingClientRect(),componentsLabels:[{label:o,link:{column:1,line:1,filePath:n,projectPath:""}}]}}return null}class $e extends ue{getSource(){const r=this.element.__vueParentComponent;if(r&&r.type){const{__file:n}=r.type;if(n)return{fileName:n,lineNumber:1,columnNumber:1}}return null}getComponent(){return null}}function si(t){const e=new $e(t);return ce(e)}function li(t){const e=[];let r=t,n=null;do{if(r){const o=kt(r),i=JSON.stringify(o?.componentsLabels);if(o&&i!==n){n=i;const s=o.thisElement.link,c=o.thisElement.label;s&&e.push({title:c,link:s})}}r=r.parentElement}while(r);return e}const Mi={getElementInfo:kt,getTree:si,getParentsPaths:li};function ci(){if(typeof window<"u"&&window.liveSocket)return!0;if(typeof document<"u"){if(document.querySelector("[data-phx-main], [data-phx-session]"))return!0;const t=document.createTreeWalker(document.body,NodeFilter.SHOW_COMMENT,null);let e=0;for(;t.nextNode()&&e<50;){const r=t.currentNode.textContent;if(r?.includes("@caller")||r?.includes("<App"))return!0;e++}}return!1}function ui(t){return Object.keys(t).some(e=>e.startsWith("__reactFiber$"))}function pi(t,e){return e==="react"?new ve(t):e==="svelte"?new xe(t):e==="vue"?new $e(t):e==="jsx"?new ee(t):Ao()?new xe(t):Oo()?new $e(t):jo()||ui(t)?new ve(t):Po()||t.dataset.locatorjsId?new ee(t):ci()?new ee(t):null}const di=/^@caller\s+(.+):(\d+)$/,fi=/^<([^>]+)>\s+(.+):(\d+)$/,hi=/^<\/([^>]+)>$/;function mi(t){const e=t.textContent?.trim();if(!e)return null;const r=e.match(di);if(r&&r[1]&&r[2])return{commentNode:t,name:"@caller",filePath:r[1],line:parseInt(r[2],10),type:"caller"};const n=e.match(fi);return n&&n[1]&&n[2]&&n[3]?{commentNode:t,name:n[1],filePath:n[2],line:parseInt(n[3],10),type:"component"}:(e.match(hi),null)}function wi(t){const e=[];let r=t.previousSibling;for(;r;){if(r.nodeType===Node.COMMENT_NODE){const n=mi(r);n&&e.push(n)}else if(r.nodeType===Node.TEXT_NODE){const n=r.textContent?.trim();if(n&&n.length>0)break}else break;r=r.previousSibling}return e.reverse()}function gi(t){return t.map(e=>({name:e.name,filePath:e.filePath,line:e.line,type:e.type}))}function bi(t){const e=wi(t);return e.length===0?null:gi(e)}function yi(t){const r=(t.split(":")[0]||t).split("/").pop()?.replace(/\.(tsx?|jsx?)$/,"")||"Unknown";return r==="layout"?"RootLayout":r==="page"?"Page":r}function Ei(t){if(!t)return null;const e=t.split(":");if(e.length<2)return null;e.pop();const r=e.pop(),n=e.join(":");if(!n||!r)return null;const o=yi(n),i=F(n);return{name:o,filePath:i,line:parseInt(r,10),type:"component"}}function vi(t){const e=t.getAttribute("data-locatorjs");if(!e)return[];const r=Ei(e);return r?[r]:[]}function xi(t){const e=vi(t);return e.length===0?null:e}const $i=new Set(["html","body","head"]);function Ni(t){return"getElement"in t&&typeof t.getElement=="function"}function Ri(t){const e=t.parentElement;if(!e)return;const r=t.tagName,n=Array.from(e.children).filter(i=>i.tagName===r);return n.length<=1?void 0:n.indexOf(t)+1}function ki(t){return{name:t.label,filePath:t.callLink?.fileName?F(t.callLink.fileName):void 0,line:t.callLink?.lineNumber}}function Li(t){const e=[];let r=t;for(;r;){if($i.has(r.name)){r=r.getParent();continue}const n=r.getSource(),o={elementName:r.name};if(Ni(r)){const c=r.getElement();if(c instanceof Element){c.id&&(o.id=c.id);const l=Ri(c);l!==void 0&&(o.nthChild=l);const h=bi(c),a=xi(c),p=[...h||[],...a||[]];p.length>0&&(o.serverComponents=p)}}const i=r.getOwnerComponents(),s=i[0];if(s)o.ownerComponents=i.map(ki),o.componentName=s.label,s.callLink&&(o.filePath=F(s.callLink.fileName),o.line=s.callLink.lineNumber);else{const c=r.getComponent();c&&(o.componentName=c.label,c.callLink&&(o.filePath=F(c.callLink.fileName),o.line=c.callLink.lineNumber))}!o.filePath&&n&&(o.filePath=F(n.fileName),o.line=n.lineNumber),(o.componentName||o.filePath||o.serverComponents)&&e.push(o),r=r.getParent()}return e}function it(t){if(!!t){if(t.ownerComponents&&t.ownerComponents.length>0){for(let e=t.ownerComponents.length-1;e>=0;e--)if(t.ownerComponents[e].name!=="Anonymous")return t.ownerComponents[e].name}if(t.componentName&&t.componentName!=="Anonymous")return t.componentName}}function Ui(t){const e=t.findIndex(r=>r.filePath);return e===-1?t:t.slice(0,e+1)}function at(t){if(t.length===0)return"";const e=[...t].reverse(),r=[];return e.forEach((n,o)=>{const i="    ".repeat(o),s=o===0?"":"\u2514\u2500 ",c=o>0?e[o-1]:null,l=it(c),h=it(n);let a=n.elementName,p=[];if(h&&h!==l)if(n.ownerComponents&&n.ownerComponents.length>0){const L=n.ownerComponents.filter(k=>k.name!=="Anonymous"),N=L[L.length-1];N&&(a=N.name,p=L.slice(0,-1).map(k=>k.name))}else n.componentName&&n.componentName!=="Anonymous"&&(a=n.componentName);let d=a;n.nthChild!==void 0&&(d+=`:nth-child(${n.nthChild})`),n.id&&(d+=`#${n.id}`);let _=d;const m=[];if(n.serverComponents&&n.serverComponents.length>0){const L=n.serverComponents.filter(k=>k.filePath.match(/\.(ex|exs|heex)$/)),N=n.serverComponents.filter(k=>k.filePath.match(/\.(tsx?|jsx?)$/));if(L.length>0){const k=L.filter(D=>D.type==="component").map(D=>D.name);k.length>0&&m.push(`[Phoenix: ${k.join(" > ")}]`)}if(N.length>0){const k=N.filter(D=>D.type==="component").map(D=>D.name);k.length>0&&m.push(`[Next.js: ${k.join(" > ")}]`)}}p.length>0&&m.push(`in ${p.join(" > ")}`),m.length>0&&(_=`${d} ${m.join(" ")}`);const S=[];if(n.serverComponents&&n.serverComponents.length>0&&n.serverComponents.forEach(L=>{const N=L.type==="caller"?" (called from)":"";S.push(`${L.filePath}:${L.line}${N}`)}),n.filePath){const L=`${n.filePath}:${n.line}`;S.includes(L)||S.push(L)}const T=S.length>0?` at ${S.join(", ")}`:"";r.push(`${i}${s}${_}${T}`)}),r.join(`
`)}function Si(){const t=document.querySelector("[class]")||document.body;if(!t)return!1;const e=Object.keys(t).find(n=>n.startsWith("__reactFiber$"));if(!e)return!1;let r=t[e];for(;r;){if(r._debugSource)return!1;if(r._debugStack)return!0;r=r._debugOwner||null}return!1}function Ii(t){const e=new Map,r=Object.keys(t).find(o=>o.startsWith("__reactFiber$"));if(!r)return e;let n=t[r];for(;n;){const o=n._debugStack;if(o?.stack){const i=zo(o.stack);if(i){const s=n.type?.name||n.type?.displayName||n.type;typeof s=="string"&&e.set(s,i)}}n=n._debugOwner||null}return e}async function _i(t,e){if(!t.some(i=>i.componentName&&!i.filePath)||!Si())return t;const n=e?Ii(e):new Map;return await Promise.all(t.map(async i=>{if(i.filePath||!i.componentName)return i;const s=n.get(i.componentName);if(!s)return i;try{const c=await Go(s.url,s.line,s.column);if(c)return{...i,filePath:F(c.fileName),line:c.lineNumber}}catch{}return i}))}function ye(t){if(typeof t=="string"){const e=document.querySelector(t);return e instanceof HTMLElement?e:null}return t}function Ci(t,e){const r=pi(t,e);return r?Li(r):null}async function Ee(t,e){const r=Ci(t,e);return r?_i(r,t):null}const Ti=`
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

4. replay()
   Replays the last recorded interaction sequence as a macro.

   Usage:
     window.__treelocator__.replay()

5. replayWithRecord(elementOrSelector)
   Replays stored interactions while recording element changes.
   Returns dejitter analysis when replay completes.

   Usage:
     const results = await window.__treelocator__.replayWithRecord('[data-locatorjs-id="SlidingPanel"]')
     console.log(results.findings)  // anomaly analysis
     console.log(results.path)      // component ancestry

6. help()
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
  const path = win.__treelocator__.getPath('button.submit');
  cy.log(path);
});

NOTES:
------
\u2022 Accepts CSS selectors or HTMLElement objects
\u2022 Returns null if element not found or framework not supported
\u2022 Works with React, Vue, Svelte, Preact, and any JSX framework
\u2022 Automatically installed when TreeLocatorJS runtime initializes

Documentation: https://github.com/wende/treelocatorjs
`;function Ai(t){return{getPath(e){const r=ye(e);return r?Ee(r,t).then(n=>n?at(n):null):Promise.resolve(null)},getAncestry(e){const r=ye(e);return r?Ee(r,t):Promise.resolve(null)},getPathData(e){const r=ye(e);return r?Ee(r,t).then(n=>n?{path:at(n),ancestry:n}:null):Promise.resolve(null)},help(){return Ti},replay(){},replayWithRecord(){return Promise.resolve(null)}}}function Oi(t){typeof window<"u"&&(window.__treelocator__=Ai(t))}function Pi({adapter:t,targets:e}={}){if(typeof window>"u"||typeof document>"u"||document.getElementById("locatorjs-wrapper"))return;Oi(t);const r=document.createElement("style");r.id="locatorjs-style",r.innerHTML=`
      #locatorjs-layer {
        all: initial;
        pointer-events: none;
        font-family: ${Do};
      }
      #locatorjs-layer * {
        box-sizing: border-box;
      }
      #locatorjs-labels-wrapper {
        display: flex;
        gap: 8px;
      }
      ${Fo}
    `;const n=document.createElement("style");n.id="locatorjs-global-style",n.innerHTML=`
      #locatorjs-wrapper {
        z-index: ${ji};
        pointer-events: none;
        position: fixed;
      }
      .locatorjs-active-pointer * {
        cursor: pointer !important;
      }
    `;const o=document.createElement("div");o.setAttribute("id","locatorjs-wrapper");const i=o.attachShadow({mode:"open"}),s=document.createElement("div");if(s.setAttribute("id","locatorjs-layer"),i.appendChild(r),i.appendChild(s),document.body.appendChild(o),document.head.appendChild(n),typeof require<"u"){const{initRender:c}=require("./components/Runtime");c(s,t,e||et)}else Dt(()=>import("./Runtime.ff7936bf.js"),[]).then(({initRender:c})=>{c(s,t,e||et)})}const ji=2147483647;function Di({adapter:t,targets:e}={}){setTimeout(()=>Pi({adapter:t,targets:e}),0)}Di();console.log("\u2705 TreeLocatorJS initialized!");console.log("\u{1F4CB} Try Alt+clicking any element to see the unified server\u2192client component tree");console.log("\u{1F50D} Phoenix LiveView detected:",window.liveSocket!==void 0||document.querySelector("[data-phx-main]")!==null);export{Oo as a,jo as b,Po as c,Ao as d,pi as e,Li as f,at as g,_i as h,zi as j,bi as p,Fi as r,Bi as s,Ui as t,Mi as v};
