export function int(val) {
  const n = Number.parseInt(val, 10)
  if (n >= 0) {
    const [size, rest] = unsigned(n)
    return Buffer.concat([majorType(0, size), rest])
  } else {
    const [size, rest] = unsigned(-n-1)
    return Buffer.concat([majorType(1, size), rest])
  }
}

export function text(val) {
  const buffer = Buffer.from(val)
  const [size, rest] = unsigned(buffer.length)
  return Buffer.concat([
    majorType(3, size),
    rest,
    buffer
  ])
}

export function list(encodeElem, xs) {
  const [size, rest] = unsigned(xs.length)
  return Buffer.concat([
    majorType(4, size),
    rest,
    ...xs.map(encodeElem)
  ])
}

export function map(encodeKey, encodeValue, obj) {
  const [size, rest] = unsigned(Object.keys(obj).length)
  return Buffer.concat([
    majorType(5, size),
    rest,
    ...Object.keys(obj).reduce((xs, k) => {
      xs.push(encodeKey(k))
      xs.push(encodeValue(k, obj[k]))
      return xs
    }, [])
  ])
}

function unsigned(val) {
  if (val < 24) {
    return [val, Buffer.alloc(0)]
  } else if (val < 2 ** 8) {
    const buf = Buffer.alloc(1)
    buf.writeInt8(val)
    return [24, buf]
  } else if (val < 2 ** 16) {
    const buf = Buffer.alloc(2)
    buf.writeInt16BE(val)
    return [25, buf]
  } else if (val < 2 ** 32) {
    const buf = Buffer.alloc(4)
    buf.writeInt32BE(val)
    return [26, buf]
  } else if (val < 2 ** 64) {
    const buf = Buffer.alloc(8)
    buf.writeIntBE(val)
    return [27, buf]
  } else {
    throw new RangeError('Cannot encode integer values larger than 2^64')
  }
}

function majorType(i, val) {
  return Buffer.from([i << 5 | val])
}
