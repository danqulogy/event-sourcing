import {
	DEFAULT_BATCH_SIZE,
	EventCollection,
	EventEnvelope,
	EventNotFoundException,
	EventStore,
	EventStorePersistenceException,
	type EventStream,
	type IEvent,
	type IEventCollection,
	type IEventFilter,
	type IEventPool,
	StreamReadingDirection,
} from '@ocoda/event-sourcing';
import { type Db, MongoClient } from 'mongodb';
import type { MongoDBEventEntity, MongoDBEventStoreConfig } from './interfaces';

export class MongoDBEventStore extends EventStore<MongoDBEventStoreConfig> {
	private client: MongoClient;
	private database: Db;

	public async connect(): Promise<void> {
		this.logger.log('Starting store');
		const { url, useDefaultPool: _, ...params } = this.options;
		this.client = await new MongoClient(url, params).connect();
		this.database = this.client.db();
	}

	public async disconnect(): Promise<void> {
		this.logger.log('Stopping store');
		await this.client.close();
	}

	public async ensureCollection(pool?: IEventPool): Promise<IEventCollection> {
		const collection = EventCollection.get(pool);

		const [existingCollection] = await this.database.listCollections({ name: collection }).toArray();
		if (!existingCollection) {
			const eventCollection = await this.database.createCollection<MongoDBEventEntity>(collection);
			await eventCollection.createIndex({ streamId: 1, version: 1 }, { unique: true });
		}

		return collection;
	}

	async *getEvents({ streamId }: EventStream, filter?: IEventFilter): AsyncGenerator<IEvent[]> {
		const collection = EventCollection.get(filter?.pool);

		const fromVersion = filter?.fromVersion;
		const direction = filter?.direction || StreamReadingDirection.FORWARD;
		const limit = filter?.limit || Number.MAX_SAFE_INTEGER;
		const batch = filter?.batch || DEFAULT_BATCH_SIZE;

		const cursor = this.database
			.collection<Pick<MongoDBEventEntity, 'event' | 'payload'>>(collection)
			.find(
				{
					streamId,
					...(fromVersion && { version: { $gte: fromVersion } }),
				},
				{
					sort: { version: direction === StreamReadingDirection.FORWARD ? 1 : -1 },
					limit,
					projection: { _id: 0, event: 1, payload: 1 },
				},
			)
			.map(({ event, payload }) => this.eventMap.deserializeEvent(event, payload));

		const entities = [];
		let hasNext: boolean;
		do {
			const entity = await cursor.next();
			hasNext = entity !== null;

			hasNext && entities.push(entity);

			if (entities.length > 0 && (entities.length === batch || !hasNext)) {
				yield entities;
				entities.length = 0;
			}
		} while (hasNext);
	}

	async getEvent({ streamId }: EventStream, version: number, pool?: IEventPool): Promise<IEvent> {
		const collection = EventCollection.get(pool);
		const entity = await this.database.collection<Pick<MongoDBEventEntity, 'event' | 'payload'>>(collection).findOne(
			{
				streamId,
				version,
			},
			{ projection: { _id: 0, event: 1, payload: 1 } },
		);

		if (!entity) {
			throw new EventNotFoundException(streamId, version);
		}

		return this.eventMap.deserializeEvent(entity.event, entity.payload);
	}

	async appendEvents(
		{ streamId, aggregateId }: EventStream,
		aggregateVersion: number,
		events: IEvent[],
		pool?: IEventPool,
	): Promise<EventEnvelope[]> {
		const collection = EventCollection.get(pool);

		try {
			let version = aggregateVersion - events.length + 1;

			const collections = await this.database.listCollections({ name: collection }).toArray();

			if (collections.length === 0) {
				throw new Error(`Collection "${collection}" does not exist.`);
			}

			const envelopes: EventEnvelope[] = [];
			for (const event of events) {
				const name = this.eventMap.getName(event);
				const payload = this.eventMap.serializeEvent(event);
				const envelope = EventEnvelope.create(name, payload, { aggregateId, version: version++ });
				envelopes.push(envelope);
			}

			const entities = envelopes.map<MongoDBEventEntity>(({ event, payload, metadata }) => ({
				_id: metadata.eventId,
				streamId,
				event,
				payload,
				...metadata,
			}));

			await this.database.collection<MongoDBEventEntity>(collection).insertMany(entities);

			return envelopes;
		} catch (error) {
			throw new EventStorePersistenceException(collection, error);
		}
	}

	async *getEnvelopes({ streamId }: EventStream, filter?: IEventFilter): AsyncGenerator<EventEnvelope[]> {
		const collection = EventCollection.get(filter?.pool);

		const fromVersion = filter?.fromVersion;
		const direction = filter?.direction || StreamReadingDirection.FORWARD;
		const limit = filter?.limit || Number.MAX_SAFE_INTEGER;
		const batch = filter?.batch || DEFAULT_BATCH_SIZE;

		const cursor = this.database
			.collection<
				Pick<
					MongoDBEventEntity,
					'event' | 'payload' | 'eventId' | 'aggregateId' | 'version' | 'occurredOn' | 'correlationId' | 'causationId'
				>
			>(collection)
			.find(
				{
					streamId,
					...(fromVersion && { version: { $gte: fromVersion } }),
				},
				{
					sort: { version: direction === StreamReadingDirection.FORWARD ? 1 : -1 },
					limit,
					projection: {
						_id: 0,
						event: 1,
						payload: 1,
						eventId: 1,
						aggregateId: 1,
						version: 1,
						occurredOn: 1,
						correlationId: 1,
						causationId: 1,
					},
				},
			)
			.map(({ event, payload, eventId, aggregateId, version, occurredOn, correlationId, causationId }) =>
				EventEnvelope.from(event, payload, {
					eventId,
					aggregateId,
					version,
					occurredOn,
					correlationId,
					causationId,
				}),
			);

		const entities = [];
		let hasNext: boolean;
		do {
			const entity = await cursor.next();
			hasNext = entity !== null;

			hasNext && entities.push(entity);

			if (entities.length > 0 && (entities.length === batch || !hasNext)) {
				yield entities;
				entities.length = 0;
			}
		} while (hasNext);
	}

	async getEnvelope({ streamId }: EventStream, version: number, pool?: IEventPool): Promise<EventEnvelope> {
		const collection = EventCollection.get(pool);

		const entity = await this.database
			.collection<
				Pick<
					MongoDBEventEntity,
					'event' | 'payload' | 'eventId' | 'aggregateId' | 'version' | 'occurredOn' | 'correlationId' | 'causationId'
				>
			>(collection)
			.findOne(
				{
					streamId,
					version,
				},
				{
					projection: {
						_id: 0,
						event: 1,
						payload: 1,
						eventId: 1,
						aggregateId: 1,
						version: 1,
						occurredOn: 1,
						correlationId: 1,
						causationId: 1,
					},
				},
			);

		if (!entity) {
			throw new EventNotFoundException(streamId, version);
		}

		return EventEnvelope.from(entity.event, entity.payload, {
			eventId: entity.eventId,
			aggregateId: entity.aggregateId,
			version: entity.version,
			occurredOn: entity.occurredOn,
			correlationId: entity.correlationId,
			causationId: entity.causationId,
		});
	}
}
