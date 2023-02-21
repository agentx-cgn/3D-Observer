/* eslint-disable space-before-function-paren */
/* eslint-disable no-bitwise */

const helper = {

  colorFromString (s: unknown, saturation=50, lightness=75): string {
    // https://stackoverflow.com/questions/10014271/generate-random-color-distinguishable-to-humans
    const hue = helper.hash(String(s)) * 137.508 % 360; // use golden angle approximation
    return `hsl(${hue},${saturation}%,${lightness}%)`;
  },

  hash (s: string): number {
    // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
    return s.split('').reduce(function(a, b) {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return Math.abs(a & a);
    }, 0);
  }






};

export { helper };
