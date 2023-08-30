export function compareArrays(mainDB: string[], snapshotDB: string[]) {
  const difference = []

  for (const ID of snapshotDB) {
    if (!mainDB.includes(ID)) {
      difference.push(ID)
    }
  }

  return difference
}
