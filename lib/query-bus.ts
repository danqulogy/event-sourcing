import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import 'reflect-metadata';
import { QUERY_METADATA } from './decorators/constants';
import { QueryHandlerNotFoundException } from './exceptions';
import { DefaultQueryPubSub, ObservableBus } from './helpers';
import {
  IQuery,
  IQueryBus,
  IQueryHandler,
  IQueryPublisher,
  QueryMetadata,
} from './interfaces';

export type QueryHandlerType = Type<IQueryHandler<IQuery>>;

@Injectable()
export class QueryBus<QueryBase extends IQuery = IQuery>
  extends ObservableBus<QueryBase>
  implements IQueryBus<QueryBase>
{
  private handlers = new Map<string, IQueryHandler<QueryBase>>();
  private _publisher: IQueryPublisher<QueryBase>;

  constructor(private readonly moduleRef: ModuleRef) {
    super();
    this.useDefaultPublisher();
  }

  get publisher(): IQueryPublisher<QueryBase> {
    return this._publisher;
  }

  set publisher(_publisher: IQueryPublisher<QueryBase>) {
    this._publisher = _publisher;
  }

  execute<T extends QueryBase, R = any>(query: T): Promise<R> {
    const queryId = this.getQueryId(query);
    const handler = this.handlers.get(queryId);
    if (!handler) {
      throw new QueryHandlerNotFoundException(queryId);
    }
    this._publisher.publish(query);
    return handler.execute(query);
  }

  bind<T extends QueryBase>(handler: IQueryHandler<T>, id: string) {
    this.handlers.set(id, handler);
  }

  private getQueryId(query: QueryBase): string {
    const { constructor: queryType } = Object.getPrototypeOf(query);
    const queryMetadata: QueryMetadata = Reflect.getMetadata(
      QUERY_METADATA,
      queryType,
    );
    if (!queryMetadata) {
      throw new QueryHandlerNotFoundException(queryType.name);
    }

    return queryMetadata.id;
  }

  private useDefaultPublisher() {
    this._publisher = new DefaultQueryPubSub<QueryBase>(this.subject$);
  }
}