import type { EventEnvelopeMetadata, IEvent, IEventPayload } from '../interfaces';
import { EventId } from './event-id';

export class EventEnvelope<E extends IEvent = IEvent> {
	private constructor(
		public readonly event: string,
		readonly payload: IEventPayload<E>,
		readonly metadata: EventEnvelopeMetadata,
	) {}

	static create<E extends IEvent = IEvent>(
		event: string,
		payload: IEventPayload<E>,
		metadata: Omit<EventEnvelopeMetadata, 'eventId' | 'occurredOn'> & {
			eventId?: EventId;
		},
	): EventEnvelope<E> {
		const eventId = metadata.eventId || EventId.generate();
		return new EventEnvelope<E>(event, payload, {
			eventId: eventId,
			occurredOn: eventId.date,
			...metadata,
		});
	}

	static from<E extends IEvent = IEvent>(
		event: string,
		payload: IEventPayload<E>,
		metadata: EventEnvelopeMetadata,
	): EventEnvelope<E> {
		return new EventEnvelope<E>(event, payload, metadata);
	}
}
