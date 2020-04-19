function isSuperset(set, subset) {
  for (let elem of subset) {
    if (!set.has(elem)) {
      return false
    }
  }
  return true
}

function union(setA, setB) {
  let _union = new Set(setA)
  for (let elem of setB) {
    _union.add(elem)
  }
  return _union
}

function intersection(setA, setB) {
  let _intersection = new Set()
  for (let elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem)
    }
  }
  return _intersection
}

function symmetricDifference(setA, setB) {
  let _difference = new Set(setA)
  for (let elem of setB) {
    if (_difference.has(elem)) {
      _difference.delete(elem)
    } else {
      _difference.add(elem)
    }
  }
  return _difference
}

function difference(setA, setB) {
  let _difference = new Set(setA)
  for (let elem of setB) {
    _difference.delete(elem)
  }
  return _difference
}

module.exports = {
  isSuperset,
  union,
  intersection,
  symmetricDifference,
  difference
}