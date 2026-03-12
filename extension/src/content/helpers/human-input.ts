function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function humanClick(element: HTMLElement): Promise<void> {
  await sleep(randomInt(300, 800))

  const rect = element.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const commonInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    view: window,
  }

  element.dispatchEvent(new MouseEvent('mouseover', commonInit))
  element.dispatchEvent(new MouseEvent('mousedown', { ...commonInit, button: 0 }))
  element.dispatchEvent(new MouseEvent('mouseup', { ...commonInit, button: 0 }))
  element.dispatchEvent(new MouseEvent('click', { ...commonInit, button: 0 }))
}

export async function humanType(
  element: HTMLElement,
  text: string,
): Promise<void> {
  element.focus()
  element.dispatchEvent(new FocusEvent('focus', { bubbles: true }))

  for (const char of text) {
    const delay = randomInt(60, 150)
    const keyInit: KeyboardEventInit = {
      key: char,
      code: `Key${char.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
    }

    element.dispatchEvent(new KeyboardEvent('keydown', keyInit))
    element.dispatchEvent(new KeyboardEvent('keypress', keyInit))

    // For contenteditable elements, insert text via inputEvent
    // For regular inputs, set value directly
    if (element.getAttribute('contenteditable') === 'true') {
      element.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: char,
        }),
      )
      // Actually insert the character into contenteditable
      document.execCommand('insertText', false, char)
    } else {
      const input = element as HTMLInputElement | HTMLTextAreaElement
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(input),
        'value',
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, input.value + char)
      } else {
        input.value += char
      }
      element.dispatchEvent(
        new InputEvent('input', { bubbles: true, data: char }),
      )
    }

    element.dispatchEvent(new KeyboardEvent('keyup', keyInit))

    await sleep(delay)
  }
}

export async function clearAndType(
  element: HTMLElement,
  text: string,
): Promise<void> {
  element.focus()

  // Select all content
  element.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true }),
  )

  if (element.getAttribute('contenteditable') === 'true') {
    document.execCommand('selectAll', false)
    document.execCommand('delete', false)
  } else {
    const input = element as HTMLInputElement | HTMLTextAreaElement
    input.select()
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input),
      'value',
    )?.set
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, '')
    } else {
      input.value = ''
    }
    element.dispatchEvent(
      new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }),
    )
  }

  await humanType(element, text)
}
