export async function postDelayedRequests<T, U>(
  dataArray: T[],
  requestFunction: (element: T) => Promise<U>,
  delayBetweenRequestsMs: number
): Promise<U[]> {
  const result: U[] = []

  for (const element of dataArray) {
    const response = await requestFunction(element)
    result.push(response)

    if (delayBetweenRequestsMs > 0) {
      await delay(delayBetweenRequestsMs)
    }
  }

  return result
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
