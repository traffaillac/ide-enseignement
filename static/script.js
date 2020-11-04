/**
 * Based on https://github.com/sindresorhus/detect-indent (but faster)
 *
 * Returns :
 * _ an integer in [1,8] if the indendation was successfully detected in spaces
 * _ a TAB character if the indentation uses tabs
 * _ undefined if there weren't any indents to make a guess
 */
function detect_indent(src) {
	let above = 0
	const diffs = [0, 0, 0, 0, 0, 0, 0, 0]
	for (let i = 0; i < src.length; i++) {
		if (src[i] === '\t')
			return '\t'
		for (var spaces = 0; i + spaces < src.length && src[i + spaces] === ' '; spaces++);
		const diff = Math.abs(spaces - above)
		if (0 < diff && diff < 9)
			diffs[diff-1] = 1 + (diffs[diff-1] || 0)
		above = spaces
		for (i += spaces; i < src.length && src[i] !== '\n'; i++);
	}
	if (0 < above && above < 9)
		diffs[above-1] = 1 + (diffs[above-1] || 0)
	const max = Math.max(...diffs)
	return (max > 0) ? diffs.lastIndexOf(max)+1 : undefined
}
