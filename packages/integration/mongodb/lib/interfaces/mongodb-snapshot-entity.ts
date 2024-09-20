import type { AggregateRoot, ISnapshot, SnapshotEnvelopeMetadata } from '@ocoda/event-sourcing';
import type { Document } from 'mongodb';

export type MongoSnapshotEntity<A extends AggregateRoot> = {
	_id: string;
	streamId: string;
	payload: ISnapshot<A>;
	aggregateName: string;
	latest?: string;
} & Document &
	SnapshotEnvelopeMetadata;
