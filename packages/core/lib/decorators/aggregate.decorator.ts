import { Type } from '@nestjs/common';
import 'reflect-metadata';
import { InvalidAggregateStreamNameError } from '../exceptions';
import { AggregateMetadata } from '../interfaces';
import { AggregateRoot } from '../models';
import { AGGREGATE_METADATA } from './constants';

/**
 * Decorator that provides an aggregate with metadata.
 *
 * The decorated class must extend the `AggregateRoot` class.
 */
export const Aggregate = (options?: AggregateMetadata): ClassDecorator => {
	return (target: object) => {
		const { name } = target as Type<AggregateRoot>;
		const metadata: AggregateMetadata = { streamName: name.toLowerCase(), ...options };

		if (metadata.streamName.length > 50) {
			throw InvalidAggregateStreamNameError.becauseExceedsMaxLength(name, 50);
		}

		Reflect.defineMetadata(AGGREGATE_METADATA, metadata, target);
	};
};
