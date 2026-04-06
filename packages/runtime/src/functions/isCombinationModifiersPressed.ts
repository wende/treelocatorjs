export function getMouseModifiers() {
  const mouseModifiers =
    document.documentElement.dataset.locatorMouseModifiers || "alt";
  const mouseModifiersArray = mouseModifiers.split("+");
  const modifiers: { [key: string]: true } = {};
  mouseModifiersArray.forEach((modifier) => {
    modifiers[modifier] = true;
  }, {});

  return modifiers;
}

export function isCombinationModifiersPressed(
  e: MouseEvent | KeyboardEvent,
  rightClick = false
) {
  const modifiers = getMouseModifiers();

  // Only require shift if it's part of the configured modifiers.
  // Shift is used independently for truncation, so pressing it shouldn't
  // disqualify the activation modifier combo.
  if (rightClick) {
    return (
      e.altKey == !!modifiers.alt &&
      e.metaKey == !!modifiers.meta &&
      (!modifiers.shift || e.shiftKey)
    );
  }
  return (
    e.altKey == !!modifiers.alt &&
    e.ctrlKey == !!modifiers.ctrl &&
    e.metaKey == !!modifiers.meta &&
    (!modifiers.shift || e.shiftKey)
  );
}
