export const hexToRGB = (
  hex: string
): {
  red: number
  green: number
  blue: number
} => {
  const red = parseInt(hex.slice(1, 3), 16)
  const green = parseInt(hex.slice(3, 5), 16)
  const blue = parseInt(hex.slice(5, 7), 16)

  return { red, green, blue }
}

export const rgbToHex = (rgbString: string): string | undefined => {
  const regex = /rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/
  const matcher = regex.exec(rgbString)
  if (matcher) {
    const red = Number(matcher[1])
    const green = Number(matcher[2])
    const blue = Number(matcher[3])
    const rgb = blue | (green << 8) | (red << 16)
    return `#${(0x1000000 + rgb).toString(16).slice(1)}`
  }
}

export const addAlpha = (hexOrRGB: string, alpha: number): string => {
  const isRGB = hexOrRGB.startsWith('rgb')
  const isHex = hexOrRGB.startsWith('#')
  if (!isRGB && !isHex) {
    throw new Error('You used the method wrong!')
  }

  if (isRGB) {
    const hex = rgbToHex(hexOrRGB)
    if (!hex) {
      throw new Error('Could not convert rgb to hex.')
    }

    const { red, green, blue } = hexToRGB(hex)
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`
  }

  const { red, green, blue } = hexToRGB(hexOrRGB)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

/**
 * Lighten or darken color
 *
 * This function takes the color and lighten or darken it with the given amount. The color can be a rgb or hex code color.
 * @param hexOrRGB
 * @param amount
 *  Use positive value to light the color, otherwise negative
 */
export const shadeColor = (hexOrRGB: string, amount: number): string => {
  const isRGB = hexOrRGB.startsWith('rgb')
  const isHex = hexOrRGB.startsWith('#')
  if (!isRGB && !isHex) {
    throw new Error('You used the method wrong!')
  }

  const convertedColor = isRGB ? rgbToHex(hexOrRGB) : hexOrRGB
  if (!convertedColor) {
    throw new Error('Could not convert color.')
  }

  const colorHex = convertedColor.replace('#', '')
  const colorHexInt = parseInt(colorHex, 16)

  let red = (colorHexInt >> 16) + amount
  if (red > 255) {
    red = 255
  } else if (red < 0) {
    red = 0
  }

  let blue = ((colorHexInt >> 8) & 0x00ff) + amount
  if (blue > 255) {
    blue = 255
  } else if (blue < 0) {
    blue = 0
  }

  let green = (colorHexInt & 0x0000ff) + amount
  if (green > 255) {
    green = 255
  } else if (green < 0) {
    green = 0
  }

  return `#${(green | (blue << 8) | (red << 16)).toString(16)}`
}
