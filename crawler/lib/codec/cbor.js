export function int(i) {
  if (i >= 0) {
    majorType(0, i)
  } else {
    majorType(1, -i-1)
  }
}

function majorType(i, val) {
  Buffer.from([i <<< 5 | val])
}
