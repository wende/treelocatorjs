import { template as _$template } from "solid-js/web";
import { createComponent as _$createComponent } from "solid-js/web";
import { effect as _$effect } from "solid-js/web";
import { insert as _$insert } from "solid-js/web";
import { setStyleProperty as _$setStyleProperty } from "solid-js/web";
import { memo as _$memo } from "solid-js/web";
var _tmpl$ = /*#__PURE__*/_$template(`<div><div class="fixed rounded border border-solid border-sky-500"style=z-index:2></div><div class="fixed text-xs font-medium rounded-md"style="z-index:3;box-shadow:0 4px 16px rgba(0, 0, 0, 0.2);font-family:ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;letter-spacing:0.01em;text-overflow:ellipsis;white-space:nowrap">`);
import { RenderBoxes } from "./RenderBoxes";
export function Outline(props) {
  const box = () => props.element.thisElement.box;
  const domElementInfo = () => {
    const htmlElement = props.element.htmlElement;
    const box = props.element.thisElement.box;
    if (htmlElement && box) {
      const style = window.getComputedStyle(htmlElement);
      const margin = {
        top: parseFloat(style.marginTop),
        left: parseFloat(style.marginLeft),
        right: parseFloat(style.marginRight),
        bottom: parseFloat(style.marginBottom)
      };
      const padding = {
        top: parseFloat(style.paddingTop),
        left: parseFloat(style.paddingLeft),
        right: parseFloat(style.paddingRight),
        bottom: parseFloat(style.paddingBottom)
      };
      const individualMarginBoxes = {
        top: {
          top: box.y - margin.top,
          left: box.x,
          width: box.width,
          height: margin.top,
          label: label(margin.top)
        },
        left: {
          top: box.y - margin.top,
          left: box.x - margin.left,
          width: margin.left,
          height: box.height + margin.top + margin.bottom,
          label: label(margin.left)
        },
        right: {
          top: box.y - margin.top,
          left: box.x + box.width,
          width: margin.right,
          height: box.height + margin.top + margin.bottom,
          label: label(margin.right)
        },
        bottom: {
          top: box.y + box.height,
          left: box.x,
          width: box.width,
          height: margin.bottom,
          label: label(margin.bottom)
        }
      };
      const individualPaddingBoxes = {
        top: {
          top: box.y,
          left: box.x,
          width: box.width,
          height: padding.top,
          label: label(padding.top)
        },
        left: {
          top: box.y + padding.top,
          left: box.x,
          width: padding.left,
          height: box.height - padding.top - padding.bottom,
          label: label(padding.left)
        },
        right: {
          top: box.y + padding.top,
          left: box.x + box.width - padding.right,
          width: padding.right,
          height: box.height - padding.top - padding.bottom,
          label: label(padding.right)
        },
        bottom: {
          top: box.y + box.height - padding.bottom,
          left: box.x,
          width: box.width,
          height: padding.bottom,
          label: label(padding.bottom)
        }
      };
      return {
        margin: individualMarginBoxes,
        padding: individualPaddingBoxes,
        innerBox: {
          top: box.y + padding.top,
          left: box.x + padding.left,
          width: box.width - padding.left - padding.right,
          height: box.height - padding.top - padding.bottom,
          label: ""
        }
      };
    }
    return null;
  };
  return (() => {
    var _el$ = _tmpl$(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling;
    _$insert(_el$, (() => {
      var _c$ = _$memo(() => !!domElementInfo());
      return () => _c$() && _$createComponent(RenderBoxes, {
        get allBoxes() {
          return domElementInfo();
        }
      });
    })(), _el$2);
    _$setStyleProperty(_el$3, "padding", "4px 10px");
    _$setStyleProperty(_el$3, "background", "rgba(15, 23, 42, 0.85)");
    _$setStyleProperty(_el$3, "color", "#fff");
    _$setStyleProperty(_el$3, "border", "1px solid rgba(255, 255, 255, 0.15)");
    _$setStyleProperty(_el$3, "overflow", "hidden");
    _$insert(_el$3, () => props.element.thisElement.label);
    _$effect(_p$ => {
      var _v$ = box().x + "px",
        _v$2 = box().y + "px",
        _v$3 = box().width + "px",
        _v$4 = box().height + "px",
        _v$5 = box().x + 4 + "px",
        _v$6 = box().y + 4 + "px",
        _v$7 = box().width - 8 + "px";
      _v$ !== _p$.e && _$setStyleProperty(_el$2, "left", _p$.e = _v$);
      _v$2 !== _p$.t && _$setStyleProperty(_el$2, "top", _p$.t = _v$2);
      _v$3 !== _p$.a && _$setStyleProperty(_el$2, "width", _p$.a = _v$3);
      _v$4 !== _p$.o && _$setStyleProperty(_el$2, "height", _p$.o = _v$4);
      _v$5 !== _p$.i && _$setStyleProperty(_el$3, "left", _p$.i = _v$5);
      _v$6 !== _p$.n && _$setStyleProperty(_el$3, "top", _p$.n = _v$6);
      _v$7 !== _p$.s && _$setStyleProperty(_el$3, "max-width", _p$.s = _v$7);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined,
      s: undefined
    });
    return _el$;
  })();
}
function label(value) {
  return value ? `${value}px` : "";
}