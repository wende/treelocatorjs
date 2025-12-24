import { template as _$template } from "solid-js/web";
import { createComponent as _$createComponent } from "solid-js/web";
import { insert as _$insert } from "solid-js/web";
import { setStyleProperty as _$setStyleProperty } from "solid-js/web";
var _tmpl$ = /*#__PURE__*/_$template(`<div style="background-color:#111827;border-radius:8px;box-shadow:0 10px 15px -3px rgba(0, 0, 0, 0.1);font-size:14px;z-index:100000;pointer-events:none">`);
import { onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
export function Toast(props) {
  let timeoutId;
  onMount(() => {
    timeoutId = setTimeout(() => {
      props.onClose();
    }, 1500);
  });
  onCleanup(() => {
    clearTimeout(timeoutId);
  });
  return _$createComponent(Portal, {
    get mount() {
      return document.body;
    },
    get children() {
      var _el$ = _tmpl$();
      _$setStyleProperty(_el$, "position", "fixed");
      _$setStyleProperty(_el$, "bottom", "16px");
      _$setStyleProperty(_el$, "left", "50%");
      _$setStyleProperty(_el$, "transform", "translateX(-50%)");
      _$setStyleProperty(_el$, "color", "white");
      _$setStyleProperty(_el$, "padding", "8px 16px");
      _$insert(_el$, () => props.message);
      return _el$;
    }
  });
}