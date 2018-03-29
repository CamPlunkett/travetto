import { RetainFields, Point, FieldType } from './common';

type GeneralFieldQuery<T> =
  T |
  { $eq: T; $ne?: never; $exists?: never } |
  { $ne: T; $eq?: never; $exists?: never } |
  { $exists: boolean; $ne?: never; $eq?: never };

type GeneralScalarFieldQuery<T> =
  GeneralFieldQuery<T> |
  // Array
  { $in: T[]; $nin?: never } |
  { $nin: T[]; $in?: never };

type ComparableFieldQuery<T> =
  GeneralScalarFieldQuery<T> |
  { $lt: T; $lte?: never } |
  { $lte: T; $lt?: never } |
  { $gt: T; $gte?: never } |
  { $gte: T; $gt?: never };

type ArrayFieldQuery<T> =
  GeneralFieldQuery<T> |
  { $all: T; };

type StringFieldQuery =
  GeneralScalarFieldQuery<string> |
  { $regex: RegExp; };

type GeoFieldQuery =
  GeneralScalarFieldQuery<Point> |
  {
    $geoWithin?: Point[];
    $geoIntersects: Point[];
  };

type FieldQuery<T> =
  (T extends (number | Date) ? ComparableFieldQuery<T> :
    (T extends string ? StringFieldQuery :
      (T extends (infer U)[] ? ArrayFieldQuery<U> :
        (T extends Point ? GeoFieldQuery :
          (T extends Function ? never :
            GeneralFieldQuery<T>)))));

type _MatchQuery<T> = {
  [P in keyof T]?: T[P] extends (Date | number | string | any[] | Point | Function) ? FieldQuery<T[P]> : _MatchQuery<T[P]>
} & { $and?: never, $or?: never, $not?: never };

type _WhereClause<T> =
  ({ $and: (_MatchQuery<T> | _WhereClause<T>)[]; } |
    { $or: (_MatchQuery<T> | _WhereClause<T>)[]; } |
    { $not: (_MatchQuery<T> | _WhereClause<T>); }) &
  { [P in keyof T]?: never };

export type MatchQuery<T> = _MatchQuery<T>;
export type WhereClause<T> = _WhereClause<T> | _MatchQuery<T>;