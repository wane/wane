export type Guard<L, R extends L> = (l: L) => l is R
export type Predicate<T> = (t: T) => boolean
