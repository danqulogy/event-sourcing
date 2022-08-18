import { randomUUID } from 'crypto';
import { Id } from './id';
import { EventEnvelopeMetadata } from './interfaces';

export class EventEnvelope {
  public readonly eventId: string;
  public readonly eventName: string;
  readonly payload: unknown;
  readonly metadata: EventEnvelopeMetadata;

  private constructor(
    aggregateId: string,
    sequence: number,
    eventName: string,
    payload: unknown,
  ) {
    this.eventId = randomUUID();
    this.eventName = eventName;
    this.payload = payload;
    this.metadata = { aggregateId, sequence, occurredOn: Date.now() };
  }

  static new(
    aggregateId: Id,
    sequence: number,
    eventName: string,
    payload: unknown,
  ): EventEnvelope {
    return new EventEnvelope(aggregateId.value, sequence, eventName, payload);
  }
}
