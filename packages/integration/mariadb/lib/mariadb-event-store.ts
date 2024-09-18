import {
	DEFAULT_BATCH_SIZE,
	EventCollection,
	EventEnvelope,
	EventFilter,
	EventNotFoundException,
	EventStore,
	EventStream,
	IEvent,
	IEventCollection,
	IEventPool,
	StreamReadingDirection,
} from '@ocoda/event-sourcing';
import { Pool, createPool } from 'mariadb';
import { MariaDBEventEntity, MariaDBEventStoreConfig } from './interfaces';

export class MariaDBEventStore extends EventStore<MariaDBEventStoreConfig> {
	private pool: Pool;

	async start(): Promise<IEventCollection> {
		this.logger.log('Starting store');
		const { pool, ...params } = this.options;

		this.pool = createPool(params);

		const collection = EventCollection.get(pool);

		await this.pool.query(
			`CREATE TABLE IF NOT EXISTS \`${collection}\` (
                stream_id VARCHAR(255) NOT NULL,
                version INT NOT NULL,
                event VARCHAR(255) NOT NULL,
                payload JSON NOT NULL,
                event_id VARCHAR(255) NOT NULL,
                aggregate_id VARCHAR(255) NOT NULL,
                occurred_on TIMESTAMP NOT NULL,
                correlation_id VARCHAR(255),
                causation_id VARCHAR(255),
                PRIMARY KEY (stream_id, version)
            )`,
		);

		return collection;
	}

	async stop(): Promise<void> {
		this.logger.log('Stopping store');
		await this.pool.end();
	}

	async *getEvents({ streamId }: EventStream, filter?: EventFilter): AsyncGenerator<IEvent[]> {
		const connection = this.pool.getConnection();
		const collection = EventCollection.get(filter?.pool);

		const fromVersion = filter?.fromVersion;
		const direction = filter?.direction || StreamReadingDirection.FORWARD;
		const limit = filter?.limit || Number.MAX_SAFE_INTEGER;
		const batch = filter?.batch || DEFAULT_BATCH_SIZE;

		const query = `
            SELECT event, payload
            FROM \`${collection}\`
            WHERE stream_id = ?
            ${fromVersion ? 'AND version >= ?' : ''}
            ORDER BY version ${direction === StreamReadingDirection.FORWARD ? 'ASC' : 'DESC'}
            LIMIT ?
        `;

		const params = fromVersion ? [streamId, fromVersion, limit] : [streamId, limit];

		const client = await connection;
		const stream = client.queryStream(query, params);

		try {
			let batchedEvents: IEvent[] = [];
			for await (const { event, payload } of stream as unknown as Pick<MariaDBEventEntity, 'event' | 'payload'>[]) {
				batchedEvents.push(this.eventMap.deserializeEvent(event, payload));
				if (batchedEvents.length === batch) {
					yield batchedEvents;
					batchedEvents = [];
				}
			}
			if (batchedEvents.length > 0) {
				yield batchedEvents;
			}
		} catch (e) {
			stream.destroy();
		} finally {
			await client.release();
		}
	}

	async getEvent({ streamId }: EventStream, version: number, pool?: IEventPool): Promise<IEvent> {
		const collection = EventCollection.get(pool);

		const entities = await this.pool.query<Pick<MariaDBEventEntity, 'event' | 'payload'>[]>(
			`SELECT event, payload FROM \`${collection}\` WHERE stream_id = ? AND version = ?`,
			[streamId, version],
		);
		const entity = entities[0];

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

		let version = aggregateVersion - events.length + 1;

		const envelopes: EventEnvelope[] = [];
		for (const event of events) {
			const name = this.eventMap.getName(event);
			const payload = this.eventMap.serializeEvent(event);
			const envelope = EventEnvelope.create(name, payload, { aggregateId, version: version++ });
			envelopes.push(envelope);
		}

		await this.pool.batch(
			`INSERT INTO \`${collection}\` VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			envelopes.map(({ event, payload, metadata }) => [
				streamId,
				metadata.version,
				event,
				JSON.stringify(payload),
				metadata.eventId,
				metadata.aggregateId,
				metadata.occurredOn,
				metadata.correlationId ?? null,
				metadata.causationId ?? null,
			]),
		);

		return envelopes;
	}

	async *getEnvelopes({ streamId }: EventStream, filter?: EventFilter): AsyncGenerator<EventEnvelope[]> {
		const connection = this.pool.getConnection();
		const collection = EventCollection.get(filter?.pool);

		const fromVersion = filter?.fromVersion;
		const direction = filter?.direction || StreamReadingDirection.FORWARD;
		const limit = filter?.limit || Number.MAX_SAFE_INTEGER;
		const batch = filter?.batch || DEFAULT_BATCH_SIZE;

		const query = `
            SELECT *
            FROM \`${collection}\`
            WHERE stream_id = ?
            ${fromVersion ? 'AND version >= ?' : ''}
            ORDER BY version ${direction === StreamReadingDirection.FORWARD ? 'ASC' : 'DESC'}
            LIMIT ?
        `;

		const params = fromVersion ? [streamId, fromVersion, limit] : [streamId, limit];

		const client = await connection;
		const stream = client.queryStream(query, params);

		try {
			let batchedEvents: EventEnvelope[] = [];
			for await (const {
				event,
				payload,
				event_id,
				aggregate_id,
				version,
				occurred_on,
				correlation_id,
				causation_id,
			} of stream as unknown as MariaDBEventEntity[]) {
				batchedEvents.push(
					EventEnvelope.from(event, payload, {
						eventId: event_id,
						aggregateId: aggregate_id,
						version,
						occurredOn: occurred_on,
						correlationId: correlation_id,
						causationId: causation_id,
					}),
				);
				if (batchedEvents.length === batch) {
					yield batchedEvents;
					batchedEvents = [];
				}
			}
			if (batchedEvents.length > 0) {
				yield batchedEvents;
			}
		} catch (e) {
			stream.destroy();
		} finally {
			await client.release();
		}
	}

	async getEnvelope({ streamId }: EventStream, version: number, pool?: IEventPool): Promise<EventEnvelope> {
		const collection = EventCollection.get(pool);

		const entities = await this.pool.query<MariaDBEventEntity>(
			`SELECT * FROM \`${collection}\` WHERE stream_id = ? AND version = ?`,
			[streamId, version],
		);
		const entity: MariaDBEventEntity = entities[0];

		if (!entity) {
			throw new EventNotFoundException(streamId, version);
		}

		return EventEnvelope.from(entity.event, entity.payload, {
			eventId: entity.event_id,
			aggregateId: entity.aggregate_id,
			version: entity.version,
			occurredOn: entity.occurred_on,
			correlationId: entity.correlation_id,
			causationId: entity.causation_id,
		});
	}
}
