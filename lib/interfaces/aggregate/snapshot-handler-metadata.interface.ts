import { Type } from '@nestjs/common';
import { Aggregate } from '../../models';

/**
 * `@Snapshot` decorator metadata
 */
export interface SnapshotMetadata<A extends Aggregate> {
	/**
	 * The aggregate type of the snapshot.
	 */
	aggregate: Type<A>;
	/**
	 * Per how many events a snapshot should be taken.
	 */
	interval?: number;
}
