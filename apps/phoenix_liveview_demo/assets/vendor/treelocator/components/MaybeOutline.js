import { template as _$template } from "solid-js/web";
import { effect as _$effect } from "solid-js/web";
import { setStyleProperty as _$setStyleProperty } from "solid-js/web";
import { createComponent as _$createComponent } from "solid-js/web";
import { memo as _$memo } from "solid-js/web";
var _tmpl$ = /*#__PURE__*/_$template(`<div><div class="fixed rounded border border-solid border-amber-500"style=z-index:2></div><div class="fixed text-xs font-medium rounded-md"style="z-index:3;box-shadow:0 4px 16px rgba(0, 0, 0, 0.2);font-family:ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;letter-spacing:0.01em">No source found`);
import { createMemo } from "solid-js";
import { getElementInfo } from "../adapters/getElementInfo";
import { Outline } from "./Outline";
export function MaybeOutline(props) {
  const elInfo = createMemo(() => getElementInfo(props.currentElement, props.adapterId));
  const box = () => props.currentElement.getBoundingClientRect();
  return _$memo(() => _$memo(() => !!elInfo())() ? _$createComponent(Outline, {
    get element() {
      return elInfo();
    },
    get targets() {
      return props.targets;
    }
  }) : (() => {
    var _el$ = _tmpl$(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling;
    _$setStyleProperty(_el$3, "padding", "4px 10px");
    _$setStyleProperty(_el$3, "background", "rgba(120, 53, 15, 0.85)");
    _$setStyleProperty(_el$3, "color", "#fff");
    _$setStyleProperty(_el$3, "border", "1px solid rgba(255, 255, 255, 0.15)");
    _$effect(_p$ => {
      var _v$ = box().x + "px",
        _v$2 = box().y + "px",
        _v$3 = box().width + "px",
        _v$4 = box().height + "px",
        _v$5 = box().x + 4 + "px",
        _v$6 = box().y + 4 + "px";
      _v$ !== _p$.e && _$setStyleProperty(_el$2, "left", _p$.e = _v$);
      _v$2 !== _p$.t && _$setStyleProperty(_el$2, "top", _p$.t = _v$2);
      _v$3 !== _p$.a && _$setStyleProperty(_el$2, "width", _p$.a = _v$3);
      _v$4 !== _p$.o && _$setStyleProperty(_el$2, "height", _p$.o = _v$4);
      _v$5 !== _p$.i && _$setStyleProperty(_el$3, "left", _p$.i = _v$5);
      _v$6 !== _p$.n && _$setStyleProperty(_el$3, "top", _p$.n = _v$6);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined
    });
    return _el$;
  })());
}